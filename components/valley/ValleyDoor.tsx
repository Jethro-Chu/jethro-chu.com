"use client";

/* ============================================================
   ValleyDoor  ·  the homepage overlay controller (thin client island)
   The ONLY valley code on the homepage's initial load. It renders no
   entrance itself (EnterValleyButton does) and nothing until opened, so
   the island stays tiny and the page stays a server component.

   On valley:open it captures scroll, stops Lenis + locks the body,
   then dynamically imports the valley (Phaser loads only now) into a
   fixed full-screen overlay with a Framer fade. On close (← / ESC) it
   unmounts the valley FIRST (PhaserValley's cleanup calls
   game.destroy(true) → no leaked canvas/rAF), then fades the empty
   shell, restores scroll + Lenis + body + focus. No navigation.
   ============================================================ */

import dynamic from "next/dynamic";
import { m, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { gameBus } from "@/lib/gameBus";
import { canPlayValley } from "@/lib/canPlayValley";

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
  const savedScroll = useRef(0);
  const lastFocus = useRef<HTMLElement | null>(null);
  const backRef = useRef<HTMLButtonElement>(null);
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
    // unmount the overlay immediately -> ValleyMount unmounts ->
    // PhaserValley cleanup calls game.destroy(true). No exit animation holds
    // the engine alive (that was the leak); the enter fade is enough.
    setOpen(false);
    gameBus.emit("game:skip");
    gameBus.emit("valley:close");
    window.__lenis?.start();
    document.body.style.overflow = "";
    window.scrollTo(0, savedScroll.current);
    window.__lenis?.scrollTo(savedScroll.current, { immediate: true });
    lastFocus.current?.focus?.();
  }, []);

  const openOverlay = useCallback(() => {
    if (!canPlayValley()) return; // reduced-motion / no-WebGL / tiny viewport keep the site
    savedScroll.current = window.scrollY;
    lastFocus.current = document.activeElement as HTMLElement;
    window.__lenis?.stop();
    document.body.style.overflow = "hidden";
    setOpen(true);
  }, []);

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
    if (dismissed) return;
    const t = window.setTimeout(openOverlay, 50); // let the page settle first
    return () => window.clearTimeout(t);
  }, [openOverlay]);

  // ESC closes; move focus into the overlay on open
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => backRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

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
      role="dialog"
      aria-modal="true"
      aria-label="Yosemite Village"
      className="fixed inset-0 z-[60] bg-[#3f7a57]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: dur }}
    >
      <VillageMount onExit={close} />
      <button
        ref={backRef}
        type="button"
        onClick={close}
        className="fast-ui label-mono fixed right-3 top-3 z-[61] rounded-sm bg-[color-mix(in_oklab,var(--color-shadow)_72%,transparent)] px-3 py-2 text-[0.74rem] text-[var(--color-on-dark)]"
      >
        ← Back to the portfolio
      </button>
    </m.div>
  );
}
