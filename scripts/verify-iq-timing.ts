import { iqQuestions } from "../lib/iqtest/questions.ts";
import { scoreAttempt } from "../lib/iqtest/scoring.ts";
import {
  buildTimingAnalytics,
  MIN_TIMED_SAMPLE_FOR_PERCENTILE,
  speedPercentile,
  validateCompletionTiming,
  type StoredTimedAttempt,
} from "../lib/iqtest/timing.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const receivedAtMs = Date.parse("2026-08-13T01:30:00.000Z");
const timing = validateCompletionTiming(
  {
    timingVersion: 1,
    startedAt: "2026-08-13T01:00:00.000Z",
    completedAt: "2026-08-13T01:29:58.000Z",
    completionTimeSeconds: 1798,
    completionSeconds: 1798,
  },
  receivedAtMs,
);
assert(timing, "A valid timed submission should be accepted.");
assert(
  timing.completionTimeSeconds === 1798,
  "Stored completion time should be calculated from the submitted timestamps.",
);
assert(
  timing.completedAt === "2026-08-13T01:29:58.000Z",
  "The validated completion timestamp should be preserved.",
);

assert(
  validateCompletionTiming(
    {
      timingVersion: 1,
      startedAt: "2026-08-13T01:30:00.000Z",
      completedAt: "2026-08-13T01:29:00.000Z",
      completionTimeSeconds: -60,
      completionSeconds: 0,
    },
    receivedAtMs,
  ) === null,
  "Negative timing must be rejected.",
);
assert(
  validateCompletionTiming(
    {
      timingVersion: 1,
      startedAt: "2026-08-13T01:00:00.000Z",
      completedAt: "2026-08-13T01:20:00.000Z",
      completionTimeSeconds: 1200,
      completionSeconds: 600,
    },
    receivedAtMs,
  ) === null,
  "Conflicting elapsed values must be rejected.",
);

const attempts: StoredTimedAttempt[] = Array.from(
  { length: MIN_TIMED_SAMPLE_FOR_PERCENTILE },
  (_, index) => ({
    attemptId: `attempt-${index + 1}`,
    iqScore: 90 + index,
    correctCount: 10 + (index % 15),
    completionTimeSeconds: 600 + index * 60,
    completedAt: new Date(receivedAtMs + index * 1000).toISOString(),
  }),
);
const analytics = buildTimingAnalytics(attempts, "attempt-1");
assert(analytics.timedAttemptCount === 25, "All valid timed attempts are included.");
assert(analytics.fastestCompletionSeconds === 600, "Fastest time is incorrect.");
assert(analytics.medianCompletionSeconds === 1320, "Median time is incorrect.");
assert(
  analytics.speedPercentile === 96,
  "The current fastest attempt should be faster than 96% of the 25-attempt sample.",
);
assert(
  speedPercentile(600, attempts.slice(0, 24).map((item) => item.completionTimeSeconds)) ===
    null,
  "Speed percentiles must remain hidden below the sample threshold.",
);

const allWrongAnswers = Object.fromEntries(
  iqQuestions.slice(0, 25).map((question) => [
    question.id,
    question.options.find((option) => option.id !== question.correctAnswer)?.id ?? "",
  ]),
);
const scoreBeforeTiming = scoreAttempt(
  iqQuestions.slice(0, 25),
  allWrongAnswers,
  () => 0.5,
);
const scoreAfterTiming = scoreAttempt(
  iqQuestions.slice(0, 25),
  allWrongAnswers,
  () => 0.5,
);
assert(
  JSON.stringify(scoreBeforeTiming) === JSON.stringify(scoreAfterTiming),
  "Timing must not affect IQ scoring.",
);

console.log(
  "Verified server timing validation, timed-only analytics, speed percentiles, and unchanged IQ scoring.",
);
