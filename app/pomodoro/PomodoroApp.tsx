"use client";

import { useEffect, useRef, useState } from "react";
import { Quokka, type QuokkaActivity } from "./Quokka";
import {
  STAGE_LABELS,
  choiceOf,
  durationFor,
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

const PAGE_TITLE = "Quokka Pomodoro";
const CELEBRATION_MS = 2200;
const HINT_MS = 4000;

const CHOICES: Array<{ id: SessionChoice; label: string }> = [
  { id: "study", label: "Study" },
  { id: "break5", label: "Break 5m" },
  { id: "break10", label: "Break 10m" },
];

/** Two soft sine notes. Everything is guarded: silence is always acceptable. */
function playChime() {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    void ctx.resume().catch(() => undefined);
    const notes = [523.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t0 = ctx.currentTime + i * 0.32;
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.09, t0 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.55);
    });
    window.setTimeout(() => void ctx.close().catch(() => undefined), 1400);
  } catch {
    // No audio, no problem.
  }
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
  const stateRef = useRef(state);
  stateRef.current = state;

  // Reconcile with persisted state once (a session may have ended away).
  useEffect(() => {
    const recovered = loadState(window.localStorage, Date.now());
    stateRef.current = recovered.state;
    setState(recovered.state);
    saveState(window.localStorage, recovered.state);
    setNow(Date.now());
    if (recovered.justFinished === "study") {
      setCelebrating(true);
      playChime();
    } else if (recovered.justFinished === "break") {
      playChime();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist every change.
  useEffect(() => {
    saveState(window.localStorage, state);
  }, [state]);

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
        playChime();
      } else if (result.justFinished === "break") {
        playChime();
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
  };

  const sessionWord = state.completedStudy === 1 ? "session" : "sessions";
  const pipsFilled = Math.min(4, state.completedStudy);
  const currentChoice = choiceOf(state);

  const onChoice = (c: SessionChoice) => {
    if (stateRef.current.status === "running") {
      if (c !== choiceOf(stateRef.current)) {
        setHint("Pause the timer to switch modes.");
      }
      return;
    }
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

      <div className={styles.content}>
        <Quokka stage={stage} activity={activityFor(state)} celebrating={celebrating} />

        <div className={styles.fullness}>
          <span className={styles.dots} aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`${styles.dot}${i < pipsFilled ? ` ${styles.dotFull}` : ""}`}
              />
            ))}
          </span>
          <span>
            {state.completedStudy} {sessionWord} · {STAGE_LABELS[stage]}
          </span>
        </div>

        <div className={styles.console}>
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
