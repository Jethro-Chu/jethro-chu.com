import { ALL_QUESTION_TEMPLATES, TEMPLATE_MAP } from "../lib/medmath/templates/index.ts";
import { MEDMATH_CATEGORIES } from "../lib/medmath/categories.ts";
import { gradeAnswer, roundTo } from "../lib/medmath/rounding.ts";
import { createQuestionInstance, generateNursingMedMathExam, generateCriticalCareExam, generateRandomQuestion } from "../lib/medmath/engine.ts";

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

// 4. Run 200 randomized iterations per template (55,400 total tests)
let totalRuns = 0;
for (const template of ALL_QUESTION_TEMPLATES) {
  for (let i = 0; i < 200; i++) {
    totalRuns += 1;
    const instance = createQuestionInstance(template);

    // Validate stored correctAnswer is finite number
    assert(
      Number.isFinite(instance.correctAnswer),
      `${template.id} generated non-finite correctAnswer: ${instance.correctAnswer}`,
    );
    assert(
      !Number.isNaN(instance.correctAnswer),
      `${template.id} generated NaN correctAnswer`,
    );
    assert(
      instance.correctAnswer >= 0,
      `${template.id} generated negative correctAnswer: ${instance.correctAnswer}`,
    );

    // Validate answerUnit is non-empty string
    assert(
      typeof instance.answerUnit === "string" && instance.answerUnit.length > 0,
      `${template.id} missing answerUnit`,
    );

    // Validate answerPrecision is non-negative integer
    assert(
      typeof instance.answerPrecision === "number" &&
      Number.isInteger(instance.answerPrecision) &&
      instance.answerPrecision >= 0,
      `${template.id} invalid answerPrecision: ${instance.answerPrecision}`,
    );

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

    // Validate hints
    assert(
      instance.hints.length >= 2 && instance.hints.every((h) => typeof h === "string" && h.length > 0),
      `${template.id} must have valid non-empty hints`,
    );

    // Validate solution steps
    assert(
      instance.solutionSteps.length > 0,
      `${template.id} must have at least one solution step`,
    );

    // Validate grading correctness: Stored correct answer must be graded correct
    const isGradedCorrect = gradeAnswer(instance, instance.correctAnswer);
    assert(
      isGradedCorrect,
      `${template.id} stored correctAnswer ${instance.correctAnswer} was marked incorrect!`,
    );

    // Formatted string submission must also grade correct
    const formatted = instance.correctAnswer.toFixed(instance.answerPrecision);
    const isFormattedCorrect = gradeAnswer(instance, formatted);
    assert(
      isFormattedCorrect,
      `${template.id} formatted string answer "${formatted}" was marked incorrect!`,
    );

    // Wrong answers must be marked incorrect
    const isGradedWrong = gradeAnswer(instance, instance.correctAnswer + 999);
    assert(
      !isGradedWrong,
      `${template.id} wrong answer was marked correct!`,
    );
  }
}

// 5. Explicitly verify known user test cases
console.log("\nVerifying known reference questions...");

// Case A: Norepinephrine 8 mg / 250 mL, 32 mcg/mL, 15 mL/hr, 75 kg
const norepiTemplate = ALL_QUESTION_TEMPLATES.find((t) => t.id === "cc-reverse-norepi-mlhr-to-mcgkgmin");
assert(Boolean(norepiTemplate), "cc-reverse-norepi-mlhr-to-mcgkgmin template must exist");
// Test deterministic generation for the 75 kg / 15 mL/hr data point
const norepiInstance = norepiTemplate!.generate(() => 0); // picks first index in array: { rateMlHr: 15, bagMg: 8, bagMl: 250, concMcgMl: 32, weightKg: 75, mcgMin: 8.0, doseMcgKgMin: 0.11 }
assert(norepiInstance.correctAnswer === 0.11, `Norepinephrine correctAnswer expected 0.11, got ${norepiInstance.correctAnswer}`);
assert(norepiInstance.answerUnit === "mcg/kg/min", `Norepinephrine answerUnit expected mcg/kg/min, got ${norepiInstance.answerUnit}`);
assert(norepiInstance.answerPrecision === 2, `Norepinephrine answerPrecision expected 2, got ${norepiInstance.answerPrecision}`);
assert(gradeAnswer(norepiInstance, "0.11"), "Norepinephrine submission 0.11 must grade correct");
assert(!gradeAnswer(norepiInstance, "0.15"), "Norepinephrine wrong submission 0.15 must grade incorrect");
console.log("  ✓ Norepinephrine 8 mg / 250 mL (15 mL/hr, 75 kg): 0.11 mcg/kg/min verified");

