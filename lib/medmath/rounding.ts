/**
 * Precise clinical decimal rounding helper using Number.EPSILON to prevent floating-point inaccuracies.
 */
export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Deterministic answer grading comparing user's numeric input to the question's stored correctAnswer
 * using the question's specified decimal precision.
 */
export function gradeAnswer(
  question: { correctAnswer: number; answerPrecision: number },
  userAnswer: string | number,
): boolean {
  if (typeof userAnswer === "string") {
    userAnswer = userAnswer.trim().replace(/,/g, "");
    // Support simple fractions like "1/2" or "3/4"
    if (/^\d+\/\d+$/.test(userAnswer)) {
      const [num, den] = userAnswer.split("/").map(Number);
      if (den && den !== 0) {
        userAnswer = num / den;
      }
    }
  }

  const user = Number(userAnswer);

  if (!Number.isFinite(user)) return false;

  return (
    roundTo(user, question.answerPrecision) ===
    roundTo(question.correctAnswer, question.answerPrecision)
  );
}

/**
 * Formats a numeric answer to a clean string with exact precision.
 */
export function formatAnswer(value: number, precision: number): string {
  if (!Number.isFinite(value)) return "0";
  return value.toFixed(precision);
}
