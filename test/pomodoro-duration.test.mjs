// Custom Study duration regression tests: input parsing/validation and the
// custom-seconds threading through start/reset/startNext/selectSession.
// Zero dependencies: run with `node --test test/pomodoro-duration.test.mjs`.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  STUDY_SEC,
  durationFor,
  freshState,
  parseStudyInput,
  resetCurrent,
  selectSession,
  start,
  startNext,
} from "../app/pomodoro/pomodoroState.ts";

describe("parseStudyInput", () => {
  it("accepts MM:SS within 1..120 minutes", () => {
    assert.equal(parseStudyInput("10:00"), 600);
    assert.equal(parseStudyInput("15:00"), 900);
    assert.equal(parseStudyInput("25:00"), 1500);
    assert.equal(parseStudyInput("60:00"), 3600);
    assert.equal(parseStudyInput("120:00"), 7200);
    assert.equal(parseStudyInput("5:30"), 330);
    assert.equal(parseStudyInput("01:00"), 60);
  });
  it("accepts a bare minute count as MM:00", () => {
    assert.equal(parseStudyInput("30"), 1800);
    assert.equal(parseStudyInput("1"), 60);
    assert.equal(parseStudyInput("120"), 7200);
    assert.equal(parseStudyInput(" 45 "), 2700);
  });
  it("rejects zero, out-of-range, and malformed input", () => {
    for (const bad of [
      "00:00",
      "0",
      "0:45",
      "121",
      "121:00",
      "120:01",
      "999",
      "5:99",
      "1:60",
      "5:3",
      "-5",
      "-5:00",
      "abc",
      "10:0a",
      "",
      "   ",
      "10:00:00",
      "NaN",
      "Infinity",
    ]) {
      assert.equal(parseStudyInput(bad), null, JSON.stringify(bad));
    }
  });
});

describe("custom study seconds threading", () => {
  it("defaults to 25:00 when not provided", () => {
    assert.equal(durationFor("study", 5), STUDY_SEC);
    assert.equal(durationFor("study", 5, undefined), STUDY_SEC);
    assert.equal(durationFor("break", 5, 2400), 300);
    assert.equal(durationFor("break", 10, 2400), 600);
  });
  it("start uses the custom study duration from idle", () => {
    const s = start({ ...freshState(0), sessionId: "a" }, 0, 2400);
    assert.equal(s.remainingSec, 2400);
    assert.equal(s.endAt, 2400 * 1000);
  });
  it("reset restores the custom study duration", () => {
    const s = resetCurrent(
      { ...freshState(0), status: "paused", remainingSec: 111 },
      2400,
    );
    assert.equal(s.status, "idle");
    assert.equal(s.remainingSec, 2400);
  });
  it("startNext into study uses the custom duration", () => {
    const s = startNext(
      { ...freshState(0), status: "finished", mode: "break", sessionId: "b" },
      0,
      2100,
    );
    assert.equal(s.mode, "study");
    assert.equal(s.remainingSec, 2100);
  });
  it("selecting study arms the custom duration; breaks stay fixed", () => {
    const toStudy = selectSession(
      { ...freshState(0), mode: "break", breakMinutes: 5 },
      "study",
      2400,
    );
    assert.equal(toStudy.remainingSec, 2400);
    const toBreak = selectSession({ ...freshState(0) }, "break5", 2400);
    assert.equal(toBreak.remainingSec, 300);
    const toBreak10 = selectSession({ ...freshState(0) }, "break10", 2400);
    assert.equal(toBreak10.remainingSec, 600);
  });
});
