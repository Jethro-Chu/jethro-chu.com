"use client";

import { memo, useEffect, useRef, useState } from "react";
import { STAGE_LABELS } from "./pomodoroState";
import eatingTimeline from "../../public/pomodoro/quokka-eating/timeline.json";
import styles from "./pomodoro.module.css";

export type QuokkaActivity = "idle" | "study" | "break";

interface QuokkaProps {
  stage: 0 | 1 | 2 | 3 | 4;
  activity: QuokkaActivity;
  celebrating: boolean;
}

const STAGE_NAMES = ["hungry", "content", "happy", "full", "fullfed"] as const;
type Pose = "idle" | "nibble-a" | "nibble-b" | "sleep" | "blink";
const POSES: Pose[] = ["idle", "nibble-a", "nibble-b", "sleep", "blink"];

const NIBBLE_MS = 1600;
const BLINK_MS = 180;
const BLINK_GAP_MIN = 5200;
const BLINK_GAP_JITTER = 2200;

// Happy-stage eating cycle: the shipped timeline plays once (5,000ms), then
// the quokka rests on the idle animation for 10-20s before eating again.
// HAPPY_STAGE must match STAGE_NAMES/STAGE_LABELS index 2 ("happy").
const HAPPY_STAGE = 2;
const EATING_BASE = "/pomodoro/quokka-eating";
const EATING_GAP_MIN = 10000;
const EATING_GAP_JITTER = 10000;
interface EatingStep {
  file: string;
  duration_ms: number;
}
const EATING_STEPS: EatingStep[] = (
  eatingTimeline as { frames: EatingStep[] }
).frames;
const EATING_SRCS: string[] = [
  ...new Set(EATING_STEPS.map((s) => `${EATING_BASE}/${s.file}`)),
];
// Cumulative step ends. Deadlines anchor to the cycle start plus these, so
// frame quantization can never stretch the sequence past exactly 5,000ms.
const EATING_CUM: number[] = [];
EATING_STEPS.reduce((acc, s) => {
  const end = acc + s.duration_ms;
  EATING_CUM.push(end);
  return end;
}, 0);
// rAF pauses while the tab is hidden; a gap bigger than this means the clock
// jumped, so every animation deadline shifts forward instead of skipping.
const HIDDEN_GAP_MS = 1500;

