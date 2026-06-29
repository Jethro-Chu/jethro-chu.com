"use client";

/* ============================================================
   Minimap (HUD)  ·  DOM overlay (a key Peter element)
   A small top-down map of the village with building markers + visited
   state and the live player dot. Reads player:move + landmark:discovered
   off the bus. Existing tokens + mono; pointer-events none.
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { gameBus } from "@/lib/gameBus";
import { landmarks } from "@/content/portfolio";

// normalized building positions on the map (match VillageScene tile coords / 56x44)
const MARKS: { id: string; x: number; y: number }[] = [
  { id: "visitor-center", x: 26 / 56, y: 8 / 44 },
  { id: "ranger-station", x: 13 / 56, y: 10 / 44 },
  { id: "ahwahnee", x: 44 / 56, y: 13 / 44 },
  { id: "chapel", x: 11 / 56, y: 24 / 44 },
  { id: "general-store", x: 44 / 56, y: 26 / 44 },
  { id: "cabins", x: 14 / 56, y: 33 / 44 },
  { id: "glacier-point", x: 28 / 56, y: 41 / 44 },
];
const label = (id: string) => landmarks.find((l) => l.id === id)?.section ?? id;

export function Minimap() {
  const [pos, setPos] = useState({ x: 0.5, y: 0.46 });
  const [found, setFound] = useState<Set<string>>(new Set());
  const posRef = useRef(pos);

  useEffect(() => {
    const off1 = gameBus.on("player:move", (p) => {
      // throttle React updates a touch
      if (Math.abs(p.x - posRef.current.x) > 0.004 || Math.abs(p.y - posRef.current.y) > 0.004) {
        posRef.current = p;
        setPos(p);
      }
    });
    const off2 = gameBus.on("landmark:discovered", ({ id }) =>
      setFound((prev) => new Set(prev).add(id))
    );
    return () => {
      off1();
      off2();
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed bottom-3 right-3 z-40 hidden h-32 w-44 rounded-sm border border-[var(--color-granite-line)] bg-[color-mix(in_oklab,var(--color-shadow)_80%,transparent)] sm:block"
      aria-hidden
    >
      <span className="label-mono absolute left-1.5 top-1 text-[0.56rem] text-[var(--color-on-dark-muted)]">
        village
      </span>
      {MARKS.map((m) => (
        <span
          key={m.id}
          className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-[1px]"
          style={{
            left: `${m.x * 100}%`,
            top: `${m.y * 100}%`,
            backgroundColor: found.has(m.id) ? "var(--color-golden)" : "var(--color-on-dark-muted)",
          }}
          title={label(m.id)}
        />
      ))}
      <span
        className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--color-shadow)] bg-[var(--color-pine-bright,#5FD8BE)]"
        style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%`, backgroundColor: "var(--color-card)" }}
      />
    </div>
  );
}
