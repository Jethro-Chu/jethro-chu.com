import { NextResponse } from "next/server";
import {
  IsabelApiError,
  IsabelNotConfiguredError,
  getCareGuidance,
  getNextSuggestedQuestions,
  getPossibleConditions,
  getTrustedSources,
  searchSymptoms,
  submitInitialSymptoms,
  type AkinatorApiResponse,
  type IsabelAssessmentPayload,
  type IsabelResults,
  type ResultCondition,
  type SessionState,
  type StructuredSymptom,
} from "@/lib/isabelApi";
import { parseSymptoms } from "@/lib/symptomParser";
import {
  MAX_QUESTIONS,
  MIN_QUESTIONS,
  answerToSymptom,
  mergeSymptom,
  selectNextQuestion,
  shouldFinish,
} from "@/lib/questionEngine";
import { MEDICAL_AKINATOR_ENABLED } from "@/lib/featureFlags";

/**
 * Symptom-checker orchestrator. The ONLY medical reasoning comes from Isabel
 * (see lib/isabelApi.ts). Gemini is used solely to parse free text into
 * symptoms (see lib/symptomParser.ts). The question engine is pure logic over
 * Isabel-provided data. No local condition data, no hardcoded ranking.
 *
 * The server is stateless: the client echoes the whole SessionState each turn.
 * If Isabel is unconfigured or fails, we return a clean { status: "unavailable" }
 * and the UI offers a retry — we NEVER fabricate conditions.
 *
 * All Isabel + Gemini keys are read server-side here; nothing leaks to the client.
 */

export const runtime = "nodejs";

const ATTRIBUTION = "Results from the Isabel Symptom Checker";

const UNAVAILABLE: AkinatorApiResponse = {
  status: "unavailable",
  message: "The symptom checker is temporarily unavailable. Please try again in a moment.",
};

interface StartBody {
  phase: "start";
  complaint: string;
  patient?: SessionState["patient"];
}
interface AnswerBody {
  phase: "answer";
  state: SessionState;
  question: { id: string; symptomId?: string; symptomTerm?: string; text: string };
  answer: "yes" | "no" | "unknown" | "probably" | "probably_not";
}
type RequestBody = StartBody | AnswerBody;

