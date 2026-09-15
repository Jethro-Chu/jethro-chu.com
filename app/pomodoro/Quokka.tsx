"use client";

import { memo, useEffect, useRef, useState } from "react";
import { STAGE_LABELS } from "./pomodoroState";
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

    const tick = (now: number) => {
      if (!live) return;
      if (!clockStarted) {
        clockStarted = true;
        nextNibbleAt = now + NIBBLE_MS;
        blinkAt = now + BLINK_GAP_MIN + Math.random() * BLINK_GAP_JITTER;
      }
      if (activity === "study") {
        blinkOn = false;
        if (now >= nextNibbleAt) {
          nibbleB = !nibbleB;
          nextNibbleAt = now + NIBBLE_MS;
        }
      } else if (activity === "idle") {
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
        activity === "study"
          ? nibbleB
            ? "nibble-b"
            : "nibble-a"
          : activity === "break"
            ? "sleep"
            : blinkOn
              ? "blink"
              : "idle";
      const target = frameSrc(stage, pose);
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
