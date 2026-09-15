"use client";

import { useEffect, useRef, useState } from "react";
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

function preload(src: string, loaded: Set<string>) {
  if (loaded.has(src)) return;
  const img = new Image();
  img.decoding = "async";
  img.onload = () => loaded.add(src);
  img.onerror = () => loaded.add(src);
  img.src = src;
}

const ACTIVITY_TEXT: Record<QuokkaActivity, string> = {
  idle: "resting",
  study: "quietly nibbling a leaf",
  break: "sleeping",
};

/**
 * Supplied sprite art in a fixed square frame. Frames within a stage share
 * alignment, so pose swaps never jump; the displayed frame only swaps after
 * the next one decodes, so swaps never flicker or flash empty.
 */
export function Quokka({ stage, activity, celebrating }: QuokkaProps) {
  const reduced = useReducedMotion();
  const [blinkOn, setBlinkOn] = useState(false);
  const [nibbleB, setNibbleB] = useState(false);
  const [displaySrc, setDisplaySrc] = useState(() => frameSrc(stage, "idle"));
  const loadedRef = useRef<Set<string>>(new Set());

  let pose: Pose = "idle";
  if (activity === "study") pose = !reduced && nibbleB ? "nibble-b" : "nibble-a";
  else if (activity === "break") pose = "sleep";
  else pose = !reduced && blinkOn ? "blink" : "idle";
  const target = frameSrc(stage, pose);

  // Swap the visible frame only once the target has decoded.
  useEffect(() => {
    if (displaySrc === target || loadedRef.current.has(target)) {
      if (displaySrc !== target) setDisplaySrc(target);
      return;
    }
    let live = true;
    const img = new Image();
    img.decoding = "async";
    const done = () => {
      loadedRef.current.add(target);
      if (live) setDisplaySrc(target);
    };
    img.onload = done;
    img.onerror = done;
    img.src = target;
    return () => {
      live = false;
    };
  }, [target, displaySrc]);

  // Preload this stage now; the rest shortly after, never all at once.
  useEffect(() => {
    for (const p of POSES) preload(frameSrc(stage, p), loadedRef.current);
    const id = window.setTimeout(() => {
      for (let s = 0; s < STAGE_NAMES.length; s++) {
        if (s === stage) continue;
        for (const p of POSES) preload(frameSrc(s, p), loadedRef.current);
      }
    }, 2500);
    return () => window.clearTimeout(id);
  }, [stage]);

  // Brief blink every few seconds while idle.
  useEffect(() => {
    if (reduced || activity !== "idle") {
      setBlinkOn(false);
      return;
    }
    let live = true;
    let onId = 0;
    let offId = 0;
    const schedule = () => {
      onId = window.setTimeout(() => {
        if (!live) return;
        setBlinkOn(true);
        offId = window.setTimeout(() => {
          if (!live) return;
          setBlinkOn(false);
          schedule();
        }, 180);
      }, 5200 + Math.random() * 2200);
    };
    schedule();
    return () => {
      live = false;
      window.clearTimeout(onId);
      window.clearTimeout(offId);
    };
  }, [reduced, activity]);

  // Slow chew alternation while studying.
  useEffect(() => {
    if (reduced || activity !== "study") {
      setNibbleB(false);
      return;
    }
    const id = window.setInterval(() => setNibbleB((v) => !v), 1600);
    return () => window.clearInterval(id);
  }, [reduced, activity]);

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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displaySrc}
          alt=""
          draggable={false}
          decoding="async"
          fetchPriority="high"
          className={`${styles.sprite}${activity === "break" && !reduced ? ` ${styles.breathe}` : ""}`}
        />
      </div>
      <div className={styles.groundShadow} aria-hidden="true" />
    </div>
  );
}
