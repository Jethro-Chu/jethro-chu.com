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
}: {
  categories?: MedMathCategory[];
  difficulty?: PracticeDifficultySelection;
}): QuestionTemplate[] {
  let list = ALL_QUESTION_TEMPLATES;

  if (categories && categories.length > 0) {
    const set = new Set(categories);
    list = list.filter((t) => set.has(t.category));
  }

  if (difficulty && difficulty !== "mixed") {
    list = list.filter((t) => t.difficulty === difficulty);
  }

  return list.length > 0 ? list : ALL_QUESTION_TEMPLATES;
}

export function generateRandomQuestion({
  categories,
  difficulty,
  excludeTemplateIds = [],
  rng = Math.random,
}: {
  categories?: MedMathCategory[];
  difficulty?: PracticeDifficultySelection;
  excludeTemplateIds?: string[];
  rng?: () => number;
}): { instance: QuestionInstance; clientView: QuestionClientView } {
  let candidates = selectTemplatesForFilter({ categories, difficulty });
  
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

export function generateExamQuestionSet({
  categories,
  difficulty,
  count = 20,
  rng = Math.random,
}: {
  categories?: MedMathCategory[];
  difficulty?: PracticeDifficultySelection;
  count?: number;
  rng?: () => number;
}): { instances: QuestionInstance[]; clientViews: QuestionClientView[] } {
  const eligibleTemplates = selectTemplatesForFilter({ categories, difficulty });
  const shuffled = [...eligibleTemplates].sort(() => rng() - 0.5);

  const selectedTemplates: QuestionTemplate[] = [];
  while (selectedTemplates.length < count) {
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
