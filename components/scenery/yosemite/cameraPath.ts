/**
 * Scroll-driven helpers shared by the Yosemite hero scene.
 */

/** Composed scroll progress for the reduced-motion / mobile static frame:
 *  the Half Dome arrival. */
export const STATIC_P = 0.68;

const smoothstep = (t: number) => t * t * (3 - 2 * t);

/**
 * How far the light has shifted from cool midday valley (0) to full golden hour
 * (1) as the climb gains elevation. Drives every light / fog / sky lerp so the
 * atmosphere tracks the ascent.
 */
export function goldenWeight(p: number): number {
  return smoothstep(Math.min(1, Math.max(0, (p - 0.2) / 0.7)));
}
