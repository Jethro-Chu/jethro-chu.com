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
  if (!Number.isFinite(question.correctAnswer)) {
    throw new Error(`Invalid stored correctAnswer: ${question.correctAnswer}`);
  }
  if (
    !Number.isInteger(question.answerPrecision) ||
    question.answerPrecision < 0
  ) {
    throw new Error(
      `Invalid stored answerPrecision: ${question.answerPrecision}`,
    );
  }

  if (typeof userAnswer === "string") {
    userAnswer = userAnswer.trim().replace(/,/g, "");
    if (!userAnswer) return false;
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
  if (!Number.isFinite(value)) {
    throw new Error(`Cannot format invalid stored answer: ${value}`);
  }
  if (!Number.isInteger(precision) || precision < 0) {
    throw new Error(`Cannot format answer with invalid precision: ${precision}`);
  }
  return value.toFixed(precision);
}
