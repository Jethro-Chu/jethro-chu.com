"use client";

/* ============================================================
   VillageNav (HUD)  ·  the district signboard (fast-travel)
   A carved plaque of the village districts. Clicking one fast-travels
   the player to that building (valley:goto) and drops them into its
   room. The active district carries a golden underline notch, synced
   to wherever the player actually is (nav-click, minimap, or walking
   in). The trailing "Portfolio" item leaves the village — integrated
   into the signboard so the exit feels in-world, and so it can never
   collide with the nav the way the old floating button did on
   narrow screens.
   ============================================================ */

import { useEffect, useState } from "react";
import { gameBus } from "@/lib/gameBus";
import { landmarks } from "@/content/portfolio";

export function VillageNav({ onLeave }: { onLeave?: () => void }) {
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
      className="fixed left-1/2 top-3 z-40 max-w-[96vw] -translate-x-1/2"
    >
      <ul className="hud-plaque no-scrollbar flex items-stretch gap-0.5 overflow-x-auto p-1">
        {landmarks.map((l) => {
          const on = active === l.id;
          return (
            <li key={l.id} className="shrink-0">
              <button
                type="button"
                onClick={() => go(l.id)}
                aria-current={on ? "true" : undefined}
                className={`fast-ui label-mono relative rounded-sm px-2.5 py-1.5 text-[0.72rem] font-medium hover:text-[var(--color-golden)]! ${
                  on ? "text-[var(--color-golden)]!" : "text-[var(--color-on-dark)]!"
                }`}
              >
                {l.section}
                <span
                  aria-hidden
                  className={`absolute inset-x-2.5 bottom-0.5 h-[2px] rounded-full transition-opacity duration-150 ${
                    on ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ background: "var(--color-golden)" }}
                />
              </button>
            </li>
          );
        })}
        {onLeave && (
          <li className="ml-1 flex shrink-0 items-stretch border-l border-[color-mix(in_oklab,var(--color-golden)_30%,transparent)] pl-1">
            <button
              type="button"
              onClick={onLeave}
              className="fast-ui label-mono rounded-sm px-2.5 py-1.5 text-[0.72rem] font-medium text-[var(--color-on-dark-muted)]! hover:text-[var(--color-golden)]!"
            >
              ← Portfolio
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}
