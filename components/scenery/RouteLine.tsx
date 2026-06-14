"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

/**
 * The climbing route: a thin dashed trail down the left gutter that draws itself
 * as you descend the page, like a route penciled on a topo map. It reveals with
 * a clip wipe (so the dashes stay dashes) keyed to scroll progress. Faint and
 * behind content, desktop only. Under reduced motion it is simply drawn in full.
 */
export function RouteLine() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const clip = useTransform(
    scrollYProgress,
    [0, 1],
    ["inset(0 0 92% 0)", "inset(0 0 0% 0)"]
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-0 -z-10 hidden w-16 lg:block"
    >
      <motion.div
        className="h-full w-full"
        style={{ clipPath: reduce ? "none" : clip }}
      >
        <svg
          className="h-full w-full"
          viewBox="0 0 40 1000"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M20 0 C 12 110, 28 210, 20 320 C 12 430, 30 540, 20 660 C 12 770, 26 880, 20 1000"
            stroke="var(--color-pine)"
            strokeWidth="1.5"
            strokeDasharray="1.5 7"
            strokeLinecap="round"
            opacity="0.4"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </motion.div>
    </div>
  );
}
