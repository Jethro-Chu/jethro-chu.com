import { MAX_COMPLETION_SECONDS, speedPercentile } from "./timing.ts";

export type PublicAttemptSort =
  | "recent"
  | "highest"
  | "lowest"
  | "fastest"
  | "slowest";

export interface PublicAttempt {
  iqScore: number;
  correctCount: number;
  completionTimeSeconds: number | null;
  speedPercentile: number | null;
  completedAt: string;
}

export interface PublicDistributionBin {
  label: string;
  minimum: number;
  maximum: number | null;
  count: number;
}

export interface PublicPercentileThreshold {
  label: string;
  iqScore: number;
}

export interface PublicTimedPoint {
  pointId: number;
  iqScore: number;
  correctCount: number;
  completionTimeSeconds: number;
  speedPercentile: number | null;
  completedAt: string;
}

export interface PublicIQDataResponse {
  generatedAt: string;
  overview: {
    testsCompleted: number;
    averageIQ: number;
    medianIQ: number;
    highestIQ: number;
    averageCorrect: number;
    percentile25IQ: number;
    percentile75IQ: number;
  };
  iqDistribution: PublicDistributionBin[];
  scoreDistribution: PublicDistributionBin[];
  iqPercentiles: PublicPercentileThreshold[];
  timing: {
    timedTests: number;
    medianSeconds: number;
    averageSeconds: number;
    fastestSeconds: number;
    percentile10Seconds: number;
    percentile25Seconds: number;
    percentile75Seconds: number;
    percentile90Seconds: number;
    distribution: PublicDistributionBin[];
    points: PublicTimedPoint[];
  };
  attempts: PublicAttempt[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalAttempts: number;
  };
  sort: PublicAttemptSort;
}

export interface SanitizedStoredAttempt {
  iqScore: number;
  correctCount: number;
  completedAt: string;
  completionTimeSeconds: number | null;
}

const IQ_RANGES = [
  [32, 49],
  [50, 59],
  [60, 69],
  [70, 79],
  [80, 89],
  [90, 99],
  [100, 109],
  [110, 119],
  [120, 129],
] as const;

const TIME_RANGES = [
  { label: "Under 10 min", minimum: 0, maximum: 10 * 60 - 1 },
  { label: "10–20 min", minimum: 10 * 60, maximum: 20 * 60 - 1 },
  { label: "20–30 min", minimum: 20 * 60, maximum: 30 * 60 - 1 },
  { label: "30–40 min", minimum: 30 * 60, maximum: 40 * 60 - 1 },
  { label: "40–60 min", minimum: 40 * 60, maximum: 60 * 60 - 1 },
  { label: "60–90 min", minimum: 60 * 60, maximum: 90 * 60 - 1 },
  { label: "90+ min", minimum: 90 * 60, maximum: null },
] as const;

function quantile(sortedValues: readonly number[], percentile: number) {
  if (sortedValues.length === 0) return 0;
  const position = (sortedValues.length - 1) * percentile;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sortedValues[lower];
  const fraction = position - lower;
  return Math.round(
    sortedValues[lower] +
      (sortedValues[upper] - sortedValues[lower]) * fraction,
  );
}

function percentileThreshold(sortedScores: readonly number[], percentile: number) {
  return Math.ceil(quantile(sortedScores, percentile));
}

function sortAttempts(
  attempts: readonly SanitizedStoredAttempt[],
  sort: PublicAttemptSort,
) {
  const sorted = [...attempts];
  const recentTieBreak = (a: SanitizedStoredAttempt, b: SanitizedStoredAttempt) =>
    Date.parse(b.completedAt) - Date.parse(a.completedAt) ||
    b.iqScore - a.iqScore ||
    b.correctCount - a.correctCount;

  if (sort === "highest") {
    sorted.sort((a, b) => b.iqScore - a.iqScore || recentTieBreak(a, b));
  } else if (sort === "lowest") {
    sorted.sort((a, b) => a.iqScore - b.iqScore || recentTieBreak(a, b));
  } else if (sort === "fastest") {
    sorted.sort((a, b) => {
      if (a.completionTimeSeconds === null) return 1;
      if (b.completionTimeSeconds === null) return -1;
      return a.completionTimeSeconds - b.completionTimeSeconds || recentTieBreak(a, b);
    });
  } else if (sort === "slowest") {
    sorted.sort((a, b) => {
      if (a.completionTimeSeconds === null) return 1;
      if (b.completionTimeSeconds === null) return -1;
      return b.completionTimeSeconds - a.completionTimeSeconds || recentTieBreak(a, b);
    });
  } else {
    sorted.sort(recentTieBreak);
  }

  return sorted;
}

