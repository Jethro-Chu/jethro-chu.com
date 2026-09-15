// Pure Pomodoro timer logic for the quokka page: state machine, timestamp
// countdown math, food rewards, and localStorage persistence. No React,
// so it can be unit tested directly with node.

export type Mode = "study" | "break";
export type Status = "idle" | "running" | "paused" | "finished";
export type BreakMinutes = 5 | 10;

export const STUDY_SEC = 25 * 60;
export const BREAK_SEC: Record<BreakMinutes, number> = {
  5: 5 * 60,
  10: 10 * 60,
};

/** Page-specific key so this never touches other site storage. */
export const STORAGE_KEY = "quokka-pomodoro/v1";

export interface PomodoroState {
  version: 1;
  mode: Mode;
  breakMinutes: BreakMinutes;
  status: Status;
  /** Authoritative remaining seconds when idle/paused/finished. */
  remainingSec: number;
  /** Epoch ms the session ends; authoritative only when running. */
  endAt: number | null;
  /** Unique id of the current attempt; guards against double rewards. */
  sessionId: string;
  completedStudy: number;
  lastFedSessionId: string | null;
}

export interface TickResult {
  state: PomodoroState;
  /** Set when this tick (or load) crossed the finish line. */
  justFinished: Mode | null;
}

export function durationFor(mode: Mode, breakMinutes: BreakMinutes): number {
  return mode === "study" ? STUDY_SEC : BREAK_SEC[breakMinutes];
}

