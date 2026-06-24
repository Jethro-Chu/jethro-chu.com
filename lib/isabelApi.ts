/* ============================================================
   ISABEL SYMPTOM CHECKER  ·  server-side integration layer
   ============================================================
   The ONLY medical data source for the symptom-checker flow. Every
   function here talks to the Isabel Symptom Checker API. There is NO
   local medical knowledge, no hardcoded conditions, and no local
   ranking — if Isabel can't answer, the caller surfaces a clean
   "temporarily unavailable" state instead.

   IMPORTANT — endpoints are PLACEHOLDERS:
   The exact paths, query params, auth scheme, and response shapes below
   are intentionally NOT real. Replace every value marked `__REPLACE__`
   and every `// TODO(isabel)` mapping with the exact details from
   Isabel's official API documentation / sandbox. Until you do, each
   function throws IsabelNotConfiguredError and the UI shows the
   unavailable state (no network call is made to a guessed URL).

   This module reads ISABEL_API_KEY at call time and must only ever run
   on the server. Do not import it into a client component (import the
   TYPES with `import type` instead).
   ============================================================ */

/* ------------------------------------------------------------------ */
/*  domain types (shared with the route, engine, parser, and UI)      */
/* ------------------------------------------------------------------ */

export type Sex = "male" | "female" | "other" | "unknown";

/** one discrete symptom the patient reports (present) or denies (!present) */
export interface StructuredSymptom {
  /** Isabel's symptom id once resolved via searchSymptoms (optional until then) */
  id?: string;
  /** canonical symptom term */
  term: string;
  /** true = patient reports it, false = patient denies it */
  present: boolean;
  /** original free-text phrasing this came from, if any */
  raw?: string;
}

export interface PatientContext {
  age?: number;
  sex?: Sex;
  /** travel/region context for DDx, if Isabel supports it */
  region?: string;
}

/** everything we hand Isabel for an assessment */
export interface IsabelAssessmentPayload {
  patient: PatientContext;
  symptoms: StructuredSymptom[];
  /** an Isabel-issued assessment/session id, if their API is stateful */
  assessmentId?: string;
}

export interface IsabelSuggestedQuestion {
  /** stable id used to dedupe questions */
  id: string;
  /** the symptom this question probes, if Isabel ties it to one */
  symptomId?: string;
  symptomTerm?: string;
  /** patient-friendly yes/no question text */
  text: string;
}

export interface IsabelCondition {
  id: string;
  name: string;
  /** Isabel ranking position (1 = top), if provided */
  rank?: number;
  /** 0..1 likelihood/score, only if Isabel returns one */
  confidence?: number;
  /** Isabel triage / care-level wording, if provided */
  careLevel?: string;
  /** short patient-friendly explanation, if provided */
  summary?: string;
}

export interface IsabelConditionDetails {
  id: string;
  name: string;
  description?: string;
  careLevel?: string;
}

export interface IsabelCareGuidance {
  careLevel?: string;
  advice?: string;
}

export interface IsabelSource {
  title: string;
  url: string;
}

/* ------------------------------------------------------------------ */
/*  flow types (client <-> /api/isabel contract)                      */
/* ------------------------------------------------------------------ */

export type AnswerValue = "yes" | "no" | "unknown" | "probably" | "probably_not";

export interface AskedQuestion extends IsabelSuggestedQuestion {
  answer: AnswerValue;
}

/** the whole session, echoed between client and server each turn (stateless server) */
export interface SessionState {
  patient: PatientContext;
  /** the first-person complaint the user typed at the start */
  complaint: string;
  /** Isabel assessment id, if their API is stateful */
  assessmentId?: string;
  /** everything known so far (reported + denied) */
  symptoms: StructuredSymptom[];
  /** questions already asked + their answers (so we never repeat) */
  asked: AskedQuestion[];
}

export interface ResultCondition {
  name: string;
  confidence?: number;
  careLevel?: string;
  summary?: string;
  sources?: IsabelSource[];
}

export interface IsabelResults {
  /** short patient-friendly framing, if Isabel provides one */
  explanation?: string;
  /** top matches (the UI shows up to 3) */
  conditions: ResultCondition[];
  careGuidance?: IsabelCareGuidance;
  /** attribution string to display with Isabel data */
  attribution?: string;
}

export interface Progress {
  asked: number;
  min: number;
  max: number;
}

export type AkinatorApiResponse =
  | { status: "question"; question: IsabelSuggestedQuestion; state: SessionState; progress: Progress }
  | { status: "results"; results: IsabelResults; state: SessionState; progress: Progress }
  | { status: "emergency"; message: string }
  | { status: "unavailable"; message: string }
  | { status: "disabled"; message: string };

/* ------------------------------------------------------------------ */
/*  errors                                                            */
/* ------------------------------------------------------------------ */

/** thrown when Isabel env vars or endpoint paths are not yet configured */
export class IsabelNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IsabelNotConfiguredError";
  }
}

/** thrown when Isabel responds with a non-OK status or unusable body */
export class IsabelApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "IsabelApiError";
  }
}

