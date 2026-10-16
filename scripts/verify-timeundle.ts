import assert from "node:assert/strict";
import { EVENTS_V1 } from "../lib/timeundle/events.ts";
import { DAY_MS, emptySave, eventFor, exact, lock, makePuzzle, newGame, next, parseSave, pointsFor, restoreGame, saveGame, shareText, statistics, timeline, total, utcDate } from "../lib/timeundle/engine.ts";
import type { Game } from "../lib/timeundle/engine.ts";

assert.ok(EVENTS_V1.length >= 40);
assert.equal(new Set(EVENTS_V1.map((event) => event.id)).size, EVENTS_V1.length);
for (const event of EVENTS_V1) {
  assert.ok(event.title && event.fact && event.category && event.year >= 1700);
  assert.equal(new URL(event.source).protocol, "https:");
  assert.ok(!event.title.includes(String(event.year)), `Year leaked: ${event.id}`);
}
assert.equal(JSON.stringify(makePuzzle("2026-10-16")), '{"version":1,"id":"2026-10-16","mode":"daily","date":"2026-10-16","anchors":["moon","n64"],"queue":["donkey-kong","youtube","nes","game-watch","constitution","earthrise","nemo"]}');
const coverage = new Set<string>();
for (let day = 0; day < 600; day++) {
  const date = utcDate(Date.parse("2026-10-16") + day * DAY_MS);
  const puzzle = makePuzzle(date);
  assert.deepEqual(puzzle, makePuzzle(date));
  const ids = [...puzzle.anchors, ...puzzle.queue];
  assert.equal(new Set(ids).size, 9);
  assert.equal(new Set(ids.map((id) => eventFor(id).year)).size, 9);
  assert.ok(new Set(ids.map((id) => eventFor(id).category)).size >= 4);
  let game = newGame(puzzle);
  assert.equal(lock(game), game);
  for (let round = 0; round < 7; round++) {
    const prior = timeline(game);
    const current = eventFor(puzzle.queue[round]);
    const correct = prior.filter((event) => event.year < current.year).length;
    coverage.add(`${round}:${correct}`);
    for (let guess = 0; guess <= prior.length; guess++) {
      const selected = { ...game, selected: guess };
      assert.equal(selected.rounds.length, round, "selection must not submit");
      const revealed = lock(selected);
      assert.equal(revealed.rounds.at(-1)!.points, Math.max(0, 100 - 25 * Math.abs(guess - correct)));
      assert.equal(revealed.rounds.at(-1)!.correct, correct);
      assert.equal(lock(revealed), revealed, "repeat lock must be idempotent");
      assert.deepEqual(restoreGame(JSON.parse(JSON.stringify(revealed))), revealed, "pending reveal resumes");
      assert.deepEqual(timeline(revealed).map((event) => event.year), [...prior.map((event) => event.year), current.year].sort((a, b) => a - b));
    }
    const invalid = { ...game, selected: prior.length + 1 };
    assert.equal(lock(invalid), invalid, "invalid positions cannot submit");
    game = next(lock({ ...game, selected: correct }));
    assert.equal(next(game), game, "repeat Next must not skip a round");
  }
  assert.equal(game.phase, "complete");
  assert.equal(total(game), 700);
  assert.equal(exact(game), 7);
  assert.equal(timeline(game).length, 9);
  assert.deepEqual(restoreGame(game), game);
}
// Exercise every correct insertion position independently of the generator's
// intentionally fixed anchor ranks (which occupy two positions in each puzzle).
const distinct = EVENTS_V1.filter((event, index, events) => events.findIndex((other) => other.year === event.year) === index).slice(0, 9);
for (let round = 0; round < 7; round++) {
  const events = distinct.slice(0, round + 3);
  for (let correct = 0; correct < events.length; correct++) {
    const candidate = events[correct];
    const previous = events.filter((event) => event.id !== candidate.id);
    const game: Game = {
      puzzle: { ...makePuzzle("2026-10-16"), anchors: previous.slice(0, 2).map((event) => event.id), queue: [...previous.slice(2).map((event) => event.id), candidate.id] },
      rounds: previous.slice(2).map((event) => ({ eventId: event.id, guessed: 0, correct: 0, points: 100 })),
      phase: "place", selected: null,
    };
    for (let guessed = 0; guessed < events.length; guessed++) {
      const revealed = lock({ ...game, selected: guessed });
      assert.equal(revealed.rounds.at(-1)!.correct, correct);
      assert.equal(revealed.rounds.at(-1)!.points, pointsFor(guessed, correct));
    }
  }
}
for (let correct = 0; correct <= 8; correct++) for (let guess = 0; guess <= 8; guess++) assert.equal(pointsFor(guess, correct), Math.max(0, 100 - Math.abs(guess - correct) * 25));

function finish(date: string, practice = false): Game {
  let game = newGame(makePuzzle(date, practice ? "practice" : "daily", practice ? "test-seed" : date));
  for (let i = 0; i < 7; i++) game = next(lock({ ...game, selected: 0 }));
  return game;
}
let data = emptySave();
for (const day of ["2026-10-16", "2026-10-17", "2026-10-18"]) data = saveGame(data, finish(day));
assert.deepEqual(statistics(data, "2026-10-18"), { played: 3, streak: 3, best: Math.max(...Object.values(data.daily).map(total)), average: Math.round(Object.values(data.daily).reduce((sum, game) => sum + total(game), 0) / 3) });
assert.equal(statistics(data, "2026-10-19").streak, 3, "today can still be unplayed");
assert.equal(statistics(data, "2026-10-20").streak, 0, "a missed day breaks the streak");
data = saveGame(data, finish("2026-10-20"));
assert.equal(statistics(data, "2026-10-20").streak, 1);
const beforePractice = statistics(data, "2026-10-20");
data = saveGame(data, finish("2026-10-20", true));
assert.deepEqual(statistics(data, "2026-10-20"), beforePractice);
data = saveGame(data, finish("2026-10-20"));
assert.equal(statistics(data, "2026-10-20").played, 4, "date-keyed completion cannot award twice");
assert.deepEqual(parseSave(JSON.stringify(data)), data);
assert.deepEqual(parseSave("broken"), emptySave());
assert.deepEqual(parseSave('{"schema":2}'), emptySave());
const tampered = structuredClone(data.daily["2026-10-20"]);
tampered.rounds[0].points = 999;
assert.equal(restoreGame(tampered), null);
const share = shareText(data.daily["2026-10-20"]);
assert.ok(share.includes("/700") && share.includes("/7 exact") && share.endsWith("jethrochu.com/timeundle"));
for (const event of EVENTS_V1) assert.ok(!share.includes(event.title));
assert.ok(!shareText(data.practice!).includes("#"));
assert.equal(utcDate(Date.parse("2026-10-16T23:59:59.999Z")), "2026-10-16");
assert.equal(utcDate(Date.parse("2026-10-17T00:00:00Z")), "2026-10-17");
console.log(`Timeundle verified: ${EVENTS_V1.length} events, 600 daily puzzles, every insertion position and scoring tier, replay/resume, rollover, streaks, practice isolation and spoiler-free sharing.`);
