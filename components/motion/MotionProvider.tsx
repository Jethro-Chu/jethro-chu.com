"use client";

import { LazyMotion, domAnimation } from "framer-motion";

/**
 * One LazyMotion provider for the whole app. Components use `m.*` (the
 * feature-light motion component) instead of `motion.*`, paired with the
 * `domAnimation` feature bundle. This drops the drag / layout / pan feature code
 * that the full `motion` component always ships, trimming the home first-load JS
 * from ~184 kB to ~160 kB with no loss of behavior.
 *
 * `domAnimation` (not `domMax`) is deliberate: the app uses animations, variants,
 * exit (AnimatePresence), and whileInView, but NO drag and NO layout animations,
 * so the smaller bundle is sufficient. `strict` makes any stray `motion.*` throw,
 * so we can't silently regress back to the full bundle.
 *
 * Features load SYNCHRONOUSLY (`features={domAnimation}`), not via async
 * `import()`. Async was measured and rejected: it produced the SAME first-load
 * size (~161 kB) but added a post-first-paint work burst as every `m` upgraded at
 * once, plus a window where the scroll parallax was not yet live. The climb IS the
 * product, so a dead first-scroll gesture is a real regression; sync keeps the
 * parallax/altimeter responsive from the first frame for ~1 kB less.
 *
 * Note: the scroll hooks (useScroll/useTransform) and useReducedMotion are NOT
 * gated by LazyMotion and stay light; the scroll-driven driver is unaffected.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion strict features={domAnimation}>
      {children}
    </LazyMotion>
  );
}
