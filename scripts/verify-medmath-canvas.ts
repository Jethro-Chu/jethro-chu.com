import assert from "node:assert/strict";
import { isCanvasCompetencyPass } from "../lib/medmath/canvas.ts";
import { generateCanvasMedMathExam } from "../lib/medmath/engine.ts";
import { gradeAnswer } from "../lib/medmath/rounding.ts";

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

const expectedCounts = {
  conversions: 5,
  "basic-dosage": 7,
  "iv-pump": 5,
  "gravity-drips": 4,
  "infusion-time": 3,
  insulin: 3,
  reconstitution: 3,
};

for (let seed = 1; seed <= 40; seed += 1) {
  const { instances, clientViews } = generateCanvasMedMathExam({
    rng: seededRandom(seed),
  });

  assert.equal(instances.length, 30, `seed ${seed} must create 30 questions`);
  assert.equal(clientViews.length, 30, `seed ${seed} must create 30 client views`);
  assert.equal(
    new Set(instances.map((question) => question.templateId)).size,
    30,
    `seed ${seed} must not repeat a question`,
  );

  const categoryCounts = Object.fromEntries(
    Object.keys(expectedCounts).map((category) => [
      category,
      instances.filter((question) => question.category === category).length,
    ]),
  );
  assert.deepEqual(categoryCounts, expectedCounts, `seed ${seed} must stay balanced`);

  for (const question of instances) {
    const clinicalText = [
      question.title,
      question.clinicalContext,
      question.scenario,
      question.orderText,
      question.availableText,
      question.prompt,
    ]
      .filter(Boolean)
      .join(" ");
    assert.doesNotMatch(
      clinicalText,
      /\b(ICU|critical care|vasopressor|titration|DKA|intubat|sedation|pediatric|neonatal|mcg\/kg\/min)\b/i,
      `seed ${seed} includes disallowed clinical content in ${question.templateId}`,
    );
    assert.notEqual(question.difficulty, "advanced");
    assert.notEqual(question.difficulty, "critical-care");
    assert.ok(Number.isFinite(question.correctAnswer));
    assert.ok(question.solutionSteps.length > 0);
    assert.equal(gradeAnswer(question, String(question.correctAnswer)), true);

    if (Number.isInteger(question.correctAnswer)) {
      assert.equal(gradeAnswer(question, `${question.correctAnswer}.00`), true);
    }
    if (Math.abs(question.correctAnswer) >= 1000) {
      assert.equal(
        gradeAnswer(question, question.correctAnswer.toLocaleString("en-US")),
        true,
      );
    }
  }

  for (const question of clientViews) {
    assert.equal("correctAnswer" in question, false);
    assert.equal("solutionSteps" in question, false);
    assert.equal("hints" in question, false);
  }
}

assert.equal(isCanvasCompetencyPass(30), true);
assert.equal(isCanvasCompetencyPass(29), false);
for (let score = 0; score < 29; score += 1) {
  assert.equal(isCanvasCompetencyPass(score), false);
}

console.log("Med Math Canvas checks passed across 40 randomized exams.");
