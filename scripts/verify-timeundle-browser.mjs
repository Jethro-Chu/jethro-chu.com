// Optional browser QA. Keep tooling outside the application's dependency tree:
// npm install --prefix /tmp/timeundle-qa playwright @axe-core/playwright
// TIMEUNDLE_QA_MODULES=/tmp/timeundle-qa/node_modules node --experimental-strip-types scripts/verify-timeundle-browser.mjs
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { eventFor, makePuzzle, STORAGE_KEY, timeline, total } from "../lib/timeundle/engine.ts";
const require = createRequire(`${process.env.TIMEUNDLE_QA_MODULES || `${process.cwd()}/node_modules`}/package.json`);
const { chromium } = require("playwright");
const { default: AxeBuilder } = require("@axe-core/playwright");
const base = process.env.TIMEUNDLE_URL || "http://localhost:3103";
const artifacts = process.env.TIMEUNDLE_QA_ARTIFACTS || path.join(tmpdir(), "timeundle-qa", "artifacts");
await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, permissions: ["clipboard-read", "clipboard-write"] });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install({ time: new Date("2026-10-16T12:00:00Z") });
  await page.goto(`${base}/timeundle`);
  await page.getByRole("button", { name: "Play daily dive", exact: true }).waitFor();
  assert.equal(await page.locator("[data-event]").count(), 0, "Play gates the game");
  assert.match(await page.locator('meta[name="robots"]').getAttribute("content"), /noindex/);
  await page.clock.pauseAt(new Date("2026-10-16T12:01:00Z"));
  const read = () => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
  await page.getByRole("button", { name: "Play daily dive", exact: true }).click();
  const initial = (await read()).daily["2026-10-16"];
  assert.deepEqual(initial.puzzle, makePuzzle("2026-10-16"));
  assert.equal(initial.deadlineAt - Date.parse("2026-10-16T12:01:00Z"), 20000);
  assert.equal(await page.getByRole("button", { name: "Lock it in" }).count(), 0);
  assert.equal(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight), true);
  await page.screenshot({ path: path.join(artifacts, "chrono-desktop.png"), fullPage: false });
  let axe = await new AxeBuilder({ page }).analyze();
  assert.deepEqual(axe.violations.map((v) => `${v.id}: ${v.description}`), []);
  // Board starts in the center gap. Keyboard aims before the first anchor.
  const prompt = page.locator('section[aria-label="Current event"] h2');
  await prompt.press("ArrowUp");
  await page.clock.runFor(5000);
  await prompt.press("Enter");
  let saved = (await read()).daily["2026-10-16"];
  assert.equal(saved.rounds.length, 1);
  assert.equal(saved.rounds[0].base, 40);
  assert.equal(saved.rounds[0].speed, 8);
  assert.equal(saved.phase, "reveal");
  await page.reload();
  await page.getByRole("button", { name: "Resume daily dive" }).click();
  assert.equal((await read()).daily["2026-10-16"].rounds.length, 1);
  for (let round = 1; round < 7; round++) {
    await page.clock.runFor(300);
    await page.getByRole("button", { name: "Next event", exact: true }).click();
    saved = (await read()).daily["2026-10-16"];
    const event = eventFor(saved.puzzle.queue[round]);
    const correct = timeline(saved).filter((other) => other.year < event.year).length;
    if (round === 1) {
      await page.getByRole("button", { name: /Chrono-snipe/ }).click();
      await page.getByLabel("Exact year").fill(String(event.year));
    }
    await page.locator(`[data-slot="${correct}"]`).click();
    saved = (await read()).daily["2026-10-16"];
    assert.equal(saved.rounds.length, round + 1);
    assert.equal(saved.rounds[round].tier, "exact");
    assert.equal(saved.rounds[round].multiplier, round);
    if (round === 1) assert.equal(saved.rounds[round].snipe, 25);
    const years = await page.locator('[data-event]').evaluateAll((elements) => elements.map((element) => Number(element.children[1].textContent)));
    assert.deepEqual(years, [...years].sort((a, b) => a - b));
  }
  await page.clock.runFor(400);
  await page.getByRole("button", { name: "See results", exact: true }).click();
  await page.getByRole("button", { name: "Share result" }).waitFor();
  assert.equal(await page.locator("[data-event]").count(), 9);
  const dailyFinal = (await read()).daily["2026-10-16"];
  assert.equal(total(dailyFinal), 2803);
  await page.getByRole("button", { name: "Share result" }).click();
  assert.match(await page.evaluate(() => navigator.clipboard.readText()), /2803 pts · 6\/7 exact · 6x max streak/);
  await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: () => Promise.reject(new Error("Denied")) } }));
  await page.getByRole("button", { name: "Share result" }).click();
  await page.getByRole("textbox", { name: "Copy this spoiler-free result" }).waitFor();
  await page.screenshot({ path: path.join(artifacts, "chrono-results.png"), fullPage: false });
  axe = await new AxeBuilder({ page }).analyze();
  assert.deepEqual(axe.violations.map((v) => v.id), []);
  // A separate practice game expires across refresh without regaining time.
  await page.getByRole("button", { name: "Dive again" }).click();
  const deadline = (await read()).practice.deadlineAt;
  await page.clock.runFor(17000);
  await page.reload();
  await page.getByRole("button", { name: "Resume practice", exact: true }).click();
  assert.equal((await read()).practice.deadlineAt, deadline);
  await page.clock.runFor(3200);
  await page.getByRole("button", { name: "Next event", exact: true }).waitFor();
  assert.equal((await read()).practice.rounds.length, 1);
  assert.equal((await read()).practice.rounds[0].timedOut, true);
  assert.deepEqual((await read()).daily["2026-10-16"], dailyFinal);
  // Native touch: first tap previews, second tap commits, including the initial gap.
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  const mp = await mobile.newPage();
  await mp.goto(`${base}/timeundle`);
  await mp.getByRole("button", { name: "Play daily dive", exact: true }).tap();
  const gap = mp.locator('[data-slot="1"]');
  await gap.tap();
  assert.equal(await mp.getByRole("group", { name: "Choose an insertion position" }).count(), 1);
  await gap.tap();
  await mp.getByRole("button", { name: "Next event", exact: true }).waitFor();
  assert.equal(await mp.locator("[data-event]").count(), 3);
  assert.equal(await mp.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth), true);
  await mp.screenshot({ path: path.join(artifacts, "chrono-mobile.png"), fullPage: false });
  await mobile.close();
  const sitemap = await (await page.request.get(`${base}/sitemap.xml`)).text();
  assert.ok(!sitemap.includes("timeundle"));
  for (const route of ["/", "/website", "/pomodoro"]) assert.equal((await page.request.get(`${base}${route}`)).status(), 200);
  assert.deepEqual(errors, []);
  console.log("Chrono-Dive browser QA passed: direct play, fixed viewport, keyboard, one-click drops, timers, speed/combos/snipes, correction, resume, sharing/fallback, touch preview/drop, reduced motion, practice isolation, noindex and existing routes.");
} finally { await browser.close(); }