export function buildPublicIQData(
  storedAttempts: readonly SanitizedStoredAttempt[],
  options: { page?: number; pageSize?: number; sort?: PublicAttemptSort } = {},
): PublicIQDataResponse {
  const validAttempts = storedAttempts.filter(
    (attempt) =>
      Number.isInteger(attempt.iqScore) &&
      attempt.iqScore >= 32 &&
      attempt.iqScore <= 129 &&
      Number.isInteger(attempt.correctCount) &&
      attempt.correctCount >= 0 &&
      attempt.correctCount <= 25 &&
      Number.isFinite(Date.parse(attempt.completedAt)) &&
      (attempt.completionTimeSeconds === null ||
        (Number.isInteger(attempt.completionTimeSeconds) &&
          attempt.completionTimeSeconds >= 0 &&
          attempt.completionTimeSeconds <= MAX_COMPLETION_SECONDS)),
  );
  const scores = validAttempts.map((attempt) => attempt.iqScore).sort((a, b) => a - b);
  const correctCounts = validAttempts.map((attempt) => attempt.correctCount);
  const timedAttempts = validAttempts.filter(
    (attempt): attempt is SanitizedStoredAttempt & { completionTimeSeconds: number } =>
      attempt.completionTimeSeconds !== null,
  );
  const completionTimes = timedAttempts
    .map((attempt) => attempt.completionTimeSeconds)
    .sort((a, b) => a - b);
  const sort = options.sort ?? "recent";
  const pageSize = Math.max(5, Math.min(50, options.pageSize ?? 20));
  const totalPages = Math.max(1, Math.ceil(validAttempts.length / pageSize));
  const page = Math.max(1, Math.min(totalPages, options.page ?? 1));
  const sortedAttempts = sortAttempts(validAttempts, sort);
  const pageAttempts = sortedAttempts.slice((page - 1) * pageSize, page * pageSize);

  return {
    generatedAt: new Date().toISOString(),
    overview: {
      testsCompleted: validAttempts.length,
      averageIQ: validAttempts.length
        ? Number(
            (
              scores.reduce((sum, score) => sum + score, 0) /
              validAttempts.length
            ).toFixed(1),
          )
        : 0,
      medianIQ: quantile(scores, 0.5),
      highestIQ: scores.at(-1) ?? 0,
      averageCorrect: validAttempts.length
        ? Number(
            (
              correctCounts.reduce((sum, score) => sum + score, 0) /
              validAttempts.length
            ).toFixed(1),
          )
        : 0,
      percentile25IQ: quantile(scores, 0.25),
      percentile75IQ: quantile(scores, 0.75),
    },
    iqDistribution: IQ_RANGES.map(([minimum, maximum]) => ({
      label: `${minimum}–${maximum}`,
      minimum,
      maximum,
      count: scores.filter((score) => score >= minimum && score <= maximum).length,
    })),
    scoreDistribution: Array.from({ length: 26 }, (_, score) => ({
      label: `${score}`,
      minimum: score,
      maximum: score,
      count: correctCounts.filter((correct) => correct === score).length,
    })),
    iqPercentiles: [
      { label: "Top 50%", iqScore: percentileThreshold(scores, 0.5) },
      { label: "Top 25%", iqScore: percentileThreshold(scores, 0.75) },
      { label: "Top 10%", iqScore: percentileThreshold(scores, 0.9) },
      { label: "Top 5%", iqScore: percentileThreshold(scores, 0.95) },
    ],
    timing: {
      timedTests: timedAttempts.length,
      medianSeconds: quantile(completionTimes, 0.5),
      averageSeconds: timedAttempts.length
        ? Math.round(
            completionTimes.reduce((sum, seconds) => sum + seconds, 0) /
              timedAttempts.length,
          )
        : 0,
      fastestSeconds: completionTimes[0] ?? 0,
      percentile10Seconds: quantile(completionTimes, 0.1),
      percentile25Seconds: quantile(completionTimes, 0.25),
      percentile75Seconds: quantile(completionTimes, 0.75),
      percentile90Seconds: quantile(completionTimes, 0.9),
      distribution: TIME_RANGES.map(({ label, minimum, maximum }) => ({
        label,
        minimum,
        maximum,
        count: completionTimes.filter(
          (seconds) =>
            seconds >= minimum && (maximum === null || seconds <= maximum),
        ).length,
      })),
      points: [...timedAttempts]
        .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))
        .map((attempt, index) => ({
          pointId: index + 1,
          iqScore: attempt.iqScore,
          correctCount: attempt.correctCount,
          completionTimeSeconds: attempt.completionTimeSeconds,
          speedPercentile: speedPercentile(
            attempt.completionTimeSeconds,
            completionTimes,
          ),
          completedAt: attempt.completedAt,
        })),
    },
    attempts: pageAttempts.map((attempt) => ({
      iqScore: attempt.iqScore,
      correctCount: attempt.correctCount,
      completionTimeSeconds: attempt.completionTimeSeconds,
      speedPercentile:
        attempt.completionTimeSeconds === null
          ? null
          : speedPercentile(attempt.completionTimeSeconds, completionTimes),
      completedAt: attempt.completedAt,
    })),
    pagination: {
      page,
      pageSize,
      totalPages,
      totalAttempts: validAttempts.length,
    },
    sort,
  };
}
