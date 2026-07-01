"use client";

/* ============================================================
   ValleyDoor  ·  the homepage overlay controller (thin client island)
   The ONLY valley code on the homepage's initial load. It renders no
   entrance itself (EnterValleyButton does) and nothing until opened, so
   the island stays tiny and the page stays a server component.

   On valley:open it captures scroll, stops Lenis + locks the body, then
   dynamically imports VillageMount (Phaser loads only now) into a fixed
   full-screen overlay with a Framer fade. On close (← / ESC) it unmounts
   VillageMount FIRST (PhaserVillage's cleanup calls game.destroy(true) →
   no leaked canvas/rAF), then restores scroll + Lenis + body + focus.
   It also auto-opens on the homepage (the village is the front page).
   ============================================================ */

import dynamic from "next/dynamic";
import { m, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { gameBus } from "@/lib/gameBus";
import { canPlayValley } from "@/lib/canPlayValley";

// lift the pre-paint front-page cover (injected in app/layout.tsx) — a no-op if
// it was never added (crawler / dismissed / incapable / not the homepage)
function dropPreloadCover() {
  document.getElementById("village-preload")?.remove();
}

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

export function ValleyDoor() {
  const [open, setOpen] = useState(false);
  const [roomOpen, setRoomOpen] = useState(false); // a building interior is open over the village
  const savedScroll = useRef(0);
  const lastFocus = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const close = useCallback(() => {
    // remember the visitor chose the classic site, so we don't re-open the
    // village over them again this session (the village is the default landing,
    // but closing it should stick)
    try {
      sessionStorage.setItem("village-closed", "1");
    } catch {
      /* private mode */
    }
    // unmount the overlay immediately -> VillageMount unmounts -> PhaserVillage
    // cleanup calls game.destroy(true). No exit animation holds the engine alive
    // (that was the leak); the enter fade is enough. Then restore the page.
    setOpen(false);
    window.__lenis?.start();
    document.body.style.overflow = "";
    window.scrollTo(0, savedScroll.current);
    window.__lenis?.scrollTo(savedScroll.current, { immediate: true });
    lastFocus.current?.focus?.();
  }, []);

  // track whether a building interior is open (InteriorRoom pauses on enter,
  // resumes on close) so the overlay's own back/ESC defer to the room's
  useEffect(() => {
    const off1 = gameBus.on("landmark:enter", () => setRoomOpen(true));
    const off2 = gameBus.on("game:resume", () => setRoomOpen(false));
    return () => {
      off1();
      off2();
    };
  }, []);

  const openOverlay = useCallback(() => {
    if (!canPlayValley()) {
      dropPreloadCover(); // reduced-motion / no-WebGL / tiny viewport keep the site
      return;
    }
    savedScroll.current = window.scrollY;
    lastFocus.current = document.activeElement as HTMLElement;
    window.__lenis?.stop();
    document.body.style.overflow = "hidden";
    setOpen(true);
    // keep the pre-paint cover through the fade, then lift it — the overlay is
    // opaque by now, so the scroll site is never revealed underneath.
    window.setTimeout(dropPreloadCover, reduce ? 0 : 380);
  }, [reduce]);

  // the entrance affordance (or anything) can still request the overlay
  useEffect(() => gameBus.on("valley:open", openOverlay), [openOverlay]);

  // FRONT PAGE: auto-open the village for capable first-time visitors, unless
  // they closed it this session. Crawlers / no-JS / reduced-motion never run
  // this, so the SSR scroll site stays the indexable, accessible fallback.
  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem("village-closed") === "1";
    } catch {
      /* private mode */
    }
    if (dismissed) {
      dropPreloadCover(); // they chose the classic site this session — no cover
      return;
    }
    const t = window.setTimeout(openOverlay, 50); // let the page settle first
    return () => window.clearTimeout(t);
  }, [openOverlay]);

  // ESC closes the overlay — but only when no interior room is open (the room
  // owns ESC then). Move focus into the overlay on open.
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => dialogRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !roomOpen) {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, roomOpen]);

  // safety: restore scroll lock if this island ever unmounts while open
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
      window.__lenis?.start();
    };
  }, []);

  const dur = reduce ? 0 : 0.32;

  // No AnimatePresence: `open` false unmounts instantly, so ValleyMount unmounts
  // and the Phaser game is destroyed right away (no exit animation keeps it alive).
  if (!open) return null;
  return (
    <m.div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Yosemite Village"
      className="fixed inset-0 z-[60] bg-[#3f7a57] outline-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: dur }}
    >
      {/* the exit lives inside the village nav ("← Portfolio"), so the HUD
          never collides with a floating button; the intro's own skip link
          covers leaving before PLAY, and ESC works throughout */}
      <VillageMount onLeave={close} />
    </m.div>
  );
}
