"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

/**
 * Parallax scenery: a far ridge that barely moves and a nearer granite edge
 * that drifts more, for depth as you climb. Faint on purpose, low opacity, and
 * behind all content (it never parallaxes the text). Under reduced motion the
 * ridges hold still.
 */
function FarRidge() {
  return (
    <svg
      viewBox="0 0 1440 200"
      preserveAspectRatio="none"
      className="block h-[26vh] w-full text-[var(--color-shadow)]"
      style={{ opacity: 0.07 }}
    >
      <path
        d="M0 200 L0 130 Q200 78 400 108 T800 86 Q1010 60 1210 98 T1440 90 L1440 200 Z"
        fill="currentColor"
      />
    </svg>
  );
}

function NearRidge() {
  return (
    <svg
      viewBox="0 0 1440 160"
      preserveAspectRatio="none"
      className="block h-[17vh] w-full text-[var(--color-shadow)]"
      style={{ opacity: 0.11 }}
    >
      <path
        d="M0 160 L0 96 L180 64 L360 104 L540 58 L760 98 L980 52 L1200 92 L1440 68 L1440 160 Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Scenery() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const farY = useTransform(scrollYProgress, [0, 1], ["0%", "-16%"]);
  const nearY = useTransform(scrollYProgress, [0, 1], ["0%", "-42%"]);

  if (reduce) {
    return (
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 hidden sm:block"
      >
        <div className="absolute inset-x-0 bottom-0">
          <FarRidge />
        </div>
        <div className="absolute inset-x-0 bottom-0">
          <NearRidge />
        </div>
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 hidden h-[40vh] sm:block"
    >
      <motion.div style={{ y: farY }} className="absolute inset-x-0 bottom-0">
        <FarRidge />
      </motion.div>
      <motion.div style={{ y: nearY }} className="absolute inset-x-0 bottom-0">
        <NearRidge />
      </motion.div>
    </div>
  );
}
