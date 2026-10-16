import { EVENTS_V1 } from "./events.ts";
import type { TimelineEvent } from "./events.ts";

export const VERSION = 1;
export const ROUNDS = 7;
export const DAY_MS = 86_400_000;
export const EPOCH = "2026-10-16";
export type Mode = "daily" | "practice";
export type Phase = "place" | "reveal" | "complete";
export interface Puzzle { version: 1; id: string; mode: Mode; date: string; anchors: string[]; queue: string[] }
export interface Round { eventId: string; guessed: number; correct: number; points: number }
export interface Game { puzzle: Puzzle; rounds: Round[]; selected: number | null; phase: Phase }
export interface Save { schema: 1; active: Mode; daily: Record<string, Game>; practice: Game | null }
export const STORAGE_KEY = "timeundle:save:v1";
export const eventById = new Map(EVENTS_V1.map((event) => [event.id, event]));
export const eventFor = (id: string): TimelineEvent => eventById.get(id)!;
export const utcDate = (now = Date.now()) => new Date(now).toISOString().slice(0, 10);
export const puzzleNumber = (date: string) => Math.floor((Date.parse(date) - Date.parse(EPOCH)) / DAY_MS) + 1;
export const pointsFor = (guessed: number, correct: number) => Math.max(0, 100 - 25 * Math.abs(guessed - correct));
export const emojiFor = (points: number) => ({ 100: "🟩", 75: "🟨", 50: "🟧", 25: "🟫", 0: "⬜" })[points] ?? "⬜";

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

// Both bank AND algorithm are frozen under v1. Anchor ranks leave meaningful
// choices on either side and inside the interval, rather than two extremes.
export function makePuzzle(date: string, mode: Mode = "daily", seed = date): Puzzle {
  const random = randomFor(`timeundle:v1:${mode}:${seed}`);
  const recent = random() < 0.7;
  const pool = EVENTS_V1.filter((event) => !recent || event.year >= 1958);
  let chosen: TimelineEvent[] = [];
  for (let attempt = 0; attempt < 100; attempt++) {
    const years = new Set<number>();
    chosen = shuffle(pool, random).filter((event) => {
      if (years.has(event.year)) return false;
      years.add(event.year);
      return true;
    }).slice(0, 9).sort((a, b) => a.year - b.year);
    if (new Set(chosen.map((event) => event.category)).size >= 4) break;
  }
  const anchors = [chosen[2].id, chosen[6].id];
  const queue = shuffle(chosen.filter((event) => !anchors.includes(event.id)), random).map((event) => event.id);
  return { version: VERSION, id: mode === "daily" ? date : seed, mode, date, anchors, queue };
}
export const newGame = (puzzle: Puzzle): Game => ({ puzzle, rounds: [], selected: null, phase: "place" });
export function timeline(game: Game, count = game.rounds.length): TimelineEvent[] {
  return [...game.puzzle.anchors, ...game.rounds.slice(0, count).map((round) => round.eventId)]
    .map(eventFor).sort((a, b) => a.year - b.year);
}
export function lock(game: Game): Game {
  if (game.phase !== "place" || game.selected === null || game.rounds.length >= ROUNDS) return game;
  const previous = timeline(game);
  if (!Number.isInteger(game.selected) || game.selected < 0 || game.selected > previous.length) return game;
  const event = eventFor(game.puzzle.queue[game.rounds.length]);
  const correct = previous.filter((entry) => entry.year < event.year).length;
  const round = { eventId: event.id, guessed: game.selected, correct, points: pointsFor(game.selected, correct) };
  return { ...game, rounds: [...game.rounds, round], selected: null, phase: "reveal" };
}
export function next(game: Game): Game {
  if (game.phase !== "reveal") return game;
  return { ...game, phase: game.rounds.length === ROUNDS ? "complete" : "place" };
}
export const total = (game: Game) => game.rounds.reduce((sum, round) => sum + round.points, 0);
export const exact = (game: Game) => game.rounds.filter((round) => round.points === 100).length;
export function shareText(game: Game): string {
  return [game.puzzle.mode === "daily" ? `Timeundle #${puzzleNumber(game.puzzle.date)}` : "Timeundle · Practice",
    `${total(game)}/700 · ${exact(game)}/7 exact`, game.rounds.map((round) => emojiFor(round.points)).join(""), "jethrochu.com/timeundle"].join("\n");
}
export const emptySave = (): Save => ({ schema: 1, active: "daily", daily: {}, practice: null });

// Validate untrusted local data by replaying guesses. Never trust saved scores,
// event IDs, or phase combinations. Preserve a pending reveal exactly once.
export function restoreGame(raw: unknown): Game | null {
  try {
    if (!raw || typeof raw !== "object") return null;
    const data = raw as Game;
    const p = data.puzzle;
    if (p.version !== VERSION || !["daily", "practice"].includes(p.mode) || typeof p.id !== "string" || p.id.length > 100 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(p.date) || utcDate(Date.parse(p.date)) !== p.date) return null;
    const puzzle = makePuzzle(p.date, p.mode, p.mode === "daily" ? p.date : p.id);
    if (JSON.stringify(p) !== JSON.stringify(puzzle) || !Array.isArray(data.rounds) || data.rounds.length > ROUNDS) return null;
    let game = newGame(puzzle);
    for (const round of data.rounds) {
      game = lock({ ...game, selected: round.guessed });
      if (JSON.stringify(game.rounds.at(-1)) !== JSON.stringify(round)) return null;
      game = next(game);
    }
    if (!["place", "reveal", "complete"].includes(data.phase) || (data.phase === "reveal" && !data.rounds.length) ||
      (data.phase === "complete" && data.rounds.length !== ROUNDS) || (data.phase === "place" && data.rounds.length === ROUNDS)) return null;
    const selected = data.selected;
    if (selected !== null && (data.phase !== "place" || !Number.isInteger(selected) || selected < 0 || selected > timeline(game).length)) return null;
    return { ...game, phase: data.phase, selected };
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
  const completed = Object.values(save.daily).filter((game) => game.phase === "complete" && game.puzzle.date <= today);
  const dates = new Set(completed.map((game) => game.puzzle.date));
  let cursor = Date.parse(today);
  if (!dates.has(today)) cursor -= DAY_MS;
  let streak = 0;
  while (dates.has(utcDate(cursor))) { streak++; cursor -= DAY_MS; }
  return { played: completed.length, streak, best: Math.max(0, ...completed.map(total)), average: completed.length ? Math.round(completed.reduce((sum, game) => sum + total(game), 0) / completed.length) : 0 };
}
