/* ============================================================
   SYMPTOM PARSER  ·  messy free text -> structured symptoms
   ============================================================
   Language task ONLY. An LLM (Gemini) is used here purely to turn a
   patient's free-text complaint ("my throat hurts and I feel hot")
   into a clean list of discrete symptom phrases. It NEVER diagnoses,
   ranks, or invents conditions — all medical logic lives in Isabel.

   If Gemini isn't configured/available, we fall back to a naive,
   purely lexical split (no medical knowledge) and hand those raw
   phrases to Isabel to interpret. This is NOT a medical fallback —
   it's just text handling so the user's words still reach Isabel.

   Server-only (reads GEMINI_API_KEY at call time).
   ============================================================ */

import type { StructuredSymptom } from "./isabelApi";

const MODEL = "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const PARSE_PROMPT = `You convert a patient's free-text complaint into a JSON list of discrete symptom phrases for a symptom checker. Extract ONLY symptoms, signs, or sensations the user actually mentions. For each, set "present" to true if they report having it, or false if they explicitly deny it. Use short, lowercase, clinical-but-plain terms (e.g. "sore throat", "fever", "nausea", "shortness of breath"). Do NOT diagnose, do NOT infer conditions, and do NOT add anything the user did not mention. Return JSON only.`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    symptoms: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          term: { type: "STRING" },
          present: { type: "BOOLEAN" },
        },
        required: ["term", "present"],
      },
    },
  },
  required: ["symptoms"],
};

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

/**
 * Parse a free-text complaint into structured symptoms. Always resolves
 * (never throws): on any LLM error it degrades to the lexical fallback so
 * the user's words still reach Isabel.
 */
export async function parseSymptoms(text: string): Promise<StructuredSymptom[]> {
  const clean = text.trim().slice(0, 600);
  if (!clean) return [];

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return naiveParse(clean);

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: PARSE_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: clean }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 400,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.error(`[symptom-parser] Gemini ${res.status}`);
      return naiveParse(clean);
    }

    const data = (await res.json()) as GeminiResponse;
    const body = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
    const parsed = JSON.parse(body) as { symptoms?: { term?: unknown; present?: unknown }[] };

    const symptoms = (parsed.symptoms ?? [])
      .map((s) => ({
        term: String(s?.term ?? "").toLowerCase().trim().slice(0, 80),
        present: s?.present !== false, // default to present unless explicitly denied
        raw: clean,
      }))
      .filter((s) => s.term);

    return symptoms.length ? dedupe(symptoms) : naiveParse(clean);
  } catch (err) {
    console.error("[symptom-parser] parse failed, using lexical fallback:", (err as Error).message);
    return naiveParse(clean);
  }
}

/**
 * Lexical fallback — split the complaint on simple connectors and strip a few
 * leading first-person fillers. Purely mechanical text handling; contains no
 * medical knowledge and never decides what anything "means" (Isabel does that).
 */
function naiveParse(text: string): StructuredSymptom[] {
  return dedupe(
    text
      .toLowerCase()
      .split(/\b(?:and|with|plus|also|as well as)\b|[,;.&/]+/g)
      .map((part) =>
        part
          .replace(/^\s*(i(?:'ve| have| am| feel| felt| keep)?|my|me|been|having|got|a|an|the)\b\s*/g, "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 80)
      )
      .filter((term) => term.length > 1)
      .map((term) => ({ term, present: true, raw: text }))
  );
}

function dedupe(symptoms: StructuredSymptom[]): StructuredSymptom[] {
  const seen = new Set<string>();
  const out: StructuredSymptom[] = [];
  for (const s of symptoms) {
    if (seen.has(s.term)) continue;
    seen.add(s.term);
    out.push(s);
  }
  return out.slice(0, 12);
}
