// Pomodoro audio wiring tripwire: the completion bell and the control
// click must stay separate elements with separate jobs (bell at 00:00,
// click on Start/Pause/Resume only). A real browser proves audibility;
// this guards the wiring markers against silent reverts.
// Run with `node --test test/pomodoro-audio.test.mjs`.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tsx = readFileSync(join(root, "app/pomodoro/PomodoroApp.tsx"), "utf8");

describe("pomodoro audio assets", () => {
  it("completion bell asset exists", () => {
    assert.ok(existsSync(join(root, "public/pomodoro/02_mossy_soft_bells.mp3")));
  });
  it("button click asset exists", () => {
    assert.ok(existsSync(join(root, "public/pomodoro/button.wav")));
  });
});

describe("pomodoro audio wiring", () => {
  it("declares both sources", () => {
    assert.ok(tsx.includes('"/pomodoro/02_mossy_soft_bells.mp3"'));
    assert.ok(tsx.includes('"/pomodoro/button.wav"'));
  });
  it("preloads both with no loop at the specified volumes", () => {
    assert.ok(tsx.includes("bell.volume = 0.6"));
    assert.ok(tsx.includes("click.volume = 0.65"));
    assert.ok(tsx.includes("click.preload = \"auto\""));
    assert.ok(tsx.includes("click.loop = false"));
  });
  it("click restarts from the top and honors mute", () => {
    assert.ok(tsx.includes("click.currentTime = 0"));
    assert.ok(tsx.includes("if (!soundOnRef.current) return"));
  });
  it("click fires from the primary control only", () => {
    const primaryAt = tsx.indexOf("const onPrimary");
    assert.ok(primaryAt > -1);
    const uses = [];
    let i = tsx.indexOf("playClick()");
    while (i > -1) {
      uses.push(i);
      i = tsx.indexOf("playClick()", i + 1);
    }
    // One definition-callsite pair: declared once, invoked once in onPrimary.
    assert.equal(uses.length, 1);
    assert.ok(uses[0] > primaryAt);
    assert.ok(tsx.includes("const playClick ="));
  });
});
