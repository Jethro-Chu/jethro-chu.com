"use client";

/* ============================================================
   Discovered (HUD)  ·  DOM overlay, N / 7 landmarks found (§2)
   Reads landmark:discovered off the bus. Existing tokens + mono.
   ============================================================ */

import { useEffect, useState } from "react";
import { gameBus } from "@/lib/gameBus";
import { useIsTouch } from "@/lib/useIsTouch";
import { landmarks } from "@/content/portfolio";

export function Discovered() {
  const [found, setFound] = useState<Set<string>>(new Set());
  // On touch the minimap sits bottom-left with a "found / total" header, so this
  // standalone counter is redundant (and would collide with the map). Desktop keeps it.
  const touch = useIsTouch();

  useEffect(
    () =>
      gameBus.on("landmark:discovered", ({ id }) =>
        setFound((prev) => {
          const next = new Set(prev);
          next.add(id);
          return next;
        })
      ),
    []
  );

  if (touch) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-3 left-3 z-40 rounded-sm border border-[var(--color-granite-line)] bg-[var(--color-shadow)] px-2.5 py-1.5 shadow-md"
    >
      <span className="label-mono tnum text-[0.72rem] text-[var(--color-on-dark)]!">
        {found.size} / {landmarks.length} buildings explored
      </span>
    </div>
  );
}
