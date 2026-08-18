import { CATEGORY_MAP } from "./categories.ts";
import { formatAnswer, checkAnswerCorrectness } from "./rounding.ts";
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
    expectedUnit: generated.expectedUnit,
    roundingMode: generated.roundingMode,
    roundingInstruction: generated.roundingInstruction,
    tolerance: generated.tolerance,
    hints: generated.hints,
    solutionSteps: generated.solutionSteps,
    expectedAnswer: generated.expectedAnswer,
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
    expectedUnit: instance.expectedUnit,
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
    if (difficulty === "basic" as unknown) {
      list = list.filter((t) => t.difficulty === "beginner");
    } else if (difficulty === "standard" as unknown) {
      list = list.filter((t) => t.difficulty === "beginner" || t.difficulty === "intermediate");
    } else if (difficulty === "hard" as unknown) {
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
  // Category allocation weights for a standard 20-question exam
  // 3 conversions (15%), 3 basic dosage (15%), 3 IV pump (15%), 2 gravity (10%),
  // 2 insulin (10%), 2 weight-based (10%), 2 reconstitution/conc (10%), 1 infusion time (5%), 2 heparin/electrolytes (10%)
  const coreCategoryTargets: { category: MedMathCategory; weight: number }[] = [
    { category: "conversions", weight: 0.15 },
    { category: "basic-dosage", weight: 0.15 },
    { category: "iv-pump", weight: 0.15 },
    { category: "gravity-drips", weight: 0.10 },
    { category: "insulin", weight: 0.10 },
    { category: "weight-based", weight: 0.10 },
    { category: "reconstitution", weight: 0.05 },
    { category: "concentrations", weight: 0.05 },
    { category: "infusion-time", weight: 0.05 },
    { category: "electrolytes", weight: 0.05 },
    { category: "heparin", weight: 0.05 },
  ];

  // Filter templates by regular nursing difficulty
  const filterTemplatesByDiff = (catTemplates: QuestionTemplate[]): QuestionTemplate[] => {
    if (difficulty === "basic" || difficulty === "beginner") {
      const filtered = catTemplates.filter((t) => t.difficulty === "beginner");
      return filtered.length > 0 ? filtered : catTemplates;
    }
    if (difficulty === "standard") {
      const filtered = catTemplates.filter((t) => t.difficulty === "beginner" || t.difficulty === "intermediate");
      return filtered.length > 0 ? filtered : catTemplates;
    }
    if (difficulty === "hard" || difficulty === "advanced") {
      const filtered = catTemplates.filter((t) => t.difficulty === "intermediate" || t.difficulty === "advanced");
      return filtered.length > 0 ? filtered : catTemplates;
    }
    return catTemplates;
  };

  const selectedTemplates: QuestionTemplate[] = [];

  // 1. Calculate quota per category
  for (const item of coreCategoryTargets) {
    const quota = Math.max(1, Math.round(count * item.weight));
    const catTemplates = filterTemplatesByDiff(
      ALL_QUESTION_TEMPLATES.filter((t) => t.category === item.category),
    );
    const shuffled = [...catTemplates].sort(() => rng() - 0.5);

    for (let i = 0; i < quota && selectedTemplates.length < count; i++) {
      selectedTemplates.push(shuffled[i % shuffled.length]);
    }
  }

  // 2. Fill any remaining slots up to exact count with a balanced mix of Med-Surg templates
  const fallbackMedSurg = filterTemplatesByDiff(
    ALL_QUESTION_TEMPLATES.filter(
      (t) => t.category !== "critical-care" && t.category !== "multi-step",
    ),
  ).sort(() => rng() - 0.5);

  let fallbackIdx = 0;
  while (selectedTemplates.length < count && fallbackMedSurg.length > 0) {
    selectedTemplates.push(fallbackMedSurg[fallbackIdx % fallbackMedSurg.length]);
    fallbackIdx++;
  }

  // Trim to exact count if rounding slightly overshot
  const finalTemplates = selectedTemplates.slice(0, count).sort(() => rng() - 0.5);
  const instances = finalTemplates.map((t) => createQuestionInstance(t, rng));
  const clientViews = instances.map(toClientView);

  return { instances, clientViews };
}

/**
 * Critical Care & ICU Exam generator.
 * Emphasizes high-acuity vasoactive drips, heparin protocols, insulin drips, and multi-step ICU math.
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
  const icuTargets: { category: MedMathCategory; weight: number }[] = [
    { category: "critical-care", weight: 0.40 }, // ~8 in 20
    { category: "multi-step", weight: 0.20 },    // ~4 in 20
    { category: "heparin", weight: 0.15 },       // ~3 in 20
    { category: "insulin", weight: 0.10 },       // ~2 in 20
    { category: "weight-based", weight: 0.10 },  // ~2 in 20
    { category: "electrolytes", weight: 0.05 },  // ~1 in 20
  ];

  const selectedTemplates: QuestionTemplate[] = [];

  for (const item of icuTargets) {
    const quota = Math.max(1, Math.round(count * item.weight));
    const catTemplates = ALL_QUESTION_TEMPLATES.filter((t) => t.category === item.category);
    const shuffled = [...catTemplates].sort(() => rng() - 0.5);

    for (let i = 0; i < quota && selectedTemplates.length < count; i++) {
      selectedTemplates.push(shuffled[i % shuffled.length]);
    }
  }

  const fallbackICU = ALL_QUESTION_TEMPLATES.filter(
    (t) => t.category === "critical-care" || t.category === "multi-step" || t.category === "heparin",
  ).sort(() => rng() - 0.5);

  let fallbackIdx = 0;
  while (selectedTemplates.length < count && fallbackICU.length > 0) {
    selectedTemplates.push(fallbackICU[fallbackIdx % fallbackICU.length]);
    fallbackIdx++;
  }

  const finalTemplates = selectedTemplates.slice(0, count).sort(() => rng() - 0.5);
  const instances = finalTemplates.map((t) => createQuestionInstance(t, rng));
  const clientViews = instances.map(toClientView);

  return { instances, clientViews };
}

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

  // Custom Exam mode
  const eligibleTemplates = selectTemplatesForFilter({ categories, difficulty });
  const shuffled = [...eligibleTemplates].sort(() => rng() - 0.5);

  const selectedTemplates: QuestionTemplate[] = [];
  while (selectedTemplates.length < count && shuffled.length > 0) {
    for (const t of shuffled) {
      if (selectedTemplates.length >= count) break;
      selectedTemplates.push(t);
    }
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

  const isCorrect = checkAnswerCorrectness({
    submitted: submission.submittedAnswer,
    expected: targetInstance.expectedAnswer,
    mode: targetInstance.roundingMode,
    tolerance: targetInstance.tolerance,
  });

  const formattedAnswer = formatAnswer(
    targetInstance.expectedAnswer,
    targetInstance.roundingMode,
  );

  return {
    attemptId: generateUUID(),
    instanceId: targetInstance.instanceId,
    isCorrect,
    attemptNumber: submission.attemptNumber,
    feedback: isCorrect
      ? "Correct"
      : "Not quite.",
    solutionSteps: isCorrect || submission.solutionRevealed ? targetInstance.solutionSteps : undefined,
    expectedAnswer: isCorrect || submission.solutionRevealed ? formattedAnswer : undefined,
    expectedUnit: targetInstance.expectedUnit,
  };
}
