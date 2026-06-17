/* ============================================================
   ASK JETHRO  ·  local assistant engine (no API key, demo-ready)
   Pure logic, no React. Returns ONE response object per question,
   built from content/profile.ts: a concise answer plus a few
   contextual actions and follow-ups. Deterministic today; LLM-ready
   (see generateJethroAnswer's note for where a model call slots in).
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
  /** paragraphs, "\n\n"-separated; kept short and scannable */
  content: string;
  relatedProjects: string[];
  followUps: string[];
  actions: AssistantAction[];
}

const norm = (q: string) => q.toLowerCase().trim();
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// match on a WORD START (leading \b) so "project" matches "projects" but a short
// token like "ui" never matches inside "built". Avoids substring false positives.
const has = (q: string, ...words: string[]) => words.some((w) => new RegExp(`\\b${esc(w)}`).test(q));

const list = (ps: FullProject[]) => ps.map((p) => p.title).join(", ");
const askAction = (label: string, question: string): AssistantAction => ({ type: "ask", label, question });

/** the one related project, if any (shared category) */
function nearest(p: FullProject): FullProject | undefined {
  return fullProjects.find((o) => o.id !== p.id && o.categories.some((c) => p.categories.includes(c)));
}

/** a single-project answer: summary / why it matters / role + tight actions */
function projectAnswer(p: FullProject): AssistantAnswer {
  const rel = nearest(p);
  const actions: AssistantAction[] = [];
  if (p.link && !p.isVirtual) actions.push({ type: "open-link", label: `Open ${p.link.label}`, href: p.link.href });
  actions.push({ type: "view-case-study", label: "View case study", projectId: p.id });
  actions.push(askAction(`What did Jethro build for ${p.title}?`, `What did Jethro build for ${p.title}?`));
  return {
    intent: `project:${p.id}`,
    content: `${p.title} is ${lowerFirst(p.oneLine)}\n\nWhy it matters: ${p.whyItMatters}\n\nJethro's role: ${p.builderRole}.`,
    relatedProjects: rel ? [rel.id] : [],
    followUps: rel ? [`Tell me about ${rel.title}`, "What has Jethro built?"] : ["What has Jethro built?", "What is he focused on right now?"],
    actions,
  };
}

const lowerFirst = (s: string) => (s ? s[0].toLowerCase() + s.slice(1) : s);

/** match a project by name / nickname in the question */
function matchProject(q: string): FullProject | null {
  if (/lab\s?logger/.test(q)) return projectById("lab-logger") ?? null;
  if (/nurse\s?jet/.test(q)) return projectById("nursejet") ?? null;
  if (has(q, "hospital food", "rate my hospital")) return projectById("rate-my-hospital-food") ?? null;
  if (has(q, "stock", "emotion", "face", "market game")) return projectById("emotion-stock-market-game") ?? null;
  if (has(q, "jethro os", "this site", "this portfolio")) return projectById("jethro-os") ?? null;
  return null;
}

/**
 * The single entry point. Returns ONE answer object from the structured profile.
 * To go live with a real model later, keep this signature and replace the intent
 * switch with a fetch to your API route that passes `profile`/`fullProjects` as
 * grounding context — the panel never changes.
 */
