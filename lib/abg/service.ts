import { randomUUID } from "node:crypto";
import { generateABGQuestion, generateABGSet } from "./generator.ts";
import { interpretABG } from "./engine.ts";
import { applyRatingChange, calculateRatingChange } from "./rating.ts";
import {
  claimAttempt,
  getPlayer,
  getRank,
  getSession,
  replaceDisplayName,
  reserveDisplayName,
  saveAttempt,
  savePlayer,
  saveSession,
} from "./store.ts";
import type {
  ABGAnswer,
  ABGMode,
  ABGPlayer,
  ABGQuestion,
  ABGSession,
  PublicABGQuestion,
} from "./types.ts";

const BLOCKED_NAME_PARTS = ["admin", "moderator", "fuck", "shit", "bitch", "nigger", "nazi"];

export function validateDisplayName(raw: unknown): { ok: true; name: string } | { ok: false; error: string } {
  if (typeof raw !== "string") return { ok: false, error: "Enter a display name." };
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 20) return { ok: false, error: "Use 2 to 20 characters." };
  if (!/^[\p{L}\p{N} _.'-]+$/u.test(name)) return { ok: false, error: "Use letters, numbers, spaces, apostrophes, periods, or hyphens." };
  const normalized = name.toLocaleLowerCase("en-US");
  if (BLOCKED_NAME_PARTS.some((part) => normalized.includes(part))) return { ok: false, error: "Choose a different display name." };
  return { ok: true, name };
}

export async function createPlayer(displayName: unknown): Promise<ABGPlayer> {
  const validation = validateDisplayName(displayName);
  if (!validation.ok) throw new Error(validation.error);
  const id = randomUUID();
  if (!await reserveDisplayName(validation.name, id)) throw new Error("That ABG name is already taken.");
  const now = new Date().toISOString();
  const player: ABGPlayer = {
    id,
    displayName: validation.name,
    rating: 1000,
    rankedQuestionsAnswered: 0,
    rankedQuestionsCorrect: 0,
    totalQuestionsAnswered: 0,
    totalQuestionsCorrect: 0,
    currentStreak: 0,
    bestStreak: 0,
    survivalBest: 0,
    totalResponseTimeMs: 0,
    rankedGamesCompleted: 0,
    practiceQuestionsCompleted: 0,
    categoryStats: {},
    ratingHistory: [{ rating: 1000, at: now }],
    createdAt: now,
    updatedAt: now,
  };
  await savePlayer(player);
  return player;
}

export async function updateDisplayName(playerId: string, displayName: unknown): Promise<ABGPlayer> {
  const validation = validateDisplayName(displayName);
  if (!validation.ok) throw new Error(validation.error);
  const player = await getPlayer(playerId);
  if (!player) throw new Error("Player not found.");
  if (!await replaceDisplayName(player.displayName, validation.name, player.id)) throw new Error("That ABG name is already taken.");
  player.displayName = validation.name;
  player.updatedAt = new Date().toISOString();
  await savePlayer(player);
  return player;
}

function shuffle<T>(values: T[]): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

export async function startSession(
  playerId: string,
  mode: ABGMode,
  options: { difficulty?: "beginner" | "intermediate" | "all"; category?: "respiratory" | "metabolic" | "compensation" | "all" } = {},
): Promise<{ session: ABGSession; question: PublicABGQuestion }> {
  const player = await getPlayer(playerId);
  if (!player) throw new Error("Player not found.");
  let questions: ABGQuestion[];
  if (mode === "ranked") {
    questions = shuffle([
      ...generateABGSet(9, { difficulty: "beginner" }),
      ...generateABGSet(11, { difficulty: "intermediate" }),
    ]);
  } else if (mode === "practice") {
    questions = generateABGSet(20, { difficulty: options.difficulty ?? "all", category: options.category ?? "all" });
  } else {
    questions = [generateABGQuestion({ survivalLevel: 0 })];
  }
  const now = new Date().toISOString();
  const session: ABGSession = {
    id: randomUUID(), playerId, mode, questions, currentIndex: 0, correct: 0, incorrect: 0,
    currentStreak: 0, bestStreak: 0, totalResponseTimeMs: 0, startingRating: player.rating,
    endingRating: player.rating, completed: false, practiceDifficulty: options.difficulty,
    practiceCategory: options.category, startedAt: now, updatedAt: now,
  };
  player.activeSessionId = session.id;
  player.updatedAt = now;
  await Promise.all([saveSession(session), savePlayer(player)]);
  return { session, question: publicQuestion(session) };
}

export function publicQuestion(session: ABGSession): PublicABGQuestion {
  const question = session.questions[session.currentIndex];
  if (!question) throw new Error("Session has no current question.");
  return {
    id: question.id,
    ph: question.ph,
    paco2: question.paco2,
    hco3: question.hco3,
    difficulty: question.difficulty,
    number: session.currentIndex + 1,
    total: session.mode === "survival" ? null : session.questions.length,
  };
}

function updateStat(player: ABGPlayer, key: string, correct: boolean) {
  const stat = player.categoryStats[key] ?? { answered: 0, correct: 0 };
  stat.answered += 1;
  if (correct) stat.correct += 1;
  player.categoryStats[key] = stat;
}

export async function submitAnswer(playerId: string, sessionId: string, questionId: string, answer: ABGAnswer) {
  const [player, session] = await Promise.all([getPlayer(playerId), getSession(sessionId)]);
  if (!player || !session || session.playerId !== playerId) throw new Error("Session not found.");
  if (session.completed) throw new Error("This session is already complete.");
  const question = session.questions[session.currentIndex];
  if (!question || question.id !== questionId) throw new Error("This question is no longer active.");
  const claimed = await claimAttempt(questionId, { playerId, sessionId, at: new Date().toISOString() });
  if (!claimed) throw new Error("This answer was already submitted.");

  const nowMs = Date.now();
  const responseTimeMs = Math.min(120_000, Math.max(250, nowMs - new Date(session.updatedAt).getTime()));
  const isQuestionNormalOrMixed = question.disorder === "Normal" || question.disorder === "Mixed Disorder";
  const correct = isQuestionNormalOrMixed
    ? answer.disorder === question.disorder
    : answer.disorder === question.disorder && answer.compensation === question.compensation;
  const interpretation = interpretABG(question);
  const ratingBefore = player.rating;
  const ratingChange = session.mode === "ranked"
    ? calculateRatingChange(player.rating, question.difficultyRating, correct)
    : 0;
  if (session.mode === "ranked") player.rating = applyRatingChange(player.rating, ratingChange);

  session.correct += correct ? 1 : 0;
  session.incorrect += correct ? 0 : 1;
  session.currentStreak = correct ? session.currentStreak + 1 : 0;
  session.bestStreak = Math.max(session.bestStreak, session.currentStreak);
  session.totalResponseTimeMs += responseTimeMs;
  session.endingRating = player.rating;

  player.totalQuestionsAnswered += 1;
  player.totalQuestionsCorrect += correct ? 1 : 0;
  player.totalResponseTimeMs += responseTimeMs;
  player.currentStreak = correct ? player.currentStreak + 1 : 0;
  player.bestStreak = Math.max(player.bestStreak, player.currentStreak);
  if (session.mode === "ranked") {
    player.rankedQuestionsAnswered += 1;
    player.rankedQuestionsCorrect += correct ? 1 : 0;
    player.ratingHistory = [...player.ratingHistory, { rating: player.rating, at: new Date(nowMs).toISOString() }].slice(-60);
  }
  if (session.mode === "practice") player.practiceQuestionsCompleted += 1;
  updateStat(player, question.category, correct);
  if (question.compensation !== "Uncompensated" && question.disorder !== "Normal") updateStat(player, "compensation", correct);
  if (question.compensation === "Fully Compensated") updateStat(player, "full-compensation", correct);

  const isSurvivalFailure = session.mode === "survival" && !correct;
  const reachedEnd = session.mode !== "survival" && session.currentIndex + 1 >= session.questions.length;
  session.completed = isSurvivalFailure || reachedEnd;
  if (session.completed) {
    session.completedAt = new Date(nowMs).toISOString();
    player.activeSessionId = undefined;
    if (session.mode === "ranked") player.rankedGamesCompleted += 1;
    if (session.mode === "survival") player.survivalBest = Math.max(player.survivalBest, session.correct);
  } else {
    session.currentIndex += 1;
    if (session.mode === "survival") session.questions.push(generateABGQuestion({ survivalLevel: session.correct }));
  }
  session.updatedAt = new Date(nowMs).toISOString();
  player.updatedAt = session.updatedAt;
  await Promise.all([
    saveSession(session),
    savePlayer(player),
    saveAttempt(question.id, {
      sessionId: session.id,
      mode: session.mode,
      values: { ph: question.ph, paco2: question.paco2, hco3: question.hco3 },
      answer: { disorder: question.disorder, compensation: question.compensation },
      playerAnswer: answer,
      correct,
      difficulty: question.difficulty,
      difficultyRating: question.difficultyRating,
      responseTimeMs,
      ratingBefore,
      ratingAfter: player.rating,
      ratingChange,
      createdAt: session.updatedAt,
    }),
  ]);
  const rank = await getRank(player.id, session.mode === "survival" ? "survival" : "rating");

  return {
    correct,
    answer: interpretation,
    yourAnswer: (answer.disorder === "Normal" || answer.disorder === "Mixed Disorder" || answer.compensation === "Mixed / Not Applicable")
      ? answer.disorder
      : `${answer.compensation} ${answer.disorder}`.trim(),
    ratingBefore,
    ratingAfter: player.rating,
    ratingChange,
    responseTimeMs,
    sessionComplete: session.completed,
    nextQuestion: session.completed ? null : publicQuestion(session),
    session: sessionSummary(session, rank),
  };
}

export function sessionSummary(session: ABGSession, rank: number | null = null) {
  const answered = session.correct + session.incorrect;
  return {
    id: session.id,
    mode: session.mode,
    correct: session.correct,
    incorrect: session.incorrect,
    answered,
    total: session.mode === "survival" ? null : session.questions.length,
    accuracy: answered ? session.correct / answered : 0,
    currentStreak: session.currentStreak,
    bestStreak: session.bestStreak,
    averageResponseTimeMs: answered ? Math.round(session.totalResponseTimeMs / answered) : 0,
    startingRating: session.startingRating,
    endingRating: session.endingRating,
    ratingChange: session.endingRating - session.startingRating,
    complete: session.completed,
    rank,
  };
}
