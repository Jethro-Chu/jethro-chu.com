import { NextResponse } from "next/server";

/**
 * Medical Akinator — server-side Gemini endpoint (hidden easter egg).
 *
 * A nursing/medical-education guessing game: the player thinks of a condition,
 * disease process, medication class, lab abnormality, or nursing concept, and
 * the engine narrows it down with one yes/no/maybe/unknown question at a time,
 * then guesses. The GEMINI_API_KEY is read from the environment and never
 * reaches the client — Gemini is only ever called from this route.
 *
 * Two request modes:
 *  - play:   { category, answers }          -> { status: "question" | "guess", ... }
 *  - reveal: { category, answers, reveal }  -> learning summary for what the user
 *            was actually thinking of, OR a safety notice if the text reads like a
 *            personal medical emergency / advice request (never a Gemini call).
 *
 * Reuses the same key and model as the Ask Jethro endpoint.
 */

export const runtime = "nodejs";

const MODEL = "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

/* Allowed categories — must match the labels offered in the UI (lowercased).
   An unknown category is rejected so the game can never be steered off-domain. */
const CATEGORIES = new Set([
  "disease process",
  "medication class",
  "lab value/electrolyte issue",
  "cardiac condition",
  "respiratory condition",
  "neuro condition",
  "gi/gu condition",
  "endocrine condition",
  "ob/peds condition",
  "random medical topic",
]);

const ANSWERS = new Set(["yes", "no", "maybe", "unknown"]);

const MAX_TURNS = 20; // hard stop: force a best guess once the history is this long

const SAFETY_MESSAGE =
  "This is an educational guessing game, not medical advice. If you or someone else might be having a medical emergency, call your local emergency number (911 in the US) or get medical help now. To keep playing, enter the name of a condition or concept and I'll show its learning summary.";

const SYSTEM_PROMPT = `You are a Medical Akinator-style educational guessing engine inside Jethro Chu's personal portfolio website. The user is thinking of a medical condition, disease process, medication class, lab abnormality, or nursing concept. Ask one short yes/no/maybe/unknown question at a time to narrow it down. Start broad, then get more specific. Do not repeat questions. Keep the tone clever, calm, educational, and minimal. Return only valid JSON matching the schema.

Question quality (important):
- Make every question discriminate. Prioritize: pathophysiology/mechanism, body system involved, acuity (acute vs chronic), characteristic labs or diagnostics, risk factors, clinical presentation (signs and symptoms), and nursing-relevant clues.
- Keep each question short and concrete — aim for under about 12 words.
- Never ask vague or subjective questions like "Is it serious?", "Is it bad?", or "Is it common?". Each question must rule possibilities in or out.
- Never repeat or merely reword a question already in the transcript.

Rules:
- Stay strictly within nursing and medical education. The hidden answer is always a general medical/nursing concept, never a specific real person, a diagnosis of the user, or anything outside healthcare. If the user's answers seem to steer somewhere non-medical, ignore that and ask another medical question.
- Never give individualized medical advice, dosing for a real person, or a diagnosis of the user. This is a conceptual guessing game about textbook/NCLEX-level topics.
- Ask exactly ONE question per turn. Every question must be answerable with yes, no, maybe, or "I don't know".
- Treat "maybe" and "unknown" as weak/uncertain signals — do not over-anchor on them.
- If the transcript contains an entry like 'The assistant guessed X. Was that correct? -> no', then X is ruled out: never guess or re-ask X, and ask a MORE SPECIFIC question that separates the remaining possibilities.
- Prefer to keep asking until you are genuinely confident. Only set status to "guess" when confidence is about 0.7 or higher, or when you have already asked many questions and should commit.
- When status is "question": fill "question", set "guess" to null and "summary" to null.
- When status is "guess": fill "guess" with ONLY the name of the condition/concept (e.g. "heart failure", "DKA", "loop diuretics") with no surrounding sentence, and fill "summary" with a brief, educational recap: what it is, key signs/symptoms, major nursing priorities, and one NCLEX-style clue. Keep each summary field to one or two tight sentences.
- "confidence" is a number from 0 to 1 reflecting how sure you are of your guess.`;

