# PERF_REPORT — jethrochu.com

Performance/quality iteration log. Measured numbers only. Each run: read this file,
pick the next highest-impact batch, do **only that**, verify, record the delta, stop.

Build/measure from `~/dev/portfolio` with node@22:
`export PATH=/opt/homebrew/opt/node@22/bin:$PATH && npm run build`.
Lighthouse: `PORT=3100 npm run start` then `npx lighthouse@12 http://localhost:3100/`
(`--preset=desktop` for desktop; default form-factor for mobile, simulated throttling).

---

## ⚠️ Architecture reality (read before trusting old docs)

The iteration prompt and `HANDOFF.md` describe a **react-three-fiber 3D Half Dome
flythrough** (Draco GLB, `<Canvas>`, `frameloop`, dpr clamp, KTX2). **That architecture
is gone.** As of branch `redesign/yosemite-ascent` (HEAD `868ee26`):

- **No `three` / `@react-three/fiber` / `drei`** in `package.json`, the lockfile, or
  `node_modules`. **No `public/models/` GLB.**
- The "Yosemite flythrough" is now **pure SVG + CSS layered parallax**
  (`components/scenery/YosemiteScene.tsx`): nested valley contour lines + gradient
  washes, animated by Framer Motion scroll transforms on GPU-composited layers. Already
  written with real perf care (no `non-scaling-stroke`, `will-change`, mobile-reduced
  motion envelope, single breakpoint measure).
- Real client-side weight today: **Framer Motion** (~the big app dep), **Lenis** smooth
  scroll, a desktop-opt-in **WebGazer "Eye Scroll"** (CDN-loaded, lazy), **"Ask Jethro"**
  (client UI + `/api/ask-jethro` serverless), and **3 Google fonts** via `next/font`.

`HANDOFF.md` is **stale** — the entire "3D / r3f" section of the prompt's Phase 1 is moot.
The *goal* (faster + better, preserve the climb metaphor + visual identity) is unchanged;
the perf surface is just fonts / JS / animation, not WebGL.

---

## Baseline — 2026-06-23 (HEAD `868ee26`, before any perf work)

### `next build` — First Load JS

| Route | Page JS | First Load JS |
|---|---|---|
| `/` (home) | 41.2 kB | **184 kB** |
| `/resume` | 2.35 kB | 145 kB |
| `/projects/[slug]` (×2 static) | 0.44 kB | 143 kB |
| `/_not-found`, `/api/ask-jethro` | 0.12 kB | 103 kB |
| **Shared by all** | | **102 kB** |

Shared chunks: `4bd1b696` 54.2 kB (React/Next framework), `255` 46.3 kB (app shared —
Framer Motion + Lenis + app code). Home-specific `page` chunk ≈ 41.2 kB gzip (84 kB raw).

### Lighthouse (production build, performance category)

| Metric | Mobile (simulated throttle) | Desktop |
|---|---|---|
| **Performance** | **89** | **100** |
| FCP | 1.0 s | 0.3 s |
| LCP | **3.5 s** (simulated) · 1.5 s observed | 0.7 s |
| TBT | 130 ms | 0 ms |
| CLS | 0 | 0.001 |
| Speed Index | 2.9 s | 0.5 s |
| TTI | 3.5 s | 0.7 s |

**Desktop is already perfect (100).** The entire opportunity is **mobile**.

### Root-cause of mobile LCP (diagnosed, not guessed)

- LCP element = hero sub-headline `<p class="legible-on-scene">` ("Nursing student who
  builds software between clinical shifts."). It is **server-rendered static text** (no
  Framer entrance animation on it).
- LCP phase breakdown: **87% Render Delay (3.0 s)**, 13% TTFB, 0 load time.
- **Observed** FCP and LCP are *identical* at 1493 ms. The "3.5 s" is Lighthouse's
  **Lantern simulated-throttle projection**, which serializes the critical path over a
  ~1.6 Mbps mobile link.
