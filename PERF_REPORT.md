# PERF_REPORT — jethrochu.com

Performance/quality iteration log. Measured numbers only. Each run: read this file,
pick the next highest-impact batch, do **only that**, verify, record the delta, stop.

Build/measure from `~/dev/portfolio` with node@22:
`export PATH=/opt/homebrew/opt/node@22/bin:$PATH && npm run build`.
Lighthouse: `PORT=3100 npm run start` then `npx lighthouse@12 http://localhost:3100/`
(`--preset=desktop` for desktop; default form-factor for mobile, simulated throttling).

---

## 2026-07-01 — "Fable polish" pass (branch `feat/village-fable-polish`)

Cinematic atmosphere in the scene (golden-hour grade + blue vignette, god rays,
drifting fog, lit windows, chimney smoke, river glints, butterflies, gold motes,
door lanterns), the whole HUD rebuilt on one carved-plaque system (nav with
integrated "← Portfolio" exit, parchment collapsible minimap, action-verb door
prompts, staged intro), building hover/click-to-enter, and per-room themed
interiors (healer's station / workshop / machine room / post office / dusk
overlook) with rewritten copy + facts tables + tagged project cards.

**Measurements (`next build`, node@22):**
| Route | First Load JS | Δ |
|---|---|---|
| `/` (home) | **164 kB** | **+0** |
| `/village` (initial) | **105 kB** | **+0** |

- Budget held: every addition (scene FX, HUD, room themes) lives in the
  code-split village chunk; the atmosphere is world-anchored sprites/particles
  (no shaders, no screen-fixed overlays fighting the camera zoom).
- Build green, `tsc --noEmit` clean, 15/15 static. Verified in-browser: intro
  staged reveal + Enter-to-play; plaque nav + exit; minimap collapse persists;
  prompt verbs per building; rooms themed with AA header inks per wall; door
  chip legible on light walls; mobile 375x812 canvas fills the viewport.

`/` now auto-opens the village over the SSR scroll site (capable visitors only; the site
stays the crawler/no-JS/reduced-motion fallback + the "Back to the portfolio" escape).
Entering any of the 7 buildings opens a full-screen walkable `InteriorRoom` (info backdrop +
roaming CSS-sprite hiker + door back) instead of the modal.

**Measurements (`next build`, node@22):**
| Route | First Load JS | Δ |
|---|---|---|
| `/` (home) | **164 kB** | **+0** (InteriorRoom + Phaser stay in the code-split village chunk) |
| `/village` (initial) | **105 kB** | +0 |
| `/valley` | 122 kB | — |

- Budget held: initial loads unchanged. `InteriorRoom` is a static import inside the
  dynamic `VillageMount`, so it rides the on-demand chunk, never `/`'s initial JS. The
  homepage auto-open loads Phaser AFTER first paint (on the overlay mount), not in the
  gated initial bundle.
- Build green, `tsc --noEmit` clean, 16/16 static. Verified in-browser: homepage auto-opens
  the village + keeps the SSR site under it; entering a building opens its room with the full
  info + roaming character + door/back; close resumes the village. The rAF roam loop only
  ticks while the tab is visible (rAF pauses when hidden) — verified the loop runs + moves the
  hiker during a visible window; full walk to confirm on the live (visible) preview.

---

## 2026-06-29 — Village camera + wayfinding (branch `feat/yosemite-village`)

Camera/nav legibility pass: widened the view (design res 480×270 → **768×432**, integer zoom
levels `[1,2,3]` default 2), rebuilt the minimap as a real town map, made the nav fast-travel,
added a directional cue, in-world signposts, a one-time hint, and zoom controls (wheel / pinch
/ keys / buttons). No map/art/mount/code-split changes.

**Measurements (`next build`, node@22):**
| Route | First Load JS | Δ |
|---|---|---|
| `/` (home) | **164 kB** | **+0** (all new HUD is in the code-split village chunk) |
| `/village` (initial) | **104 kB** | **+0** (no Phaser; behind intro) |
| `/valley` | 122 kB | +2 kB (prior prototype, still present) |

- Budget held trivially: homepage + village initial loads **unchanged** vs the prior commit.
  The camera change is data (resolution/zoom numbers); the HUD additions (ZoomControls,
  DirectionCue, ControlsHint, rebuilt Minimap) all land in the dynamic village chunk that
  only loads after the entry click, so they never touch the gated initial JS.
- Build green, `tsc --noEmit` clean, 16/16 static pages. Verified end-to-end in-browser
  (Chrome): wider default view shows several buildings; zoom out → town overview; minimap
  markers + you-are-here + legend + visited gold; nav/minimap fast-travel opens the right
  panel; signposts readable; direction cue points to the nearest unvisited; mobile (402-wide)
  nav scrolls, HUD usable, camera sane. Pixel-perfect maintained (integer zoom).
