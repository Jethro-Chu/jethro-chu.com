"use client";

import { useEffect, useRef, useState } from "react";
import { Quokka, type QuokkaActivity } from "./Quokka";
import {
  choiceOf,
  durationFor,
  fedLabel,
  formatTime,
  loadState,
  pause,
  remainingNow,
  resetCurrent,
  saveState,
  selectSession,
  stageFor,
  start,
  startNext,
  tick,
  type BreakMinutes,
  type Mode,
  type PomodoroState,
  type SessionChoice,
} from "./pomodoroState";
import styles from "./pomodoro.module.css";

const PAGE_TITLE = "Pomodoro Timer";
const CELEBRATION_MS = 2200;
const HINT_MS = 4000;
const MIN_HINT_MS = 6000;
// Separate from the timer state key so UI prefs never disturb saved progress.
const UI_KEY = "quokka-pomodoro/ui-v1";

const CHOICES: Array<{ id: SessionChoice; label: string }> = [
  { id: "study", label: "Study" },
  { id: "break5", label: "Break 5m" },
  { id: "break10", label: "Break 10m" },
];

const SOUND_SRC = "/pomodoro/02_mossy_soft_bells.mp3";

function SpeakerOnIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function SpeakerOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

function statusText(state: PomodoroState): string {
  if (state.status === "finished") {
    return state.mode === "study"
      ? "Study complete. Quokka fed."
      : "Break over. Ready when you are.";
  }
  if (state.status === "running") {
    return state.mode === "study" ? "Focusing" : "Resting";
  }
  if (state.status === "paused") return "Paused";
  return state.mode === "study" ? "Ready to focus" : "Ready to rest";
}

function activityFor(state: PomodoroState): QuokkaActivity {
  if (state.status === "running") return state.mode === "study" ? "study" : "break";
  return "idle";
}

/** Tiny pixel paw: raw squares, no curves, no emoji-font roulette. */
function PawIcon() {
  return (
    <svg viewBox="0 0 12 11" fill="currentColor" aria-hidden="true" focusable="false">
      <rect x="1" y="2" width="2" height="2" />
      <rect x="5" y="1" width="2" height="2" />
      <rect x="9" y="2" width="2" height="2" />
      <rect x="3" y="6" width="6" height="1" />
      <rect x="2" y="7" width="8" height="2" />
      <rect x="3" y="9" width="6" height="1" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
    </svg>
  );
}

