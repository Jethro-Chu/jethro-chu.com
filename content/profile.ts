/* ============================================================
   PROFILE  ·  the knowledge base for "Ask Jethro"
   The single source of truth the assistant + the OS panels read.
   It REUSES the existing project copy from content.ts and layers on
   structured intelligence (case studies, categories, current focus,
   hackathon answers). Everything here is editable plain data.

   >>> Anything marked TODO(jethro) is an honest placeholder — fill it
   in or correct it. Nothing here invents employers, schools, metrics,
   or users that the site does not already claim. <<<
   ============================================================ */

import { projects as baseProjects, site, about, contact } from "./content";
import type { Project } from "./content";

export type ProjectCategory =
  | "healthcare"
  | "ai"
  | "research"
  | "consumer"
  | "playful"
  | "design"
  | "portfolio";

export type ProjectStatus =
  | "Live"
  | "In progress"
  | "Prototype"
  | "Working demo"
  | "Maintained";

/** a short, scannable case study — honest about state, no invented results */
export interface CaseStudy {
  problem: string;
  insight: string;
  build: string;
  state: string; // honest current state, not a fabricated metric
  next: string;
}

/** intelligence layered onto an existing content.ts project (matched by id) */
export interface ProjectIntel {
  id: string;
  subtitle: string;
  /** concise "what Jethro did" phrasing, for the assistant's role line
   *  (distinct from the base Project.role label shown on the card) */
  builderRole: string;
  categories: ProjectCategory[];
  status: ProjectStatus;
  year: string;
  oneLine: string;
  whyItMatters: string;
  features: string[];
  caseStudy: CaseStudy;
  tags: string[];
  featured: boolean;
  healthcareRelated: boolean;
  aiRelated: boolean;
  designRelated: boolean;
  screenshot?: string;
}

/** a base content.ts project merged with its intelligence layer */
export type FullProject = Project & ProjectIntel & { isVirtual?: boolean };

