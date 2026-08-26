export type MedMathCategory =
  | "conversions"
  | "basic-dosage"
  | "iv-pump"
  | "gravity-drips"
  | "infusion-time"
  | "insulin"
  | "weight-based"
  | "heparin"
  | "anticoagulants"
  | "critical-care"
  | "multi-step"
  | "concentrations"
  | "reconstitution"
  | "electrolytes";

export type MedMathDifficulty =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "critical-care";

export type PracticeDifficultySelection =
  | MedMathDifficulty
  | "mixed";

export type ExamCategorySelection =
  | "all"
  | "med-surg"
  | "critical-care"
  | "custom";

export type ExamMode =
  | "nursing-med-math"
  | "critical-care"
  | "custom";

export type RegularExamDifficulty =
  | "basic"
  | "standard"
  | "hard"
  | "mixed";

export type QuestionResponseType =
  | "numeric"
  | "multiple-choice"
  | "select-all";

export type QuestionKind = "calculation" | "knowledge" | "clinical-application";

export interface QuestionOption {
  id: string;
  label: string;
}

export interface ExamQuestionReview {
  instanceId: string;
  templateId: string;
  category: MedMathCategory;
  categoryName: string;
  subtype: string;
  difficulty: MedMathDifficulty;
  title: string;
  clinicalContext?: string;
  scenario: string;
  orderText: string;
  availableText?: string;
  patientWeightKg?: number;
  patientWeightLb?: number;
  prompt: string;
  answerUnit: string;
  answerPrecision: number;
  roundingInstruction?: string;
  responseType?: QuestionResponseType;
  questionKind?: QuestionKind;
  options?: QuestionOption[];
  correctAnswerLabel?: string;
  tags?: string[];
  safetyPearl?: string;
  studentAnswer: string;
  correctAnswer: number;
  isCorrect: boolean;
  solutionSteps: SolutionStep[];
}

export interface CategoryMeta {
  id: MedMathCategory;
  name: string;
  shortName: string;
  description: string;
  track: "med-surg" | "critical-care";
  defaultUnit: string;
}

export interface SolutionStep {
  stepNumber: number;
  title: string;
  formula?: string;
  calculation: string;
  explanation?: string;
  result: string;
}

export interface QuestionTemplate {
  id: string;
  category: MedMathCategory;
  subtype: string;
  difficulty: MedMathDifficulty;
  title: string;
  clinicalContext?: string;
  generate: (rng: () => number) => GeneratedQuestionData;
}

/**
 * A complete numeric question stored in the production question bank.
 * Runtime selection and grading consume this object directly; generators are
 * development-only inputs used to materialize this bank ahead of time.
 */
export interface StoredNumericQuestion extends GeneratedQuestionData {
  id: string;
  category: MedMathCategory;
  subtype: string;
  difficulty: MedMathDifficulty;
  title: string;
  clinicalContext?: string;
}

export interface GeneratedQuestionData {
  scenario: string;
  orderText: string;
  availableText?: string;
  patientWeightKg?: number;
  patientWeightLb?: number;
  prompt: string;
  correctAnswer: number;
  answerUnit: string;
  answerPrecision: number;
  roundingInstruction?: string;
  responseType?: QuestionResponseType;
  questionKind?: QuestionKind;
  options?: QuestionOption[];
  correctAnswerLabel?: string;
  tags?: string[];
  safetyPearl?: string;
  hints: string[];
  solutionSteps: SolutionStep[];
  rawVariables: Record<string, unknown>;
}

export interface QuestionInstance {
  instanceId: string;
  templateId: string;
  category: MedMathCategory;
  subtype: string;
  difficulty: MedMathDifficulty;
  title: string;
  clinicalContext?: string;
  scenario: string;
  orderText: string;
  availableText?: string;
  patientWeightKg?: number;
  patientWeightLb?: number;
  prompt: string;
  correctAnswer: number;
  answerUnit: string;
  answerPrecision: number;
  roundingInstruction?: string;
  responseType: QuestionResponseType;
  questionKind: QuestionKind;
  options?: QuestionOption[];
  correctAnswerLabel?: string;
  tags: string[];
  safetyPearl?: string;
  hints: string[];
  solutionSteps: SolutionStep[];
  rawVariables: Record<string, unknown>;
  createdAt: string;
}

export interface QuestionClientView {
  instanceId: string;
  templateId: string;
  category: MedMathCategory;
  categoryName: string;
  subtype: string;
  difficulty: MedMathDifficulty;
  title: string;
  clinicalContext?: string;
  scenario: string;
  orderText: string;
  availableText?: string;
  patientWeightKg?: number;
  patientWeightLb?: number;
  prompt: string;
  answerUnit: string;
  answerPrecision: number;
  roundingInstruction?: string;
  responseType: QuestionResponseType;
  questionKind: QuestionKind;
  options?: QuestionOption[];
  tags: string[];
}