/* ------------------------------------------------------------------ */
/*  config + low-level fetch                                          */
/* ------------------------------------------------------------------ */

const BASE_URL = process.env.ISABEL_API_BASE_URL ?? "";
const API_KEY = process.env.ISABEL_API_KEY ?? "";

/**
 * Placeholder endpoint paths. DO NOT treat these as real. Replace each
 * `__REPLACE__/...` with the exact path from Isabel's API docs/sandbox.
 * The `__REPLACE__` marker is what keeps the feature in "unavailable" mode
 * until you wire in the real endpoints (see assertConfigured()).
 */
const ENDPOINTS = {
  // TODO(isabel): symptom search / autocomplete, e.g. GET /symptoms?query=...
  symptomSearch: "__REPLACE__/symptom-search",
  // TODO(isabel): create an assessment from an initial symptom set.
  initialAssessment: "__REPLACE__/assessment",
  // TODO(isabel): related-symptom / next-question suggestions for an assessment.
  suggestedQuestions: "__REPLACE__/assessment/suggested-symptoms",
  // TODO(isabel): ranked differential / possible conditions for an assessment.
  possibleConditions: "__REPLACE__/assessment/conditions",
  // TODO(isabel): condition detail (use {id}).
  conditionDetails: "__REPLACE__/conditions/{id}",
  // TODO(isabel): triage / care guidance (use {id}).
  careGuidance: "__REPLACE__/conditions/{id}/care",
  // TODO(isabel): trusted source links (use {id}).
  trustedSources: "__REPLACE__/conditions/{id}/sources",
} as const;

const isPlaceholder = (path: string) => path.includes("__REPLACE__");

function assertConfigured(path: string): void {
  if (!BASE_URL || !API_KEY) {
    throw new IsabelNotConfiguredError("ISABEL_API_BASE_URL / ISABEL_API_KEY are not set.");
  }
  if (isPlaceholder(path)) {
    throw new IsabelNotConfiguredError(
      `Isabel endpoint "${path}" is still a placeholder — replace it with the real path from Isabel's API docs.`
    );
  }
}

interface IsabelFetchInit extends RequestInit {
  query?: Record<string, string | number | undefined>;
}

/** single choke point for Isabel HTTP calls — auth, base URL, error mapping */
async function isabelFetch<T>(path: string, init: IsabelFetchInit = {}): Promise<T> {
  assertConfigured(path);

  const base = BASE_URL.replace(/\/$/, "");
  const url = new URL(`${base}/${path.replace(/^\//, "")}`);
  if (init.query) {
    for (const [k, v] of Object.entries(init.query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // TODO(isabel): match Isabel's auth scheme EXACTLY (header name, Bearer
        // vs raw key, an `api-key`/`x-api-key` header, OAuth, etc.).
        Authorization: `Bearer ${API_KEY}`,
        ...(init.headers ?? {}),
      },
      // short, defensive timeout so a hung Isabel call becomes "unavailable"
      signal: init.signal ?? AbortSignal.timeout(12_000),
    });
  } catch (err) {
    throw new IsabelApiError(`Isabel request failed: ${(err as Error).message}`);
  }

  if (!res.ok) throw new IsabelApiError(`Isabel responded ${res.status}`, res.status);

  try {
    return (await res.json()) as T;
  } catch {
    throw new IsabelApiError("Isabel returned a non-JSON body");
  }
}

/* ------------------------------------------------------------------ */
/*  public API surface                                               */
/*  Each function: call Isabel, then map its body to OUR types.       */
/*  The map steps are TODO until you have the real response schema.   */
/* ------------------------------------------------------------------ */

/** Resolve a free-text term to Isabel symptom matches. */
export async function searchSymptoms(query: string): Promise<IsabelSuggestedQuestion[]> {
  const raw = await isabelFetch<unknown>(ENDPOINTS.symptomSearch, { method: "GET", query: { query } });
  // TODO(isabel): map Isabel's symptom-search payload to IsabelSuggestedQuestion[].
  return asArray(raw, (item) => ({
    id: pickString(item, "id", "symptomId", "code"),
    symptomId: pickString(item, "id", "symptomId", "code"),
    symptomTerm: pickString(item, "name", "term", "label"),
    text: pickString(item, "name", "term", "label"),
  })).filter((q) => q.id && q.text);
}

/** Create/seed an Isabel assessment from the initial symptom set. */
export async function submitInitialSymptoms(payload: IsabelAssessmentPayload): Promise<{ assessmentId?: string }> {
  const raw = await isabelFetch<unknown>(ENDPOINTS.initialAssessment, {
    method: "POST",
    body: JSON.stringify(toIsabelRequest(payload)),
  });
  // TODO(isabel): map Isabel's "create assessment" response (it may return a
  // session/assessment id used by later calls).
  return { assessmentId: pickString(raw, "assessmentId", "sessionId", "id") || undefined };
}

