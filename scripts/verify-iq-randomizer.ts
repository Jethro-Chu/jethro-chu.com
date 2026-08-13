import { iqQuestions } from "../lib/iqtest/questions.ts";
import {
  generateBalancedTest,
  QUESTION_CATEGORIES,
  QUESTIONS_PER_CATEGORY,
  shuffled,
  TEST_QUESTION_COUNT,
} from "../lib/iqtest/randomizer.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(iqQuestions.length === 50, "The master bank must contain 50 questions.");
assert(
  new Set(iqQuestions.map((question) => question.stableId)).size === 50,
  "Stable question IDs must be unique.",
);

for (const category of QUESTION_CATEGORIES) {
  assert(
    iqQuestions.filter((question) => question.category === category).length === 10,
    `${category} must contain 10 bank questions.`,
  );
}

for (const question of iqQuestions) {
  assert(question.options.length === 4, `${question.stableId} needs four options.`);
  assert(
    new Set(question.options.map((option) => option.id)).size === 4,
    `${question.stableId} has duplicate option IDs.`,
  );
  assert(
    question.options.filter((option) => option.id === question.correctAnswer).length === 1,
    `${question.stableId} must have exactly one keyed correct answer.`,
  );
}

const reached = new Set<string>();
const signatures = new Set<string>();

for (let simulation = 0; simulation < 1000; simulation += 1) {
  const test = generateBalancedTest(iqQuestions);
  assert(test.length === TEST_QUESTION_COUNT, `Simulation ${simulation} is not 25 questions.`);
  assert(
    new Set(test.map((question) => question.stableId)).size === TEST_QUESTION_COUNT,
    `Simulation ${simulation} contains a duplicate question.`,
  );

  for (const category of QUESTION_CATEGORIES) {
    assert(
      test.filter((question) => question.category === category).length ===
        QUESTIONS_PER_CATEGORY,
      `Simulation ${simulation} is not balanced in ${category}.`,
    );
  }

  for (const question of test) {
    reached.add(question.stableId);
    const shuffledOptions = shuffled(question.options);
    assert(
      shuffledOptions.some((option) => option.id === question.correctAnswer),
      `${question.stableId} lost its correct option during shuffling.`,
    );
  }
  signatures.add(test.map((question) => question.stableId).join(","));
}

assert(reached.size === 50, `Only ${reached.size} of 50 questions were reachable.`);
assert(signatures.size > 1, "The randomizer produced only one test selection.");

console.log(
  `Verified 1,000 balanced tests, ${reached.size} reachable questions, and ${signatures.size} distinct ordered selections.`,
);
