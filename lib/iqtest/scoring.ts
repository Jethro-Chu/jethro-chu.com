import type { IQQuestion, QuestionCategory } from "./questions";

export const difficultyWeights = {
  1: 1,
  2: 1.25,
  3: 1.6,
  4: 2,
  5: 2.5,
} as const;

const scoreAnchors = [
  [0.35, 70],
  [0.45, 80],
  [0.55, 90],
  [0.65, 100],
  [0.72, 109],
  [0.8, 118],
  [0.86, 123],
  [0.92, 126],
  [0.96, 130],
  [1, 134],
] as const;

export interface ScoredAttempt {
  correctCount: number;
  weightedAccuracy: number;
  weightedPointsEarned: number;
  totalWeightedPoints: number;
  iqScore: number;
  percentile: number;
  categoryAccuracy: Record<QuestionCategory, number>;
  strongestCategory: QuestionCategory;
  mostChallengingCategory: QuestionCategory;
  missed: IQQuestion[];
}

export function iqScoreFromAccuracy(accuracy: number) {
  if (accuracy <= scoreAnchors[0][0]) return 70;

  for (let index = 1; index < scoreAnchors.length; index += 1) {
    const [rightAccuracy, rightScore] = scoreAnchors[index];
    const [leftAccuracy, leftScore] = scoreAnchors[index - 1];
    if (accuracy <= rightAccuracy) {
      const position =
        (accuracy - leftAccuracy) / (rightAccuracy - leftAccuracy);
      return Math.round(leftScore + position * (rightScore - leftScore));
    }
  }

  return 134;
}

function erf(value: number) {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y =
    1 -
    (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) *
      Math.exp(-x * x);
  return sign * y;
}

export function approximatePercentile(score: number) {
  const z = (score - 100) / 15;
  const percentile = 50 * (1 + erf(z / Math.sqrt(2)));
  return Math.max(1, Math.min(99, Math.round(percentile)));
}

export function performanceLabel(score: number) {
  if (score < 90) return "Developing";
  if (score < 100) return "Solid";
  if (score < 110) return "Above Average";
  if (score < 120) return "Strong";
  if (score < 130) return "Very Strong";
  if (score < 138) return "Exceptional";
  return "Extraordinary";
}

export function performanceMessage(correctCount: number, score: number) {
  if (correctCount === 25) return "Okay, you win.";
  if (correctCount >= 24)
    return "Either you are frighteningly good at this, or the no-Googling rule meant nothing to you.";
  if (score >= 130) return "Okay. That was actually impressive.";
  if (score >= 120)
    return "You should probably stop taking internet IQ tests while you are ahead.";
  if (score >= 110) return "Suspiciously competent.";
  if (score >= 90)
    return "Your brain appears to be functioning within acceptable parameters.";
  return "Probability may have won this round.";
}

export function scoreAttempt(
  questions: IQQuestion[],
  answers: Record<number, string>,
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

  const weightedAccuracy = weightedPointsEarned / totalWeightedPoints;
  const iqScore = iqScoreFromAccuracy(weightedAccuracy);
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
    weightedAccuracy,
    weightedPointsEarned,
    totalWeightedPoints,
    iqScore,
    percentile: approximatePercentile(iqScore),
    categoryAccuracy,
    strongestCategory: rankedCategories[0],
    mostChallengingCategory: rankedCategories.at(-1) ?? rankedCategories[0],
    missed: missed.sort(
      (a, b) => b.difficulty - a.difficulty || b.id - a.id,
    ),
  };
}
