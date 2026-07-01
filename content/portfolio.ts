/* ============================================================
   PORTFOLIO  ·  single source of truth for Yosemite Village (§4)
   One record per building/district. BOTH the flat fallback and the
   in-village panels read from here, so nothing biographical is
   hard-coded in game code.

   Real facts are pulled from content.ts + resume.ts. Personal-voice
   lines are JETHRO drafts to author, then run through /stop-slop.
   The export names (landmarks/landmarkById/projectsForLandmark) are
   kept stable so the modal/HUD/flat components are unchanged.
   ============================================================ */

import { projects as allProjects } from "./content";
import type { Project } from "./content";
import { resume } from "./resume";

export interface LandmarkLink {
  label: string;
  href: string;
}

export interface Landmark {
  /** stable id, used by trigger zones + the bridge */
  id: string;
  /** the building / district name */
  landmark: string;
  /** short section name (panel eyebrow / minimap label) */
  section: string;
  /** door-prompt action, e.g. "Open Resume" (defaults to "Enter {section}") */
  cta?: string;
  /** building centre in tile coords (mirrors VillageScene placement) — drives
   *  the minimap markers + the directional cue. Keep in sync with the scene. */
  map: { x: number; y: number };
  /** panel title */
  title: string;
  /** panel body, one string per paragraph */
  body: string[];
  /** optional outbound links */
  links?: LandmarkLink[];
  /** optional mono key/value rows, rendered as a flowsheet-style table */
  facts?: { k: string; v: string }[];
  /** optional project ids (resolved against content.ts) shown here */
  projects?: string[];
  /** pack faceset used as the panel headshot (Peter-style) */
  faceset?: string;
  /** a JETHRO placeholder line to author, rendered as a clearly-marked draft */
  authoredLine?: string;
  /** when true, the modal renders the full structured resume (ResumeSheet) below the body */
  resumeSheet?: boolean;
}

// Per-room headshot flag: rooms set this to show Jethro's own character as the
// panel avatar (the InteriorRoom crops the idle frame from the player sprite).
const FACE = "/game/jethro/player.png";

export const status = {
  school: resume.education.school,
  degree: resume.education.degree,
  bsnGraduation: "December 2026",
  clinicalHours: 560,
  certifications: resume.skills.certifications,
  resumePdf: resume.pdf,
} as const;

