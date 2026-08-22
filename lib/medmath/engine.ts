import { CATEGORY_MAP } from "./categories.ts";
import { gradeAnswer } from "./rounding.ts";
import { STORED_MEDMATH_QUESTIONS } from "./question-bank.generated.ts";
import type {
  AttemptResult,
  AttemptSubmission,
  MedMathCategory,
  MedMathDifficulty,
  PracticeDifficultySelection,
  QuestionClientView,
  QuestionInstance,
  StoredNumericQuestion,
} from "./types.ts";

const QUESTION_MAP = new Map(
  STORED_MEDMATH_QUESTIONS.map((question) => [question.id, question]),
);

export function getStoredQuestion(
  questionId: string,
): StoredNumericQuestion | undefined {
  return QUESTION_MAP.get(questionId);
}

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// In-memory instance store for active questions so answers can be verified server-side without exposing answers to the client
const activeInstances = new Map<string, QuestionInstance>();

export function createQuestionInstance(
  question: StoredNumericQuestion,
  instanceId = `${question.id}::${generateUUID()}`,
): QuestionInstance {
  if (!Number.isFinite(question.correctAnswer)) {
    throw new Error(
      `Missing or invalid correctAnswer for question ${question.id}: ${question.correctAnswer}`,
    );
  }
  if (typeof question.answerUnit !== "string" || !question.answerUnit) {
    throw new Error(
      `Missing or invalid answerUnit for question ${question.id}`,
    );
  }
  if (
    typeof question.answerPrecision !== "number" ||
    !Number.isInteger(question.answerPrecision) ||
    question.answerPrecision < 0
  ) {
    throw new Error(
      `Missing or invalid answerPrecision for question ${question.id}`,
    );
  }

  const instance: QuestionInstance = {
    instanceId,
    templateId: question.id,
    category: question.category,
    subtype: question.subtype,
    difficulty: question.difficulty,
    title: question.title,
    clinicalContext: question.clinicalContext,
    scenario: question.scenario,
    orderText: question.orderText,
    availableText: question.availableText,
    patientWeightKg: question.patientWeightKg,
    patientWeightLb: question.patientWeightLb,
    prompt: question.prompt,
    correctAnswer: question.correctAnswer,
    answerUnit: question.answerUnit,
    answerPrecision: question.answerPrecision,
    roundingInstruction: question.roundingInstruction,
    hints: question.hints,
    solutionSteps: question.solutionSteps,
    rawVariables: question.rawVariables,
    createdAt: new Date().toISOString(),
  };

  // Cache in server memory for validation
  activeInstances.set(instanceId, instance);
  if (activeInstances.size > 5000) {
    const oldestKey = activeInstances.keys().next().value;
    if (oldestKey) activeInstances.delete(oldestKey);
  }

  return instance;
}

export function getCachedQuestionInstance(instanceId: string): QuestionInstance | undefined {
  const cached = activeInstances.get(instanceId);
  if (cached) return cached;

  // Vercel can execute question creation and grading in different function
  // processes. Rehydrate the exact materialized question from the stable ID
  // instead of depending on process-local memory.
  const questionId = instanceId.split("::", 1)[0];
  const storedQuestion = QUESTION_MAP.get(questionId);
  return storedQuestion
    ? createQuestionInstance(storedQuestion, instanceId)
    : undefined;
}

export function toClientView(instance: QuestionInstance): QuestionClientView {
  const catMeta = CATEGORY_MAP.get(instance.category);
  return {
    instanceId: instance.instanceId,
    templateId: instance.templateId,
    category: instance.category,
    categoryName: catMeta?.name ?? instance.category,
    subtype: instance.subtype,
    difficulty: instance.difficulty,
    title: instance.title,
    clinicalContext: instance.clinicalContext,
    scenario: instance.scenario,
    orderText: instance.orderText,
    availableText: instance.availableText,
    patientWeightKg: instance.patientWeightKg,
    patientWeightLb: instance.patientWeightLb,
    prompt: instance.prompt,
    answerUnit: instance.answerUnit,
    answerPrecision: instance.answerPrecision,
    roundingInstruction: instance.roundingInstruction,
  };
}

