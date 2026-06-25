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
// NOTE: no custom maxDuration — it must stay within the Vercel plan's function
// limit (the Hobby plan caps it, and exceeding it fails the deploy). Retries
// below are kept short so a turn comfortably finishes within the default timeout.

// flash-lite has more available capacity than flash (fewer "high demand" 503s)
// and is cheaper; plenty capable for binary questions + common-condition guesses.
const MODEL = "gemini-2.5-flash-lite";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

/* The two starting scopes the UI offers. An unknown category is rejected so the
   game can never be steered off-domain. */
const CATEGORIES = new Set(["medication", "medical_topic"]);

/* the starting scope description handed to the model for each category */
const SCOPE: Record<string, string> = {
  medication:
    "The hidden answer is a MEDICATION, a medication class, or a pharmacology concept (examples: beta blockers, ACE inhibitors, loop diuretics, insulin, heparin, antibiotics, opioids, corticosteroids, calcium channel blockers).",
  medical_topic:
    "The hidden answer is any NON-medication nursing or medical topic (examples: acute pancreatitis, heart failure, pulmonary embolism, hypokalemia, metabolic acidosis, seizure precautions, asthma, DKA, myasthenia gravis, prioritization, infection control, fluid overload, shock).",
};

const ANSWERS = new Set(["yes", "no", "maybe", "unknown"]);

const MAX_TURNS = 15; // hard stop: force a best guess once this many questions asked
const MAX_QUESTION_REWRITES = 2; // ask the model to rewrite a non-binary question this many times

const SAFETY_MESSAGE =
  "This is an educational guessing game, not medical advice. If you or someone else might be having a medical emergency, call your local emergency number (911 in the US) or get medical help now. To keep playing, enter the name of a condition or concept and I'll show its learning summary.";

const SYSTEM_PROMPT = `You are playing a Medical Akinator-style educational guessing game inside Jethro Chu's personal portfolio website. The user has selected either "Medication" or "Medical topic" as the starting scope and is thinking of one specific answer within that scope. Use that scope as the starting point and narrow it down. Ask only ONE binary yes/no question at a time. The user can only answer Yes, No, Maybe, or "I don't know". Do not ask open-ended, multiple-choice, or either/or questions. Do not ask questions like "Is it acute or chronic?" — instead ask "Is it typically chronic?" or "Is it typically acute?". Return only valid JSON matching the schema.

Binary questions only — invalid (NEVER produce these):
- "Is it acute or chronic?"
- "Which system does it affect?"
- "Is it neurological or endocrine?"
- "What medication class is it?"
Valid:
- "Is it typically acute?"
- "Is it typically chronic?"
- "Does it primarily affect the nervous system?"
- "Is it a medication class?"
Never use the words "or", "either", "which", "what", "type of", "category", "choose", or "select" inside a question, and never separate two options with a slash. Keep each question short and concrete (under ~12 words). Never repeat a question already in the transcript.

Maintain an internal ranked candidate list and update it after every answer:
- "Yes" raises candidates that have the feature.
- "No" lowers or eliminates candidates that require the feature.
- "Maybe" slightly raises candidates that sometimes have the feature.
- "I don't know" eliminates nothing.
Each turn, return your current top candidates with confidences (0 to 1) in "candidateList", most likely first.

Ask questions in phases, using the question count provided. Get MORE specific as the list narrows — never ask general questions forever:
- Questions 1-3: BROAD narrowing (body system involved, acute vs chronic asked one side, acute-care setting, a major presenting feature). e.g. "Does it primarily affect the cardiovascular system?"
- Questions 4-7: MORE SPECIFIC clinical features (a specific symptom, a characteristic lab, a typical treatment). e.g. "Is anticoagulation commonly used to treat it?"
- Questions 8+: HIGHLY SPECIFIC differentiators that separate the top candidates. e.g. "Is it commonly caused by a clot traveling from the leg?"
Never ask vague questions like "Does it affect the body?", "Is it serious?", or "Is it common?". Each question must rule candidates in or out.

Make a guess (mode = "guess") when one candidate has high confidence, OR the top candidate is clearly more likely than the rest, OR you have already asked about 10-15 questions. Set "guess" to ONLY the answer's name.

Rules:
- Stay strictly within nursing and medical education. The hidden answer is a general medical/nursing concept, never a specific real person or a diagnosis of the user.
- Never give individualized medical advice or a diagnosis of the user. This is a conceptual game about textbook/NCLEX-level topics.
- If the transcript shows 'The assistant guessed X. Was that correct? -> no', then X is ruled out: do not guess or re-ask X. Keep narrowing with a MORE SPECIFIC single yes/no question.
- When mode is "question": fill "question" with ONE binary yes/no question, set "guess" to null, and set "validYesNoQuestion" to true ONLY if the question is a single yes/no question using none of the forbidden words above.
- When mode is "guess": fill "guess" with the answer's name only, set "question" to null, and fill "summary" with a brief educational recap: what it is, key signs/symptoms, major nursing priorities, and one NCLEX-style clue (one or two tight sentences each).
- Always fill "reasoning" with a short note on what the current step distinguishes.`;