- JS bootup is only **496 ms** and TBT **130 ms** — JS is **not** the bottleneck.
- The dominant critical-path resource is the **121 kB Fraunces preload**
  (`26dc4a78…-s.p.woff2`, the `opsz`+`SOFT` variable serif). It is ~3× the other three
  preloaded fonts and competes for the throttled link's bandwidth, pushing every text
  paint (incl. the Hanken-rendered LCP `<p>`) later in Lantern's model.

### Fonts emitted (next/font, all `display: swap`, AA, CLS 0)

| Family | Role | Preloaded file | Size |
|---|---|---|---|
| **Fraunces** (`opsz`+`SOFT`) | display / `<h1>` name + titles | `26dc4a78…-s.p.woff2` | **121 kB** |
| Hanken Grotesk | body / UI (LCP `<p>`) | `313510e2…-s.p.woff2` | 35 kB |
| IBM Plex Mono | altimeter / labels (×2 subsets) | `98e207f0…`, `d3ebbfd6…` | 10 kB + 10 kB |

`font-optical-sizing: auto` is used (opsz needed). **The `SOFT` axis is referenced
nowhere** (no `font-variation-settings`, no inline styles) — dead weight in the 121 kB file.

### Scene / animation (the "3D" item, adapted — no WebGL exists)

- `YosemiteScene` parallax is **CSS transform/opacity on composited layers** driven by
  Framer `useScroll` → `useTransform`. No per-frame SVG re-raster (deliberately no
  `non-scaling-stroke`). Mobile drops the far + dome layers and uses a smaller motion
  envelope; reduced-motion holds it static.
- In the Lighthouse run: **CLS 0, TBT 130 ms** — the parallax is not causing measurable
  main-thread jank or layout shift. A true sustained-scroll FPS reading needs a *focused*
  desktop browser (the Claude Preview tab runs hidden → rAF paused; see `HANDOFF.md`),
  so FPS is recorded as "not yet measured under load" rather than guessed.

### Mobile reality

No WebGL/3D to thermally stress phones. Mobile cost is: font bytes on the critical path
(above), Framer Motion hydration (~0.5 s bootup), Lenis rAF loop, and the reduced parallax
envelope. The Eye Scroll (WebGazer + camera) is **desktop-opt-in and CDN-lazy** — it never
loads on mobile or on first paint.

---

## Ranked next opportunities (highest impact first)

JS is now in good shape (home first-load 160 kB, mobile TBT 30 ms). The remaining mobile
weakness is **LCP 3.2 s**, which is font-bytes-on-the-critical-path — so font work leads.

1. **Further font trims — the real mobile lever (LCP).** Mobile LCP is still ~3.2 s, gated
   by critical-path font bytes (Fraunces 67 kB + Hanken 35 kB preloaded). Options to measure:
   trim the Fraunces `wght` range to the weights actually used; or drop the `preload` on
   whichever of Fraunces/Hanken is NOT the true LCP element so the LCP font wins the
   bandwidth race. Diminishing returns, but it's what moves mobile now.
2. **Audit `"use client"` reach + provider wrapping.** `AskJethroProvider` +
   `EyeScrollProvider` wrap the whole page; confirm they don't pull avoidable code into the
   first-load path and push client boundaries as far down as possible. Lower impact now that
   first-load is 160 kB and TBT is 30 ms — JS hygiene, not a hot path.

## Done

- ✅ **Shrink the Fraunces critical-path font** — dropped the unused `SOFT` axis
  (`lib/fonts.ts`). See change log 2026-06-23 (font).
- ✅ **Trim Framer Motion** — `LazyMotion` + `m` + sync `domAnimation` (drops drag/layout/pan
  feature code). First-load 184→160 kB, TBT 130→30 ms. See change log 2026-06-23 (motion).

---

## Change log

### 2026-06-23 — Drop unused Fraunces `SOFT` axis

`lib/fonts.ts`: `axes: ["opsz", "SOFT"]` → `axes: ["opsz"]`. `opsz` kept
(`font-optical-sizing: auto` uses it); `SOFT` was referenced nowhere, so it was dead
weight in the largest preloaded font.

