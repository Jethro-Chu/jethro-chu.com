# Portfolio Design Brief — "Telemetry"

**This file is the source of truth for every visual decision.** Any visual change
must conform to it. Do not drift back toward generic AI-template defaults. (Supersedes
the earlier strict-monochrome "Flowsheet" brief; the lab-panel *signature* survives
inside this warmer, more colorful system.)

## Mission

A polished, confident, modern health-tech site of the kind a well-designed 2025–2026
YC health company would have. Clarity and breathing room, but **never empty**: every
section earns its space with real content. It must read as deliberately designed and
**unmistakably healthcare**, not a template ten thousand startups share.

## Who it's for

Jethro Chu — a nurse-turned-builder finishing a BSN, with real bedside experience
(~560 clinical hours across City of Hope, CHLA, Kaiser, SAHZU), now shipping
healthcare/AI software. His differentiator is **credibility**: he was the person using
clinical software at the bedside. His world (telemetry, lab values, reference ranges,
monitoring) is the source of every distinctive choice.

## Concept: "Telemetry — Living Clinical Data"

The site is built like a bedside monitor that has settled into a calm, healthy rhythm,
and the person reading the trace is the one who built the instrument. The brand language
IS real clinical data-visualization.

### GOVERNING RULE — color encodes clinical STATE, never decoration

- **teal-green (`--color-primary`)** = in-range / normal / **resting** → the site's quiet default
- **vivid amber (`--color-amber`)** = **live / now / watch** → FILL/graphic only, ≈3 uses per viewport
- **deep red (`--color-critical`)** = **true-critical only** → essentially never appears, which keeps its weight

The amber is **autobiographical**: the same hue family as Jethro's own Emotion Stock
Market terminal (`#FFA028`). The signature honesty move: render honest status
("BSN in progress", "Beta") as the lone amber **watch** marks, so candor is the accent.

## Base palette (hero / about / contact / nav / footer). All text AA-verified.

```
--color-bg            #F4F6F4  clinical paper (faint green)        carries ink 16.4 / muted 6.1
--color-surface       #FCFDFC  cards, panels, nav, reading column
--color-surface-sunk  #ECF0EE  recessed "monitor" wells — non-text only
--color-ink           #0E1A16  text, headlines, icon strokes      AAA
--color-muted         #51605A  secondary text                     AA (6.1 / 6.5)
--color-line          #C9D2CE  hairlines — STRUCTURAL ONLY, never text (1.42:1 by design)
--color-line-strong   #74817B  perceivable UI separators          3.63 (≥3 non-text)
--color-primary       #0B6E59  teal-green: links-as-data, marks, button fill   5.71/6.08 AA, white-on 6.20
--color-primary-deep  #07533F  hover/pressed, deep-band ground     8.34 AAA
--color-primary-wash  #E2EEE9  flat in-range tint (never a gradient)
--color-amber         #FF8A1F  the ONE vivid — live/watch — FILL/graphic only
--color-amber-ink     #8A4B00  the ONLY amber-as-text on light     6.26/6.67 AA
--color-on-amber      #1A1206  text on an amber fill               7.86 AAA
--color-amber-soft    #FFB454  amber mark/text on the deep band    5.14 AA
--color-critical      #B3261E  true critical / destructive ONLY    6.02 AA
```

Two amber rules, both enforced in code: (1) amber means exactly "live/now/watch";
(2) amber as thin-line/text on light is FORBIDDEN (2.17:1) — route to `--color-amber-ink`.
Budget: ~3 amber uses per viewport, audited in review.

### Deep-pine band (`.on-deep`) — the one compositional dark zone (About + Contact + Footer)

A scoped token REMAP (in `globals.css`) so reused components invert automatically.
Verified-AA deep tokens: `--color-ink-inv #EAF1ED`, `--color-muted-inv #B4C5BE`,
`--color-deep-surface #0C3A33`, teal text `--color-primary-bright #5FD8BE`, teal
non-text mark `--color-primary-mark #2FB694`, amber on deep `--color-amber-soft #FFB454`.

## Per-project color identity (the Work showcase ONLY)

