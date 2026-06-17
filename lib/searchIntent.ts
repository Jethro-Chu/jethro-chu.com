/* ============================================================
   Search intent router for the homepage command bar.

   Turns a free-text query into one concrete action: navigate to a
   page, smooth-scroll to a section/card, or hand the exact question
   to the Ask Jethro assistant. Obvious navigation never touches the
   network — only genuine questions reach the assistant (and Gemini).
   ============================================================ */

export type SearchAction =
  | { type: "navigate"; href: string }
  | { type: "scroll"; targetId: string }
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

  /* ---- 1. Lab Logger (specific project) ---- */
  if (hasPhrase("lab logger", "lablogger", "lab notebook", "research notebook", "research project")) {
    return { type: "scroll", targetId: "lab-logger" };
  }

  /* ---- 2. NurseJet (specific project) ---- */
  if (hasPhrase("nursejet", "nurse jet", "nursing briefing", "nursing research", "clinical briefing")) {
    return { type: "scroll", targetId: "nursejet" };
  }

  /* ---- 3. AI philosophy (before healthcare; "ai in healthcare" / "believe") ---- */
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
    )
  ) {
    return { type: "ask", question: "What does Jethro believe about AI in healthcare?" };
  }

  /* ---- 4. Healthcare AI work ---- */
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
    return { type: "ask", question: "Show me Jethro's healthcare AI projects." };
  }

  /* ---- 5. Hackathon / invite ---- */
  if (
    hasWord("hackathon", "demo") ||
    hasPhrase("why invite", "invite him", "invite jethro", "should we invite", "why should we invite") ||
    (hasWord("team") && !hasPhrase("about the team"))
  ) {
    return { type: "ask", question: "Why should we invite Jethro to a hackathon?" };
  }

  /* ---- 6. Resume (any mention of it just loads the resume page) ---- */
  if (
    hasWord("resume", "cv", "experience") ||
    hasPhrase("clinical resume", "nursing resume", "clinical experience", "curriculum vitae")
  ) {
    return { type: "navigate", href: "/resume" };
  }

  /* ---- 7. Projects / work / portfolio ---- */
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

  /* ---- 8. About / who is Jethro ---- */
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
    hasWord("about", "bio")
  ) {
    return { type: "scroll", targetId: "about" };
  }

  /* ---- default: hand the exact question to the assistant ---- */
  return { type: "ask", question: raw };
}
