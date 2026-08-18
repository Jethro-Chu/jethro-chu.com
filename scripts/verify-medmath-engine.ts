import { ALL_QUESTION_TEMPLATES, TEMPLATE_MAP } from "../lib/medmath/templates/index.ts";
import { MEDMATH_CATEGORIES } from "../lib/medmath/categories.ts";
import { checkAnswerCorrectness } from "../lib/medmath/rounding.ts";
import { createQuestionInstance, generateNursingMedMathExam, generateCriticalCareExam } from "../lib/medmath/engine.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

console.log(`Verifying MedMath Question Engine with ${ALL_QUESTION_TEMPLATES.length} master templates...`);

// 1. Verify template count
assert(
  ALL_QUESTION_TEMPLATES.length >= 250,
  `Master template count (${ALL_QUESTION_TEMPLATES.length}) must be at least 250.`,
);

// 2. Verify all 13 categories have templates
for (const cat of MEDMATH_CATEGORIES) {
  const count = ALL_QUESTION_TEMPLATES.filter((t) => t.category === cat.id).length;
  assert(count >= 5, `Category ${cat.id} has only ${count} templates; needs at least 5.`);
  console.log(`  ✓ ${cat.shortName}: ${count} templates`);
}

// 3. Verify unique template IDs
const ids = new Set<string>();
for (const t of ALL_QUESTION_TEMPLATES) {
  assert(!ids.has(t.id), `Duplicate template ID found: ${t.id}`);
  ids.add(t.id);
}

// 4. Run 200 randomized iterations per template (22,000+ total tests)
let totalRuns = 0;
for (const template of ALL_QUESTION_TEMPLATES) {
  for (let i = 0; i < 200; i++) {
    totalRuns += 1;
    const instance = createQuestionInstance(template);

    // Validate expected answer
    if (typeof instance.expectedAnswer === "number") {
      assert(
        Number.isFinite(instance.expectedAnswer),
        `${template.id} generated non-finite answer: ${instance.expectedAnswer}`,
      );
      assert(
        !Number.isNaN(instance.expectedAnswer),
        `${template.id} generated NaN answer`,
      );
      assert(
        instance.expectedAnswer >= 0,
        `${template.id} generated negative answer: ${instance.expectedAnswer}`,
      );
    } else {
      assert(
        typeof instance.expectedAnswer === "string" && instance.expectedAnswer.length > 0,
        `${template.id} generated empty string answer`,
      );
    }

    // Validate patient weight if present
    if (instance.patientWeightKg !== undefined) {
      assert(
        instance.patientWeightKg >= 40 && instance.patientWeightKg <= 200,
        `${template.id} generated unrealistic adult kg weight: ${instance.patientWeightKg}`,
      );
    }
    if (instance.patientWeightLb !== undefined) {
      assert(
        instance.patientWeightLb >= 88 && instance.patientWeightLb <= 440,
        `${template.id} generated unrealistic adult lb weight: ${instance.patientWeightLb}`,
      );
    }

    // Validate pediatric prohibition
    const fullText = (
      instance.scenario +
      " " +
      instance.orderText +
      " " +
      instance.prompt
    ).toLowerCase();
    const bannedPediatricWords = ["pediatric", "child", "infant", "neonate", "toddler", "baby", "pediatrics", "neonatal"];
    for (const word of bannedPediatricWords) {
      assert(
        !fullText.includes(word),
        `${template.id} contains forbidden pediatric word "${word}" in scenario: "${instance.scenario}"`,
      );
    }

    // Validate hints (must have at least 2 progressive hints)
    assert(
      instance.hints.length >= 2 && instance.hints.every((h) => typeof h === "string" && h.length > 0),
      `${template.id} must have valid non-empty hints`,
    );

    // Validate solution steps
    assert(
      instance.solutionSteps.length > 0,
      `${template.id} must have at least one solution step`,
    );

    // Validate grading correctness: Expected answer submitted must pass checkAnswerCorrectness
    const correctSubmission = String(instance.expectedAnswer);
    const isGradedCorrect = checkAnswerCorrectness({
      submitted: correctSubmission,
      expected: instance.expectedAnswer,
      mode: instance.roundingMode,
      tolerance: instance.tolerance,
    });
    assert(
      isGradedCorrect,
      `${template.id} expected answer "${correctSubmission}" was marked incorrect by grading engine!`,
    );

    // Verify clearly wrong answers fail
    const wrongSubmission = "999999.99";
    const isGradedWrong = checkAnswerCorrectness({
      submitted: wrongSubmission,
      expected: instance.expectedAnswer,
      mode: instance.roundingMode,
      tolerance: instance.tolerance,
    });
    assert(
      !isGradedWrong,
      `${template.id} wrong answer "${wrongSubmission}" was marked correct!`,
    );
  }
}

// 5. Test Nursing Med Math Exam generator
console.log("\nTesting Nursing Med Math Exam generator...");
for (const count of [10, 20, 25, 50]) {
  const { instances, clientViews } = generateNursingMedMathExam({ count, difficulty: "standard" });
  assert(instances.length === count, `Nursing exam returned ${instances.length} questions, expected ${count}`);
  assert(clientViews.length === count, `Nursing exam clientViews returned ${clientViews.length}, expected ${count}`);

  // Ensure no critical care drips in regular nursing exam
  const ccCount = instances.filter((q) => q.category === "critical-care").length;
  assert(ccCount === 0, `Nursing exam contains ${ccCount} critical-care drip questions; expected 0.`);

  // Verify category distribution on standard 20-question exam
  if (count === 20) {
    const cats = instances.map((q) => q.category);
    assert(cats.includes("conversions"), "Nursing exam must include conversions");
    assert(cats.includes("basic-dosage"), "Nursing exam must include basic-dosage");
    assert(cats.includes("iv-pump"), "Nursing exam must include iv-pump");
    assert(cats.includes("gravity-drips"), "Nursing exam must include gravity-drips");
    assert(cats.includes("insulin"), "Nursing exam must include insulin");
    assert(cats.includes("weight-based"), "Nursing exam must include weight-based");
  }
  console.log(`  ✓ ${count}-question Nursing Med Math Exam generated successfully`);
}

// 6. Test Critical Care Exam generator
console.log("\nTesting Critical Care Exam generator...");
for (const count of [10, 20, 25, 50]) {
  const { instances } = generateCriticalCareExam({ count, difficulty: "standard" });
  assert(instances.length === count, `Critical Care exam returned ${instances.length} questions, expected ${count}`);
  const ccCount = instances.filter((q) => q.category === "critical-care" || q.category === "multi-step" || q.category === "heparin").length;
  assert(ccCount > 0, "Critical care exam must contain critical care, multi-step, or heparin questions");
  console.log(`  ✓ ${count}-question Critical Care Exam generated successfully`);
}

console.log(`\n✅ Successfully verified all ${ALL_QUESTION_TEMPLATES.length} templates across ${totalRuns.toLocaleString()} randomized test runs!`);
