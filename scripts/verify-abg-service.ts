import assert from "node:assert/strict";
import { createPlayer, startSession, submitAnswer, updateDisplayName, validateDisplayName } from "../lib/abg/service.ts";
import { getLeaderboard, getPlayer, getSession } from "../lib/abg/store.ts";

assert.equal(validateDisplayName("<script>").ok, false);
assert.equal(validateDisplayName(" ").ok, false);
assert.equal(validateDisplayName("A").ok, false);
assert.equal(validateDisplayName("Nurse_Player.7").ok, true);

const suffix = String(Date.now()).slice(-6);
const player = await createPlayer(`Ranked ${suffix}`);
await assert.rejects(() => createPlayer(player.displayName), /already taken/);
await updateDisplayName(player.id, `RN ${suffix}`);
assert.equal((await getPlayer(player.id))?.displayName, `RN ${suffix}`);

const started = await startSession(player.id, "ranked");
assert.equal(started.session.questions.length, 1);
assert.equal(started.question.total, null);
assert.equal("disorder" in started.question, false, "The public question must not expose its answer");

for (let index = 0; index < 25; index += 1) {
  const stored = await getSession(started.session.id);
  assert.ok(stored);
  const question = stored.questions[stored.currentIndex];
  const result = await submitAnswer(player.id, stored.id, question.id, {
    disorder: question.disorder,
    compensation: question.compensation,
  });
  assert.equal(result.session.complete, false);
  assert.equal(result.session.total, null);
  assert.ok(result.nextQuestion);
}

const afterRun = await getPlayer(player.id);
assert.equal(afterRun?.rankedQuestionsAnswered, 25);
assert.equal(afterRun?.rankedQuestionsCorrect, 25);
assert.ok((afterRun?.rating ?? 0) > 1000);
assert.equal(afterRun?.activeSessionId, started.session.id);
const ranks = await getLeaderboard();
assert.equal(ranks[0]?.rank, 1);
assert.equal(ranks[0]?.player.id, player.id);

const duplicatePlayer = await createPlayer(`Double ${suffix}`);
const duplicateSession = await startSession(duplicatePlayer.id, "ranked");
const duplicateQuestion = duplicateSession.session.questions[0];
await submitAnswer(duplicatePlayer.id, duplicateSession.session.id, duplicateQuestion.id, {
  disorder: duplicateQuestion.disorder,
  compensation: duplicateQuestion.compensation,
});
await assert.rejects(
  () => submitAnswer(duplicatePlayer.id, duplicateSession.session.id, duplicateQuestion.id, {
    disorder: duplicateQuestion.disorder,
    compensation: duplicateQuestion.compensation,
  }),
  /no longer active|already submitted/,
);

console.log("ABG service verified: anonymous identity, continuous Ranked play, global ranks, live rating, no question limit, and duplicate protection.");