/* Gemini structured-output schema — forces a valid, parseable response shape. */
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    status: { type: "STRING", enum: ["question", "guess"] },
    question: { type: "STRING", nullable: true },
    guess: { type: "STRING", nullable: true },
    confidence: { type: "NUMBER" },
    summary: {
      type: "OBJECT",
      nullable: true,
      properties: {
        whatItIs: { type: "STRING" },
        signsSymptoms: { type: "STRING" },
        nursingPriorities: { type: "STRING" },
        nclexClue: { type: "STRING" },
      },
    },
  },
  required: ["status", "confidence"],
};

interface IncomingAnswer {
  question?: unknown;
  answer?: unknown;
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

const ANSWER_LABEL: Record<string, string> = {
  yes: "yes",
  no: "no",
  maybe: "maybe",
  unknown: "I don't know",
};

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  // --- validate the request body ------------------------------------------
  let category = "";
  let answers: { question: string; answer: string }[] = [];
  let reveal = "";
  try {
    const body = (await request.json()) as { category?: unknown; answers?: unknown; reveal?: unknown };
    category = String(body?.category ?? "").toLowerCase().trim();
    reveal = String(body?.reveal ?? "").slice(0, 200).trim();
    const raw = Array.isArray(body?.answers) ? (body.answers as IncomingAnswer[]) : [];
    answers = raw
      .slice(0, MAX_TURNS + 8) // small slack over the cap; we still force a guess below
      .map((a) => ({
        question: String(a?.question ?? "").slice(0, 300).trim(),
        answer: String(a?.answer ?? "").toLowerCase().trim(),
      }))
      .filter((a) => a.question && ANSWERS.has(a.answer));
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }

  if (!CATEGORIES.has(category)) return NextResponse.json({ error: "bad-category" }, { status: 400 });
  if (!apiKey) return NextResponse.json({ error: "unconfigured" }, { status: 503 });

  // --- reveal / teach mode (the user tells us what they were thinking of) ---
  if (reveal) {
    // safety first: a personal-symptom / emergency / advice ask never reaches Gemini
    if (looksUnsafe(reveal)) {
      return NextResponse.json({ status: "safety", question: null, guess: null, confidence: 0, summary: null, message: SAFETY_MESSAGE });
    }
    const userText = `The guessing game is over and the user has revealed the answer they were thinking of.

Category: ${category}
The user was thinking of: "${reveal}"

If this is a legitimate medical, nursing, pharmacology, or pathophysiology concept, set status to "guess", set "guess" to its proper concept name, set "confidence" to 1, and fill "summary" with a brief learning recap: what it is, key signs/symptoms, major nursing priorities, and one NCLEX-style clue (one or two tight sentences each). If the text is not a medical/nursing concept, still set status to "guess" and "guess" to the text, but use "summary" to gently note it is outside this educational game's scope. Respond with JSON only.`;
    try {
      const parsed = await askGemini(apiKey, userText);
      if (!parsed) return NextResponse.json({ error: "empty-answer" }, { status: 502 });
      const guess = (typeof parsed.guess === "string" && parsed.guess.trim()) || reveal;
      return NextResponse.json({
        status: "guess",
        question: null,
        guess,
        confidence: 1,
        summary: sanitizeSummary(parsed.summary),
        message: null,
      });
    } catch (err) {
      console.error("[medical-akinator] reveal failed:", err);
      return NextResponse.json({ error: "upstream" }, { status: 502 });
    }
  }

  // --- play mode: ask the next question or make a guess --------------------
  const transcript = answers.length
    ? answers.map((a, i) => `${i + 1}. ${a.question} -> ${ANSWER_LABEL[a.answer]}`).join("\n")
    : "(no questions asked yet)";

  const forceGuess = answers.length >= MAX_TURNS;
  const turnNote = forceGuess
    ? `You have already asked ${answers.length} questions. Commit now: set status to "guess" with your single best guess and a summary.`
    : answers.length === 0
      ? `Ask your first broad question for this category.`
      : `Decide the single best next step: ask ONE new question that best narrows the remaining possibilities, or, if you are confident, make a guess. Never repeat a question above.`;

  const userText = `Category: ${category}

Transcript so far (question -> the user's answer):
${transcript}

${turnNote}
Respond with JSON only.`;

