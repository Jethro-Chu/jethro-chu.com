"use client";

import { motion, useReducedMotion } from "framer-motion";
import { hero } from "@/lib/site";
import { Button } from "@/components/ui/Button";
import { VitalsWaveform } from "@/components/visual/VitalsWaveform";
import { cn } from "@/lib/utils";

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
      className="relative flex min-h-[92svh] flex-col justify-center overflow-hidden px-6 pb-16 pt-32 sm:px-8 sm:pt-36 lg:px-16"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        <motion.p {...rise(0)} className="eyebrow eyebrow-brand">
          Nurse · Builder · {hero.locus}
        </motion.p>

        <motion.h1
          {...rise(0.08)}
          className="mt-5 font-display text-hero font-medium uppercase tracking-[0.005em]"
        >
          Nurse <span className="text-primary">&amp;</span> Builder
        </motion.h1>

        {/* the signature: a lead-II ECG that draws once and parks one amber R-peak */}
        <motion.div {...rise(0.16)} className="mt-5 h-16 sm:h-24" aria-hidden>
          <VitalsWaveform
            height={140}
            beats={4}
            startGap={0.02}
            endGap={0.02}
            strokeWidth={2.25}
            rPeakIndex={1}
          />
        </motion.div>

        <div className="mt-6 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <motion.p
            {...rise(0.24)}
            className="max-w-md text-pretty text-lg leading-relaxed text-muted"
          >
            {hero.subline}
          </motion.p>
          <motion.div {...rise(0.3)} className="flex flex-wrap items-center gap-3">
            <Button href={hero.primaryCta.href} size="lg" arrow>
              {hero.primaryCta.label}
            </Button>
            <Button href={hero.secondaryCta.href} size="lg" variant="outline">
              {hero.secondaryCta.label}
            </Button>
          </motion.div>
        </div>

        {/* vitals strip: real, traceable numbers */}
        <motion.dl
          {...rise(0.36)}
          className="mt-14 grid max-w-2xl grid-cols-3 border-t border-line"
        >
          {hero.vitals.map((v, i) => (
            <div
              key={v.label}
              className={cn("flex flex-col py-4", i > 0 && "border-l border-line pl-5")}
            >
              <dd
                className={cn(
                  "font-mono text-2xl tabular-nums sm:text-3xl",
                  i === 0 ? "text-primary" : "text-ink"
                )}
              >
                {v.value}
              </dd>
              <dt className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                {v.label}
              </dt>
            </div>
          ))}
        </motion.dl>

        <motion.div
          {...rise(0.42)}
          className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-3 font-mono text-[11px] uppercase tracking-[0.18em]"
        >
          <span className="text-ink">{hero.record}</span>
          <span aria-hidden className="h-3 w-px bg-line" />
          <span className="text-muted">{hero.locus}</span>
          <span aria-hidden className="h-3 w-px bg-line" />
          <span className="inline-flex items-center gap-1.5 text-ink">
            <span className="size-1.5 rounded-full bg-primary" />
            {hero.statusValue}
          </span>
        </motion.div>
      </div>
    </section>
  );
}
