"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Flowsheet range bar: decile cells that "settle" left-to-right on reveal,
 * like a reading stabilizing. State drives color via globals.css:
 *   in-range = --color-primary · watch = --color-amber · critical = --color-critical
 */
export function RangeBar({
  value,
  cells = 12,
  label,
  state = "in-range",
  className,
}: {
  value: number;
  cells?: number;
  label?: string;
  state?: "in-range" | "watch" | "critical";
  className?: string;
}) {
  const reduce = useReducedMotion();
  const on = Math.max(0, Math.min(cells, Math.round(value * cells)));

  return (
    <motion.div
      className={cn("flex gap-[3px]", className)}
      role="img"
      aria-label={label ?? `${Math.round(value * 100)} percent of reference`}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.035 } } }}
    >
      {Array.from({ length: cells }).map((_, i) => (
        <motion.span
          key={i}
          className="range-cell"
          data-on={i < on}
          data-state={state}
          variants={{
            hidden: {
              opacity: reduce ? 1 : i < on ? 0.25 : 1,
              scaleY: reduce ? 1 : i < on ? 0.4 : 1,
            },
            show: {
              opacity: 1,
              scaleY: 1,
              transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
            },
          }}
          style={{ originY: 1 }}
        />
      ))}
    </motion.div>
  );
}
