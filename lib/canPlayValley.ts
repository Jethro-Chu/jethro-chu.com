/* ============================================================
   canPlayValley  ·  shared capability gate (client only)
   The valley entrance only renders, and the overlay only opens, when
   the visitor can actually play: WebGL available, motion allowed, and
   a usable viewport. Reduced-motion / no-WebGL / tiny screens / crawlers
   get the scroll site unchanged with no entrance and no engine.
   ============================================================ */

export function canPlayValley(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
    if (Math.min(window.innerWidth, window.innerHeight) < 360) return false;
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl") || c.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}
