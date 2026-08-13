import type { IQQuestion, QuestionCategory, StableQuestionId } from "./questions";

export const RANDOMIZED_TEST_VERSION = 2;
export const QUESTIONS_PER_CATEGORY = 5;
export const TEST_QUESTION_COUNT = 25;

export const QUESTION_CATEGORIES: readonly QuestionCategory[] = [
  "probability",
  "quantitative",
  "logic",
  "patterns",
  "spatial",
];

export function shuffled<T>(items: readonly T[], randomSource = Math.random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomValue = Math.max(
      0,
      Math.min(1 - Number.EPSILON, randomSource()),
    );
    const swapIndex = Math.floor(randomValue * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function takeRandom<T>(
  pool: readonly T[],
  count: number,
  randomSource: () => number,
) {
  return shuffled(pool, randomSource).slice(0, count);
}

function selectCategoryQuestions(
  questions: readonly IQQuestion[],
  randomSource: () => number,
) {
  const ceiling = questions.filter((question) => question.difficulty === 5);
  const veryHard = questions.filter((question) => question.difficulty === 4);
  const foundation = questions.filter((question) => question.difficulty <= 3);
  const selected = [
    ...takeRandom(ceiling, 1, randomSource),
    ...takeRandom(veryHard, 2, randomSource),
    ...takeRandom(foundation, 2, randomSource),
  ];

  if (selected.length < QUESTIONS_PER_CATEGORY) {
    const selectedIds = new Set(selected.map((question) => question.stableId));
    selected.push(
      ...takeRandom(
        questions.filter((question) => !selectedIds.has(question.stableId)),
        QUESTIONS_PER_CATEGORY - selected.length,
        randomSource,
      ),
    );
  }

  if (selected.length !== QUESTIONS_PER_CATEGORY) {
    throw new Error("The IQ question bank cannot produce a balanced test.");
  }
  return selected;
}

export function generateBalancedTest(
  questionBank: readonly IQQuestion[],
  randomSource: () => number = Math.random,
) {
  const selected = QUESTION_CATEGORIES.flatMap((category) =>
    selectCategoryQuestions(
      questionBank.filter((question) => question.category === category),
      randomSource,
    ),
  );

  return shuffled(selected, randomSource);
}

export function resolveRandomizedTest(
  questionBank: readonly IQQuestion[],
  selectedQuestionIds: readonly StableQuestionId[],
) {
  if (
    selectedQuestionIds.length !== TEST_QUESTION_COUNT ||
    new Set(selectedQuestionIds).size !== TEST_QUESTION_COUNT
  ) {
    return null;
  }

  const byStableId = new Map(
    questionBank.map((question) => [question.stableId, question]),
  );
  const questions = selectedQuestionIds.map((id) => byStableId.get(id));
  if (questions.some((question) => !question)) return null;

  const resolved = questions as IQQuestion[];
  const categoryCounts = Object.fromEntries(
    QUESTION_CATEGORIES.map((category) => [
      category,
      resolved.filter((question) => question.category === category).length,
    ]),
  ) as Record<QuestionCategory, number>;

  return QUESTION_CATEGORIES.every(
    (category) => categoryCounts[category] === QUESTIONS_PER_CATEGORY,
  )
    ? resolved
    : null;
}
