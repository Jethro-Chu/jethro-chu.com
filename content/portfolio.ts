/* ============================================================
   PORTFOLIO  ·  single source of truth for the Yosemite valley (§4)
   One record per landmark. BOTH the flat fallback and the in-valley
   modals read from here, so nothing biographical is hard-coded in
   game code.

   Real facts are pulled from content.ts + resume.ts. Personal-voice
   lines are JETHRO drafts to author, then run through /stop-slop (§8).
   Do not invent biography.
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
  /** real Yosemite landmark */
  landmark: string;
  /** short section name (modal eyebrow / minimap label) */
  section: string;
  /** modal title */
  title: string;
  /** modal body, one string per paragraph */
  body: string[];
  /** optional outbound links */
  links?: LandmarkLink[];
  /** optional project ids (resolved against content.ts) shown here */
  projects?: string[];
  /** pack faceset used as the modal headshot (Peter-style) */
  faceset?: string;
  /** a JETHRO placeholder line to author, rendered as a clearly-marked draft */
  authoredLine?: string;
}

const FACE = "/game/ninja-adventure/sprites/hunter-face.png";

/* ---- one-place status fields (update here, read everywhere) ---- */
export const status = {
  school: resume.education.school, // Azusa Pacific University
  degree: resume.education.degree, // Bachelor of Science in Nursing
  bsnGraduation: "December 2026",
  clinicalHours: 560, // 90 + 90 + 160 + 110 + 110, verified against resume.ts
  certifications: resume.skills.certifications, // BLS, ACLS, Epic EHR
  resumePdf: resume.pdf, // /Jethro_Chu_Resume.pdf
} as const;

/* ---- the seven landmarks, free-roam (discoverable in any order) ---- */
export const landmarks: Landmark[] = [
  {
    id: "tunnel-view",
    landmark: "Tunnel View",
    section: "The trailhead",
    title: "Welcome to the valley",
    faceset: FACE,
    authoredLine:
      "JETHRO: one or two lines introducing yourself as a BSN nurse-in-training and a builder of live software.",
    body: [
      "Jethro Chu is a nursing student who builds software between clinical shifts. Two paths, walked together: the bedside and the keyboard.",
      "Wander the valley. Every landmark opens a real part of the portfolio, in any order you like.",
    ],
  },
  {
    id: "el-capitan",
    landmark: "El Capitan",
    section: "Origins",
    title: "The granite foundation",
    faceset: FACE,
    body: [
      "Most of what I build comes from friction I have actually felt: in a hospital, in research, or in the everyday tools people fight with.",
      "Nursing taught me to notice where a workflow slows someone down. Building is what I do about it. The two are the same instinct pointed at different problems.",
    ],
  },
  {
    id: "yosemite-falls",
    landmark: "Yosemite Falls",
    section: "Clinical",
    title: "The clinical route",
    faceset: FACE,
    body: [
      `${resume.education.degree} at ${resume.education.school}, expected December 2026 (GPA ${resume.education.gpa}, Dean's List).`,
      "560 clinical hours across City of Hope, Children's Hospital Los Angeles, Kaiser Permanente, Huntington Hospital, and the Second Affiliated Hospital of Zhejiang University. PICU, BMT, CV acute, psych, CVICU, cardiology, and emergency.",
      "BLS and ACLS certified; Epic charting. A telemetry focus runs through the cardiac and CVICU rotations: reading the trace is reading the patient.",
    ],
    links: [{ label: "Full resume", href: resume.pdf }],
  },
  {
    id: "half-dome",
    landmark: "Half Dome",
    section: "Builder",
    title: "What I build",
    faceset: FACE,
    body: [
      "Live software, mostly solo, mostly born from healthcare and research. Some serious, some for fun, all shipped.",
    ],
    projects: [
      "nursejet",
      "lab-logger",
      "rate-my-hospital-food",
      "emotion-stock-market-game",
    ],
  },
  {
    id: "ahwahnee",
    landmark: "The Ahwahnee",
    section: "Under the hood",
    title: "How this valley works",
    faceset: FACE,
    body: [
      "This site is a static Next.js portfolio. The real, indexable content loads first and works with no JavaScript, for crawlers, reduced-motion, and anyone who would rather just read.",
      "The valley is an enhancement layered over that DOM. Phaser, the tilemap, and the art load only when you choose to explore, in their own code-split chunk, so the fast path never downloads a game.",
      "The art is the Ninja Adventure pack by pixel-boy (CC0): professionally drawn 16-px tiles, hand-arranged in a Tiled map and integer-scaled for pixel-perfect edges. The HUD and modals are plain DOM, kept crisp and accessible.",
    ],
  },
  {
    id: "merced-bridge",
    landmark: "Merced River · Swinging Bridge",
    section: "Contact",
    title: "Cross the river",
    faceset: FACE,
    body: [
      "If you are building in healthcare or software, I would like to hear about it.",
    ],
    links: [
      { label: "Email", href: "mailto:jethro.chu@gmail.com" },
      { label: "GitHub", href: "https://github.com/Jethro-Chu" },
      // LinkedIn intentionally omitted until a real URL exists (no dead links).
    ],
  },
  {
    id: "glacier-point",
    landmark: "Glacier Point",
    section: "The overlook",
    title: "The whole valley",
    faceset: FACE,
    authoredLine:
      "JETHRO: the dual-identity statement. The one or two lines that say who you are as a nurse and a builder, taking in the whole valley.",
    body: ["BSN expected December 2026. Building live software now."],
    links: [
      { label: "Download resume", href: resume.pdf },
      { label: "Email", href: "mailto:jethro.chu@gmail.com" },
      { label: "GitHub", href: "https://github.com/Jethro-Chu" },
    ],
  },
];

export const landmarkById = (id: string): Landmark | undefined =>
  landmarks.find((l) => l.id === id);

/** resolve a landmark's project ids against the verified content.ts list */
export const projectsForLandmark = (l: Landmark): Project[] =>
  (l.projects ?? [])
    .map((id) => allProjects.find((p) => p.id === id))
    .filter((p): p is Project => Boolean(p));

/* ---- collectible trail-card aphorisms (seeds; JETHRO to finalize) ----
   Clinical reasoning as engineering, Jethro's brand. Marked draft until authored. */
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