export function selectQuestionsForFilter({
  categories,
  difficulty,
  templateIds,
}: {
  categories?: MedMathCategory[];
  difficulty?: PracticeDifficultySelection | "basic" | "standard" | "hard";
  templateIds?: string[];
}): StoredNumericQuestion[] {
  let list = STORED_MEDMATH_QUESTIONS;

  if (templateIds && templateIds.length > 0) {
    const set = new Set(templateIds);
    const filtered = list.filter((t) => set.has(t.id));
    if (filtered.length > 0) return filtered;
  }

  if (categories && categories.length > 0) {
    const set = new Set(categories);
    list = list.filter((t) => set.has(t.category));
  }

  if (difficulty && difficulty !== "mixed") {
    if ((difficulty as unknown) === "basic") {
      list = list.filter((t) => t.difficulty === "beginner");
    } else if ((difficulty as unknown) === "standard") {
      list = list.filter((t) => t.difficulty === "beginner" || t.difficulty === "intermediate");
    } else if ((difficulty as unknown) === "hard") {
      list = list.filter((t) => t.difficulty === "intermediate" || t.difficulty === "advanced" || t.difficulty === "critical-care");
    } else {
      list = list.filter((t) => t.difficulty === difficulty);
    }
  }

  return list.length > 0 ? list : STORED_MEDMATH_QUESTIONS;
}

export function generateRandomQuestion({
  categories,
  difficulty,
  templateIds,
  excludeTemplateIds = [],
  rng = Math.random,
}: {
  categories?: MedMathCategory[];
  difficulty?: PracticeDifficultySelection;
  templateIds?: string[];
  excludeTemplateIds?: string[];
  rng?: () => number;
}): { instance: QuestionInstance; clientView: QuestionClientView } {
  let candidates = selectQuestionsForFilter({ categories, difficulty, templateIds });
  
  if (excludeTemplateIds.length > 0) {
    const excludeSet = new Set(excludeTemplateIds);
    const nonExcluded = candidates.filter((t) => !excludeSet.has(t.id));
    if (nonExcluded.length > 0) candidates = nonExcluded;
  }

  const selectedQuestion = candidates[Math.floor(rng() * candidates.length)];
  const instance = createQuestionInstance(selectedQuestion);
  return {
    instance,
    clientView: toClientView(instance),
  };
}

/**
 * Standard Nursing Med Math Exam generator.
 * Emphasizes the core Med-Surg adult medication calculation curriculum with a balanced, realistic distribution.
 * Excludes complex vasoactive ICU drips and zero pediatrics.
 */
export function generateNursingMedMathExam({
  count = 20,
  difficulty = "standard",
  rng = Math.random,
}: {
  count?: number;
  difficulty?: PracticeDifficultySelection | "basic" | "standard" | "hard";
  rng?: () => number;
}): { instances: QuestionInstance[]; clientViews: QuestionClientView[] } {
  // Core Med-Surg Categories (strictly adult inpatient, no complex vasoactive drips)
  const medSurgCategories: MedMathCategory[] = [
    "conversions",
    "basic-dosage",
    "iv-pump",
    "gravity-drips",
    "infusion-time",
    "insulin",
    "weight-based",
    "heparin",
    "concentrations",
    "reconstitution",
    "electrolytes",
  ];

  // Distribution ratios for a balanced 20-question Nursing Med Math exam
  const categoryWeights: { category: MedMathCategory; weight: number }[] = [
    { category: "conversions", weight: 3 },
    { category: "basic-dosage", weight: 4 },
    { category: "iv-pump", weight: 3 },
    { category: "gravity-drips", weight: 2 },
    { category: "infusion-time", weight: 1 },
    { category: "insulin", weight: 2 },
    { category: "weight-based", weight: 2 },
    { category: "heparin", weight: 1 },
    { category: "reconstitution", weight: 1 },
    { category: "electrolytes", weight: 1 },
  ];

  const selectedQuestions: StoredNumericQuestion[] = [];
  const usedTemplateIds = new Set<string>();

  // Select proportionally
  for (const { category, weight } of categoryWeights) {
    const quota = Math.max(1, Math.round((weight / 20) * count));
    const available = STORED_MEDMATH_QUESTIONS.filter(
      (t) => t.category === category && !usedTemplateIds.has(t.id),
    );

    let candidates = available;
    if (difficulty === "basic") {
      candidates = available.filter((t) => t.difficulty === "beginner");
    } else if (difficulty === "standard") {
      candidates = available.filter((t) => t.difficulty === "beginner" || t.difficulty === "intermediate");
    }

    if (candidates.length === 0) candidates = available;

    for (let i = 0; i < quota && candidates.length > 0 && selectedQuestions.length < count; i++) {
      const idx = Math.floor(rng() * candidates.length);
      const chosen = candidates[idx];
      selectedQuestions.push(chosen);
      usedTemplateIds.add(chosen.id);
      candidates.splice(idx, 1);
    }
  }

  // Fill remainder if needed
  while (selectedQuestions.length < count) {
    const remaining = STORED_MEDMATH_QUESTIONS.filter(
      (t) => medSurgCategories.includes(t.category) && !usedTemplateIds.has(t.id),
    );
    if (remaining.length === 0) break;
    const idx = Math.floor(rng() * remaining.length);
    const chosen = remaining[idx];
    selectedQuestions.push(chosen);
    usedTemplateIds.add(chosen.id);
  }

  // Shuffle selected questions
  for (let i = selectedQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
  }

  const instances = selectedQuestions.map((question) => createQuestionInstance(question));
  const clientViews = instances.map(toClientView);

  return { instances, clientViews };
}

