"use client";

/* ============================================================
   VillageStandalone  ·  the /village route's interactive layer
   Mounts the shared VillageMount full-screen (which shows the title
   screen, then play). Mirrors the homepage overlay but as a standalone
   route + direct preview link. Gate is WebGL + motion only (no viewport
   floor) so it works on the route; reduced-motion / no-WebGL get the
   SSR'd flat content beneath with a re-enter affordance.
   ============================================================ */

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const VillageMount = dynamic(() => import("@/components/valley/VillageMount"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#3f7a57]">
      <span className="label-mono animate-pulse text-[var(--color-on-dark)]">
        loading the village…
      </span>
    </div>
  ),
});

function ok(): boolean {
  try {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl") || c.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

export function VillageStandalone() {
  const [playing, setPlaying] = useState(false);
  const [capable, setCapable] = useState(true);

  useEffect(() => {
    const able = ok();
    setCapable(able);
    setPlaying(able); // capable visitors land on the title screen; others read the flat page
  }, []);

  // lock body scroll while the full-screen game is up (mirrors the homepage
  // overlay) so wheel-zoom can't scroll the flat page behind it
  useEffect(() => {
    if (!playing) return;
    const lenis = (window as unknown as { __lenis?: { stop?: () => void; start?: () => void } }).__lenis;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lenis?.stop?.();
    return () => {
      document.body.style.overflow = prev;
      lenis?.start?.();
    };
  }, [playing]);

  if (!capable) return null;

  return playing ? (
    <div className="z-30 bg-[#3f7a57]" style={{ position: "fixed", inset: 0 }}>
      <VillageMount onExit={() => setPlaying(false)} />
    </div>
  ) : (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="fast-ui fixed bottom-5 right-5 z-40 rounded-sm bg-[var(--color-pine)] px-4 py-2.5 text-[0.82rem] font-medium text-[var(--color-on-dark)] shadow-lg"
    >
      Enter the village
    </button>
  );
}
