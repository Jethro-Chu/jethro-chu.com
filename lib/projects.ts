/* ============================================================
   PROJECT DATA: "Telemetry"
   The single source of truth for selected work and case-study
   pages. Every project is real and shown with EQUAL weight; each
   carries its own healthcare-grounded color THEME (scoped CSS
   vars) so the shared components recolor per project while the
   type, grid, and quality stay identical. No em-dashes in prose.
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
 * Per-project color theme. The SAME token names are scoped onto the
 * project's section so every shared component (glyph, range bar, type)
 * recolors automatically. Distinct hue, identical structure. Every
 * text color is AA on its own background (verified in review).
 */
export interface ProjectTheme {
  /** short, honest name of the color source, e.g. "Reference-range teal" */
  label: string;
  /** true for the dark terminal theme (Emotion Stock Market) */
  dark?: boolean;
  bg: string;
  surface: string;
  surfaceSunk: string;
  ink: string;
  muted: string;
  line: string;
  /** mid-tone brand hue: AA as text + marks on bg */
  primary: string;
  /** deeper hue: hover, headings on tint */
  primaryDeep: string;
  /** flat tint of the hue (band/backplate), never a gradient */
  wash: string;
  /** text/glyph placed on a primary FILL */
  onPrimary: string;
}

/**
 * Live, in-page preview config. `embeddable` is set from the site's
 * real X-Frame-Options / CSP frame-ancestors headers. When false the
 * UI never mounts an iframe and offers a prominent "Open live" link.
 */
export interface ProjectLive {
  url: string;
  embeddable: boolean;
  /** Permissions-Policy for the iframe, e.g. "camera". Camera only, never microphone. */
  allow?: string;
  /** Honest pre-launch consent line (shown with the Play button). */
  consent?: string;
  /** Overlay text while the iframe loads, e.g. "Loading model". */
  loadingNote?: string;
  /** Label for the launch / external-open affordance. */
  openLabel?: string;
  /**
   * Custom fullscreen play experience instead of a plain inline iframe.
   * "emotion" routes to the Emotion Stock Market full-screen page.
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
  theme: ProjectTheme;
  /** Real screenshot at /shots/<slug>.* when one exists; else a bespoke poster renders. */
  shot?: string;
  links?: { label: string; href: string }[];
  live?: ProjectLive;
  caseStudy: CaseStudyBlock[];
}

