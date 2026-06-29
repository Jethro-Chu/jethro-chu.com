"use client";

/* ============================================================
   EnterValleyButton  ·  the opt-in entrance affordance
   Rendered near the hero (under the Ask Jethro bar) and in the mobile
   station bar. Emits valley:open; ValleyDoor owns the overlay. Renders
   NOTHING on the server and for reduced-motion / no-WebGL / tiny
   viewports, so the homepage DOM + SEO are unchanged for the fast path
   and the entrance simply never appears for those who can't play.
   Existing design tokens only; the pixel art stays inside the canvas.
   ============================================================ */

import { useEffect, useState } from "react";
import { gameBus } from "@/lib/gameBus";
import { canPlayValley } from "@/lib/canPlayValley";

function PixelPeak() {
  return (
    <svg
      viewBox="0 0 24 16"
      className="h-4 w-6 shrink-0"
      shapeRendering="crispEdges"
      aria-hidden
    >
      <path d="M2 15 L9 5 L12 8 L16 3 L22 15 Z" fill="var(--color-pine)" />
      <path d="M16 3 L18 6 L14 6 Z" fill="var(--color-card)" />
    </svg>
  );
}

export function EnterValleyButton({ variant = "hero" }: { variant?: "hero" | "station" }) {
  const [show, setShow] = useState(false);

  // client-only: render nothing until we confirm the visitor can play
  useEffect(() => setShow(canPlayValley()), []);
  if (!show) return null;

  const open = () => gameBus.emit("valley:open");

  if (variant === "station") {
    return (
      <li className="shrink-0">
        <button
          type="button"
          onClick={open}
          aria-haspopup="dialog"
          className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-sm bg-[color-mix(in_oklab,var(--color-pine)_14%,transparent)] px-3 py-1"
        >
          <span className="font-body text-[0.78rem] font-semibold text-[var(--color-pine)]">
            village
          </span>
          <span className="label-mono text-[0.6rem]">explore</span>
        </button>
      </li>
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      aria-haspopup="dialog"
      className="fast-ui group mx-auto mt-6 inline-flex items-center gap-3 rounded-md border border-[var(--color-granite-line)] bg-[var(--color-card)] px-4 py-2.5 text-left"
    >
      <PixelPeak />
      <span className="flex flex-col leading-tight">
        <span className="font-body text-[0.95rem] font-semibold text-[var(--color-shadow)] group-hover:text-[var(--color-pine)]">
          Enter Yosemite Village
        </span>
        <span className="label-mono text-[0.62rem]">an explorable pixel town</span>
      </span>
    </button>
  );
}
