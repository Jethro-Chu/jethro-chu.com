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

/** One P-QRS-T complex spanning [x, x+w], returning to baseline. */
function beat(x: number, w: number, base: number, amp: number) {
  const fx = (f: number) => +(x + f * w).toFixed(2);
  const fy = (a: number) => +(base - a * amp).toFixed(2); // a>0 is UP
  const rx = fx(0.34);
  const ry = fy(1.0);
  const d =
    `L ${fx(0.06)} ${base} ` +
    // P wave (rounded)
    `Q ${fx(0.1)} ${fy(0.16)} ${fx(0.14)} ${fy(0.16)} ` +
    `Q ${fx(0.18)} ${fy(0.16)} ${fx(0.22)} ${base} ` +
    // PR segment
    `L ${fx(0.29)} ${base} ` +
    // QRS (sharp)
    `L ${fx(0.31)} ${fy(-0.12)} ` + // Q dip
    `L ${rx} ${ry} ` + // R spike
    `L ${fx(0.37)} ${fy(-0.3)} ` + // S dip
    `L ${fx(0.41)} ${base} ` +
    // ST segment
    `L ${fx(0.52)} ${base} ` +
    // T wave (rounded)
    `Q ${fx(0.6)} ${fy(0.34)} ${fx(0.68)} ${fy(0.34)} ` +
    `Q ${fx(0.76)} ${fy(0.34)} ${fx(0.82)} ${base} ` +
    // rest to next beat
    `L ${fx(1.0)} ${base}`;
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
