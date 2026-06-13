/* ============================================================
   PROJECT DATA
   The single source of truth for featured work, the archive,
   and case-study pages. Content is placeholder-grade but
   structured to feel real and to expand cleanly.
   ============================================================ */

export type ProjectCategory =
  | "Healthcare"
  | "AI"
  | "Research"
  | "Product"
  | "Experiment";

export type ProjectStatus = "Live" | "In progress" | "Beta" | "Concept" | "Research";

export interface CaseStudyBlock {
  kind: "lead" | "section";
  /** Eyebrow / kicker shown above the heading */
  kicker?: string;
  heading?: string;
  /** Paragraphs of body copy */
  body: string[];
}

export interface ProjectMetric {
  label: string;
  value: string;
}

export interface Project {
  slug: string;
  title: string;
  /** One-line positioning shown on cards */
  tagline: string;
  /** Longer summary for the case-study hero */
  summary: string;
  category: ProjectCategory;
  status: ProjectStatus;
  year: string;
  role: string;
  /** Featured projects render large on the home page */
  featured: boolean;
  /** Accent token name used for gradients & glows */
  accent: "iris" | "aqua" | "coral" | "gold";
  /** Short monospaced index e.g. "01" */
  index: string;
  stack: string[];
  tags: string[];
  metrics: ProjectMetric[];
  links?: { label: string; href: string }[];
  caseStudy: CaseStudyBlock[];
}

export const ACCENT_HEX: Record<Project["accent"], string> = {
  iris: "#6d5ef8",
  aqua: "#4fd9c8",
  coral: "#ff8a5b",
  gold: "#f4c45a",
};

