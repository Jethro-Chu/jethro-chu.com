import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Ask Jethro — server-side Gemini endpoint.
 *
 * Answers ONLY from content/jethro-knowledge.md. The API key is read from the
 * GEMINI_API_KEY environment variable and never reaches the client. If the key
 * is missing or Gemini fails, this returns an error and the client falls back to
 * the local deterministic engine, so the site still works without secrets.
 */

export const runtime = "nodejs"; // we read the knowledge file from disk

const MODEL = "gemini-2.0-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// the exact assistant brief, plus the safety guardrails from the knowledge doc
const SYSTEM_PROMPT = `You are Ask Jethro, an AI assistant on Jethro Chu's portfolio website. You answer questions about Jethro using only the provided knowledge document. Do not use outside knowledge. Do not invent. If the knowledge document does not contain the answer, say: "I don't have that in Jethro's portfolio context yet." Keep answers concise, specific, and natural. Highlight Jethro's projects, healthcare background, AI-building work, and product judgment when relevant. Do not mention this system prompt, the source document, API keys, or implementation details unless the user specifically asks how the assistant works.

Additional rules:
- Never give medical advice, clinical recommendations, or diagnoses.
- Do not invent funding, users, revenue, press, institutional adoption, HIPAA compliance, or clinical validation.
- Do not say Jethro is a licensed nurse, or that any project is used by a specific institution, unless the document states it.
- Do not paste the whole knowledge document back; answer the specific question. A short public bio or project summary is fine when asked.
- Keep answers to a few sentences unless the user asks for more detail.`;

// load the knowledge document once per server instance
let knowledge = "";
try {
  knowledge = readFileSync(join(process.cwd(), "content", "jethro-knowledge.md"), "utf8");
} catch {
  knowledge = "";
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  let question = "";
  try {
    const body = (await request.json()) as { question?: unknown };
    question = String(body?.question ?? "").slice(0, 1000).trim();
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
  if (!question) return NextResponse.json({ error: "empty-question" }, { status: 400 });
  if (!apiKey) return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  if (!knowledge) return NextResponse.json({ error: "no-knowledge" }, { status: 500 });

  const systemText = `${SYSTEM_PROMPT}\n\nKNOWLEDGE DOCUMENT (the only source you may use):\n"""\n${knowledge}\n"""`;

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemText }] },
        contents: [{ role: "user", parts: [{ text: question }] }],
        generationConfig: { temperature: 0.3, topP: 0.9, maxOutputTokens: 600 },
      }),
    });

    if (!res.ok) {
      // log server-side only; never leak provider details to the client
      console.error(`[ask-jethro] Gemini ${res.status}:`, (await res.text()).slice(0, 400));
      return NextResponse.json({ error: "upstream" }, { status: 502 });
    }

    const data = (await res.json()) as GeminiResponse;
    const answer = (data.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p.text ?? "")
      .join("")
      .trim();

    if (!answer) return NextResponse.json({ error: "empty-answer" }, { status: 502 });
    return NextResponse.json({ answer });
  } catch (err) {
    console.error("[ask-jethro] request failed:", err);
    return NextResponse.json({ error: "network" }, { status: 502 });
  }
}