export async function POST(request: Request) {
  if (!MEDICAL_AKINATOR_ENABLED) {
    return NextResponse.json<AkinatorApiResponse>(
      { status: "disabled", message: "This feature is currently turned off." },
      { status: 200 },
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }

  try {
    const state =
      body.phase === "start" ? await beginSession(body) : await applyAnswer(body);

    // Emergency red flags short-circuit the whole flow (start only).
    if ("__emergency" in state && state.__emergency) {
      return NextResponse.json<AkinatorApiResponse>({ status: "emergency", message: EMERGENCY_MESSAGE });
    }

    // --- ask Isabel for the next questions + current differential ---
    const payload: IsabelAssessmentPayload = {
      patient: state.patient,
      symptoms: state.symptoms,
      assessmentId: state.assessmentId,
    };
    const [suggested, conditions] = await Promise.all([
      getNextSuggestedQuestions(payload),
      getPossibleConditions(payload),
    ]);

    const next = selectNextQuestion(suggested, state.asked, state.symptoms);
    const progress = { asked: state.asked.length, min: MIN_QUESTIONS, max: MAX_QUESTIONS };

    const finish = shouldFinish({
      askedCount: state.asked.length,
      hasNextQuestion: !!next,
      conditions,
      topConfidence: conditions[0]?.confidence,
    });

    if (finish || !next) {
      if (conditions.length === 0) {
        // Isabel gave us nothing usable — do NOT invent results.
        return NextResponse.json<AkinatorApiResponse>(UNAVAILABLE, { status: 503 });
      }
      const results = await buildResults(conditions);
      return NextResponse.json<AkinatorApiResponse>({ status: "results", results, state, progress });
    }

    return NextResponse.json<AkinatorApiResponse>({ status: "question", question: next, state, progress });
  } catch (err) {
    // Isabel not wired up yet, or a real upstream failure → clean unavailable.
    if (err instanceof IsabelNotConfiguredError || err instanceof IsabelApiError) {
      console.error("[isabel]", err.name, err.message);
    } else {
      console.error("[isabel] unexpected error:", err);
    }
    return NextResponse.json<AkinatorApiResponse>(UNAVAILABLE, { status: 503 });
  }
}

/* ------------------------------------------------------------------ */
/*  phase handlers                                                    */
/* ------------------------------------------------------------------ */

type WorkingState = SessionState & { __emergency?: boolean };

async function beginSession(body: StartBody): Promise<WorkingState> {
  const complaint = String(body.complaint ?? "").slice(0, 600).trim();

  if (isEmergency(complaint)) {
    return { patient: {}, complaint, symptoms: [], asked: [], __emergency: true };
  }

  // 1) LLM/NLP: messy free text -> structured symptom terms (no diagnosis here)
  const parsed = await parseSymptoms(complaint);

  // 2) Isabel: resolve each term to a real Isabel symptom (best-effort).
  const symptoms = await resolveSymptoms(parsed);

  // 3) Isabel: seed the assessment (may return a session/assessment id).
  const patient = sanitizePatient(body.patient);
  const { assessmentId } = await submitInitialSymptoms({ patient, symptoms });

  return { patient, complaint, assessmentId, symptoms, asked: [] };
}

async function applyAnswer(body: AnswerBody): Promise<WorkingState> {
  const prev = sanitizeState(body.state);
  const question = body.question;
  const answer = body.answer;

  // record the answer (so we never re-ask) and update the symptom set
  const asked = [...prev.asked, { ...question, answer }].slice(0, MAX_QUESTIONS + 2);
  const symptoms = mergeSymptom(prev.symptoms, answerToSymptom(question, answer));

  return { ...prev, asked, symptoms };
}

/* ------------------------------------------------------------------ */
/*  Isabel helpers                                                    */
/* ------------------------------------------------------------------ */

/** resolve free-text terms to Isabel symptom ids; keep the term if unmatched */
async function resolveSymptoms(parsed: StructuredSymptom[]): Promise<StructuredSymptom[]> {
  const resolved = await Promise.all(
    parsed.map(async (s) => {
      try {
        const matches = await searchSymptoms(s.term);
        const top = matches[0];
        return top ? { ...s, id: top.symptomId ?? top.id, term: top.symptomTerm ?? s.term } : s;
      } catch (err) {
        // a search miss must not crash the flow; the unresolved term still goes to Isabel
        if (err instanceof IsabelNotConfiguredError) throw err; // not configured → bubble to unavailable
        return s;
      }
    }),
  );
  return resolved;
}

/** build the final results screen purely from Isabel data (top 3 + guidance + sources) */
async function buildResults(conditions: Awaited<ReturnType<typeof getPossibleConditions>>): Promise<IsabelResults> {
  const top = conditions.slice(0, 3);

  const enriched: ResultCondition[] = await Promise.all(
    top.map(async (c) => {
      // care guidance + sources are best-effort; never let them break the results
      const [care, sources] = await Promise.all([
        getCareGuidance(c.id).catch(() => undefined),
        getTrustedSources(c.id).catch(() => []),
      ]);
      return {
        name: c.name,
        confidence: c.confidence,
        careLevel: c.careLevel ?? care?.careLevel,
        summary: c.summary ?? care?.advice,
        sources: sources && sources.length ? sources : undefined,
      };
    }),
  );

  return {
    conditions: enriched,
    careGuidance: { careLevel: top[0]?.careLevel },
    attribution: ATTRIBUTION,
  };
}

/* ------------------------------------------------------------------ */
/*  validation + safety                                              */
/* ------------------------------------------------------------------ */

function sanitizePatient(p: SessionState["patient"] | undefined): SessionState["patient"] {
  if (!p || typeof p !== "object") return {};
  const age = typeof p.age === "number" && p.age >= 0 && p.age < 130 ? Math.floor(p.age) : undefined;
  const sex = ["male", "female", "other", "unknown"].includes(p.sex as string) ? p.sex : undefined;
  return { age, sex };
}

function sanitizeState(state: SessionState | undefined): SessionState {
  if (!state || typeof state !== "object") {
    return { patient: {}, complaint: "", symptoms: [], asked: [] };
  }
  return {
    patient: sanitizePatient(state.patient),
    complaint: String(state.complaint ?? "").slice(0, 600),
    assessmentId: state.assessmentId ? String(state.assessmentId).slice(0, 200) : undefined,
    symptoms: Array.isArray(state.symptoms) ? state.symptoms.slice(0, 40) : [],
    asked: Array.isArray(state.asked) ? state.asked.slice(0, MAX_QUESTIONS + 2) : [],
  };
}

const EMERGENCY_MESSAGE =
  "Some of what you described can be a medical emergency. This tool can't help with that. If you might be having an emergency, call your local emergency number (911 in the US) or get medical care now.";

/**
 * Minimal, conservative red-flag screen for the initial complaint. This is a
 * safety guard for an obviously urgent situation — NOT diagnosis. Keyed on
 * clear emergency language only.
 */
function isEmergency(text: string): boolean {
  const n = ` ${text.toLowerCase().replace(/['’]/g, "'")} `;
  return (
    /\b(911|999|112|call an ambulance|suicid|kill myself|overdos|can'?t breathe|cannot breathe|not breathing|unconscious|unresponsive|stroke|anaphyla|severe bleeding|bleeding (a lot|heavily)|coughing up blood)\b/.test(
      n,
    ) ||
    // classic ACS / cardiac emergency phrasing
    /\b(crushing|severe) chest pain\b/.test(n) ||
    /\bchest pain\b[^.?!]{0,30}\b(breath|breathe|arm|jaw|sweat)\b/.test(n)
  );
}
