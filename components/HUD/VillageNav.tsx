"use client";

/* ============================================================
   VillageNav (HUD)  ·  Peter-style teleport nav + arrival label
   A DOM nav bar of the village districts. Clicking one teleports the
   player + camera to that building (valley:goto, the scene does a
   flash), shows a big animated district label, then opens the panel.
   Existing tokens; DOM (crisp), not in-canvas.
   ============================================================ */

import { AnimatePresence, m } from "framer-motion";
import { useEffect, useState } from "react";
import { gameBus } from "@/lib/gameBus";
import { landmarks } from "@/content/portfolio";

export function VillageNav() {
  const [label, setLabel] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);

  // keep the active highlight in sync with wherever the player actually is
  // (whether they arrived by nav-click, minimap, or walking in)
  useEffect(() => gameBus.on("landmark:enter", ({ id }) => setActive(id)), []);

  const go = (id: string, section: string) => {
    setActive(id);
    gameBus.emit("valley:goto", { id }); // scene flash-travels + opens the panel
    setLabel(section);
    window.setTimeout(() => setLabel((l) => (l === section ? null : l)), 1300);
  };

  return (
    <>
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
                  onClick={() => go(l.id, l.section)}
                  aria-current={on ? "true" : undefined}
                  className={`fast-ui label-mono rounded-sm px-2.5 py-1.5 text-[0.72rem] font-medium hover:bg-[var(--color-pine)] hover:text-[var(--color-on-dark)] ${
                    on
                      ? "bg-[var(--color-pine)] text-[var(--color-on-dark)]"
                      : "text-[var(--color-shadow)]"
                  }`}
                >
                  {l.section}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <AnimatePresence>
        {label && (
          <m.div
            key={label}
            className="pointer-events-none fixed inset-0 z-[55] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <m.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.12, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-ridge rounded-md bg-[color-mix(in_oklab,var(--color-shadow)_72%,transparent)] px-7 py-3 text-center text-[var(--color-on-dark)]"
            >
              {label}
            </m.span>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
