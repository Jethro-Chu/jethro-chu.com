import { buildPublicMedMathData, type DataFilterOptions } from "./public-data.ts";
import { STORED_MEDMATH_QUESTIONS } from "./question-bank.generated.ts";
import type { PublicMedMathData, StoredAttemptRecord, StoredSession } from "./types.ts";

const KV_URL =
  process.env.KV_REST_API_URL ??
  process.env.UPSTASH_REDIS_REST_URL ??
  "";
const KV_TOKEN =
  process.env.KV_REST_API_TOKEN ??
  process.env.UPSTASH_REDIS_REST_TOKEN ??
  "";

const SESSIONS_KEY = "{medmath}:v1:sessions";
const ATTEMPTS_KEY = "{medmath}:v1:attempts";

// Process-wide fallbacks when Upstash Redis is not connected. Next.js can
// evaluate route and page bundles as separate module instances, so module-local
// maps would make a session visible to an API route but invisible to results.
const medMathGlobal = globalThis as typeof globalThis & {
  __medMathSessions?: Map<string, StoredSession>;
  __medMathAttempts?: Map<string, StoredAttemptRecord>;
};
const memSessions =
  medMathGlobal.__medMathSessions ?? new Map<string, StoredSession>();
const memAttempts =
  medMathGlobal.__medMathAttempts ?? new Map<string, StoredAttemptRecord>();
medMathGlobal.__medMathSessions = memSessions;
medMathGlobal.__medMathAttempts = memAttempts;
const storedQuestionMap = new Map(
  STORED_MEDMATH_QUESTIONS.map((question) => [question.id, question]),
);

function normalizeStoredSession(session: StoredSession): StoredSession {
  if (!Array.isArray(session.examReview) || session.examReview.length === 0) {
    return session;
  }

  const hasBrokenReview = session.examReview.some((item) => {
    const storedQuestion = storedQuestionMap.get(item.templateId);
    return (
      !storedQuestion ||
      !Number.isFinite(item.correctAnswer) ||
      item.correctAnswer !== storedQuestion.correctAnswer ||
      item.answerUnit !== storedQuestion.answerUnit ||
      item.answerPrecision !== storedQuestion.answerPrecision ||
      !Array.isArray(item.solutionSteps) ||
      item.solutionSteps.length === 0
    );
  });

  if (!hasBrokenReview) return session;

  return {
    ...session,
    examReview: [],
    isInvalidated: true,
    invalidationReason:
      "This result was created while the grading service could not resolve its stored question answers. Retake the exam for a verified score.",
  };
}

function removeInvalidSessionsFromAnalytics(
  attempts: StoredAttemptRecord[],
  sessions: StoredSession[],
): { attempts: StoredAttemptRecord[]; sessions: StoredSession[] } {
  const normalizedSessions = sessions.map(normalizeStoredSession);
  const invalidSessionIds = new Set(
    normalizedSessions
      .filter((session) => session.isInvalidated)
      .map((session) => session.sessionId),
  );

  return {
    sessions: normalizedSessions.filter((session) => !session.isInvalidated),
    attempts: attempts.filter(
      (attempt) => !invalidSessionIds.has(attempt.sessionId),
    ),
  };
}

export function hasMedMathStore(): boolean {
  return Boolean(KV_URL && KV_TOKEN);
}

async function redis(command: Array<string | number>): Promise<unknown> {
  if (!hasMedMathStore()) throw new Error("MedMath store is not configured");

  const response = await fetch(KV_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
    signal: AbortSignal.timeout(6000),
  });

  if (!response.ok) throw new Error(`MedMath store returned ${response.status}`);
  const payload = (await response.json()) as {
    result?: unknown;
    error?: string;
  };
  if (payload.error) throw new Error(payload.error);
  return payload.result;
}

