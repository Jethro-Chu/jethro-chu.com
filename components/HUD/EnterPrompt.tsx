"use client";

/* ============================================================
   EnterPrompt (HUD)  ·  the door invitation
   The scene emits valley:near with a door id the moment the hiker is
   standing at a door (never automatically entering), plus
   valley:nearpos each frame with the viewport anchor just above the
   hiker's head. This floats one carved plaque BUTTON over the
   entrance — the place name up top, the action ("Open Resume",
   "Visit Clinical") as the line you click — with a caret pointing at
   the doorway. Click it (or press Enter / E) to go in, or walk away.
   The anchor is written straight to the DOM (no per-frame React
   renders) so it tracks the doorway smoothly as the camera follows.
   Reads valley:near + valley:nearpos; emits valley:enter.
   ============================================================ */

import { m } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { gameBus } from "@/lib/gameBus";
import { landmarkById, type Landmark } from "@/content/portfolio";

export function EnterPrompt() {
  const [landmark, setLandmark] = useState<Landmark | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const posRef = useRef<{ x: number; y: number } | null>(null);

  // Position the card centred above the anchor, but clamped to stay fully on
  // screen — buildings near a map edge leave the camera bounds-clamped, so the
  // doorway (and the player) can sit well off-centre.
  const apply = useCallback((p: { x: number; y: number }) => {
    const el = anchorRef.current;
    if (!el) return;
    const margin = 10;
    const halfW = el.offsetWidth / 2 || 120;
    const h = el.offsetHeight || 64; // card + caret; the card sits above the anchor
    const x = Math.min(Math.max(p.x, halfW + margin), window.innerWidth - halfW - margin);
    const y = Math.min(Math.max(p.y, h + margin), window.innerHeight - margin);
    el.style.transform = `translate(${x}px, ${y}px)`;
    el.style.visibility = "visible";
  }, []);

  useEffect(() => {
    const off1 = gameBus.on("valley:near", ({ id }) =>
      setLandmark(id ? landmarkById(id) ?? null : null)
    );
    // a room just opened (or the scene paused) — never leave the prompt hanging
    const off2 = gameBus.on("game:pause", () => setLandmark(null));
    // high-frequency anchor updates: write to the DOM directly, no re-render
    const off3 = gameBus.on("valley:nearpos", (p) => {
      posRef.current = p;
      apply(p);
    });
    return () => {
      off1();
      off2();
      off3();
    };
  }, [apply]);

  // clamp + place immediately on open, before paint (no unclamped flash)
  useLayoutEffect(() => {
    if (landmark && posRef.current) apply(posRef.current);
  }, [landmark, apply]);

  if (!landmark) return null;
  return (
    // anchor point (viewport px) — positioned + revealed imperatively via apply()
    <div
      ref={anchorRef}
      className="pointer-events-none fixed left-0 top-0 z-[46]"
      style={{ visibility: "hidden" }}
    >
      {/* lift the card so its bottom-centre sits on the anchor (above the head) */}
      <div className="-translate-x-1/2 -translate-y-full">
        <m.div
          key={landmark.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16 }}
          className="flex flex-col items-center"
        >
          <button
            type="button"
            onClick={() => gameBus.emit("valley:enter")}
            className="hud-plaque fast-ui pointer-events-auto flex items-center gap-3 py-2 pl-3.5 pr-2.5 text-left hover:brightness-110"
          >
            <span className="flex flex-col">
              <span className="eyebrow text-[0.58rem] text-[var(--color-golden)]!">
                {landmark.landmark}
              </span>
              <span className="label-mono text-[0.8rem] font-medium leading-tight text-[var(--color-on-dark)]!">
                {landmark.cta ?? `Enter ${landmark.section}`}
              </span>
            </span>
            <span
              aria-hidden
              className="label-mono shrink-0 rounded-sm px-2 py-1.5 text-[0.72rem] font-bold"
              style={{ background: "var(--color-golden)", color: "#2a2012" }}
            >
              ⏎
            </span>
          </button>
          {/* caret pointing down at the doorway */}
          <div
            className="-mt-px h-0 w-0 border-x-[7px] border-t-[8px] border-x-transparent drop-shadow"
            style={{ borderTopColor: "var(--color-bark)" }}
          />
        </m.div>
      </div>
    </div>
  );
}
