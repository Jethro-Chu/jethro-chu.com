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
    const text = userAnswer.trim();
    // Accept decimal notation, correctly grouped thousands, or simple fractions.
    // Number() alone would also accept hexadecimal and scientific notation.
    if (/^\d+\/\d+$/.test(text)) {
      const [numerator, denominator] = text.split("/").map(Number);
      if (!denominator) return false;
      userAnswer = numerator / denominator;
    } else {
      if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(text)) return false;
      // Reinforce safe medication notation: leading zero, no trailing zeros.
      if (text.includes(".") && text.endsWith("0")) return false;
      userAnswer = Number(text.replace(/,/g, ""));
    }
  }

  if (!Number.isFinite(userAnswer) || userAnswer < 0) return false;
  // Grade the entered value, not a silently rounded version of the response.
  const expected = roundTo(question.correctAnswer, question.answerPrecision);
  return Math.abs(userAnswer - expected) <= Number.EPSILON * Math.max(1, Math.abs(expected)) * 4;
}

/**
 * Formats the rounded answer with a leading zero and no trailing zeros.
 */
export function formatAnswer(value: number, precision: number): string {
  if (!Number.isFinite(value)) {
    throw new Error(`Cannot format invalid stored answer: ${value}`);
  }
  if (!Number.isInteger(precision) || precision < 0) {
    throw new Error(`Cannot format answer with invalid precision: ${precision}`);
  }
  return String(Number(roundTo(value, precision).toFixed(precision)));
}
