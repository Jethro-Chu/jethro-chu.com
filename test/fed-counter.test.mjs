// Fed-counter regression tests. Zero dependencies: run with
// `node --test test/fed-counter.test.mjs`
// (Node strips the state's erasable types on import).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  fedLabel,
  freshState,
  start,
  startNext,
  tick,
} from "../app/pomodoro/pomodoroState.ts";

describe("fedLabel grammar", () => {
  it("starts at 0 quokkas fed", () => {
    assert.equal(fedLabel(0), "0 quokkas fed");
  });
  it("uses the singular for exactly 1", () => {
    assert.equal(fedLabel(1), "1 quokka fed");
  });
  it("uses the plural for 2+", () => {
    assert.equal(fedLabel(2), "2 quokkas fed");
    assert.equal(fedLabel(27), "27 quokkas fed");
  });
});

describe("fed count increments on full study completion only", () => {
  it("study completion increments once", () => {
    const t0 = 1_000_000;
    let s = start({ ...freshState(t0), sessionId: "a" }, t0);
    const done = tick(s, t0 + 25 * 60 * 1000);
    assert.equal(done.justFinished, "study");
    assert.equal(done.state.completedStudy, 1);
    assert.equal(fedLabel(done.state.completedStudy), "1 quokka fed");
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