Every project is shown with **EQUAL weight** in **one consistent system** (same type,
grid, components, quality). Each carries its **own healthcare-grounded theme**, scoped
as CSS vars (`lib/theme.ts → projectThemeStyle`, data in `lib/projects.ts → theme`), so
the SAME components recolor per project. Distinct hue, identical structure. Themes:

- **Lab Logger** — reference-range **teal** (labs)
- **Emotion Stock Market** — **terminal amber on true-black** (its real identity; the one dark project)
- **NurseJet** — telemetry **monitor blue** (ICU monitor)
- **Cleo** — **histology-stain** rose/plum (H&E eosin–hematoxylin; clinically grounded)
- **RateMyHospitalFood** — **nutrition clay** (meal tray) warm neutral

Every theme's text colors must pass AA on its own background.

### Scroll transition (the "stepping into its own space" effect)

`components/sections/WorkShowcase.tsx`: each project is a full-viewport, **opaque,
self-themed** panel; the panels are `position: sticky; top: 0` with rising `z-index`,
so the next slides up and covers the current as you scroll. The theme shifts; the next
project's content settles in (reveal). **Constraints (non-negotiable):**

- **Scroll-native only.** No JS scroll handlers, no scroll-jacking. The stacking is plain
  CSS sticky, so it is smooth on touch and desktop and never janks. Only `transform` /
  `opacity` / `color` animate.
- Opaque panels → every text color always sits on its own theme background (AA-safe,
  including the dark terminal). Mid-transition contrast is never at risk.
- `prefers-reduced-motion` → content reveals are disabled (clean instant section changes);
  the sticky stacking is not an animation, so it stays correct.
- **`body { overflow-x: clip }`, never `hidden`** — `hidden` turns body into a scroll
  container and breaks the sticky stack.
- Each panel: real screenshot (`project.shot`) or honest themed poster (never fake product
  UI), a live demo/link, title, one-line outcome, mono `ROLE · YEAR · STACK`, bespoke
  glyph, status (amber when watch/live), and clear CTAs.

The hero, About, and Contact stay on the **base** palette.

## Typography (3 roles, never one face)

- **Display:** Space Grotesk — wordmark, headlines, section titles, project names, pull-quote
- **Body:** Inter — running prose ONLY (about, descriptions, reading column, button labels)
- **Data:** Space Mono — ALL numerics/metrics, lab-panel keys/values, eyebrows, metadata,
  status lines. Every number is mono + `tabular-nums`. (JetBrains Mono is scoped to the
  embedded terminal only, not a 4th global role.)

Scale in `globals.css`: `.text-hero` clamp(2.5rem,7vw,5.5rem), `.text-display`,
`.text-section`, `.eyebrow` (mono, 0.18em, may tint `--color-primary-deep` via `.eyebrow-brand`).
The Fraunces/serif "journal" pivot was considered and **rejected** (four families, abandons
the wired roles, heaviest LCP).

## Bespoke illustration + icon kit (`components/visual/*`)

Hand-authored inline SVG, single-weight strokes (1.5px icons / ~2px illustration), round
caps, bound to CSS vars (`currentColor` + `--color-primary` / `--color-amber`) so they
recolor on the deep band and per project. No raster, no Lottie, no icon-font, no SVG lib.
lucide-react is reserved STRICTLY for generic UI chrome (arrows, menu, mail) at 1.5px,
never amber. Anything healthcare-specific is bespoke.

- `lib/ecg.ts` — generates a real lead-II P-QRS-T path; the heartbeat is the SAME beat everywhere
- `VitalsWaveform` — the signature; draws ONCE on reveal (clip-path wipe, `.wipe-in`), parks one amber R-peak
- `PulseDivider` — a thin ECG rule between sections (draws once, no amber)
- `NurseBuilderMonogram` — the ink "pulse tile" (nav/footer/favicon `app/icon.svg`)
- `ProjectGlyph` — per-project instrument glyphs (vial, face-landmark→candle, voice→vial, brief sheet, meal tray)
- `TerminalPoster` — a faithful miniature of the Market Pulse terminal (its own black/amber/green-red palette)
- `ProjectPoster` — terminal poster (Emotion) → real `shot` → honest illustrated poster (glyph + waveform)
- `Flowsheet` + `RangeBar` — the lab-panel signature; the in-progress/Beta row is the lone amber watch
- `CountUp` — the ONE scoped count-up (the 560), settles once on scroll-in
- `HandOnChart` — the one human illustration (a bedside clipboard with a vitals trace)
- `LiveGlyph` — the amber "LIVE" pulse tick (never a glowing dot pill)

