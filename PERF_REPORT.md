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

1. **Trim Framer Motion from the 184 kB first load.** It dominates the `255` shared chunk.
   Options, cheapest→deepest: `LazyMotion` + `m` components (defer the full feature bundle),
   or move the simplest reveals/parallax to pure CSS scroll-driven animation. Needs care —
   Framer is used widely (scene, reveals, scroll). Medium risk, big JS win.
2. **Audit `"use client"` reach + provider wrapping.** `AskJethroProvider` +
   `EyeScrollProvider` wrap the whole page; confirm they don't pull avoidable code into the
   first-load path and push client boundaries as far down as possible.
3. **Further font trims (smaller, lower-risk).** The Fraunces preload is now 67 kB. If
   mobile LCP needs more: trim the Fraunces `wght` range to the weights actually used, or
   drop the *preload* on whichever of the two display/body fonts is NOT the true LCP element
   so the LCP font wins the bandwidth race. Measure each — diminishing returns.

## Done

- ✅ **Shrink the Fraunces critical-path font** — dropped the unused `SOFT` axis
  (`lib/fonts.ts`). See change log 2026-06-23.

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
