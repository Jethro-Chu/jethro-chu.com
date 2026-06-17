/* ============================================================
   Search intent router for the homepage command bar.

   Turns a free-text query into one concrete action: navigate to a
   page, smooth-scroll to a section/card, or hand the exact question
   to the Ask Jethro assistant. Obvious navigation never touches the
   network — only genuine questions reach the assistant (and Gemini).
   ============================================================ */

export type SearchAction =
  | { type: "navigate"; href: string }
  | { type: "scroll"; targetId: string; highlight?: string[] }
  | { type: "ask"; question: string }
  | { type: "offTopic"; query: string };

/** lowercase, trim, strip punctuation, collapse whitespace */
function normalize(query: string): string {
  return query
    .toLowerCase()
    .replace(/['’`]/g, "") // drop apostrophes so "what's" -> "whats"
    .replace(/[^a-z0-9]+/g, " ") // every other separator -> space
    .replace(/\s+/g, " ")
    .trim();
}

/* Anything mentioning Jethro, his projects, his domain, or the site is on-topic
   and must never be flagged off-topic — even if it also trips an off-topic word. */
const ON_TOPIC_GUARD = [
  "jethro", "nursejet", "nurse jet", "lab logger", "lablogger",
  "rate my hospital", "hospital food", "stock market game", "emotion stock",
  "resume", "cv", "portfolio", "hackathon", "lab notebook", "experiment record",
  "nursing", "clinical", "healthcare", "health tech", "med surg", "bedside",
  "this site", "this website", "this portfolio", "his project", "your project",
  "skill", "contact", "email", "how he build", "how jethro build", "how you build",
];

/* High-signal markers of an obviously off-topic ask. Precision over recall:
   borderline asks fall through to the grounded assistant, not the off-trail card. */
const OFF_TOPIC_MARKERS = [
  // weather
  "weather", "temperature", "forecast", "how hot is", "how cold is", "will it rain",
  // sports
  "nba", "nfl", "mlb", "super bowl", "world cup", "playoff", "who won", "final score",
  "lebron", "messi", "ronaldo", "premier league", "champions league",
  // food / recipes
  "recipe", "pasta", "how to cook", "how to bake", "dinner idea", "what should i eat",
  // math / homework
  "solve this", "math problem", "derivative of", "integral of", "homework", "this equation",
  // trivia / geography
  "capital of", "population of", "how tall is", "tallest", "largest country", "how far is",
  // creative writing
  "poem", "haiku", "write a story", "write me a story", "tell me a joke", "song lyrics", "rap about",
  // medical advice
  "should i take", "is it safe to take", "ibuprofen", "tylenol", "advil", "aspirin",
  "acetaminophen", "dosage", "diagnose", "symptoms of", "what medication", "my headache", "my fever",
  // stocks / shopping
  "stock price", "share price", "bitcoin", "crypto price", "where to buy", "best deal", "discount code",
  // politics / news
  "election", "president of", "republican", "democrat", "politics", "latest news", "headlines",
  // travel
  "flight to", "hotel in", "trip to", "vacation", "things to do in",
  // generic coding help unrelated to this portfolio
  "write me a script", "write a function", "debug my", "fix my code", "leetcode", "python script", "sql query",
];

/**
 * True only for OBVIOUSLY off-topic asks (weather, sports, recipes, trivia,
 * medical advice, etc.). Anything that mentions Jethro / his work / the site is
 * guarded as on-topic. Used both by the router and by the assistant before it
 * would ever call Gemini, so off-topic asks never hit the model.
 */
export function isOffTopic(query: string): boolean {
  const n = normalize(query);
  if (!n) return false;
  if (ON_TOPIC_GUARD.some((g) => n.includes(g))) return false;
  return OFF_TOPIC_MARKERS.some((m) => n.includes(m));
}

export function resolveSearchAction(query: string): SearchAction {
  const raw = query.trim();
  const n = normalize(raw);
  const tokens = n ? n.split(" ") : [];
  const tokenSet = new Set(tokens);

  // contains a multi-word phrase (already normalized)
  const hasPhrase = (...phrases: string[]) => phrases.some((p) => n.includes(p));
  // contains a whole word (avoids matching inside other words)
  const hasWord = (...words: string[]) => words.some((w) => tokenSet.has(w));

  /* ---- 1. Lab Logger (specific project, scrolls to its card) ---- */
  if (
    hasPhrase(
      "lab logger",
      "lablogger",
      "lab notebook",
      "research notebook",
      "research project",
      "ai lab notebook",
      "experiment records",
    )
  ) {
    return { type: "scroll", targetId: "lab-logger" };
  }

  /* ---- 2. NurseJet (its own detail page) ---- */
  if (
    hasPhrase(
      "nursejet",
      "nurse jet",
      "nursing briefing",
      "clinical briefing",
      "nursing research",
      "nursing news",
      "safety alert",
      "bedside brief",
      "source cited nursing",
    )
  ) {
    return { type: "navigate", href: "/projects/nursejet" };
  }

  /* ---- 3. Emotion Stock Market Game (its own detail page) ---- */
  if (
    hasPhrase(
      "stock game",
      "stock market",
      "emotion stock",
      "market pulse",
      "face game",
      "webcam game",
      "expression game",
      "computer vision",
      "facial expression",
    )
  ) {
    return { type: "navigate", href: "/projects/emotion-stock-market-game" };
  }

  /* ---- 4. AI philosophy (before healthcare; "ai in healthcare" / "believe") ---- */
  if (
    hasPhrase(
      "ai in healthcare",
      "future of healthcare",
      "ai philosophy",
      "philosophy of ai",
      "future should look like",
      "what does he believe",
      "what does jethro believe",
      "believe about ai",
      "what he believe",
      "ai should do",
      "healthcare future",
    )
  ) {
    return { type: "ask", question: "What does Jethro believe about AI in healthcare?" };
  }

  /* ---- 5. Healthcare AI work (scroll to projects, emphasize the two) ---- */
  if (
    hasPhrase(
      "healthcare ai",
      "healthcare project",
      "ai project",
      "nursing ai",
      "clinical ai",
      "medical ai",
      "health tech",
      "healthcare tool",
      "health ai",
    )
  ) {
    return { type: "scroll", targetId: "projects", highlight: ["lab-logger", "nursejet"] };
  }

  /* ---- 6. Hackathon / invite ---- */
  if (
    hasWord("hackathon", "demo") ||
    hasPhrase("why invite", "invite him", "invite jethro", "should we invite", "why should we invite") ||
    (hasWord("team") && !hasPhrase("about the team"))
  ) {
    return { type: "ask", question: "Why should we invite Jethro to a hackathon?" };
  }

  /* ---- 7. Resume (any mention of it just loads the resume page) ---- */
  if (
    hasWord("resume", "cv", "experience") ||
    hasPhrase("clinical resume", "nursing resume", "clinical experience", "curriculum vitae")
  ) {
    return { type: "navigate", href: "/resume" };
  }

  /* ---- 8. Projects / work / portfolio ---- */
  if (
    hasWord("projects", "project", "portfolio", "work") ||
    hasPhrase(
      "what has he built",
      "what have you built",
      "what has jethro built",
      "what did you make",
      "what did he make",
      "what did jethro make",
      "things he built",
      "things you built",
      "what you built",
      "show me what",
    )
  ) {
    return { type: "scroll", targetId: "projects" };
  }

  /* ---- 9. About / who is Jethro ---- */
  if (
    hasPhrase(
      "about you",
      "about jethro",
      "about him",
      "about himself",
      "about yourself",
      "who are you",
      "who is jethro",
      "who is he",
      "tell me about",
    ) ||
    hasWord("about", "bio", "background")
  ) {
    return { type: "scroll", targetId: "about" };
  }

  /* ---- 10. Obviously off-topic: the "off the trail" moment (no Gemini) ---- */
  if (isOffTopic(raw)) {
    return { type: "offTopic", query: raw };
  }

  /* ---- default: hand the exact question to the grounded assistant ---- */
  return { type: "ask", question: raw };
}
