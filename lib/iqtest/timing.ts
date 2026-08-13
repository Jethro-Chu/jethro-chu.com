import type {
  CompletionTiming,
  TimedAttemptPoint,
  TimingAnalytics,
} from "./results";

export const TIMING_VERSION = 1;
export const MIN_TIMED_SAMPLE_FOR_PERCENTILE = 25;
export const MAX_COMPLETION_SECONDS = 6 * 60 * 60;

interface TimingSubmissionLike {
  timingVersion?: number;
  startedAt?: string;
  completedAt?: string;
  completionTimeSeconds?: number;
  completionSeconds: number;
}

export interface StoredTimedAttempt {
  attemptId: string;
  iqScore: number;
  correctCount: number;
  completionTimeSeconds: number;
  completedAt: string;
}

function validTimestamp(value: string | undefined) {
  if (typeof value !== "string") return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function validateCompletionTiming(
  submission: TimingSubmissionLike,
  receivedAtMs = Date.now(),
): CompletionTiming | null {
  if (submission.timingVersion !== TIMING_VERSION) return null;

  const startedAtMs = validTimestamp(submission.startedAt);
  const clientCompletedAtMs = validTimestamp(submission.completedAt);
  if (startedAtMs === null || clientCompletedAtMs === null) return null;
  if (clientCompletedAtMs < startedAtMs) return null;
  if (clientCompletedAtMs > receivedAtMs + 60_000) return null;
  if (
    receivedAtMs - clientCompletedAtMs >
    (MAX_COMPLETION_SECONDS + 5 * 60) * 1000
  ) {
    return null;
  }

  const clientSeconds = Math.floor((clientCompletedAtMs - startedAtMs) / 1000);
  if (
    !Number.isInteger(submission.completionTimeSeconds) ||
    submission.completionTimeSeconds !== clientSeconds ||
    Math.abs(submission.completionSeconds - clientSeconds) > 1
  ) {
    return null;
  }

  if (clientSeconds < 0 || clientSeconds > MAX_COMPLETION_SECONDS) {
    return null;
  }

  return {
    timingVersion: TIMING_VERSION,
    startedAt: new Date(startedAtMs).toISOString(),
    completedAt: new Date(clientCompletedAtMs).toISOString(),
    completionTimeSeconds: clientSeconds,
  };
}

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

export function speedPercentile(
  completionTimeSeconds: number,
  allCompletionTimes: readonly number[],
) {
  if (allCompletionTimes.length < MIN_TIMED_SAMPLE_FOR_PERCENTILE) return null;
  const slowerAttempts = allCompletionTimes.filter(
    (seconds) => seconds > completionTimeSeconds,
  ).length;
  return Math.round((slowerAttempts / allCompletionTimes.length) * 100);
}

export function buildTimingAnalytics(
  storedAttempts: readonly StoredTimedAttempt[],
  currentAttemptId?: string,
): TimingAnalytics {
  const validAttempts = storedAttempts.filter(
    (attempt) =>
      Number.isInteger(attempt.iqScore) &&
      attempt.iqScore >= 32 &&
      attempt.iqScore <= 129 &&
      Number.isInteger(attempt.correctCount) &&
      attempt.correctCount >= 0 &&
      attempt.correctCount <= 25 &&
      Number.isInteger(attempt.completionTimeSeconds) &&
      attempt.completionTimeSeconds >= 0 &&
      attempt.completionTimeSeconds <= MAX_COMPLETION_SECONDS &&
      validTimestamp(attempt.completedAt) !== null,
  );
  const completionTimes = validAttempts
    .map((attempt) => attempt.completionTimeSeconds)
    .sort((a, b) => a - b);
  const attempts: TimedAttemptPoint[] = [...validAttempts]
    .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))
    .map((attempt, index) => ({
      pointId: index + 1,
      iqScore: attempt.iqScore,
      correctCount: attempt.correctCount,
      completionTimeSeconds: attempt.completionTimeSeconds,
      completedAt: attempt.completedAt,
      speedPercentile: speedPercentile(
        attempt.completionTimeSeconds,
        completionTimes,
      ),
      isCurrentAttempt: attempt.attemptId === currentAttemptId,
    }));
  const currentAttempt = attempts.find((attempt) => attempt.isCurrentAttempt);

  return {
    timedAttemptCount: attempts.length,
    medianCompletionSeconds: quantile(completionTimes, 0.5),
    averageCompletionSeconds: attempts.length
      ? Math.round(
          completionTimes.reduce((sum, seconds) => sum + seconds, 0) /
            attempts.length,
        )
      : 0,
    fastestCompletionSeconds: completionTimes[0] ?? 0,
    percentile25Seconds: quantile(completionTimes, 0.25),
    percentile75Seconds: quantile(completionTimes, 0.75),
    speedPercentile: currentAttempt?.speedPercentile ?? null,
    attempts,
  };
}
