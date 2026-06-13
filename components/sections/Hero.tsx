"use client";

import { motion, useReducedMotion } from "framer-motion";
import { hero } from "@/lib/site";
import { Button } from "@/components/ui/Button";

const EASE = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const reduce = useReducedMotion();

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay, ease: EASE },
  });

  return (
    <section
      id="top"
      className="flex min-h-[88svh] flex-col justify-center px-6 pb-16 pt-32 sm:px-8 sm:pt-36 lg:px-16"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        {/* clinical record header */}
        <motion.div
          {...rise(0)}
          className="flex items-center justify-between border-t border-ink pt-2"
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink">
            {hero.record}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
            {hero.locus}
          </span>
        </motion.div>

        {/* headline */}
        <motion.h1
          {...rise(0.08)}
          className="mt-10 font-display text-hero font-medium uppercase tracking-[0.005em]"
        >
          Nurse <span className="text-muted">&amp;</span> Builder
        </motion.h1>

        {/* subline + CTA */}
        <div className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <motion.p
            {...rise(0.16)}
            className="max-w-md text-pretty text-lg leading-relaxed text-muted"
          >
            {hero.subline}
          </motion.p>
          <motion.div {...rise(0.22)}>
            <Button href="/#work" size="lg" arrow>
              View work
            </Button>
          </motion.div>
        </div>

        {/* status reading — label / value, echoing the lab panel */}
        <motion.div
          {...rise(0.3)}
          className="mt-14 flex items-center gap-3 border-t border-line pt-3 font-mono text-[11px] uppercase tracking-[0.18em]"
        >
          <span className="text-muted">{hero.statusLabel}</span>
          <span aria-hidden className="h-3 w-px bg-line" />
          <span className="text-ink">{hero.statusValue}</span>
        </motion.div>
      </div>
    </section>
  );
}
