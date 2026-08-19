import { MEDMATH_CATEGORIES } from "../lib/medmath/categories.ts";
import {
  createQuestionInstance,
  generateCriticalCareExam,
  generateNursingMedMathExam,
  generateRandomQuestion,
  getCachedQuestionInstance,
} from "../lib/medmath/engine.ts";
import { STORED_MEDMATH_QUESTIONS } from "../lib/medmath/question-bank.generated.ts";
import { formatAnswer, gradeAnswer, roundTo } from "../lib/medmath/rounding.ts";
import type { StoredNumericQuestion } from "../lib/medmath/types.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertThrows(run: () => unknown, message: string): void {
  let threw = false;
  try {
    run();
  } catch {
    threw = true;
  }
  assert(threw, message);
}

type ArithmeticToken = number | "+" | "-" | "×" | "÷" | "(" | ")";

function tokenizeArithmetic(calculation: string): ArithmeticToken[] {
  const leftSide = calculation
    .split("=", 1)[0]
    .replace(/(?<=\d),(?=\d)/g, "");
  const matches = leftSide.match(/\d+(?:\.\d+)?|[()+\-×÷]/g) ?? [];
  return matches.map((token) =>
    /^\d/.test(token) ? Number(token) : (token as ArithmeticToken),
  );
}

