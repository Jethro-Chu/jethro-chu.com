import { createHash, randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";
import type { StoredSession } from "./types.ts";

export const OWNER_COOKIE = "medmath_owner";
export function ownerHash(token: string) { return createHash("sha256").update(token).digest("hex"); }
export function ownerToken(request: NextRequest) {
  const token = request.cookies.get(OWNER_COOKIE)?.value;
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}
export function newOwnerToken() { return randomBytes(32).toString("hex"); }
export function ownsSession(session: StoredSession, token: string | null | undefined) {
  return Boolean(token && session.ownerHash && session.ownerHash === ownerHash(token));
}
export function publicSession(session: StoredSession) {
  const { ownerHash: _private, ...data } = session;
  return data;
}
export function validSessionPayload(value: unknown): value is StoredSession {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const s = value as StoredSession;
  if (typeof s.sessionId !== "string" || !/^[a-zA-Z0-9_-]{8,100}$/.test(s.sessionId)) return false;
  if (!Array.isArray(s.selectedCategories) || s.selectedCategories.length > 30 || !s.selectedCategories.every(c => typeof c === "string" && c.length < 80)) return false;
  if (!["practice", "exam", "study-exam", "adaptive"].includes(s.sessionType)) return false;
  if (typeof s.visitorId !== "string" || s.visitorId.length > 100 || typeof s.selectedDifficulty !== "string" || s.selectedDifficulty.length > 50) return false;
  if (typeof s.startedAt !== "string" || !Number.isFinite(Date.parse(s.startedAt))) return false;
  for (const field of ["plannedQuestionCount", "completedQuestionCount", "totalAttempts", "firstAttemptCorrectCount", "eventualCorrectCount", "totalHintsUsed", "totalSolutionsRevealed", "averageResponseTimeSeconds"] as const) {
    if (typeof s[field] !== "number" || !Number.isFinite(s[field]) || s[field] < 0 || s[field] > 10000) return false;
  }
  for (const field of ["categoryBreakdown", "difficultyBreakdown"] as const) {
    const map = s[field];
    if (!map || typeof map !== "object" || Array.isArray(map) || Object.keys(map).length > 50) return false;
    for (const stats of Object.values(map)) {
      if (!stats || typeof stats !== "object" || Object.values(stats).some(n => typeof n !== "number" || !Number.isFinite(n) || n < 0 || n > 10000)) return false;
    }
  }
  return s.examReview === undefined || (Array.isArray(s.examReview) && s.examReview.length <= 50);
}
