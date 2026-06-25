import { NextResponse } from "next/server";
import {
  getLearnedConditions,
  isPersistent,
  learnCondition,
  saveGameHistory,
  type ConditionProfile,
  type GameAnswer,
} from "@/lib/akinatorStore";

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
 *  - play:  { category, answers }                  -> { status: "question" | "guess", ... }
 *            (learned conditions are injected so a once-missed topic is recognized)
 *  - learn: { category, answers, learn, gameId }   -> enrich the named topic into a
 *            structured profile, save/merge it to the learning store + log the game's
 *            questions, then { status: "learned", ... }. A personal emergency / advice
 *            ask returns a safety notice and is never saved.
 *
 * Persistence lives in lib/akinatorStore.ts (Vercel KV / in-memory fallback).
 */

export const runtime = "nodejs";
// NOTE: no custom maxDuration — it must stay within the Vercel plan's function
// limit (the Hobby plan caps it, and exceeding it fails the deploy). Retries
// below are kept short so a turn comfortably finishes within the default timeout.

// Try several models in order so one overloaded model never breaks a turn.
// flash-lite first (fast, cheap, most available); fall back to other capacity
// pools (different models = different "high demand" state). All support the JSON
// schema and are plenty capable for binary medical questions.
const MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash"];
const endpoint = (model: string) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
const MODEL_BACKOFF_MS = [0, 350, 700]; // brief wait before each successive model attempt
const sleep = (ms: number) => (ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());

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

const MAX_TURNS = 22; // hard stop: force a best guess once this many questions asked (room to chase rare answers)
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
Each turn, return your current top candidates with confidences (0 to 1) in "candidateList", most likely first. Include both common AND less-common conditions — the hidden answer may be a specific, atypical, or rare diagnosis (a "zebra"), not just the most common fit. As you rule out the obvious candidates, deliberately add rarer conditions that still fit every answer.

Ask questions in phases, using the question count provided. Get MORE specific as the list narrows — never ask general questions forever:
- Questions 1-3: BROAD narrowing (body system involved, acute vs chronic asked one side, acute-care setting, a major presenting feature). e.g. "Does it primarily affect the cardiovascular system?"
- Questions 4-7: MORE SPECIFIC clinical features (a specific symptom, a characteristic lab, a typical treatment). e.g. "Is anticoagulation commonly used to treat it?"
- Questions 8+: HIGHLY SPECIFIC differentiators that separate the top candidates. e.g. "Is it commonly caused by a clot traveling from the leg?"
Never ask vague questions like "Does it affect the body?", "Is it serious?", or "Is it common?". Each question must rule candidates in or out.

Make a guess (mode = "guess") when one candidate has high confidence, OR the top candidate is clearly more likely than the rest, OR you have already asked many questions. Guess the condition that best fits ALL the answers even if it is uncommon — do NOT default to the most common condition when a rarer one fits the pattern better. Set "guess" to ONLY the answer's name.

Rules:
- Stay strictly within nursing and medical education. The hidden answer is a general medical/nursing concept, never a specific real person or a diagnosis of the user.
- Never give individualized medical advice or a diagnosis of the user. This is a conceptual game about textbook/NCLEX-level topics.
- If the transcript shows 'The assistant guessed X. Was that correct? -> no', then X is ruled out: never guess or re-ask X. Each wrong guess means the answer is MORE specific or LESS common than your obvious picks — shift toward rarer differentials and atypical variants that still fit every answer (distinctive triggers, characteristic findings, eponymous syndromes), and ask a question that singles them out. Do not keep guessing common conditions.
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

/* enrichment (Step 2): turn a stumped topic name into a structured profile */
const ENRICH_PROMPT = `You are a nursing/medical reference. Given a medication or medical topic, return an accurate, concise structured profile as JSON only. Stay at textbook/NCLEX level. Do not give individualized medical advice. The "best_questions" must be short binary yes/no questions (answerable Yes/No/Maybe/I don't know) that best distinguish this topic from similar ones — never use the words "or", "which", "what", "type of", "category", "choose", or "select".`;

