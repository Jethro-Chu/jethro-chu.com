# Portfolio Design Brief — "Flowsheet"

**This file is the source of truth for every visual decision.** Any visual change
must conform to it. Do not drift back toward generic AI-template defaults.

## Mission

The portfolio must read as a deliberate, hand-crafted site — not AI-generated.
Architecture, routing, and content are preserved; the visual layer (type, color,
spacing, motion, structure) and copy are crafted to feel precise, calm, human, and
trustworthy — like good clinical/scientific communication, not a startup landing page.

## Who it's for

Jethro Chu — a nurse-turned-builder finishing a BSN, with real bedside clinical
experience, now designing and shipping healthcare/AI software (including Lab Logger).
His differentiator is **credibility**: he has been the person using clinical software
at the bedside. His own world — telemetry, flowsheets, lab values, reference ranges,
monitoring, medication labels — is the source of every distinctive choice.

## Design concept: "Flowsheet"

Borrow the information-design discipline of a clinical flowsheet / lab report — strict
baselines, aligned columns, monospace numerics, values read against reference ranges,
timestamped annotations — applied with editorial restraint. Most of the page is quiet
and typographic. The "clinical instrument" treatment appears in only **2–3 places**.

## Signature (one memorable element — use sparingly)

Present hard facts the way a lab panel presents values: monospace, aligned, hairline
rules, subtle range bar. Reuse the logic for project metadata (`ROLE · YEAR · STACK`)
and optionally one timestamped annotation. Do **not** spread it across the page.

## Tokens — default: "Flowsheet Light" (cool clinical paper, never warm cream)

```
--bg:      #F2F4F3   cool clinical paper — slightly green-gray
--surface: #FBFCFB   near-white cards/sections
--ink:     #15201C   deep near-black, faint green-black cast
--muted:   #5A655F   muted slate-green secondary text
--line:    #D9DEDB   hairlines / rules
--accent:  #0E7C66   muted clinical teal — data marks, range bars, links ONLY
```

Alternate "Telemetry Dark" (swap, keep everything else identical):

```
--bg:#0B0F0E  --surface:#111614  --ink:#E8EDEB  --muted:#8A958F  --line:#1E2624  --accent:#2BB392
```

Accent is for data/range elements and inline links only — never large fills, never
gradients. The page is essentially monochrome with one disciplined accent.

## Typography (3 roles — never one face for everything)

- **Display:** Space Grotesk (technical-humanist grotesque)
- **Body:** Inter (running text only)
- **Data / labels / captions:** Space Mono (numerics, metadata, eyebrows, signature)

`preconnect` + `font-display: swap`, subset to needed weights. Hero
`clamp(2.5rem, 7vw, 5.5rem)`, display line-height ~1.05, body ~1.6. Hierarchy via
size/weight/spacing — never decorative color.

## Spacing & layout

8px base (4/8/12/16/24/32/48/64/96/128/160). Section padding 120–160px desktop,
64–80px mobile. 12-col grid, max width ~1200–1280px, ≥24px mobile / ≥64px desktop
margins, 24px gutters. Asymmetry encouraged. Radii 0–4px. Borders 1px hairlines.

## Motion (purposeful, restrained)

Scroll reveals: opacity 0→1 + translateY 12→0, 500ms, `cubic-bezier(0.22,1,0.36,1)`,
stagger ~70ms, IntersectionObserver, run once. Hover 200ms. Work items: ~1.5% scale
or image crossfade. At most one signature motion (a range bar / number that settles).
`prefers-reduced-motion`: render final state, no transforms. **Banned:** parallax,
autoplay, springy/bouncy easing, animated gradients.

## Anti-slop guardrails (never)

- No gradient clip-text headlines; no gradient text of any kind.
- No gradient/mesh/aurora backgrounds. No glassmorphism. No glowing status-dot pill.
- No gradient circular single-letter avatar — use a solid-ink wordmark.
- No equal-card bento grid of features. No single font for everything.
- No filler copy. **Banned phrases:** "people actually trust," "honest AI,"
  "I'm a [adjective] builder/thinker," "passionate about," "seamless," "cutting-edge,"
  "leverage." Specific and true beats clever.
- No emoji decoration, no fake testimonials/logos, no autoplay carousels.

## Required self-critique (before shipping)

Check against the three AI-default looks and revise matches:
1. warm-cream bg + high-contrast serif display + terracotta accent;
2. near-black bg + single bright acid-green/vermilion accent;
3. broadsheet hairline-rule, zero-radius, dense newspaper columns.
Ask: "Would I generate this exact layout for any portfolio regardless of subject?"
If yes, push it back toward the clinical/flowsheet world. State what changed and why.

## Sections

- **Nav:** solid-ink wordmark "Jethro Chu" (no avatar). Links: Work · About · Contact.
  No glassy/floating pill. Availability = one quiet mono line, not a glowing pill.
- **Hero:** stripped down. Headline `NURSE & BUILDER`, large display, uppercase,
  tracked. One primary CTA → Work. Optional grounded subline + quiet mono location line.
