"use client";

/* ============================================================
   VillageNav (HUD)  ·  Peter-style district nav (fast-travel)
   A DOM nav bar of the village districts. Clicking one fast-travels the
   player to that building (valley:goto) and the scene drops them straight
   into its room. The active district stays highlighted, synced to wherever
   the player actually is (nav-click, minimap, or walking in). Existing
   tokens; DOM (crisp), not in-canvas.
   ============================================================ */

import { useEffect, useState } from "react";
import { gameBus } from "@/lib/gameBus";
import { landmarks } from "@/content/portfolio";

export function VillageNav() {
  const [active, setActive] = useState<string | null>(null);

  // keep the highlight synced to wherever the player actually is
  useEffect(() => gameBus.on("landmark:enter", ({ id }) => setActive(id)), []);

  const go = (id: string) => {
    setActive(id);
    gameBus.emit("valley:goto", { id });
  };

  return (
    <nav
      aria-label="Village districts"
      className="fixed left-1/2 top-3 z-40 max-w-[94vw] -translate-x-1/2"
    >
      <ul className="no-scrollbar flex items-stretch gap-1 overflow-x-auto rounded-md border border-[var(--color-granite-line)] bg-[color-mix(in_oklab,var(--color-card)_92%,transparent)] p-1 shadow-md">
        {landmarks.map((l) => {
          const on = active === l.id;
          return (
            <li key={l.id} className="shrink-0">
              <button
                type="button"
                onClick={() => go(l.id)}
                aria-current={on ? "true" : undefined}
                className={`fast-ui label-mono rounded-sm px-2.5 py-1.5 text-[0.72rem] font-medium hover:bg-[var(--color-pine)] hover:text-[var(--color-on-dark)]! ${
                  on
                    ? "bg-[var(--color-pine)] text-[var(--color-on-dark)]!"
                    : "text-[var(--color-shadow)]!"
                }`}
              >
                {l.section}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
