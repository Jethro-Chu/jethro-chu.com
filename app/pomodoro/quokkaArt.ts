// Pure pixel-art data for the Pomodoro quokka. No React here so the same
// shapes can be rendered by the page component and by throwaway preview
// scripts. All coordinates are integer cells on a QUOKKA_W x QUOKKA_H grid,
// drawn back to front by the renderer.

export const QUOKKA_W = 34;
export const QUOKKA_H = 34;

export interface Pixel {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
}

/** Fullness stage: 0 hungry, 1 content, 2 happy, 3 full, 4 fully fed. */
export type FullnessStage = 0 | 1 | 2 | 3 | 4;

export const QP = {
  outline: "#3b2414",
  fur: "#c08542",
  furDark: "#9c6932",
  furLight: "#dda75f",
  cream: "#f7e8c8",
  creamShade: "#e3cb9e",
  eye: "#241812",
  white: "#ffffff",
  nose: "#2e1d10",
  mouth: "#4a2c17",
  tongue: "#f2919b",
  blush: "#e08a5a",
  paw: "#4a2c17",
  leaf: "#5fa966",
  leafDark: "#3e7d44",
  stem: "#7a5230",
  crumb: "#8a5a33",
  sleep: "#6b4a2a",
} as const;

type Cell = { x: number; y: number; fill: string };

function ellipseCells(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fill: string,
): Cell[] {
  const cells: Cell[] = [];
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) cells.push({ x, y, fill });
    }
  }
  return cells;
}

function rectCells(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  fill: string,
): Cell[] {
  const cells: Cell[] = [];
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) cells.push({ x, y, fill });
  return cells;
}

function dotCells(list: Array<[number, number]>, fill: string): Cell[] {
  return list.map(([x, y]) => ({ x, y, fill }));
}

/** Merge contiguous same-color cells on each row into Pixel runs. */
export function mergeRuns(cells: Cell[]): Pixel[] {
  const byRow = new Map<number, Map<string, number[]>>();
  for (const c of cells) {
    if (
      c.x < 0 ||
      c.y < 0 ||
      c.x >= QUOKKA_W ||
      c.y >= QUOKKA_H ||
      !Number.isInteger(c.x) ||
      !Number.isInteger(c.y)
    )
      continue;
    let row = byRow.get(c.y);
    if (!row) {
      row = new Map();
      byRow.set(c.y, row);
    }
    let xs = row.get(c.fill);
    if (!xs) {
      xs = [];
      row.set(c.fill, xs);
    }
    xs.push(c.x);
  }
  const out: Pixel[] = [];
  for (const [y, row] of byRow) {
    for (const [fill, xs] of row) {
      xs.sort((a, b) => a - b);
      let start = xs[0];
      let prev = xs[0];
      for (let i = 1; i <= xs.length; i++) {
        if (i < xs.length && xs[i] === prev + 1) {
          prev = xs[i];
          continue;
        }
        out.push({ x: start, y, w: prev - start + 1, h: 1, fill });
        if (i < xs.length) {
          start = xs[i];
          prev = xs[i];
        }
      }
    }
  }
  // Deterministic order: top to bottom, left to right.
  out.sort((a, b) => a.y - b.y || a.x - b.x);
  return out;
}

// Body width grows slightly with each meal; the belly patch grows a lot.
const BODY_RX: Record<FullnessStage, number> = {
  0: 7.7,
  1: 8.0,
  2: 8.3,
  3: 8.7,
  4: 9.1,
};
const BELLY_RX: Record<FullnessStage, number> = {
  0: 4.4,
  1: 5.2,
  2: 6.0,
  3: 6.8,
  4: 7.6,
};

const CX = 16;