function evaluateArithmetic(tokens: ArithmeticToken[]): number {
  let index = 0;

  const parseFactor = (): number => {
    const token = tokens[index++];
    if (typeof token === "number") return token;
    if (token === "-") return -parseFactor();
    if (token === "(") {
      const value = parseExpression();
      assert(tokens[index++] === ")", "Unclosed arithmetic expression");
      return value;
    }
    throw new Error(`Unexpected arithmetic token: ${String(token)}`);
  };

  const parseTerm = (): number => {
    let value = parseFactor();
    while (tokens[index] === "×" || tokens[index] === "÷") {
      const operator = tokens[index++];
      const right = parseFactor();
      value = operator === "×" ? value * right : value / right;
    }
    return value;
  };

  const parseExpression = (): number => {
    let value = parseTerm();
    while (tokens[index] === "+" || tokens[index] === "-") {
      const operator = tokens[index++];
      const right = parseTerm();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  };

  const value = parseExpression();
  assert(index === tokens.length, "Unused arithmetic tokens remain");
  return value;
}

function recomputeQuestionAnswer(question: StoredNumericQuestion): number {
  if (question.id === "insulin-sliding-scale-only") {
    const bg = Number(question.rawVariables.bg);
    if (bg < 150) return 0;
    if (bg < 200) return 2;
    if (bg < 250) return 4;
    if (bg < 300) return 6;
    if (bg < 350) return 8;
    if (bg < 400) return 10;
    return 12;
  }

  if (question.id === "insulin-sliding-scale-moderate") {
    const bg = Number(question.rawVariables.bg);
    if (bg < 150) return 0;
    if (bg <= 200) return 3;
    if (bg <= 250) return 6;
    if (bg <= 300) return 9;
    if (bg <= 350) return 12;
    return 15;
  }

  if (question.id === "insulin-basal-glargine") {
    const orderedUnits = question.orderText.match(/(\d+(?:\.\d+)?) units/i)?.[1];
    assert(orderedUnits, `Could not independently read ordered units for ${question.id}`);
    return Number(orderedUnits);
  }

  const finalCalculation = question.solutionSteps.at(-1)?.calculation;
  assert(finalCalculation, `${question.id} has no final calculation to audit`);
  const tokens = tokenizeArithmetic(finalCalculation);
  assert(tokens.length >= 3, `${question.id} has no auditable arithmetic expression`);
  return evaluateArithmetic(tokens);
}

function getRequiredQuestion(id: string): StoredNumericQuestion {
  const question = STORED_MEDMATH_QUESTIONS.find((item) => item.id === id);
  assert(question, `Required stored question ${id} is missing`);
  return question;
}

console.log(
  `Auditing ${STORED_MEDMATH_QUESTIONS.length} materialized MedMath questions...`,
);

assert(
  STORED_MEDMATH_QUESTIONS.length === 277,
  `Expected exactly 277 stored questions, found ${STORED_MEDMATH_QUESTIONS.length}`,
);

const ids = new Set<string>();
let verifiedCount = 0;
let suspiciousZeroCount = 0;

assert(
  !gradeAnswer(STORED_MEDMATH_QUESTIONS[0], ""),
  "Blank input must not be interpreted as zero",
);
assertThrows(
  () => gradeAnswer({ correctAnswer: Number.NaN, answerPrecision: 1 }, "1"),
  "Invalid stored answers must fail loudly",
);
assertThrows(
  () => formatAnswer(Number.NaN, 1),
  "Invalid result answers must fail loudly during formatting",
);

for (const category of MEDMATH_CATEGORIES) {
  const count = STORED_MEDMATH_QUESTIONS.filter(
    (question) => question.category === category.id,
  ).length;
  assert(count >= 5, `Category ${category.id} has only ${count} stored questions`);
  console.log(`  ${category.shortName}: ${count} questions`);
}

console.log("\nFull stored-answer audit:");
for (const question of STORED_MEDMATH_QUESTIONS) {
  assert(!ids.has(question.id), `Duplicate question ID: ${question.id}`);
  ids.add(question.id);

  const finite = Number.isFinite(question.correctAnswer);
  assert(
    finite,
    `${question.id} has missing or invalid correctAnswer: ${question.correctAnswer}`,
  );
  assert(question.answerUnit.trim(), `${question.id} has missing answerUnit`);
  assert(
    Number.isInteger(question.answerPrecision) && question.answerPrecision >= 0,
    `${question.id} has invalid answerPrecision: ${question.answerPrecision}`,
  );
  if (question.correctAnswer === 0) {
    suspiciousZeroCount += 1;
    throw new Error(
      `${question.id} has a suspicious zero correctAnswer that has not been accepted`,
    );
  }

  const recomputed = roundTo(
    recomputeQuestionAnswer(question),
    question.answerPrecision,
  );
  assert(
    recomputed === question.correctAnswer,
    `${question.id} stored ${question.correctAnswer}, independently recomputed ${recomputed}`,
  );

  assert(
    gradeAnswer(question, question.correctAnswer),
    `${question.id} did not accept its stored answer`,
  );
  const formatted = formatAnswer(
    question.correctAnswer,
    question.answerPrecision,
  );
  assert(
    gradeAnswer(question, formatted),
    `${question.id} did not accept formatted answer ${formatted}`,
  );
  const wrongAnswer =
    question.correctAnswer + 10 / 10 ** question.answerPrecision;
  assert(
    !gradeAnswer(question, wrongAnswer),
    `${question.id} accepted deliberately wrong answer ${wrongAnswer}`,
  );

  const rehydrated = getCachedQuestionInstance(`${question.id}::external-worker`);
  assert(rehydrated, `${question.id} could not be rehydrated without memory cache`);
  assert(
    rehydrated.correctAnswer === question.correctAnswer,
    `${question.id} changed answer during cross-worker rehydration`,
  );

  verifiedCount += 1;
  console.log(
    [
      question.id,
      question.category,
      question.title,
      `question=${JSON.stringify(
        [
          question.scenario,
          question.orderText,
          question.availableText,
          question.prompt,
        ]
          .filter(Boolean)
          .join(" "),
      )}`,
      `stored=${formatted}`,
      `unit=${question.answerUnit}`,
      `precision=${question.answerPrecision}`,
      `finite=${finite}`,
      `recomputed=${formatAnswer(recomputed, question.answerPrecision)}`,
      "verification=PASS",
    ].join(" | "),
  );
}

console.log("\nRequired regression questions:");
const regressions = [
  { id: "cc-milrinone-mcg-kg-min", answer: 5.3, unit: "mL/hr", precision: 1, correctInput: "5.3" },
  { id: "multi-magnesium-infusion-eclamp-rate", answer: 37.5, unit: "mL/hr", precision: 1, correctInput: "37.5" },
  { id: "cc-reverse-norepi-mlhr-to-mcgkgmin", answer: 0.11, unit: "mcg/kg/min", precision: 2, correctInput: "0.11" },
  { id: "iv-pump-ivpb-90min-vancomycin", answer: 166.7, unit: "mL/hr", precision: 1, correctInput: "166.7" },
];

for (const expected of regressions) {
  const question = getRequiredQuestion(expected.id);
  assert(
    question.correctAnswer === expected.answer,
    `${expected.id} expected ${expected.answer}, found ${question.correctAnswer}`,
  );
  assert(question.answerUnit === expected.unit, `${expected.id} unit mismatch`);
  assert(question.answerPrecision === expected.precision, `${expected.id} precision mismatch`);
  assert(gradeAnswer(question, expected.correctInput), `${expected.id} grading failed`);
  assert(
    `${formatAnswer(question.correctAnswer, question.answerPrecision)} ${question.answerUnit}` ===
      `${expected.correctInput} ${expected.unit}`,
    `${expected.id} result formatting failed`,
  );
  console.log(`  PASS ${question.title}: ${expected.correctInput} ${expected.unit}`);
}

console.log("\nExam and remediation generation:");
for (const count of [10, 20, 25, 50]) {
  const nursing = generateNursingMedMathExam({ count, difficulty: "standard" });
  const criticalCare = generateCriticalCareExam({ count, difficulty: "standard" });
  assert(nursing.instances.length === count, `Nursing exam expected ${count}`);
  assert(criticalCare.instances.length === count, `Critical-care exam expected ${count}`);
  for (const instance of [...nursing.instances, ...criticalCare.instances]) {
    assert(Number.isFinite(instance.correctAnswer), `${instance.templateId} invalid in exam`);
  }
  console.log(`  PASS ${count}-question nursing and critical-care exams`);
}

const remediationIds = STORED_MEDMATH_QUESTIONS.slice(0, 20).map(
  (question) => question.id,
);
for (let index = 0; index < 20; index += 1) {
  const { instance } = generateRandomQuestion({ templateIds: remediationIds });
  assert(remediationIds.includes(instance.templateId), "Remediation selected wrong question");
}
console.log("  PASS 20 targeted remediation selections");

const crossCategorySamples = Array.from({ length: 20 }, (_, index) =>
  STORED_MEDMATH_QUESTIONS[
    Math.floor((index * STORED_MEDMATH_QUESTIONS.length) / 20)
  ],
);
const sampledCategories = new Set(
  crossCategorySamples.map((question) => question.category),
);
assert(
  sampledCategories.size === MEDMATH_CATEGORIES.length,
  `Expected samples from all ${MEDMATH_CATEGORIES.length} categories, found ${sampledCategories.size}`,
);
for (const question of crossCategorySamples) {
  const instance = createQuestionInstance(question);
  assert(gradeAnswer(instance, instance.correctAnswer), `${question.id} instance grading failed`);
}
console.log(
  `  PASS 20 additional samples spanning all ${sampledCategories.size} categories`,
);

console.log(
  `\nPASS: ${verifiedCount} stored questions audited; ${suspiciousZeroCount} zero answers; all answers finite and independently verified.`,
);