/* Curated, real work shown with equal weight. Each gets a /work/<slug> case study. */
export const projects: Project[] = [
  {
    slug: "lab-logger",
    title: "Lab Logger",
    outcome:
      "Describe an experiment in plain language. It writes the work up, organizes it, and remembers it, so the lab notebook finally keeps up with the bench.",
    summary:
      "An AI lab notebook for the bench. You capture what you did in plain language, by a quick note or by voice, and it produces a written-up, organized, searchable record of every experiment. Built so the documentation keeps up with the work instead of lagging a week behind it.",
    category: "Healthcare",
    status: "Beta",
    year: "2024",
    role: "Design · Engineering",
    index: "01",
    stack: ["React", "TypeScript", "LLMs", "PWA"],
    // metrics intentionally empty: no verified numbers to show (no invented stats).
    metrics: [],
    theme: {
      label: "Lab-notebook teal",
      bg: "#eef4f1",
      surface: "#fbfdfc",
      surfaceSunk: "#e2ece8",
      ink: "#0e1a16",
      muted: "#4f5f59",
      line: "#cad7d1",
      primary: "#0b6e59",
      primaryDeep: "#07533f",
      wash: "#e2eee9",
      onPrimary: "#ffffff",
    },
    shot: "/shots/lab-logger.jpg",
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
          "Lab work moves faster than the writing up. By the time the notebook is current, you are three experiments past it and the details have blurred. Lab Logger closes that gap: you capture the work as you do it, in plain language, and the system does the writing up.",
          "It is the notebook a researcher actually keeps, because keeping it costs almost nothing.",
        ],
      },
      {
        kind: "section",
        kicker: "Capture",
        heading: "Say what you did, not how to file it",
        body: [
          "Describe an experiment the way you would tell a labmate: western blot, phospho-ERK, HEK293 lysate. Cleo, the natural-language layer, turns that into a structured entry and asks a question only when something is genuinely missing.",
          "Removing that friction is the whole point. A notebook that keeps up with the bench is one you can actually trust later.",
        ],
      },
      {
        kind: "section",
        kicker: "The model",
        heading: "It writes up, organizes, and remembers",
        body: [
          "A language model turns scattered captures into a clean write-up: methods, reagents, conditions, and results, ordered the way a protocol is. Each experiment becomes searchable, so the record answers questions instead of just storing them.",
          "The bar is set at the bench: it has to survive a real experiment on a real deadline, gloves on.",
        ],
      },
    ],
  },
  {
    slug: "emotion-stock-market",
    title: "Emotion Stock Market",
    outcome:
      "Trade a simulated market with your face. Your expressions move the prices, read in your browser by a webcam.",
    summary:
      "A browser game where your facial expressions drive a live, simulated market. The webcam feed is read on-device by face-api.js (no video ever leaves the browser), and your detected mood nudges prices in real time.",
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
    theme: {
      label: "Terminal amber",
      dark: true,
      bg: "#0a0a0a",
      surface: "#121212",
      surfaceSunk: "#0d0d0d",
      ink: "#e8e8e8",
      muted: "#8a8a8a",
      line: "#262626",
      primary: "#ffa028",
      primaryDeep: "#c77a12",
      wash: "#1a1206",
      onPrimary: "#1a1206",
    },
    links: [{ label: "Launch terminal", href: "/work/emotion-stock-market" }],
    // Self-hosted Bloomberg-terminal rebuild. `experience: "emotion"` routes the
    // Work card to the dedicated full-screen /work/emotion-stock-market page.
    live: {
      url: "/stock-game/index.html",
      embeddable: true,
      allow: "camera", // camera ONLY, never microphone
      experience: "emotion",
      consent:
        "This game uses your camera to read your facial expressions. It runs entirely in your browser; nothing is recorded or uploaded.",
      openLabel: "Open game",
    },
    caseStudy: [
      {
        kind: "lead",
        body: [
          "Most demos that touch a webcam quietly ship your face to a server. This one doesn't. The Emotion Stock Market reads your expression on-device with face-api.js and turns it into market pressure. React, and the ticker reacts back, all without a single frame leaving the browser.",
          "It's a toy with a point: real-time computer vision can be genuinely private when the inference runs where the data already is.",
        ],
      },
      {
        kind: "section",
        kicker: "Approach",
        heading: "On-device by design",
        body: [
          "face-api.js loads a few megabytes of model weights on start, then runs inference in a loop against the webcam stream. The detected emotion is mapped to buy/sell pressure on a simulated ticker.",
          "The camera permission is the only ask. The video stream stays in the tab. There is no upload path, by construction.",
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
      "A personalized daily brief for working nurses, distilling research, policy, and practice updates into a calm edition. Nothing publishes unless it traces back to a verifiable source.",
    category: "Healthcare",
    status: "Live",
    year: "2025",
    role: "Founder · Design · Engineering",
    index: "03",
    stack: ["TanStack Start", "TypeScript", "Postgres", "Edge"],
    metrics: [],
    theme: {
      label: "Monitor blue",
      bg: "#eef2f7",
      surface: "#fbfcfe",
      surfaceSunk: "#e1e8f1",
      ink: "#0f1a24",
      muted: "#4d5965",
      line: "#cbd6e1",
      primary: "#1a6098",
      primaryDeep: "#134a78",
      wash: "#dce8f3",
      onPrimary: "#ffffff",
    },
    shot: "/shots/nursejet.jpg",
    links: [{ label: "Open live", href: "https://nursejet.org" }],
    live: { url: "https://nursejet.org", embeddable: false, openLabel: "Open live" },
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
          "A fresh edition publishes every day from a single command. No manual seeding, no hand-editing. The system is the editor.",
        ],
      },
    ],
  },
  {
    slug: "cleo",
    title: "Cleo",
    outcome:
      "Turns a photo, a paste, or a dictated note into a structured, validated lab entry, and only asks when it's genuinely unsure.",
    summary:
      "The conversational front door to Lab Logger. Give it a screenshot, a sentence, or a voice memo and it produces a clean, validated entry, interrupting with a question only when ambiguity would change the record.",
    category: "AI",
    status: "In progress",
    year: "2026",
    role: "Product · AI engineering",
    index: "04",
    stack: ["Claude", "Tool use", "Vision", "TypeScript"],
    metrics: [],
    theme: {
      label: "Histology stain",
      bg: "#f5edf2",
      surface: "#fdfafc",
      surfaceSunk: "#ecdde7",
      ink: "#21121c",
      muted: "#5d4d57",
      line: "#e0ccd8",
      primary: "#9a2e6b",
      primaryDeep: "#74204f",
      wash: "#eedde8",
      onPrimary: "#ffffff",
    },
    // Cleo is the in-progress AI front door to Lab Logger; its real hands-free
    // capture demo lives on lab-logger.com, so the shot is that actual feature
    // and the link goes there (no fabricated standalone UI).
    shot: "/shots/cleo.jpg",
    links: [{ label: "See Cleo live", href: "https://lab-logger.com/cleo" }],
    live: {
      url: "https://lab-logger.com/cleo",
      embeddable: false,
      openLabel: "See Cleo live",
    },
    caseStudy: [
      {
        kind: "lead",
        body: [
          "Structured data entry is where good intentions go to die. Cleo removes the form: you give it whatever you have, and it produces a clean, validated lab entry.",
          "The intelligence is in restraint. It interrupts only when ambiguity would actually change the record. Otherwise it gets out of the way.",
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
      "A review platform for hospital food: patients, families, and staff rate and photograph meals so people know what to expect during a stay.",
    category: "Product",
    status: "Live",
    year: "2024",
    role: "Founder · Full-stack",
    index: "05",
    stack: ["Next.js", "TypeScript", "Postgres", "Maps"],
    metrics: [],
    theme: {
      label: "Nutrition clay",
      bg: "#f6f0e8",
      surface: "#fdfbf7",
      surfaceSunk: "#ece1d2",
      ink: "#221c12",
      muted: "#5d554a",
      line: "#e2d7c5",
      primary: "#9e5417",
      primaryDeep: "#7c4011",
      wash: "#efe4d4",
      onPrimary: "#ffffff",
    },
    shot: "/shots/ratemyhospitalfood.jpg",
    links: [{ label: "Open live", href: "https://ratemyhospitalfood.com" }],
    live: {
      url: "https://ratemyhospitalfood.com",
      embeddable: false,
      openLabel: "Open live",
    },
    caseStudy: [
      {
        kind: "lead",
        body: [
          "Hospital food is a universal experience and a totally undocumented one. RateMyHospitalFood gives it a home: ratings, photos, and honest notes mapped to real facilities.",
          "It started small and turned out to be quietly useful: families planning a visit, patients bracing for a stay, staff comparing notes across units.",
        ],
      },
      {
        kind: "section",
        kicker: "Why it works",
        heading: "Low stakes, high candor",
        body: [
          "Because nobody feels self-conscious rating a tray, the data is refreshingly candid, and candor is what makes a review platform worth visiting.",
        ],
      },
    ],
  },
];

/**
 * A quiet index of additional work, listed, not full case studies.
 * Add entries here only with a verified title/outcome/meta.
 */
export const moreWork: {
  title: string;
  outcome: string;
  meta: string;
}[] = [];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
