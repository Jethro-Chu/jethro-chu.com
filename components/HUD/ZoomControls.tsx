"use client";

/* ============================================================
   ZoomControls (HUD)  ·  +/- buttons that step the camera zoom
   Touch-friendly (mobile has no wheel/pinch guarantee). Emits
   valley:zoom; the scene clamps to its integer zoom levels.
   ============================================================ */

import { gameBus } from "@/lib/gameBus";

const BTN =
  "fast-ui flex size-9 items-center justify-center rounded-sm border border-[var(--color-granite-line)] bg-[color-mix(in_oklab,var(--color-shadow)_80%,transparent)] text-xl font-bold leading-none text-[var(--color-on-dark)] hover:bg-[var(--color-pine)]";

export function ZoomControls() {
  return (
    <div className="fixed right-3 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-1.5">
      <button
        type="button"
        aria-label="Zoom in"
        className={BTN}
        onClick={() => gameBus.emit("valley:zoom", { dir: 1 })}
      >
        +
      </button>
      <button
        type="button"
        aria-label="Zoom out"
        className={BTN}
        onClick={() => gameBus.emit("valley:zoom", { dir: -1 })}
      >
        −
      </button>
    </div>
  );
}
