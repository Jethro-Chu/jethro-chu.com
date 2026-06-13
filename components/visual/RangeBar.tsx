"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Flowsheet range bar — decile cells that "settle" left-to-right on reveal,
 * like a reading stabilizing. The one signature motion on the site.
 */
export function RangeBar({
  value,
  cells = 12,
  label,
}: {
  value: number;
  cells?: number;
  label?: string;
}) {
  const reduce = useReducedMotion();
  const on = Math.max(0, Math.min(cells, Math.round(value * cells)));

  return (
    <motion.div
      className="flex gap-[3px]"
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
          variants={{
            hidden: { opacity: reduce ? 1 : i < on ? 0.25 : 1, scaleY: reduce ? 1 : i < on ? 0.4 : 1 },
            show: { opacity: 1, scaleY: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
          }}
          style={{ originY: 1 }}
        />
      ))}
    </motion.div>
  );
}