export function makeSessionId(now: number): string {
  return `${now.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function freshState(now: number = Date.now()): PomodoroState {
  return {
    version: 1,
    mode: "study",
    breakMinutes: 5,
    status: "idle",
    remainingSec: STUDY_SEC,
    endAt: null,
    sessionId: makeSessionId(now),
    completedStudy: 0,
    lastFedSessionId: null,
  };
}

/** Current remaining seconds, derived from the timestamp while running. */
export function remainingNow(state: PomodoroState, now: number): number {
  if (state.status !== "running" || state.endAt === null)
    return Math.max(0, Math.round(state.remainingSec));
  return Math.max(0, Math.ceil((state.endAt - now) / 1000));
}

/** Advance a running timer; awards food exactly once per study session. */
export function tick(state: PomodoroState, now: number): TickResult {
  if (state.status !== "running" || state.endAt === null)
    return { state, justFinished: null };
  if (now < state.endAt) return { state, justFinished: null };
  const next: PomodoroState = {
    ...state,
    status: "finished",
    remainingSec: 0,
    endAt: null,
  };
  if (state.mode === "study" && state.lastFedSessionId !== state.sessionId) {
    next.completedStudy = state.completedStudy + 1;
    next.lastFedSessionId = state.sessionId;
  }
  return { state: next, justFinished: state.mode };
}

/** Start from idle (fresh attempt) or resume from pause. */
export function start(state: PomodoroState, now: number): PomodoroState {
  if (state.status === "running") return state;
  if (state.status === "paused" && state.remainingSec > 0) {
    return {
      ...state,
      status: "running",
      endAt: now + Math.round(state.remainingSec) * 1000,
    };
  }
  const full = durationFor(state.mode, state.breakMinutes);
  return {
    ...state,
    status: "running",
    remainingSec: full,
    endAt: now + full * 1000,
    sessionId: makeSessionId(now),
  };
}

/** From a finished session, begin the other mode. Never auto-called. */
export function startNext(state: PomodoroState, now: number): PomodoroState {
  if (state.status !== "finished") return state;
  const mode: Mode = state.mode === "study" ? "break" : "study";
  const full = durationFor(mode, state.breakMinutes);
  return {
    ...state,
    mode,
    status: "running",
    remainingSec: full,
    endAt: now + full * 1000,
    sessionId: makeSessionId(now),
  };
}

export function pause(state: PomodoroState, now: number): PomodoroState {
  if (state.status !== "running") return state;
  return {
    ...state,
    status: "paused",
    remainingSec: remainingNow(state, now),
    endAt: null,
  };
}

/** Restart the current timer; earned quokka progress is untouched. */
export function resetCurrent(state: PomodoroState): PomodoroState {
  return {
    ...state,
    status: "idle",
    remainingSec: durationFor(state.mode, state.breakMinutes),
    endAt: null,
  };
}

/** Switch modes only while not running; abandoning earns no food. */
export function setMode(state: PomodoroState, mode: Mode): PomodoroState {
  if (state.status === "running" || state.mode === mode) return state;
  return {
    ...state,
    mode,
    status: "idle",
    remainingSec: durationFor(mode, state.breakMinutes),
    endAt: null,
  };
}

/** One combined choice in the single mode selector. */
export type SessionChoice = "study" | "break5" | "break10";

export function choiceOf(state: PomodoroState): SessionChoice {
  if (state.mode === "study") return "study";
  return state.breakMinutes === 10 ? "break10" : "break5";
}

/**
 * Apply a mode-selector choice. A running session is never discarded: the
 * caller must require a pause first and explain that to the user.
 * Re-selecting the current idle choice is a no-op; anything else restarts
 * that timer fresh. Never awards food.
 */
export function selectSession(
  state: PomodoroState,
  choice: SessionChoice,
): PomodoroState {
  if (state.status === "running") return state;
  if (choice === choiceOf(state) && state.status === "idle") return state;
  const mode: Mode = choice === "study" ? "study" : "break";
  const breakMinutes: BreakMinutes =
    choice === "break10" ? 10 : choice === "break5" ? 5 : state.breakMinutes;
  return {
    ...state,
    mode,
    breakMinutes,
    status: "idle",
    remainingSec: durationFor(mode, breakMinutes),
    endAt: null,
  };
}

export function setBreakMinutes(
  state: PomodoroState,
  breakMinutes: BreakMinutes,
): PomodoroState {
  if (state.status === "running" || state.breakMinutes === breakMinutes)
    return state;
  const next: PomodoroState = { ...state, breakMinutes };
  if (state.mode === "break") {
    next.status = "idle";
    next.remainingSec = BREAK_SEC[breakMinutes];
    next.endAt = null;
  }
  return next;
}

export function stageFor(completedStudy: number): 0 | 1 | 2 | 3 | 4 {
  if (completedStudy <= 0) return 0;
  if (completedStudy === 1) return 1;
  if (completedStudy === 2) return 2;
  if (completedStudy === 3) return 3;
  return 4;
}

export const STAGE_LABELS = [
  "Hungry",
  "Content",
  "Happy",
  "Full",
  "Fully fed",
] as const;

/** Fed-counter label: 0/2+ take the plural, exactly 1 is singular. */
export function fedLabel(completedStudy: number): string {
  const n = Math.max(0, Math.floor(completedStudy));
  return `${n} ${n === 1 ? "quokka" : "quokkas"} fed`;
}

export function formatTime(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function isValidLoaded(v: unknown): v is PomodoroState {
  if (typeof v !== "object" || v === null) return false;
  const s = v as Record<string, unknown>;
  return (
    s.version === 1 &&
    (s.mode === "study" || s.mode === "break") &&
    (s.breakMinutes === 5 || s.breakMinutes === 10) &&
    (s.status === "idle" ||
      s.status === "running" ||
      s.status === "paused" ||
      s.status === "finished") &&
    typeof s.remainingSec === "number" &&
    Number.isFinite(s.remainingSec) &&
    (s.endAt === null || (typeof s.endAt === "number" && Number.isFinite(s.endAt))) &&
    typeof s.sessionId === "string" &&
    typeof s.completedStudy === "number" &&
    Number.isFinite(s.completedStudy) &&
    (s.lastFedSessionId === null || typeof s.lastFedSessionId === "string")
  );
}

export function saveState(store: KeyValueStore, state: PomodoroState): void {
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private-mode storage errors must never break the timer.
  }
}

/**
 * Load persisted state. A timer that was running while the page was closed
 * is reconciled against `now`, so a session that ended in the background
 * finishes (and feeds the quokka exactly once) instead of hanging.
 */
export function loadState(store: KeyValueStore, now: number): TickResult {
  let loaded: unknown = null;
  try {
    const raw = store.getItem(STORAGE_KEY);
    loaded = raw === null ? null : JSON.parse(raw);
  } catch {
    loaded = null;
  }
  if (!isValidLoaded(loaded)) return { state: freshState(now), justFinished: null };
  const clean: PomodoroState = {
    ...loaded,
    remainingSec: Math.max(0, Math.round(loaded.remainingSec)),
    completedStudy: Math.max(0, Math.floor(loaded.completedStudy)),
  };
  // A running timer with no end marker (or a finished one) is restored as-is.
  if (clean.status !== "running" || clean.endAt === null) {
    if (clean.status === "running") clean.status = "paused";
    return { state: clean, justFinished: null };
  }
  return tick(clean, now);
}