/** Ask Isabel for the most useful related symptoms / next questions. */
export async function getNextSuggestedQuestions(payload: IsabelAssessmentPayload): Promise<IsabelSuggestedQuestion[]> {
  const raw = await isabelFetch<unknown>(ENDPOINTS.suggestedQuestions, {
    method: "POST",
    body: JSON.stringify(toIsabelRequest(payload)),
  });
  // TODO(isabel): map Isabel's related-symptom/question payload. Isabel should
  // return these already in priority order; the question engine just dedupes.
  return asArray(raw, (item) => ({
    id: pickString(item, "id", "symptomId", "code"),
    symptomId: pickString(item, "id", "symptomId", "code"),
    symptomTerm: pickString(item, "name", "term", "label"),
    text: pickString(item, "question", "prompt", "name", "term") || `Do you have ${pickString(item, "name", "term")}?`,
  })).filter((q) => q.id && q.text);
}

/** Ask Isabel for the ranked differential / possible conditions. */
export async function getPossibleConditions(payload: IsabelAssessmentPayload): Promise<IsabelCondition[]> {
  const raw = await isabelFetch<unknown>(ENDPOINTS.possibleConditions, {
    method: "POST",
    body: JSON.stringify(toIsabelRequest(payload)),
  });
  // TODO(isabel): map Isabel's ranked-conditions payload. Keep Isabel's order;
  // do NOT re-rank locally.
  return asArray(raw, (item, i) => ({
    id: pickString(item, "id", "conditionId", "code"),
    name: pickString(item, "name", "title", "diagnosis"),
    rank: pickNumber(item, "rank") ?? i + 1,
    confidence: pickNumber(item, "confidence", "score", "probability"),
    careLevel: pickString(item, "careLevel", "triage", "urgency") || undefined,
    summary: pickString(item, "summary", "description", "explanation") || undefined,
  })).filter((c) => c.id && c.name);
}

/** Fetch detail for a single condition. */
export async function getConditionDetails(conditionId: string): Promise<IsabelConditionDetails> {
  const raw = await isabelFetch<unknown>(withId(ENDPOINTS.conditionDetails, conditionId), { method: "GET" });
  // TODO(isabel): map Isabel's condition-detail payload.
  return {
    id: conditionId,
    name: pickString(raw, "name", "title"),
    description: pickString(raw, "description", "summary") || undefined,
    careLevel: pickString(raw, "careLevel", "triage") || undefined,
  };
}

/** Fetch care guidance / triage advice for a condition. */
export async function getCareGuidance(conditionId: string): Promise<IsabelCareGuidance> {
  const raw = await isabelFetch<unknown>(withId(ENDPOINTS.careGuidance, conditionId), { method: "GET" });
  // TODO(isabel): map Isabel's care-guidance payload.
  return {
    careLevel: pickString(raw, "careLevel", "triage", "urgency") || undefined,
    advice: pickString(raw, "advice", "guidance", "recommendation") || undefined,
  };
}

/** Fetch trusted source links for a condition. */
export async function getTrustedSources(conditionId: string): Promise<IsabelSource[]> {
  const raw = await isabelFetch<unknown>(withId(ENDPOINTS.trustedSources, conditionId), { method: "GET" });
  // TODO(isabel): map Isabel's sources payload.
  return asArray(raw, (item) => ({
    title: pickString(item, "title", "name", "source"),
    url: pickString(item, "url", "href", "link"),
  })).filter((s) => s.title && s.url);
}

/* ------------------------------------------------------------------ */
/*  mapping helpers (defensive — adjust once you have Isabel's schema) */
/* ------------------------------------------------------------------ */

/** shape OUR payload into Isabel's expected request body. TODO(isabel): adjust. */
function toIsabelRequest(payload: IsabelAssessmentPayload): Record<string, unknown> {
  return {
    assessmentId: payload.assessmentId,
    patient: payload.patient,
    // most symptom checkers want present vs absent lists — adjust to Isabel's shape
    presentSymptoms: payload.symptoms.filter((s) => s.present).map((s) => s.id ?? s.term),
    absentSymptoms: payload.symptoms.filter((s) => !s.present).map((s) => s.id ?? s.term),
  };
}

function withId(template: string, id: string): string {
  return template.replace("{id}", encodeURIComponent(id));
}

/** Isabel may nest its list under a key (e.g. {results:[...]}); find the array. */
function asArray<T>(raw: unknown, map: (item: Record<string, unknown>, i: number) => T): T[] {
  let list: unknown = raw;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    list = obj.results ?? obj.data ?? obj.items ?? obj.conditions ?? obj.symptoms ?? [];
  }
  if (!Array.isArray(list)) return [];
  return list.map((item, i) => map((item ?? {}) as Record<string, unknown>, i));
}

function pickString(obj: unknown, ...keys: string[]): string {
  if (!obj || typeof obj !== "object") return "";
  const o = obj as Record<string, unknown>;
  for (const k of keys) if (typeof o[k] === "string" && o[k]) return o[k] as string;
  return "";
}

function pickNumber(obj: unknown, ...keys: string[]): number | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const o = obj as Record<string, unknown>;
  for (const k of keys) {
    const n = typeof o[k] === "number" ? (o[k] as number) : Number(o[k]);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}
