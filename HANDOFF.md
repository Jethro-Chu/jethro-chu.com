# HANDOFF — 3D Half Dome hero (jethrochu.com)

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
