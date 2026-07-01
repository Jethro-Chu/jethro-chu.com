"use client";

/* ============================================================
   VillageStandalone  ·  the /village route's interactive layer
   Mounts the shared VillageMount full-screen (title screen, then play).
   Mirrors the homepage overlay but as a standalone route + direct preview
   link, including its OWN exit chrome (back button + ESC -> the scroll
   site at /), which the homepage gets from ValleyDoor. Gate is WebGL +
   motion only; reduced-motion / no-WebGL get the SSR'd flat content with a
   re-enter affordance.
   ============================================================ */

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { gameBus } from "@/lib/gameBus";

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

function leaveToSite() {
  try {
    sessionStorage.setItem("village-closed", "1");
  } catch {
    /* private mode */
  }
  window.location.assign("/");
}

export function VillageStandalone() {
  const [playing, setPlaying] = useState(false);
  const [capable, setCapable] = useState(true);
  const [roomOpen, setRoomOpen] = useState(false);

  useEffect(() => {
    const able = ok();
    setCapable(able);
    setPlaying(able); // capable visitors land on the title screen; others read the flat page
  }, []);

  // an interior room owns its own back/ESC — defer to it when one is open
  useEffect(() => {
    const off1 = gameBus.on("landmark:enter", () => setRoomOpen(true));
    const off2 = gameBus.on("game:resume", () => setRoomOpen(false));
    return () => {
      off1();
      off2();
    };
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

  // ESC leaves to the scroll site — but not while a room is open (room owns ESC)
  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !roomOpen) {
        e.preventDefault();
        leaveToSite();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, roomOpen]);

  if (!capable) return null;

  return playing ? (
    <div className="z-30 bg-[#3f7a57]" style={{ position: "fixed", inset: 0 }}>
      {/* the exit lives inside the village nav ("← Portfolio"); the intro's
          skip link covers leaving before PLAY, and ESC works throughout */}
      <VillageMount onLeave={leaveToSite} />
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
