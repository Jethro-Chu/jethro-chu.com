export function expectedScore(playerRating: number, questionRating: number): number {
  return 1 / (1 + 10 ** ((questionRating - playerRating) / 400));
}

export function calculateRatingChange(
  playerRating: number,
  questionRating: number,
  correct: boolean,
  kFactor = 24,
): number {
  const raw = kFactor * ((correct ? 1 : 0) - expectedScore(playerRating, questionRating));
  return Math.max(-24, Math.min(24, Math.round(raw)));
}

export function applyRatingChange(rating: number, change: number): number {
  return Math.max(400, rating + change);
}

