import { EVENTS_V1 } from "./events.ts";
import type { TimelineEvent } from "./events.ts";
import * as legacy from "./legacy.ts";

export const VERSION = 2;
export const ROUNDS = 7;
export const TURN_MS = 20_000;
export const DAY_MS = legacy.DAY_MS;
export const EPOCH = legacy.EPOCH;
// Keep the existing key and date-keyed archive. New games explicitly version
// their generator; saved v1 puzzles keep their exact event order and old scores.
export const STORAGE_KEY = legacy.STORAGE_KEY;
export const utcDate = legacy.utcDate;
export const puzzleNumber = legacy.puzzleNumber;
export const eventFor = legacy.eventFor;
export type Mode = "daily" | "practice";
export type Phase = "place" | "reveal" | "complete";
export type Tier = "exact" | "near" | "close" | "far" | "miss";
export interface Puzzle { version: 1 | 2; id: string; mode: Mode; date: string; anchors: string[]; queue: string[] }
export interface Round {
  eventId: string; guessed: number | null; correct: number; points: number;
  // Absent only on an archived v1 round. Never recalculate a legacy result.
  elapsedMs?: number; timedOut?: boolean; base?: number; speed?: number;
  multiplier?: number; snipeYear?: number | null; snipe?: number; tier?: Tier;
}
export interface Game {
  puzzle: Puzzle; rounds: Round[]; selected: number | null; phase: Phase;
  deadlineAt: number | null; snipeYear: number | null;
}
export interface Save { schema: 1; active: Mode; daily: Record<string, Game>; practice: Game | null }

