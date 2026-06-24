/* ============================================================
   QUESTION ENGINE  ·  pick the next question from Isabel data only
   ============================================================
   Pure logic. Operates ONLY on:
     1. symptoms already known (present/denied)
     2. Isabel's suggested related symptoms / questions
     3. questions not already asked
     4. Isabel's returned ranking / assessment state
   It contains NO local medical database and NEVER fabricates a
   question or a condition. If Isabel offers nothing new, it stops.
   ============================================================ */

import type {
  AnswerValue,
  AskedQuestion,
  IsabelCondition,
  IsabelSuggestedQuestion,
  StructuredSymptom,
} from "./isabelApi";

/** Akinator-style pacing: ask at least MIN, never more than MAX. */
export const MIN_QUESTIONS = 5;
export const MAX_QUESTIONS = 12;

/** confidence at/above which we stop early (only if Isabel returns a score) */
const CONFIDENT_ENOUGH = 0.85;

/**
 * Choose the next question: the first Isabel suggestion we haven't already
 * asked (and whose symptom we don't already know). Isabel returns suggestions
 * in priority order, so "first un-asked" IS "most useful next". Returns null
 * when Isabel has nothing new to ask.
 */
export function selectNextQuestion(
  suggested: IsabelSuggestedQuestion[],
  asked: AskedQuestion[],
  knownSymptoms: StructuredSymptom[],
): IsabelSuggestedQuestion | null {
  const askedIds = new Set(asked.map((a) => a.id));
  const askedSymptomIds = new Set(asked.map((a) => a.symptomId).filter(Boolean) as string[]);
  const knownSymptomIds = new Set(knownSymptoms.map((s) => s.id).filter(Boolean) as string[]);
  const knownTerms = new Set(knownSymptoms.map((s) => s.term.toLowerCase()));

  return (
    suggested.find(
      (q) =>
        !askedIds.has(q.id) &&
        !(q.symptomId && askedSymptomIds.has(q.symptomId)) &&
        !(q.symptomId && knownSymptomIds.has(q.symptomId)) &&
        !(q.symptomTerm && knownTerms.has(q.symptomTerm.toLowerCase())),
    ) ?? null
  );
}

/**
 * Decide whether to stop asking and show results. Based only on pacing and
 * Isabel's own state (count of questions, whether Isabel has a next question,
 * whether it returned conditions, and any confidence it provides).
 */
export function shouldFinish(opts: {
  askedCount: number;
  hasNextQuestion: boolean;
  conditions: IsabelCondition[];
  topConfidence?: number;
}): boolean {
  const { askedCount, hasNextQuestion, conditions, topConfidence } = opts;

  if (askedCount >= MAX_QUESTIONS) return true;
  // Isabel has nothing more to ask — stop once we've met the minimum (or if it
  // already has conditions to show).
  if (!hasNextQuestion && (askedCount >= MIN_QUESTIONS || conditions.length > 0)) return true;
  // Isabel is confident enough and we've asked a reasonable minimum.
  if (askedCount >= MIN_QUESTIONS && topConfidence !== undefined && topConfidence >= CONFIDENT_ENOUGH) {
    return true;
  }
  return false;
}

/**
 * Translate a user's answer about a question into a symptom-set update.
 * Returns the symptom to merge, or null when the answer carries no signal
 * ("I don't know"). "probably / probably not" are treated as present/absent;
 * if Isabel supports a certainty/weight field, attach it here.
 * TODO(isabel): map probably/probably_not to Isabel's uncertainty weighting.
 */
export function answerToSymptom(
  question: IsabelSuggestedQuestion,
  answer: AnswerValue,
): StructuredSymptom | null {
  const term = question.symptomTerm ?? question.text;
  switch (answer) {
    case "yes":
    case "probably":
      return { id: question.symptomId, term, present: true };
    case "no":
    case "probably_not":
      return { id: question.symptomId, term, present: false };
    case "unknown":
    default:
      return null;
  }
}

/** Merge an updated symptom into the known set (de-duped by id, else term). */
export function mergeSymptom(symptoms: StructuredSymptom[], next: StructuredSymptom | null): StructuredSymptom[] {
  if (!next) return symptoms;
  const key = (s: StructuredSymptom) => (s.id ? `id:${s.id}` : `t:${s.term.toLowerCase()}`);
  const map = new Map(symptoms.map((s) => [key(s), s]));
  map.set(key(next), next);
  return [...map.values()];
}