// Case B: Vancomycin 250 mL over 90 minutes
const vancTemplate = ALL_QUESTION_TEMPLATES.find((t) => t.id === "iv-pump-ivpb-90min-vancomycin");
assert(Boolean(vancTemplate), "iv-pump-ivpb-90min-vancomycin template must exist");
const vancInstance = vancTemplate!.generate(() => 0); // picks first index: { med: "Vancomycin 1,000 mg", volMl: 250, mins: 90, rate: 166.7 }
assert(vancInstance.correctAnswer === 166.7, `Vancomycin correctAnswer expected 166.7, got ${vancInstance.correctAnswer}`);
assert(vancInstance.answerUnit === "mL/hr", `Vancomycin answerUnit expected mL/hr, got ${vancInstance.answerUnit}`);
assert(vancInstance.answerPrecision === 1, `Vancomycin answerPrecision expected 1, got ${vancInstance.answerPrecision}`);
assert(gradeAnswer(vancInstance, "166.7"), "Vancomycin submission 166.7 must grade correct");
assert(!gradeAnswer(vancInstance, "125"), "Vancomycin wrong submission 125 must grade incorrect");
console.log("  ✓ Vancomycin 250 mL over 90 minutes: 166.7 mL/hr verified");

// 6. Test Nursing Med Math Exam generator
console.log("\nTesting Nursing Med Math Exam generator...");
for (const count of [10, 20, 25, 50]) {
  const { instances, clientViews } = generateNursingMedMathExam({ count, difficulty: "standard" });
  assert(instances.length === count, `Nursing exam returned ${instances.length} questions, expected ${count}`);
  assert(clientViews.length === count, `Nursing exam clientViews returned ${clientViews.length}, expected ${count}`);

  for (const q of instances) {
    assert(Number.isFinite(q.correctAnswer), `Exam question ${q.templateId} missing valid correctAnswer`);
    assert(typeof q.answerUnit === "string" && q.answerUnit.length > 0, `Exam question ${q.templateId} missing answerUnit`);
  }

  // Ensure no critical care drips in regular nursing exam
  const ccCount = instances.filter((q) => q.category === "critical-care").length;
  assert(ccCount === 0, `Nursing exam contains ${ccCount} critical-care drip questions; expected 0.`);

  console.log(`  ✓ ${count}-question Nursing Med Math Exam generated and validated`);
}

// 7. Test Critical Care Exam generator
console.log("\nTesting Critical Care Exam generator...");
for (const count of [10, 20, 25, 50]) {
  const { instances } = generateCriticalCareExam({ count, difficulty: "standard" });
  assert(instances.length === count, `Critical Care exam returned ${instances.length} questions, expected ${count}`);
  const ccCount = instances.filter((q) => q.category === "critical-care" || q.category === "multi-step" || q.category === "heparin").length;
  assert(ccCount > 0, "Critical care exam must contain critical care, multi-step, or heparin questions");
  console.log(`  ✓ ${count}-question Critical Care Exam generated and validated`);
}

// 8. Test Targeted Remediation (Missed Question Templates)
console.log("\nTesting Targeted Remediation (Missed Questions)...");
const sampleMissedIds = ALL_QUESTION_TEMPLATES.slice(0, 10).map((t) => t.id);
for (let i = 0; i < 20; i++) {
  const { instance, clientView } = generateRandomQuestion({ templateIds: sampleMissedIds });
  assert(sampleMissedIds.includes(instance.templateId), `Generated template ${instance.templateId} not in missed set`);
  assert(Number.isFinite(instance.correctAnswer), "Remediation question must have finite correctAnswer");
  assert(Boolean(clientView.scenario), "Client view scenario must be present");
  assert(Boolean(clientView.prompt), "Client view prompt must be present");
}
console.log("  ✓ Targeted remediation generates fresh questions from missed template set");

console.log(`\n✅ Successfully verified all ${ALL_QUESTION_TEMPLATES.length} templates across ${totalRuns.toLocaleString()} randomized test runs!`);
