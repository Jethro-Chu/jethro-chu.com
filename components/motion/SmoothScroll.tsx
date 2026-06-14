"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { useReducedMotion } from "framer-motion";

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
        duration: 1.05,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      });
      const loop = (time: number) => {
        lenis!.raf(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
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
      }
      document.removeEventListener("click", onClick);
    };
  }, [reduce]);

  return null;
}
