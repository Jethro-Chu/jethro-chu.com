import { createHmac, randomUUID } from "node:crypto";
import {
  iqQuestions,
  legacyIQQuestions,
  type IQQuestion,
  type QuestionCategory,
} from "./questions.ts";
import type {
  CompletionTiming,
  ParticipantComparison,
  ScoreDistributionBin,
  TimingAnalytics,
} from "./results.ts";
import type { ScoredAttempt } from "./scoring.ts";
import {
  buildPublicIQData,
  type PublicAttemptSort,
  type PublicIQDataResponse,
  type SanitizedStoredAttempt,
} from "./public-data.ts";
import {
  buildTimingAnalytics,
  type StoredTimedAttempt,
} from "./timing.ts";

const KV_URL =
  process.env.KV_REST_API_URL ??
  process.env.UPSTASH_REDIS_REST_URL ??
  "";
const KV_TOKEN =
  process.env.KV_REST_API_TOKEN ??
  process.env.UPSTASH_REDIS_REST_TOKEN ??
  "";

// The shared hash tag keeps every key in the same Redis cluster slot, which
// lets the idempotent EVAL transaction update all aggregates atomically.
const ATTEMPTS_KEY = "{iqtest}:v1:attempts";
const META_KEY = "{iqtest}:v1:meta";
const SCORE_COUNTS_KEY = "{iqtest}:v1:score-counts";
const QUESTION_TOTALS_KEY = "{iqtest}:v1:question-totals";
const QUESTION_CORRECT_KEY = "{iqtest}:v1:question-correct";
const RANDOMIZED_QUESTION_TOTALS_KEY = "{iqtest}:v2:question-totals";
const RANDOMIZED_QUESTION_CORRECT_KEY = "{iqtest}:v2:question-correct";
const TIMED_ATTEMPTS_KEY = "{iqtest}:v3:timed-attempts";
const MAINTENANCE_KEY = "{iqtest}:v1:maintenance";
const RATE_LIMIT_KEY_PREFIX = "{iqtest}:v1:submission-rate";

const DEFAULT_RATE_LIMIT_MAX = 5;
const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

const SCORE_RANGES = [
  [32, 49],
  [50, 69],
  [70, 84],
  [85, 94],
  [95, 104],
  [105, 114],
  [115, 119],
  [120, 124],
  [125, 129],
] as const;

const RECORD_ATTEMPT_SCRIPT = `
if redis.call("EXISTS", KEYS[7]) == 1 then
  return -1
end

local existing = redis.call("HGET", KEYS[1], ARGV[1])
if existing then
  return 0
end

redis.call("HSET", KEYS[1], ARGV[1], ARGV[2])
redis.call("HINCRBY", KEYS[2], "attempt_count", 1)
redis.call("HINCRBY", KEYS[2], "score_sum", ARGV[3])
redis.call("HINCRBY", KEYS[2], "correct_sum", ARGV[4])
redis.call("HINCRBY", KEYS[2], "completion_seconds_sum", ARGV[5])
redis.call("HINCRBY", KEYS[3], ARGV[3], 1)

if ARGV[6] ~= "" then
  redis.call("HSET", KEYS[6], ARGV[1], ARGV[6])
end

local index = 7
while index <= #ARGV do
  local question_id = ARGV[index]
  local is_correct = tonumber(ARGV[index + 1])
  redis.call("HINCRBY", KEYS[4], question_id, 1)
  if is_correct == 1 then
    redis.call("HINCRBY", KEYS[5], question_id, 1)
  end
  index = index + 2
end

return 1
`;

const RATE_LIMIT_SCRIPT = `
local count = redis.call("INCR", KEYS[1])
if count == 1 then
  redis.call("EXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("TTL", KEYS[1])
return {count, ttl}
`;

const REBUILD_AGGREGATES_SCRIPT = `
if redis.call("GET", KEYS[9]) ~= ARGV[1] then
  return -1
end

local attempt_ids = cjson.decode(ARGV[2])
for _, attempt_id in ipairs(attempt_ids) do
  redis.call("HDEL", KEYS[1], attempt_id)
end

for index = 2, 8 do
  redis.call("DEL", KEYS[index])
end

local function restore_hash(key, serialized)
  local values = cjson.decode(serialized)
  for field, value in pairs(values) do
    redis.call("HSET", key, field, value)
  end
end

restore_hash(KEYS[2], ARGV[3])
restore_hash(KEYS[3], ARGV[4])
restore_hash(KEYS[4], ARGV[5])
restore_hash(KEYS[5], ARGV[6])
restore_hash(KEYS[6], ARGV[7])
restore_hash(KEYS[7], ARGV[8])
restore_hash(KEYS[8], ARGV[9])

return #attempt_ids
`;

