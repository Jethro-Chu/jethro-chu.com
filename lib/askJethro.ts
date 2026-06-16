/* ============================================================
   ASK JETHRO  ·  local assistant engine (no API key, demo-ready)
   Pure logic, no React. Maps a question to a grounded answer built
   from content/profile.ts, with related projects, follow-ups, and
   actions. Deterministic today; LLM-ready tomorrow (see generateJethro
   Answer's note for where a real model call would slot in).
   ============================================================ */

import {
  profile,
  invite,
  fullProjects,
  projectById,
  featuredProjects,
  aiProjects,
  designProjects,
  type FullProject,
} from "@/content/profile";

export interface AssistantAction {
  type: "open-link" | "view-case-study" | "ask";
  label: string;
  href?: string;
  projectId?: string;
  question?: string;
}

export interface AssistantAnswer {
  intent: string;
  /** paragraphs, "\n\n"-separated */
  text: string;
  relatedProjectIds: string[];
  followUps: string[];
  actions: AssistantAction[];
}

const norm = (q: string) => q.toLowerCase().trim();
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// match on a WORD START (leading \b) so "project" matches "projects" but a short
// token like "ui" never matches inside "built". Avoids substring false positives.
const has = (q: string, ...words: string[]) => words.some((w) => new RegExp(`\\b${esc(w)}`).test(q));

/** projects that share a category, nearest first, excluding self */
function relatedTo(p: FullProject, n = 2): FullProject[] {
  return fullProjects
    .filter((o) => o.id !== p.id && o.categories.some((c) => p.categories.includes(c)))
    .slice(0, n);
}

function listProjects(ps: FullProject[]): string {
  return ps.map((p) => p.title).join(", ");
}

function projectActions(p: FullProject): AssistantAction[] {
  const actions: AssistantAction[] = [];
  if (p.link && !p.isVirtual) {
    actions.push({ type: "open-link", label: `Open ${p.link.label}`, href: p.link.href, projectId: p.id });
  }
  actions.push({ type: "view-case-study", label: "View case study", projectId: p.id });
  return actions;
}

function projectAnswer(p: FullProject): AssistantAnswer {
  return {
    intent: `project:${p.id}`,
    text: `${p.title} — ${p.oneLine}\n\n${p.whyItMatters}`,
    relatedProjectIds: [p.id, ...relatedTo(p).map((r) => r.id)],
    followUps: [
      `What did Jethro build for ${p.title}?`,
      relatedTo(p)[0] ? `Tell me about ${relatedTo(p)[0].title}` : "What else has he built?",
      "Why invite him to a hackathon?",
    ],
    actions: projectActions(p),
  };
}

/** match a project by name / nickname in the question */
function matchProject(q: string): FullProject | null {
  if (/lab\s?logger/.test(q)) return projectById("lab-logger") ?? null;
  if (/nurse\s?jet/.test(q)) return projectById("nursejet") ?? null;
  if (has(q, "hospital food", "rate my hospital")) return projectById("rate-my-hospital-food") ?? null;
  if (has(q, "stock", "emotion", "face", "market game")) return projectById("emotion-stock-market-game") ?? null;
  if (has(q, "jethro os", "this site", "this portfolio")) return projectById("jethro-os") ?? null;
  return null;
}

const askAction = (label: string, question: string): AssistantAction => ({ type: "ask", label, question });

/**
 * The single entry point. Today it returns a deterministic answer from the
 * structured profile. To go live with a real model later, keep this signature
 * and, inside, replace the intent switch with a fetch to your API route that
 * passes `profile`/`fullProjects` as grounding context — the UI never changes.
 */
