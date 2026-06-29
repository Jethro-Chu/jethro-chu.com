# HANDOFF — jethrochu.com

Build/dev with **node@22**: `export PATH=/opt/homebrew/opt/node@22/bin:$PATH`, then
`npm run dev -- --port 4321` / `npm run build`. (Homebrew node is 22; nvm's default v18 trips
Tailwind v4 oxide.) **`npm run build` clobbers a running dev server's `.next`** → 500
(routes-manifest ENOENT); fix = stop+start the dev server (don't just rm .next under it).

---

## ACTIVE: Yosemite valley prototype (branch `feat/yosemite-valley`, route `/valley`)

A top-down, explorable pixel **Yosemite Valley** (Phaser 3, tile-based) on the **Ninja
Adventure** CC0 tileset, modeled on peteroravec.com. Built as an **isolated prototype**: the
live homepage `/` and the shipped scroll site are untouched. Locked spec in `GAME_DESIGN.md`;
metrics + the Phaser justification in `PERF_REPORT.md`; art credit in `CREDITS.md`.

**Architecture**
- `app/valley/page.tsx` (server) renders `FlatValley` (real, SSR'd, indexable content) with
  `ValleyExperience` layered over it. (At integration the existing shipped site becomes the
  fallback instead of FlatValley.)
- `components/ValleyExperience.tsx` (client) — capability gate (reduced-motion / WebGL) +
  entry card ("Enter the valley" / "Skip to the portfolio") + the **code-split** dynamic
  import of Phaser (`ssr:false`, only on the Enter click) + HUD + modal + skip.
- `game/PhaserValley.tsx` — the `ssr:false` target; mounts `Phaser.Game` (Scale.FIT, design
  480×270, `pixelArt`). **Only module that imports `phaser`**, so it stays in its own chunk.
- `game/scenes/ValleyScene.ts` — loads the cherry-picked tilesets, generates the valley
  in-code (grass / Merced / forest / trails / granite rim), the hiker (4-dir, collision),
  the camera (zoom 2), and 7 landmark triggers. A `DEBUG_ATLAS` const renders a labeled
  tileset for index-reading. Tile indices verified by pixel analysis (see GAME_DESIGN §10).
- **Bridge:** `lib/gameBus.ts` typed singleton event bus. Phaser emits `game:ready` /
  `landmark:enter` / `landmark:discovered` / `player:move` / `card:collect`; React emits
  `game:pause` / `game:resume` / `game:skip`. (Dev-only `window.__valleyBus` + `window.__valley`
  handles, stripped from prod, for tests.)
- `components/valley/LandmarkModal.tsx` (faceset headshot + content + focus trap + pause),
  `components/HUD/Discovered.tsx` (N/7), `components/valley/FlatValley.tsx` (SSR fallback).
- **Content source of truth:** `content/portfolio.ts` (real facts from `content.ts` +
  `resume.ts`; `JETHRO:` drafts for voice lines). **Assets:** cherry-picked 16-px tilesets +
  Hunter sprite/faceset in `public/game/ninja-adventure/` (~276 KB, not the 110 MB pack).

### Homepage overlay entrance (branch `feat/valley-overlay`, off the above)
Opt-in "Enter the valley" that mounts the SAME valley as a full-screen overlay OVER the
scroll homepage (no navigation). The homepage stays a **Server Component**; one thin client
island does the work.
- `components/valley/ValleyMount.tsx` — extracted shared playable surface (dynamic Phaser +
  Discovered + LandmarkModal). Consumed by BOTH `ValleyExperience` (/valley) and the overlay,
  so the scene is never forked. Phaser is dynamically imported here = code-split.
- `components/valley/EnterValleyButton.tsx` — the entrance (`variant` hero | station). Renders
  null on the server and when `canPlayValley()` is false (reduced-motion / no-WebGL / viewport
  < 360), so the SSR HTML + SEO are unchanged and crawlers/incapable users never see it.
  Emits `valley:open`. Placed in `Hero.tsx` (after `<HeroCommand/>`) and the Altimeter mobile
  station bar.
- `components/valley/ValleyDoor.tsx` — the overlay controller in `app/page.tsx` (renders
  nothing until opened). On `valley:open`: capture `scrollY`, `window.__lenis.stop()` + body
  `overflow:hidden`, mount the overlay (Framer enter fade). On ← / ESC: **unmount immediately**
  (no AnimatePresence exit — that froze the subtree and leaked the canvas; `game.destroy(true)`
  runs via PhaserValley cleanup), then restore Lenis + body + `scrollY` + focus. `lib/gameBus.ts`
  gained `valley:open` / `valley:close`. Capability shared in `lib/canPlayValley.ts`.
- **Verified:** homepage +2 kB first-load (164 kB), no Phaser on initial load, SSR HTML has no
  entrance/Phaser, Phaser loads only on click, ← / ESC destroy the canvas (no leak), re-entry
  re-creates, body/Lenis/scroll restored. **Merge gate:** do NOT merge to master until Jethro
  walks it in a focused desktop browser AND on mobile (the preview's ~0-width window hides the
  entrance, so the entrance/overlay visuals can only be judged in a real browser).

**Next step (valley prototype):** export `game/map/valley.tmj` for Tiled; author the custom El
Capitan / Half Dome / Yosemite Falls art + the Ahwahnee building; trail cards + Glacier Point
payoff; DOM minimap. Open `/valley` in a **focused desktop browser** (preview throttles rAF).

---

## SUPERSEDED (stale): 3D Half Dome hero

> The section below describes a react-three-fiber 3D hero that was **removed** before the
> shipped Yosemite Ascent (no `three`/`drei` in `package.json`). Kept for history only.

Branch `redesign/yosemite-ascent`. Build/dev with **node@22**:
`export PATH=/opt/homebrew/opt/node@22/bin:$PATH` then `npm run dev` (port 4321) / `npm run build`.
(nvm's default v18 trips Tailwind v4 oxide.) All 3D work committed: `58de733`, `e234630`, `fd2f5f5`.

## What's built and working
- Real-time 3D Half Dome flyover as the hero background (replaces the flat SVG scenery). react-three-fiber + drei.
- Model `public/models/halfdome-opt.glb` (5.9MB Draco, from 123MB raw). "Half Dome, Yosemite" by Alan Zimmerman (@nenjo), CC-BY-4.0 — credit is in the footer.
- Scene auto-orients the dome to -Z and grounds the base to y=0 from the geometry. Camera flies a keyframe path (wide dome → approach → near the face), driven by the SAME Framer `useScroll` as the altimeter (remapped through measured section positions so it's hero-scoped).
- **No clipping** by construction: camera kept outside the mesh (camZ ≥ ~1.06·halfD) and high above terrain (py floor). Verified via forced-render endpoints.
- **Hero-only**: the 3D layer fades out (canvas opacity via `cameraProgress` 0.8→1) before the project cards → cards sit on clean sand.
- Text readability: `.legible-on-scene` halo + a localized sand veil; "Jethro Chu" stays legible.
- Desktop = animate (`frameloop="always"`). Mobile (<760px) / reduced-motion = ONE static Half Dome frame (looks great, fills screen).
- `tsc` + `next build` pass; all static; First Load ~156kB (three/drei lazy-loaded, never blocks LCP).

## Broken / in progress
- **"Scroll feels static" — root cause fixed in `58de733`, NOT visually confirmed live.** `decideMode` was forcing static mode whenever `hardwareConcurrency <= 4`, freezing the camera on many desktops (the rail kept moving because it reads scroll directly). Now only reduced-motion or width<760 → static; low core just lowers DPR; keyframes widened for obvious motion. Could not confirm live (see gotcha) — needs a focused-browser scroll test.
- **Polish TODO**: on wide desktop the photogrammetry chunk's bottom/side edges read slightly "floating." Crop tighter / lean on fog.

## Key gotchas
- **The Claude Preview tab runs HIDDEN (and sometimes 0-size).** Hidden tabs pause `requestAnimationFrame`, so the scroll-driven 3D looks frozen and can't be screenshotted live; R3F's canvas also fails to init at 0-size. **Verify motion in a real focused browser, not the preview.** Earlier screenshots only worked while the tab happened to be visible.
- **Frameloop**: `animate ? "always" : "demand"` (YosemiteBackground.tsx). Desktop = "always" (redraws every frame); Rig `useFrame` reads `progress.get()` each frame. There is **no** visibility/`paused`/`"never"` logic — it was removed because it froze the scene; **do not re-add it.** `"demand"` is only the intentional static frame.
- Rapid edit/reload churn corrupts `.next` (GET / → 500, canvas won't mount): `rm -rf .next` + restart. Preview reloads corner-pin the view; a fresh `preview_start` (not reload) renders full-frame.

## Important files
- `components/scenery/yosemite/Scene.tsx` — the Canvas. `Model` (auto-orient/ground, fills metrics `M`), `KEYS` + `sampleKey` (camera path — **tune here**), `Rig` (useFrame; fog/sun/sky lerp via `goldenWeight`), `SkyDome` gradient shader.
- `components/scenery/YosemiteBackground.tsx` — wrapper: dynamic ssr:false import, lazy-mount (setTimeout backstop), `decideMode`, scroll→`cameraProgress` remap (`ANCHOR_CP`), canvas opacity fade, sand veil.
- `components/scenery/yosemite/cameraPath.ts` — `STATIC_P` (0.68) + `goldenWeight`.
- `public/models/halfdome-opt.glb` — shipped model. Source `public/models/half_dome_src/` is gitignored; re-optimize with `gltf-transform optimize --compress draco --texture-compress webp --texture-size 2048` (simplify does NOT reduce this photogrammetry mesh).
- `app/globals.css` `.legible-on-scene`; `components/Footer.tsx` CC-BY credit.

## Single next step
Open http://localhost:4321 in a **focused desktop browser**, hard-reload once, and scroll the hero slowly: confirm the camera visibly glides (Half Dome grows/approaches) then fades before Projects. If it moves → tune edge fog/framing. If still static → live-debug with the tab focused (frameloop must be "always"; confirm `cameraProgress` updates in the Rig's `useFrame`).
