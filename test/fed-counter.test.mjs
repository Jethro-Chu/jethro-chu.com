// Fed-counter regression tests. Zero dependencies: run with
// `node --test test/fed-counter.test.mjs`
// (Node strips the state's erasable types on import).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  fedLabel,
  freshState,
  resetProgression,
  stageFor,
  start,
  startNext,
  tick,
} from "../app/pomodoro/pomodoroState.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("fedLabel grammar", () => {
  it("starts at 0 quokkas fed!", () => {
    assert.equal(fedLabel(0), "0 quokkas fed!");
  });
  it("uses the singular for exactly 1", () => {
    assert.equal(fedLabel(1), "1 quokka fed!");
  });
  it("uses the plural for 2+", () => {
    assert.equal(fedLabel(2), "2 quokkas fed!");
    assert.equal(fedLabel(27), "27 quokkas fed!");
  });
});

describe("fed count increments on full study completion only", () => {
  it("study completion increments once", () => {
    const t0 = 1_000_000;
    let s = start({ ...freshState(t0), sessionId: "a" }, t0);
    const done = tick(s, t0 + 25 * 60 * 1000);
    assert.equal(done.justFinished, "study");
    assert.equal(done.state.completedStudy, 1);
    assert.equal(fedLabel(done.state.completedStudy), "1 quokka fed!");
    // A repeated tick on the finished state never double-counts.
    assert.equal(tick(done.state, t0 + 26 * 60 * 1000).state.completedStudy, 1);
  });
  it("break completion never increments", () => {
    const t0 = 2_000_000;
    const s = startNext(
      { ...freshState(t0), status: "finished", sessionId: "b" },
      t0,
    );
    assert.equal(s.mode, "break");
    const done = tick(s, t0 + 5 * 60 * 1000);
    assert.equal(done.justFinished, "break");
    assert.equal(done.state.completedStudy, 0);
  });
});

describe("resetProgression (manual quokka reset)", () => {
  it("returns count, stage, and label to starting values", () => {
    const s = {
      ...freshState(1000),
      completedStudy: 4,
      lastFedSessionId: "fed-1",
    };
    const next = resetProgression(s);
    assert.equal(next.completedStudy, 0);
    assert.equal(next.lastFedSessionId, null);
    assert.equal(stageFor(next.completedStudy), 0);
    assert.equal(fedLabel(next.completedStudy), "0 quokkas fed!");
  });
  it("preserves the timer, mode, durations, and session identity", () => {
    const t0 = 5_000_000;
    const running = start(
      {
        ...freshState(t0),
        completedStudy: 3,
        lastFedSessionId: "x",
        sessionId: "s1",
      },
      t0,
    );
    const next = resetProgression(running);
    assert.equal(next.status, "running");
    assert.equal(next.mode, running.mode);
    assert.equal(next.remainingSec, running.remainingSec);
    assert.equal(next.endAt, running.endAt);
    assert.equal(next.sessionId, running.sessionId);
    assert.equal(next.breakMinutes, running.breakMinutes);
    assert.equal(next.version, 1);
  });
  it("a later study completion feeds normally from zero", () => {
    const t0 = 9_000_000;
    const s = start({ ...freshState(t0), sessionId: "b" }, t0);
    const reset = resetProgression({
      ...s,
      completedStudy: 7,
      lastFedSessionId: "old",
    });
    const done = tick(reset, t0 + 25 * 60 * 1000);
    assert.equal(done.justFinished, "study");
    assert.equal(done.state.completedStudy, 1);
  });
});

describe("quokka reset control", () => {
  it("declares the reset icon and confirmation copy", () => {
    const tsx = readFileSync(
      join(root, "app/pomodoro/PomodoroApp.tsx"),
      "utf8",
    ).replace(/\s+/g, " ");
    assert.ok(tsx.includes('aria-label="Reset quokka progress"'));
    assert.ok(tsx.includes("Reset your quokka?"));
    assert.ok(tsx.includes("reset quokkas fed to 0"));
  });
});
