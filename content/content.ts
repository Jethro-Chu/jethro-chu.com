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
  /** optional source repository link */
  repo?: { href: string; label: string };
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

/* Section 2 — the approach (short intro / what I do). Jethro's copy. */
export const approach = {
  heading: "What I do",
  body: [
    "I'm a nursing student who loves to build. Most of what I create comes from things I wish existed in healthcare, research, or the tools people use every day. Some of it is serious, and some of it is just for fun.",
  ],
} as const;

/* Section 3 — projects, in Jethro's order. Copy is his, kept verbatim.
   Where the stack is bracketed it is unverified: left as an empty array for
   Jethro to fill rather than guessed. Thumbnails are notes for now (the card is
   text-only until real screenshots exist). */
export const projects: Project[] = [
  {
    id: "nursejet",
    title: "NurseJet",
    role: "Solo build",
    // [confirm stack — the /opengraph-image route suggests Next.js, but verify]
    stack: [],
    summary:
      "A daily clinical briefing for bedside nurses. It distills new nursing research, guideline changes, and safety alerts into short briefs, organized by your specialty from the ED to the NICU, with the exact source citation and a bedside takeaway on every one.",
    link: { href: "https://nursejet.org", label: "nursejet.org" },
    // thumbnail: screenshot of a sample brief (the takeaways + citations layout)
  },
  {
    id: "emotion-stock-market-game",
    title: "Emotion Stock Market Game",
    role: "Solo build",
    stack: ["Vanilla JS", "face-api.js", "TensorFlow.js"],
    summary:
      "A stock-market game where your facial expressions, read live through your camera, drive every buy and sell. Random crashes, recessions, and Warren Buffett whale pumps keep the market lurching, and it all runs in your browser with nothing recorded or uploaded.",
    link: {
      href: "https://jethro-chu.github.io/JethroStockMarketGame.github.io/",
      label: "play the game",
    },
    repo: {
      href: "https://github.com/Jethro-Chu/JethroStockMarketGame.github.io",
      label: "source",
    },
    // thumbnail: screenshot of the game terminal mid-play
  },
  {
    id: "lab-logger",
    title: "Lab Logger",
    role: "Built with three other students at Caltech",
    // [confirm stack — looks like Next.js · React · Tailwind from the live site]
    stack: [],
    summary:
      "Log a lab value and read it against its reference range, the way a clinician already thinks. It files each result into a running notebook, so you can watch a number trend across tests instead of hunting through old lab PDFs.",
    link: { href: "https://lab-logger.com", label: "lab-logger.com" },
    // thumbnail: screenshot of the notebook view (cream and burnt-orange UI)
  },
  {
    id: "rate-my-hospital-food",
    title: "Rate My Hospital Food",
    role: "Solo build",
    // [confirm stack — full-stack app with auth, database, and search]
    stack: [],
    // [confirm ratemyhospitalfood.com is live]
    summary:
      "A review site for hospital cafeteria food. Search a hospital, read real reviews, and leave your own star rating, with the best and worst cafeterias ranked the way a food app would.",
    link: {
      href: "https://ratemyhospitalfood.com",
      label: "ratemyhospitalfood.com",
    },
    // thumbnail: screenshot of the hospital search or a review card
  },
];

/* Section 4 — about (the summit payoff). Jethro's bio. */
export const about = {
  heading: "About me",
  photo: {
    src: "/images/halfdome-summit.jpg",
    alt: "Jethro Chu on the granite summit of Half Dome at golden hour, in a climbing harness and a white costume, arms crossed and smiling.",
    width: 1200,
    height: 1600,
  },
  // First person and plain. The specific school name and grad year are
  // intentionally omitted until Jethro confirms them (do not invent one).
  // Clinical detail is kept generic for the same reason.
  body: [
    "I'm a BSN nursing student.",
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
    { label: "Email", href: "mailto:jethro.chu@gmail.com" },
    { label: "GitHub", href: "https://github.com/Jethro-Chu" },
    // LinkedIn intentionally omitted until Jethro provides a real URL
    // (shipping no link beats shipping a dead "#" one).
  ],
} as const;
