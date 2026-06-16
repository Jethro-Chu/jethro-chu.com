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

    // smooth scroll only when motion is allowed; reduced motion keeps native scroll
    if (!reduce) {
      lenis = new Lenis({
        // Snappier settle: 0.8s (down from 1.05) with a sharp ease-out. The
        // wheel/touch multipliers stay at the default 1 (never inflated).
        // NOTE: Lenis could be removed entirely and the scroll-linked animations
        // bound to native scroll via framer's useScroll for maximum snappiness;
        // not removing it yet.
        duration: 0.8,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      });
      const loop = (time: number) => {
        lenis!.raf(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      window.__lenis = lenis;
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
        lenis.destroy();
        if (window.__lenis === lenis) window.__lenis = undefined;
      }
      document.removeEventListener("click", onClick);
    };
  }, [reduce]);

  return null;
}
