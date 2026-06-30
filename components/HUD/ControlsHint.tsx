"use client";

/* ============================================================
   ControlsHint (HUD)  ·  one-time "how to play" on entry
   Shown once per browser session (sessionStorage), dismissible, and
   auto-hides after a few seconds. Covers desktop + touch in one line.
   ============================================================ */

import { m } from "framer-motion";
import { useEffect, useState } from "react";

export function ControlsHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("village-hint") === "1") return;
      sessionStorage.setItem("village-hint", "1");
    } catch {
      /* private mode: just show it */
    }
    setShow(true);
    const t = window.setTimeout(() => setShow(false), 8000);
    return () => window.clearTimeout(t);
  }, []);

  if (!show) return null;
  return (
    <m.div
      className="fixed left-1/2 top-20 z-[45] w-[min(92vw,30rem)] -translate-x-1/2"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 rounded-md border border-[var(--color-granite-line)] bg-[var(--color-shadow)] px-4 py-2.5 shadow-xl">
        <p className="label-mono flex-1 text-[0.72rem] leading-relaxed text-[var(--color-on-dark)]!">
          Walk with WASD / arrows or tap · click a district up top to travel · pinch or ± to zoom · step up to a building and choose Enter
        </p>
        <button
          type="button"
          onClick={() => setShow(false)}
          className="fast-ui label-mono shrink-0 rounded-sm border border-[var(--color-on-dark-muted)] px-2 py-1 text-[0.66rem] text-[var(--color-on-dark)]! hover:bg-[var(--color-pine)]"
        >
          Got it
        </button>
      </div>
    </m.div>
  );
}