export default function PomodoroApp() {
  // Deterministic first render (matches SSR), reconciled with storage on mount.
  const [state, setState] = useState<PomodoroState>(() => ({
    version: 1 as const,
    mode: "study" as Mode,
    breakMinutes: 5 as BreakMinutes,
    status: "idle" as const,
    remainingSec: durationFor("study", 5),
    endAt: null,
    sessionId: "init",
    completedStudy: 0,
    lastFedSessionId: null,
  }));
  const [now, setNow] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [minHint, setMinHint] = useState(false);
  const minHintId = useRef(0);
  const [collapsed, setCollapsed] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const stateRef = useRef(state);
  stateRef.current = state;
  // Fresh in every interval tick: the driver effect only re-subscribes on
  // status changes, so it must read sound through a ref, never a closure.
  const soundOnRef = useRef(true);
  soundOnRef.current = soundOn;
  const soundRef = useRef<HTMLAudioElement | null>(null);
  // sessionIds rotate on every start: one ring per finished session even if
  // a tick (or StrictMode) ever delivered justFinished twice.
  const playedSessionRef = useRef<string | null>(null);

  // Reconcile with persisted state once (a session may have ended away).
  useEffect(() => {
    const recovered = loadState(window.localStorage, Date.now());
    stateRef.current = recovered.state;
    setState(recovered.state);
    saveState(window.localStorage, recovered.state);
    setNow(Date.now());
    // Visual celebration only: a load/refresh must never make a sound.
    if (recovered.justFinished === "study") {
      setCelebrating(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist every change.
  useEffect(() => {
    saveState(window.localStorage, state);
  }, [state]);

  // Restore UI prefs (independent key; timer state untouched). Sound
  // defaults ON; only an explicit false mutes it.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(UI_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed === "object" && parsed !== null) {
          const ui = parsed as { collapsed?: unknown; soundOn?: unknown };
          if (ui.collapsed === true) setCollapsed(true);
          if (ui.soundOn === false) setSoundOn(false);
        }
      }
    } catch {
      // Defaults: expanded, sound on.
    }
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem(UI_KEY, JSON.stringify({ collapsed, soundOn }));
    } catch {
      // Private-mode storage errors must never break the timer.
    }
  }, [collapsed, soundOn]);

  // Preload the completion bell once so it starts instantly at 00:00.
  // Element-based (not WebAudio): nothing to build at ring time, it plays
  // whether the UI is collapsed or not, and it never touches the quokka.
  useEffect(() => {
    const audio = new Audio(SOUND_SRC);
    audio.preload = "auto";
    audio.loop = false;
    audio.volume = 0.6;
    soundRef.current = audio;
    try {
      audio.load();
    } catch {
      // A bell that never loads simply never rings.
    }
    return () => {
      soundRef.current = null;
      try {
        audio.pause();
      } catch {
        // Unmounting must never throw.
      }
    };
  }, []);

  // Countdown driver. Timestamp math keeps it accurate across tab switches;
  // the visibility listener snaps the UI the moment the tab returns.
  useEffect(() => {
    if (state.status !== "running") return;
    const check = (t: number) => {
      setNow(t);
      const result = tick(stateRef.current, t);
      if (result.state === stateRef.current) return;
      stateRef.current = result.state;
      setState(result.state);
      if (result.justFinished === "study") {
        setCelebrating(true);
      }
      if (
        result.justFinished !== null &&
        soundOnRef.current &&
        playedSessionRef.current !== result.state.sessionId
      ) {
        playedSessionRef.current = result.state.sessionId;
        const bell = soundRef.current;
        if (bell) {
          try {
            bell.currentTime = 0;
            const pending = bell.play();
            if (pending) void pending.catch(() => undefined);
          } catch {
            // Blocked, missing, or unloadable: silence is acceptable.
          }
        }
      }
    };
    check(Date.now());
    const id = window.setInterval(() => check(Date.now()), 250);
    const onVisible = () => {
      if (document.visibilityState === "visible") check(Date.now());
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [state.status]);

  // End the feeding celebration, then settle into the new idle look.
  useEffect(() => {
    if (!celebrating) return;
    const id = window.setTimeout(() => setCelebrating(false), CELEBRATION_MS);
    return () => window.clearTimeout(id);
  }, [celebrating]);

  // The pause-to-switch hint is brief: it clears on any timer change or after
  // a few seconds.
  useEffect(() => {
    setHint(null);
  }, [state.status, state.mode, state.breakMinutes]);
  useEffect(() => {
    if (!hint) return;
    const id = window.setTimeout(() => setHint(null), HINT_MS);
    return () => window.clearTimeout(id);
  }, [hint]);

  // Points first-time studiers at the whisper-quiet X. Re-pressing restarts
  // the clock; clearing the timeout on unmount keeps fake-timer tests honest.
  useEffect(() => () => window.clearTimeout(minHintId.current), []);
  const flashMinHint = () => {
    if (collapsed) return;
    setMinHint(true);
    window.clearTimeout(minHintId.current);
    minHintId.current = window.setTimeout(() => setMinHint(false), MIN_HINT_MS);
  };

  const remaining = remainingNow(state, now || Date.now());
  const full = durationFor(state.mode, state.breakMinutes);
  const progress = full > 0 ? Math.min(1, Math.max(0, 1 - remaining / full)) : 0;

  // Live tab title while the timer matters; restored on unmount.
  useEffect(() => {
    if (state.status === "running" || state.status === "paused") {
      document.title = `${formatTime(remaining)} ${state.mode === "study" ? "Study" : "Break"} ${PAGE_TITLE}`;
    } else if (state.status === "finished") {
      document.title =
        state.mode === "study"
          ? `Fed. ${PAGE_TITLE}`
          : `Break over. ${PAGE_TITLE}`;
    } else {
      document.title = PAGE_TITLE;
    }
    return () => {
      document.title = PAGE_TITLE;
    };
  }, [state.status, state.mode, remaining]);

  const stage = stageFor(state.completedStudy);
  const finished = state.status === "finished";
  const running = state.status === "running";

  const primaryLabel = running
    ? "Pause"
    : state.status === "paused"
      ? "Resume"
      : "Start";

  const onPrimary = () => {
    const t = Date.now();
    setNow(t);
    if (stateRef.current.status === "running") {
      const next = pause(stateRef.current, t);
      stateRef.current = next;
      setState(next);
    } else {
      if (
        stateRef.current.status === "idle" &&
        stateRef.current.mode === "study"
      ) {
        flashMinHint();
      }
      const next = start(stateRef.current, t);
      stateRef.current = next;
      setState(next);
    }
  };

  const onReset = () => {
    const next = resetCurrent(stateRef.current);
    stateRef.current = next;
    setState(next);
    setCelebrating(false);
  };

  const onStartNext = () => {
    const t = Date.now();
    setNow(t);
    const next = startNext(stateRef.current, t);
    stateRef.current = next;
    setState(next);
    setCelebrating(false);
    if (next.mode === "study") flashMinHint();
  };

  const currentChoice = choiceOf(state);

  const onChoice = (c: SessionChoice) => {
    if (stateRef.current.status === "running") {
      if (c !== choiceOf(stateRef.current)) {
        setHint("Pause the timer to switch modes.");
      }
      return;
    }
    if (c === "study") flashMinHint();
    const next = selectSession(stateRef.current, c);
    stateRef.current = next;
    setState(next);
    setCelebrating(false);
  };

  return (
    <main className={styles.page}>
      <picture className={styles.bg} aria-hidden="true">
        <source
          media="(min-aspect-ratio: 1/1)"
          srcSet="/pomodoro/bg-forest-landscape.png"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/pomodoro/bg-forest-portrait.png"
          alt=""
          decoding="async"
          fetchPriority="high"
        />
      </picture>

      <button
        type="button"
        className={styles.collapseBtn}
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Show timer interface" : "Hide timer interface"}
        aria-expanded={!collapsed}
      >
        <XIcon />
      </button>
      <button
        type="button"
        className={`${styles.collapseBtn} ${styles.soundBtn}${collapsed ? ` ${styles.hidden}` : ""}`}
        onClick={() => setSoundOn((s) => !s)}
        aria-label={soundOn ? "Mute completion sound" : "Unmute completion sound"}
        aria-pressed={soundOn}
      >
        {soundOn ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
      </button>
      {minHint && !collapsed && (
        <p className={styles.minHint} role="status">
          Press X to minimize the timer
        </p>
      )}
      <div className={styles.content}>
        <div className={styles.quokkaRow}>
          <Quokka stage={stage} activity={activityFor(state)} celebrating={celebrating} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/pomodoro/good-days-ahead-sign.png"
            alt="Wooden sign reading You Got This with a heart."
            draggable={false}
            decoding="async"
            fetchPriority="low"
            className={styles.sign}
          />
        </div>

        {/* Always mounted: collapsing only hides it, so the flex column never
            reflows and the quokka stays pixel-still. visibility:hidden also
            drops it from the tab order and the accessibility tree. */}
        <p className={`${styles.fedCounter}${collapsed ? ` ${styles.hidden}` : ""}`} role="status">
          <PawIcon />
          <span>{fedLabel(state.completedStudy)}</span>
        </p>

        <div className={`${styles.console}${collapsed ? ` ${styles.hidden}` : ""}`}>
          <div className={styles.seg} role="group" aria-label="Session type">
            {CHOICES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={styles.segBtn}
                aria-pressed={currentChoice === c.id}
                onClick={() => onChoice(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <p className={styles.hint} role="status">
            {hint ?? ""}
          </p>
          <p className={styles.timer} role="timer" aria-label={`Time remaining: ${formatTime(remaining)}`}>
            {formatTime(remaining)}
          </p>
          <div className={styles.progress} aria-hidden="true">
            <div
              className={styles.progressFill}
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>

          <div className={styles.controls}>
            {finished ? (
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={onStartNext}
              >
                {state.mode === "study" ? "Start break" : "Start study"}
              </button>
            ) : (
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={onPrimary}
              >
                {primaryLabel}
              </button>
            )}
            <button
              type="button"
              className={`${styles.btn} ${styles.btnQuiet}`}
              onClick={onReset}
            >
              Reset
            </button>
          </div>
          <p className={styles.srOnly} role="status">
            {statusText(state)}
          </p>
        </div>
      </div>
    </main>
  );
}
