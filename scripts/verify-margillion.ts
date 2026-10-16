import assert from "node:assert/strict";
import { questions } from "../data/margillionQuestions.ts";
import { advance, bonusOf, commit, dailyQuestions, emptySave, emojiFor, estimate, FUSE, marginOf, newGame, parseSave, pointsOf, questionFor, REVEAL, restoreGame, score, shareText, stats, tick, totalOf, validInput, type Game } from "../lib/margillion/engine.ts";

let checks = 0;
function test(label: string, run: () => void) { run(); checks++; console.log(`✓ ${label}`); }
const time = Date.parse("2026-10-16T12:00:00Z");
const saved = (game: Game) => { const restored = restoreGame(JSON.parse(JSON.stringify(game))); assert.ok(restored); assert.deepEqual(restored, game); return restored; };
const hit = (game: Game, ratio: number, stance: "safe" | "razor" = "safe") => commit({ ...game, input: String(questionFor(game, game.rounds.length).answer * ratio) }, stance, game.deadline - 1000);

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
test("strict fuse, duplicate commit ignored, timeout at exact deadline", () => {
  let g = newGame("daily", time); g = { ...g, input: "0" };
  assert.equal(tick(g, g.deadline - 1), g);
  const timeout = commit(g, "razor", g.deadline); assert.equal(timeout.rounds[0].guess, null); assert.equal(marginOf(timeout), 75);
  assert.equal(commit(timeout, "safe", time + FUSE + 1), timeout);
  assert.equal(tick(timeout, timeout.revealUntil! - 1), timeout); assert.equal(tick(timeout, timeout.revealUntil!).phase, "guess");
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
test("suspended tab catches up to death without resetting deadlines", () => {
  const g = tick(newGame("daily", time), time + 5 * (FUSE + REVEAL)); saved(g);
  assert.equal(g.phase, "complete"); assert.equal(g.rounds.length, 4); assert.equal(marginOf(g), 0); assert.equal(totalOf(g), 0);
  assert.equal(emojiFor(g.rounds[3]), "💀"); assert.equal(shareText(g).match(/⬜/gu)?.length, 6);
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
  poisoned.rounds[0].at += FUSE; assert.equal(restoreGame(poisoned), null);
  assert.deepEqual(parseSave("not json"), emptySave()); assert.deepEqual(parseSave('{"version":99}'), emptySave());
  const save = emptySave(); save.daily[g.date] = saved(g); assert.deepEqual(parseSave(JSON.stringify(save)), save);
});
test("daily stats count a completed day once; practice remains separate", () => {
  let g = newGame("daily", time); for (let i=0;i<10;i++) { g=hit(g,1); g=advance(g,g.rounds.at(-1)!.at+REVEAL); }
  const save = emptySave(); save.daily[g.date] = g; save.practice = tick(newGame("practice", time, "practice"), time + 100000);
  assert.deepEqual(stats(save, "2026-10-16"), { played: 1, wins: 1, best: 3000, streak: 1 });
  assert.equal(stats(save, "2026-10-17").streak, 1); assert.equal(stats(save, "2026-10-18").streak, 0);
});
console.log(`${checks} Margillion checks passed.`);