/**
 * Canvas competency/practice blueprint.
 *
 * This intentionally uses a narrower adult nursing-school pool than the main
 * MedMath exam. It excludes ICU, titratable infusion, pediatric, and advanced
 * insulin material while keeping a fixed, balanced 30-question distribution.
 */
export function generateCanvasMedMathExam({
  rng = Math.random,
}: {
  rng?: () => number;
} = {}): { instances: QuestionInstance[]; clientViews: QuestionClientView[] } {
  const conversionSubtypes = new Set([
    "g-to-mg",
    "mg-to-g",
    "mg-to-mcg",
    "mcg-to-mg",
    "l-to-ml",
    "ml-to-l",
    "lb-to-kg",
    "kg-to-lb",
    "hours-to-mins",
    "mins-to-hours",
    "household-to-metric",
  ]);
  const basicInsulinIds = new Set([
    "insulin-sliding-scale-only",
    "insulin-scheduled-plus-correction",
    "insulin-carb-ratio-coverage",
    "insulin-basal-glargine",
    "insulin-nph-regular-mix",
    "insulin-carb-ratio-snack",
    "insulin-carb-ratio-dinner",
    "insulin-sliding-scale-moderate",
    "insulin-correction-target-difference",
  ]);
  const blockedClinicalLanguage =
    /\b(ICU|critical care|vasopressor|titration|DKA|intubat|sedation|mcg\/kg\/min)\b/i;

  const isRegularQuestion = (question: StoredNumericQuestion) => {
    if (
      question.difficulty === "advanced" ||
      question.difficulty === "critical-care"
    ) {
      return false;
    }

    const searchableText = [
      question.title,
      question.clinicalContext,
      question.scenario,
      question.orderText,
      question.availableText,
      question.prompt,
    ]
      .filter(Boolean)
      .join(" ");

    return !blockedClinicalLanguage.test(searchableText);
  };

  const blueprint: Array<{
    category: MedMathCategory;
    count: number;
    include?: (question: StoredNumericQuestion) => boolean;
  }> = [
    {
      category: "conversions",
      count: 5,
      include: (question) => conversionSubtypes.has(question.subtype),
    },
    { category: "basic-dosage", count: 7 },
    { category: "iv-pump", count: 5 },
    { category: "gravity-drips", count: 4 },
    { category: "infusion-time", count: 3 },
    {
      category: "insulin",
      count: 3,
      include: (question) => basicInsulinIds.has(question.id),
    },
    { category: "reconstitution", count: 3 },
  ];

  const selectedQuestions: StoredNumericQuestion[] = [];

  for (const item of blueprint) {
    const candidates = STORED_MEDMATH_QUESTIONS.filter(
      (question) =>
        question.category === item.category &&
        isRegularQuestion(question) &&
        (item.include?.(question) ?? true),
    );

    if (candidates.length < item.count) {
      throw new Error(
        `Canvas exam pool for ${item.category} has ${candidates.length} questions; ${item.count} required`,
      );
    }

    for (let index = candidates.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(rng() * (index + 1));
      [candidates[index], candidates[swapIndex]] = [
        candidates[swapIndex],
        candidates[index],
      ];
    }

    selectedQuestions.push(...candidates.slice(0, item.count));
  }

  for (let index = selectedQuestions.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [selectedQuestions[index], selectedQuestions[swapIndex]] = [
      selectedQuestions[swapIndex],
      selectedQuestions[index],
    ];
  }

  if (
    selectedQuestions.length !== 30 ||
    new Set(selectedQuestions.map((question) => question.id)).size !== 30
  ) {
    throw new Error("Canvas exam generation must produce 30 unique questions");
  }

  const instances = selectedQuestions.map((question) =>
    createQuestionInstance(question),
  );

  return { instances, clientViews: instances.map(toClientView) };
}

/**
 * Critical Care Exam generator.
 * Dedicated simulation exam focusing on high-acuity adult critical care calculations (vasoactive infusions,
 * multi-step ICU titrations, weight-based drips, insulin protocols, and heparin adjustments).
 */