/* ---- the seven village buildings (hub-and-spokes, any order) ---- */
export const landmarks: Landmark[] = [
  {
    id: "visitor-center",
    landmark: "Visitor Center",
    section: "About",
    map: { x: 21, y: 6 },
    title: "Who Am I?",
    faceset: FACE,
    body: [
      "I'm Jethro Chu, a BSN nursing student and I build software for fun. I'm interested in the space between healthcare, research, and technology.",
      "Most of what I build starts with problems I've actually encountered, in hospitals, labs, or inside everyday tools that should have been easier to use. Nursing taught me to notice what makes systems less efficient.",
      "This site is a small village of what I'm working on. When you look around, every building opens a real part of my portfolio: projects, experiments, writing, and the systems I'm learning to build.",
    ],
  },
  {
    id: "chapel",
    landmark: "The Chapel",
    section: "Clinical",
    cta: "Visit Clinical",
    map: { x: 8, y: 19 },
    title: "The clinical route",
    faceset: FACE,
    body: [
      `${resume.education.degree} at ${resume.education.school}, expected December 2026 (GPA ${resume.education.gpa}, Dean's List).`,
      "560 hours at the bedside across City of Hope, Children's Hospital Los Angeles, Kaiser Permanente, Huntington Hospital, and the Second Affiliated Hospital of Zhejiang University.",
      "The through line is telemetry. Reading the trace is reading the patient, and most of what I build carries that habit: watch the signal, catch the change early.",
    ],
    facts: [
      { k: "Hours", v: "560 · five hospital systems" },
      { k: "Units", v: "PICU · BMT · CV acute · Psych · CVICU · Cardiology · ED" },
      { k: "Certified", v: "BLS · ACLS" },
      { k: "Charting", v: "Epic" },
      { k: "Focus", v: "Telemetry, cardiac + CVICU" },
    ],
    links: [{ label: "Full resume", href: resume.pdf }],
  },
  {
    id: "cabins",
    landmark: "The Tent Cabins",
    section: "Projects",
    map: { x: 13, y: 25 },
    title: "What I build",
    faceset: FACE,
    body: [
      "Live software, mostly solo, mostly born from healthcare and research. Some serious, some for fun, all shipped.",
    ],
    projects: ["nursejet", "lab-logger", "rate-my-hospital-food", "emotion-stock-market-game"],
  },
  {
    id: "ahwahnee",
    landmark: "The Ahwahnee",
    section: "Under the hood",
    cta: "Look under the hood",
    map: { x: 34, y: 7 },
    title: "How this village works",
    faceset: FACE,
    body: [
      "The real portfolio is a plain, indexable page that loads first and works with no JavaScript. Crawlers, reduced motion, and anyone in a hurry get that version automatically.",
      "The village is a layer on top. Phaser, the tilemap, and the art live in their own code-split chunk that loads only when you choose to explore, so the reading path never downloads a game engine.",
      "Inside the canvas, everything is placed by hand. Buildings and trees depth-sort against the hiker, the signs are supersampled canvas textures so they stay crisp at every zoom, and the atmosphere (light rays, fog, chimney smoke, birds) is a handful of cheap particles, not a shader stack. The HUD, minimap, and rooms are plain DOM, kept crisp and accessible.",
    ],
    facts: [
      { k: "Stack", v: "Next.js 15 · React 19 · Phaser 3 · Tailwind 4" },
      { k: "Shape", v: "Static SSR site first; the game is an optional layer" },
      { k: "Budget", v: "Homepage JS unchanged; the village loads on demand" },
      { k: "World", v: "46×34 tile hub · y-sorted sprites · canvas signage" },
      { k: "Art", v: "Ninja Adventure pack by pixel-boy (CC0)" },
    ],
  },
  {
    id: "ranger-station",
    landmark: "The Ranger Station",
    section: "Contact",
    cta: "Say hello",
    map: { x: 10, y: 7 },
    title: "Get in touch",
    faceset: FACE,
    body: ["If you are building in healthcare or software, I would like to hear about it."],
    links: [
      { label: "Email", href: "mailto:jethro.chu@gmail.com" },
      { label: "GitHub", href: "https://github.com/Jethro-Chu" },
      // LinkedIn intentionally omitted until a real URL exists (no dead links).
    ],
  },
  {
    id: "general-store",
    landmark: "The General Store",
    section: "Resume",
    cta: "Open Resume",
    map: { x: 36, y: 19 },
    title: "Resume",
    faceset: FACE,
    body: [
      `Five clinical rotations, ${status.clinicalHours} hours across pediatric, mental health, oncology, cardiac, and emergency settings. The full breakdown is below.`,
    ],
    resumeSheet: true,
    links: [{ label: "Download resume", href: resume.pdf }],
  },
  {
    id: "glacier-point",
    landmark: "Glacier Point",
    section: "The overlook",
    cta: "Take in the view",
    map: { x: 23, y: 32 },
    title: "The whole valley",
    faceset: FACE,
    authoredLine:
      "JETHRO: the dual-identity statement. The one or two lines that say who you are as a nurse and a builder, taking in the view.",
    body: [
      "BSN expected December 2026. Building live software now.",
      "What I'm building toward: healthcare software that respects the people using it. The best tools I've touched at the bedside disappeared into the work; the worst ones made a hard shift harder. I want to build the first kind.",
    ],
    links: [
      { label: "Download resume", href: resume.pdf },
      { label: "Email", href: "mailto:jethro.chu@gmail.com" },
      { label: "GitHub", href: "https://github.com/Jethro-Chu" },
    ],
  },
];

/* ---- village map geometry (mirrors VillageScene) for the minimap ---- */
export const villageMap = {
  w: 46,
  h: 34,
  plaza: { x: 23, y: 14 }, // fountain / plaza centre
  spawn: { x: 23, y: 16 },
  riverTop: 30, // first river row (the Merced runs along the bottom)
  bridge: { x: 22, w: 2 }, // plank bridge to Glacier Point
} as const;

export const landmarkById = (id: string): Landmark | undefined =>
  landmarks.find((l) => l.id === id);

export const projectsForLandmark = (l: Landmark): Project[] =>
  (l.projects ?? [])
    .map((id) => allProjects.find((p) => p.id === id))
    .filter((p): p is Project => Boolean(p));

/* ---- collectible cards: cross-domain aphorisms (seeds; JETHRO to finalize) ---- */
export interface TrailCard {
  id: string;
  aphorism: string;
}

export const trailCards: TrailCard[] = [
  { id: "triage", aphorism: "Triage is prioritization." },
  { id: "reasoning", aphorism: "Clinical reasoning is debugging." },
  { id: "charting", aphorism: "Charting is documentation." },
  { id: "code", aphorism: "A code is incident response." },
  { id: "vitals", aphorism: "Vitals are telemetry." },
  { id: "discharge", aphorism: "Discharge planning is shipping." },
];