/* ---- per-project intelligence (keyed to content.ts project ids) ---- */
const intel: Record<string, ProjectIntel> = {
  "lab-logger": {
    id: "lab-logger",
    subtitle: "AI research notebook · UX/design",
    builderRole: "product direction, UX, the landing experience, and the AI workflow design",
    categories: ["ai", "research", "design"],
    status: "Live",
    year: "2025",
    oneLine:
      "An AI-powered lab notebook that turns messy research notes, voice memos, files, and PDFs into organized, analyzable experiment records.",
    whyItMatters:
      "Research lives in scattered notes, half-labeled files, and memory. Lab Logger pulls that into one place and uses AI to summarize progress and surface patterns, so documenting an experiment stops being the thing you skip.",
    features: [
      "Capture notes, voice memos, files, and PDFs in one experiment record",
      "Organized entries instead of scattered docs",
      "AI-assisted analysis that summarizes progress and surfaces patterns",
      "Built to feel simple and fast enough to use mid-experiment",
    ],
    caseStudy: {
      problem:
        "Researchers document experiments in scattered notes, files, and memory, so the record is incomplete exactly when it matters.",
      insight:
        "The documentation has to feel lighter than the work it describes, or people skip it. So the bar was 'usable in the middle of a real experiment', not 'feature-complete'.",
      build:
        "I shaped the UX: turning notes, voice entries, files, and PDFs into clean experiment records, with AI-assisted analysis to summarize progress and find patterns.",
      state: "Live at lab-logger.com. My role was product/UX, not solo authorship.",
      next:
        "Tighten the path from raw capture to a shareable summary, and make the AI analysis easier to trust at a glance.",
    },
    tags: ["research", "ai", "notebook", "ux", "analysis", "pdf", "voice"],
    featured: true,
    healthcareRelated: false,
    aiRelated: true,
    designRelated: true,
    screenshot: "/shots/lab-logger.jpg",
  },
  nursejet: {
    id: "nursejet",
    subtitle: "Daily clinical briefing for nurses",
    builderRole: "solo — he designs, builds, writes, and publishes it",
    categories: ["healthcare", "ai", "consumer"],
    status: "Live",
    year: "2025",
    oneLine:
      "A daily clinical briefing that distills new nursing research, guideline changes, and safety alerts into short, specialty-specific briefs with the exact citation and a bedside takeaway.",
    whyItMatters:
      "Bedside nurses do not have time to track every new study or guideline change. NurseJet does that reading for them and hands back something short, sourced, and usable on shift, with the citation right there so it is trustable.",
    features: [
      "Short daily briefs from new nursing research, guidelines, and safety alerts",
      "Organized by specialty, from the ED to the NICU",
      "Exact source citation on every brief",
      "A practical bedside takeaway on each one",
    ],
    caseStudy: {
      problem:
        "Important clinical updates are spread across journals, guidelines, and alerts, and bedside nurses have no time to chase them.",
      insight:
        "Nurses do not need more to read. They need the one thing that changed, why it matters at the bedside, and a source they can trust.",
      build:
        "A daily briefing product, solo: specialty-specific briefs, a citation on every item, and a takeaway written for the bedside, not for a journal.",
      state: "Live at nursejet.org, with new editions published daily.",
      next:
        "Sharper specialty filtering and making each brief even faster to act on during a shift.",
    },
    tags: ["healthcare", "nursing", "clinical", "briefing", "citations", "news"],
    featured: true,
    healthcareRelated: true,
    aiRelated: true,
    designRelated: true,
    screenshot: "/shots/nursejet.jpg",
  },
  "rate-my-hospital-food": {
    id: "rate-my-hospital-food",
    subtitle: "A real product out of a funny idea",
    builderRole: "solo — design, build, and ship",
    categories: ["consumer", "playful", "healthcare"],
    status: "Live", // TODO(jethro): confirm ratemyhospitalfood.com is live
    year: "2024",
    oneLine:
      "A review site for hospital cafeteria food: search a hospital, read real reviews, leave a star rating, and see the best and worst cafeterias ranked like a food app.",
    whyItMatters:
      "It started as a joke from real hospital life and became an actual product. It shows the other half of how I build: take something funny and internet-native and still ship it with real search, reviews, and ranking.",
    features: [
      "Search a hospital and read real reviews",
      "Leave a star rating and a review of your own",
      "Best and worst cafeterias ranked like a food app",
      "A playful idea built as a working product, not a meme",
    ],
    caseStudy: {
      problem:
        "Hospital food is a universal running joke, but there was nowhere to actually compare it.",
      insight:
        "A joke holds attention; a working product keeps it. The fun framing only lands if the search, reviews, and ranking actually work.",
      build:
        "A full review site, solo: hospital search, user reviews and star ratings, and food-app-style rankings.",
      state: "Built as a working product. TODO(jethro): confirm it is live and add real screenshots.",
      next:
        "Photo uploads for dishes and a cleaner first-time experience.",
    },
    tags: ["consumer", "reviews", "ranking", "hospital", "fun", "product"],
    featured: false,
    healthcareRelated: true,
    aiRelated: false,
    designRelated: true,
    screenshot: "/shots/ratemyhospitalfood.jpg",
  },
  "emotion-stock-market-game": {
    id: "emotion-stock-market-game",
    subtitle: "Your face trades the market",
    builderRole: "solo — design and build, including the live face tracking",
    categories: ["playful", "ai", "consumer"],
    status: "Live",
    year: "2024",
    oneLine:
      "A browser stock-market game where your facial expressions, read live through your camera, drive every buy and sell — and it all runs locally with nothing recorded or uploaded.",
    whyItMatters:
      "It is the most demo-worthy thing to put in front of someone: instant, physical, and a little absurd. It also shows I can wire real ML (face tracking) into a tight, private, single-page experience.",
    features: [
      "Facial expressions read live via the camera drive buys and sells",
      "Random crashes, recessions, and Warren Buffett whale pumps",
      "Runs entirely in the browser",
      "Nothing recorded or uploaded — fully local",
    ],
    caseStudy: {
      problem:
        "Most browser games are tap or click. I wanted input that feels physical and a little ridiculous.",
      insight:
        "Your face is an underused controller, and doing it locally means it can be playful without being creepy about privacy.",
      build:
        "A vanilla-JS game using face-api.js and TensorFlow.js for live expression detection, with market events for chaos — all client-side.",
      state: "Live and playable in the browser, source on GitHub.",
      next: "More market events and a tighter onboarding for the camera step.",
    },
    tags: ["game", "ai", "computer-vision", "browser", "privacy", "fun"],
    featured: true,
    healthcareRelated: false,
    aiRelated: true,
    designRelated: true,
    // screenshot: TODO(jethro): add a screenshot of the game mid-play
  },
};

/* a virtual project: this site itself, per the brief */
const jethroOs: FullProject = {
  id: "jethro-os",
  title: "Jethro OS",
  role: "Solo build",
  stack: ["Next.js", "React", "Tailwind", "Framer Motion"],
  summary:
    "This site: a portfolio you can talk to. Browse the work visually, or ask Jethro AI what I've built, why my nursing background is different, and which projects fit your team.",
  link: { href: site.url, label: "you're on it" },
  isVirtual: true,
  subtitle: "A portfolio you can ask questions",
  builderRole: "solo — design and build",
  categories: ["ai", "design", "portfolio"],
  status: "In progress",
  year: "2026",
  oneLine:
    "A portfolio operating system: explore the work through a command center and a conversational 'Ask Jethro' assistant grounded in real project data.",
  whyItMatters:
    "A recruiter, hackathon organizer, or collaborator can get the 30-second version of me without reading every page, by just asking.",
  features: [
    "Ask Jethro: a grounded assistant over real project data",
    "Command input + ⌘K palette to explore by asking",
    "Per-project intelligence and short case studies",
    "An 'Invite Jethro' mode for hackathons and teams",
  ],
  caseStudy: {
    problem:
      "Portfolios make you hunt for the one thing you care about. A recruiter and a hackathon teammate want different answers, fast.",
    insight:
      "Let people ask. The data is structured anyway, so an assistant can answer with specifics instead of vibes.",
    build:
      "A local, deterministic assistant over a structured profile, with a command palette and project intelligence, built to drop in a real LLM later with no key required to demo.",
    state: "In progress — the version you're using now.",
    next: "Wire a real model behind the same interface and add per-project deep dives.",
  },
  tags: ["portfolio", "ai", "assistant", "design", "os"],
  featured: false,
  healthcareRelated: false,
  aiRelated: true,
  designRelated: true,
};

