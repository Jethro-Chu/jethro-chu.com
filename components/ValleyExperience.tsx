"use client";

/* ============================================================
   ValleyExperience  ·  capability gate + entry card + code-split (§4)
   Over the SSR'd FlatValley, shows a lightweight entry card. The
   Phaser engine + tilemap load (ssr:false) ONLY on "Enter the valley",
   so they never ship to the initial load, fallback, reduced-motion,
   or crawler traffic.
   ============================================================ */

import dynamic from "next/dynamic";
import { AnimatePresence, m } from "framer-motion";
import { useEffect, useState } from "react";
import { gameBus } from "@/lib/gameBus";
import { LandmarkModal } from "@/components/valley/LandmarkModal";
import { Discovered } from "@/components/HUD/Discovered";

const PhaserValley = dynamic(() => import("@/game/PhaserValley"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#2f5a42]">
      <span className="label-mono animate-pulse text-[var(--color-on-dark)]">
        loading the valley…
      </span>
    </div>
  ),
});

type Phase = "card" | "playing" | "flat";

function supportsWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl") || c.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

export function ValleyExperience() {
  const [phase, setPhase] = useState<Phase>("card");
  const [capable, setCapable] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const ok = !reduce && supportsWebGL();
    setCapable(ok);
    if (!ok) setPhase("flat");
    // dev convenience: /valley?enter=1 skips the card
    else if (new URLSearchParams(window.location.search).get("enter") === "1")
      setPhase("playing");
  }, []);

  const skip = () => {
    gameBus.emit("game:skip");
    setPhase("flat");
    document.getElementById("main")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <AnimatePresence>
        {phase === "card" && (
          <m.div
            className="fixed inset-0 z-40 flex items-center justify-center bg-[var(--color-sand)] p-5"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-full max-w-sm text-center">
              <span className="eyebrow justify-center">A playable portfolio</span>
              <h1 className="text-summit mt-3 text-[var(--color-shadow)]">Yosemite Valley</h1>
              <p className="mx-auto mt-4 max-w-xs text-[0.95rem] leading-relaxed text-[var(--color-muted)]">
                Explore the valley floor and discover the landmarks. Each one opens a
                real part of the portfolio. Or skip straight to reading it.
              </p>
              <div className="mt-7 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setPhase("playing")}
                  className="fast-ui rounded-sm bg-[var(--color-pine)] px-5 py-3 font-medium text-[var(--color-on-dark)]"
                >
                  Enter the valley
                </button>
                <button
                  type="button"
                  onClick={() => setPhase("flat")}
                  className="fast-ui rounded-sm border border-[var(--color-granite-line)] px-5 py-2.5 text-[0.9rem] font-medium text-[var(--color-shadow)]"
                >
                  Skip to the portfolio
                </button>
              </div>
              <p className="label-mono mt-5 text-[0.62rem] text-[var(--color-muted)]">
                WASD / arrows / drag to move · prototype
              </p>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {phase === "playing" && (
        <div
          className="z-30 bg-[#2f5a42]"
          style={{ position: "fixed", inset: 0 }}
        >
          <PhaserValley />
          <Discovered />
          <LandmarkModal />
          <button
            type="button"
            onClick={skip}
            className="fast-ui label-mono fixed right-3 top-3 z-40 rounded-sm bg-[color-mix(in_oklab,var(--color-shadow)_70%,transparent)] px-3 py-2 text-[0.72rem] text-[var(--color-on-dark)]"
          >
            Skip the valley →
          </button>
        </div>
      )}

      {phase === "flat" && capable && (
        <button
          type="button"
          onClick={() => setPhase("playing")}
          className="fast-ui fixed bottom-5 right-5 z-40 rounded-sm bg-[var(--color-pine)] px-4 py-2.5 text-[0.82rem] font-medium text-[var(--color-on-dark)] shadow-lg"
        >
          Enter the valley
        </button>
      )}
    </>
  );
}