| | Before | After | Δ |
|---|---|---|---|
| Preloaded Fraunces `.p.woff2` | 120,724 B | **67,388 B** | **−53.3 kB (−44%)** |
| First Load JS (`/`) | 184 kB | 184 kB | 0 (fonts ≠ JS) |
| Mobile Performance | 89 | **94** | +5 |
| Mobile LCP (simulated) | 3.5 s | **3.0 s** | −0.5 s |
| Mobile Speed Index | 2.9 s | **0.9 s** | −2.0 s* |
| Mobile TBT | 130 ms | 100 ms | −30 ms |
| Mobile CLS | 0 | 0 | 0 |
| Desktop | 100 | 100 (unchanged) | — |

*Speed Index has notable Lighthouse run-to-run variance; the deterministic win is the
−53 kB font and the +5 score. Visual identity verified unchanged via screenshot (Fraunces
still renders with optical sizing; hero, altimeter, parallax, command bar all intact)
— expected, since `SOFT` was never applied.

### 2026-06-23 — Trim Framer Motion (LazyMotion + `m` + sync `domAnimation`)

**Inventory first.** 9 files import framer-motion. APIs in use: `motion.*` (div/span/button/
circle/path/p/li, 7 files), `AnimatePresence`+`exit` (3 files), `whileInView` (Reveal),
`useScroll`/`useTransform` (4 files), `useReducedMotion` (many). **No `drag`, no `layout`/
`layoutId`, no pan, no spring** (the `drag`/`layout` grep hits were all comments). So
`domAnimation` (animations + variants + exit + whileInView + hover/tap/focus) is sufficient;
`domMax` (adds drag+layout) is not needed. Confirmed `domAnimation` includes `inView` by
reading the installed v11.18.2 feature source.

**Change.** New `components/motion/MotionProvider.tsx` wraps the app once in `app/layout.tsx`
with `<LazyMotion strict features={domAnimation}>`. Converted every `motion.*` → `m.*` across
the 7 component files (`strict` throws on any miss; verified none remain). The scroll hooks
and `useReducedMotion` are not LazyMotion-gated, so the scroll driver is untouched.

**Sync, not async — measured decision.** Tried the async bundle
(`features={() => import("framer-motion").then(m => m.domAnimation)}`): first-load **161 kB**,
but it added a post-first-paint work burst (every `m` upgrades when the chunk lands → sporadic
TBT spikes) and a window where the scroll parallax was not yet live. The climb is the product,
so a dead first-scroll is a regression. Sync `domAnimation` measured **160 kB** (≈ same / 1 kB
smaller) with the parallax live from frame one and no burst. Kept sync.

| | Before (post-font) | After | Δ |
|---|---|---|---|
| First Load JS `/` | 184 kB | **160 kB** | **−24 kB (−13%)** |
| First Load JS `/projects/[slug]` | 143 kB | **114 kB** | −29 kB |
| First Load JS `/resume` | 145 kB | **116 kB** | −29 kB |
| Mobile Performance | 94 | **93** | ≈ (±noise band) |
| Mobile TBT | 100 ms | **30 ms** | **−70 ms** |
| Mobile CLS | 0 | **0** | 0 |
| Mobile LCP | 3.0 s | 3.2 s | ≈ (font-bound, untouched) |
| Desktop | 100 | **100** | — |

Mobile numbers are the median of 3 identical warm passes (93/93/93, TBT 30, CLS 0). The
deterministic wins are **−24 kB first-load** and **−70 ms TBT** (less feature code to parse at
hydration). **Motion verified** via headless-Chrome/CDP (real active page, rAF runs — unlike
the hidden Claude Preview tab): parallax = 4 contour layers scale on scroll (1.13/1.33/1.40/
1.71), altimeter marker translates with scroll (y 97→675), no reveal stuck invisible
(whileInView fires), Ask-Jethro AnimatePresence dialog opens, Eye Scroll trigger present,
**0 console errors/warnings** (no `strict` violations). Hero screenshot unchanged.
