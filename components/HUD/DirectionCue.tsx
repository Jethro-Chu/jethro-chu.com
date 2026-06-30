"use client";

/* ============================================================
   DirectionCue (HUD)  ·  "which way do I walk" wayfinding
   A bottom-centre pill with an arrow that rotates to point toward the
   nearest UNVISITED building, plus its name. The top-down camera is
   axis-aligned, so the world direction (atan2 in tile space) is also
   the on-screen direction. Hides when you're on top of it / all visited.
   Reads player:move + landmark:discovered. Pointer-events none.
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { gameBus } from "@/lib/gameBus";
import { landmarks, villageMap } from "@/content/portfolio";

export function DirectionCue() {
  const [cue, setCue] = useState<{ label: string; angle: number } | null>(null);
  const found = useRef<Set<string>>(new Set());
  const lastAngle = useRef(999);
  const lastLabel = useRef("");

  useEffect(() => {
    const off1 = gameBus.on("player:move", (p) => {
      const px = p.x * villageMap.w;
      const py = p.y * villageMap.h;
      let best: { l: (typeof landmarks)[number]; dx: number; dy: number; d: number } | null = null;
      for (const l of landmarks) {
        if (found.current.has(l.id)) continue;
        const dx = l.map.x - px;
        const dy = l.map.y - py;
        const d = Math.hypot(dx, dy);
        if (!best || d < best.d) best = { l, dx, dy, d };
      }
      if (!best || best.d < 2.6) {
        if (lastLabel.current) {
          lastLabel.current = "";
          setCue(null);
        }
        return;
      }
      const angle = (Math.atan2(best.dy, best.dx) * 180) / Math.PI;
      // only re-render on a meaningful change (throttle React churn)
      if (best.l.section === lastLabel.current && Math.abs(angle - lastAngle.current) < 4) return;
      lastAngle.current = angle;
      lastLabel.current = best.l.section;
      setCue({ label: best.l.section, angle });
    });
    const off2 = gameBus.on("landmark:discovered", ({ id }) => found.current.add(id));
    return () => {
      off1();
      off2();
    };
  }, []);

  if (!cue) return null;
  return (
    <div className="pointer-events-none fixed bottom-16 left-3 z-40 sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2">
      <div className="flex items-center gap-2 rounded-full border border-[var(--color-granite-line)] bg-[color-mix(in_oklab,var(--color-shadow)_82%,transparent)] py-1.5 pl-2.5 pr-3.5 shadow-md">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          style={{ transform: `rotate(${cue.angle}deg)`, color: "var(--color-golden)" }}
        >
          <path
            d="M3 12h14M11 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="label-mono text-[0.72rem] text-[var(--color-on-dark)]!">{cue.label}</span>
      </div>
    </div>
  );
}
