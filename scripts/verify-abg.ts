import assert from "node:assert/strict";
import { interpretABG } from "../lib/abg/engine.ts";
import { generateABGQuestion, validateGeneratedQuestion } from "../lib/abg/generator.ts";
import { getABGIntervention } from "../lib/abg/interventions.ts";
import { applyRatingChange, calculateRatingChange, expectedScore } from "../lib/abg/rating.ts";

const cases = [
  [{ ph: 7.4, paco2: 40, hco3: 24 }, "Normal", "Mixed / Not Applicable"],
  [{ ph: 7.35, paco2: 35, hco3: 22 }, "Normal", "Mixed / Not Applicable"],
  [{ ph: 7.45, paco2: 45, hco3: 26 }, "Normal", "Mixed / Not Applicable"],
  [{ ph: 7.28, paco2: 55, hco3: 24 }, "Respiratory Acidosis", "Uncompensated"],
  [{ ph: 7.3, paco2: 55, hco3: 30 }, "Respiratory Acidosis", "Partially Compensated"],
  [{ ph: 7.47, paco2: 30, hco3: 24 }, "Respiratory Alkalosis", "Uncompensated"],
  [{ ph: 7.5, paco2: 30, hco3: 20 }, "Respiratory Alkalosis", "Partially Compensated"],
  [{ ph: 7.29, paco2: 40, hco3: 18 }, "Metabolic Acidosis", "Uncompensated"],
  [{ ph: 7.31, paco2: 30, hco3: 18 }, "Metabolic Acidosis", "Partially Compensated"],
  [{ ph: 7.5, paco2: 40, hco3: 32 }, "Metabolic Alkalosis", "Uncompensated"],
  [{ ph: 7.48, paco2: 50, hco3: 32 }, "Metabolic Alkalosis", "Partially Compensated"],
  [{ ph: 7.36, paco2: 52, hco3: 30 }, "Respiratory Acidosis", "Fully Compensated"],
  [{ ph: 7.44, paco2: 30, hco3: 20 }, "Respiratory Alkalosis", "Fully Compensated"],
  [{ ph: 7.37, paco2: 30, hco3: 18 }, "Metabolic Acidosis", "Fully Compensated"],
  [{ ph: 7.43, paco2: 50, hco3: 30 }, "Metabolic Alkalosis", "Fully Compensated"],
  [{ ph: 7.2, paco2: 55, hco3: 16 }, "Mixed Disorder", "Mixed / Not Applicable"],
  [{ ph: 7.55, paco2: 25, hco3: 32 }, "Mixed Disorder", "Mixed / Not Applicable"],
] as const;

for (const [values, disorder, compensation] of cases) {
  const result = interpretABG(values);
  assert.equal(result.disorder, disorder, JSON.stringify(values));
  assert.equal(result.compensation, compensation, JSON.stringify(values));
  assert.equal(result.explanation.length, 4);
  const intervention = getABGIntervention(result.disorder, result.compensation);
  assert.ok(intervention.priority.length > 0);
  assert.ok(intervention.nursingInterventions.length >= 3);
  assert.ok(intervention.possibleTreatments.length >= 2);
  assert.ok(intervention.monitor.length >= 4);
  assert.ok(intervention.remember.length > 0);
  if (!["Normal", "Mixed Disorder"].includes(result.disorder)) {
    assert.ok(intervention.compensationTeaching);
  }
}

const boundaryNormals = [
  { ph: 7.35, paco2: 40, hco3: 24 },
  { ph: 7.4, paco2: 35, hco3: 24 },
  { ph: 7.4, paco2: 45, hco3: 24 },
  { ph: 7.4, paco2: 40, hco3: 22 },
  { ph: 7.4, paco2: 40, hco3: 26 },
  { ph: 7.45, paco2: 40, hco3: 24 },
];
for (const values of boundaryNormals) assert.equal(interpretABG(values).disorder, "Normal");

for (let index = 0; index < 3000; index += 1) {
  const question = generateABGQuestion({ difficulty: "all" });
  assert.equal(validateGeneratedQuestion(question), true);
}

assert.equal(expectedScore(1000, 1000), 0.5);
assert.ok(calculateRatingChange(1000, 1150, true) > calculateRatingChange(1000, 900, true));
assert.ok(calculateRatingChange(1000, 900, false) < calculateRatingChange(1000, 1150, false));
assert.ok(Math.abs(calculateRatingChange(1000, 1500, true)) <= 24);
assert.equal(applyRatingChange(405, -24), 400);

console.log(`ABG engine verified: ${cases.length} clinical patterns with curated interventions, ${boundaryNormals.length} boundary cases, 3000 generated questions, and rating safeguards.`);