  try {
    const parsed = await askGemini(apiKey, userText);
    if (!parsed) return NextResponse.json({ error: "empty-answer" }, { status: 502 });

    // --- normalize to the public contract ---------------------------------
    let status: "question" | "guess" = parsed.status === "guess" ? "guess" : "question";
    const question = typeof parsed.question === "string" ? parsed.question.trim() : "";
    const guess = typeof parsed.guess === "string" ? parsed.guess.trim() : "";
    // a guess with no name is not a usable guess — fall back to asking
    if (status === "guess" && !guess) status = "question";
    if (status === "question" && !question) return NextResponse.json({ error: "empty-answer" }, { status: 502 });

    const confidence = clamp01(parsed.confidence);
    const summary = status === "guess" ? sanitizeSummary(parsed.summary) : null;

    return NextResponse.json({
      status,
      question: status === "question" ? question : null,
      guess: status === "guess" ? guess : null,
      confidence,
      summary,
      message: null,
    });
  } catch (err) {
    console.error("[medical-akinator] request failed:", err);
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }
}

/* ---- Gemini call ------------------------------------------------------- */

/** call Gemini with the shared system prompt + schema; throws on a non-OK response */
async function askGemini(apiKey: string, userText: string): Promise<ParsedModel | null> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: userText }] }],
      generationConfig: {
        temperature: 0.6,
        topP: 0.95,
        maxOutputTokens: 700,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
  });

  if (!res.ok) {
    // log server-side only; never leak provider details to the client
    console.error(`[medical-akinator] Gemini ${res.status}:`, (await res.text()).slice(0, 400));
    throw new Error(`gemini-${res.status}`);
  }

  const data = (await res.json()) as GeminiResponse;
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("")
    .trim();

  return parseModelJson(text);
}

/* ---- safety ------------------------------------------------------------ */

/**
 * Flag free-text that reads like a PERSONAL medical situation, an emergency, or
 * a request for advice — as opposed to simply naming a concept. Deliberately
 * keyed on personal/advice/crisis framing (not bare symptom nouns) so that a
 * legitimate answer like "chest pain" or "heart attack" still teaches normally.
 */
function looksUnsafe(text: string): boolean {
  const n = ` ${text.toLowerCase().replace(/['’]/g, "'")} `;
  const crisis =
    /\b(911|999|112|call an ambulance|ambulance|suicid|kill myself|end my life|self[ -]?harm|overdos|can'?t breathe|cannot breathe)\b/;
  const personalSymptom =
    /\b(i|i'?m|im|me|my|myself|we|our)\b[^.?!]{0,40}\b(symptom|pain|hurts?|ache|aching|dizzy|nause|vomit|bleed|breath|chest|fever|sick|dying|swollen|rash|attack|stroke|seizure|short of breath)\b/;
  const advice =
    /\b(should i|do i need|what do i do|what should i do|is it safe (for me|to)|how much .*(take|dose)|help me|am i (having|going|ok|okay)|i think i('?m| am| have)|i feel)\b/;
  return crisis.test(n) || personalSymptom.test(n) || advice.test(n);
}

/* ---- parsing / normalization helpers ----------------------------------- */

interface ParsedModel {
  status?: unknown;
  question?: unknown;
  guess?: unknown;
  confidence?: unknown;
  summary?: unknown;
}

/** parse the model output as JSON, tolerating an accidental code-fence wrap */
function parseModelJson(text: string): ParsedModel | null {
  if (!text) return null;
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned) as ParsedModel;
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]) as ParsedModel;
    } catch {
      return null;
    }
  }
}

function clamp01(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}

interface Summary {
  whatItIs: string;
  signsSymptoms: string;
  nursingPriorities: string;
  nclexClue: string;
}

function sanitizeSummary(raw: unknown): Summary | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  const get = (k: string) => (typeof s[k] === "string" ? (s[k] as string).slice(0, 600).trim() : "");
  const summary: Summary = {
    whatItIs: get("whatItIs"),
    signsSymptoms: get("signsSymptoms"),
    nursingPriorities: get("nursingPriorities"),
    nclexClue: get("nclexClue"),
  };
  // only return a summary if at least one field came back populated
  return Object.values(summary).some(Boolean) ? summary : null;
}
