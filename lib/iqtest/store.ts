import type { IQQuestion, QuestionCategory } from "./questions";
import type {
  ParticipantComparison,
  ScoreDistributionBin,
} from "./results";
import type { ScoredAttempt } from "./scoring";

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

local index = 6
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
  version: 1;
  completedAt: string;
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
}: {
  attemptId: string;
  iqScore: number;
  answers: Record<number, string>;
  completionSeconds: number;
  result: ScoredAttempt;
  questions: IQQuestion[];
}) {
  const storedAttempt: StoredAttempt = {
    version: 1,
    completedAt: new Date().toISOString(),
    iqScore,
    correctCount: result.correctCount,
    completionSeconds,
    weightedPerformance: result.weightedPerformance,
    categoryAccuracy: result.categoryAccuracy,
    answers,
  };
  const questionArguments = questions.flatMap((question) => [
    question.id,
    answers[question.id] === question.correctAnswer ? 1 : 0,
  ]);

  const inserted = await redis([
    "EVAL",
    RECORD_ATTEMPT_SCRIPT,
    5,
    ATTEMPTS_KEY,
    META_KEY,
    SCORE_COUNTS_KEY,
    QUESTION_TOTALS_KEY,
    QUESTION_CORRECT_KEY,
    attemptId,
    JSON.stringify(storedAttempt),
    iqScore,
    result.correctCount,
    completionSeconds,
    ...questionArguments,
  ]);

  return Number(inserted) === 1;
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

export async function getIQCalibrationSnapshot(questions: IQQuestion[]) {
  const [metaResult, totalsResult, correctResult] = await Promise.all([
    redis(["HGETALL", META_KEY]),
    redis(["HGETALL", QUESTION_TOTALS_KEY]),
    redis(["HGETALL", QUESTION_CORRECT_KEY]),
  ]);
  const meta = hashFromResult(metaResult);
  const totals = hashFromResult(totalsResult);
  const correct = hashFromResult(correctResult);
  const participantCount = meta.attempt_count ?? 0;

  const questionAccuracy = Object.fromEntries(
    questions.map((question) => {
      const total = totals[String(question.id)] ?? 0;
      return [question.id, total ? (correct[String(question.id)] ?? 0) / total : 0];
    }),
  );

  const categoryAccuracy = Object.fromEntries(
    (["probability", "logic", "patterns", "quantitative", "spatial"] as const).map(
      (category) => {
        const categoryQuestions = questions.filter(
          (question) => question.category === category,
        );
        const categoryTotal = categoryQuestions.reduce(
          (sum, question) => sum + (totals[String(question.id)] ?? 0),
          0,
        );
        const categoryCorrect = categoryQuestions.reduce(
          (sum, question) => sum + (correct[String(question.id)] ?? 0),
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
