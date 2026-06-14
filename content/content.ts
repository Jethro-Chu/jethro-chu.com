/* ============================================================
   CONTENT  ·  the single editable source of truth
   All copy and project data live here so Jethro can revise words
   without touching components.

   >>> Everything marked PLACEHOLDER is a draft for Jethro to confirm
   or replace. Copy voice: active, specific, plain, sentence case,
   no em dashes, no filler. <<<
   ============================================================ */

export interface SectionMeta {
  /** anchor id used for nav + altimeter junctions */
  id: string;
  /** short nav label, sentence case */
  label: string;
  /** real trail landmark on the Half Dome route */
  landmark: string;
  /** elevation in feet (real) */
  elevation: number;
}

export interface Project {
  id: string;
  title: string;
  /** one-line role */
  role: string;
  stack: string[];
  /** 1-2 plain sentences: what it does and why it matters */
  summary: string;
  link?: { href: string; label: string };
  /** optional thumbnail under /public/images */
  thumbnail?: string;
  /** marks an unfilled slot so it renders as a clearly-labelled placeholder */
  placeholder?: boolean;
}

export const site = {
  name: "Jethro Chu",
  // PLACEHOLDER tagline — confirm with Jethro.
  tagline: "Nursing student who builds software between clinical shifts.",
  // meta description for search + social
  description:
    "Jethro Chu is a nursing student who builds healthcare, research, and AI software, including Lab Logger. His portfolio climbs from the Yosemite valley floor to the Half Dome summit.",
  url: "https://jethrochu.com",
} as const;

/* The five sections, mapped to real elevations on the Half Dome route.
   The altimeter reads from the first to the last of these. Real numbers,
   not decoration. */
export const sections: SectionMeta[] = [
  { id: "hero", label: "trailhead", landmark: "Happy Isles", elevation: 4000 },
  { id: "approach", label: "the approach", landmark: "Vernal and Nevada Falls", elevation: 5900 },
  { id: "projects", label: "projects", landmark: "Sub Dome", elevation: 8200 },
  { id: "about", label: "summit", landmark: "Half Dome summit", elevation: 8839 },
  { id: "contact", label: "the view", landmark: "Half Dome summit", elevation: 8839 },
];

export const ELEVATION_START = 4000;
export const ELEVATION_SUMMIT = 8839;

/* Section 2 — the approach (short intro / what I do). PLACEHOLDER. */
export const approach = {
  heading: "What I do",
  // Two or three plain sentences. Confirm with Jethro.
  body: [
    "I'm a nursing student, and I build software. Most of it is healthcare and research tools, like Lab Logger and NurseJet.",
    "I learned to build because the software I had to use kept getting in my way. So I started making my own.",
  ],
} as const;

/* Section 3 — projects. Lab Logger is seeded. Cards 2+ are drafts or
   clearly-labelled open slots. Confirm titles, summaries, and links. */
export const projects: Project[] = [
  {
    id: "lab-logger",
    title: "Lab Logger",
    role: "Design and engineering", // PLACEHOLDER role
    stack: ["Next.js", "TypeScript", "LLMs"],
    // PLACEHOLDER summary — confirm. Based on the live product (an AI lab notebook).
    summary:
      "An AI lab notebook for researchers. You describe an experiment in plain words and it writes it up, organizes it, and remembers it for you.",
    link: { href: "https://lab-logger.com", label: "lab-logger.com" },
  },
  {
    id: "nursejet",
    title: "NurseJet",
    role: "Founder, design, engineering", // PLACEHOLDER role
    stack: ["TanStack Start", "TypeScript", "Postgres"],
    // PLACEHOLDER summary — confirm.
    summary:
      "A daily brief for nurses. It turns clinical research and practice updates into a short read, and every claim traces back to its source.",
    link: { href: "https://nursejet.org", label: "nursejet.org" },
  },
  {
    // PLACEHOLDER open slot for Jethro: add a real project (title, role, stack,
    // a one-line summary, link) following the entries above, or delete this entry.
    id: "slot-3",
    title: "Add a project",
    role: "",
    stack: [],
    summary: "Open slot. A real project lands here soon.",
    placeholder: true,
  },
];

/* Section 4 — about (the summit payoff). PLACEHOLDER bio. */
export const about = {
  heading: "The summit",
  photo: {
    src: "/images/halfdome-summit.jpg",
    alt: "Jethro Chu on the granite summit of Half Dome at golden hour, in a climbing harness and a white costume, arms crossed and smiling.",
    width: 1200,
    height: 1600,
  },
  // PLACEHOLDER bio, first person and plain. Confirm school, grad year,
  // and which clinical details Jethro wants public.
  body: [
    "I'm a BSN nursing student at Azusa Pacific University.",
    "I've done clinical rotations across several hospital systems. On the side I build software like Lab Logger, and I climb granite in the Sierra.",
    "This is the top of Half Dome, 8,839 feet up. Scrolling this far down the page was the climb.",
  ],
} as const;

/* Section 5 — contact / footer (the view). PLACEHOLDER links. */
export const contact = {
  heading: "Let's connect",
  // PLACEHOLDER line — confirm.
  line: "If you're building in healthcare or software, I'd like to hear about it.",
  links: [
    { label: "Email", href: "mailto:jethro.chu@gmail.com" }, // PLACEHOLDER — confirm
    { label: "GitHub", href: "https://github.com/Jethro-Chu" },
    { label: "LinkedIn", href: "#" }, // PLACEHOLDER — add real URL
  ],
} as const;
