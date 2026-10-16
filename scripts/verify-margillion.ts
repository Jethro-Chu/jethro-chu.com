import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { questions } from "../data/margillionQuestions.ts";
import { advance, bonusOf, commit, dailyQuestions, emptySave, emojiFor, estimate, DAILY_RESET_DATE, marginOf, newGame, parseSave, pointsOf, questionFor, REVEAL, restoreGame, score, shareText, stats, tick, totalOf, validInput, type Game } from "../lib/margillion/engine.ts";

let checks = 0;
function test(label: string, run: () => void) { run(); checks++; console.log(`✓ ${label}`); }
const time = Date.parse("2026-10-16T12:00:00Z");
const saved = (game: Game) => { const restored = restoreGame(JSON.parse(JSON.stringify(game))); assert.ok(restored); assert.deepEqual(restored, game); return restored; };
const hit = (game: Game, ratio: number, stance: "safe" | "razor" = "safe") => commit({ ...game, input: String(questionFor(game, game.rounds.length).answer * ratio) }, stance, game.roundStartedAt + 1000);

test("45 unique, positive, finite, attributed or calculated prompts", () => {
  assert.ok(questions.length >= 40); assert.equal(new Set(questions.map(q => q.id)).size, questions.length);
  for (const q of questions) { assert.ok(q.answer > 0 && Number.isFinite(q.answer)); assert.ok(q.fact && q.prompt && q.unit); assert.ok(q.source?.startsWith("https://") || ["Everyday math", "Engineering"].includes(q.category)); }
});
test("daily deterministic across 600 UTC days, ten unique escalating tiers", () => {
  for (let day = 0; day < 600; day++) {
    const date = new Date(time + day * 86400000).toISOString().slice(0, 10), bank = dailyQuestions(date);
    assert.deepEqual(bank, dailyQuestions(date)); assert.equal(bank.length, 10); assert.equal(new Set(bank.map(q => q.id)).size, 10);
    assert.deepEqual(bank.map(q => q.difficulty), [1,1,1,2,2,2,2,3,3,3]);
  }
  assert.notDeepEqual(dailyQuestions("2026-10-16"), dailyQuestions("2026-10-17"));
});
test("safe scoring and damage caps, including a valid zero estimate", () => {
  assert.deepEqual(score(110, 100, "safe", 100), { error: 10, razor: false, bullseye: false, points: 80, damage: 10, heal: 0, margin: 90, delta: -10 });
  assert.equal(score(0, 100, "safe", 100).margin, 65); assert.equal(score(10000, 1, "safe", 100).points, 0);
});
test("Razor 5.0 succeeds; rounded 5.1 busts and doubles damage", () => {
  assert.equal(score(105, 100, "razor", 80).points, 270); assert.equal(score(105, 100, "razor", 80).margin, 85);
  assert.equal(score(105.04, 100, "razor", 80).razor, true);
  assert.equal(score(105.1, 100, "razor", 80).margin, 69.8);
  assert.equal(score(500, 100, "razor", 100).margin, 40);
});
test("bullseye boundary, stacking, cap and decimal precision", () => {
  assert.equal(score(101, 100, "safe", 80).points, 198); assert.equal(score(101.1, 100, "safe", 80).bullseye, false);
  assert.equal(score(100, 100, "razor", 80).points, 400); assert.equal(score(100, 100, "razor", 80).margin, 90);
  assert.equal(score(100, 100, "razor", 99).margin, 100);
  assert.equal(score(103.2, 100, "safe", 84.3).margin, 81.1);
  assert.throws(() => score(-1, 10, "safe", 100)); assert.throws(() => score(1, 0, "safe", 100));
});
test("decimal input: zero accepted, empty/dot/exponents/signs rejected", () => {
  assert.equal(estimate("0"), 0); assert.equal(estimate(".5"), .5); assert.equal(estimate("5."), 5);
  for (const s of ["", ".", "NaN", "Infinity", "1e3", "-1", "1.2.3", "123456789012345"]) assert.equal(estimate(s), null);
  assert.equal(validInput("."), true);
});
test("unanswered rounds never expire and late keyboard locks still score normally", () => {
  let g = newGame("daily", time); g = { ...g, input: "0" };
  assert.equal(tick(g, time + 365 * 86400000), g);
  assert.equal(g.rounds.length, 0); assert.equal(marginOf(g), 100);
  assert.equal("deadline" in g, false);
  const locked = commit(g, "safe", time + 365 * 86400000);
  assert.equal(locked.rounds[0].guess, 0); assert.equal(marginOf(locked), 65);
  assert.equal(commit(locked, "razor", time + 365 * 86400000 + 1), locked);
  assert.equal(tick(locked, locked.revealUntil! - 1), locked);
  const next = tick(locked, locked.revealUntil!); assert.equal(next.phase, "guess");
  assert.equal(tick(next, time + 730 * 86400000), next); saved(next);
});
test("timed saves retain past scores while active estimates become untimed", () => {
  const fixtures = JSON.parse(readFileSync(new URL("./fixtures/margillion-15s.json", import.meta.url), "utf8"));
  for (const name of ["initial", "active", "reveal", "complete", "depleted"]) {
    const original = fixtures[name], restored = restoreGame(original); assert.ok(restored);
    assert.equal(restored.phase, original.phase); assert.equal(restored.input, original.input);
    assert.equal(restored.rounds.length, original.rounds.length);
    assert.equal(pointsOf(restored), original.rounds.reduce((sum: number, round: { points: number }) => sum + round.points, 0));
    saved(restored);
    if (restored.phase === "guess") {
      assert.equal(tick(restored, time + 86400000), restored);
      const locked = hit(restored, 1); saved(locked); saved(advance(locked, locked.rounds.at(-1)!.at + REVEAL));
    }
  }
});
test("25-second saves also migrate without discarding completed scores", () => {
  const fixtures = JSON.parse(readFileSync(new URL("./fixtures/margillion-15s.json", import.meta.url), "utf8"));
  for (const name of ["initial", "active", "complete"]) {
    const original = fixtures[name];
    original.fuseMs = 25_000; original.deadline += 10_000;
    for (const round of original.rounds) round.fuseMs = 25_000;
    const restored = restoreGame(original); assert.ok(restored); saved(restored);
    assert.equal(pointsOf(restored), original.rounds.reduce((sum: number, round: {points: number}) => sum + round.points, 0));
    if (restored.phase === "guess") assert.equal(tick(restored, time + 86400000), restored);
  }
});
test("today resets once, earlier stats remain, and the new attempt survives reload", () => {
  const fixtures = JSON.parse(readFileSync(new URL("./fixtures/margillion-15s.json", import.meta.url), "utf8"));
  let previous = newGame("daily", time - 86400000);
  for (let i=0;i<10;i++) { previous=hit(previous,1); previous=advance(previous,previous.rounds.at(-1)!.at+REVEAL); }
  const migrated = parseSave(JSON.stringify({version:1,daily:{[previous.date]:previous,[DAILY_RESET_DATE]:fixtures.complete},practice:{...fixtures.initial,mode:"practice",id:"practice:legacy",seed:"legacy"}}));
  assert.equal(migrated.daily[DAILY_RESET_DATE], undefined);
  assert.deepEqual(migrated.daily[previous.date], previous);
  assert.equal(stats(migrated, DAILY_RESET_DATE).played, 1);
  assert.ok(migrated.practice); assert.equal(migrated.practice.phase, "guess");
  const fresh = newGame("daily", time); assert.notEqual(fresh.id, fixtures.complete.id);
  assert.equal(fresh.rounds.length, 0); assert.equal(marginOf(fresh), 100);
  migrated.daily[fresh.date] = hit({...fresh,input:"27"},1);
  const resumed = parseSave(JSON.stringify(migrated));
  assert.deepEqual(resumed.daily[fresh.date], migrated.daily[fresh.date]);
  assert.deepEqual(parseSave(JSON.stringify(resumed)), resumed);
});
test("save/restore after every lock, early advance, input and terminal phase", () => {
  let g = saved(newGame("daily", time));
  for (let i = 0; i < 10; i++) {
    g = saved(hit(g, 1, "razor"));
    assert.equal(advance(g, g.rounds.at(-1)!.at + 100), g);
    g = saved(advance(g, g.rounds.at(-1)!.at + 500));
    if (g.phase === "guess") g = saved({ ...g, input: ".5" });
  }
  assert.equal(g.phase, "complete"); assert.equal(totalOf(g), 5000); assert.equal(bonusOf(g), 1000);
  assert.equal(tick(g, time + 999999), g); assert.equal(pointsOf(g), 4000);
  assert.equal(shareText(g).match(/🎯/gu)?.length, 10);
});
test("backgrounding during a reveal advances once with no extra damage", () => {
  const locked = hit(newGame("daily", time), 1, "razor");
  const resumed = tick(locked, time + 86400000);
  assert.equal(resumed.phase, "guess"); assert.equal(resumed.rounds.length, 1);
  assert.equal(marginOf(resumed), 100); assert.equal(pointsOf(resumed), 400);
  assert.equal(tick(resumed, time + 2 * 86400000), resumed); saved(resumed);
});
test("endless cycles the full bank before repeating, never stops at ten", () => {
  let g = newGame("practice", time, "fixed-seed");
  assert.equal(new Set(Array.from({length: questions.length}, (_,i) => questionFor(g,i).id)).size, questions.length);
  for (let i = 0; i < 100; i++) { g = hit(g, 1, "razor"); g = advance(g, g.rounds.at(-1)!.at + REVEAL); }
  saved(g); assert.equal(g.phase, "guess"); assert.equal(g.rounds.length, 100); assert.equal(bonusOf(g), 0);
});
test("save replays trusted scoring and rejects invalid logs", () => {
  const g = hit(newGame("daily", time), 1, "safe"); const poisoned = JSON.parse(JSON.stringify(g)); poisoned.rounds[0].points = 99999; poisoned.rounds[0].margin = 999;
  assert.deepEqual(restoreGame(poisoned), g);
  poisoned.rounds[0].at = poisoned.rounds[0].start - 1; assert.equal(restoreGame(poisoned), null);
  assert.deepEqual(parseSave("not json"), emptySave()); assert.deepEqual(parseSave('{"version":99}'), emptySave());
  const save = emptySave(); save.daily[g.date] = saved(g); assert.deepEqual(parseSave(JSON.stringify(save)), save);
});
test("daily stats count a completed day once; practice remains separate", () => {
  let g = newGame("daily", time); for (let i=0;i<10;i++) { g=hit(g,1); g=advance(g,g.rounds.at(-1)!.at+REVEAL); }
  const save = emptySave(); save.daily[g.date] = g; save.practice = newGame("practice", time, "practice");
  assert.deepEqual(stats(save, "2026-10-16"), { played: 1, wins: 1, best: 3000, streak: 1 });
  assert.equal(stats(save, "2026-10-17").streak, 1); assert.equal(stats(save, "2026-10-18").streak, 0);
});
console.log(`${checks} Margillion checks passed.`);
