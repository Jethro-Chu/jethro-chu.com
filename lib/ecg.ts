/* ============================================================
   ECG PATH GENERATOR: real lead-II P-QRS-T morphology.
   No dependency, deterministic, generated once. The waveform
   signature, the section PulseDividers, and the footer "resting
   beat" all draw from this so the heartbeat is the SAME beat
   everywhere. Up is negative-y (SVG). Amplitude in px.
   ============================================================ */

export interface Pt {
  x: number;
  y: number;
}

interface EcgOptions {
  width: number;
  height: number;
  /** number of P-QRS-T complexes */
  beats?: number;
  /** baseline position as a fraction of height (0 top .. 1 bottom) */
  baseline?: number;
  /** R-wave amplitude in px (others scale off this) */
  amp?: number;
  /** flat baseline before the first beat, as a fraction of width */
  startGap?: number;
  /** flat baseline after the last beat, as a fraction of width */
  endGap?: number;
  /** force each beat's width in px (else beats fill the region evenly) */
  beatWidth?: number;
}

/**
 * One P-QRS-T complex spanning [x, x+w], returning to baseline.
 *
 * Lead-II morphology, left to right: a short flat TP segment, a smooth
 * rounded P wave, a flat PR segment, a sharp QRS (small Q dip down, tall
 * R spike up, deeper S trough below baseline), a flat ST segment, a broad
 * rounded T wave, then flat to the next beat. Amplitudes scale off the R
 * wave so the proportions always read right: R >> T > P, and the S trough
 * is deeper than the Q dip. P and T are quadratic curves; Q-R-S are
 * straight, pointed lines. Geometry follows the clinical reference (a
 * 100-wide beat with R at 41%).
 */
function beat(x: number, w: number, base: number, amp: number) {
  const fx = (f: number) => +(x + f * w).toFixed(2);
  const fy = (a: number) => +(base - a * amp).toFixed(2); // a>0 is UP
  const rx = fx(0.41);
  const ry = fy(1.0);
  const d =
    `L ${fx(0.14)} ${base} ` + // TP segment (flat)
    // P wave: smooth rounded bump, peak ~0.19 amp
    `Q ${fx(0.2)} ${fy(0.381)} ${fx(0.26)} ${base} ` +
    `L ${fx(0.34)} ${base} ` + // PR segment (flat)
    // QRS: sharp, narrow, pointed
    `L ${fx(0.37)} ${fy(-0.095)} ` + // Q dip (small, down)
    `L ${rx} ${ry} ` + // R spike (tall, the dominant feature)
    `L ${fx(0.45)} ${fy(-0.238)} ` + // S trough (deeper than Q)
    `L ${fx(0.48)} ${base} ` + // return to baseline
    `L ${fx(0.58)} ${base} ` + // ST segment (flat)
    // T wave: broad rounded bump, peak ~0.33 amp (taller than P, well below R)
    `Q ${fx(0.7)} ${fy(0.667)} ${fx(0.82)} ${base} ` +
    `L ${fx(1.0)} ${base}`; // TP to the next beat
  return { d, r: { x: rx, y: ry } };
}

/**
 * Compose a full trace: flat lead-in, N beats, flat tail.
 * Returns the path `d`, every R-peak coordinate, and an
 * overestimated path length for stroke-dashoffset draw-on.
 */
export function ecgPath(opts: EcgOptions): { d: string; rPeaks: Pt[]; len: number } {
  const {
    width,
    height,
    beats = 1,
    baseline = 0.5,
    amp = height * 0.32,
    startGap = 0.06,
    endGap = 0.06,
    beatWidth,
  } = opts;

  const base = +(height * baseline).toFixed(2);
  const regionStart = width * startGap;
  const region = width * (1 - startGap - endGap);
  const bw = beatWidth ?? region / beats;

  let d = `M 0 ${base} L ${+regionStart.toFixed(2)} ${base}`;
  const rPeaks: Pt[] = [];
  let cursor = regionStart;
  for (let i = 0; i < beats; i++) {
    const b = beat(cursor, bw, base, amp);
    d += ` ${b.d}`;
    rPeaks.push(b.r);
    cursor += bw;
  }
  d += ` L ${+width.toFixed(2)} ${base}`;

  // generous overestimate so dasharray fully covers the trace
  const len = Math.ceil(width + beats * amp * 5 + 40);
  return { d, rPeaks, len };
}