export function generateJethroAnswer(question: string, context?: { projectId?: string }): AssistantAnswer {
  const q = norm(question);
  const named = matchProject(q) ?? (context?.projectId ? projectById(context.projectId) ?? null : null);

  // --- "what did he build for X" / "his role on X": build-focused, not the full card ---
  if (named && has(q, "what did", "build for", "his role", "role on", "role in", "role for")) {
    const actions: AssistantAction[] = [];
    if (named.link && !named.isVirtual) actions.push({ type: "open-link", label: `Open ${named.link.label}`, href: named.link.href });
    actions.push({ type: "view-case-study", label: "View case study", projectId: named.id });
    return {
      intent: `build:${named.id}`,
      content: `Jethro's role on ${named.title}: ${named.builderRole}.\n\n${named.caseStudy.build}`,
      relatedProjects: [],
      followUps: [`Tell me about ${named.title}`, "What has Jethro built?"],
      actions,
    };
  }

  // --- a named project ---
  if (named) return projectAnswer(named);

  // --- resume / clinical experience (offer the page, don't dead-end) ---
  if (has(q, "resume", "cv") || /clinical experience|work experience|nursing experience/.test(q)) {
    return {
      intent: "resume",
      content: `${profile.name} is a Bachelor of Science in Nursing student at Azusa Pacific University (expected December 2026), with clinical placements across pediatric, mental health, oncology, cardiac, emergency, and med-surg settings.\n\nHis full resume — education, clinical hours, certifications (BLS, ACLS, Epic), and skills — is on the resume page.`,
      relatedProjects: [],
      followUps: ["What has Jethro built?", "What's his strongest project?"],
      actions: [{ type: "open-link", label: "View resume", href: "/resume" }],
    };
  }

  // --- hackathon / invite / hire ---
  if (has(q, "hackathon", "invite", "recruit", "hire", "intern", "why should", "pick him", "pick jethro", "join")) {
    return {
      intent: "hackathon_pitch",
      content: invite.whyHackathon,
      relatedProjects: featuredProjects.map((p) => p.id),
      followUps: ["Show his healthcare AI projects", "What is he focused on right now?"],
      actions: [],
    };
  }

  // --- 30-second summary / founder intro ---
  if (has(q, "30 second", "thirty second", "summarize", "summary", "tldr", "tl;dr", "founder", "intro", "elevator")) {
    return {
      intent: "pitch_30",
      content: invite.pitch30,
      relatedProjects: featuredProjects.map((p) => p.id),
      followUps: ["What has Jethro built?", "What's his strongest project?"],
      actions: [],
    };
  }

  // --- healthcare (+ ai) projects ---
  if (has(q, "healthcare", "clinical", "nursing", "hospital", "medical") && has(q, "project", "ai", "build", "work", "show")) {
    const ps = fullProjects.filter((p) => p.healthcareRelated || (p.aiRelated && p.categories.includes("research")));
    return {
      intent: "healthcare_projects",
      content: `The healthcare and research AI work to look at is ${list(ps)}.\n\nNurseJet makes clinical updates easy to follow on shift. Lab Logger focuses on research documentation and AI-assisted analysis. The thread: use software to remove friction in real clinical and research settings, not add another system to fight.`,
      relatedProjects: ps.map((p) => p.id),
      followUps: ["What is NurseJet?", "What is Lab Logger?"],
      actions: ps.slice(0, 2).map((p) => askAction(`About ${p.title}`, `What is ${p.title}?`)),
    };
  }

  // --- ai projects ---
  if (has(q, "ai", "machine learning", "ml", "model") && has(q, "project", "build", "work", "show")) {
    return {
      intent: "ai_projects",
      content: `His AI work spans serious and playful: ${list(aiProjects)}.\n\nLab Logger uses AI to summarize research and surface patterns. NurseJet turns a flood of clinical literature into short, sourced briefs. The Emotion Stock Market Game wires live face tracking into the browser. He uses AI to make something feel lighter, not to bolt on a chatbot.`,
      relatedProjects: aiProjects.map((p) => p.id),
      followUps: ["What is Lab Logger?", "What's his strongest project?"],
      actions: aiProjects.slice(0, 2).map((p) => askAction(`About ${p.title}`, `What is ${p.title}?`)),
    };
  }

  // --- design / product taste ---
  if (has(q, "design", "product taste", "ux", "ui", "taste", "polish")) {
    return {
      intent: "design_projects",
      content: `For product taste, look at Lab Logger and NurseJet.\n\nLab Logger was a UX role: making research capture feel simple and trustworthy. NurseJet is opinionated editing — every brief is a citation plus a bedside takeaway, nothing filler. He cares about software feeling useful, and it shows in what he leaves out.`,
      relatedProjects: designProjects.map((p) => p.id),
      followUps: ["What is Lab Logger?", "What's his strongest project?"],
      actions: [askAction("About Lab Logger", "What is Lab Logger?")],
    };
  }

  // --- strongest / most demo-worthy ---
  if (has(q, "strongest", "best project", "most impressive", "flagship", "proudest", "demo-worthy", "most relevant")) {
    return {
      intent: "strongest",
      content: `Two answers, depending on what you want to see.\n\nFor substance and real-world fit: NurseJet — a daily clinical briefing he ships solo, with a citation and a bedside takeaway on every item. For an instant, memorable demo: the Emotion Stock Market Game, where your face trades the market live in the browser.`,
      relatedProjects: ["nursejet", "emotion-stock-market-game"],
      followUps: ["What is NurseJet?", "Tell me about the stock market game"],
      actions: [askAction("About NurseJet", "What is NurseJet?")],
    };
  }

  // --- what should he build next / what's he good at ---
  if (has(q, "build next", "good at building", "would be good", "should he build", "good at")) {
    return {
      intent: "build_next",
      content: `He's strongest building tools for people in clinical and research settings — turning scattered, high-stakes information into something short, sourced, and usable.\n\nGood next directions: clinical decision-support nurses actually trust, research tooling that closes the loop from capture to shareable summary, or consumer-health products that make a heavy domain feel light.`,
      relatedProjects: ["nursejet", "lab-logger"],
      followUps: ["What is he focused on right now?", "Show his healthcare AI projects"],
      actions: [askAction("What's he building now?", "What is he focused on right now?")],
    };
  }

  // --- current focus ---
  if (has(q, "currently", "right now", "working on", "focused", "building now", "these days", "at the moment")) {
    const lines = profile.currentFocus.map((f) => `• ${f.project} (${f.status}) — ${f.improving}`).join("\n");
    return {
      intent: "current_focus",
      content: `Right now he's focused on:\n\n${lines}`,
      relatedProjects: ["nursejet", "lab-logger", "jethro-os"],
      followUps: ["What is NurseJet?", "What should he build next?"],
      actions: [askAction("About NurseJet", "What is NurseJet?")],
    };
  }

  // --- background / who is he / nursing ---
  if (has(q, "background", "who is", "who's jethro", "about him", "bio", "story", "kind of builder", "what kind")) {
    return {
      intent: "background",
      content: `${profile.builderIdentity}\n\n${profile.longBio}`,
      relatedProjects: featuredProjects.map((p) => p.id),
      followUps: ["What has Jethro built?", "What's his strongest project?"],
      actions: [askAction("What has he built?", "What has Jethro built?")],
    };
  }

  // --- skills / stack ---
  if (has(q, "skill", "stack", "tech", "tools he", "languages", "can he do")) {
    return {
      intent: "skills",
      content: `He ships full products end-to-end and is comfortable wiring real ML into the browser (live face tracking in the game).\n\nThe strongest signal is range: clinical-grade information design in NurseJet, research UX in Lab Logger, and a from-scratch consumer build in Rate My Hospital Food. He picks boring, shippable tools and spends the effort on the product feeling useful.`,
      relatedProjects: featuredProjects.map((p) => p.id),
      followUps: ["What's his strongest project?", "What has Jethro built?"],
      actions: [],
    };
  }

  // --- contact / collaborate ---
  if (has(q, "contact", "reach", "email", "get in touch", "collaborate", "work with", "connect")) {
    return {
      intent: "contact",
      content: `The fastest way is email — he's open to healthcare, software, and hackathon collaborations.`,
      relatedProjects: [],
      followUps: ["What has Jethro built?", "Show his healthcare AI projects"],
      actions: [
        ...(profile.contactEmail ? [{ type: "open-link" as const, label: "Email Jethro", href: profile.contactEmail }] : []),
        ...(profile.github ? [{ type: "open-link" as const, label: "GitHub", href: profile.github }] : []),
      ],
    };
  }

  // --- general overview / "what has he built" ---
  if (has(q, "what has", "what does he", "what's he built", "built", "projects", "work", "portfolio", "made", "show me")) {
    return {
      intent: "project_overview",
      content: `Jethro builds across healthcare, AI, research, and playful consumer tools. The work to know:\n\n• NurseJet — a daily clinical briefing for nurses\n• Lab Logger — an AI research notebook he shaped the UX for\n• Rate My Hospital Food — a real product out of a funny idea\n• Emotion Stock Market Game — your face trades the market\n\nThe pattern: he notices friction in a real setting, then builds software around it.`,
      relatedProjects: featuredProjects.map((p) => p.id),
      followUps: ["Show his healthcare AI projects", "What is he focused on right now?"],
      actions: [askAction("About NurseJet", "What is NurseJet?"), askAction("About Lab Logger", "What is Lab Logger?")],
    };
  }

  // --- fallback ---
  return {
    intent: "unknown",
    content: `I answer best about Jethro's projects, his healthcare and AI work, his product approach, why he'd be useful on a team, and what he's focused on now. Try one of these:`,
    relatedProjects: [],
    followUps: ["What has Jethro built?", "What's his strongest project?", "What is Lab Logger?"],
    actions: [],
  };
}
