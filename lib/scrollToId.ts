/**
 * Smooth-scroll to an element by id. The homepage runs Lenis (which owns the
 * scroll position), so we route through the shared Lenis instance when present
 * and fall back to native scrollIntoView otherwise (reduced motion, or before
 * Lenis mounts). Returns false if the target does not exist so callers can fall
 * back to the assistant instead of doing nothing.
 */
export function scrollToId(targetId: string): boolean {
  if (typeof document === "undefined") return false;
  const el = document.getElementById(targetId);
  if (!el) return false;

  const lenis = typeof window !== "undefined" ? window.__lenis : undefined;
  if (lenis) {
    lenis.scrollTo(el, { offset: -16 });
  } else {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  // move keyboard focus into the destination without re-yanking the scroll
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
  return true;
}

/**
 * Briefly pulse a quiet accent outline around the given element ids — used to
 * draw the eye to a couple of cards after scrolling there (e.g. emphasize Lab
 * Logger + NurseJet on a "healthcare AI" query). No-op under reduced motion.
 */
export function flashEmphasis(ids: string[], delay = 500): void {
  if (typeof document === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  window.setTimeout(() => {
    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      el.classList.remove("cmd-emphasis");
      void el.offsetWidth; // reflow so the animation restarts cleanly
      el.classList.add("cmd-emphasis");
      window.setTimeout(() => el.classList.remove("cmd-emphasis"), 1800);
    }
  }, delay);
}
