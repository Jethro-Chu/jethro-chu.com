import {
  buildIQAggregateState,
  type StoredAttempt,
} from "../lib/iqtest/store.ts";
import {
  iqQuestions,
  legacyIQQuestions,
  type IQQuestion,
} from "../lib/iqtest/questions.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function answersFor(questions: IQQuestion[]) {
  return Object.fromEntries(
    questions.map((question) => [question.id, question.correctAnswer]),
  );
}

const categoryAccuracy = {
  probability: 1,
  logic: 1,
  patterns: 1,
  quantitative: 1,
  spatial: 1,
};
const randomizedQuestions = iqQuestions.slice(20, 45);
const legacyAttempt: StoredAttempt = {
  version: 1,
  completedAt: "2026-08-13T18:00:00.000Z",
  iqScore: 100,
  correctCount: 25,
  completionSeconds: 600,
  weightedPerformance: 1,
  categoryAccuracy,
  answers: answersFor(legacyIQQuestions),
};
const randomizedAttempt: StoredAttempt = {
  version: 3,
  testVersion: 2,
  selectedQuestionIds: randomizedQuestions.map((question) => question.stableId),
  timingVersion: 1,
  startedAt: "2026-08-13T18:05:00.000Z",
  completedAt: "2026-08-13T18:10:00.000Z",
  completionTimeSeconds: 300,
  iqScore: 120,
  correctCount: 25,
  completionSeconds: 300,
  weightedPerformance: 1,
  categoryAccuracy,
  answers: answersFor(randomizedQuestions),
};

const state = buildIQAggregateState([
  { attemptId: "legacy", attempt: legacyAttempt },
  { attemptId: "randomized", attempt: randomizedAttempt },
]);

assert(state.meta.attempt_count === 2, "Rebuild must count all attempts.");
assert(state.meta.score_sum === 220, "Rebuild score sum is incorrect.");
assert(state.meta.correct_sum === 50, "Rebuild correct sum is incorrect.");
assert(
  state.meta.completion_seconds_sum === 900,
  "Rebuild completion-time sum is incorrect.",
);
assert(state.scoreCounts["100"] === 1, "Legacy score count is missing.");
assert(state.scoreCounts["120"] === 1, "Randomized score count is missing.");
for (const question of legacyIQQuestions) {
  assert(
    state.questionTotals[String(question.id)] === 1,
    `Legacy total is missing for ${question.id}.`,
  );
  assert(
    state.questionCorrect[String(question.id)] === 1,
    `Legacy correct count is missing for ${question.id}.`,
  );
}
for (const question of randomizedQuestions) {
  assert(
    state.randomizedQuestionTotals[question.stableId] === 1,
    `Randomized total is missing for ${question.stableId}.`,
  );
  assert(
    state.randomizedQuestionCorrect[question.stableId] === 1,
    `Randomized correct count is missing for ${question.stableId}.`,
  );
}
assert(
  Object.keys(state.timedAttempts).length === 1 &&
    Boolean(state.timedAttempts.randomized),
  "Only timed attempts should be restored to timing analytics.",
);

console.log(
  "Verified IQ cleanup aggregate rebuilding for legacy, randomized, and timed attempts.",
);
