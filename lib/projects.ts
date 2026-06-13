/* ============================================================
   PROJECT DATA — "Flowsheet"
   The single source of truth for selected work and case-study
   pages. Curated to a few real projects; Lab Logger leads.
   Monochrome system: no per-project accent colors — the one
   clinical teal (--accent) is applied uniformly in the UI.
   ============================================================ */

export type ProjectCategory = "Healthcare" | "AI" | "Product" | "Experiment";

export type ProjectStatus = "Live" | "In progress" | "Beta" | "Research";

export interface CaseStudyBlock {
  kind: "lead" | "section";
  kicker?: string;
  heading?: string;
  body: string[];
}

export interface ProjectMetric {
  label: string;
  value: string;
}

/**
 * Live, in-page preview config for a project.
 * `embeddable` is set from the site's real X-Frame-Options / CSP
 * frame-ancestors headers — when false, the UI never mounts an
 * iframe and instead offers a prominent "Open live" link.
 */
export interface ProjectLive {
  url: string;
  embeddable: boolean;
  /** Permissions-Policy for the iframe, e.g. "camera". Camera only — never microphone. */
  allow?: string;
  /** Honest pre-launch consent line (shown with the Play button). */
  consent?: string;
  /** Overlay text while the iframe loads, e.g. "Loading model…". */
  loadingNote?: string;
  /** Label for the launch / external-open affordance. */
  openLabel?: string;
  /**
   * Custom fullscreen play experience instead of a plain inline iframe.
   * "emotion" → the Emotion Stock Market game + a face-tracking panel.
   * Requires a same-origin `url`.
   */
  experience?: "emotion";
}

export interface Project {
  slug: string;
  title: string;
  /** One-line outcome shown on the work index */
  outcome: string;
  /** Longer summary for the case-study hero */
  summary: string;
  category: ProjectCategory;
  status: ProjectStatus;
  year: string;
  role: string;
  /** Two-digit index, flowsheet style */
  index: string;
  stack: string[];
  metrics: ProjectMetric[];
  links?: { label: string; href: string }[];
  live?: ProjectLive;
  caseStudy: CaseStudyBlock[];
}