const RELEASE_MAINTENANCE_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
end
return 0
`;

export interface StoredAttempt {
  version: 1 | 2 | 3;
  testVersion?: 2;
  selectedQuestionIds?: string[];
  timingVersion?: 1;
  startedAt?: string;
  completedAt: string;
  completionTimeSeconds?: number;
  iqScore: number;
  correctCount: number;
  completionSeconds: number;
  weightedPerformance: number;
  categoryAccuracy: Record<QuestionCategory, number>;
  answers: Record<number, string>;
}

export interface IQAdminAttempt {
  attemptId: string;
  completedAt: string;
  iqScore: number;
  correctCount: number;
  completionTimeSeconds: number;
  testVersion: 1 | 2;
  questionCount: number;
}

export interface IQAggregateState {
  meta: Record<string, number>;
  scoreCounts: Record<string, number>;
  questionTotals: Record<string, number>;
  questionCorrect: Record<string, number>;
  randomizedQuestionTotals: Record<string, number>;
  randomizedQuestionCorrect: Record<string, number>;
  timedAttempts: Record<string, string>;
}

let publicAttemptsCache:
  | { expiresAt: number; attempts: SanitizedStoredAttempt[] }
  | null = null;
let publicAttemptsPromise: Promise<SanitizedStoredAttempt[]> | null = null;

export function hasIQResultsStore() {
  return Boolean(KV_URL && KV_TOKEN);
}

async function redis(command: Array<string | number>): Promise<unknown> {
  if (!hasIQResultsStore()) throw new Error("IQ results store is not configured");

  const response = await fetch(KV_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
    signal: AbortSignal.timeout(6000),
  });

  if (!response.ok) throw new Error(`IQ results store returned ${response.status}`);
  const payload = (await response.json()) as {
    result?: unknown;
    error?: string;
  };
  if (payload.error) throw new Error(payload.error);
  return payload.result;
}

function positiveIntegerFromEnv(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function getIQSubmissionRateLimitConfig() {
  return {
    limit: positiveIntegerFromEnv(
      process.env.IQ_RATE_LIMIT_MAX,
      DEFAULT_RATE_LIMIT_MAX,
    ),
    windowSeconds: positiveIntegerFromEnv(
      process.env.IQ_RATE_LIMIT_WINDOW_SECONDS,
      DEFAULT_RATE_LIMIT_WINDOW_SECONDS,
    ),
  };
}

export async function hasRecordedIQAttempt(attemptId: string) {
  return Number(await redis(["HEXISTS", ATTEMPTS_KEY, attemptId])) === 1;
}

export async function consumeIQSubmissionRateLimit(clientIdentifier: string) {
  const { limit, windowSeconds } = getIQSubmissionRateLimitConfig();
  const secret = process.env.IQ_RATE_LIMIT_SECRET ?? KV_TOKEN;
  const identifierHash = createHmac("sha256", secret)
    .update(clientIdentifier)
    .digest("hex")
    .slice(0, 32);
  const result = (await redis([
    "EVAL",
    RATE_LIMIT_SCRIPT,
    1,
    `${RATE_LIMIT_KEY_PREFIX}:${identifierHash}`,
    windowSeconds,
  ])) as unknown[];
  const count = Number(result?.[0]) || 0;
  const retryAfterSeconds = Math.max(1, Number(result?.[1]) || windowSeconds);

  return {
    allowed: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    retryAfterSeconds,
  };
}

function hashFromResult(result: unknown): Record<string, number> {
  if (!result) return {};
  if (!Array.isArray(result) && typeof result === "object") {
    return Object.fromEntries(
      Object.entries(result).map(([key, value]) => [key, Number(value) || 0]),
    );
  }
  if (!Array.isArray(result)) return {};

  const parsed: Record<string, number> = {};
  for (let index = 0; index < result.length; index += 2) {
    parsed[String(result[index])] = Number(result[index + 1]) || 0;
  }
  return parsed;
}

function stringHashFromResult(result: unknown): Record<string, string> {
  if (!result) return {};
  if (!Array.isArray(result) && typeof result === "object") {
    return Object.fromEntries(
      Object.entries(result).map(([key, value]) => [key, String(value)]),
    );
  }
  if (!Array.isArray(result)) return {};

  const parsed: Record<string, string> = {};
  for (let index = 0; index < result.length; index += 2) {
    parsed[String(result[index])] = String(result[index + 1]);
  }
  return parsed;
}

function parseStoredAttempt(attemptId: string, value: string): StoredAttempt {
  let attempt: Partial<StoredAttempt>;
  try {
    attempt = JSON.parse(value) as Partial<StoredAttempt>;
  } catch {
    throw new Error(`IQ attempt ${attemptId} contains invalid JSON`);
  }

  if (
    (attempt.version !== 1 && attempt.version !== 2 && attempt.version !== 3) ||
    typeof attempt.completedAt !== "string" ||
    !Number.isFinite(Date.parse(attempt.completedAt)) ||
    !Number.isInteger(attempt.iqScore) ||
    !Number.isInteger(attempt.correctCount) ||
    !Number.isInteger(attempt.completionSeconds) ||
    !attempt.answers ||
    typeof attempt.answers !== "object" ||
    Array.isArray(attempt.answers)
  ) {
    throw new Error(`IQ attempt ${attemptId} has an invalid stored shape`);
  }

  return attempt as StoredAttempt;
}

function increment(target: Record<string, number>, field: string, amount = 1) {
  target[field] = (target[field] ?? 0) + amount;
}

export function buildIQAggregateState(
  entries: Array<{ attemptId: string; attempt: StoredAttempt }>,
): IQAggregateState {
  const state: IQAggregateState = {
    meta: {
      attempt_count: 0,
      score_sum: 0,
      correct_sum: 0,
      completion_seconds_sum: 0,
    },
    scoreCounts: {},
    questionTotals: {},
    questionCorrect: {},
    randomizedQuestionTotals: {},
    randomizedQuestionCorrect: {},
    timedAttempts: {},
  };
  const randomizedQuestions = new Map<string, IQQuestion>(
    iqQuestions.map((question) => [question.stableId, question]),
  );

  for (const { attemptId, attempt } of entries) {
    const completionSeconds =
      attempt.version === 3 && Number.isInteger(attempt.completionTimeSeconds)
        ? (attempt.completionTimeSeconds as number)
        : attempt.completionSeconds;
    increment(state.meta, "attempt_count");
    increment(state.meta, "score_sum", attempt.iqScore);
    increment(state.meta, "correct_sum", attempt.correctCount);
    increment(state.meta, "completion_seconds_sum", completionSeconds);
    increment(state.scoreCounts, String(attempt.iqScore));

    if (attempt.testVersion === 2) {
      if (!Array.isArray(attempt.selectedQuestionIds)) {
        throw new Error(`Randomized IQ attempt ${attemptId} has no question list`);
      }
      for (const stableId of attempt.selectedQuestionIds) {
        const question = randomizedQuestions.get(stableId);
        if (!question) {
          throw new Error(
            `Randomized IQ attempt ${attemptId} references unknown question ${stableId}`,
          );
        }
        increment(state.randomizedQuestionTotals, stableId);
        if (attempt.answers[question.id] === question.correctAnswer) {
          increment(state.randomizedQuestionCorrect, stableId);
        }
      }
    } else {
      for (const question of legacyIQQuestions) {
        const questionId = String(question.id);
        increment(state.questionTotals, questionId);
        if (attempt.answers[question.id] === question.correctAnswer) {
          increment(state.questionCorrect, questionId);
        }
      }
    }

    if (
      attempt.version === 3 &&
      attempt.timingVersion === 1 &&
      Number.isInteger(attempt.completionTimeSeconds)
    ) {
      state.timedAttempts[attemptId] = JSON.stringify({
        iqScore: attempt.iqScore,
        correctCount: attempt.correctCount,
        completionTimeSeconds: attempt.completionTimeSeconds,
        completedAt: attempt.completedAt,
      });
    }
  }

  return state;
}

function adminAttempt(
  attemptId: string,
  attempt: StoredAttempt,
): IQAdminAttempt {
  return {
    attemptId,
    completedAt: new Date(attempt.completedAt).toISOString(),
    iqScore: attempt.iqScore,
    correctCount: attempt.correctCount,
    completionTimeSeconds:
      attempt.version === 3 && Number.isInteger(attempt.completionTimeSeconds)
        ? (attempt.completionTimeSeconds as number)
        : attempt.completionSeconds,
    testVersion: attempt.testVersion === 2 ? 2 : 1,
    questionCount:
      attempt.testVersion === 2 && Array.isArray(attempt.selectedQuestionIds)
        ? attempt.selectedQuestionIds.length
        : legacyIQQuestions.length,
  };
}

export async function listIQAttemptsForAdmin(): Promise<IQAdminAttempt[]> {
  const stored = stringHashFromResult(await redis(["HGETALL", ATTEMPTS_KEY]));
  return Object.entries(stored)
    .map(([attemptId, value]) =>
      adminAttempt(attemptId, parseStoredAttempt(attemptId, value)),
    )
    .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt));
}

export async function deleteIQAttemptsAndRebuild(attemptIds: string[]) {
  const requestedIds = [...new Set(attemptIds)];
  if (requestedIds.length === 0) {
    throw new Error("At least one IQ attempt ID is required");
  }

  const maintenanceToken = randomUUID();
  const lockResult = await redis([
    "SET",
    MAINTENANCE_KEY,
    maintenanceToken,
    "NX",
    "EX",
    120,
  ]);
  if (lockResult !== "OK") {
    throw new Error("Another IQ results maintenance operation is already running");
  }

  try {
    const stored = stringHashFromResult(await redis(["HGETALL", ATTEMPTS_KEY]));
    const requested = new Set(requestedIds);
    const foundIds = requestedIds.filter((attemptId) => attemptId in stored);
    const remainingEntries = Object.entries(stored)
      .filter(([attemptId]) => !requested.has(attemptId))
      .map(([attemptId, value]) => ({
        attemptId,
        attempt: parseStoredAttempt(attemptId, value),
      }));
    const aggregateState = buildIQAggregateState(remainingEntries);

    const rebuilt = await redis([
      "EVAL",
      REBUILD_AGGREGATES_SCRIPT,
      9,
      ATTEMPTS_KEY,
      META_KEY,
      SCORE_COUNTS_KEY,
      QUESTION_TOTALS_KEY,
      QUESTION_CORRECT_KEY,
      RANDOMIZED_QUESTION_TOTALS_KEY,
      RANDOMIZED_QUESTION_CORRECT_KEY,
      TIMED_ATTEMPTS_KEY,
      MAINTENANCE_KEY,
      maintenanceToken,
      JSON.stringify(foundIds),
      JSON.stringify(aggregateState.meta),
      JSON.stringify(aggregateState.scoreCounts),
      JSON.stringify(aggregateState.questionTotals),
      JSON.stringify(aggregateState.questionCorrect),
      JSON.stringify(aggregateState.randomizedQuestionTotals),
      JSON.stringify(aggregateState.randomizedQuestionCorrect),
      JSON.stringify(aggregateState.timedAttempts),
    ]);
    if (Number(rebuilt) === -1) {
      throw new Error("IQ results maintenance lock expired before the rebuild");
    }

    publicAttemptsCache = null;
    return {
      deleted: Number(rebuilt),
      notFound: requestedIds.filter((attemptId) => !(attemptId in stored)),
      remaining: remainingEntries.length,
    };
  } finally {
    await redis([
      "EVAL",
      RELEASE_MAINTENANCE_SCRIPT,
      1,
      MAINTENANCE_KEY,
      maintenanceToken,
    ]).catch(() => undefined);
  }
}

function medianFromCounts(counts: Record<string, number>, total: number) {
  if (total <= 0) return 0;
  const lowerPosition = Math.floor((total - 1) / 2) + 1;
  const upperPosition = Math.floor(total / 2) + 1;
  let cumulative = 0;
  let lowerScore: number | null = null;
  let upperScore = 32;

  for (let score = 32; score <= 129; score += 1) {
    cumulative += counts[String(score)] ?? 0;
    if (cumulative >= lowerPosition && lowerScore === null) lowerScore = score;
    if (cumulative >= upperPosition) {
      upperScore = score;
      break;
    }
  }

  return Math.round(((lowerScore ?? upperScore) + upperScore) / 2);
}

export async function recordIQAttempt({
  attemptId,
  iqScore,
  answers,
  completionSeconds,
  result,
  questions,
  testVersion = 1,
  timing,
}: {
  attemptId: string;
  iqScore: number;
  answers: Record<number, string>;
  completionSeconds: number;
  result: ScoredAttempt;
  questions: IQQuestion[];
  testVersion?: number;
  timing?: CompletionTiming;
}) {
  const storedAttempt: StoredAttempt = {
    version: timing ? 3 : testVersion === 2 ? 2 : 1,
    ...(testVersion === 2
      ? {
          testVersion: 2 as const,
          selectedQuestionIds: questions.map((question) => question.stableId),
        }
      : {}),
    ...(timing
      ? {
          timingVersion: timing.timingVersion,
          startedAt: timing.startedAt,
          completionTimeSeconds: timing.completionTimeSeconds,
        }
      : {}),
    completedAt: timing?.completedAt ?? new Date().toISOString(),
    iqScore,
    correctCount: result.correctCount,
    completionSeconds,
    weightedPerformance: result.weightedPerformance,
    categoryAccuracy: result.categoryAccuracy,
    answers,
  };
  const questionArguments = questions.flatMap((question) => [
    testVersion === 2 ? question.stableId : question.id,
    answers[question.id] === question.correctAnswer ? 1 : 0,
  ]);
  const timedAttempt = timing
    ? JSON.stringify({
        iqScore,
        correctCount: result.correctCount,
        completionTimeSeconds: timing.completionTimeSeconds,
        completedAt: timing.completedAt,
      })
    : "";

  const inserted = await redis([
    "EVAL",
    RECORD_ATTEMPT_SCRIPT,
    7,
    ATTEMPTS_KEY,
    META_KEY,
    SCORE_COUNTS_KEY,
    testVersion === 2 ? RANDOMIZED_QUESTION_TOTALS_KEY : QUESTION_TOTALS_KEY,
    testVersion === 2 ? RANDOMIZED_QUESTION_CORRECT_KEY : QUESTION_CORRECT_KEY,
    TIMED_ATTEMPTS_KEY,
    MAINTENANCE_KEY,
    attemptId,
    JSON.stringify(storedAttempt),
    iqScore,
    result.correctCount,
    timing?.completionTimeSeconds ?? completionSeconds,
    timedAttempt,
    ...questionArguments,
  ]);

  if (Number(inserted) === -1) {
    throw new Error("IQ results maintenance is in progress");
  }
  if (Number(inserted) === 1) publicAttemptsCache = null;

  return Number(inserted) === 1;
}

function sanitizedAttempt(value: string): SanitizedStoredAttempt | null {
  try {
    const attempt = JSON.parse(value) as Partial<StoredAttempt>;
    if (
      !Number.isInteger(attempt.iqScore) ||
      !Number.isInteger(attempt.correctCount) ||
      typeof attempt.completedAt !== "string" ||
      !Number.isFinite(Date.parse(attempt.completedAt))
    ) {
      return null;
    }

    let completionTimeSeconds: number | null = null;
    if (
      attempt.version === 3 &&
      attempt.timingVersion === 1 &&
      typeof attempt.startedAt === "string" &&
      Number.isInteger(attempt.completionTimeSeconds)
    ) {
      const startedAtMs = Date.parse(attempt.startedAt);
      const completedAtMs = Date.parse(attempt.completedAt);
      const elapsedSeconds = Math.floor((completedAtMs - startedAtMs) / 1000);
      if (
        Number.isFinite(startedAtMs) &&
        elapsedSeconds === attempt.completionTimeSeconds
      ) {
        completionTimeSeconds = attempt.completionTimeSeconds;
      }
    }

    return {
      iqScore: attempt.iqScore as number,
      correctCount: attempt.correctCount as number,
      completedAt: new Date(attempt.completedAt).toISOString().slice(0, 10),
      completionTimeSeconds,
    };
  } catch {
    return null;
  }
}

async function loadSanitizedPublicAttempts() {
  if (publicAttemptsCache && publicAttemptsCache.expiresAt > Date.now()) {
    return publicAttemptsCache.attempts;
  }
  if (publicAttemptsPromise) return publicAttemptsPromise;

  publicAttemptsPromise = (async () => {
    const stored = stringHashFromResult(await redis(["HGETALL", ATTEMPTS_KEY]));
    const attempts = Object.values(stored).flatMap((value) => {
      const attempt = sanitizedAttempt(value);
      return attempt ? [attempt] : [];
    });
    publicAttemptsCache = {
      expiresAt: Date.now() + 60_000,
      attempts,
    };
    return attempts;
  })();

  try {
    return await publicAttemptsPromise;
  } finally {
    publicAttemptsPromise = null;
  }
}

export async function getPublicIQData(options: {
  page?: number;
  pageSize?: number;
  sort?: PublicAttemptSort;
} = {}): Promise<PublicIQDataResponse> {
  return buildPublicIQData(await loadSanitizedPublicAttempts(), options);
}

export async function getTimingAnalytics(
  currentAttemptId?: string,
): Promise<TimingAnalytics> {
  const stored = stringHashFromResult(
    await redis(["HGETALL", TIMED_ATTEMPTS_KEY]),
  );
  const attempts: StoredTimedAttempt[] = [];

  for (const [attemptId, serialized] of Object.entries(stored)) {
    try {
      const parsed = JSON.parse(serialized) as Omit<
        StoredTimedAttempt,
        "attemptId"
      >;
      attempts.push({ ...parsed, attemptId });
    } catch {
      // Ignore a malformed future timing row without affecting IQ analytics.
    }
  }

  return buildTimingAnalytics(attempts, currentAttemptId);
}

export async function getParticipantComparison(
  userScore: number,
): Promise<ParticipantComparison> {
  const [metaResult, scoreResult] = await Promise.all([
    redis(["HGETALL", META_KEY]),
    redis(["HGETALL", SCORE_COUNTS_KEY]),
  ]);
  const meta = hashFromResult(metaResult);
  const counts = hashFromResult(scoreResult);
  const participantCount = meta.attempt_count ?? 0;

  const scoreDistribution: ScoreDistributionBin[] = SCORE_RANGES.map(
    ([minimum, maximum]) => {
      let count = 0;
      for (let score = minimum; score <= maximum; score += 1) {
        count += counts[String(score)] ?? 0;
      }
      return {
        label: `${minimum}–${maximum}`,
        minimum,
        maximum,
        count,
      };
    },
  );

  let lowerScores = 0;
  for (let score = 32; score < userScore; score += 1) {
    lowerScores += counts[String(score)] ?? 0;
  }

  return {
    participantCount,
    medianScore: medianFromCounts(counts, participantCount),
    higherThanPercent:
      participantCount >= 5
        ? Math.round((lowerScores / participantCount) * 100)
        : null,
    scoreDistribution,
  };
}

export async function getIQCalibrationSnapshot(
  questions: IQQuestion[],
  testVersion = 1,
) {
  const totalsKey =
    testVersion === 2 ? RANDOMIZED_QUESTION_TOTALS_KEY : QUESTION_TOTALS_KEY;
  const correctKey =
    testVersion === 2 ? RANDOMIZED_QUESTION_CORRECT_KEY : QUESTION_CORRECT_KEY;
  const [metaResult, totalsResult, correctResult] = await Promise.all([
    redis(["HGETALL", META_KEY]),
    redis(["HGETALL", totalsKey]),
    redis(["HGETALL", correctKey]),
  ]);
  const meta = hashFromResult(metaResult);
  const totals = hashFromResult(totalsResult);
  const correct = hashFromResult(correctResult);
  const participantCount = meta.attempt_count ?? 0;

  const questionAccuracy = Object.fromEntries(
    questions.map((question) => {
      const questionKey =
        testVersion === 2 ? question.stableId : String(question.id);
      const total = totals[questionKey] ?? 0;
      return [questionKey, total ? (correct[questionKey] ?? 0) / total : 0];
    }),
  );

  const categoryAccuracy = Object.fromEntries(
    (["probability", "logic", "patterns", "quantitative", "spatial"] as const).map(
      (category) => {
        const categoryQuestions = questions.filter(
          (question) => question.category === category,
        );
        const categoryTotal = categoryQuestions.reduce(
          (sum, question) =>
            sum +
            (totals[
              testVersion === 2 ? question.stableId : String(question.id)
            ] ?? 0),
          0,
        );
        const categoryCorrect = categoryQuestions.reduce(
          (sum, question) =>
            sum +
            (correct[
              testVersion === 2 ? question.stableId : String(question.id)
            ] ?? 0),
          0,
        );
        return [category, categoryTotal ? categoryCorrect / categoryTotal : 0];
      },
    ),
  );

  return {
    participantCount,
    averageScore: participantCount ? (meta.score_sum ?? 0) / participantCount : 0,
    averageCorrect: participantCount
      ? (meta.correct_sum ?? 0) / participantCount
      : 0,
    averageCompletionSeconds: participantCount
      ? (meta.completion_seconds_sum ?? 0) / participantCount
      : 0,
    questionAccuracy,
    categoryAccuracy,
  };
}
