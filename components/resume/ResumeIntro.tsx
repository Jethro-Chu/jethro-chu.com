"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

/**
 * A short, calm "building" intro shown once when the /resume page mounts. The
 * resume content is always rendered underneath (no layout shift); a cream
 * overlay plays the word "building" + a drawing route line, then lifts away and
 * the content settles in. Reduced motion skips it entirely. ~1.3s total.
 */
const WORD = "building";

export function ResumeReveal({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  // phase: "in" (assembling) -> "lift" (word leaves) -> "out" (overlay gone)
  const [phase, setPhase] = useState<"in" | "lift" | "out">("in");
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (reduce) {
      setPhase("out");
      setRevealed(true);
      return;
    }
    const t1 = setTimeout(() => setPhase("lift"), 900);
    const t2 = setTimeout(() => {
      setPhase("out");
      setRevealed(true);
    }, 1220);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [reduce]);

  return (
    <>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={revealed ? { opacity: 1, y: 0 } : reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>

      <AnimatePresence>
        {!reduce && phase !== "out" && (
          <motion.div
            key="resume-intro"
            aria-hidden
            className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-[var(--color-sand)]"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <motion.div
              className="flex flex-col items-center"
              animate={phase === "lift" ? { opacity: 0, y: -10 } : { opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.p
                className="label-mono mb-4 text-[0.66rem]"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.4 }}
              >
                resume / clinical route
              </motion.p>

              <p className="text-summit text-[var(--color-shadow)]" aria-label={WORD}>
                {WORD.split("").map((ch, i) => (
                  <motion.span
                    key={i}
                    className="inline-block"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.14 + i * 0.045, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {ch}
                  </motion.span>
                ))}
              </p>

              {/* a thin route line drawing underneath the word */}
              <svg width="220" height="26" viewBox="0 0 220 26" fill="none" className="mt-3">
                <motion.path
                  d="M4 18 C 44 6, 78 22, 110 12 S 178 4, 216 16"
                  stroke="var(--color-pine)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.65 }}
                  transition={{ pathLength: { delay: 0.3, duration: 0.7, ease: "easeInOut" }, opacity: { delay: 0.3, duration: 0.2 } }}
                />
                <motion.circle
                  cx="110"
                  cy="12"
                  r="2.6"
                  fill="var(--color-golden)"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.72, duration: 0.25 }}
                />
              </svg>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