function inEllipse(
  x: number,
  y: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): boolean {
  const dx = (x + 0.5 - cx) / rx;
  const dy = (y + 0.5 - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

/** Everything except eyes and paws (those are separate layers). */
export function bodyPixels(stage: FullnessStage): Pixel[] {
  const cells: Cell[] = [];
  const bodyRx = BODY_RX[stage];
  const bellyRx = BELLY_RX[stage];

  // Tail (behind body).
  cells.push(...ellipseCells(4.5, 29.5, 2.1, 1.6, QP.outline));
  cells.push(...ellipseCells(4.5, 29.5, 1.4, 1.0, QP.furDark));

  // Ears: round, set wide so they read apart from the head.
  for (const ex of [7, 25]) {
    cells.push(...ellipseCells(ex, 4.2, 3.3, 3.8, QP.outline));
    cells.push(...ellipseCells(ex, 4.2, 2.5, 3.0, QP.fur));
    cells.push(...ellipseCells(ex, 4.4, 1.3, 1.7, QP.furDark));
  }

  // Head.
  cells.push(...ellipseCells(CX, 12, 9.7, 8.5, QP.outline));
  cells.push(...ellipseCells(CX, 12, 8.8, 7.6, QP.fur));
  // Soft shading: darker dither on the lower right, light patch upper left.
  for (const c of ellipseCells(CX, 12, 8.8, 7.6, QP.furDark)) {
    if (c.x >= 22 && c.y >= 8 && (c.x * 2 + c.y) % 3 === 0)
      cells.push({ ...c, fill: QP.furDark });
  }
  for (const c of ellipseCells(9.6, 8.2, 1.4, 1.3, QP.furLight)) {
    if (inEllipse(c.x, c.y, CX, 12, 8.8, 7.6))
      cells.push({ ...c, fill: QP.furLight });
  }

  // Body (bottom tucked above the feet so no outline tab pokes out).
  cells.push(...ellipseCells(CX, 25.8, bodyRx + 0.9, 6.4, QP.outline));
  cells.push(...ellipseCells(CX, 25.8, bodyRx, 5.7, QP.fur));
  for (const c of ellipseCells(CX, 25.8, bodyRx, 5.7, QP.furDark)) {
    if (c.x >= CX + bodyRx - 2.2 && (c.x + c.y * 2) % 3 === 0)
      cells.push({ ...c, fill: QP.furDark });
  }

  // Belly patch (the visible fullness signal).
  cells.push(...ellipseCells(CX, 26.8, bellyRx + 0.6, 5.0, QP.creamShade));
  cells.push(...ellipseCells(CX, 26.8, bellyRx, 4.4, QP.cream));

  // Feet.
  for (const fx of [10, 22]) {
    cells.push(...ellipseCells(fx, 31.5, 2.4, 1.7, QP.outline));
    cells.push(...ellipseCells(fx, 31.5, 1.6, 1.0, QP.paw));
  }

  // Nose with a tiny highlight.
  cells.push(
    ...dotCells(
      [
        [16, 13],
        [14, 14],
        [15, 14],
        [16, 14],
        [17, 14],
        [15, 15],
        [16, 15],
      ],
      QP.nose,
    ),
  );
  cells.push(...dotCells([[15, 13]], QP.white));

  // Mouth and cheeks per stage.
  if (stage === 0) {
    // Hungry: worried brows, small open "o" mouth.
    cells.push(...dotCells([[10, 7], [11, 8], [22, 7], [21, 8]], QP.outline));
    cells.push(
      ...dotCells([[15, 17], [16, 17], [15, 18], [16, 18]], QP.mouth),
    );
  } else if (stage === 1) {
    // Content: small smile.
    cells.push(
      ...dotCells(
        [[13, 15], [14, 16], [15, 17], [16, 17], [17, 16], [18, 15]],
        QP.mouth,
      ),
    );
  } else if (stage === 2) {
    // Happy: open smile with tongue, light blush.
    cells.push(
      ...dotCells(
        [
          [13, 15], [14, 15], [15, 15], [16, 15], [17, 15], [18, 15],
          [14, 16], [17, 16],
        ],
        QP.mouth,
      ),
    );
    cells.push(
      ...dotCells([[15, 16], [16, 16], [15, 17], [16, 17]], QP.tongue),
    );
    cells.push(...dotCells([[9, 14], [10, 14], [21, 14], [22, 14]], QP.blush));
  } else if (stage === 3) {
    // Full: bigger grin, tongue, round blush.
    cells.push(
      ...dotCells(
        [
          [12, 15], [13, 15], [14, 15], [15, 15], [16, 15], [17, 15], [18, 15], [19, 15],
          [13, 16], [18, 16],
          [14, 17], [17, 17],
        ],
        QP.mouth,
      ),
    );
    cells.push(
      ...dotCells(
        [[14, 16], [15, 16], [16, 16], [17, 16], [15, 17], [16, 17]],
        QP.tongue,
      ),
    );
    cells.push(
      ...dotCells(
        [[9, 14], [10, 14], [9, 15], [10, 15], [21, 14], [22, 14], [21, 15], [22, 15]],
        QP.blush,
      ),
    );
  } else {
    // Fully fed: biggest grin, tongue, strong blush.
    cells.push(
      ...dotCells(
        [
          [12, 15], [13, 15], [14, 15], [15, 15], [16, 15], [17, 15], [18, 15], [19, 15],
          [13, 16], [18, 16],
          [13, 17], [18, 17],
          [14, 18], [17, 18],
        ],
        QP.mouth,
      ),
    );
    cells.push(
      ...dotCells(
        [
          [14, 16], [15, 16], [16, 16], [17, 16],
          [14, 17], [15, 17], [16, 17], [17, 17],
          [15, 18], [16, 18],
        ],
        QP.tongue,
      ),
    );
    cells.push(
      ...dotCells(
        [
          [8, 14], [9, 14], [10, 14], [8, 15], [9, 15], [10, 15],
          [21, 14], [22, 14], [23, 14], [21, 15], [22, 15], [23, 15],
        ],
        QP.blush,
      ),
    );
  }

  return mergeRuns(cells);
}

/** Paws sit on the belly, so they drift outward as the belly grows. */
export function pawPixels(stage: FullnessStage): Pixel[] {
  const cells: Cell[] = [];
  const off = 3.2 + stage * 0.3;
  for (const px of [CX - off, CX + off]) {
    // Tiny paws, no outline ring (the dark fill already pops on cream).
    cells.push(...ellipseCells(px, 24, 1.4, 1.9, QP.paw));
  }
  return mergeRuns(cells);
}

/** Open eyes per stage. Stages 3-4 get joyful closed arcs. */
export function eyesOpenPixels(stage: FullnessStage): Pixel[] {
  if (stage >= 3) {
    return mergeRuns(
      dotCells(
        [
          [10, 11], [11, 10], [12, 10], [13, 11],
          [18, 11], [19, 10], [20, 10], [21, 11],
        ],
        QP.eye,
      ),
    );
  }
  const cells: Cell[] = [];
  cells.push(...rectCells(10, 9, 12, 11, QP.eye));
  cells.push(...rectCells(19, 9, 21, 11, QP.eye));
  // Catchlights (bigger once happy).
  cells.push(...dotCells([[10, 9]], QP.white));
  cells.push(...dotCells([[19, 9]], QP.white));
  if (stage === 2) {
    cells.push(...dotCells([[11, 9], [20, 9]], QP.white));
  }
  return mergeRuns(cells);
}

/** Shared closed lids for blinking and sleeping. */
export function eyesClosedPixels(): Pixel[] {
  return mergeRuns(
    dotCells(
      [
        [10, 11], [11, 11], [12, 11],
        [19, 11], [20, 11], [21, 11],
      ],
      QP.eye,
    ),
  );
}

export interface NibbleLayers {
  /** Opaque fur patch that covers the resting mouth. */
  patch: Pixel[];
  chewA: Pixel[];
  chewB: Pixel[];
  leaf: Pixel[];
}

/** Leaf plus two chew frames shown while a study session runs. */
export function nibblePixels(): NibbleLayers {
  const patch = mergeRuns(rectCells(12, 15, 19, 18, QP.fur));
  const chewA = mergeRuns(
    dotCells([[14, 16], [15, 16], [16, 16], [17, 16]], QP.mouth),
  );
  const chewB = mergeRuns(
    dotCells([[14, 16], [15, 17], [16, 17], [17, 16]], QP.mouth),
  );
  const leaf = mergeRuns([
    ...dotCells([[20, 16], [21, 15]], QP.stem),
    ...dotCells(
      [
        [23, 12],
        [22, 13], [23, 13], [24, 13],
        [21, 14], [22, 14], [23, 14], [24, 14],
        [22, 15], [23, 15],
      ],
      QP.leaf,
    ),
    ...dotCells([[23, 13], [22, 14]], QP.leafDark),
  ]);
  return { patch, chewA, chewB, leaf };
}

export interface SleepLayers {
  /** Opaque fur patch that covers the waking mouth. */
  patch: Pixel[];
  /** Tiny calm mouth for sleeping. */
  mouth: Pixel[];
}

/** Calm sleeping mouth (covers grins; blush stays as sleeping cheeks). */
export function sleepMouthPixels(): SleepLayers {
  return {
    patch: mergeRuns(rectCells(12, 15, 19, 18, QP.fur)),
    mouth: mergeRuns(
      dotCells([[14, 17], [15, 17], [16, 17], [17, 17]], QP.mouth),
    ),
  };
}

/** Floating "z" for the sleeping pose. */
export function sleepPixels(): Pixel[] {
  return mergeRuns(
    dotCells(
      [
        [28, 4], [29, 4], [30, 4], [29, 5], [28, 6], [29, 6], [30, 6],
        [31, 1], [32, 1], [31, 2], [30, 3], [31, 3], [32, 3],
      ],
      QP.sleep,
    ),
  );
}

/** Crumbs and hearts for the feeding celebration. */
export function celebratePixels(): Pixel[] {
  return mergeRuns([
    ...dotCells([[10, 19], [22, 19], [11, 21], [21, 21], [16, 21]], QP.crumb),
    ...dotCells(
      [
        [6, 18], [8, 18], [6, 19], [7, 19], [8, 19], [7, 20],
        [25, 18], [27, 18], [25, 19], [26, 19], [27, 19], [26, 20],
      ],
      QP.tongue,
    ),
  ]);
}