export interface AttemptSubmission {
  instanceId: string;
  sessionId: string;
  attemptNumber: number;
  submittedAnswer: string;
  responseTimeSeconds: number;
  hintsUsedCount: number;
  solutionRevealed: boolean;
}

export interface AttemptResult {
  attemptId: string;
  instanceId: string;
  isCorrect: boolean;
  attemptNumber: number;
  feedback: string;
  solutionSteps?: SolutionStep[];
  correctAnswer?: number;
  correctAnswerLabel?: string;
  answerUnit?: string;
  answerPrecision?: number;
  safetyPearl?: string;
}

export type SessionType = "practice" | "exam" | "study-exam" | "adaptive";

export interface SessionConfig {
  sessionType: SessionType;
  selectedCategories: MedMathCategory[];
  selectedDifficulty: PracticeDifficultySelection;
  questionCount: number;
  isAdaptive?: boolean;
  additionalMedicationTopics?: Array<"insulin" | "anticoagulants">;
}

export interface StoredSession {
  sessionId: string;
  visitorId: string;
  sessionType: SessionType;
  selectedCategories: MedMathCategory[];
  selectedDifficulty: PracticeDifficultySelection;
  plannedQuestionCount: number;
  completedQuestionCount: number;
  startedAt: string;
  completedAt?: string;
  isCompleted: boolean;
  totalAttempts: number;
  firstAttemptCorrectCount: number;
  eventualCorrectCount: number;
  totalHintsUsed: number;
  totalSolutionsRevealed: number;
  averageResponseTimeSeconds: number;
  categoryBreakdown: Record<string, {
    totalQuestions: number;
    firstAttemptCorrect: number;
    eventualCorrect: number;
    totalAttempts: number;
    averageResponseTimeSeconds: number;
  }>;
  difficultyBreakdown: Record<string, {
    totalQuestions: number;
    firstAttemptCorrect: number;
    eventualCorrect: number;
    totalAttempts: number;
    averageResponseTimeSeconds: number;
  }>;
  weakCategories: MedMathCategory[];
  additionalMedicationTopics?: Array<"insulin" | "anticoagulants">;
  examMode?: ExamMode;
  examReview?: ExamQuestionReview[];
  isInvalidated?: boolean;
  invalidationReason?: string;
}

export interface StoredAttemptRecord {
  attemptId: string;
  sessionId: string;
  instanceId: string;
  templateId: string;
  category: MedMathCategory;
  subtype: string;
  questionKind?: QuestionKind;
  difficulty: MedMathDifficulty;
  attemptNumber: number;
  submittedAnswer: string;
  isCorrect: boolean;
  responseTimeSeconds: number;
  hintsUsedCount: number;
  solutionRevealed: boolean;
  timestamp: string;
}

export interface CategorySummaryStat {
  category: MedMathCategory;
  name: string;
  track: "med-surg" | "critical-care";
  totalQuestions: number;
  totalAttempts: number;
  firstAttemptAccuracy: number;
  eventualAccuracy: number;
  medianResponseTimeSeconds: number;
  hintUsageRate: number;
}

export interface DifficultySummaryStat {
  difficulty: MedMathDifficulty;
  totalQuestions: number;
  totalAttempts: number;
  firstAttemptAccuracy: number;
  eventualAccuracy: number;
  medianResponseTimeSeconds: number;
}

export interface SubtypeSummaryStat {
  subtype: string;
  category: MedMathCategory;
  title: string;
  totalAttempts: number;
  firstAttemptAccuracy: number;
  eventualAccuracy: number;
  medianResponseTimeSeconds: number;
}

export interface AttemptsDistribution {
  firstAttemptPercent: number;
  secondAttemptPercent: number;
  thirdOrLaterPercent: number;
  afterHintPercent: number;
  solutionRevealedPercent: number;
}

export interface TimeRangeTrendPoint {
  date: string;
  questionsPracticed: number;
  firstAttemptAccuracy: number;
}

export interface PublicMedMathData {
  summary: {
    totalQuestionsAnswered: number;
    totalPracticeSessions: number;
    firstAttemptAccuracy: number;
    eventualAccuracy: number;
    medianResponseTimeSeconds: number;
  };
  categories: CategorySummaryStat[];
  hardestTopics: CategorySummaryStat[];
  mostMissedSubtypes: SubtypeSummaryStat[];
  difficulties: DifficultySummaryStat[];
  attemptsDistribution: AttemptsDistribution;
  hintStats: {
    overallHintUsageRate: number;
    topHintCategories: { category: MedMathCategory; name: string; rate: number }[];
  };
  trackComparison: {
    medSurg: {
      questionsAttempted: number;
      firstAttemptAccuracy: number;
      eventualAccuracy: number;
      medianResponseTimeSeconds: number;
    };
    criticalCare: {
      questionsAttempted: number;
      firstAttemptAccuracy: number;
      eventualAccuracy: number;
      medianResponseTimeSeconds: number;
    };
  };
  timeSeries: TimeRangeTrendPoint[];
  lastUpdated: string;
}