function stringHashFromResult(result: unknown): Record<string, string> {
  if (!result) return {};
  if (!Array.isArray(result) && typeof result === "object") {
    return Object.fromEntries(
      Object.entries(result).map(([key, value]) => [key, String(value)]),
    );
  }
  if (!Array.isArray(result)) return {};

  const parsed: Record<string, string> = {};
  for (let index = 0; index < result.length; index += 2) {
    parsed[String(result[index])] = String(result[index + 1]);
  }
  return parsed;
}

export async function saveSession(session: StoredSession): Promise<void> {
  if (!hasMedMathStore()) {
    memSessions.set(session.sessionId, session);
    return;
  }
  try {
    await redis(["HSET", SESSIONS_KEY, session.sessionId, JSON.stringify(session)]);
  } catch (error) {
    console.error("[medmath-store] saveSession failed:", error);
    memSessions.set(session.sessionId, session);
  }
}

export async function getSession(sessionId: string): Promise<StoredSession | null> {
  if (!hasMedMathStore()) {
    const session = memSessions.get(sessionId);
    return session ? normalizeStoredSession(session) : null;
  }
  try {
    const result = await redis(["HGET", SESSIONS_KEY, sessionId]);
    if (!result) {
      const session = memSessions.get(sessionId);
      return session ? normalizeStoredSession(session) : null;
    }
    return normalizeStoredSession(JSON.parse(String(result)) as StoredSession);
  } catch (error) {
    console.error("[medmath-store] getSession failed:", error);
    const session = memSessions.get(sessionId);
    return session ? normalizeStoredSession(session) : null;
  }
}

export async function recordAttempt(attempt: StoredAttemptRecord): Promise<void> {
  if (!hasMedMathStore()) {
    memAttempts.set(attempt.attemptId, attempt);
    return;
  }
  try {
    await redis(["HSET", ATTEMPTS_KEY, attempt.attemptId, JSON.stringify(attempt)]);
  } catch (error) {
    console.error("[medmath-store] recordAttempt failed:", error);
    memAttempts.set(attempt.attemptId, attempt);
  }
}

let publicDataCache: { expiresAt: number; data: PublicMedMathData; filterKey: string } | null = null;

export async function getPublicMedMathData(
  filters: DataFilterOptions = {},
): Promise<PublicMedMathData> {
  const filterKey = JSON.stringify(filters);
  if (publicDataCache && publicDataCache.filterKey === filterKey && publicDataCache.expiresAt > Date.now()) {
    return publicDataCache.data;
  }

  let attempts: StoredAttemptRecord[] = [];
  let sessions: StoredSession[] = [];

  if (!hasMedMathStore()) {
    attempts = Array.from(memAttempts.values());
    sessions = Array.from(memSessions.values());
  } else {
    try {
      const [attemptsHash, sessionsHash] = await Promise.all([
        redis(["HGETALL", ATTEMPTS_KEY]),
        redis(["HGETALL", SESSIONS_KEY]),
      ]);

      const storedAttempts = stringHashFromResult(attemptsHash);
      for (const val of Object.values(storedAttempts)) {
        try {
          attempts.push(JSON.parse(val) as StoredAttemptRecord);
        } catch {
          // Ignore corrupt row
        }
      }

      const storedSessions = stringHashFromResult(sessionsHash);
      for (const val of Object.values(storedSessions)) {
        try {
          sessions.push(JSON.parse(val) as StoredSession);
        } catch {
          // Ignore corrupt row
        }
      }
    } catch (error) {
      console.error("[medmath-store] getPublicMedMathData failed, falling back to memory:", error);
      attempts = Array.from(memAttempts.values());
      sessions = Array.from(memSessions.values());
    }
  }

  const verifiedData = removeInvalidSessionsFromAnalytics(attempts, sessions);
  const computed = buildPublicMedMathData(
    verifiedData.attempts,
    verifiedData.sessions,
    filters,
  );

  publicDataCache = {
    filterKey,
    expiresAt: Date.now() + 30_000, // 30s cache
    data: computed,
  };

  return computed;
}
