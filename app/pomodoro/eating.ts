// Eating-cycle tuning for the quokka, shared by the player and the
// regression tests. No React, no DOM: pure constants.

/** Idle wait after every 5s eating sequence: a fresh 12-18s each cycle. */
export const EATING_GAP_MIN = 12000;
export const EATING_GAP_JITTER = 6000;

/**
 * Per-stage size compensation while eating frames are displayed. The eating
 * frames carry a Happy-sized body (864px wide, centered at x=561 on the
 * shared 1254 canvas), but every stage idles at its own body width on the
 * same canvas and ground line, so a raw swap would pop the quokka bigger or
 * smaller for 5s. The player applies `translateX(txPct%) scaleX(sx)` about
 * the ground center (transform-origin 50% 100%), which reproduces each
 * stage's own measured body box to under half a pixel. Happy (2) is the
 * identity, hence null. Measured from the shipped art; update only if the
 * artwork itself changes.
 */
export interface EatingComp {
  sx: number;
  txPct: number;
}

const COMP: Record<number, EatingComp | null> = {
  0: { sx: 0.9769, txPct: -1.0228 },
  1: { sx: 0.978, txPct: -0.9748 },
  2: null,
  3: { sx: 1.0336, txPct: 1.2126 },
  4: { sx: 1.1111, txPct: 3.11 },
};

export function eatingCompForStage(stage: number): EatingComp | null {
  return COMP[stage] ?? null;
}
