# Jethro Chu — Portfolio

A world-class personal portfolio: cinematic, fast, editorial. Built to feel like a
high-end product studio site rather than a generic developer résumé.

**Live positioning:** _"I build healthcare & AI products people actually trust."_

## Stack

- **Next.js 15** (App Router) — fully static, prerendered output
- **React 19**
- **Tailwind CSS v4** — custom design-token system in `app/globals.css`
- **Framer Motion** — scroll reveals, magnetic interactions, spotlight cards
- **TypeScript**

## Project structure

```
app/
  layout.tsx              # fonts (Fraunces / Geist), metadata, chrome
  page.tsx                # home — composes all sections
  globals.css             # the design system (tokens, utilities, motion)
  work/[slug]/page.tsx    # dynamic case-study pages (SSG)
  not-found.tsx           # custom 404
  icon.svg                # brand favicon
components/
  layout/                 # Nav (+ mobile menu), Footer, ScrollProgress
  sections/               # Hero, Marquee, FeaturedWork, Archive, About,
                          #   Skills, Focus, Contact
  ui/                     # Button, ProjectCard, Tag, StatusPill, SectionHeading
  visual/                 # AmbientBackground, ProjectVisual (generative previews)
  motion/                 # Reveal, RevealGroup, Magnetic
  work/                   # case-study chrome
lib/
  projects.ts             # the single source of truth for all project content
  site.ts                 # identity, nav, socials, skills, about narrative
  utils.ts
```

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static production build
```

> **⚠️ Run this from `~/dev`, not from `~/Desktop`.**
> `~/Desktop` is iCloud-synced; iCloud evicts files inside `node_modules`, which
> makes `next dev`/`next build` crawl (4+ minute startups, hung compiles). Keeping
> the project on local disk (`~/dev/portfolio`) keeps the dev server fast.

## Editing content

All project content lives in [`lib/projects.ts`](lib/projects.ts). Add an entry to
the `projects` array — set `featured: true` to surface it on the home page, pick an
`accent` (`iris` / `aqua` / `coral` / `gold`) and a `category` (which selects the
generative preview motif), and write the `caseStudy` blocks. A new case-study page
is generated automatically at `/work/<slug>`.

Identity, nav, socials, skills, and the about narrative live in
[`lib/site.ts`](lib/site.ts).

## Deploy

Fully static — deploys as-is to Vercel, Netlify, or any static host. No server,
middleware, or runtime image optimization in use.