export function generateCriticalCareExam({
  count = 20,
  difficulty = "standard",
  rng = Math.random,
}: {
  count?: number;
  difficulty?: PracticeDifficultySelection | "basic" | "standard" | "hard";
  rng?: () => number;
}): { instances: QuestionInstance[]; clientViews: QuestionClientView[] } {
  const ccCategories: MedMathCategory[] = [
    "critical-care",
    "multi-step",
    "heparin",
    "insulin",
    "weight-based",
    "concentrations",
    "electrolytes",
  ];

  const categoryWeights: { category: MedMathCategory; weight: number }[] = [
    { category: "critical-care", weight: 8 },
    { category: "multi-step", weight: 4 },
    { category: "heparin", weight: 3 },
    { category: "insulin", weight: 2 },
    { category: "weight-based", weight: 2 },
    { category: "electrolytes", weight: 1 },
  ];

  const selectedQuestions: StoredNumericQuestion[] = [];
  const usedTemplateIds = new Set<string>();

  for (const { category, weight } of categoryWeights) {
    const quota = Math.max(1, Math.round((weight / 20) * count));
    const available = STORED_MEDMATH_QUESTIONS.filter(
      (t) => t.category === category && !usedTemplateIds.has(t.id),
    );

    let candidates = available;
    if (difficulty === "hard") {
      candidates = available.filter((t) => t.difficulty === "advanced" || t.difficulty === "critical-care");
    }

    if (candidates.length === 0) candidates = available;

    for (let i = 0; i < quota && candidates.length > 0 && selectedQuestions.length < count; i++) {
      const idx = Math.floor(rng() * candidates.length);
      const chosen = candidates[idx];
      selectedQuestions.push(chosen);
      usedTemplateIds.add(chosen.id);
      candidates.splice(idx, 1);
    }
  }

  while (selectedQuestions.length < count) {
    const remaining = STORED_MEDMATH_QUESTIONS.filter(
      (t) => ccCategories.includes(t.category) && !usedTemplateIds.has(t.id),
    );
    if (remaining.length === 0) break;
    const idx = Math.floor(rng() * remaining.length);
    const chosen = remaining[idx];
    selectedQuestions.push(chosen);
    usedTemplateIds.add(chosen.id);
  }

  for (let i = selectedQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
  }

  const instances = selectedQuestions.map((question) => createQuestionInstance(question));
  const clientViews = instances.map(toClientView);

  return { instances, clientViews };
}

/**
 * Unified Exam Question Set Generator supporting Nursing Med Math, Critical Care, and Custom exam modes.
 */
export function generateExamQuestionSet({
  examMode = "nursing-med-math",
  categories,
  difficulty = "standard",
  count = 20,
  rng = Math.random,
}: {
  examMode?: "nursing-med-math" | "critical-care" | "custom";
  categories?: MedMathCategory[];
  difficulty?: PracticeDifficultySelection | "basic" | "standard" | "hard";
  count?: number;
  rng?: () => number;
}): { instances: QuestionInstance[]; clientViews: QuestionClientView[] } {
  if (examMode === "nursing-med-math") {
    return generateNursingMedMathExam({ count, difficulty, rng });
  }

  if (examMode === "critical-care") {
    return generateCriticalCareExam({ count, difficulty, rng });
  }

  // Custom Exam Mode: Filter by user-selected categories and difficulty
  const targetCategories = categories && categories.length > 0 ? categories : undefined;
  const filteredQuestions = selectQuestionsForFilter({
    categories: targetCategories,
    difficulty,
  });

  const pool = [...filteredQuestions];
  const selectedQuestions: StoredNumericQuestion[] = [];

  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(rng() * pool.length);
    selectedQuestions.push(pool[idx]);
    pool.splice(idx, 1);
  }

  const instances = selectedQuestions.map((question) => createQuestionInstance(question));
  const clientViews = instances.map(toClientView);

  return { instances, clientViews };
}

export function gradeAttempt(
  submission: AttemptSubmission,
  instance?: QuestionInstance,
): AttemptResult {
  const targetInstance = instance ?? getCachedQuestionInstance(submission.instanceId);

  if (!targetInstance) {
    return {
      attemptId: generateUUID(),
      instanceId: submission.instanceId,
      isCorrect: false,
      attemptNumber: submission.attemptNumber,
      feedback: "Question session expired. Please proceed to the next question.",
    };
  }

  const isCorrect = gradeAnswer(targetInstance, submission.submittedAnswer);

  return {
    attemptId: generateUUID(),
    instanceId: targetInstance.instanceId,
    isCorrect,
    attemptNumber: submission.attemptNumber,
    feedback: isCorrect ? "Correct" : "Not quite.",
    solutionSteps: isCorrect || submission.solutionRevealed ? targetInstance.solutionSteps : undefined,
    correctAnswer: isCorrect || submission.solutionRevealed ? targetInstance.correctAnswer : undefined,
    answerUnit: targetInstance.answerUnit,
    answerPrecision: targetInstance.answerPrecision,
  };
}
