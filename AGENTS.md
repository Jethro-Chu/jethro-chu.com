# Portfolio — agent guidance

**Always follow `DESIGN_BRIEF.md` for any visual change.** It is the source of truth
for type, color, spacing, motion, structure, and copy. Do not drift back toward generic
defaults (gradient text, aurora/mesh backgrounds, glassmorphism, glowing pills, bento
card grids, single-font hierarchy, filler copy, em-dashes in prose).

## Working location

Develop and build from **`~/dev/portfolio`** (this repo), never from the iCloud-synced
`~/Desktop` mirror (`next dev/build` crawls there).

```bash
npm run dev      # http://localhost:3000
npm run build    # static production build
```

## Stack

Next.js 15 (App Router, fully static/SSG) · React 19 · Tailwind CSS v4 · Framer Motion ·
TypeScript. Design tokens live in `app/globals.css` (`@theme` + CSS variables). Project
content is data-driven from `lib/projects.ts`; identity/copy from `lib/site.ts`; per-project
theme application from `lib/theme.ts`.

## Non-negotiables

- **"Telemetry" clinical color-STATE system** (not the old monochrome Flowsheet): teal
  `--color-primary` = in-range/resting (the quiet default), ONE vivid `--color-amber`
  (`#FF8A1F`, autobiographical — same family as the terminal `#FFA028`) = live/now/watch,
  `--color-critical` = true-critical only. Amber is **FILL/graphic-only** and token-FORBIDDEN
  as light-bg text (use `--color-amber-ink`); budget ≈3 amber uses per viewport. The lab
  panel's in-progress/Beta row is the lone amber "watch". `--color-line` (1.42:1) is
  structural ONLY, never text.
- **3 type roles** kept: Space Grotesk (display) / Inter (prose only) / Space Mono (every
  numeric, label, eyebrow). Never Inter-for-everything.
- **No em-dashes ("—") in prose copy** — Jethro reads them as an AI tell. Use periods,
  commas, colons. Mono middot separators (`A · B`) are fine.
- **Work showcase**: all projects EQUAL weight in one consistent system; each carries its
  own healthcare-grounded theme (`lib/projects.ts → theme`, applied via `lib/theme.ts`).
  Transition = CSS `position: sticky` stacking panels (`components/sections/WorkShowcase.tsx`),
  scroll-native (no JS scroll handlers, no scroll-jacking), opaque panels (AA-safe always),
  `prefers-reduced-motion` → instant. Keep `body { overflow-x: clip }` (not `hidden`, which
  breaks the sticky stack). Hero/About/Contact stay on the base palette.
- The **deep-pine band** (`.on-deep`) carries About + Contact + Footer; it remaps tokens so
  reused components invert automatically.
- **Bespoke inline-SVG kit** (`components/visual/*`): ECG `VitalsWaveform` (draws once, parks
  one amber R-peak, never loops/flatlines), `PulseDivider`, `NurseBuilderMonogram`,
  `ProjectGlyph`, `TerminalPoster`, `ProjectPoster`, `Flowsheet`+`RangeBar`, `CountUp`,
  `HandOnChart`, `LiveGlyph`. currentColor + token-bound, `aria-hidden` when decorative.
  lucide-react is for generic UI chrome only, never healthcare-specific, never amber.
- WCAG **AA** contrast (every project theme too), visible keyboard focus, semantic HTML,
  `prefers-reduced-motion` respected, no layout shift on font load, fast.
- Don't invent biographical facts or product screenshots. Use honest bespoke posters
  (`ProjectPoster`) until a real `project.shot` exists; `metrics: []` when unverified.
- **Live previews + the game stay as-is.** `components/visual/LiveWindow.tsx`: load-on-click
  facade, one iframe at a time, amber LIVE pulse only when live, mobile → fullscreen modal,
  poster + "Open live" when `embeddable === false`. Camera apps: `allow="camera"`, **no
  `sandbox`**. Full-viewport apps (`live.experience === "emotion"`) get their OWN full-screen
  route (`app/work/emotion-stock-market` + `components/work/GameStage.tsx`): pinned nav,
  full-bleed same-origin iframe to `/stock-game/index.html`, consent + Start, camera released
  on leave; the slug is excluded from the `[slug]` `generateStaticParams`. The game itself is
  the self-hosted Bloomberg-terminal vanilla JS under `public/stock-game/` (do NOT rewrite in
  React — risks the camera); the nav is solid off-home, the footer hidden on the game route
  via `ConditionalFooter`.
