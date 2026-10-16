import { BANK_VERSION, questions, type Question } from "../../data/margillionQuestions.ts";

export const FUSE = 25_000;
type FuseDuration = 15_000 | typeof FUSE;
export const REVEAL = 2_800;
export const ROUNDS = 10;
export const DAY = 86_400_000;
export const STORAGE_KEY = "margillion:save:v1";
export type Mode = "daily" | "practice";
export type Stance = "safe" | "razor";
export type Round = { questionId: string; start: number; fuseMs: FuseDuration; guess: number | null; stance: Stance; at: number; error: number | null; points: number; damage: number; heal: number; margin: number; delta: number; razor: boolean; bullseye: boolean };
export type Game = { version: 1; id: string; mode: Mode; date: string; seed: string; startedAt: number; fuseMs: FuseDuration; deadline: number; revealUntil: number | null; phase: "guess" | "reveal" | "complete"; input: string; rounds: Round[] };
export type Save = { version: 1; daily: Record<string, Game>; practice: Game | null };
export const emptySave = (): Save => ({ version: 1, daily: {}, practice: null });
export const decimal = (value: number) => Number(value.toFixed(1));
export const utcDate = (now = Date.now()) => new Date(now).toISOString().slice(0, 10);
export const puzzleNumber = (date: string) => String(Math.max(1, Math.floor((Date.parse(date) - Date.parse("2026-10-16")) / DAY) + 1)).padStart(3, "0");
function random(seed: string) {
  let hash = 2166136261;
  for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return () => { hash += 0x6d2b79f5; let t = Math.imul(hash ^ hash >>> 15, 1 | hash); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function shuffle<T>(items: readonly T[], seed: string): T[] {
  const result = [...items], rand = random(seed);
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function dailyQuestions(date: string): Question[] {
  return ([1, 2, 3] as const).flatMap((difficulty) => shuffle(questions.filter(q => q.difficulty === difficulty), `margillion:${BANK_VERSION}:${date}:${difficulty}`).slice(0, difficulty === 2 ? 4 : 3));
}
export function questionFor(game: Pick<Game, "mode" | "seed" | "date">, index: number): Question {
  return game.mode === "daily" ? dailyQuestions(game.date)[index] : shuffle(questions, `${game.seed}:${Math.floor(index / questions.length)}`)[index % questions.length];
}
export const marginOf = (game: Game) => game.rounds.at(-1)?.margin ?? 100;
export const pointsOf = (game: Game) => game.rounds.reduce((sum, round) => sum + round.points, 0);
export const survived = (game: Game) => game.mode === "daily" && game.rounds.length === ROUNDS && marginOf(game) > 0;
export const bonusOf = (game: Game) => survived(game) ? Math.round(marginOf(game) * 10) : 0;
export const totalOf = (game: Game) => pointsOf(game) + bonusOf(game);
export function streakOf(game: Game) { let streak = 0; for (const round of [...game.rounds].reverse()) { if (round.error === null || round.error > 5) break; streak++; } return streak; }
export function score(guess: number | null, actual: number, stance: Stance, before: number) {
  if (!(actual > 0) || !Number.isFinite(actual) || (guess !== null && (!Number.isFinite(guess) || guess < 0))) throw new Error("Invalid estimate or answer");
  const rawError = guess === null ? null : Math.abs(guess - actual) / actual * 100;
  const error = rawError === null ? null : decimal(Math.min(Number.MAX_SAFE_INTEGER, rawError));
  const razor = stance === "razor" && error !== null && error <= 5;
  const bullseye = error !== null && error <= 1;
  const base = error === null ? 0 : Math.max(0, Math.round(100 - error * 2));
  const points = base * (razor ? 3 : 1) + (bullseye ? 100 : 0);
  const damage = error === null ? 25 : razor ? 0 : Math.min(stance === "razor" ? 60 : 35, error * (stance === "razor" ? 2 : 1));
  const heal = (razor ? 5 : 0) + (bullseye ? 5 : 0);
  const margin = decimal(Math.max(0, Math.min(100, before - damage + heal)));
  return { error, razor, bullseye, points, damage: decimal(damage), heal, margin, delta: decimal(margin - before) };
}
export function newGame(mode: Mode, now: number, seed = "", fuseMs: FuseDuration = FUSE): Game {
  const date = utcDate(now), identity = mode === "daily" ? date : seed;
  return { version: 1, id: `${mode}:${identity}`, mode, date, seed: identity, startedAt: now, fuseMs, deadline: now + fuseMs, revealUntil: null, phase: "guess", input: "", rounds: [] };
}
export function validInput(input: string) { return input.length <= 14 && /^\d*\.?\d*$/.test(input); }
export function estimate(input: string): number | null { return validInput(input) && /\d/.test(input) && Number.isFinite(Number(input)) ? Number(input) : null; }
function lock(game: Game, guess: number | null, stance: Stance, at: number): Game {
  const question = questionFor(game, game.rounds.length);
  const round = { questionId: question.id, start: game.deadline - game.fuseMs, fuseMs: game.fuseMs, guess, stance, at, ...score(guess, question.answer, stance, marginOf(game)) };
  return { ...game, phase: "reveal", input: "", revealUntil: at + REVEAL, rounds: [...game.rounds, round] };
}
export function advance(game: Game, now: number, fuseMs: FuseDuration = FUSE): Game {
  if (game.phase !== "reveal" || now < game.rounds.at(-1)!.at + 240) return game;
  const done = marginOf(game) === 0 || (game.mode === "daily" && game.rounds.length === ROUNDS);
  return { ...game, phase: done ? "complete" : "guess", revealUntil: null, input: "", fuseMs: done ? game.fuseMs : fuseMs, deadline: done ? game.deadline : Math.min(now, game.revealUntil!) + fuseMs };
}
// Catch up against saved absolute deadlines, including suspended/background tabs.
export function tick(game: Game, now: number): Game {
  let next = game;
  while (next.phase !== "complete") {
    if (next.phase === "guess" && now >= next.deadline) next = lock(next, null, "safe", next.deadline);
    else if (next.phase === "reveal" && now >= next.revealUntil!) next = advance(next, next.revealUntil!);
    else break;
  }
  return next;
}
export function commit(game: Game, stance: Stance, now: number): Game {
  // An expired commit can never spill into the next automatically started tier.
  if (game.phase !== "guess" || now >= game.deadline) return tick(game, now);
  const guess = estimate(game.input);
  return guess === null ? game : lock(game, guess, stance, now);
}
export function emojiFor(round: Round) {
  if (!round.margin) return "💀";
  if (round.razor) return "🎯";
  if (round.error === null || round.stance === "razor" || round.error > 30) return "🟥";
  return round.error <= 5 ? "🟩" : round.error <= 15 ? "🟨" : "🟧";
}
export function shareText(game: Game) {
  const cells: string[] = game.rounds.map(emojiFor);
  if (game.mode === "daily") while (cells.length < ROUNDS) cells.push("⬜");
  return `margillion. ${game.mode === "daily" ? `#${puzzleNumber(game.date)}` : "endless"}\nScore: ${totalOf(game).toLocaleString("en-US")} | Margin Left: ${marginOf(game).toFixed(1)}%\n${cells.slice(-50).join("")} (Tier ${game.rounds.length}${game.mode === "daily" ? "/10" : ""})\nhttps://jethrochu.com/margillion`;
}

function isRecord(value: unknown): value is Record<string, unknown> { return !!value && typeof value === "object" && !Array.isArray(value); }
function validDate(value: unknown): value is string { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && utcDate(Date.parse(value)) === value; }
function storedFuse(value: unknown): FuseDuration | null {
  // Saves from the original release did not record their 15-second duration.
  return value === undefined ? 15_000 : value === 15_000 || value === FUSE ? value : null;
}
// Recompute all scoring from the input log. Never trust cached totals from storage.
export function restoreGame(raw: unknown): Game | null {
  if (!isRecord(raw) || raw.version !== 1 || !["daily", "practice"].includes(raw.mode as string) || !validDate(raw.date) || typeof raw.seed !== "string" || raw.seed.length > 100 || typeof raw.startedAt !== "number" || !Number.isFinite(raw.startedAt) || raw.startedAt < 0 || !Array.isArray(raw.rounds) || typeof raw.input !== "string" || !validInput(raw.input)) return null;
  const currentFuse = storedFuse(raw.fuseMs);
  const firstFuse = raw.rounds.length && isRecord(raw.rounds[0]) ? storedFuse(raw.rounds[0].fuseMs) : currentFuse;
  if (currentFuse === null || firstFuse === null) return null;
  let game = newGame(raw.mode as Mode, raw.startedAt, raw.seed, firstFuse);
  if (game.date !== raw.date || game.id !== raw.id || game.seed !== raw.seed) return null;
  for (const item of raw.rounds) {
    if (game.phase === "complete" || !isRecord(item) || storedFuse(item.fuseMs) !== game.fuseMs || typeof item.at !== "number" || !Number.isFinite(item.at) || item.start !== game.deadline - game.fuseMs || item.at < game.deadline - game.fuseMs || item.at > game.deadline || !["safe", "razor"].includes(item.stance as string) || (item.guess !== null && (typeof item.guess !== "number" || !Number.isFinite(item.guess) || item.guess < 0)) || item.questionId !== questionFor(game, game.rounds.length).id || (item.guess === null && (item.at !== game.deadline || item.stance !== "safe"))) return null;
    game = lock(game, item.guess as number | null, item.stance as Stance, item.at);
    // Each next round records its start in the following lock's time window.
    const index = game.rounds.length;
    if (index < raw.rounds.length) {
      const following = raw.rounds[index];
      if (!isRecord(following) || typeof following.start !== "number") return null;
      const duration = storedFuse(following.fuseMs);
      if (duration === null || following.start > game.revealUntil!) return null;
      game = advance(game, following.start, duration);
      if (game.phase !== "guess") return null;
    }
  }
  if (raw.phase === "guess" && game.phase === "reveal") {
    if (typeof raw.deadline !== "number" || !Number.isFinite(raw.deadline)) return null;
    game = advance(game, raw.deadline - currentFuse, currentFuse);
  } else if (raw.phase === "complete" && game.phase === "reveal") game = advance(game, game.rounds.at(-1)!.at + REVEAL);
  if (game.phase !== raw.phase || game.fuseMs !== currentFuse || game.deadline !== raw.deadline || game.revealUntil !== raw.revealUntil) return null;
  // Keep elapsed time and the original round start when extending an active fuse.
  return { ...game, input: game.phase === "guess" ? raw.input : "", ...(game.phase === "guess" && game.fuseMs !== FUSE ? { fuseMs: FUSE, deadline: game.deadline + FUSE - game.fuseMs } : {}) };
}
export function parseSave(text: string | null): Save {
  if (!text) return emptySave();
  try {
    const raw: unknown = JSON.parse(text);
    if (!isRecord(raw) || raw.version !== 1 || !isRecord(raw.daily)) return emptySave();
    const daily: Record<string, Game> = {};
    for (const [date, item] of Object.entries(raw.daily)) { const game = restoreGame(item); if (game?.mode === "daily" && game.date === date) daily[date] = game; }
    const practice = restoreGame(raw.practice);
    return { version: 1, daily, practice: practice?.mode === "practice" ? practice : null };
  } catch { return emptySave(); }
}
export function stats(save: Save, today: string) {
  const games = Object.values(save.daily).filter(game => game.phase === "complete");
  let cursor = Date.parse(today), streak = 0;
  if (!save.daily[today] || save.daily[today].phase !== "complete") cursor -= DAY;
  while (save.daily[utcDate(cursor)]?.phase === "complete" && survived(save.daily[utcDate(cursor)])) { streak++; cursor -= DAY; }
  return { played: games.length, wins: games.filter(survived).length, best: games.reduce((best, game) => Math.max(best, totalOf(game)), 0), streak };
}
