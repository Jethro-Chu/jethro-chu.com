// Scene-lock regression tripwire: the quokka/sign must never move with any
// scroll vector, so the page itself is a fixed viewport box, the document
// is scroll-locked while the route is mounted, and only the timer dock may
// scroll (short viewports). A real browser proves the pixels; this guards
// the load-bearing declarations against silent reverts.
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

describe("fixed scene layer", () => {
  it("page is a fixed viewport box that never scrolls", () => {
    const page = rule(".page");
    assert.match(page, /position:\s*fixed/);
    assert.match(page, /inset:\s*0/);
    assert.match(page, /overflow:\s*hidden/);
    assert.doesNotMatch(page, /min-height/);
    assert.doesNotMatch(page, /100(vh|svh|dvh)/);
  });
  it("background is absolute inside the fixed page, not viewport-fixed", () => {
    const bg = rule(".bg");
    assert.match(bg, /position:\s*absolute/);
    assert.match(bg, /inset:\s*0/);
  });
  it("content column fills the fixed page exactly", () => {
    assert.match(rule(".content"), /height:\s*100%/);
  });
  it("quokka row can never shrink", () => {
    assert.match(rule(".quokkaRow"), /flex:\s*none/);
  });
  it("timer dock owns the only scroll and shrinks first", () => {
    const dock = rule(".uiDock");
    assert.match(dock, /min-height:\s*0/);
    assert.match(dock, /overflow-y:\s*auto/);
  });
  it("route locks document scroll while mounted and restores on unmount", () => {
    assert.ok(tsx.includes("document.documentElement"), "touches html element");
    assert.ok(
      tsx.includes("html.style.overflow = \"hidden\""),
      "locks html overflow",
    );
    assert.ok(
      tsx.includes("body.style.overflow = \"hidden\""),
      "locks body overflow",
    );
    assert.ok(
      tsx.includes("html.style.overflow = prev.htmlOverflow"),
      "restores html overflow on unmount",
    );
    assert.ok(
      tsx.includes("body.style.overflow = prev.bodyOverflow"),
      "restores body overflow on unmount",
    );
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
