"use client";

/* ============================================================
   ControlsHint (HUD)  ·  one-time "how to play" on entry
   A slim plaque at the bottom-centre (the top belongs to the nav, and
   the opening view of the town should stay unobstructed). Shown once
   per browser session (sessionStorage), dismissible, auto-hides.
   ============================================================ */

import { m } from "framer-motion";
import { useEffect, useState } from "react";
import { useIsTouch } from "@/lib/useIsTouch";

export function ControlsHint() {
  const [show, setShow] = useState(false);
  const touch = useIsTouch();

  useEffect(() => {
    try {
      if (sessionStorage.getItem("village-hint") === "1") return;
      sessionStorage.setItem("village-hint", "1");
    } catch {
      /* private mode: just show it */
    }
    setShow(true);
    const t = window.setTimeout(() => setShow(false), 6500);
    return () => window.clearTimeout(t);
  }, []);

  if (!show) return null;
  return (
    <m.div
      className="fixed bottom-16 left-1/2 z-[45] w-max max-w-[92vw] -translate-x-1/2 sm:bottom-[4.25rem]"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="hud-plaque flex items-center gap-3 px-3.5 py-2">
        <p className="label-mono flex-1 text-[0.68rem] leading-relaxed text-[var(--color-on-dark)]!">
          {touch
            ? "Drag the joystick or tap to walk · tap a sign up top to travel"
            : "WASD / arrows or click to walk · Enter to go in · ± to zoom"}
        </p>
        <button
          type="button"
          onClick={() => setShow(false)}
          className="fast-ui label-mono shrink-0 rounded-sm border border-[color-mix(in_oklab,var(--color-golden)_45%,transparent)] px-2 py-1 text-[0.64rem] text-[var(--color-golden)]! hover:bg-[color-mix(in_oklab,var(--color-golden)_18%,transparent)]"
        >
          Got it
        </button>
      </div>
    </m.div>
  );
}
