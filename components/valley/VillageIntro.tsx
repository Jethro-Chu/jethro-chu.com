"use client";

/* ============================================================
   VillageIntro  ·  Peter-style title screen over the live scene
   Renders OVER the running village (which is in scenic "intro" mode:
   animated water/NPCs/birds, controls off). Big title + PLAY + a skip.
   Colors are inline styles (not Tailwind arbitrary `var()` classes, which
   don't always get generated) so they always apply. A flat wash + a
   centered dark "stage" keep the cream title legible over the bright map.
   ============================================================ */

import { m } from "framer-motion";
import { site } from "@/content/content";

const CREAM = "#f4efe3";

export function VillageIntro({
  onPlay,
  onSkip,
}: {
  onPlay: () => void;
  onSkip: () => void;
}) {
  return (
    <m.div
      className="fixed inset-0 z-[58] flex flex-col items-center justify-between py-12 text-center sm:py-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* flat legibility wash over the bright scene */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(18,22,18,0.52) 0%, rgba(18,22,18,0.32) 30%, rgba(18,22,18,0.32) 68%, rgba(18,22,18,0.56) 100%)",
        }}
      />
      {/* centered dark stage so the title + PLAY always pop */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2"
        style={{
          width: "min(760px, 94vw)",
          height: "min(440px, 62vh)",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(ellipse at center, rgba(8,10,8,0.62) 0%, rgba(8,10,8,0.30) 46%, transparent 72%)",
        }}
      />

      {/* top tagline */}
      <p className="relative mx-auto max-w-md px-6">
        <span
          className="label-mono text-[0.8rem] leading-relaxed"
          style={{ color: CREAM, textShadow: "0 1px 5px rgba(0,0,0,0.85)" }}
        >
          {site.tagline}
        </span>
      </p>

      {/* title + PLAY */}
      <div className="relative flex flex-col items-center gap-8">
        <div>
          <h1
            className="text-summit"
            style={{
              color: "#f7f2e7",
              textShadow:
                "0 2px 0 #14170f, 0 4px 3px rgba(0,0,0,0.5), 0 0 36px rgba(0,0,0,0.7)",
              WebkitTextStroke: "1px rgba(18,21,13,0.5)",
            }}
          >
            {site.name}
          </h1>
          <div className="mt-2 flex items-center justify-center gap-3">
            <span className="h-px w-12" style={{ background: CREAM, opacity: 0.8 }} />
            <span
              className="label-mono text-[0.72rem] tracking-[0.34em]"
              style={{ color: CREAM, textShadow: "0 1px 4px rgba(0,0,0,0.85)" }}
            >
              PORTFOLIO
            </span>
            <span className="h-px w-12" style={{ background: CREAM, opacity: 0.8 }} />
          </div>
        </div>

        <button
          type="button"
          onClick={onPlay}
          className="fast-ui rounded-md font-display text-2xl font-bold tracking-wide hover:brightness-[1.07] active:translate-y-[3px]"
          style={{
            background: "var(--color-golden)",
            color: "#2a2012",
            padding: "0.7rem 3.4rem",
            border: "2px solid rgba(20,16,8,0.45)",
            boxShadow: "0 6px 0 #6b4310, 0 12px 24px rgba(0,0,0,0.45)",
          }}
        >
          PLAY
        </button>
      </div>

      {/* bottom skip */}
      <div className="relative flex flex-wrap items-center justify-center gap-3 px-6">
        <span
          className="label-mono text-[0.74rem]"
          style={{ color: CREAM, textShadow: "0 1px 4px rgba(0,0,0,0.85)" }}
        >
          No time to explore?
        </span>
        <button
          type="button"
          onClick={onSkip}
          className="fast-ui label-mono rounded-sm text-[0.74rem] hover:bg-white/10"
          style={{
            color: CREAM,
            border: "1px solid rgba(244,239,227,0.8)",
            padding: "0.4rem 0.85rem",
            textShadow: "0 1px 3px rgba(0,0,0,0.7)",
          }}
        >
          Read the portfolio →
        </button>
      </div>
    </m.div>
  );
}
