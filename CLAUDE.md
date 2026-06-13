# Portfolio — agent guidance

**Always follow `DESIGN_BRIEF.md` for any visual change.** It is the source of truth
for type, color, spacing, motion, and structure. Do not drift back toward generic
defaults (gradient text, aurora/mesh backgrounds, glassmorphism, glowing pills,
bento card grids, single-font hierarchy, filler copy).

## Working location

Develop and build from **`~/dev/portfolio`** (this repo), never from the iCloud-synced
`~/Desktop` mirror — `next dev/build` crawls there.

```bash
npm run dev      # http://localhost:3000
npm run build    # static production build
```

## Stack

Next.js 15 (App Router, fully static/SSG) · React 19 · Tailwind CSS v4 · Framer Motion
· TypeScript. Design tokens live in `app/globals.css` (`@theme` + CSS variables).
Project content is data-driven from `lib/projects.ts`; identity/copy from `lib/site.ts`.

## Non-negotiables

- The "Flowsheet" clinical aesthetic: monochrome + one disciplined teal accent
  (`--accent`), hairline rules, monospace data, radii 0–4px.
- WCAG AA contrast, visible keyboard focus, semantic HTML, `prefers-reduced-motion`
  respected, no layout shift on font load.
- Don't invent biographical facts — leave clearly-marked placeholders for Jethro.
- Live previews use ONE component, `components/visual/LiveWindow.tsx`: load-on-click
  facade, one live iframe at a time, clinical top bar (status dot accent only when
  live), mobile → fullscreen modal, `prefers-reduced-motion` respected. Set
  `Project.live.embeddable` from the site's real `X-Frame-Options`/CSP headers; when
  `false`, fall back to poster + "Open live" (never a broken frame). For camera apps
  pass `allow="camera"` (camera only) and **no `sandbox`** (it breaks `getUserMedia`).
  See the "Live previews" section of DESIGN_BRIEF.md.
- Full-viewport apps (`Project.live.experience === "emotion"`) get their OWN full-screen
  route, not an inline embed: the Work card links to it, and `app/work/emotion-stock-market`
  + `components/work/GameStage.tsx` render the pinned nav + a full-bleed same-origin iframe
  to `/stock-game/index.html`, gated by a consent + Start (no camera on load; released on
  leave). The game itself is the self-hosted Bloomberg-terminal vanilla JS under
  `public/stock-game/` (do NOT rewrite in React — risks the camera); it owns the face-api
  engine + 68-point amber landmark overlay. The nav is solid off-home; the footer is hidden
  on the game route via `ConditionalFooter`.
