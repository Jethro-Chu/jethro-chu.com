"use client";

/* ============================================================
   EnterPrompt (HUD)  ·  "Enter?" door confirmation
   The scene emits valley:near with a door id the moment the hiker is
   standing ON a door (never a tile early), or null when they step off.
   This renders a small bottom-centre card so entering a building is a
   CHOICE — click Enter (or press Enter / E) to go in, or just walk away.
   Exiting a room stays automatic (handled in InteriorRoom), so there is
   no matching "leave?" prompt. Reads valley:near; emits valley:enter.
   ============================================================ */

import { m } from "framer-motion";
import { useEffect, useState } from "react";
import { gameBus } from "@/lib/gameBus";
import { landmarkById, type Landmark } from "@/content/portfolio";

export function EnterPrompt() {
  const [landmark, setLandmark] = useState<Landmark | null>(null);

  useEffect(() => {
    const off1 = gameBus.on("valley:near", ({ id }) =>
      setLandmark(id ? landmarkById(id) ?? null : null)
    );
    // a room just opened (or the scene paused) — never leave the prompt hanging
    const off2 = gameBus.on("game:pause", () => setLandmark(null));
    return () => {
      off1();
      off2();
    };
  }, []);

  // No AnimatePresence: `landmark` going null unmounts instantly (matches the
  // other HUD pills). The id `key` restarts the pop-in when moving door→door.
  if (!landmark) return null;
  return (
    <m.div
      key={landmark.id}
      className="fixed bottom-20 left-1/2 z-[46] -translate-x-1/2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
    >
      <div className="flex items-center gap-3 rounded-md border border-[var(--color-granite-line)] bg-[color-mix(in_oklab,var(--color-shadow)_90%,transparent)] py-2 pl-3.5 pr-2 shadow-lg">
        <div className="flex flex-col">
          <span className="eyebrow text-[0.6rem] text-[var(--color-golden)]">
            {landmark.section}
          </span>
          <span className="label-mono text-[0.78rem] leading-tight text-[var(--color-on-dark)]">
            Enter {landmark.landmark}?
          </span>
        </div>
        <button
          type="button"
          onClick={() => gameBus.emit("valley:enter")}
          className="fast-ui label-mono shrink-0 rounded-sm bg-[var(--color-pine)] px-3.5 py-2 text-[0.72rem] font-medium text-[var(--color-on-dark)] hover:brightness-110"
        >
          Enter <span aria-hidden className="opacity-70">⏎</span>
        </button>
      </div>
    </m.div>
  );
}
