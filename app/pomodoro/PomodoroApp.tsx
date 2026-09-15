"use client";

import { useEffect, useRef, useState } from "react";
import { Quokka, type QuokkaActivity } from "./Quokka";
import {
  STUDY_SEC,
  choiceOf,
  durationFor,
  fedLabel,
  formatTime,
  loadState,
  parseStudyInput,
  pause,
  remainingNow,
  resetCurrent,
  resetProgression,
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
const BUTTON_SRC = "/pomodoro/button.wav";

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

/** Tiny pixel reset arrow: raw squares, no curves, no emoji-font roulette. */
function ResetIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true" focusable="false">
      <rect x="2" y="3" width="5" height="2" />
      <rect x="2" y="3" width="2" height="8" />
      <rect x="2" y="9" width="8" height="2" />
      <rect x="8" y="4" width="2" height="7" />
      <rect x="8" y="0" width="3" height="1" />
      <rect x="8" y="1" width="4" height="2" />
      <rect x="8" y="3" width="3" height="1" />
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
  const [confirmingReset, setConfirmingReset] = useState(false);
  const resetBtnRef = useRef<HTMLButtonElement>(null);
  const cancelResetRef = useRef<HTMLButtonElement>(null);
  // Custom Study duration for THIS visit only: in-memory state, deliberately
  // never persisted (no localStorage/sessionStorage/cookies/URL), so every
  // fresh visit reopens at the 25:00 default.
  const [studySec, setStudySec] = useState(STUDY_SEC);
  const studySecRef = useRef(STUDY_SEC);
  studySecRef.current = studySec;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const displayBtnRef = useRef<HTMLButtonElement>(null);
  const skipBlurCommit = useRef(false);
  const refocusDisplay = useRef(false);
  const wasEditing = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  // Fresh in every interval tick: the driver effect only re-subscribes on
  // status changes, so it must read sound through a ref, never a closure.
  const soundOnRef = useRef(true);
  soundOnRef.current = soundOn;
  const soundRef = useRef<HTMLAudioElement | null>(null);
  const clickRef = useRef<HTMLAudioElement | null>(null);
  // sessionIds rotate on every start: one ring per finished session even if
  // a tick (or StrictMode) ever delivered justFinished twice.
  const playedSessionRef = useRef<string | null>(null);

  // Reconcile with persisted state once (a session may have ended away).
  useEffect(() => {
    const loaded = loadState(window.localStorage, Date.now());
    // A custom duration must not leak across visits through the persisted
    // idle snapshot: an idle Study timer always reopens at the default.
    // (Running/paused/finished states keep their in-flight progress.)
    const recovered =
      loaded.state.status === "idle" && loaded.state.mode === "study"
        ? { ...loaded, state: { ...loaded.state, remainingSec: STUDY_SEC } }
        : loaded;
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

  // Preload both sounds once so each starts instantly on demand.
  // Element-based (not WebAudio): nothing to build at play time, both play
  // whether the UI is collapsed or not, and neither touches the quokka.
  // The bell and the click stay separate elements with separate jobs.
  useEffect(() => {
    const bell = new Audio(SOUND_SRC);
    bell.preload = "auto";
    bell.loop = false;
    bell.volume = 0.6;
    soundRef.current = bell;
    const click = new Audio(BUTTON_SRC);
    click.preload = "auto";
    click.loop = false;
    click.volume = 0.3;
    clickRef.current = click;
    try {
      bell.load();
      click.load();
    } catch {
      // A sound that never loads simply never plays.
    }
    return () => {
      soundRef.current = null;
      clickRef.current = null;
      try {
        bell.pause();
        click.pause();
      } catch {
        // Unmounting must never throw.
      }
    };
  }, []);

  // Control click for Start/Pause/Resume only. Restarts from the top on
  // every press so rapid clicks stay responsive. Never used for completion
  // (the bell owns that), reset, mode switches, or page load.
  const playClick = () => {
    if (!soundOnRef.current) return;
    const click = clickRef.current;
    if (!click) return;
    try {
      click.currentTime = 0;
      const pending = click.play();
      if (pending) void pending.catch(() => undefined);
    } catch {
      // Blocked, missing, or unloadable: silence is acceptable.
    }
  };

  // Route-scoped scroll lock: while /pomodoro is mounted, the document
  // itself cannot scroll by any vector (wheel, trackpad, PageUp/PageDown,
  // touch, keyboard) — the scene has no scroll offset to follow. The
  // timer dock keeps its own internal scroll on short viewports.
  // Everything is restored on unmount, so the rest of the site is untouched.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyOverscroll: body.style.overscrollBehavior,
    };
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    return () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      body.style.overscrollBehavior = prev.bodyOverscroll;
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

  // Progression-reset dialog: collapsing dismisses it, Escape cancels,
  // focus moves to Cancel while open and returns to the icon on close.
  useEffect(() => {
    if (collapsed) setConfirmingReset(false);
  }, [collapsed]);
  useEffect(() => {
    if (!confirmingReset) return;
    cancelResetRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirmingReset(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      resetBtnRef.current?.focus();
    };
  }, [confirmingReset]);

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

  // Study-duration editor: open focuses and selects the draft; closing via
  // keyboard returns focus to the display (closing via blur deliberately
  // does not, so clicking Start right after typing works on the first tap).
  useEffect(() => {
    if (editing) {
      const el = inputRef.current;
      if (el) {
        el.focus({ preventScroll: true });
        el.select();
      }
    } else if (wasEditing.current && refocusDisplay.current) {
      refocusDisplay.current = false;
      displayBtnRef.current?.focus({ preventScroll: true });
    }
    wasEditing.current = editing;
  }, [editing]);

  const openEditor = () => {
    setDraft(formatTime(stateRef.current.remainingSec));
    skipBlurCommit.current = false;
    setEditing(true);
  };

  // Applies the draft when valid; invalid input restores the previous value
  // by simply changing nothing. The ref updates synchronously so a Start
  // press in the same tick (after a blur-commit) still sees the new value.
  const applyDraft = (raw: string): boolean => {
    if (stateRef.current.status !== "idle" || stateRef.current.mode !== "study") {
      return false;
    }
    const secs = parseStudyInput(raw);
    if (secs === null) return false;
    studySecRef.current = secs;
    setStudySec(secs);
    const next = { ...stateRef.current, remainingSec: secs };
    stateRef.current = next;
    setState(next);
    return true;
  };

  const closeEditor = (save: boolean, refocus: boolean) => {
    // The unmount-triggered blur must not commit a second time.
    skipBlurCommit.current = true;
    refocusDisplay.current = refocus;
    if (save) applyDraft(draft);
    setEditing(false);
  };

  const onEditBlur = () => {
    if (skipBlurCommit.current) {
      skipBlurCommit.current = false;
      return;
    }
    applyDraft(draft);
    setEditing(false);
  };

  const onEditKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") closeEditor(true, true);
    else if (e.key === "Escape") closeEditor(false, true);
  };

  const remaining = remainingNow(state, now || Date.now());
  const full = durationFor(state.mode, state.breakMinutes, studySec);
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

  // The Study display is editable only before Start: idle Study and nothing
  // else. Running, paused, finished, and both Break modes stay locked text.
  const editable = state.mode === "study" && state.status === "idle";

  const stage = stageFor(state.completedStudy);
  const finished = state.status === "finished";
  const running = state.status === "running";

  const primaryLabel = running
    ? "Pause"
    : state.status === "paused"
      ? "Resume"
      : "Start";

  const onPrimary = () => {
    playClick();
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
      const next = start(stateRef.current, t, studySecRef.current);
      stateRef.current = next;
      setState(next);
    }
  };

  const onReset = () => {
    const next = resetCurrent(stateRef.current, studySecRef.current);
    stateRef.current = next;
    setState(next);
    setCelebrating(false);
  };

  // Manual quokka-progression reset (confirm dialog only): count and feed
  // guard back to starting values. The timer Reset button is untouched and
  // still resets only the timer. Durations, sounds, and collapse are
  // untouched; the existing persist effect saves the reset state.
  const onConfirmResetProgression = () => {
    const next = resetProgression(stateRef.current);
    stateRef.current = next;
    setState(next);
    setConfirmingReset(false);
  };

  const onStartNext = () => {
    const t = Date.now();
    setNow(t);
    const next = startNext(stateRef.current, t, studySecRef.current);
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
    const next = selectSession(stateRef.current, c, studySecRef.current);
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
        aria-label={soundOn ? "Mute sounds" : "Unmute sounds"}
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
            drops it from the tab order and the accessibility tree. The dock
            owns the only scroll on the page (short viewports): the quokka
            row above it never moves. */}
        <div className={styles.uiDock}>
        <p className={`${styles.fedCounter}${collapsed ? ` ${styles.hidden}` : ""}`} role="status">
          <PawIcon />
          <span>{fedLabel(state.completedStudy)}</span>
          <button
            ref={resetBtnRef}
            type="button"
            className={styles.progressReset}
            aria-label="Reset quokka progress"
            onClick={() => setConfirmingReset(true)}
          >
            <ResetIcon />
          </button>
        </p>

        {confirmingReset && (
          <div
            className={styles.confirmScrim}
            onClick={() => setConfirmingReset(false)}
          >
            <div
              className={styles.confirmBox}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="quokka-reset-title"
              aria-describedby="quokka-reset-desc"
              onClick={(e) => e.stopPropagation()}
            >
              <p id="quokka-reset-title" className={styles.confirmTitle}>
                Reset your quokka?
              </p>
              <p id="quokka-reset-desc" className={styles.confirmDesc}>
                This will return your quokka to its starting size and reset
                quokkas fed to 0.
              </p>
              <div className={styles.confirmBtns}>
                <button
                  ref={cancelResetRef}
                  type="button"
                  className={styles.confirmBtn}
                  onClick={() => setConfirmingReset(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`${styles.confirmBtn} ${styles.confirmGo}`}
                  onClick={onConfirmResetProgression}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

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
          {editing ? (
            <input
              ref={inputRef}
              className={`${styles.timer} ${styles.timerInput}`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={onEditBlur}
              onKeyDown={onEditKey}
              aria-label="Study duration, minutes and seconds"
              type="text"
              inputMode="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              maxLength={6}
            />
          ) : editable ? (
            <button
              ref={displayBtnRef}
              type="button"
              className={`${styles.timer} ${styles.timerBtn}`}
              onClick={openEditor}
              aria-label={`Edit study duration, currently ${formatTime(remaining)}`}
            >
              {formatTime(remaining)}
            </button>
          ) : (
            <p className={styles.timer} role="timer" aria-label={`Time remaining: ${formatTime(remaining)}`}>
              {formatTime(remaining)}
            </p>
          )}
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
      </div>
    </main>
  );
}
