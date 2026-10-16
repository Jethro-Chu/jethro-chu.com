import assert from "node:assert/strict";
import { EVENTS_V1 } from "../lib/timeundle/events.ts";
import * as legacy from "../lib/timeundle/legacy.ts";
import { DAY_MS, TURN_MS, basePoints, currentStreak, emptySave, eventFor, exact, fitsRound, lock, makePuzzle, maxStreak, newGame, next, parseSave, remainingMs, restoreGame, saveGame, shareText, startRound, statistics, tierFor, timeline, total, utcDate } from "../lib/timeundle/engine.ts";
import type { Game } from "../lib/timeundle/engine.ts";

assert.equal(EVENTS_V1.length, 46);
assert.equal(new Set(EVENTS_V1.map((event) => event.id)).size, EVENTS_V1.length);
const fixture = makePuzzle("2026-10-16");
assert.deepEqual(fixture.anchors, ["golden-gate", "switch"]);
assert.deepEqual(fixture.queue, ["iphone", "wright", "phonograph", "hubble", "viking", "bugs-life", "wii"]);
const framingPositions = new Set<number>();
for (let day = 0; day < 600; day++) {
  const date = utcDate(Date.parse("2026-10-16") + day * DAY_MS);
  const puzzle = makePuzzle(date);
  assert.deepEqual(puzzle, makePuzzle(date));
  const ids = [...puzzle.anchors, ...puzzle.queue];
  assert.equal(new Set(ids).size, 9);
  assert.equal(new Set(ids.map((id) => eventFor(id).year)).size, 9);
  const anchors = puzzle.anchors.map(eventFor);
  assert.ok(anchors[1].year - anchors[0].year >= 60 && anchors[1].year - anchors[0].year <= 120);
  framingPositions.add(anchors.filter((event) => event.year < eventFor(puzzle.queue[0]).year).length);
  const board = [...anchors];
  for (let round = 0; round < 7; round++) {
    const event = eventFor(puzzle.queue[round]);
    assert.ok(fitsRound(event, board, round), `Compression curve failed on ${date}, round ${round + 1}`);
    board.push(event);
  }
  assert.ok(new Set(board.map((event) => event.category)).size >= 4);
  let game = newGame(puzzle);
  assert.equal(game.deadlineAt, null);
  assert.equal(lock(game, 0), game, "unstarted rounds cannot score");
  game = startRound(game, 0);
  for (let round = 0; round < 7; round++) {
    const previous = timeline(game);
    const event = eventFor(puzzle.queue[round]);
    const correct = previous.filter((entry) => entry.year < event.year).length;
    for (let guess = 0; guess <= previous.length; guess++) {
      const revealed = lock({ ...game, selected: guess }, round * 1000 + 500);
      const last = revealed.rounds.at(-1)!;
      assert.equal(last.correct, correct);
      assert.equal(last.base, basePoints(Math.abs(guess - correct), previous.length));
      assert.equal(lock(revealed, 0), revealed, "repeat drop cannot award twice");
      assert.deepEqual(restoreGame(JSON.parse(JSON.stringify(revealed))), revealed, "pending reveal replays and resumes");
      assert.deepEqual(timeline(revealed).map((event) => event.year), [...previous.map((event) => event.year), event.year].sort((a, b) => a - b));
    }
    game = next(lock({ ...game, selected: correct, snipeYear: event.year }, round * 1000), (round + 1) * 1000);
    assert.equal(next(game, 9000), game, "repeat Next cannot skip a round");
    assert.deepEqual(restoreGame(game), game);
  }
  assert.equal(game.phase, "complete");
  assert.equal(total(game), 3815, "perfect instant run + seven snipes = 3815");
  assert.equal(exact(game), 7);
  assert.equal(currentStreak(game), 7);
  assert.equal(maxStreak(game), 7);
  assert.equal(timeline(game).length, 9);
}
assert.deepEqual([...framingPositions].sort(), [0, 1, 2], "first rounds must use every insertion position");
// Exhaust all correct/guessed insertion positions, board sizes and timer endpoints.
const distinct = EVENTS_V1.filter((event, index, all) => all.findIndex((other) => other.year === event.year) === index).slice(0, 9);
for (let round = 0; round < 7; round++) {
  const events = distinct.slice(0, round + 3);
  for (let correct = 0; correct < events.length; correct++) {
    const candidate = events[correct];
    const prior = events.filter((event) => event.id !== candidate.id);
    const game: Game = { ...newGame(fixture), puzzle: { ...fixture, anchors: prior.slice(0, 2).map((event) => event.id), queue: [...prior.slice(2).map((event) => event.id), candidate.id] }, rounds: prior.slice(2).map((event) => ({ eventId: event.id, guessed: 0, correct: 0, points: 100 })), deadlineAt: TURN_MS };
    for (let guessed = 0; guessed < events.length; guessed++) for (const elapsed of [0, 5000, 10000, 19999, 20000]) {
      const revealed = lock({ ...game, selected: guessed }, elapsed);
      const last = revealed.rounds.at(-1)!;
      const distance = Math.abs(guessed - correct);
      assert.equal(last.correct, correct);
      const base = distance === 0 ? 100 : distance === 1 ? prior.length <= 3 ? 40 : 75 : distance === 2 ? prior.length <= 4 ? 15 : 50 : distance === 3 ? prior.length <= 4 ? 0 : 25 : 0;
      const speed = Math.round(((TURN_MS - elapsed) / TURN_MS) * (distance === 0 ? 30 : distance === 1 ? 10 : 0));
      assert.equal(last.points, (base + speed) * (distance === 0 ? round + 1 : 1));
    }
  }
}
let fresh = startRound(newGame(fixture), 5000);
assert.equal(fresh.deadlineAt, 25000);
assert.equal(startRound(fresh, 9999), fresh, "resume never resets the fuse");
assert.equal(remainingMs(fresh, 26000), 0);
const restored = restoreGame(JSON.parse(JSON.stringify(fresh)))!;
assert.equal(restored.deadlineAt, 25000);
assert.equal(remainingMs(restored, 27000), 0, "refresh can't regain time");
const expired = lock({ ...restored, selected: null }, 27000, true);
assert.equal(expired.rounds[0].points, 0);
assert.equal(expired.rounds[0].timedOut, true);
assert.equal(tierFor(expired.rounds[0]), "miss");
const correct = timeline(fresh).filter((event) => event.year < eventFor(fixture.queue[0]).year).length;
const timedHit = lock({ ...fresh, selected: correct, snipeYear: eventFor(fixture.queue[0]).year }, 25000, true);
assert.equal(timedHit.rounds[0].base, 100);
assert.equal(timedHit.rounds[0].speed, 0);
assert.equal(timedHit.rounds[0].snipe, 0);
for (const difference of [-3, -2, 0, 2, 3]) {
  const event = eventFor(fixture.queue[0]);
  const sniped = lock({ ...fresh, selected: correct, snipeYear: event.year + difference }, 6000);
  assert.equal(sniped.rounds[0].snipe, Math.abs(difference) <= 2 ? 25 : 0);
}
assert.equal(lock({ ...fresh, selected: 2, snipeYear: eventFor(fixture.queue[0]).year }, 6000).rounds[0].snipe, 0, "a year outside the chosen gap cannot snipe");
const invalid = { ...fresh, selected: 99 };
assert.equal(lock(invalid, 6000), invalid);
// Legacy content and scores remain intact, and a saved classic game can continue.
let old = legacy.newGame(legacy.makePuzzle("2026-10-16"));
const oldCorrect = legacy.timeline(old).filter((event) => event.year < legacy.eventFor(old.puzzle.queue[0]).year).length;
old = legacy.next(legacy.lock({ ...old, selected: oldCorrect }));
const migrated = restoreGame(old)!;
assert.equal(migrated.puzzle.version, 1);
assert.deepEqual(migrated.puzzle, old.puzzle);
assert.deepEqual(migrated.rounds, old.rounds);
const resumed = startRound(migrated, 0);
const resumedCorrect = timeline(resumed).filter((event) => event.year < eventFor(resumed.puzzle.queue[1]).year).length;
const mixed = lock({ ...resumed, selected: resumedCorrect }, 1000);
assert.equal(mixed.rounds[0].points, 100);
assert.equal(mixed.rounds[1].points, 258);
assert.deepEqual(restoreGame(mixed), mixed);
const tampered = structuredClone(mixed);
tampered.rounds[1].speed = 99;
assert.equal(restoreGame(tampered), null);
assert.deepEqual(parseSave("broken"), emptySave());
function finish(date: string, mode: "daily" | "practice" = "daily"): Game {
  let game = startRound(newGame(makePuzzle(date, mode)), 0);
  for (let i = 0; i < 7; i++) game = next(lock({ ...game, selected: 0 }, 100), 0);
  return game;
}
let data = emptySave();
for (const date of ["2026-10-16", "2026-10-17", "2026-10-18"]) data = saveGame(data, finish(date));
assert.equal(statistics(data, "2026-10-19").streak, 3);
assert.equal(statistics(data, "2026-10-20").streak, 0);
const stats = statistics(data, "2026-10-19");
data = saveGame(data, finish("2026-10-19", "practice"));
assert.deepEqual(statistics(data, "2026-10-19"), stats);
assert.deepEqual(parseSave(JSON.stringify(data)), data);
const share = shareText(data.daily["2026-10-16"]);
assert.ok(share.includes("pts") && share.includes("max streak") && share.endsWith("jethrochu.com/timeundle"));
for (const event of EVENTS_V1) assert.ok(!share.includes(event.title));
console.log("Timeundle v2 verified: 600 seeded compression curves; every slot, board size and timer boundary; speed, streaks, snipes, expiry, replay, legacy migration, daily streaks and practice isolation.");
