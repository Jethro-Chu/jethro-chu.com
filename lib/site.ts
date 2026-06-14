/* ============================================================
   SITE CONFIG: identity, nav, socials, and copy.
   Copy is specific and grounded. No filler, no banned phrases,
   and no em-dashes in prose (they read as AI). Use periods,
   commas, or colons instead.
   ============================================================ */

export const site = {
  name: "Jethro Chu",
  role: "Nurse · Builder",
  /** Meta description: specific, grounded. */
  positioning:
    "Nurse turned builder, finishing a BSN. Clinical shifts and a codebase. Lab Logger came out of both.",
  email: "jethro.chu@gmail.com",
  location: "Bay Area, CA",
  available: true,
  url: "https://jethrochu.com",
} as const;

/** Hero copy, framed as a clinical record header, not editorial chrome. */
export const hero = {
  headline: ["Nurse", "&", "Builder"],
  subline: "Clinical shifts and a codebase. Lab Logger came out of both.",
  record: "Jethro Chu",
  locus: "Bay Area, CA",
  statusLabel: "Status",
  statusValue: "Available for select work",
  /** Quiet composed line reused in the contact section. */
  availability: "Bay Area · Available for select work",
  /** Real vitals strip: every number is true and traceable to credentials. */
  vitals: [
    { value: "560", label: "Clinical hrs" },
    { value: "4", label: "Hospitals" },
    { value: "2024", label: "Building since" },
  ],
  primaryCta: { label: "See the work", href: "/#work" },
  secondaryCta: { label: "Email me", href: "/#contact" },
} as const;

/** Contact / footer copy. Concrete, not vague. */
export const contact = {
  headline: "Let's build something clinical.",
  blurb:
    "Working on something in healthcare or AI? I read every note, and I answer.",
} as const;

export const nav = [
  { label: "Work", href: "/#work" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "/#contact" },
] as const;

export const socials = [
  { label: "Email", href: "mailto:jethro.chu@gmail.com" },
  { label: "GitHub", href: "https://github.com/Jethro-Chu" },
  // LinkedIn omitted until a real URL is provided (no dead generic links).
] as const;

/* ------------------------------------------------------------
   CREDENTIALS: presented like a lab panel (mono, aligned, range
   bar). `bar` is an optional 0..1 fill. `watch` flags the honest
   "in progress / beta" status that carries the lone amber marker.
   All values confirmed by Jethro.
   ------------------------------------------------------------ */
export const credentials: {
  label: string;
  value: string;
  note?: string;
  bar?: number;
  watch?: boolean;
}[] = [
  { label: "CLINICAL HOURS", value: "560", bar: 0.74 },
  {
    label: "SYSTEMS WORKED",
    value: "4",
    note: "City of Hope · CHLA · Kaiser · SAHZU",
  },
  { label: "BUILDING SINCE", value: "2024" },
  { label: "DEGREE", value: "BSN", note: "in progress", watch: true },
];

/* ------------------------------------------------------------
   ABOUT: the nurse-to-builder narrative. Keep it specific; the
   unusual path is the selling point. No em-dashes in prose.
   ------------------------------------------------------------ */
export const aboutBeats: { year: string; title: string; body: string }[] = [
  {
    year: "BEDSIDE",
    title: "I started as a nurse",
    body: "Clinical shifts across four systems (City of Hope, CHLA, Kaiser, and SAHZU) taught me how software actually meets human stakes, and how rarely it's built for the person holding the chart at 3am.",
  },
  {
    year: "CROSSOVER",
    title: "I taught myself to build",
    body: "I learned to design and ship software to fix the tools I wished I'd had on shift. Lab Logger was the first, built from the gap between charting a result and understanding it.",
  },
  {
    year: "NOW",
    title: "I build from inside care",
    body: "Finishing a BSN while shipping healthcare and AI products. The bedside isn't a market I researched. It's where I came from, and it's the through-line in everything here.",
  },
];

/** The one editorial pull-quote, drawn from the real bedside copy above. */
export const pullQuote = "the person holding the chart at 3am";

/* ------------------------------------------------------------
   CAPABILITIES: a quiet flowsheet list (mono labels + hairlines),
   never an equal-card bento grid.
   ------------------------------------------------------------ */
export const capabilities: { group: string; items: string[] }[] = [
  {
    group: "CLINICAL",
    items: [
      "Bedside practice",
      "Lab & vitals literacy",
      "Patient-safety mindset",
      "Care-team workflows",
    ],
  },
  {
    group: "BUILD",
    items: ["TypeScript", "React / Next.js", "Node / Edge", "Postgres"],
  },
  {
    group: "AI & DATA",
    items: ["LLM pipelines", "Tool use & agents", "Retrieval", "Grounding & evals"],
  },
  {
    group: "DESIGN",
    items: ["Product & UX", "Design systems", "Accessibility (AA)", "Prototyping"],
  },
];
