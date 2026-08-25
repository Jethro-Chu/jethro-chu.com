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
assert.equal(rankedStart.session.questions.length, 20);
assert.equal("disorder" in rankedStart.question, false, "The public question must not expose its answer");

let lastRankedResult;
for (let index = 0; index < 20; index += 1) {
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
assert.equal(afterRanked?.rankedQuestionsAnswered, 20);
assert.equal(afterRanked?.rankedQuestionsCorrect, 20);
assert.equal(afterRanked?.rankedGamesCompleted, 1);
assert.ok((afterRanked?.rating ?? 0) > 1000);

const practicePlayer = await createPlayer(`Practice ${suffix}`);
const practiceStart = await startSession(practicePlayer.id, "practice", { difficulty: "intermediate", category: "compensation" });
const practiceStored = await getSession(practiceStart.session.id);
assert.ok(practiceStored);
const practiceQuestion = practiceStored.questions[0];
const practiceResult = await submitAnswer(practicePlayer.id, practiceStored.id, practiceQuestion.id, {
  disorder: practiceQuestion.disorder,
  compensation: practiceQuestion.compensation,
});
assert.equal(practiceResult.ratingChange, 0);
assert.equal((await getPlayer(practicePlayer.id))?.rating, 1000);
await assert.rejects(
  () => submitAnswer(practicePlayer.id, practiceStored.id, practiceQuestion.id, { disorder: practiceQuestion.disorder, compensation: practiceQuestion.compensation }),
  /no longer active|already submitted/,
);

const survivalPlayer = await createPlayer(`Survival ${suffix}`);
const survivalStart = await startSession(survivalPlayer.id, "survival");
let survivalStored = await getSession(survivalStart.session.id);
assert.ok(survivalStored);
let survivalQuestion = survivalStored.questions[survivalStored.currentIndex];
const correctSurvival = await submitAnswer(survivalPlayer.id, survivalStored.id, survivalQuestion.id, {
  disorder: survivalQuestion.disorder,
  compensation: survivalQuestion.compensation,
});
assert.equal(correctSurvival.session.complete, false);
survivalStored = await getSession(survivalStart.session.id);
assert.ok(survivalStored);
survivalQuestion = survivalStored.questions[survivalStored.currentIndex];
const wrongDisorder = survivalQuestion.disorder === "Normal" ? "Respiratory Acidosis" : "Normal";
const failedSurvival = await submitAnswer(survivalPlayer.id, survivalStored.id, survivalQuestion.id, {
  disorder: wrongDisorder,
  compensation: "Mixed / Not Applicable",
});
assert.equal(failedSurvival.correct, false);
assert.equal(failedSurvival.session.complete, true);
assert.equal((await getPlayer(survivalPlayer.id))?.survivalBest, 1);

console.log("ABG service verified: anonymous identity, duplicate names, 20-question Ranked completion, server rating, Practice isolation, duplicate protection, and Survival game over.");