- **Selected work:** the heart. 3–4 real case studies, Lab Logger first. Each: title,
  one-line outcome, mono metadata (`ROLE · YEAR · STACK`), generous imagery, link.
- **About:** nurse→builder story with specificity; use the lab-panel signature for
  credentials. Clearly-marked placeholders for exact details.
- **Contact / footer:** human, simple, real email/links, one quiet line.

## Live previews (the "live window")

Projects can show a real, in-page preview via ONE reusable component,
`components/visual/LiveWindow.tsx` — never bespoke per-project iframes.

- **Load-on-click facade.** Show the poster (the `ProjectVisual` motif, `bare`)
  first; mount the `<iframe>` only when the visitor clicks Launch/Play. Lazy-load.
  **Only one live iframe active at a time** across the page (coordinated by a
  `livewindow:launch` window event — launching one tears down the others).
- **Clinical instrument framing, not browser chrome.** 1px `--line` border, flat
  corners (radius ≤4px), a thin Space Mono top bar with a **status dot (accent only
  when live)**, the project title + state, and an "Open ↗" link. No traffic-light
  dots. Body is a responsive aspect-ratio box.
- **Mobile** (`max-width: 767px`): launching opens a **fullscreen modal**, not an
  inline iframe. Body scroll locks; a Close control is always present.
- **Camera/permissions:** pass `allow="camera"` for the game — **camera only, never
  microphone**. **Do NOT use a restrictive `sandbox`** — a sandbox without the right
  flags silently breaks `getUserMedia` and the embedded scripts.
- **Consent + loading:** if `live.consent` is set, show that one honest line + a
  **Play** button before launch; show `live.loadingNote` ("Loading model…") over the
  frame until it loads.
- **Frameability fallback.** `live.embeddable` is set per-project from the site's real
  `X-Frame-Options` / CSP `frame-ancestors` headers. When `false`, never mount an
  iframe — show the poster + a prominent **"Open live"** button (new tab). The top-bar
  "Open ↗" link is always available, so there is never a blank or broken frame.
  (Verified: `lab-logger.com` sends `X-Frame-Options: DENY` → not embeddable;
  `jethro-chu.github.io` game → embeddable.)
- Motion is CSS-only so `prefers-reduced-motion` is honored globally.

Data lives on `Project.live` (`lib/projects.ts`): `{ url, embeddable, allow?, consent?,
loadingNote?, openLabel?, experience? }`. The **Emotion Stock Market Game** is the
reference live project (Vanilla JS · face-api.js · TensorFlow.js; on-device, nothing
uploaded).

### The game: full-screen route, not an inline window (`experience: "emotion"`)

The Emotion Stock Market game is a self-hosted **Bloomberg-terminal** vanilla-JS app
(NOT React — that risks breaking the camera) under `public/stock-game/`. It gets its
own full-screen route instead of an inline embed:

- **Work card** (`Work.tsx`): when `live.experience === "emotion"` the entry is a poster
  + metadata with a **Launch** link to `/work/emotion-stock-market` — no inline iframe,
  so the heavy game + face-api only load on their own route and the home page stays fast.
- **Route** (`app/work/emotion-stock-market/page.tsx` + `components/work/GameStage.tsx`):
  the site nav stays pinned; the game fills the rest of the viewport (`100svh`, flex
  column, full-bleed, no framed window). The footer is hidden here
  (`ConditionalFooter`) and the nav renders solid (it's solid on every route except the
  top of home). The slug is excluded from the `[slug]` case-study `generateStaticParams`.
- **Camera/consent:** the camera is **not** requested on load. A consent line + **Start**
  shows first; Start mounts the same-origin iframe `/stock-game/index.html?autostart=1`,
  which starts the camera + detection inside the game. Leaving the route unmounts the
  iframe, releasing the stream.

**The terminal itself** (`public/stock-game/`): flat, dense, monospace (JetBrains Mono),
true-black with the **amber `#FFA028`** signature (command bar, panel titles, key labels,
$1M goal) and green/red **only** for price moves & P&L. Candlesticks via TradingView
Lightweight Charts (CDN) on a random-walk OHLC sim with drift+vol; watchlist, portfolio,
events as terminal **ALERTS** (red flash + "MARKET CRASH", amber "WHALE ALERT"),
localStorage high score, muteable blips. The **SENTIMENT panel keeps the webcam + the
68-point faceLandmark68 overlay drawn in amber** (preserved face-api engine:
`detectSingleFace().withFaceLandmarks().withFaceExpressions()`), expression + confidence
as mono data, and a sentiment score that biases market drift. Camera released on
`pagehide`.

## Definition of done

A stranger could not tell this was AI-generated. No gradient text, no template
furniture, a coherent distinctive type system, real work shown, story-driven,
restrained motion. Signature in 2–3 places. Self-critique done. Responsive,
accessible (AA, keyboard, reduced-motion), fast. No console errors. Live previews
use the single `LiveWindow`, lazy-mount one frame at a time, and never show a broken
embed.