/* Curated, Lab Logger first. Each entry gets a /work/<slug> case study. */
export const projects: Project[] = [
  {
    slug: "lab-logger",
    title: "Lab Logger",
    outcome:
      "Log a lab value in seconds and read it against its reference range — the way a clinician already thinks.",
    summary:
      "A focused tool for recording laboratory results and watching them trend over time. Built so a value can be entered in seconds and immediately read in context — against its reference range and its own history.",
    category: "Healthcare",
    status: "Beta",
    year: "2024",
    role: "Design · Engineering",
    index: "01",
    stack: ["React", "TypeScript", "IndexedDB", "PWA"],
    // metrics intentionally empty — no verified numbers to show (no invented stats)
    metrics: [],
    links: [{ label: "Open live", href: "https://lab-logger.com" }],
    // www.lab-logger.com sends X-Frame-Options: DENY + frame-ancestors 'none'
    // → not embeddable; the UI falls back to a poster + "Open live" button.
    live: {
      url: "https://lab-logger.com",
      embeddable: false,
      openLabel: "Open live",
    },
    caseStudy: [
      {
        kind: "lead",
        body: [
          "A single lab value is noise; the same value across six weeks is a story. Lab Logger is built around that trajectory — entry is fast, and the trend is legible the moment a value lands.",
          "It comes directly out of bedside work: the gap between charting a result and actually understanding it is wider than most software admits.",
        ],
      },
      {
        kind: "section",
        kicker: "Design",
        heading: "Fast in, clear out",
        body: [
          "Entry is built for muscle memory: recent panels surface first, units are remembered, and the reference range shades the field as you type.",
          "Trends render as quiet, annotated sparklines — the line, the range band, and the inflection points that deserve a second look. Nothing decorative.",
        ],
      },
      {
        kind: "section",
        kicker: "Engineering",
        heading: "Offline by default",
        body: [
          "Clinical settings have unreliable connectivity, so data lives locally first and syncs opportunistically. It works in a Wi-Fi dead zone, which is where it's often needed.",
        ],
      },
    ],
  },
  {
    slug: "emotion-stock-market",
    title: "Emotion Stock Market",
    outcome:
      "Trade a simulated market with your face — your expressions move the prices, read in your browser by a webcam.",
    summary:
      "A browser game where your facial expressions drive a live, simulated market. The webcam feed is read on-device by face-api.js — no video ever leaves the browser — and your detected mood nudges prices in real time.",
    category: "Experiment",
    status: "Live",
    year: "2025", // verify
    role: "Design · Engineering",
    index: "02",
    stack: ["Vanilla JS", "face-api.js", "TensorFlow.js"],
    metrics: [
      { label: "Inference", value: "On-device" },
      { label: "Camera", value: "Local only" },
      { label: "Upload", value: "None" },
    ],
    links: [{ label: "Open game", href: "/stock-game/index.html" }],
    // Self-hosted Bloomberg-terminal rebuild. `experience: "emotion"` routes the
    // Work card to the dedicated full-screen /work/emotion-stock-market page.
    live: {
      url: "/stock-game/index.html",
      embeddable: true,
      allow: "camera", // camera ONLY — never microphone
      experience: "emotion",
      consent:
        "This game uses your camera to read your facial expressions. It runs entirely in your browser; nothing is recorded or uploaded.",
      openLabel: "Open game",
    },
    caseStudy: [
      {
        kind: "lead",
        body: [
          "Most demos that touch a webcam quietly ship your face to a server. This one doesn't. The Emotion Stock Market reads your expression on-device with face-api.js and turns it into market pressure — react, and the ticker reacts back, all without a single frame leaving the browser.",
          "It's a toy with a point: real-time computer vision can be genuinely private when the inference runs where the data already is.",
        ],
      },
      {
        kind: "section",
        kicker: "Approach",
        heading: "On-device by design",
        body: [
          "face-api.js loads a few megabytes of model weights on start, then runs inference in a loop against the webcam stream. The detected emotion is mapped to buy/sell pressure on a simulated ticker.",
          "The camera permission is the only ask. The video stream stays in the tab — there is no upload path, by construction.",
        ],
      },
    ],
  },
  {
    slug: "nursejet",
    title: "NurseJet",
    outcome:
      "A daily clinical brief for nurses where every claim is traceable to its source.",
    summary:
      "A personalized daily brief for working nurses — distilling research, policy, and practice updates into a calm edition. Nothing publishes unless it traces back to a verifiable source.",
    category: "Healthcare",
    status: "Live",
    year: "2025",
    role: "Founder · Design · Engineering",
    index: "03",
    stack: ["TanStack Start", "TypeScript", "Postgres", "Edge"],
    metrics: [],
    caseStudy: [
      {
        kind: "lead",
        body: [
          "Nurses are short on time and long on information. NurseJet turns the firehose of clinical research, policy shifts, and practice news into one calm daily edition.",
          "The hard constraint is sourcing: every generated sentence is grounded against its source, and anything that can't be grounded is dropped before a human sees it.",
        ],
      },
      {
        kind: "section",
        kicker: "The build",
        heading: "An editorial pipeline that publishes itself",
        body: [
          "A scheduled pipeline ingests vetted sources, ranks them for relevance to practicing nurses, drafts a tight summary, and runs a grounding pass that rejects anything unsupported.",
          "A fresh edition publishes every day from a single command — no manual seeding, no hand-editing. The system is the editor.",
        ],
      },
    ],
  },
  {
    slug: "cleo",
    title: "Cleo",
    outcome:
      "Turns a photo, a paste, or a dictated note into a structured, validated lab entry — and only asks when it's genuinely unsure.",
    summary:
      "The conversational front door to Lab Logger. Give it a screenshot, a sentence, or a voice memo and it produces a clean, validated entry — interrupting with a question only when ambiguity would change the record.",
    category: "AI",
    status: "In progress",
    year: "2026",
    role: "Product · AI engineering",
    index: "04",
    stack: ["Claude", "Tool use", "Vision", "TypeScript"],
    metrics: [],
    caseStudy: [
      {
        kind: "lead",
        body: [
          "Structured data entry is where good intentions go to die. Cleo removes the form: you give it whatever you have, and it produces a clean, validated lab entry.",
          "The intelligence is in restraint. It interrupts only when ambiguity would actually change the record — otherwise it gets out of the way.",
        ],
      },
      {
        kind: "section",
        kicker: "Approach",
        heading: "Confidence-gated questions",
        body: [
          "Each extracted field carries a confidence score. High-confidence fields commit silently; low-confidence fields trigger a single specific question rather than a wall of validation.",
          "Vision handles the photographed-printout case; tool use enforces the schema, so the model can't invent a field that doesn't exist.",
        ],
      },
    ],
  },
  {
    slug: "ratemyhospitalfood",
    title: "RateMyHospitalFood",
    outcome:
      "Crowd-sourced, photo-backed reviews of hospital food, mapped to real facilities.",
    summary:
      "A review platform for hospital food — letting patients, families, and staff rate and photograph meals so people know what to expect during a stay.",
    category: "Product",
    status: "Live",
    year: "2024",
    role: "Founder · Full-stack",
    index: "05",
    stack: ["Next.js", "TypeScript", "Postgres", "Maps"],
    metrics: [],
    caseStudy: [
      {
        kind: "lead",
        body: [
          "Hospital food is a universal experience and a totally undocumented one. RateMyHospitalFood gives it a home — ratings, photos, and honest notes mapped to real facilities.",
          "It started small and turned out to be quietly useful: families planning a visit, patients bracing for a stay, staff comparing notes across units.",
        ],
      },
      {
        kind: "section",
        kicker: "Why it works",
        heading: "Low stakes, high candor",
        body: [
          "Because nobody feels self-conscious rating a tray, the data is refreshingly candid — and candor is what makes a review platform worth visiting.",
        ],
      },
    ],
  },
];

/**
 * A quiet index of additional work — listed, not full case studies.
 * Research Radar & Vitals were removed (not confirmed as real, shipped work).
 * Add entries here only with verified title/outcome/meta.
 */
export const moreWork: {
  title: string;
  outcome: string;
  meta: string;
}[] = [];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
