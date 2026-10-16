// Run against a running server. QA dependencies can live outside the repository:
// npm install --prefix /tmp/timeundle-qa playwright @axe-core/playwright
// TIMEUNDLE_QA_MODULES=/tmp/timeundle-qa/node_modules node --experimental-strip-types scripts/verify-timeundle-browser.mjs
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { lock, makePuzzle, newGame, next, saveGame, emptySave, timeline, eventFor, STORAGE_KEY, total } from "../lib/timeundle/engine.ts";
const require = createRequire(`${process.env.TIMEUNDLE_QA_MODULES || `${process.cwd()}/node_modules`}/package.json`);
const { chromium } = require("playwright");
const { default: AxeBuilder } = require("@axe-core/playwright");
const base = process.env.TIMEUNDLE_URL || "http://localhost:3101";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const artifacts = process.env.TIMEUNDLE_QA_ARTIFACTS || path.join(tmpdir(), "timeundle-qa", "artifacts");
await mkdir(artifacts, { recursive: true });
const errors = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ["clipboard-read", "clipboard-write"] });
const page = await context.newPage();
await page.clock.install({ time: new Date("2026-10-16T12:00:00Z") });
page.on("pageerror", (error) => errors.push(error.message));
const readSave = () => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
const enter = async (target = page, practice = false) => {
  await target.getByRole("button", { name: /^(Play|Continue|View result)$/ }).waitFor();
  assert.equal(await target.locator("[data-event]").count(), 0, "opening screen hides the game until Play");
  await target.getByRole("button", { name: practice ? /^(Play practice|Continue practice|View practice result)$/ : /^(Play|Continue|View result)$/ }).click();
};
const ready = async (target = page) => {
  await target.goto(`${base}/timeundle`);
  await enter(target);
  await target.getByRole("button", { name: "Lock it in" }).waitFor();
};
try {
  await ready();
  assert.match(await page.locator('meta[name="robots"]').getAttribute("content"), /noindex/);
  await page.screenshot({ path: path.join(artifacts, "desktop.png"), fullPage: true });
  let axe = await new AxeBuilder({ page }).analyze();
  assert.deepEqual(axe.violations.map((v) => `${v.id}: ${v.description}`), []);
  const help = page.getByRole("button", { name: "How to play" });
  await help.click();
  await page.getByRole("dialog").waitFor({ state: "visible" });
  axe = await new AxeBuilder({ page }).analyze();
  assert.deepEqual(axe.violations.map((v) => v.id), []);
  await page.keyboard.press("Escape");
  assert.equal(await help.evaluate((element) => element === document.activeElement), true, "dialog restores focus");
  const slots = page.getByRole("group", { name: "Choose an insertion position" }).getByRole("button");
  await slots.first().focus();
  await page.keyboard.press("Space");
  assert.equal((await readSave()).daily["2026-10-16"]?.rounds.length ?? Object.values((await readSave()).daily)[0].rounds.length, 0);
  assert.equal(await slots.first().getAttribute("aria-pressed"), "true");
  const firstSaved = Object.values((await readSave()).daily)[0];
  const correct = timeline(firstSaved).filter((e) => e.year < eventFor(firstSaved.puzzle.queue[0]).year).length;
  const wrong = correct === 0 ? 2 : 0;
  await slots.nth(wrong).click();
  await page.reload();
  await enter();
  await page.getByRole("button", { name: "Lock it in" }).waitFor();
  assert.equal(await page.getByRole("group", { name: "Choose an insertion position" }).getByRole("button").nth(wrong).getAttribute("aria-pressed"), "true", "selection persists");
  await page.getByRole("button", { name: "Lock it in" }).dblclick();
  await page.locator('[data-guessed="true"]').waitFor();
  let saved = Object.values((await readSave()).daily)[0];
  assert.equal(saved.rounds.length, 1);
  assert.equal(saved.phase, "reveal");
  await page.reload();
  await enter();
  await page.getByRole("button", { name: "Next event" }).waitFor();
  await page.getByText("Your placement", { exact: true }).click();
  await page.getByText(/Now in its correct place/).waitFor();
  assert.equal(Object.values((await readSave()).daily)[0].rounds.length, 1, "pending reveal resumes without extra points");
  let years = await page.locator('[data-event] > div:first-of-type').allTextContents();
  assert.deepEqual(years.map(Number), years.map(Number).sort((a, b) => a - b));
  await page.getByRole("button", { name: "Next event" }).click();
  for (let round = 1; round < 7; round++) {
    saved = Object.values((await readSave()).daily)[0];
    const correct = timeline(saved).filter((event) => event.year < eventFor(saved.puzzle.queue[round]).year).length;
    await page.getByRole("group", { name: "Choose an insertion position" }).getByRole("button").nth(correct).click();
    await page.getByRole("button", { name: "Lock it in" }).click();
    await page.getByText("✓ Right on time!", { exact: true }).waitFor();
    await page.getByRole("button", { name: round === 6 ? "See results" : "Next event" }).click();
  }
  await page.getByRole("button", { name: "Share result" }).waitFor();
  assert.equal(await page.locator("[data-event]").count(), 9);
  await page.getByText("Round breakdown", { exact: true }).click();
  assert.equal(await page.getByRole("list", { name: "Round by round results" }).getByRole("listitem").count(), 7);
  axe = await new AxeBuilder({ page }).analyze();
  assert.deepEqual(axe.violations.map((v) => v.id), []);
  await page.getByRole("button", { name: "Share result" }).click();
  await page.getByText("Result copied. No event spoilers.").waitFor();
  assert.match(await page.evaluate(() => navigator.clipboard.readText()), /Timeundle #[0-9]+\n[0-9]+\/700/);
  await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: () => Promise.reject(new Error("Denied")) } }));
  await page.getByRole("button", { name: "Share result" }).click();
  await page.getByRole("textbox", { name: "Copy this spoiler-free result" }).waitFor();
  await page.screenshot({ path: path.join(artifacts, "results.png"), fullPage: true });
  const dailyFinal = Object.values((await readSave()).daily)[0];
  await page.reload();
  await enter();
  await page.getByRole("button", { name: "Share result" }).waitFor();
  assert.equal(total(Object.values((await readSave()).daily)[0]), total(dailyFinal));
  await page.getByRole("button", { name: "Play practice" }).click();
  await page.getByRole("button", { name: "Lock it in" }).waitFor();
  await page.getByRole("group", { name: "Choose an insertion position" }).getByRole("button").first().click();
  await page.getByRole("button", { name: "Lock it in" }).click();
  await page.getByRole("button", { name: "Next event" }).waitFor();
  assert.equal((await readSave()).practice.rounds.length, 1);
  assert.deepEqual(Object.values((await readSave()).daily)[0], dailyFinal);
  await page.getByRole("button", { name: "Timeundle home" }).click();
  await enter();
  await page.getByRole("button", { name: "Share result" }).waitFor();
  await page.getByRole("button", { name: "Timeundle home" }).click();
  await enter(page, true);
  await page.getByRole("button", { name: "Next event" }).waitFor();
  assert.equal((await readSave()).practice.rounds.length, 1, "practice resumes across mode switches");
  await page.reload();
  await enter(page, true);
  await page.getByRole("button", { name: "Next event" }).waitFor();
  assert.match(await page.locator("main").innerText(), /PRACTICE/, "refresh resumes practice and pending reveal");

  // Narrow-screen interaction, a fully populated scrollable timeline, reduced motion.
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  const mp = await mobile.newPage();
  await mp.clock.install({ time: new Date("2026-10-16T12:00:00Z") });
  await ready(mp);
  await mp.screenshot({ path: path.join(artifacts, "mobile.png"), fullPage: true });
  assert.equal(await mp.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  axe = await new AxeBuilder({ page: mp }).analyze();
  assert.deepEqual(axe.violations.map((v) => v.id), []);
  await mp.getByRole("group", { name: "Choose an insertion position" }).getByRole("button").last().tap();
  await mp.getByRole("button", { name: "Lock it in" }).tap();
  await mp.getByRole("button", { name: "Next event" }).waitFor();
  assert.equal(await mp.locator("[data-event]").count(), 3);
  let long = newGame(makePuzzle("2026-10-16"));
  for (let i = 0; i < 6; i++) long = next(lock({ ...long, selected: 0 }));
  await mp.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: STORAGE_KEY, value: JSON.stringify(saveGame(emptySave(), long)) });
  await mp.reload();
  await enter(mp);
  await mp.getByRole("button", { name: "Lock it in" }).waitFor();
  assert.equal(await mp.locator("[data-event]").count(), 8);
  const lastSlot = mp.getByRole("group", { name: "Choose an insertion position" }).getByRole("button").last();
  await lastSlot.tap();
  assert.equal(await lastSlot.getAttribute("aria-pressed"), "true");
  const lockBounds = await mp.getByRole("button", { name: "Lock it in" }).boundingBox();
  assert.ok(lockBounds && lockBounds.y >= 0 && lockBounds.y + lockBounds.height <= 844, "mobile lock remains visible after scrolling");
  await mp.screenshot({ path: path.join(artifacts, "mobile-long.png"), fullPage: true });
  await mobile.close();

  // UTC rollover without refresh: retain old game, explicitly open today's.
  const rollover = await browser.newContext();
  const rp = await rollover.newPage();
  await rp.clock.install({ time: new Date("2026-10-16T23:59:59Z") });
  await ready(rp);
  await rp.clock.runFor(2000);
  await rp.getByText(/A new UTC day has begun/).waitFor();
  await rp.getByRole("button", { name: "play today’s daily" }).click();
  assert.match(await rp.locator("main").innerText(), /DAILY #2/);
  await rollover.close();
  // Every other route stays unlisted and has its own original metadata.
  const sitemap = await (await page.request.get(`${base}/sitemap.xml`)).text();
  assert.ok(!sitemap.includes("timeundle"));
  for (const route of ["/", "/website", "/pomodoro"]) {
    const response = await page.request.get(`${base}${route}`);
    assert.equal(response.status(), 200);
    assert.ok(!((await response.text()).includes('href="/timeundle"')));
  }
  assert.deepEqual(errors, []);
  console.log("Browser verification passed: full daily game, keyboard, wrong correction, refresh/resume, duplicate lock, results, clipboard + fallback, practice isolation, mobile + long timelines, reduced motion, UTC rollover, noindex, sitemap and existing routes; zero axe violations or page errors.");
} finally { await browser.close(); }
