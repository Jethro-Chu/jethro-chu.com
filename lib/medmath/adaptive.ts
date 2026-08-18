import { MEDMATH_CATEGORIES } from "./categories.ts";
import type { MedMathCategory, MedMathDifficulty } from "./types.ts";

export interface AdaptiveState {
  currentDifficulty: MedMathDifficulty;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  categoryMissCounts: Record<MedMathCategory, number>;
  categoryCorrectCounts: Record<MedMathCategory, number>;
  history: Array<{
    category: MedMathCategory;
    difficulty: MedMathDifficulty;
    isCorrectFirstTry: boolean;
  }>;
}

export function createInitialAdaptiveState(
  initialDifficulty: MedMathDifficulty = "intermediate",
): AdaptiveState {
  const categoryMissCounts = Object.fromEntries(
    MEDMATH_CATEGORIES.map((c) => [c.id, 0]),
  ) as Record<MedMathCategory, number>;

  const categoryCorrectCounts = Object.fromEntries(
    MEDMATH_CATEGORIES.map((c) => [c.id, 0]),
  ) as Record<MedMathCategory, number>;

  return {
    currentDifficulty: initialDifficulty,
    consecutiveCorrect: 0,
    consecutiveIncorrect: 0,
    categoryMissCounts,
    categoryCorrectCounts,
    history: [],
  };
}

const DIFFICULTY_LEVELS: MedMathDifficulty[] = [
  "beginner",
  "intermediate",
  "advanced",
  "critical-care",
];

export function updateAdaptiveState(
  state: AdaptiveState,
  category: MedMathCategory,
  difficulty: MedMathDifficulty,
  isCorrectFirstTry: boolean,
): AdaptiveState {
  const next = { ...state };
  next.history = [...state.history, { category, difficulty, isCorrectFirstTry }];

  if (isCorrectFirstTry) {
    next.consecutiveCorrect += 1;
    next.consecutiveIncorrect = 0;
    next.categoryCorrectCounts[category] = (next.categoryCorrectCounts[category] || 0) + 1;

    // 3 consecutive first-try correct answers moves difficulty up one level
    if (next.consecutiveCorrect >= 3) {
      const currIdx = DIFFICULTY_LEVELS.indexOf(next.currentDifficulty);
      if (currIdx < DIFFICULTY_LEVELS.length - 1) {
        next.currentDifficulty = DIFFICULTY_LEVELS[currIdx + 1];
      }
      next.consecutiveCorrect = 0;
    }
  } else {
    next.consecutiveIncorrect += 1;
    next.consecutiveCorrect = 0;
    next.categoryMissCounts[category] = (next.categoryMissCounts[category] || 0) + 1;

    // 2 consecutive misses moves difficulty down one level
    if (next.consecutiveIncorrect >= 2) {
      const currIdx = DIFFICULTY_LEVELS.indexOf(next.currentDifficulty);
      if (currIdx > 0) {
        next.currentDifficulty = DIFFICULTY_LEVELS[currIdx - 1];
      }
      next.consecutiveIncorrect = 0;
    }
  }

  return next;
}

export function pickAdaptiveCategory(
  state: AdaptiveState,
  allowedCategories: MedMathCategory[] = MEDMATH_CATEGORIES.map((c) => c.id),
  rng: () => number = Math.random,
): MedMathCategory {
  if (allowedCategories.length === 1) return allowedCategories[0];

  // Weight categories based on miss frequency vs correct frequency
  const weights: number[] = allowedCategories.map((cat) => {
    const misses = state.categoryMissCounts[cat] || 0;
    const correct = state.categoryCorrectCounts[cat] || 0;
    // Base weight 2, each miss adds +3, each correct subtracts 0.5 (minimum 1)
    const weight = Math.max(1, 2 + misses * 3 - correct * 0.5);
    return weight;
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let randomVal = rng() * totalWeight;

  for (let i = 0; i < allowedCategories.length; i++) {
    if (randomVal < weights[i]) {
      return allowedCategories[i];
    }
    randomVal -= weights[i];
  }

  return allowedCategories[0];
}
