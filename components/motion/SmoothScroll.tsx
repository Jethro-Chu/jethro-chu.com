"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { useReducedMotion } from "framer-motion";

declare global {
  interface Window {
    /** the live Lenis instance, so command-bar / chip scrolls stay smooth */
    __lenis?: Lenis;
  }
}

/**
 * Lenis smooth scroll. It updates native scroll position (so framer's
 * useScroll keeps working) and never traps the wheel. Anchor clicks (the
 * altimeter junctions, the skip link) are routed through lenis.scrollTo so
 * the jump stays smooth and moves focus for keyboard users. Under
 * prefers-reduced-motion it does nothing: native scroll, instant jumps.
 */
export function SmoothScroll() {
  const reduce = useReducedMotion();

  useEffect(() => {
    let lenis: Lenis | undefined;
    let raf = 0;
    let onScroll: (() => void) | undefined;
    let scrollEnd = 0;

    // smooth scroll only when motion is allowed; reduced motion keeps native scroll
    if (!reduce) {
      lenis = new Lenis({
        // Lerp-based smoothing instead of a fixed duration: the scroll eases
        // toward the target a fixed fraction PER FRAME, so it tracks the wheel/
        // trackpad tightly (no 0.8s float behind your input) and gets crisper as
        // the refresh rate rises — high-refresh displays converge in fewer ms.
        // Higher lerp = snappier/more 1:1; lower = floatier. ~0.16 is responsive
        // but still smooth. Wheel/touch multipliers stay at the default 1.
        lerp: 0.16,
      });
      const loop = (time: number) => {
        lenis!.raf(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      window.__lenis = lenis;

      // flag the document while scrolling so decorative CSS loops pause for the
      // gesture (see globals.css). Set once on start, cleared ~150ms after stop —
      // no per-frame DOM writes.
      const root = document.documentElement;
      let scrolling = false;
      onScroll = () => {
        if (!scrolling) {
          scrolling = true;
          root.setAttribute("data-scrolling", "");
        }
        if (scrollEnd) window.clearTimeout(scrollEnd);
        scrollEnd = window.setTimeout(() => {
          scrolling = false;
          root.removeAttribute("data-scrolling");
        }, 150);
      };
      lenis.on("scroll", onScroll);
    }

    // anchor jumps work in both modes; Lenis eases them when present, and focus
    // lands inside the destination either way (a11y, including reduced motion)
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      const anchor = (e.target as HTMLElement)?.closest?.(
        'a[href^="#"]'
      ) as HTMLAnchorElement | null;
      if (!anchor) return;
      const hash = anchor.getAttribute("href");
      if (!hash || hash === "#") return;
      const el = document.querySelector(hash) as HTMLElement | null;
      if (!el) return;
      if (lenis) {
        e.preventDefault();
        lenis.scrollTo(el);
      }
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
      el.focus({ preventScroll: true });
    };
    document.addEventListener("click", onClick);

    return () => {
      if (lenis) {
        cancelAnimationFrame(raf);
        if (onScroll) lenis.off("scroll", onScroll);
        lenis.destroy();
        if (window.__lenis === lenis) window.__lenis = undefined;
      }
      window.clearTimeout(scrollEnd);
      document.documentElement.removeAttribute("data-scrolling");
      document.removeEventListener("click", onClick);
    };
  }, [reduce]);

  return null;
}
