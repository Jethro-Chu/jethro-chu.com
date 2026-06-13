"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { site } from "@/lib/site";

const headlineLines = [
  ["I", "build", "healthcare"],
  ["&", "AI", "products"],
  ["people", "actually", "trust."],
];

export function Hero() {
  const reduce = useReducedMotion();

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.045, delayChildren: 0.15 } },
  };
  const word = {
    hidden: { opacity: 0, y: reduce ? 0 : "0.9em", rotate: reduce ? 0 : 2 },
    show: {
      opacity: 1,
      y: 0,
      rotate: 0,
      transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-5 pb-16 pt-32 sm:px-8"
    >
      {/* faint grid behind hero */}
      <div aria-hidden className="bg-grid absolute inset-0 -z-10" />

      <div className="mx-auto w-full max-w-7xl">
        {/* availability badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-line bg-surface/40 py-1.5 pl-2 pr-3.5 backdrop-blur"
        >
          <span className="relative grid size-5 place-items-center">
            <span className="absolute inline-flex size-2.5 animate-[pulse-ring_3s_ease-out_infinite] rounded-full bg-aqua" />
            <span className="relative inline-flex size-2 rounded-full bg-aqua" />
          </span>
          <span className="text-sm text-bone-dim">
            Available for select projects · {site.location}
          </span>
        </motion.div>

        {/* headline */}
        <motion.h1
          variants={container}
          initial="hidden"
          animate="show"
          className="text-hero font-medium tracking-tight"
          aria-label="I build healthcare and AI products people actually trust."
        >
          {headlineLines.map((line, li) => (
            <span key={li} className="block overflow-hidden">
              <span className="flex flex-wrap gap-x-[0.28em]">
                {line.map((w, wi) => {
                  const isEmphasis =
                    w === "trust." || w === "AI" || w === "healthcare";
                  return (
                    <motion.span
                      key={wi}
                      variants={word}
                      className={
                        isEmphasis
                          ? "font-display font-normal italic text-gradient"
                          : ""
                      }
                    >
                      {w}
                    </motion.span>
                  );
                })}
              </span>
            </span>
          ))}
        </motion.h1>

        {/* subhead + CTAs */}
        <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-md text-pretty text-lg leading-relaxed text-bone-dim"
          >
            I&apos;m {site.name} — a nurse turned builder. I design and ship software
            at the seam of <span className="text-bone">clinical reality</span>,{" "}
            <span className="text-bone">careful UX</span>, and{" "}
            <span className="text-bone">honest AI</span>.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center gap-3"
          >
            <Button href="/#work" size="lg" arrow magnetic>
              View selected work
            </Button>
            <Button href="/#contact" size="lg" variant="outline">
              Get in touch
            </Button>
          </motion.div>
        </div>
      </div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="pointer-events-none absolute bottom-7 left-1/2 hidden -translate-x-1/2 sm:block"
      >
        <div className="flex flex-col items-center gap-2 text-bone-faint">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em]">
            Scroll
          </span>
          <motion.span
            animate={reduce ? {} : { y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArrowDown className="size-4" />
          </motion.span>
        </div>
      </motion.div>
    </section>
  );
}