/* Gemini structured-output schema — forces a valid, parseable response shape.
   candidateList + reasoning are the model's internal narrowing state; they are
   NOT forwarded to the client (see the response below) unless debug is on. */
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    mode: { type: "STRING", enum: ["question", "guess"] },
    question: { type: "STRING", nullable: true },
    guess: { type: "STRING", nullable: true },
    candidateList: {
      type: "ARRAY",
      nullable: true,
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          confidence: { type: "NUMBER" },
        },
      },
    },
    reasoning: { type: "STRING", nullable: true },
    validYesNoQuestion: { type: "BOOLEAN", nullable: true },
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
  required: ["mode"],
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
  let debug = false;
  try {
    const body = (await request.json()) as { category?: unknown; answers?: unknown; reveal?: unknown; debug?: unknown };
    category = String(body?.category ?? "").toLowerCase().trim();
    reveal = String(body?.reveal ?? "").slice(0, 200).trim();
    debug = body?.debug === true; // when true, also return candidateList + reasoning (never shown in the UI)
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

Scope: ${category}
The user was thinking of: "${reveal}"

If this is a legitimate medical, nursing, or pharmacology concept, set mode to "guess", set "guess" to its proper name, and fill "summary" with a brief learning recap: what it is, key signs/symptoms, major nursing priorities, and one NCLEX-style clue (one or two tight sentences each). If the text is not a medical/nursing concept, still set mode to "guess" and "guess" to the text, but use "summary" to gently note it is outside this educational game's scope. Respond with JSON only.`;
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
  // count real questions (exclude synthetic "wrong guess" markers) for phasing
  const realQuestions = answers.filter(
    (a) => !/^The assistant guessed .* Was that correct\?$/.test(a.question),
  ).length;

  const transcript = answers.length
    ? answers.map((a, i) => `${i + 1}. ${a.question} -> ${ANSWER_LABEL[a.answer]}`).join("\n")
    : "(no questions asked yet)";

  const forceGuess = realQuestions >= MAX_TURNS;
  const phaseNote = forceGuess
    ? `You have asked ${realQuestions} questions — commit now: set mode to "guess" with your single best guess and a summary.`
    : realQuestions === 0
      ? `This is question 1 (BROAD phase): ask a broad yes/no question that splits the scope.`
      : realQuestions <= 3
        ? `Question ${realQuestions + 1} (BROAD phase): ask another broad narrowing yes/no question.`
        : realQuestions <= 7
          ? `Question ${realQuestions + 1} (SPECIFIC phase): ask a specific yes/no question about a clinical feature, lab, or treatment that separates your top candidates.`
          : `Question ${realQuestions + 1} (HIGHLY SPECIFIC phase): ask a very specific differentiating yes/no question.`;

  const guessHint = forceGuess
    ? ""
    : ` Instead, make a guess now (mode "guess") if one candidate has high confidence or is clearly ahead of the rest.`;

  const userText = `Starting scope (${category}): ${SCOPE[category]}

Transcript so far (question -> the user's answer):
${transcript}

You have asked ${realQuestions} question(s). ${phaseNote}${guessHint}
Respond with JSON only.`;

  try {
    let parsed = await askGemini(apiKey, userText);
    if (!parsed) return NextResponse.json({ error: "empty-answer" }, { status: 502 });

    let mode: "question" | "guess" = parsed.mode === "guess" || parsed.status === "guess" ? "guess" : "question";
    const guess = typeof parsed.guess === "string" ? parsed.guess.trim() : "";
    // a guess with no name is not a usable guess — fall back to asking
    if (mode === "guess" && !guess) mode = "question";

    // --- guess turn -------------------------------------------------------
    if (mode === "guess") {
      return NextResponse.json({
        status: "guess",
        question: null,
        guess,
        confidence: topConfidence(parsed),
        summary: sanitizeSummary(parsed.summary),
        message: null,
        ...(debug ? { candidateList: parsed.candidateList, reasoning: parsed.reasoning } : {}),
      });
    }

    // --- question turn: must be a single yes/no question ------------------
    // Reject the model's self-flag (validYesNoQuestion === false) AND anything
    // our validator catches (either/or, open-ended, multiple-choice). On a
    // rejection, ask the model to rewrite it as a strict yes/no question.
    let question = typeof parsed.question === "string" ? parsed.question.trim() : "";
    let attempts = 0;
    while (!isValidYesNoQuestion(parsed?.validYesNoQuestion, question) && attempts < MAX_QUESTION_REWRITES) {
      attempts++;
      console.warn(`[medical-akinator] non-binary question, rewriting (attempt ${attempts}): "${question}"`);
      parsed = await askGemini(apiKey, rewriteUserText(category, question));
      question = parsed && typeof parsed.question === "string" ? parsed.question.trim() : "";
    }

    if (!isValidYesNoQuestion(parsed?.validYesNoQuestion, question)) {
      console.error(`[medical-akinator] could not produce a valid yes/no question: "${question}"`);
      return NextResponse.json({ error: "invalid-question" }, { status: 502 });
    }

    return NextResponse.json({
      status: "question",
      question,
      guess: null,
      confidence: topConfidence(parsed),
      summary: null,
      message: null,
      ...(debug ? { candidateList: parsed?.candidateList, reasoning: parsed?.reasoning } : {}),
    });
  } catch (err) {
    console.error("[medical-akinator] request failed:", err);
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }
}

