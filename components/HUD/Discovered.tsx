"use client";

/* ============================================================
   Discovered (HUD)  ·  DOM overlay, N / 7 landmarks found (§2)
   Reads landmark:discovered off the bus. Existing tokens + mono.
   ============================================================ */

import { useEffect, useState } from "react";
import { gameBus } from "@/lib/gameBus";
import { landmarks } from "@/content/portfolio";

export function Discovered() {
  const [found, setFound] = useState<Set<string>>(new Set());

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

  return (
    <div
      className="pointer-events-none fixed left-3 top-3 z-40 rounded-sm bg-[color-mix(in_oklab,var(--color-shadow)_70%,transparent)] px-2.5 py-1.5"
      aria-hidden
    >
      <span className="label-mono tnum text-[0.72rem] text-[var(--color-on-dark)]">
        {found.size} / {landmarks.length} viewpoints
      </span>
    </div>
  );
}