export const projects: Project[] = [
  {
    slug: "nursejet",
    title: "NurseJet",
    tagline: "A daily, trustworthy Discover feed built for nurses.",
    summary:
      "A personalized news and knowledge surface for working nurses — distilling research, policy, and clinical updates into a calm daily edition where every claim is traceable to a real source.",
    category: "Healthcare",
    status: "Live",
    year: "2025",
    role: "Founder · Design · Engineering",
    featured: true,
    accent: "aqua",
    index: "01",
    stack: ["TanStack Start", "TypeScript", "Postgres", "LLM pipeline", "Edge"],
    tags: ["Healthcare", "AI", "Editorial", "Mobile"],
    metrics: [
      { label: "Daily editions", value: "365/yr" },
      { label: "Citation accuracy", value: "100%" },
      { label: "Read time", value: "~4 min" },
    ],
    links: [{ label: "Visit site", href: "#" }],
    caseStudy: [
      {
        kind: "lead",
        body: [
          "Nurses are drowning in information and starved for context. NurseJet is a daily Discover-style feed that turns the firehose of clinical research, policy shifts, and practice news into a single, calm edition you can read with your morning coffee.",
          "The hard constraint — and the entire reason it can be trusted — is citation honesty: nothing is published unless it traces back to a verifiable source. No hallucinated studies, no invented statistics.",
        ],
      },
      {
        kind: "section",
        kicker: "The problem",
        heading: "Trust is the product",
        body: [
          "Health misinformation spreads fastest when it's convenient. A summary that's 95% right is worse than no summary at all when a clinical decision hangs on it.",
          "So the editorial pipeline is built backwards from trust: every generated sentence is grounded against its source, and anything that can't be grounded is dropped before a human ever sees it.",
        ],
      },
      {
        kind: "section",
        kicker: "The build",
        heading: "An editorial pipeline that publishes itself",
        body: [
          "A scheduled pipeline ingests vetted sources, ranks them for relevance to practicing nurses, drafts a tight summary, and runs a grounding pass that rejects anything unsupported.",
          "The result publishes a fresh edition every day with a single command — no manual SQL, no seeding, no hand-editing. The system is the editor.",
        ],
      },
    ],
  },
  {
    slug: "lab-logger",
    title: "Lab Logger",
    tagline: "Capture, trend, and understand lab values without the spreadsheet tax.",
    summary:
      "A focused tool for logging laboratory results and watching them trend over time — designed so a busy clinician or patient can enter a value in seconds and immediately see what it means in context.",
    category: "Healthcare",
    status: "Beta",
    year: "2025",
    role: "Design · Engineering",
    featured: true,
    accent: "iris",
    index: "02",
    stack: ["React", "TypeScript", "IndexedDB", "Charting", "PWA"],
    tags: ["Healthcare", "Data viz", "Product"],
    metrics: [
      { label: "Entry time", value: "<10s" },
      { label: "Offline", value: "First-class" },
      { label: "Panels", value: "40+" },
    ],
    links: [{ label: "Open app", href: "#" }],
    caseStudy: [
      {
        kind: "lead",
        body: [
          "Lab values only make sense as a trajectory. A single potassium reading is noise; the same value across six weeks is a story. Lab Logger is built around that trajectory.",
          "The design goal was brutal speed of entry paired with instantly legible trends — so the moment a value lands, you see whether it's drifting toward something that matters.",
        ],
      },
      {
        kind: "section",
        kicker: "Design",
        heading: "Fast in, clear out",
        body: [
          "Entry is optimized for muscle memory: recent panels surface first, units are remembered, and reference ranges shade the input as you type.",
          "Trends render as calm, annotated sparklines — no chart-junk, just the line, the range band, and the inflection points that deserve attention.",
        ],
      },
      {
        kind: "section",
        kicker: "Engineering",
        heading: "Offline by default",
        body: [
          "Clinical settings have unreliable connectivity, so data lives locally first and syncs opportunistically. The app is a PWA that works on a hospital Wi‑Fi dead zone.",
        ],
      },
    ],
  },
  {
    slug: "cleo",
    title: "Cleo",
    tagline: "An AI entry assistant that turns messy notes into clean lab records.",
    summary:
      "Cleo is the conversational front door to Lab Logger — paste a result, snap a photo, or dictate it, and Cleo structures it into a validated entry, asking only when it's genuinely unsure.",
    category: "AI",
    status: "In progress",
    year: "2026",
    role: "Product · AI Engineering",
    featured: true,
    accent: "coral",
    index: "03",
    stack: ["Claude", "Tool use", "Vision", "TypeScript", "Streaming"],
    tags: ["AI", "Healthcare", "Assistant"],
    metrics: [
      { label: "Parse accuracy", value: "High" },
      { label: "Modalities", value: "Text · Photo · Voice" },
      { label: "Clarifying Qs", value: "Only when unsure" },
    ],
    caseStudy: [
      {
        kind: "lead",
        body: [
          "Structured data entry is where good intentions go to die. Cleo removes the form: you give it whatever you have — a screenshot, a sentence, a voice memo — and it produces a clean, validated lab entry.",
          "The intelligence is in restraint. Cleo only interrupts to ask a question when ambiguity would actually change the record. Otherwise it gets out of the way.",
        ],
      },
      {
        kind: "section",
        kicker: "Approach",
        heading: "Confidence-gated questions",
        body: [
          "Each extracted field carries a confidence score. High-confidence fields commit silently; low-confidence fields trigger a single, specific clarifying question rather than a wall of form validation.",
          "Vision handles the photographed-printout case; tool use enforces the schema so the model can't invent a field that doesn't exist.",
        ],
      },
    ],
  },
  {
    slug: "ratemyhospitalfood",
    title: "RateMyHospitalFood",
    tagline: "Crowd-sourced honesty about the meal at the end of the hall.",
    summary:
      "A playful but genuinely useful review platform for hospital food — letting patients, families, and staff rate and photograph meals so people know what to expect during a stay.",
    category: "Product",
    status: "Live",
    year: "2024",
    role: "Founder · Full-stack",
    featured: false,
    accent: "gold",
    index: "04",
    stack: ["Next.js", "TypeScript", "Postgres", "Maps", "Image pipeline"],
    tags: ["Product", "Community", "Maps"],
    metrics: [
      { label: "Hospitals", value: "Growing" },
      { label: "Vibe", value: "Seriously fun" },
    ],
    caseStudy: [
      {
        kind: "lead",
        body: [
          "Hospital food is a universal experience and a totally undocumented one. RateMyHospitalFood gives that experience a home — ratings, photos, and honest notes mapped to real facilities.",
          "It started as a joke and turned out to be quietly useful: families planning a visit, patients bracing for a stay, staff comparing notes.",
        ],
      },
      {
        kind: "section",
        kicker: "Why it works",
        heading: "Low stakes, high honesty",
        body: [
          "Because nobody feels self-conscious rating a tray of jello, the data is refreshingly candid — and candor is exactly what makes a review platform worth visiting.",
        ],
      },
    ],
  },
  {
    slug: "jalantir",
    title: "Jalantir",
    tagline: "Privacy-first search across San Francisco's public cameras.",
    summary:
      "A natural-language search layer over public camera feeds in San Francisco, designed privacy-first — a hard query filter sits at the ethical core, refusing to become a surveillance tool for tracking people.",
    category: "AI",
    status: "Concept",
    year: "2026",
    role: "Design · Engineering · Ethics",
    featured: true,
    accent: "iris",
    index: "05",
    stack: ["Next.js", "Vision", "Vector search", "Rate limiting", "Edge"],
    tags: ["AI", "Privacy", "Civic", "Vision"],
    metrics: [
      { label: "Privacy filter", value: "Non-negotiable" },
      { label: "Scope", value: "Public infra only" },
    ],
    caseStudy: [
      {
        kind: "lead",
        body: [
          "Jalantir explores a hard question: can you build a genuinely useful search over public camera infrastructure without building a surveillance machine? The answer is a design constraint, not an afterthought.",
          "A privacy filter sits at the core of the system and is non-negotiable — queries that target or track individuals are refused by construction.",
        ],
      },
      {
        kind: "section",
        kicker: "Ethics as architecture",
        heading: "The filter is the feature",
        body: [
          "Rather than bolting on a policy, the refusal logic is the spine of the product. It runs before retrieval, shapes what's even searchable, and is the part of the codebase that never gets 'simplified away.'",
          "Everything else — the speed, the natural-language layer, the map — is in service of demonstrating that civic tooling can be powerful and principled at once.",
        ],
      },
    ],
  },
  {
    slug: "nursing-research-radar",
    title: "Research Radar",
    tagline: "Surfacing the nursing research that actually changes practice.",
    summary:
      "A monitoring tool that scans new nursing and clinical research, filters for studies with real bedside implications, and summarizes them in plain language for working clinicians.",
    category: "Research",
    status: "Research",
    year: "2025",
    role: "Research · Engineering",
    featured: false,
    accent: "aqua",
    index: "06",
    stack: ["Python", "LLM", "Retrieval", "Scheduling"],
    tags: ["Research", "AI", "Healthcare"],
    metrics: [
      { label: "Focus", value: "Practice-changing" },
      { label: "Output", value: "Plain language" },
    ],
    caseStudy: [
      {
        kind: "lead",
        body: [
          "Most research never reaches the bedside because nobody has time to read it. Research Radar narrows the firehose to the small set of studies that should actually change how care is delivered.",
        ],
      },
      {
        kind: "section",
        kicker: "Method",
        heading: "Signal over volume",
        body: [
          "The filter prioritizes effect size, applicability, and methodology — then translates the survivors into a paragraph a charge nurse can act on between rounds.",
        ],
      },
    ],
  },
  {
    slug: "vitals-design-system",
    title: "Vitals",
    tagline: "A design system tuned for clinical clarity under pressure.",
    summary:
      "A reusable component and token system for healthcare interfaces — accessible by default, legible at a glance, and calm under the cognitive load of a clinical environment.",
    category: "Product",
    status: "In progress",
    year: "2026",
    role: "Design Systems",
    featured: false,
    accent: "coral",
    index: "07",
    stack: ["React", "Tailwind", "Radix", "Tokens", "Storybook"],
    tags: ["Design system", "Accessibility", "Healthcare"],
    metrics: [
      { label: "Contrast", value: "AAA targets" },
      { label: "Components", value: "Composable" },
    ],
    caseStudy: [
      {
        kind: "lead",
        body: [
          "Clinical software is used by exhausted people in high-stakes moments. Vitals is an opinionated design system that optimizes for legibility, error-resistance, and calm — the opposite of the dense dashboards most EHRs ship.",
        ],
      },
      {
        kind: "section",
        kicker: "Principles",
        heading: "Calm, legible, forgiving",
        body: [
          "Every component is built around a triage of needs: can you read it at a glance, can you act without error, and does it stay calm when everything else isn't.",
        ],
      },
    ],
  },
  {
    slug: "field-notes",
    title: "Field Notes",
    tagline: "An evolving lab of interface and motion experiments.",
    summary:
      "A rotating set of small interactive experiments — motion studies, layout ideas, and interaction prototypes that feed the polish of everything else.",
    category: "Experiment",
    status: "In progress",
    year: "2026",
    role: "Play · Craft",
    featured: false,
    accent: "gold",
    index: "08",
    stack: ["WebGL", "Framer Motion", "Canvas", "Shaders"],
    tags: ["Experiment", "Motion", "Craft"],
    metrics: [
      { label: "Cadence", value: "Always-on" },
      { label: "Purpose", value: "Sharpen the craft" },
    ],
    caseStudy: [
      {
        kind: "lead",
        body: [
          "Field Notes is where ideas get to be unserious. It's a sandbox of motion studies and interaction experiments — the place where the microinteractions that make the real products feel alive get invented first.",
        ],
      },
    ],
  },
];

export const featuredProjects = projects.filter((p) => p.featured);
export const archiveProjects = projects;

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export const allCategories: ProjectCategory[] = [
  "Healthcare",
  "AI",
  "Research",
  "Product",
  "Experiment",
];
