import { CATEGORY_MAP } from "./categories.ts";
import { formatAnswer, gradeAnswer, roundTo } from "./rounding.ts";
import { ALL_QUESTION_TEMPLATES, TEMPLATE_MAP } from "./templates/index.ts";
import type {
  AttemptResult,
  AttemptSubmission,
  MedMathCategory,
  MedMathDifficulty,
  PracticeDifficultySelection,
  QuestionClientView,
  QuestionInstance,
  QuestionTemplate,
} from "./types.ts";

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
  template: QuestionTemplate,
  rng: () => number = Math.random,
): QuestionInstance {
  const generated = template.generate(rng);

  if (!Number.isFinite(generated.correctAnswer)) {
    throw new Error(
      `Missing or invalid correctAnswer for question ${template.id}`
    );
  }
  if (typeof generated.answerUnit !== "string" || !generated.answerUnit) {
    throw new Error(
      `Missing or invalid answerUnit for question ${template.id}`
    );
  }
  if (
    typeof generated.answerPrecision !== "number" ||
    !Number.isInteger(generated.answerPrecision) ||
    generated.answerPrecision < 0
  ) {
    throw new Error(
      `Missing or invalid answerPrecision for question ${template.id}`
    );
  }

  const cleanCorrectAnswer = roundTo(generated.correctAnswer, generated.answerPrecision);
  const instanceId = generateUUID();

  const instance: QuestionInstance = {
    instanceId,
    templateId: template.id,
    category: template.category,
    subtype: template.subtype,
    difficulty: template.difficulty,
    title: template.title,
    clinicalContext: template.clinicalContext,
    scenario: generated.scenario,
    orderText: generated.orderText,
    availableText: generated.availableText,
    patientWeightKg: generated.patientWeightKg,
    patientWeightLb: generated.patientWeightLb,
    prompt: generated.prompt,
    correctAnswer: cleanCorrectAnswer,
    answerUnit: generated.answerUnit,
    answerPrecision: generated.answerPrecision,
    roundingInstruction: generated.roundingInstruction,
    hints: generated.hints,
    solutionSteps: generated.solutionSteps,
    rawVariables: generated.rawVariables,
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
  return activeInstances.get(instanceId);
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

export function selectTemplatesForFilter({
  categories,
  difficulty,
  templateIds,
}: {
  categories?: MedMathCategory[];
  difficulty?: PracticeDifficultySelection | "basic" | "standard" | "hard";
  templateIds?: string[];
}): QuestionTemplate[] {
  let list = ALL_QUESTION_TEMPLATES;

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

  return list.length > 0 ? list : ALL_QUESTION_TEMPLATES;
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
  let candidates = selectTemplatesForFilter({ categories, difficulty, templateIds });
  
  if (excludeTemplateIds.length > 0) {
    const excludeSet = new Set(excludeTemplateIds);
    const nonExcluded = candidates.filter((t) => !excludeSet.has(t.id));
    if (nonExcluded.length > 0) candidates = nonExcluded;
  }

  const selectedTemplate = candidates[Math.floor(rng() * candidates.length)];
  const instance = createQuestionInstance(selectedTemplate, rng);
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

  const selectedTemplates: QuestionTemplate[] = [];
  const usedTemplateIds = new Set<string>();

  // Select proportionally
  for (const { category, weight } of categoryWeights) {
    const quota = Math.max(1, Math.round((weight / 20) * count));
    const available = ALL_QUESTION_TEMPLATES.filter(
      (t) => t.category === category && !usedTemplateIds.has(t.id),
    );

    let candidates = available;
    if (difficulty === "basic") {
      candidates = available.filter((t) => t.difficulty === "beginner");
    } else if (difficulty === "standard") {
      candidates = available.filter((t) => t.difficulty === "beginner" || t.difficulty === "intermediate");
    }

    if (candidates.length === 0) candidates = available;

    for (let i = 0; i < quota && candidates.length > 0 && selectedTemplates.length < count; i++) {
      const idx = Math.floor(rng() * candidates.length);
      const chosen = candidates[idx];
      selectedTemplates.push(chosen);
      usedTemplateIds.add(chosen.id);
      candidates.splice(idx, 1);
    }
  }

  // Fill remainder if needed
  while (selectedTemplates.length < count) {
    const remaining = ALL_QUESTION_TEMPLATES.filter(
      (t) => medSurgCategories.includes(t.category) && !usedTemplateIds.has(t.id),
    );
    if (remaining.length === 0) break;
    const idx = Math.floor(rng() * remaining.length);
    const chosen = remaining[idx];
    selectedTemplates.push(chosen);
    usedTemplateIds.add(chosen.id);
  }

  // Shuffle selected questions
  for (let i = selectedTemplates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [selectedTemplates[i], selectedTemplates[j]] = [selectedTemplates[j], selectedTemplates[i]];
  }

  const instances = selectedTemplates.map((t) => createQuestionInstance(t, rng));
  const clientViews = instances.map(toClientView);

  return { instances, clientViews };
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

  const selectedTemplates: QuestionTemplate[] = [];
  const usedTemplateIds = new Set<string>();

  for (const { category, weight } of categoryWeights) {
    const quota = Math.max(1, Math.round((weight / 20) * count));
    const available = ALL_QUESTION_TEMPLATES.filter(
      (t) => t.category === category && !usedTemplateIds.has(t.id),
    );

    let candidates = available;
    if (difficulty === "hard") {
      candidates = available.filter((t) => t.difficulty === "advanced" || t.difficulty === "critical-care");
    }

    if (candidates.length === 0) candidates = available;

    for (let i = 0; i < quota && candidates.length > 0 && selectedTemplates.length < count; i++) {
      const idx = Math.floor(rng() * candidates.length);
      const chosen = candidates[idx];
      selectedTemplates.push(chosen);
      usedTemplateIds.add(chosen.id);
      candidates.splice(idx, 1);
    }
  }

  while (selectedTemplates.length < count) {
    const remaining = ALL_QUESTION_TEMPLATES.filter(
      (t) => ccCategories.includes(t.category) && !usedTemplateIds.has(t.id),
    );
    if (remaining.length === 0) break;
    const idx = Math.floor(rng() * remaining.length);
    const chosen = remaining[idx];
    selectedTemplates.push(chosen);
    usedTemplateIds.add(chosen.id);
  }

  for (let i = selectedTemplates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [selectedTemplates[i], selectedTemplates[j]] = [selectedTemplates[j], selectedTemplates[i]];
  }

  const instances = selectedTemplates.map((t) => createQuestionInstance(t, rng));
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
  const filteredTemplates = selectTemplatesForFilter({
    categories: targetCategories,
    difficulty,
  });

  const pool = [...filteredTemplates];
  const selectedTemplates: QuestionTemplate[] = [];

  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(rng() * pool.length);
    selectedTemplates.push(pool[idx]);
    pool.splice(idx, 1);
  }

  const instances = selectedTemplates.map((t) => createQuestionInstance(t, rng));
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
