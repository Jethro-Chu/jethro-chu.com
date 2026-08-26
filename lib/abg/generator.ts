import { randomInt, randomUUID } from "node:crypto";
import { interpretABG } from "./engine.ts";
import type {
  ABGCategory,
  ABGCompensation,
  ABGDifficulty,
  ABGDisorder,
  ABGQuestion,
} from "./types.ts";

type Template = {
  disorder: ABGDisorder;
  compensation: ABGCompensation;
  difficulty: ABGDifficulty;
  difficultyRating: number;
  category: ABGCategory;
  ph: [number, number];
  paco2: [number, number];
  hco3: [number, number];
};

const TEMPLATES: Template[] = [
  { disorder: "Normal", compensation: "Mixed / Not Applicable", difficulty: "beginner", difficultyRating: 900, category: "normal", ph: [7.35, 7.45], paco2: [35, 45], hco3: [22, 26] },
  { disorder: "Respiratory Acidosis", compensation: "Uncompensated", difficulty: "beginner", difficultyRating: 950, category: "respiratory", ph: [7.20, 7.34], paco2: [46, 65], hco3: [22, 26] },
  { disorder: "Respiratory Alkalosis", compensation: "Uncompensated", difficulty: "beginner", difficultyRating: 950, category: "respiratory", ph: [7.46, 7.60], paco2: [22, 34], hco3: [22, 26] },
  { disorder: "Metabolic Acidosis", compensation: "Uncompensated", difficulty: "beginner", difficultyRating: 950, category: "metabolic", ph: [7.20, 7.34], paco2: [35, 45], hco3: [12, 21] },
  { disorder: "Metabolic Alkalosis", compensation: "Uncompensated", difficulty: "beginner", difficultyRating: 950, category: "metabolic", ph: [7.46, 7.60], paco2: [35, 45], hco3: [27, 38] },
  { disorder: "Respiratory Acidosis", compensation: "Partially Compensated", difficulty: "intermediate", difficultyRating: 1050, category: "respiratory", ph: [7.24, 7.34], paco2: [48, 65], hco3: [27, 34] },
  { disorder: "Respiratory Alkalosis", compensation: "Partially Compensated", difficulty: "intermediate", difficultyRating: 1050, category: "respiratory", ph: [7.46, 7.56], paco2: [24, 34], hco3: [16, 21] },
  { disorder: "Metabolic Acidosis", compensation: "Partially Compensated", difficulty: "intermediate", difficultyRating: 1050, category: "metabolic", ph: [7.24, 7.34], paco2: [24, 34], hco3: [12, 21] },
  { disorder: "Metabolic Alkalosis", compensation: "Partially Compensated", difficulty: "intermediate", difficultyRating: 1050, category: "metabolic", ph: [7.46, 7.56], paco2: [46, 58], hco3: [27, 38] },
  { disorder: "Respiratory Acidosis", compensation: "Fully Compensated", difficulty: "intermediate", difficultyRating: 1150, category: "respiratory", ph: [7.35, 7.39], paco2: [48, 65], hco3: [27, 36] },
  { disorder: "Respiratory Alkalosis", compensation: "Fully Compensated", difficulty: "intermediate", difficultyRating: 1150, category: "respiratory", ph: [7.41, 7.45], paco2: [24, 34], hco3: [16, 21] },
  { disorder: "Metabolic Acidosis", compensation: "Fully Compensated", difficulty: "intermediate", difficultyRating: 1150, category: "metabolic", ph: [7.35, 7.39], paco2: [24, 34], hco3: [12, 21] },
  { disorder: "Metabolic Alkalosis", compensation: "Fully Compensated", difficulty: "intermediate", difficultyRating: 1150, category: "metabolic", ph: [7.41, 7.45], paco2: [46, 58], hco3: [27, 38] },
];

function integerBetween([min, max]: [number, number]): number {
  return randomInt(Math.ceil(min), Math.floor(max) + 1);
}

function phBetween([min, max]: [number, number]): number {
  return randomInt(Math.round(min * 100), Math.round(max * 100) + 1) / 100;
}

export type GenerateOptions = {
  difficulty?: "beginner" | "intermediate" | "all";
  category?: "respiratory" | "metabolic" | "compensation" | "all";
};

export function generateABGQuestion(options: GenerateOptions = {}): ABGQuestion {
  const eligible = TEMPLATES.filter((template) => {
    if (options.difficulty && options.difficulty !== "all" && template.difficulty !== options.difficulty) return false;
    if (options.category === "respiratory" && !template.disorder.startsWith("Respiratory")) return false;
    if (options.category === "metabolic" && !template.disorder.startsWith("Metabolic")) return false;
    if (options.category === "compensation" && !["Partially Compensated", "Fully Compensated"].includes(template.compensation)) return false;
    return true;
  });

  if (eligible.length === 0) throw new Error("No ABG templates match the requested filters");
  const template = eligible[randomInt(eligible.length)];
  const question: ABGQuestion = {
    id: randomUUID(),
    disorder: template.disorder,
    compensation: template.compensation,
    difficulty: template.difficulty,
    difficultyRating: template.difficultyRating,
    category: template.category,
    ph: phBetween(template.ph),
    paco2: integerBetween(template.paco2),
    hco3: integerBetween(template.hco3),
  };

  const interpreted = interpretABG(question);
  if (interpreted.disorder !== question.disorder || interpreted.compensation !== question.compensation) {
    throw new Error(`Generated an invalid ABG: expected ${question.compensation} ${question.disorder}, received ${interpreted.label}`);
  }
  return question;
}

export function generateABGSet(count: number, options: GenerateOptions = {}): ABGQuestion[] {
  const questions: ABGQuestion[] = [];
  const signatures = new Set<string>();
  while (questions.length < count) {
    const question = generateABGQuestion(options);
    const signature = `${question.ph}:${question.paco2}:${question.hco3}`;
    if (!signatures.has(signature)) {
      signatures.add(signature);
      questions.push(question);
    }
  }
  return questions;
}

export function validateGeneratedQuestion(question: ABGQuestion): boolean {
  const interpreted = interpretABG(question);
  return interpreted.disorder === question.disorder && interpreted.compensation === question.compensation;
}