export function generateJethroAnswer(
  question: string,
  context?: { projectId?: string }
): AssistantAnswer {
  const q = norm(question);

  // --- context: "ask about THIS project" with a non-specific question ---
  const ctxProject = context?.projectId ? projectById(context.projectId) : null;
  const named = matchProject(q);
  if (named) return projectAnswer(named);
  if (ctxProject && q.length < 4) return projectAnswer(ctxProject);

  // --- hackathon / invite / hire ---
  if (has(q, "hackathon", "invite", "recruit", "hire", "intern", "why should", "pick him", "pick jethro", "join")) {
    return {
      intent: "hackathon_pitch",
      text: `${invite.whyHackathon}\n\nMost relevant to show: ${listProjects(featuredProjects)}.`,
      relatedProjectIds: featuredProjects.map((p) => p.id),
      followUps: ["Pitch Jethro in 30 seconds", "Show his healthcare AI projects", "What should he build next?"],
      actions: [
        askAction("Pitch in 30 seconds", "Summarize Jethro in 30 seconds"),
        askAction("Show healthcare AI work", "Show me his healthcare AI projects"),
      ],
    };
  }

  // --- 30-second summary / founder intro ---
  if (has(q, "30 second", "thirty second", "summarize", "summary", "tldr", "tl;dr", "founder", "intro", "elevator")) {
    return {
      intent: "pitch_30",
      text: invite.pitch30,
      relatedProjectIds: featuredProjects.map((p) => p.id),
      followUps: ["What has Jethro built?", "Why invite him to a hackathon?", "What's his nursing background?"],
      actions: [askAction("Why invite him?", "Why invite him to a hackathon?")],
    };
  }

  // --- healthcare (+ ai) projects ---
  if (has(q, "healthcare", "clinical", "nursing", "hospital", "medical") && has(q, "project", "ai", "build", "work", "show")) {
    const ps = fullProjects.filter((p) => p.healthcareRelated || (p.aiRelated && p.categories.includes("research")));
    return {
      intent: "healthcare_projects",
      text: `The healthcare and research AI work to look at is ${listProjects(ps)}. NurseJet makes clinical updates easy to follow on shift; Lab Logger focuses on research documentation and AI-assisted analysis; Rate My Hospital Food turns hospital life into a real product. The thread: use software to remove friction in real clinical and research settings, not add another system to fight.`,
      relatedProjectIds: ps.map((p) => p.id),
      followUps: ["What is NurseJet?", "What is Lab Logger?", "Why invite him to a hackathon?"],
      actions: ps.slice(0, 3).map((p) => askAction(`About ${p.title}`, `What is ${p.title}?`)),
    };
  }

  // --- ai projects ---
  if (has(q, "ai", "machine learning", "ml", "model") && has(q, "project", "build", "work", "show")) {
    return {
      intent: "ai_projects",
      text: `His AI work spans serious and playful: ${listProjects(aiProjects)}. Lab Logger uses AI to summarize research and surface patterns; NurseJet turns a flood of clinical literature into short sourced briefs; the Emotion Stock Market Game wires live face tracking into a browser game. Across all of it he's using AI to make something feel lighter, not to bolt on a chatbot.`,
      relatedProjectIds: aiProjects.map((p) => p.id),
      followUps: ["Show his healthcare AI projects", "What's his strongest project?", "What is Lab Logger?"],
      actions: aiProjects.slice(0, 3).map((p) => askAction(`About ${p.title}`, `What is ${p.title}?`)),
    };
  }

  // --- design / product taste ---
  if (has(q, "design", "product taste", "ux", "ui", "taste", "polish")) {
    return {
      intent: "design_projects",
      text: `For product taste, look at Lab Logger and NurseJet. Lab Logger was a UX role: making research capture feel simple and trustworthy. NurseJet is opinionated editing — every brief is a citation plus a bedside takeaway, nothing filler. He cares about software feeling useful instead of bloated, and it shows in what he leaves out.`,
      relatedProjectIds: designProjects.map((p) => p.id),
      followUps: ["What is Lab Logger?", "What's his strongest project?", "What has Jethro built?"],
      actions: [askAction("About Lab Logger", "What is Lab Logger?")],
    };
  }

  // --- strongest project ---
  if (has(q, "strongest", "best project", "most impressive", "flagship", "proudest", "demo-worthy", "most relevant")) {
    return {
      intent: "strongest",
      text: `Two answers, depending on what you want to see. For substance and real-world fit: NurseJet — a daily clinical briefing he ships solo, with a citation and a bedside takeaway on every item. For an instant, memorable demo: the Emotion Stock Market Game, where your face trades the market live in the browser. Lab Logger is the strongest signal of product/UX taste.`,
      relatedProjectIds: ["nursejet", "emotion-stock-market-game", "lab-logger"],
      followUps: ["What is NurseJet?", "Show his most demo-worthy work", "Why invite him to a hackathon?"],
      actions: [askAction("About NurseJet", "What is NurseJet?"), askAction("About the game", "What is the stock market game?")],
    };
  }

  // --- what should he build next / what's he good at ---
  if (has(q, "build next", "good at building", "would be good", "should he build", "good at")) {
    return {
      intent: "build_next",
      text: `He's strongest building tools for people in clinical and research settings — things that turn scattered, high-stakes information into something short, sourced, and usable. Good next directions: clinical decision-support that nurses actually trust, research tooling that closes the loop from capture to shareable summary, or consumer-health products that make a heavy domain feel light. The constant is real friction he's seen, plus AI used to remove steps.`,
      relatedProjectIds: ["nursejet", "lab-logger"],
      followUps: ["What is he focused on right now?", "Show his healthcare AI projects", "Why invite him to a hackathon?"],
      actions: [askAction("What's he building now?", "What is he focused on right now?")],
    };
  }

  // --- current focus ---
  if (has(q, "currently", "right now", "working on", "focused", "building now", "these days", "at the moment")) {
    const lines = profile.currentFocus.map((f) => `• ${f.project} (${f.status}) — ${f.improving}`).join("\n");
    return {
      intent: "current_focus",
      text: `Right now he's focused on:\n\n${lines}`,
      relatedProjectIds: ["nursejet", "lab-logger", "jethro-os"],
      followUps: ["What is NurseJet?", "What should he build next?", "What has Jethro built?"],
      actions: [askAction("About NurseJet", "What is NurseJet?")],
    };
  }

  // --- background / who is he / nursing ---
  if (has(q, "background", "who is", "who's jethro", "about him", "bio", "story", "kind of builder", "what kind")) {
    return {
      intent: "background",
      text: `${profile.builderIdentity}\n\n${profile.longBio}`,
      relatedProjectIds: featuredProjects.map((p) => p.id),
      followUps: ["What has Jethro built?", "Show his healthcare AI projects", "Why invite him to a hackathon?"],
      actions: [askAction("What has he built?", "What has Jethro built?")],
    };
  }

  // --- skills / stack ---
  if (has(q, "skill", "stack", "tech", "tools he", "languages", "can he do")) {
    return {
      intent: "skills",
      text: `He ships full products end-to-end and is comfortable wiring real ML into the browser (live face tracking in the game). The strongest signal isn't a stack list — it's range: clinical-grade information design in NurseJet, research UX in Lab Logger, and a from-scratch consumer build in Rate My Hospital Food. He picks boring, shippable tools and spends the effort on the product feeling useful.`,
      relatedProjectIds: featuredProjects.map((p) => p.id),
      followUps: ["What's his strongest project?", "What is Lab Logger?", "What has Jethro built?"],
      actions: [],
    };
  }

  // --- contact / collaborate ---
  if (has(q, "contact", "reach", "email", "get in touch", "collaborate", "work with", "connect")) {
    return {
      intent: "contact",
      text: `The fastest way is email — he's open to healthcare, software, and hackathon collaborations.`,
      relatedProjectIds: [],
      followUps: ["Why invite him to a hackathon?", "What has Jethro built?"],
      actions: [
        ...(profile.contactEmail ? [{ type: "open-link" as const, label: "Email Jethro", href: profile.contactEmail }] : []),
        ...(profile.github ? [{ type: "open-link" as const, label: "GitHub", href: profile.github }] : []),
      ],
    };
  }

  // --- general "what has he built" / overview / portfolio ---
  if (has(q, "what has", "what does he", "what's he built", "built", "projects", "work", "portfolio", "made", "show me")) {
    return {
      intent: "project_overview",
      text: `Jethro has built across healthcare, AI, research workflows, and playful consumer tools. The work to know: NurseJet, a daily clinical briefing for nurses; Lab Logger, an AI research notebook he shaped the UX for; Rate My Hospital Food, a real product out of a funny idea; and the Emotion Stock Market Game, where your face trades the market. The pattern is simple — he notices friction in a real setting, then builds software around it.`,
      relatedProjectIds: fullProjects.filter((p) => !p.isVirtual).map((p) => p.id),
      followUps: ["Show his healthcare AI projects", "What's his strongest project?", "Why invite him to a hackathon?"],
      actions: featuredProjects.slice(0, 3).map((p) => askAction(`About ${p.title}`, `What is ${p.title}?`)),
    };
  }

  // --- fallback ---
  return {
    intent: "unknown",
    text: `I answer best about Jethro's projects, his healthcare and AI work, his product/design approach, why he'd be useful on a team, and what he's focused on now. Try one of these:`,
    relatedProjectIds: [],
    followUps: ["What has Jethro built?", "Why invite him to a hackathon?", "Show his healthcare AI projects", "What is NurseJet?"],
    actions: [],
  };
}
