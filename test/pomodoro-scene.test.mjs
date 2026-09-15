// Scene-lock regression tripwire: the quokka/sign must never scroll with
// the document, so the page is locked to one viewport and only the timer
// dock may scroll (short viewports). A real browser proves the pixels; this
// guards the four load-bearing declarations against silent reverts.
// Run with `node --test test/pomodoro-scene.test.mjs`.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(root, "app/pomodoro/pomodoro.module.css"), "utf8");
const tsx = readFileSync(join(root, "app/pomodoro/PomodoroApp.tsx"), "utf8");

function rule(selector) {
  const m = css.match(new RegExp(`\\${selector} \\{([^}]*)\\}`, "s"));
  assert.ok(m, `${selector} rule exists`);
  return m[1];
}

describe("locked viewport scene", () => {
  it("page is exactly one viewport tall and never scrolls", () => {
    const page = rule(".page");
    assert.match(page, /height:\s*100svh/);
    assert.match(page, /overflow:\s*clip/);
    assert.doesNotMatch(page, /min-height/);
  });
  it("content column is exactly one viewport tall", () => {
    const content = rule(".content");
    assert.match(content, /height:\s*100svh/);
    assert.doesNotMatch(content, /min-height/);
  });
  it("quokka row can never shrink", () => {
    assert.match(rule(".quokkaRow"), /flex:\s*none/);
  });
  it("timer dock owns the only scroll and shrinks first", () => {
    const dock = rule(".uiDock");
    assert.match(dock, /min-height:\s*0/);
    assert.match(dock, /overflow-y:\s*auto/);
  });
  it("counter and console render inside the dock, quokka outside it", () => {
    const dockOpen = tsx.indexOf("<div className={styles.uiDock}>");
    assert.ok(dockOpen > -1, "uiDock wrapper exists");
    const after = tsx.slice(dockOpen);
    assert.ok(after.includes("styles.fedCounter"), "counter inside dock");
    assert.ok(after.includes("styles.console}"), "console inside dock");
    const quokkaAt = tsx.indexOf("<Quokka ");
    assert.ok(quokkaAt > -1 && quokkaAt < dockOpen, "quokka above dock");
  });
});
