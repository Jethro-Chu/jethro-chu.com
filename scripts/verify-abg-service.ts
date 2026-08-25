import assert from "node:assert/strict";
import { createPlayer, startSession, submitAnswer, updateDisplayName, validateDisplayName } from "../lib/abg/service.ts";
import { getPlayer, getSession } from "../lib/abg/store.ts";

assert.equal(validateDisplayName("<script>").ok, false);
assert.equal(validateDisplayName(" ").ok, false);
assert.equal(validateDisplayName("A").ok, false);
assert.equal(validateDisplayName("Nurse_Player.7").ok, true);

const suffix = String(Date.now()).slice(-6);
const rankedPlayer = await createPlayer(`Ranked ${suffix}`);
await assert.rejects(() => createPlayer(rankedPlayer.displayName), /already taken/);
await updateDisplayName(rankedPlayer.id, `RN ${suffix}`);
assert.equal((await getPlayer(rankedPlayer.id))?.displayName, `RN ${suffix}`);
const rankedStart = await startSession(rankedPlayer.id, "ranked");
assert.equal(rankedStart.session.questions.length, 10);
assert.equal("disorder" in rankedStart.question, false, "The public question must not expose its answer");

let lastRankedResult;
for (let index = 0; index < 10; index += 1) {
  const stored = await getSession(rankedStart.session.id);
  assert.ok(stored);
  const question = stored.questions[stored.currentIndex];
  lastRankedResult = await submitAnswer(rankedPlayer.id, stored.id, question.id, {
    disorder: question.disorder,
    compensation: question.compensation,
  });
}
assert.ok(lastRankedResult?.sessionComplete || lastRankedResult?.session.complete);
const afterRanked = await getPlayer(rankedPlayer.id);
assert.equal(afterRanked?.rankedQuestionsAnswered, 10);
assert.equal(afterRanked?.rankedQuestionsCorrect, 10);
assert.equal(afterRanked?.rankedGamesCompleted, 1);
assert.ok((afterRanked?.rating ?? 0) > 1000);

const duplicateSession = await startSession(await createPlayer(`Double ${suffix}`).then((player) => player.id), "ranked");
const duplicateQuestion = duplicateSession.session.questions[0];
await submitAnswer(duplicateSession.session.playerId, duplicateSession.session.id, duplicateQuestion.id, {
  disorder: duplicateQuestion.disorder,
  compensation: duplicateQuestion.compensation,
});
await assert.rejects(
  () => submitAnswer(duplicateSession.session.playerId, duplicateSession.session.id, duplicateQuestion.id, { disorder: duplicateQuestion.disorder, compensation: duplicateQuestion.compensation }),
  /no longer active|already submitted/,
);

console.log("ABG service verified: anonymous identity, duplicate names, 10-question Ranked completion, server rating, and duplicate protection.");
