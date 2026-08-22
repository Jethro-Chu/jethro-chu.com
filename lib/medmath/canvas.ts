export const CANVAS_QUESTION_COUNT = 30;

export function isCanvasCompetencyPass(
  correctCount: number,
  totalQuestions = CANVAS_QUESTION_COUNT,
) {
  return totalQuestions === CANVAS_QUESTION_COUNT && correctCount === totalQuestions;
}
