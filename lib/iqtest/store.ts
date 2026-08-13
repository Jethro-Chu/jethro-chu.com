import type { IQQuestion, QuestionCategory } from "./questions";
import type {
  CompletionTiming,
  ParticipantComparison,
  ScoreDistributionBin,
  TimingAnalytics,
} from "./results";
import type { ScoredAttempt } from "./scoring";
import {
  buildTimingAnalytics,
  type StoredTimedAttempt,
} from "./timing";

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

interface StoredAttempt {
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
    6,
    ATTEMPTS_KEY,
    META_KEY,
    SCORE_COUNTS_KEY,
    testVersion === 2 ? RANDOMIZED_QUESTION_TOTALS_KEY : QUESTION_TOTALS_KEY,
    testVersion === 2 ? RANDOMIZED_QUESTION_CORRECT_KEY : QUESTION_CORRECT_KEY,
    TIMED_ATTEMPTS_KEY,
    attemptId,
    JSON.stringify(storedAttempt),
    iqScore,
    result.correctCount,
    timing?.completionTimeSeconds ?? completionSeconds,
    timedAttempt,
    ...questionArguments,
  ]);

  return Number(inserted) === 1;
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
