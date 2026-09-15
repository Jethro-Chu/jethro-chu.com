"use client";

import { memo, useEffect, useRef, useState } from "react";
import { STAGE_LABELS } from "./pomodoroState";
import { eatingCompForStage } from "./eating";
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

// Continuous eating during any running Study session: the shipped 5,000ms
// timeline loops back-to-back at every fullness stage, starting with the
// first frame as soon as the session runs. Per-stage size compensation
// (see eating.ts) keeps the quokka from popping while it eats.
const EATING_BASE = "/pomodoro/quokka-eating";
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
// Full loop length: wrapping adds this (instead of re-anchoring to now) so
// the loop can never drift.
const EATING_TOTAL_MS = EATING_CUM[EATING_CUM.length - 1];
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

  // Eating frames preload when a Study session runs; the nibble stays visible
  // until every frame is decoded, then the loop starts on the first frame.
  // A ref (not state) carries readiness so the animation loop below never
  // restarts. The module-level cache makes repeat sessions instant.
  const eatingReadyRef = useRef(false);
  useEffect(() => {
    if (activity !== "study" || reduced || eatingReadyRef.current) {
      return;
    }
    let live = true;
    void Promise.all(EATING_SRCS.map((src) => ensureDecoded(src))).then(() => {
      if (live) eatingReadyRef.current = true;
    });
    return () => {
      live = false;
    };
  }, [activity, reduced]);

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
    // Continuous eating: the 5s timeline loops back-to-back from the first
    // frame while Study runs. A single loop owns it, so sequences can never
    // overlap, and any pause/reset/mode change re-runs this effect,
    // discarding the cycle. Readiness is read per tick (not captured) so a
    // slow preload simply delays the first bite.
    const eatingStudy = activity === "study";
    let eatStep = 0;
    let cycleStart = 0;

    const tick = (now: number) => {
      if (!live) return;
      const eatingLive = eatingStudy && eatingReadyRef.current;
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
      }
      lastNow = now;
      if (eatingLive) {
        // Anchored (not chained) deadlines: every loop spans exactly the
        // timeline's 5,000ms no matter the frame cadence. Wrapping adds the
        // full loop length so the cycle can never drift.
        while (now >= cycleStart + EATING_CUM[eatStep]) {
          eatStep += 1;
          if (eatStep >= EATING_STEPS.length) {
            eatStep = 0;
            cycleStart += EATING_TOTAL_MS;
          }
        }
      }
      // While eating, the timeline owns the frame; otherwise the legacy
      // animation (nibble while studying, blinks while idle) runs.
      const effActivity: QuokkaActivity = activity;
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
      const target = eatingLive
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
  }, [reduced, activity, stage]);

  // While an eating frame is displayed, rescale it to this stage's own body
  // size so the quokka never pops bigger or smaller mid-study. Transform-only:
  // layout never moves, and the ground line stays planted.
  const eatingShown = displaySrc.startsWith(`${EATING_BASE}/`);
  const comp = eatingShown ? eatingCompForStage(stage) : null;

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
          style={
            comp
              ? {
                  transform: `translateX(${comp.txPct}%) scaleX(${comp.sx})`,
                  transformOrigin: "50% 100%",
                }
              : undefined
          }
        />
      </div>
      <div className={styles.groundShadow} aria-hidden="true" />
    </div>
  );
}

// Props are primitives: the parent's 250ms countdown ticks skip this entire
// subtree, so timer renders can never disturb the animation loop.
export const Quokka = memo(QuokkaInner);
