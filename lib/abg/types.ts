export const ABG_DISORDERS = [
  "Normal",
  "Respiratory Acidosis",
  "Respiratory Alkalosis",
  "Metabolic Acidosis",
  "Metabolic Alkalosis",
  "Mixed Disorder",
] as const;

export const ABG_COMPENSATIONS = [
  "Uncompensated",
  "Partially Compensated",
  "Fully Compensated",
  "Mixed / Not Applicable",
] as const;

export type ABGDisorder = (typeof ABG_DISORDERS)[number];
export type ABGCompensation = (typeof ABG_COMPENSATIONS)[number];
export type ABGDifficulty = "beginner" | "intermediate";
export type ABGMode = "ranked" | "practice" | "survival";
export type ABGCategory = "respiratory" | "metabolic" | "compensation" | "normal";

export type ABGValues = {
  ph: number;
  paco2: number;
  hco3: number;
};

export type ABGInterpretation = {
  disorder: ABGDisorder;
  compensation: ABGCompensation;
  label: string;
  explanation: string[];
};

export type ABGQuestion = ABGValues & {
  id: string;
  disorder: ABGDisorder;
  compensation: ABGCompensation;
  difficulty: ABGDifficulty;
  difficultyRating: number;
  category: ABGCategory;
};

export type PublicABGQuestion = ABGValues & {
  id: string;
  difficulty: ABGDifficulty;
  number: number;
  total: number | null;
};

export type ABGAnswer = {
  disorder: ABGDisorder;
  compensation: ABGCompensation;
};

export type ABGPlayer = {
  id: string;
  displayName: string;
  rating: number;
  rankedQuestionsAnswered: number;
  rankedQuestionsCorrect: number;
  totalQuestionsAnswered: number;
  totalQuestionsCorrect: number;
  currentStreak: number;
  bestStreak: number;
  survivalBest: number;
  totalResponseTimeMs: number;
  rankedGamesCompleted: number;
  practiceQuestionsCompleted: number;
  categoryStats: Record<string, { answered: number; correct: number }>;
  ratingHistory: Array<{ rating: number; at: string }>;
  activeSessionId?: string;
  createdAt: string;
  updatedAt: string;
};

export type ABGSession = {
  id: string;
  playerId: string;
  mode: ABGMode;
  questions: ABGQuestion[];
  currentIndex: number;
  correct: number;
  incorrect: number;
  currentStreak: number;
  bestStreak: number;
  totalResponseTimeMs: number;
  startingRating: number;
  endingRating: number;
  completed: boolean;
  practiceDifficulty?: "beginner" | "intermediate" | "all";
  practiceCategory?: "respiratory" | "metabolic" | "compensation" | "all";
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
};
