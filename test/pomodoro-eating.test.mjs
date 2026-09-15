// Eating-animation contract: the shipped timeline must describe one exact
// 5,000ms sequence over real 1254x1254 RGBA frames, and the player must run
// it during any running Study session (no stage gate) with randomized
// 12-18s idle gaps and per-stage size compensation so the quokka never pops
// in size when a sequence starts or ends.
// Run with `node --test test/pomodoro-eating.test.mjs`.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  EATING_GAP_JITTER,
  EATING_GAP_MIN,
  eatingCompForStage,
} from "../app/pomodoro/eating.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "public/pomodoro/quokka-eating");
const timeline = JSON.parse(
  readFileSync(join(dir, "timeline.json"), "utf8"),
);

function pngSize(path) {
  const b = readFileSync(path);
  assert.deepEqual(
    [...b.subarray(0, 8)],
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    `${path} is a PNG`,
  );
  return {
    width: b.readUInt32BE(16),
    height: b.readUInt32BE(20),
    colorType: b[25],
  };
}

describe("eating timeline", () => {
  it("declares the happy stage and 20 steps", () => {
    assert.equal(timeline.fullness_stage, "happy");
    assert.equal(timeline.playback_steps, 20);
    assert.equal(timeline.frames.length, 20);
  });
  it("totals exactly 5,000ms", () => {
    const total = timeline.frames.reduce((n, s) => n + s.duration_ms, 0);
    assert.equal(total, 5000);
    assert.equal(timeline.duration_ms, 5000);
  });
  it("uses 10 unique frame files, all present", () => {
    const files = timeline.frames.map((s) => s.file);
    assert.equal(new Set(files).size, 10);
    assert.equal(timeline.unique_frames, 10);
    for (const f of new Set(files)) {
      assert.ok(existsSync(join(dir, f)), f);
    }
  });
  it("every frame is a 1254x1254 transparent canvas", () => {
    for (const f of new Set(timeline.frames.map((s) => s.file))) {
      const { width, height, colorType } = pngSize(join(dir, f));
      assert.equal(width, 1254);
      assert.equal(height, 1254);
      assert.equal(colorType, 6); // RGBA
    }
  });
  it("recommends 10-20s idle gaps between sequences", () => {
    assert.deepEqual(timeline.recommended_idle_gap_ms, [10000, 20000]);
  });
});

describe("eating schedule", () => {
  it("waits a randomized 12-18s idle gap after every sequence", () => {
    assert.equal(EATING_GAP_MIN, 12000);
    assert.equal(EATING_GAP_JITTER, 6000);
    assert.equal(EATING_GAP_MIN + EATING_GAP_JITTER, 18000);
  });
  it("player has no stage gate on eating", () => {
    const tsx = readFileSync(
      join(root, "app/pomodoro/Quokka.tsx"),
      "utf8",
    );
    assert.ok(!tsx.includes("HAPPY_STAGE"), "stage gate removed");
    assert.ok(!tsx.includes("stage ==="), "no stage equality gate");
  });
});

// Measured opaque-body boxes (alpha > 128) of the shipped nibble-a art per
// stage: [widthPx, centerXPx] on the shared 1254 canvas. The eating frames
// carry a Happy-sized body (864 wide, centered at 561), so every other stage
// needs compensation. Update only if the artwork itself changes.
const STAGE_BODY = {
  0: [844, 550],
  1: [845, 550.5],
  3: [893, 574.5],
  4: [960, 597],
};
const EAT_BODY_W = 864;
const EAT_BODY_CX = 561;
const CANVAS = 1254;
const ORIGIN_X = CANVAS / 2; // transform-origin: 50% 100%

describe("eating size compensation", () => {
  it("happy needs no compensation (eating body is happy-sized)", () => {
    assert.equal(eatingCompForStage(2), null);
  });
  it("each other stage reproduces its own body width and center", () => {
    for (const [stage, [wantW, wantCx]] of Object.entries(STAGE_BODY)) {
      const comp = eatingCompForStage(Number(stage));
      assert.ok(comp, `stage ${stage} has compensation`);
      // Player applies translateX(tx%) then scaleX(sx) about the ground
      // center: x' = origin + sx * (x + txPx - origin).
      const gotW = EAT_BODY_W * comp.sx;
      const gotCx =
        ORIGIN_X + comp.sx * (EAT_BODY_CX + (comp.txPct / 100) * CANVAS - ORIGIN_X);
      assert.ok(
        Math.abs(gotW - wantW) < 0.5,
        `stage ${stage} width: ${gotW} vs ${wantW}`,
      );
      assert.ok(
        Math.abs(gotCx - wantCx) < 0.5,
        `stage ${stage} center: ${gotCx} vs ${wantCx}`,
      );
    }
  });
  it("player applies the compensation while eating frames show", () => {
    const tsx = readFileSync(
      join(root, "app/pomodoro/Quokka.tsx"),
      "utf8",
    );
    assert.ok(tsx.includes("eatingCompForStage(stage)"));
    assert.ok(tsx.includes("scaleX"));
  });
});
