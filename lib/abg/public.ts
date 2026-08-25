import type { ABGPlayer } from "./types.ts";

export function publicPlayer(player: ABGPlayer, rank: number | null = null) {
  const accuracy = player.rankedQuestionsAnswered
    ? player.rankedQuestionsCorrect / player.rankedQuestionsAnswered
    : 0;
  const averageResponseTimeMs = player.totalQuestionsAnswered
    ? Math.round(player.totalResponseTimeMs / player.totalQuestionsAnswered)
    : 0;
  return {
    displayName: player.displayName,
    rating: player.rating,
    rank,
    accuracy,
    rankedQuestionsAnswered: player.rankedQuestionsAnswered,
    rankedQuestionsCorrect: player.rankedQuestionsCorrect,
    totalQuestionsAnswered: player.totalQuestionsAnswered,
    totalQuestionsCorrect: player.totalQuestionsCorrect,
    currentStreak: player.currentStreak,
    bestStreak: player.bestStreak,
    survivalBest: player.survivalBest,
    averageResponseTimeMs,
    rankedGamesCompleted: player.rankedGamesCompleted,
    practiceQuestionsCompleted: player.practiceQuestionsCompleted,
    categoryStats: player.categoryStats,
    ratingHistory: player.ratingHistory,
    activeSessionId: player.activeSessionId,
  };
}

