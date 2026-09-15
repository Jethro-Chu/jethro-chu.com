// Eating-timeline asset contract: the shipped timeline must describe one
// exact 5,000ms sequence over real 1254x1254 RGBA frames, and the player
// maps it to the Happy fullness stage (index 2) only.
// Run with `node --test test/pomodoro-eating.test.mjs`.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { STAGE_LABELS } from "../app/pomodoro/pomodoroState.ts";

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

describe("happy stage mapping", () => {
  it("stage index 2 is Happy", () => {
    assert.equal(STAGE_LABELS[2], "Happy");
  });
  it("player maps eating to stage 2 only", () => {
    const tsx = readFileSync(
      join(root, "app/pomodoro/Quokka.tsx"),
      "utf8",
    );
    assert.ok(tsx.includes("HAPPY_STAGE = 2"));
    assert.ok(tsx.includes("stage === HAPPY_STAGE"));
  });
});