## Motion (purposeful, restrained)

Reveals: opacity 0→1 + translateY 12→0, 500ms `cubic-bezier(0.22,1,0.36,1)`, ~70ms stagger,
`whileInView` once (`components/motion/Reveal.tsx`). Traces **draw once** on reveal then
park — **never loop/sweep**. ECG motifs resolve to ONE calm beat, **never a flatline**
(non-morbidity rule). The 560 count-up is the one scoped extra. `prefers-reduced-motion`:
every trace/count-up/translate renders complete and settled. **Banned:** parallax, autoplay,
looping sweeps, springy easing, animated gradients, glow-pulse status dots.

## Anti-slop guardrails (never)

- No gradient-mesh/aurora/radial backgrounds. Flat fills + reference-range bands only.
- No glassmorphism / backdrop-blur. Solid surfaces + 1px hairlines.
- No purple→blue gradient hero. No gradient text of any kind.
- No cookie-cutter equal-card bento grid. Work is equal-weight themed panels; capabilities
  are a mono flowsheet list, never cards.
- Not Inter-for-everything — 3 roles enforced.
- **No em-dashes ("—") in prose copy** (Jethro reads them as an AI tell). Use periods,
  commas, colons. Mono middot separators (`ROLE · YEAR · STACK`) are a design element and stay.
- No vague copy. **Banned phrases:** "building the future of ___", "seamless", "leverage",
  "passionate about", "cutting-edge", "honest AI", "people actually trust", "I'm a [adj] builder".
- No emoji decoration, no fake testimonials/logos, no glowing status pills.
- Don't invent biographical facts or product screenshots. Leave honest placeholders / use
  bespoke posters until a real shot exists (`metrics: []` when unverified).

## Required self-critique (before shipping)

Check against the three AI-default looks and revise matches: (1) warm-cream + serif +
terracotta; (2) near-black + single acid accent; (3) broadsheet hairline newspaper.
Ask: "Would I generate this exact layout for any portfolio regardless of subject?" If yes,
push it back toward the clinical/telemetry world.

## Live previews + the game (kept verbatim — load-bearing)

Live previews use ONE component, `components/visual/LiveWindow.tsx`: load-on-click facade,
one live iframe at a time, clinical top bar (amber LIVE pulse only when live), mobile →
fullscreen modal, `prefers-reduced-motion` respected. Set `Project.live.embeddable` from
the site's real `X-Frame-Options` / CSP headers; when false, poster + "Open live" (never a
broken frame). Camera apps pass `allow="camera"` (camera only) and **no `sandbox`** (it
breaks `getUserMedia`). `lab-logger.com` → `X-Frame-Options: DENY` (not embeddable).

The **Emotion Stock Market** (`Project.live.experience === "emotion"`) gets its OWN
full-screen route, not an inline embed: the Work card's "Launch terminal" links to
`app/work/emotion-stock-market` + `components/work/GameStage.tsx` (pinned nav + full-bleed
same-origin iframe to `/stock-game/index.html`, gated by consent + Start, camera released
on leave). The slug is excluded from the `[slug]` case-study `generateStaticParams`. The
game itself is the self-hosted Bloomberg-terminal vanilla JS under `public/stock-game/`
(do NOT rewrite in React — risks the camera); true-black with the **amber `#FFA028`**
signature + green/red for P&L, face-api 68-point landmark overlay in amber.

## Definition of done

A stranger could not tell this was AI-generated. Color encodes clinical state; the ECG
signature + the honest-status-amber lab panel are the two memorable moments; per-project
themes are distinct yet one cohesive system; the scroll showcase is smooth on phone and
desktop and reduced-motion-safe; real work shown with equal weight + live links; 3 coherent
type roles; no banned patterns; no em-dashes; responsive, AA (keyboard, reduced-motion),
fast; no console errors; live previews use the single LiveWindow and never show a broken embed.
