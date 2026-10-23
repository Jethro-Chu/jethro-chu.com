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
import { personalBackground, type PersonalBackgroundContent } from "./personal";

export interface LandmarkLink {
  label: string;
  href: string;
}

export interface ClinicalJourneyContent {
  intro: string;
  stats: { label: string; value: string }[];
  sites: { organization: string; experience: string }[];
  interest: string;
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
  /** optional plain-language line directly below the panel title */
  subheading?: string;
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
  /** an authored identity statement rendered in the existing callout */
  authoredLine?: string;
  /** when true, the modal renders the full structured resume (ResumeSheet) below the body */
  resumeSheet?: boolean;
  /** recruiter-focused content used by the clinical journey room */
  clinicalJourney?: ClinicalJourneyContent;
  /** shared personal biography and real HackTech team photo */
  personalBackground?: PersonalBackgroundContent;
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
    personalBackground,
  },
  {
    id: "chapel",
    landmark: "Clinical Journey",
    section: "Clinical",
    cta: "View Clinical Journey",
    map: { x: 8, y: 19 },
    title: "Clinical Experience",
    subheading: "Building a foundation in cardiac, critical-care, and telemetry nursing",
    faceset: FACE,
    body: [],
    clinicalJourney: {
      intro:
        "I am completing my Bachelor of Science in Nursing (BSN) at Azusa Pacific University (expected graduation December 2026) as a new graduate nursing candidate. Through more than 560 clinical hours across six healthcare institutions in California and Hangzhou, China, I have cared for patients across cardiology, cardiac surgery, cardiac catheterization (cath lab), pediatric intensive care (PICU), bone marrow transplant, psychiatric, emergency, orthopedics, step-down/DOU, telemetry, and medical-surgical settings.",
      stats: [
        { label: "Education", value: "BSN, December 2026" },
        { label: "Experience", value: "560+ clinical hours" },
        { label: "Certifications", value: "BLS and ACLS" },
        {
          label: "Clinical interests",
          value: "Cardiac, telemetry, and critical care",
        },
      ],
      sites: [
        { organization: "City of Hope", experience: "Bone Marrow Transplant" },
        {
          organization: "Children's Hospital Los Angeles",
          experience: "Pediatric Intensive Care",
        },
        { organization: "Kaiser Permanente", experience: "Clinical rotation" },
        {
          organization: "Huntington Health (Huntington Hospital)",
          experience: "Medical-surgical, telemetry, GI, cath lab, and cardiovascular care",
        },
        {
          organization: "Emanate Health",
          experience: "Step-down / DOU and medical-surgical nursing",
        },
        {
          organization: "Second Affiliated Hospital of Zhejiang University (Hangzhou, China)",
          experience: "International clinical rotation in emergency care, cardiology, cardiac surgery, and orthopedics",
        },
      ],
      interest:
        "I am especially drawn to critical-care and cardiovascular nursing, with a strong focus on hemodynamics, telemetry interpretation, evidence-based practice, and the early recognition of patient deterioration to directly improve patient outcomes.",
    },
    links: [
      { label: "View Résumé", href: resume.pdf },
    ],
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
    projects: [
      "nursejet",
      "medmath",
      "abg-arena",
      "lab-logger",
      "rate-my-hospital-food",
      "emotion-stock-market-game",
    ],
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
      "The village lives at /website. The reading and chatbot experience lives at /, where every project and section remains directly accessible.",
      "Phaser, the tilemap, and the art live in their own code-split chunk at /website, so the reading path never downloads a game engine.",
      "Inside the canvas, everything is placed by hand. Buildings and trees depth-sort against the hiker, the signs are supersampled canvas textures so they stay crisp at every zoom, and the atmosphere (light rays, fog, chimney smoke, birds) is a handful of cheap particles, not a shader stack. The HUD, minimap, and rooms are plain DOM, kept crisp and accessible.",
    ],
    facts: [
      { k: "Stack", v: "Next.js 15 · React 19 · Phaser 3 · Tailwind 4" },
      { k: "Shape", v: "Scrolling homepage · interactive village at /website" },
      { k: "Budget", v: "The game and reading paths stay code-split" },
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
      { label: "LinkedIn", href: "https://www.linkedin.com/in/jethro-chu/" },
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
      `Six clinical rotations and ${status.clinicalHours}+ hours across pediatric intensive care, mental health, oncology, cardiovascular, step-down/DOU, and emergency settings. The full breakdown is below.`,
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
      "I'm Jethro, a nursing student at Azusa Pacific University graduating in December 2026. I'm interested in critical care and cardiac nursing. I also like building websites and working on random projects when I have an idea I want to try.",
    body: [
      personalBackground.overlook,
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
