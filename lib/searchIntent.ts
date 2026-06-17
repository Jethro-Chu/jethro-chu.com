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
  | { type: "ask"; question: string };

/** lowercase, trim, strip punctuation, collapse whitespace */
function normalize(query: string): string {
  return query
    .toLowerCase()
    .replace(/['’`]/g, "") // drop apostrophes so "what's" -> "whats"
    .replace(/[^a-z0-9]+/g, " ") // every other separator -> space
    .replace(/\s+/g, " ")
    .trim();
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

  /* ---- default: hand the exact question to the assistant ---- */
  return { type: "ask", question: raw };
}
