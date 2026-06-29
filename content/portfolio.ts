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
  /** panel title */
  title: string;
  /** panel body, one string per paragraph */
  body: string[];
  /** optional outbound links */
  links?: LandmarkLink[];
  /** optional project ids (resolved against content.ts) shown here */
  projects?: string[];
  /** pack faceset used as the panel headshot (Peter-style) */
  faceset?: string;
  /** a JETHRO placeholder line to author, rendered as a clearly-marked draft */
  authoredLine?: string;
}

const FACE = "/game/ninja-adventure/sprites/hunter-face.png";

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
    title: "Who Jethro is",
    faceset: FACE,
    authoredLine:
      "JETHRO: one or two lines introducing yourself as a BSN nurse-in-training and a builder of live software.",
    body: [
      "Jethro Chu is a nursing student who builds software between clinical shifts. Two paths, walked together: the bedside and the keyboard.",
      "Most of what I build comes from friction I have actually felt, in a hospital, in research, or in the everyday tools people fight with. Nursing taught me to notice it; building is what I do about it.",
      "Wander the village. Every building opens a real part of the portfolio, in any order.",
    ],
  },
  {
    id: "chapel",
    landmark: "The Chapel",
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
    id: "cabins",
    landmark: "The Tent Cabins",
    section: "Projects",
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
    title: "How this village works",
    faceset: FACE,
    body: [
      "This site is a static Next.js portfolio. The real, indexable content loads first and works with no JavaScript, for crawlers, reduced-motion, and anyone who would rather just read.",
      "The village is an enhancement layered over that DOM. Phaser, the tilemap, and the art load only when you choose to explore, in their own code-split chunk, so the fast path never downloads a game.",
      "The art is the Ninja Adventure pack by pixel-boy (CC0): professionally drawn 16-px tiles, hand-arranged into a town and integer-scaled for pixel-perfect edges. The HUD, minimap, and panels are plain DOM, kept crisp and accessible.",
    ],
  },
  {
    id: "ranger-station",
    landmark: "The Ranger Station",
    section: "Contact",
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
    title: "Resume and what I'm looking for",
    faceset: FACE,
    authoredLine:
      "JETHRO: one or two lines on what you're looking for (roles, teams, the kind of work).",
    body: [
      `${status.degree}, ${status.school}, expected ${status.bsnGraduation}. ${status.clinicalHours} clinical hours; ${status.certifications.join(", ")}.`,
    ],
    links: [{ label: "Download resume", href: resume.pdf }],
  },
  {
    id: "glacier-point",
    landmark: "Glacier Point",
    section: "The overlook",
    title: "The whole valley",
    faceset: FACE,
    authoredLine:
      "JETHRO: the dual-identity statement. The one or two lines that say who you are as a nurse and a builder, taking in the view.",
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