/* ---- merged projects: base content.ts copy + intelligence ---- */
export const fullProjects: FullProject[] = [
  ...baseProjects
    .filter((p) => intel[p.id])
    .map((p) => ({ ...p, ...intel[p.id] })),
  jethroOs,
];

export const projectById = (id: string) => fullProjects.find((p) => p.id === id);

export const featuredProjects = fullProjects.filter((p) => p.featured);
export const healthcareProjects = fullProjects.filter((p) => p.healthcareRelated);
export const aiProjects = fullProjects.filter((p) => p.aiRelated);
export const designProjects = fullProjects.filter((p) => p.designRelated);

/* ---- the person ---- */
export const profile = {
  name: site.name,
  shortIdentity: "Nursing student who loves to build.",
  // reuse the homepage's own voice
  shortBio:
    "I'm a nursing student who loves to build. Most of what I make comes from things I wish existed in healthcare, research, or the tools people use every day. Some of it is serious, and some of it is just for fun.",
  longBio: about.body.join(" "),
  builderIdentity:
    "I build at the intersection of healthcare, AI, design, and everyday tools. The work is shaped by nursing, clinical rotations, and research workflows, and by a low tolerance for software that makes someone's day harder. I notice friction in a real environment, then build something around it.",
  themes: [
    "Healthcare",
    "AI tools",
    "Nursing & clinical context",
    "Research workflows",
    "Product design",
    "Useful consumer apps",
    "Playful internet projects",
  ],
  // honest, no invented metrics or employers
  highlights: [
    "Ships full products solo — NurseJet, Rate My Hospital Food, and the Emotion Stock Market Game are all end-to-end builds.",
    "Shaped the UX of Lab Logger, an AI research notebook (lab-logger.com).",
    "Nursing student with clinical rotations across several hospital systems — the healthcare context is firsthand, not researched.",
    "Comfortable wiring real ML into the browser (live face tracking in the game).",
    "Writes for the reader, not the journal — NurseJet's whole point is a citation plus a bedside takeaway.",
  ],
  // editable "currently building" cards
  currentFocus: [
    {
      project: "NurseJet",
      status: "Live · publishing daily",
      improving: "Sharper specialty filtering and faster-to-act briefs.",
      why: "It only works if a nurse can trust it and use it on shift.",
    },
    {
      project: "Lab Logger",
      status: "Live · ongoing UX",
      improving: "The path from raw capture to a trustworthy AI summary.",
      why: "Documentation has to feel lighter than the experiment it records.",
    },
    {
      project: "Jethro OS (this site)",
      status: "In progress",
      improving: "The Ask-Jethro assistant and per-project deep dives.",
      why: "People should be able to ask what I build instead of digging for it.",
    },
  ],
  contactEmail: contact.links.find((l) => l.label === "Email")?.href ?? "",
  github: contact.links.find((l) => l.label === "GitHub")?.href ?? "",
};

/* ---- "Invite Jethro" / hackathon mode ---- */
export const invite = {
  pitch30:
    "Jethro is a nursing student who ships real products. He builds at the intersection of healthcare, AI, and design — NurseJet (a daily clinical briefing for nurses), Lab Logger (an AI research notebook he shaped the UX for), and a face-controlled stock-market game, among others. Invite him when you want someone who has actually stood in the rooms these tools are for, and can still turn a vague idea into a working build fast.",
  whyHackathon:
    "Invite Jethro if you want someone who can turn a vague idea into a working product quickly. He brings a mix you don't usually get in one person: real nursing and clinical context, product taste, and the energy to build with AI instead of just talking about it. He pitches from problems he's actually seen, not from a slide.",
  goodFor: [
    { who: "Hackathons", line: "Turns a loose idea into a working demo fast, and brings real healthcare problems worth solving." },
    { who: "Healthcare / clinical AI teams", line: "Firsthand clinical context most teams have to go research. He knows what would actually get used on a unit." },
    { who: "Early product / startup teams", line: "Ships end-to-end and cares about the product feeling useful, not bloated." },
    { who: "Design / product collaborations", line: "Shaped Lab Logger's UX; he thinks about trust, speed, and the first-run experience." },
    { who: "Research tooling", line: "Has built directly for research documentation and AI-assisted analysis." },
  ],
};

/* ---- starter questions for the assistant's empty state ---- */
/* the few starter prompts shown in the assistant's empty state */
export const suggestedQuestions: string[] = [
  "What has he built?",
  "Healthcare AI projects",
  "Why invite him to a hackathon?",
  "What is Lab Logger?",
  "Tell me about NurseJet",
];
