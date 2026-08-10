import type { IQQuestion, QuestionCategory } from "./questions";

export const difficultyWeights = {
  1: 1,
  2: 1.25,
  3: 1.6,
  4: 2,
  5: 2.5,
} as const;

export interface ScoreBand {
  upperBound: number;
  minimum: number;
  maximum: number;
}

export const scoreBands: readonly ScoreBand[] = [
  { upperBound: 0.1, minimum: 32, maximum: 39 },
  { upperBound: 0.2, minimum: 40, maximum: 49 },
  { upperBound: 0.3, minimum: 50, maximum: 59 },
  { upperBound: 0.4, minimum: 60, maximum: 69 },
  { upperBound: 0.48, minimum: 70, maximum: 79 },
  { upperBound: 0.56, minimum: 80, maximum: 89 },
  { upperBound: 0.64, minimum: 90, maximum: 99 },
  { upperBound: 0.7, minimum: 100, maximum: 105 },
  { upperBound: 0.76, minimum: 106, maximum: 110 },
  { upperBound: 0.82, minimum: 111, maximum: 115 },
  { upperBound: 0.87, minimum: 116, maximum: 119 },
  { upperBound: 0.92, minimum: 120, maximum: 122 },
  { upperBound: 0.96, minimum: 123, maximum: 125 },
  { upperBound: 1, minimum: 126, maximum: 128 },
] as const;

function normalizePerformance(performance: number) {
  return Number.isFinite(performance)
    ? Math.max(0, Math.min(1, performance))
    : 0;
}

export function scoreBandForPerformance(performance: number): ScoreBand {
  const normalizedPerformance = normalizePerformance(performance);
  if (normalizedPerformance === 1) {
    return { upperBound: 1, minimum: 129, maximum: 129 };
  }

  return (
    scoreBands.find(({ upperBound }) => normalizedPerformance < upperBound) ??
    scoreBands[scoreBands.length - 1]
  );
}

export interface ScoredAttempt {
  correctCount: number;
  weightedPerformance: number;
  weightedPointsEarned: number;
  totalWeightedPoints: number;
  iqScore: number;
  categoryAccuracy: Record<QuestionCategory, number>;
  strongestCategory: QuestionCategory;
  mostChallengingCategory: QuestionCategory;
  missed: IQQuestion[];
}

export function iqScoreFromPerformance(
  performance: number,
  randomSource: () => number = Math.random,
) {
  const band = scoreBandForPerformance(performance);
  if (band.minimum === 129) return 129;
  const randomValue = Math.max(
    0,
    Math.min(1 - Number.EPSILON, randomSource()),
  );
  return (
    band.minimum +
    Math.floor(randomValue * (band.maximum - band.minimum + 1))
  );
}

export function performanceLabel(score: number) {
  if (score <= 49) return "Statistically concerning.";
  if (score <= 69) return "The comeback starts now.";
  if (score <= 84) return "Probability was not your friend.";
  if (score <= 94) return "Respectable survival.";
  if (score <= 104) return "Brain operating normally.";
  if (score <= 114) return "Suspiciously competent.";
  if (score <= 119) return "Very strong.";
  if (score <= 124) return "Okay, you're actually good at this.";
  if (score <= 128) return "Ridiculous.";
  return "Perfect.";
}

export function scoreAttempt(
  questions: IQQuestion[],
  answers: Record<number, string>,
  randomSource: () => number = Math.random,
): ScoredAttempt {
  const categories: QuestionCategory[] = [
    "probability",
    "logic",
    "patterns",
    "quantitative",
    "spatial",
  ];
  const categoryTotals = Object.fromEntries(
    categories.map((category) => [category, { correct: 0, total: 0 }]),
  ) as Record<QuestionCategory, { correct: number; total: number }>;

  let weightedPointsEarned = 0;
  let totalWeightedPoints = 0;
  let correctCount = 0;
  const missed: IQQuestion[] = [];

  for (const question of questions) {
    const weight = difficultyWeights[question.difficulty];
    const isCorrect = answers[question.id] === question.correctAnswer;
    totalWeightedPoints += weight;
    categoryTotals[question.category].total += 1;
    if (isCorrect) {
      correctCount += 1;
      weightedPointsEarned += weight;
      categoryTotals[question.category].correct += 1;
    } else {
      missed.push(question);
    }
  }

  const weightedPerformance = weightedPointsEarned / totalWeightedPoints;
  const iqScore = iqScoreFromPerformance(weightedPerformance, randomSource);
  const categoryAccuracy = Object.fromEntries(
    categories.map((category) => [
      category,
      categoryTotals[category].correct / categoryTotals[category].total,
    ]),
  ) as Record<QuestionCategory, number>;
  const rankedCategories = [...categories].sort(
    (a, b) => categoryAccuracy[b] - categoryAccuracy[a],
  );

  return {
    correctCount,
    weightedPerformance,
    weightedPointsEarned,
    totalWeightedPoints,
    iqScore,
    categoryAccuracy,
    strongestCategory: rankedCategories[0],
    mostChallengingCategory: rankedCategories.at(-1) ?? rankedCategories[0],
    missed: missed.sort(
      (a, b) => b.difficulty - a.difficulty || b.id - a.id,
    ),
  };
}
