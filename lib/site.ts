/* ============================================================
   SITE CONFIG — global identity, nav, socials, profile copy.
   ============================================================ */

export const site = {
  name: "Jethro Chu",
  role: "Nurse · Builder · Product Designer",
  positioning:
    "I build polished healthcare and AI products — where clinical reality, careful design, and shipped software meet.",
  email: "jethro.chu@gmail.com",
  location: "San Francisco, CA",
  available: true,
  url: "https://jethrochu.com",
} as const;

export const nav = [
  { label: "Work", href: "/#work" },
  { label: "Archive", href: "/#archive" },
  { label: "About", href: "/#about" },
  { label: "Craft", href: "/#craft" },
  { label: "Contact", href: "/#contact" },
] as const;

export const socials = [
  { label: "Email", handle: "jethro.chu@gmail.com", href: "mailto:jethro.chu@gmail.com" },
  { label: "GitHub", handle: "@jethrochu", href: "https://github.com/" },
  { label: "LinkedIn", handle: "in/jethrochu", href: "https://linkedin.com/" },
  { label: "X", handle: "@jethrochu", href: "https://x.com/" },
] as const;

/** Capability clusters for the Skills section */
export const skillClusters: {
  title: string;
  blurb: string;
  items: string[];
}[] = [
  {
    title: "Product & Design",
    blurb: "Turning fuzzy problems into interfaces people trust.",
    items: [
      "Product strategy",
      "UX & interaction design",
      "Design systems",
      "Motion & microinteraction",
      "Prototyping",
      "Accessibility (WCAG)",
    ],
  },
  {
    title: "Engineering",
    blurb: "Shipping fast without shipping fragile.",
    items: [
      "TypeScript",
      "React / Next.js",
      "TanStack Start",
      "Node / Edge",
      "Postgres",
      "Tailwind CSS",
    ],
  },
  {
    title: "AI & Data",
    blurb: "Building with models without losing the plot on truth.",
    items: [
      "LLM pipelines",
      "Tool use & agents",
      "Retrieval (RAG)",
      "Vision",
      "Grounding & evals",
      "Prompt design",
    ],
  },
  {
    title: "Healthcare",
    blurb: "Domain fluency from the bedside, not the whiteboard.",
    items: [
      "Clinical workflows",
      "Patient safety mindset",
      "Lab & vitals literacy",
      "Care-team UX",
      "Health data ethics",
      "Evidence-based practice",
    ],
  },
];

/** A loose timeline / about narrative */
export const aboutBeats: { year: string; title: string; body: string }[] = [
  {
    year: "Bedside",
    title: "Started as a nurse",
    body: "Years at the bedside taught me how software actually meets human stakes — and how rarely it's designed for the person holding the chart at 3am.",
  },
  {
    year: "Crossover",
    title: "Taught myself to build",
    body: "I learned to design and ship software to fix the tools I wished I'd had, then kept going because the problems kept being interesting.",
  },
  {
    year: "Now",
    title: "Building at the seam",
    body: "Today I build products that live where healthcare, AI, and thoughtful design overlap — fast, honest, and made for the people who use them.",
  },
];