/* ---- Gemini call ------------------------------------------------------- */

// brief backoffs (ms) for retrying Gemini's transient "high demand" 503s / rate
// spikes — kept to 2 retries so the whole turn fits the default function timeout
const GEMINI_RETRY_BACKOFF_MS = [400, 1100];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** call Gemini with the shared system prompt + schema; retries transient
    overload (503/429/500) with backoff, then throws on a non-OK response */
async function askGemini(apiKey: string, userText: string, attempt = 0): Promise<ParsedModel | null> {
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
    const body = (await res.text()).slice(0, 400);
    // a momentary "high demand" blip usually clears on a quick retry
    if ((res.status === 503 || res.status === 429 || res.status === 500) && attempt < GEMINI_RETRY_BACKOFF_MS.length) {
      console.warn(`[medical-akinator] Gemini ${res.status}, retry ${attempt + 1}/${GEMINI_RETRY_BACKOFF_MS.length}`);
      await sleep(GEMINI_RETRY_BACKOFF_MS[attempt]);
      return askGemini(apiKey, userText, attempt + 1);
    }
    // log server-side only; never leak provider details to the client
    console.error(`[medical-akinator] Gemini ${res.status}:`, body);
    throw new Error(`gemini-${res.status}`);
  }

  const data = (await res.json()) as GeminiResponse;
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("")
    .trim();

  return parseModelJson(text);
}

/* ---- question validation ----------------------------------------------- */

/* Patterns that mark a question as NOT a single yes/no question: either/or
   ("or"/"either"/"vs"/a slash between options), open-ended ("which"/"what"),
   and multiple-choice ("type of"/"category"/"choose"/"select"). */
const INVALID_QUESTION_PATTERNS: RegExp[] = [
  /\bor\b/,
  /\beither\b/,
  /\bwhich\b/,
  /\bwhat\b/,
  /\btype of\b/,
  /\bcategory\b/,
  /\bchoose\b/,
  /\bselect\b/,
  /\bvs\.?\b/,
  /[a-z]\s*\/\s*[a-z]/, // "acute/chronic"
];

/** true only if the text reads as a single, answerable yes/no question */
function isBinaryQuestion(question: string): boolean {
  const n = question.toLowerCase();
  return !INVALID_QUESTION_PATTERNS.some((p) => p.test(n));
}

/** combine the model's self-assessment with our deterministic validator */
function isValidYesNoQuestion(validFlag: unknown, question: string): boolean {
  if (!question) return false;
  if (validFlag === false) return false; // model flagged its own question invalid
  return isBinaryQuestion(question);
}

/** instruction asking the model to rewrite a rejected question as strict yes/no */
function rewriteUserText(category: string, badQuestion: string): string {
  return `Your previous question was NOT a valid binary yes/no question: "${badQuestion}".
It must be answerable with only Yes, No, Maybe, or "I don't know", must NOT contain the words "or", "either", "which", "what", "type of", "category", "choose", or "select", and must not ask the user to pick between options or categories.
Rewrite it as ONE short yes/no question that probes a SINGLE possibility (ask one side at a time), keeping the same diagnostic intent for the scope "${category}".
Set mode to "question", set "validYesNoQuestion" to true, and respond with JSON only.`;
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

interface Candidate {
  name?: unknown;
  confidence?: unknown;
}

interface ParsedModel {
  mode?: unknown;
  status?: unknown; // tolerate the legacy field name
  question?: unknown;
  guess?: unknown;
  candidateList?: unknown;
  reasoning?: unknown;
  validYesNoQuestion?: unknown;
  confidence?: unknown; // legacy top-level confidence
  summary?: unknown;
}

/** confidence of the model's top candidate (drives the guess meter); 0..1 */
function topConfidence(parsed: ParsedModel | null): number {
  const list = Array.isArray(parsed?.candidateList) ? (parsed!.candidateList as Candidate[]) : [];
  if (list.length) {
    const c = Number(list[0]?.confidence);
    if (Number.isFinite(c)) return Math.min(1, Math.max(0, c));
  }
  return clamp01(parsed?.confidence);
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