const PROFILE_SCHEMA = {
  type: "OBJECT",
  properties: {
    name: { type: "STRING" },
    aliases: { type: "ARRAY", items: { type: "STRING" } },
    category: { type: "STRING", enum: ["medication", "medical_topic"] },
    primary_system: { type: "STRING" },
    acute: { type: "BOOLEAN" },
    chronic: { type: "BOOLEAN" },
    autoimmune: { type: "BOOLEAN" },
    infectious: { type: "BOOLEAN" },
    inflammatory: { type: "BOOLEAN" },
    common_symptoms: { type: "ARRAY", items: { type: "STRING" } },
    hallmark_features: { type: "ARRAY", items: { type: "STRING" } },
    best_questions: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["name", "category"],
};

interface IncomingAnswer {
  question?: unknown;
  answer?: unknown;
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
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
  let learn = "";
  let gameId = "";
  let debug = false;
  try {
    const body = (await request.json()) as {
      category?: unknown;
      answers?: unknown;
      learn?: unknown;
      gameId?: unknown;
      debug?: unknown;
    };
    category = String(body?.category ?? "").toLowerCase().trim();
    learn = String(body?.learn ?? "").slice(0, 120).trim(); // the topic that stumped the engine
    gameId = String(body?.gameId ?? "").slice(0, 64).trim();
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

  // --- learn mode (the engine was stumped; the user names it, we enrich + save) ---
  if (learn) {
    // safety first: a personal-symptom / emergency / advice ask never reaches Gemini
    if (looksUnsafe(learn)) {
      return NextResponse.json({ status: "safety", message: SAFETY_MESSAGE });
    }
    try {
      const profile = await enrichCondition(apiKey, learn, category);
      if (!profile) return NextResponse.json({ error: "empty-answer" }, { status: 502 });

      // upsert/merge the condition so the game recognizes it next time
      const saved = await learnCondition(profile);

      // log the game's real questions (exclude wrong-guess markers) for future tuning
      const qa: GameAnswer[] = answers
        .filter((a) => !/^The assistant guessed .* Was that correct\?$/.test(a.question))
        .map((a) => ({
          question: a.question,
          answer: ANSWER_LABEL[a.answer] ?? a.answer,
          useful: a.answer === "yes" || a.answer === "no", // definitive answers carry signal
        }));
      await saveGameHistory(gameId || `g_${Date.now()}`, qa);

      return NextResponse.json({
        status: "learned",
        name: saved.name,
        profile: saved,
        persisted: isPersistent(), // false = saved only in-memory until KV is configured
        message: null,
      });
    } catch (err) {
      console.error("[medical-akinator] learn failed:", err);
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

  // bias the engine toward conditions it has been stumped on before — so a topic
  // it once missed gets recognized next time (Step 5: learn from past games)
  let learnedHint = "";
  try {
    const learned = await getLearnedConditions(category);
    if (learned.length) {
      const lines = learned.slice(0, 25).map((c) => {
        const aka = c.aliases.length ? ` (aka ${c.aliases.slice(0, 2).join(", ")})` : "";
        const feats = c.hallmark_features.slice(0, 4).join(", ");
        return `- ${c.name}${aka}${feats ? ` — ${feats}` : ""}`;
      });
      learnedHint = `\n\nConditions you have been stumped on before — treat these as STRONG candidates. If the answers fit one, ask its distinguishing features and guess it:\n${lines.join("\n")}`;
    }
  } catch {
    /* store unavailable → just play normally */
  }

  const userText = `Starting scope (${category}): ${SCOPE[category]}${learnedHint}

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

/** Call Gemini for a JSON response with a given system prompt + schema, trying
    each model in MODELS until one responds. A model that is overloaded (503/429),
    rate-limited, unavailable (404/500), or returns a truncated/unparseable body
    just falls through to the next capacity pool; only a genuine client error
    (400/401/403) aborts. Throws if every model fails. */
async function callGeminiJSON(
  apiKey: string,
  systemText: string,
  userText: string,
  schema: object,
): Promise<Record<string, unknown> | null> {
  const requestBody = JSON.stringify({
    systemInstruction: { parts: [{ text: systemText }] },
    contents: [{ role: "user", parts: [{ text: userText }] }],
    generationConfig: {
      temperature: 0.6,
      topP: 0.95,
      // generous budget: the 2.5 models spend "thinking" tokens BEFORE the JSON.
      // Too low a cap truncates the JSON mid-string and the parse fails.
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  let lastStatus = 0;
  for (let i = 0; i < MODELS.length; i++) {
    await sleep(MODEL_BACKOFF_MS[i] ?? 700);

    let res: Response;
    try {
      res = await fetch(endpoint(MODELS[i]), {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: requestBody,
      });
    } catch (err) {
      console.warn(`[medical-akinator] ${MODELS[i]} network error, trying next:`, (err as Error).message);
      lastStatus = 0;
      continue;
    }

    if (res.ok) {
      const data = (await res.json()) as GeminiResponse;
      const text = (data.candidates?.[0]?.content?.parts ?? [])
        .map((p) => p.text ?? "")
        .join("")
        .trim();
      const parsed = parseModelJson(text);
      if (parsed) return parsed;
      // 200 but unparseable (usually a truncated response, finishReason MAX_TOKENS)
      // — log it and fall through to the next model rather than failing the turn
      const finish = data.candidates?.[0]?.finishReason;
      console.warn(`[medical-akinator] ${MODELS[i]} 200 but unparseable (finish=${finish}, len=${text.length}); trying next`);
      lastStatus = 200;
      continue;
    }

    lastStatus = res.status;
    const body = (await res.text()).slice(0, 300);
    // a real client error (bad key/request) won't be fixed by another model
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      console.error(`[medical-akinator] Gemini ${res.status} (${MODELS[i]}):`, body);
      throw new Error(`gemini-${res.status}`);
    }
    // overload / rate limit / unavailable → fall through to the next model
    console.warn(`[medical-akinator] ${MODELS[i]} -> ${res.status}, trying next model`);
  }

  console.error(`[medical-akinator] all models unavailable (last status ${lastStatus})`);
  throw new Error(`gemini-${lastStatus}`);
}

/** a game turn: ask for the next question or a guess */
async function askGemini(apiKey: string, userText: string): Promise<ParsedModel | null> {
  return (await callGeminiJSON(apiKey, SYSTEM_PROMPT, userText, RESPONSE_SCHEMA)) as ParsedModel | null;
}

/** Step 2: turn a stumped topic name into a structured medical profile to store. */
async function enrichCondition(apiKey: string, name: string, category: string): Promise<ConditionProfile | null> {
  const kind = category === "medication" ? "medication, drug class, or pharmacology concept" : "nursing/medical topic";
  const userText = `Generate a structured profile for this ${kind}: "${name}".
Use the canonical name. Fill every field accurately and concisely. "best_questions" must be 3 to 5 SHORT binary yes/no questions that best distinguish this from similar topics. Respond with JSON only.`;
  const raw = await callGeminiJSON(apiKey, ENRICH_PROMPT, userText, PROFILE_SCHEMA);
  return raw ? toConditionProfile(raw, name, category) : null;
}

/** defensively map the model's raw enrichment JSON to a stored ConditionProfile */
function toConditionProfile(raw: Record<string, unknown>, fallbackName: string, category: string): ConditionProfile {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const list = (v: unknown) =>
    Array.isArray(v) ? v.map((x) => str(x)).filter(Boolean).slice(0, 12) : [];
  return {
    name: str(raw.name) || fallbackName,
    aliases: list(raw.aliases),
    category: category || (str(raw.category) === "medication" ? "medication" : "medical_topic"),
    primary_system: str(raw.primary_system) || undefined,
    acute: raw.acute === true,
    chronic: raw.chronic === true,
    autoimmune: raw.autoimmune === true,
    infectious: raw.infectious === true,
    inflammatory: raw.inflammatory === true,
    common_symptoms: list(raw.common_symptoms),
    hallmark_features: list(raw.hallmark_features),
    best_questions: list(raw.best_questions),
    // bookkeeping (times_missed / created_at / last_seen) is set by learnCondition()
    times_missed: 0,
    created_at: "",
    last_seen: "",
  };
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

/** parse the model output as a JSON object, tolerating an accidental code-fence wrap */
function parseModelJson(text: string): Record<string, unknown> | null {
  if (!text) return null;
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const tryParse = (s: string): Record<string, unknown> | null => {
    try {
      const v = JSON.parse(s);
      return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  };
  const direct = tryParse(cleaned);
  if (direct) return direct;
  const m = cleaned.match(/\{[\s\S]*\}/);
  return m ? tryParse(m[0]) : null;
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
