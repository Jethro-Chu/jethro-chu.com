import { STORED_MEDMATH_QUESTIONS } from "../lib/medmath/question-bank.generated.ts";
import { formatAnswer } from "../lib/medmath/rounding.ts";
import type {
  AttemptResult,
  ExamQuestionReview,
  QuestionClientView,
  StoredSession,
} from "../lib/medmath/types.ts";

const baseUrl = process.env.MEDMATH_BASE_URL ?? "http://localhost:3000";
const sessionId = `http-verification-${crypto.randomUUID()}`;
const questionMap = new Map(
  STORED_MEDMATH_QUESTIONS.map((question) => [question.id, question]),
);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, init);
  const payload = (await response.json()) as T & { error?: string };
  assert(
    response.ok,
    `${path} returned HTTP ${response.status}: ${payload.error ?? "unknown error"}`,
  );
  return payload;
}

const exam = await requestJson<{ questions: QuestionClientView[] }>(
  "/api/medmath/question",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      isExam: true,
      examMode: "nursing-med-math",
      examCount: 10,
      difficulty: "standard",
    }),
  },
);
assert(exam.questions.length === 10, "HTTP exam did not contain 10 questions");

const startedAt = new Date().toISOString();
await requestJson("/api/medmath/session", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    sessionId,
    visitorId: "local-http-verification",
    sessionType: "exam",
    examMode: "nursing-med-math",
    selectedCategories: [...new Set(exam.questions.map((q) => q.category))],
    selectedDifficulty: "mixed",
    plannedQuestionCount: exam.questions.length,
    completedQuestionCount: 0,
    startedAt,
    isCompleted: false,
    totalAttempts: 0,
    firstAttemptCorrectCount: 0,
    eventualCorrectCount: 0,
    totalHintsUsed: 0,
    totalSolutionsRevealed: 0,
    averageResponseTimeSeconds: 0,
    categoryBreakdown: {},
    difficultyBreakdown: {},
    weakCategories: [],
  } satisfies StoredSession),
});

const examReview: ExamQuestionReview[] = [];
for (const question of exam.questions) {
  const stored = questionMap.get(question.templateId);
  assert(stored, `Unknown stored question ${question.templateId}`);
  const submittedAnswer = formatAnswer(
    stored.correctAnswer,
    stored.answerPrecision,
  );
  const grade = await requestJson<AttemptResult>("/api/medmath/attempt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instanceId: question.instanceId,
      sessionId,
      attemptNumber: 1,
      submittedAnswer,
      responseTimeSeconds: 1,
      hintsUsedCount: 0,
      solutionRevealed: true,
    }),
  });
  assert(grade.isCorrect, `${question.templateId} was not marked correct over HTTP`);
  assert(
    grade.correctAnswer === stored.correctAnswer,
    `${question.templateId} answer changed across the HTTP grading boundary`,
  );
  assert(
    Array.isArray(grade.solutionSteps) && grade.solutionSteps.length > 0,
    `${question.templateId} returned no solution over HTTP`,
  );

  examReview.push({
    ...question,
    studentAnswer: submittedAnswer,
    correctAnswer: grade.correctAnswer,
    isCorrect: grade.isCorrect,
    solutionSteps: grade.solutionSteps,
  });
}

const categories = [...new Set(exam.questions.map((question) => question.category))];
const categoryBreakdown = Object.fromEntries(
  categories.map((category) => {
    const totalQuestions = exam.questions.filter(
      (question) => question.category === category,
    ).length;
    return [
      category,
      {
        totalQuestions,
        firstAttemptCorrect: totalQuestions,
        eventualCorrect: totalQuestions,
        totalAttempts: totalQuestions,
        averageResponseTimeSeconds: 1,
      },
    ];
  }),
);

await requestJson("/api/medmath/complete", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    sessionId,
    sessionType: "exam",
    examMode: "nursing-med-math",
    plannedQuestionCount: exam.questions.length,
    completedQuestionCount: exam.questions.length,
    totalAttempts: exam.questions.length,
    firstAttemptCorrectCount: exam.questions.length,
    eventualCorrectCount: exam.questions.length,
    averageResponseTimeSeconds: 1,
    categoryBreakdown,
    difficultyBreakdown: {},
    examReview,
  }),
});

const saved = await requestJson<{ session: StoredSession }>(
  `/api/medmath/session?sessionId=${encodeURIComponent(sessionId)}`,
);
assert(!saved.session.isInvalidated, "Fresh verified HTTP result was invalidated");
assert(
  saved.session.examReview?.length === exam.questions.length,
  "Saved HTTP result is missing question review records",
);
assert(
  saved.session.examReview.every((item) => item.isCorrect),
  "Saved HTTP result contains an incorrectly graded known answer",
);

console.log(
  `PASS: generated, graded, persisted, and re-read ${exam.questions.length} known-correct questions over HTTP.`,
);
console.log(`RESULTS_URL=${baseUrl}/medmath/results/${sessionId}`);