function randomFor(seed: string) {
  let state = 2166136261;
  for (const char of seed) state = Math.imul(state ^ char.charCodeAt(0), 16777619) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let n = Math.imul(state ^ (state >>> 15), 1 | state);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function distanceToBoard(event: TimelineEvent, board: TimelineEvent[]) {
  return Math.min(...board.map((other) => Math.abs(other.year - event.year)));
}
export function fitsRound(event: TimelineEvent, board: TimelineEvent[], round: number): boolean {
  if (board.some((other) => other.year === event.year || other.id === event.id)) return false;
  const distance = distanceToBoard(event, board);
  if (round < 2) {
    // Either side of either anchor is eligible; framing must not always mean
    // the middle slot. The nearest anchor is at most fifty years away.
    return distance <= 50;
  }
  if (round < 5) return distance >= 10 && distance <= 25;
  return board.some((other) => other.category !== event.category && Math.abs(other.year - event.year) >= 1 && Math.abs(other.year - event.year) <= 8);
}

// Frozen v2 algorithm + unchanged v1 content bank. Backtracking guarantees the
// entire compression curve before a puzzle is returned. No random retry fallback
// silently relaxes a late round's difficulty. The UTC date remains the daily seed.
const puzzleCache = new Map<string, Puzzle>();
export function makePuzzle(date: string, mode: Mode = "daily", seed = date): Puzzle {
  const cacheKey = `${mode}:${date}:${mode === "daily" ? date : seed}`;
  const cached = puzzleCache.get(cacheKey);
  if (cached) return cached;
  const random = randomFor(`timeundle:v2:${mode}:${mode === "daily" ? date : seed}`);
  const pairs: TimelineEvent[][] = [];
  for (const a of EVENTS_V1) for (const b of EVENTS_V1) {
    if (b.year - a.year >= 60 && b.year - a.year <= 120 && a.category !== b.category) pairs.push([a, b]);
  }
  const pool = shuffle(EVENTS_V1, random);
  function fill(board: TimelineEvent[], queue: TimelineEvent[]): TimelineEvent[] | null {
    if (queue.length === ROUNDS) return new Set(board.map((event) => event.category)).size >= 4 ? queue : null;
    for (const event of pool) {
      if (!fitsRound(event, board, queue.length)) continue;
      const result = fill([...board, event], [...queue, event]);
      if (result) return result;
    }
    return null;
  }
  for (const anchors of shuffle(pairs, random)) {
    const queue = fill(anchors, []);
    if (queue) {
      const puzzle: Puzzle = { version: 2, id: mode === "daily" ? date : seed, mode, date, anchors: anchors.map((event) => event.id), queue: queue.map((event) => event.id) };
      puzzleCache.set(cacheKey, puzzle);
      return puzzle;
    }
  }
  throw new Error("The frozen Timeundle bank cannot satisfy the compression curve.");
}

export const newGame = (puzzle: Puzzle): Game => ({ puzzle, rounds: [], selected: null, phase: "place", deadlineAt: null, snipeYear: null });
export function timeline(game: Game, count = game.rounds.length): TimelineEvent[] {
  return [...game.puzzle.anchors, ...game.rounds.slice(0, count).map((round) => round.eventId)].map(eventFor).sort((a, b) => a.year - b.year);
}
export function remainingMs(game: Game, now = Date.now()): number {
  return game.deadlineAt === null ? TURN_MS : Math.max(0, Math.min(TURN_MS, game.deadlineAt - now));
}
export function startRound(game: Game, now = Date.now()): Game {
  return game.phase === "place" && game.deadlineAt === null ? { ...game, selected: game.selected ?? Math.floor(timeline(game).length / 2), deadlineAt: now + TURN_MS } : game;
}
export function tierFor(round: Round): Tier {
  if (round.tier) return round.tier;
  const distance = round.guessed === null ? Infinity : Math.abs(round.guessed - round.correct);
  return distance === 0 ? "exact" : distance === 1 ? "near" : distance === 2 ? "close" : distance === 3 ? "far" : "miss";
}
export const emojiFor = (tier: Tier) => ({ exact: "🟩", near: "🟨", close: "🟧", far: "🟫", miss: "⬜" })[tier];
export function currentStreak(game: Game): number {
  let count = 0;
  for (let i = game.rounds.length - 1; i >= 0 && tierFor(game.rounds[i]) === "exact"; i--) count++;
  return count;
}
export function maxStreak(game: Game): number {
  let best = 0, count = 0;
  for (const round of game.rounds) { count = tierFor(round) === "exact" ? count + 1 : 0; best = Math.max(best, count); }
  return best;
}
export function basePoints(distance: number, boardSize: number): number {
  if (distance === 0) return 100;
  if (distance === 1) return boardSize <= 3 ? 40 : 75;
  if (distance === 2) return boardSize <= 4 ? 15 : 50;
  if (distance === 3) return boardSize <= 4 ? 0 : 25;
  return 0;
}
export function lock(game: Game, now = Date.now(), expired = false): Game {
  if (game.phase !== "place" || game.deadlineAt === null || game.rounds.length >= ROUNDS) return game;
  const board = timeline(game);
  const guessed = game.selected;
  const left = remainingMs(game, now);
  const timedOut = expired || left === 0;
  if (guessed === null && !timedOut) return game;
  if (guessed !== null && (!Number.isInteger(guessed) || guessed < 0 || guessed > board.length)) return game;
  const event = eventFor(game.puzzle.queue[game.rounds.length]);
  const correct = board.filter((other) => other.year < event.year).length;
  const distance = guessed === null ? Infinity : Math.abs(guessed - correct);
  const tier: Tier = distance === 0 ? "exact" : distance === 1 ? "near" : distance === 2 ? "close" : distance === 3 ? "far" : "miss";
  const base = basePoints(distance, board.length);
  const speed = timedOut ? 0 : Math.round((left / TURN_MS) * (distance === 0 ? 30 : distance === 1 ? 10 : 0));
  const multiplier = distance === 0 ? currentStreak(game) + 1 : 1;
  const snipeYear = game.snipeYear;
  const inGap = guessed !== null && snipeYear !== null && (guessed === 0 || snipeYear > board[guessed - 1].year) && (guessed === board.length || snipeYear < board[guessed].year);
  const snipe = !timedOut && inGap && snipeYear !== null && Math.abs(event.year - snipeYear) <= 2 ? 25 : 0;
  const round: Round = { eventId: event.id, guessed, correct, points: (base + speed) * multiplier + snipe, elapsedMs: timedOut ? TURN_MS : TURN_MS - left, timedOut, base, speed, multiplier, snipeYear, snipe, tier };
  return { ...game, rounds: [...game.rounds, round], selected: null, phase: "reveal", deadlineAt: null, snipeYear: null };
}
export function next(game: Game, now = Date.now()): Game {
  if (game.phase !== "reveal") return game;
  if (game.rounds.length === ROUNDS) return { ...game, phase: "complete" };
  return startRound({ ...game, phase: "place", selected: null, snipeYear: null }, now);
}
export const total = (game: Game) => game.rounds.reduce((sum, round) => sum + round.points, 0);
export const exact = (game: Game) => game.rounds.filter((round) => tierFor(round) === "exact").length;
export function shareText(game: Game): string {
  return [game.puzzle.mode === "daily" ? `Timeundle #${puzzleNumber(game.puzzle.date)}${game.puzzle.version === 1 ? " · Classic timeline" : ""}` : "Timeundle · Practice", `${total(game)} pts · ${exact(game)}/7 exact · ${maxStreak(game)}x max streak`, game.rounds.map((round) => emojiFor(tierFor(round))).join(""), "jethrochu.com/timeundle"].join("\n");
}
export const emptySave = (): Save => ({ schema: 1, active: "daily", daily: {}, practice: null });

export function restoreGame(raw: unknown): Game | null {
  try {
    if (!raw || typeof raw !== "object") return null;
    const data = raw as Game;
    const p = data.puzzle;
    if (![1, 2].includes(p.version) || !["daily", "practice"].includes(p.mode) || typeof p.id !== "string" || p.id.length > 100 || !/^\d{4}-\d{2}-\d{2}$/.test(p.date) || utcDate(Date.parse(p.date)) !== p.date) return null;
    const puzzle = p.version === 1 ? legacy.makePuzzle(p.date, p.mode, p.mode === "daily" ? p.date : p.id) : makePuzzle(p.date, p.mode, p.id);
    if (JSON.stringify(p) !== JSON.stringify(puzzle) || !Array.isArray(data.rounds) || data.rounds.length > ROUNDS) return null;
    let game = newGame(puzzle);
    let modernSeen = false;
    for (const rawRound of data.rounds) {
      if (rawRound.elapsedMs === undefined) {
        if (p.version !== 1 || modernSeen || !Number.isInteger(rawRound.guessed)) return null;
        const board = timeline(game);
        if (rawRound.guessed === null || rawRound.guessed < 0 || rawRound.guessed > board.length) return null;
        const event = eventFor(p.queue[game.rounds.length]);
        const correct = board.filter((entry) => entry.year < event.year).length;
        if (rawRound.eventId !== event.id || rawRound.correct !== correct || rawRound.points !== legacy.pointsFor(rawRound.guessed, correct)) return null;
        game = { ...game, rounds: [...game.rounds, { eventId: event.id, guessed: rawRound.guessed, correct, points: rawRound.points }] };
      } else {
        modernSeen = true;
        if (!Number.isInteger(rawRound.elapsedMs) || rawRound.elapsedMs < 0 || rawRound.elapsedMs > TURN_MS || typeof rawRound.timedOut !== "boolean" || (rawRound.timedOut && rawRound.elapsedMs !== TURN_MS)) return null;
        if (rawRound.snipeYear !== null && (!Number.isInteger(rawRound.snipeYear) || rawRound.snipeYear! < 1700 || rawRound.snipeYear! > 2100)) return null;
        const replayed = lock({ ...game, selected: rawRound.guessed, snipeYear: rawRound.snipeYear ?? null, deadlineAt: TURN_MS }, rawRound.elapsedMs, rawRound.timedOut);
        const expected = replayed.rounds.at(-1);
        if (replayed.rounds.length !== game.rounds.length + 1 || !expected || Object.entries(expected).some(([key, value]) => rawRound[key as keyof Round] !== value)) return null;
        game = { ...replayed, phase: "place" };
      }
    }
    if (!["place", "reveal", "complete"].includes(data.phase) || (data.phase === "reveal" && !data.rounds.length) || (data.phase === "complete" && data.rounds.length !== ROUNDS) || (data.phase === "place" && data.rounds.length === ROUNDS)) return null;
    const selected = data.selected;
    if (selected !== null && (data.phase !== "place" || !Number.isInteger(selected) || selected < 0 || selected > timeline(game).length)) return null;
    const deadlineAt = data.deadlineAt ?? null;
    if (deadlineAt !== null && (data.phase !== "place" || !Number.isSafeInteger(deadlineAt) || deadlineAt < 0)) return null;
    const snipeYear = data.snipeYear ?? null;
    if (snipeYear !== null && (data.phase !== "place" || !Number.isInteger(snipeYear) || snipeYear < 1700 || snipeYear > 2100)) return null;
    return { ...game, phase: data.phase, selected, deadlineAt, snipeYear };
  } catch { return null; }
}
export function parseSave(value: string | null): Save {
  if (!value) return emptySave();
  try {
    const data = JSON.parse(value);
    if (data.schema !== 1 || !data.daily || typeof data.daily !== "object") return emptySave();
    const daily: Record<string, Game> = {};
    for (const [date, raw] of Object.entries(data.daily)) {
      const game = restoreGame(raw);
      if (game?.puzzle.mode === "daily" && game.puzzle.date === date) daily[date] = game;
    }
    const practice = restoreGame(data.practice);
    return { schema: 1, active: data.active === "practice" ? "practice" : "daily", daily, practice: practice?.puzzle.mode === "practice" ? practice : null };
  } catch { return emptySave(); }
}
export function saveGame(save: Save, game: Game): Save {
  return game.puzzle.mode === "daily" ? { ...save, active: "daily", daily: { ...save.daily, [game.puzzle.date]: game } } : { ...save, active: "practice", practice: game };
}
export function statistics(save: Save, today: string) {
  const games = Object.values(save.daily).filter((game) => game.phase === "complete" && game.puzzle.date <= today);
  const dates = new Set(games.map((game) => game.puzzle.date));
  let cursor = Date.parse(today);
  if (!dates.has(today)) cursor -= DAY_MS;
  let streak = 0;
  while (dates.has(utcDate(cursor))) { streak++; cursor -= DAY_MS; }
  // Version-specific personal bests keep the old 700-point game comparable.
  const modern = games.filter((game) => game.rounds.some((round) => round.elapsedMs !== undefined));
  return { played: games.length, streak, best: Math.max(0, ...modern.map(total)), average: modern.length ? Math.round(modern.reduce((sum, game) => sum + total(game), 0) / modern.length) : 0 };
}