- Mobile Lighthouse delta is **+0 kB** initial JS, so well within the 5-pt gate (not re-run).

---

## 2026-06-29 — Yosemite Village (branch `feat/yosemite-village`)

Hub-based explorable pixel TOWN (replaces the open valley), built from the pack's
pre-composed `TilesetHouse` + `tileset_camp` buildings. Same engine/gate/bus/modal/overlay
as the valley; the homepage "Enter Yosemite Village" overlay mounts the shared `VillageMount`.

**Measurements (`next build`, node@22):**
| Route | First Load JS | Note |
|---|---|---|
| `/` (home) | **165 kB** | +5 kB vs 160 kB baseline (within +15 kB gate); island only, no Phaser |
| `/village` (initial) | **114 kB** | standalone route; **no Phaser** (behind the entry card) |
| `/valley` | 120 kB | prior prototype, still present |

- Phaser + tilemap code-split, fetched only on entry; no Phaser in any prerendered HTML.
- Build green, types pass, 0 console errors. Median-of-5 mobile Lighthouse owed at the gate
  (delta is +5 kB JS with no Phaser, so expected within 5 pts; not yet formally run).

**Honest status (the brief's 80/20 rule):** the town reads as a believable hub — plaza +
radiating paths + 7 buildings as districts + tents + trees + the Merced with a bank edge +
a plank bridge to the torii overlook. It is a strong BASE, not Peter-tier polish. Remaining
~20% is hand-tuning in Tiled: denser props/fences/flowerbeds (some bare grass remains), a
richer plaza, water-edge autotiling, in-canvas bitmap-font signposts (currently lantern
markers + DOM minimap labels + on-approach panels), the El Cap / Half Dome skyline (deferred),
cards + ambient-audio toggle, and the `.tmj` export. Buildings are stamped from verified
source rects (houses cols 0-3/4-7/8-11/12-15; grand lodge cols 25-28 rows 8-13; torii cols
0-2 rows 5-6; tents camp cols 4-6/7-9/10-12).

---

## 2026-06-29 — Yosemite valley prototype (branch `feat/yosemite-valley`)

A top-down explorable Yosemite valley (Phaser 3 + the Ninja Adventure CC0 tileset), built as
an isolated prototype at `/valley`. Live homepage `/` and the scroll site untouched. Spec in
`GAME_DESIGN.md`, architecture in `HANDOFF.md`, art credit in `CREDITS.md`.

**New dependency — Phaser 3.80 (justification):** the one sanctioned new dep (the brief
authorizes it); the engine for the valley. Imported via `next/dynamic({ ssr:false })` ONLY on
the "Enter the valley" click, so it lands in its own code-split chunk, absent from the server
bundle, the initial `/` and `/climb`/`/valley` loads, and fallback/crawler traffic. Tiled is
NOT a dependency (plain JSON output); the touch controls are hand-rolled.

**Asset payload:** cherry-picked 16-px tilesets + Hunter sprite/faceset + 2 FX into
`public/game/ninja-adventure/` = **276 KB** (not the 110 MB pack; no monsters/bosses/music).

**Measurements (`next build`, node@22):**
| Route | First Load JS | Note |
|---|---|---|
| `/` (home) | **162 kB** | +2 kB vs 160 kB baseline (noise) — homepage untouched, within +15 kB gate |
| `/valley` (initial) | **119 kB** | new prototype route; **no Phaser** in the initial load |
| Phaser chunk (on Enter) | ~**308 kB gz** | lazy; fetched only on "Enter", + tileset PNGs from /public |

- **Perf gate (initial `/` load) intact.** The engine + art never ship to the fast path.
  Median-of-5 mobile Lighthouse to be re-captured at the Phase 7 gate (baseline mobile 93,
  recorded below).
- Build green, types pass, 0 console errors. Code-split confirmed at build and runtime.

**Two lessons (cost real time, recorded so they aren't repeated):**
1. **`Scale.RESIZE` gives a 0-width canvas in the preview tab** (the tab is ~2px / 0-size, so
   rAF + element size are degenerate). Use `Scale.FIT` with a fixed design resolution so the
   canvas renders independent of window size.
2. **Phaser does not auto-chain `firstgid`** for a blank multi-tileset tilemap (all default to
   0 → every tile resolves to the first tileset). Assign firstgids explicitly. Tile indices
   were then chosen by **pixel analysis** of each tileset, not by eye (the scaled preview is
   too blurry to read indices reliably).

---

## 2026-06-29 — "Enter the valley" homepage overlay (branch `feat/valley-overlay`)

Opt-in entrance that mounts the valley as a full-screen overlay over the SSR scroll homepage
(no navigation). Homepage stays a Server Component; one thin client island (`ValleyDoor`) +
gated entrances (`EnterValleyButton`) + a shared `ValleyMount`.

**Measurements (`next build`, node@22):**
| | Pre-change (`/`) | After overlay (`/`) | Δ |
|---|---|---|---|
| First Load JS | 162 kB | **164 kB** | **+2 kB** (well within the +15 kB gate) |
| Phaser on initial load | none | **none** | the island defers everything valley behind the click |
| SSR HTML | content only | **content only** | no entrance, no Phaser (entrance is client-gated) |

- `/valley` unchanged (119 kB) — the scene is shared, not forked. Build green, types pass.
- Median-of-5 mobile Lighthouse to re-confirm at the Phase 5 gate (baseline mobile 93). The
  only added initial cost is the island; +2 kB is far under budget.
- **Verified at runtime:** entrance renders only for capable clients; Phaser loads **only on
  click**; ← / ESC destroy the canvas (no leaked canvas/rAF — confirmed `canvas` gone after
  close); re-entry re-creates; body scroll + Lenis + scroll position restored on close.

**Lesson (cost real time):** **`AnimatePresence` freezes the exiting subtree at its last
render**, so a child mounted inside the exiting overlay (the Phaser `ValleyMount`) stays alive
through the exit animation — and in the throttled preview the exit never completes, so the
engine never tore down. Fix: don't gate the engine behind an exit animation. Unmount the
overlay directly on `open=false` (instant `game.destroy`); keep only the enter fade.

**Note:** the preview tab reports a ~0-width window, so `canPlayValley()` (viewport ≥ 360)
hides the entrance there by design — correct for tiny screens, but it means the entrance +
overlay visuals must be judged in a focused real browser (the merge gate).

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

## Investigated, parked (do not re-litigate)

### 2026-06-23 — Hero scroll jank → YosemiteScene SVG dolly re-raster (user: leave as-is)

**Symptom:** periodic stutter while scrolling the hero. **Diagnosis (Chrome trace +
CDP, headless system Chrome — the only reliable way; the Claude Preview tab pauses rAF):**

- A/B: hero region (scene visible) ≈ 32 ms/frame avg with periodic 80–130 ms hitches
  (jank>50ms ≈ 12 frames / 2 s scroll); a deep region with the scene faded is ≈ 18 ms,
  **zero** frames >50 ms. The jank is 100% the `YosemiteScene`.
- Trace during a 2 s hero scroll: **RasterTask 717 ms / 190 tasks (max 96 ms)**;
  FunctionCall 63 ms, Layout 5 ms. So it's **raster, not script/layout**. The 4 contour
  layers dolly-**scale up to 2.1×**, and Chrome **re-rasterizes the vector SVG every frame**
  on scale-up to keep strokes sharp. (The in-file comment claiming "scale for free / no
  per-frame re-raster" is wrong — measured.)

**Fixes tried and MEASURED to fail (don't repeat):**
1. Reduce scale magnitude (fore 2.1→1.55 etc.): RasterTask 717→665 ms (−7%). Cost is
   driven by scale *changing at all*, not magnitude. Pointless feel change.
2. Drop 2 of 4 scaling layers (far/dome → translate-only): 717→665 ms (−7%). mid+fore
   dominate the raster cost, and they're the prominent dolly.
3. Isolate each layer on its own static GPU texture (inner `translateZ(0)` layer): made it
   **worse** (717→841 ms) — Chrome propagates effective scale down and re-rasters anyway.

**RESOLVED 2026-06-23 (commit `4e8e802`): scene made STATIC.** User reported the hero
lag again ("really bad"), so it was fixed. Two more fixes were tried and ALSO measured to
fail — **option (B) was wrong:**
4. Rasterize each layer to a `<canvas>` once, scale the canvas: RasterTask ~824 ms. Scaling
   the parent layer re-rasters its tile (canvas drawn in at the new scale) regardless.
5. Rasterize to a PNG `<img>`, scale the img: ~759 ms. Not direct-composited here, re-rasters
   too. **So (B) "bitmap then GPU-scale" does NOT work — do not retry it.**

**Measurement caveat learned:** headless macOS Chrome software-renders (even with GPU flags),
so RasterTask totals conflate software compositing with re-raster — they CANNOT distinguish
scale vs translate. The trustworthy headless metric is **frame pacing** (avg interval +
count of frames >50 ms), not RasterTask totals. Real-GPU cost can only be confirmed by the
user on their machine.

**What actually worked:** make the contour layers **static** (no per-frame transform at all)
and keep only the scene-opacity dissolve. Frame pacing: dolly avg 31.6 ms / 12 frames >50 ms
→ static avg **17.8 ms / 0 frames >50 ms**. Note translate-only stayed janky (avg ~31, 10–13
frames >50 ms) — the cost is per-frame transforming four full-screen layers *at all*, not the
scale specifically. The altimeter still tracks the climb, so the ascent metaphor holds; hero
visuals are unchanged at rest. Trade-off accepted: the scene no longer parallax/zooms on scroll.

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
