import { buildPublicMedMathData } from "../lib/medmath/public-data.ts";
import { STORED_MEDMATH_QUESTIONS } from "../lib/medmath/question-bank.generated.ts";
import { saveSession, getSession, recordAttempt, getPublicMedMathData } from "../lib/medmath/store.ts";
import type { ExamQuestionReview, StoredAttemptRecord, StoredSession } from "../lib/medmath/types.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

console.log("Verifying MedMath Store and Public Data Aggregations...");

// 1. Empty state verification
const emptyData = buildPublicMedMathData([], []);
assert(emptyData.summary.totalQuestionsAnswered === 0, "Empty totalQuestions must be 0");
assert(emptyData.summary.totalPracticeSessions === 0, "Empty totalSessions must be 0");
assert(emptyData.categories.length === 13, "Must have all 13 categories in table");
assert(emptyData.hardestTopics.length === 0, "Hardest topics must be empty when < 5 questions");
assert(emptyData.mostMissedSubtypes.length === 0, "Subtypes must be empty when < 20 attempts");
console.log("  ✓ Empty state returns clean zero values");

// 2. Synthetic dataset verification
const testSession: StoredSession = {
  sessionId: "test-sess-001",
  visitorId: "anon-vis-001",
  sessionType: "practice",
  selectedCategories: ["conversions", "iv-pump"],
  selectedDifficulty: "mixed",
  plannedQuestionCount: 5,
  completedQuestionCount: 5,
  startedAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  isCompleted: true,
  totalAttempts: 7,
  firstAttemptCorrectCount: 4,
  eventualCorrectCount: 5,
  totalHintsUsed: 2,
  totalSolutionsRevealed: 0,
  averageResponseTimeSeconds: 28,
  categoryBreakdown: {},
  difficultyBreakdown: {},
  weakCategories: [],
};

await saveSession(testSession);
const retrieved = await getSession("test-sess-001");
assert(retrieved !== null, "Session must be retrieved");
assert(retrieved.sessionId === "test-sess-001", "Retrieved session ID must match");
console.log("  ✓ Session save and retrieve verified");

const storedQuestion = STORED_MEDMATH_QUESTIONS[0];
const brokenReview = {
  ...storedQuestion,
  instanceId: `${storedQuestion.id}::legacy-result`,
  templateId: storedQuestion.id,
  categoryName: "Conversions",
  studentAnswer: String(storedQuestion.correctAnswer),
  correctAnswer: 0,
  isCorrect: false,
  solutionSteps: [],
} satisfies ExamQuestionReview;
const brokenSession: StoredSession = {
  ...testSession,
  sessionId: "test-sess-broken-result",
  sessionType: "exam",
  examReview: [brokenReview],
};
await saveSession(brokenSession);
const invalidated = await getSession(brokenSession.sessionId);
assert(invalidated?.isInvalidated, "Broken historical result must be invalidated");
assert(invalidated.examReview?.length === 0, "Broken answer must not reach results UI");
console.log("  ✓ Broken historical result is invalidated without displaying zero");

// Record sample attempts
const testAttempts: StoredAttemptRecord[] = [
  {
    attemptId: "att-001",
    sessionId: "test-sess-001",
    instanceId: "inst-001",
    templateId: "conv-g-to-mg",
    category: "conversions",
    subtype: "g-to-mg",
    difficulty: "beginner",
    attemptNumber: 1,
    submittedAnswer: "1000",
    isCorrect: true,
    responseTimeSeconds: 15,
    hintsUsedCount: 0,
    solutionRevealed: false,
    timestamp: new Date().toISOString(),
  },
  {
    attemptId: "att-002",
    sessionId: "test-sess-001",
    instanceId: "inst-002",
    templateId: "iv-pump-continuous-hourly",
    category: "iv-pump",
    subtype: "continuous-ml-hr",
    difficulty: "beginner",
    attemptNumber: 1,
    submittedAnswer: "100",
    isCorrect: false,
    responseTimeSeconds: 22,
    hintsUsedCount: 1,
    solutionRevealed: false,
    timestamp: new Date().toISOString(),
  },
  {
    attemptId: "att-003",
    sessionId: "test-sess-001",
    instanceId: "inst-002",
    templateId: "iv-pump-continuous-hourly",
    category: "iv-pump",
    subtype: "continuous-ml-hr",
    difficulty: "beginner",
    attemptNumber: 2,
    submittedAnswer: "125",
    isCorrect: true,
    responseTimeSeconds: 10,
    hintsUsedCount: 1,
    solutionRevealed: false,
    timestamp: new Date().toISOString(),
  },
];

for (const att of testAttempts) {
  await recordAttempt(att);
}

const data = await getPublicMedMathData();
assert(data.summary.totalQuestionsAnswered >= 2, "Must aggregate questions answered");
console.log("  ✓ Aggregations computed successfully");

console.log("\n✅ All store and aggregation tests passed!");