function frameSrc(stage: number, pose: Pose): string {
  return `/pomodoro/quokka/${STAGE_NAMES[stage]}-${pose}.png`;
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

// Module-level decode cache: one in-flight (or finished) decode per frame,
// shared across mounts so nothing is ever fetched or decoded twice.
const decodedCache = new Map<string, Promise<void>>();

function ensureDecoded(src: string): Promise<void> {
  let pending = decodedCache.get(src);
  if (!pending) {
    pending = (async () => {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
      try {
        await img.decode();
      } catch {
        // A failed frame still resolves: the rendered element keeps showing
        // the previous valid frame instead of hanging the animation.
      }
    })();
    decodedCache.set(src, pending);
  }
  return pending;
}

const ACTIVITY_TEXT: Record<QuokkaActivity, string> = {
  idle: "resting",
  study: "quietly nibbling a leaf",
  break: "sleeping",
};

/**
 * Supplied sprite art in a fixed square frame. Flicker-free by construction:
 * every frame is decode()d before it can be shown, swaps only move forward
 * to an already-decoded bitmap, the <img> element itself is never recreated,
 * and one rAF loop (not scattered timers) drives all animation timing.
 */
function QuokkaInner({ stage, activity, celebrating }: QuokkaProps) {
  const reduced = useReducedMotion();
  const [displaySrc, setDisplaySrc] = useState(() => frameSrc(stage, "idle"));
  const displayRef = useRef(displaySrc);
  const wantedRef = useRef(displaySrc);

  // Decode all 25 frames up front so every later state switch is instant.
  useEffect(() => {
    for (let s = 0; s < STAGE_NAMES.length; s++) {
      for (const p of POSES) void ensureDecoded(frameSrc(s, p));
    }
  }, []);

  // Eating frames preload lazily on first eligibility (happy + studying);
  // the existing nibble stays visible until every frame is decoded, and the
  // module-level cache makes later visits instant.
  const [eatingReady, setEatingReady] = useState(false);
  useEffect(() => {
    if (activity !== "study" || stage !== HAPPY_STAGE || reduced || eatingReady) {
      return;
    }
    let live = true;
    void Promise.all(EATING_SRCS.map((src) => ensureDecoded(src))).then(() => {
      if (live) setEatingReady(true);
    });
    return () => {
      live = false;
    };
  }, [activity, stage, reduced, eatingReady]);

  // The single animation loop. Refs carry the clock so frames never cause
  // re-renders by themselves; only a validated frame swap calls setState.
  useEffect(() => {
    if (reduced) {
      const pose: Pose =
        activity === "study"
          ? "nibble-a"
          : activity === "break"
            ? "sleep"
            : "idle";
      const target = frameSrc(stage, pose);
      wantedRef.current = target;
      let live = true;
      void ensureDecoded(target).then(() => {
        if (
          live &&
          wantedRef.current === target &&
          displayRef.current !== target
        ) {
          displayRef.current = target;
          setDisplaySrc(target);
        }
      });
      return () => {
        live = false;
      };
    }

    let live = true;
    let raf = 0;
    let nibbleB = false;
    let blinkOn = false;
    let nextNibbleAt = 0;
    let blinkAt = 0;
    let blinkOffAt = 0;
    let clockStarted = false;
    let lastNow = 0;
    // Eating cycle: one 5s timeline, then the idle animation for 10-20s.
    // A single loop owns all of it, so sequences can never overlap, and any
    // pause/reset/mode change re-runs this effect, discarding the cycle.
    const eatingEligible =
      activity === "study" && stage === HAPPY_STAGE && eatingReady;
    let eatResting = false;
    let eatStep = 0;
    let cycleStart = 0;
    let restEnd = 0;

    const tick = (now: number) => {
      if (!live) return;
      if (!clockStarted) {
        clockStarted = true;
        nextNibbleAt = now + NIBBLE_MS;
        blinkAt = now + BLINK_GAP_MIN + Math.random() * BLINK_GAP_JITTER;
        cycleStart = now;
      }
      if (lastNow !== 0 && now - lastNow > HIDDEN_GAP_MS) {
        // The tab was hidden (rAF paused): shift every deadline forward by
        // the gap instead of skipping animation phases. Timer math lives
        // elsewhere and is untouched.
        const gap = now - lastNow;
        nextNibbleAt += gap;
        blinkAt += gap;
        blinkOffAt += gap;
        cycleStart += gap;
        restEnd += gap;
      }
      lastNow = now;
      if (eatingEligible) {
        // Anchored (not chained) deadlines: the sequence always spans exactly
        // the timeline's 5,000ms no matter the frame cadence. The loop catches
        // up across sparse ticks without drifting later steps.
        while (!eatResting && now >= cycleStart + EATING_CUM[eatStep]) {
          eatStep += 1;
          if (eatStep >= EATING_STEPS.length) {
            eatResting = true;
            restEnd =
              now + EATING_GAP_MIN + Math.random() * EATING_GAP_JITTER;
          }
        }
        if (eatResting && now >= restEnd) {
          eatResting = false;
          eatStep = 0;
          cycleStart = now;
        }
      }
      // While resting between sequences, the legacy idle animation (with its
      // blinks) runs; while eating, the timeline owns the frame.
      const effActivity: QuokkaActivity =
        eatingEligible && eatResting ? "idle" : activity;
      if (effActivity === "study") {
        blinkOn = false;
        if (now >= nextNibbleAt) {
          nibbleB = !nibbleB;
          nextNibbleAt = now + NIBBLE_MS;
        }
      } else if (effActivity === "idle") {
        nibbleB = false;
        if (!blinkOn && now >= blinkAt) {
          blinkOn = true;
          blinkOffAt = now + BLINK_MS;
        } else if (blinkOn && now >= blinkOffAt) {
          blinkOn = false;
          blinkAt = now + BLINK_GAP_MIN + Math.random() * BLINK_GAP_JITTER;
        }
      } else {
        nibbleB = false;
        blinkOn = false;
      }

      const pose: Pose =
        effActivity === "study"
          ? nibbleB
            ? "nibble-b"
            : "nibble-a"
          : effActivity === "break"
            ? "sleep"
            : blinkOn
              ? "blink"
              : "idle";
      const target =
        eatingEligible && !eatResting
          ? `${EATING_BASE}/${EATING_STEPS[eatStep].file}`
          : frameSrc(stage, pose);
      wantedRef.current = target;
      if (target !== displayRef.current) {
        void ensureDecoded(target).then(() => {
          if (
            live &&
            wantedRef.current === target &&
            displayRef.current !== target
          ) {
            displayRef.current = target;
            setDisplaySrc(target);
          }
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      live = false;
      cancelAnimationFrame(raf);
    };
  }, [reduced, activity, stage, eatingReady]);

  return (
    <div
      className={styles.quokka}
      role="img"
      aria-label={`${STAGE_LABELS[stage]} quokka, ${celebrating ? "happy after a meal" : ACTIVITY_TEXT[activity]}`}
    >
      <div
        className={
          celebrating && !reduced
            ? `${styles.frame} ${styles.celebrating}`
            : styles.frame
        }
      >
        {/* One persistent element: no key, so React never recreates it.
            decoding="sync" pairs with the decode() gate so a swap can only
            paint an already-decoded bitmap. Never a blank frame. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displaySrc}
          alt=""
          draggable={false}
          decoding="sync"
          fetchPriority="high"
          className={`${styles.sprite}${activity === "break" && !reduced ? ` ${styles.breathe}` : ""}`}
        />
      </div>
      <div className={styles.groundShadow} aria-hidden="true" />
    </div>
  );
}

// Props are primitives: the parent's 250ms countdown ticks skip this entire
// subtree, so timer renders can never disturb the animation loop.
export const Quokka = memo(QuokkaInner);
