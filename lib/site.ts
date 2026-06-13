/* ============================================================
   SITE CONFIG — identity, nav, socials, and copy.
   Copy is specific and grounded — no filler, no banned phrases.
   Replace [PLACEHOLDER] / "verify" values with Jethro's real details.
   ============================================================ */

export const site = {
  name: "Jethro Chu",
  role: "Nurse · Builder",
  /** Meta description — specific, grounded. */
  positioning:
    "Nurse turned builder, finishing a BSN. Clinical shifts and a codebase — Lab Logger came out of both.",
  email: "jethro.chu@gmail.com",
  location: "Bay Area, CA",
  available: true,
  url: "https://jethrochu.com",
} as const;

/** Hero copy — framed as a clinical record header, not editorial chrome. */
export const hero = {
  headline: ["Nurse", "&", "Builder"],
  subline: "Clinical shifts and a codebase. Lab Logger came out of both.",
  record: "Record — J. Chu",
  locus: "Bay Area, CA",
  statusLabel: "Status",
  statusValue: "Available for select work",
  /** Quiet composed line reused in the contact section. */
  availability: "Bay Area · Available for select work",
} as const;

export const nav = [
  { label: "Work", href: "/#work" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "/#contact" },
] as const;

export const socials = [
  { label: "Email", href: "mailto:jethro.chu@gmail.com" },
  { label: "GitHub", href: "https://github.com/" },
  { label: "LinkedIn", href: "https://linkedin.com/" },
] as const;

/* ------------------------------------------------------------
   FLOWSHEET SIGNATURE — credentials presented like a lab panel.
   `bar` is an optional 0–1 fill for a range bar.
   NOTE: verify these against Jethro's real, exact numbers.
   ------------------------------------------------------------ */
export const credentials: {
  label: string;
  value: string;
  note?: string;
  bar?: number;
}[] = [
  { label: "CLINICAL HOURS", value: "560", bar: 0.74 }, // verify
  {
    label: "SYSTEMS WORKED",
    value: "4",
    note: "City of Hope · CHLA · Kaiser · SAHZU", // verify
  },
  { label: "BUILDING SINCE", value: "2024" }, // verify
  { label: "DEGREE", value: "BSN", note: "in progress" }, // verify
];

/* ------------------------------------------------------------
   ABOUT — nurse→builder narrative. Keep specific; the unusual
   path is the selling point. [PLACEHOLDER] = Jethro to fill.
   ------------------------------------------------------------ */
export const aboutBeats: { year: string; title: string; body: string }[] = [
  {
    year: "BEDSIDE",
    title: "I started as a nurse",
    body: "Clinical shifts taught me how software actually meets human stakes — and how rarely it's built for the person holding the chart at 3am. [PLACEHOLDER: units worked, e.g. oncology / pediatrics, and years.]",
  },
  {
    year: "CROSSOVER",
    title: "I taught myself to build",
    body: "I learned to design and ship software to fix the tools I wished I'd had on shift. Lab Logger was the first — built from the gap between charting a result and understanding it.",
  },
  {
    year: "NOW",
    title: "I build from inside care",
    body: "Finishing a BSN while shipping healthcare and AI products. The bedside isn't a market I researched — it's where I came from, and it's the through-line in everything here.",
  },
];

/* ------------------------------------------------------------
   CAPABILITIES — rendered as a quiet flowsheet list (mono
   labels + hairlines), never as an equal-card bento grid.
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
