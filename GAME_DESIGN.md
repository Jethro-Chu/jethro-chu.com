# GAME_DESIGN — Yosemite Valley (locked spec)

A top-down, explorable pixel **Yosemite Valley** (Phaser 3, tile-based) modeled on
peteroravec.com: walk a hiker around the valley floor, discover landmark "stations" that
open modals with real portfolio content. Built on the **Ninja Adventure** CC0 tileset
(see `CREDITS.md`). The art quality comes from the tileset, not from generated pixels.

Status: **prototype** on branch `feat/yosemite-valley`, route `/valley`. The live homepage
`/` and the shipped scroll site are untouched until merge. A follow-on branch
`feat/valley-overlay` adds an opt-in "Enter the valley" entrance that mounts this same scene
as a full-screen overlay over the homepage (shared `ValleyMount`; see HANDOFF).

---

## 1. Pixel pipeline (hard constraints)
- **16×16 tile grid.** Lock the game to it.
- Phaser: `pixelArt: true`, `roundPixels: true`, `antialias: false`, Scale `FIT` +
  `CENTER_BOTH`, **integer camera zoom** (the 16-px tiles must scale up cleanly).
- Use the pack's **own palette** — do not recolor tiles. Cohesion = staying in the pack's
  color world.
- Pixel art lives **only inside the canvas**. DOM chrome (HUD, minimap, modals, buttons,
  type) uses the existing Yosemite Ascent tokens (Fraunces / Hanken / IBM Plex Mono;
  sand / pine / golden).

## 2. Assets (cherry-picked into `public/game/ninja-adventure/`)
Tilesets (16px, clean grids; TilesetFloor cropped to 352×416):
- `TilesetFloor` (22×26) — grass + dirt path autotiling base
- `TilesetFloorB`, `TilesetFloorDetail` — floor variants/details
- `TilesetNature` (24×21) — trees, stumps, bushes, **grey granite boulders**
- `TilesetWater` (28×17) — water autotiling + a wooden bridge/dock
- `TilesetRelief` (20×12), `TilesetReliefDetail` — grass-topped cliffs = **valley walls**
- `TilesetHouse` (33×23) — the Ahwahnee (exterior + interior)
- `TilesetElement` (16×15), `tileset_camp` (23×9) — props, campground
Sprites: `hunter.png` (64×112 = 4 cols × 7 rows of 16px; the hiker) + `hunter-face.png`
(38×38 faceset → modal headshot). FX: `Fog.png`, `Raylight.png`.

## 3. Camera / zoom (LOCKED)
- Scale **`Phaser.Scale.FIT`** with a fixed design resolution **480×270** (16:9). FIT is
  required so the canvas renders at a defined size even when the window is 0-size (the
  Claude Preview tab); `Scale.RESIZE` was tried and produced a 0-width canvas there.
- Camera **zoom = 2** (integer), `roundPixels`, follows the player (lerp 0.12), clamped to
  the map bounds. Shows ~15×8 tiles. (Revisit a 3× tier for large desktops in Phase 7.)
- Map: **64×44 tiles** (1024×704 px).

## 4. The valley map (Tiled JSON, `game/map/valley.tmj`)
A bounded valley floor: meadow/grass base, the **Merced** (water) winding through, conifer/
oak forest, a trail network, **valley walls** (cliff tiles) around the rim, a campground
vignette. Object layer holds the spawn point, 7 landmark trigger zones, and card pickups.
Generated programmatically as a good first pass (`scripts/genValley.mjs`); hand-polish in
Tiled later. Layers: `ground` → `paths` → `water` → `decoration` → `overhead` (drawn above
the player) + a `collision` layer and an `objects` object layer.

## 5. Landmark -> content map (drives `content/portfolio.ts`)
| id | Landmark | Section | Real content |
|---|---|---|---|
| `tunnel-view` | Tunnel View (spawn) | Intro | Who Jethro is (nurse + builder). |
| `el-capitan` | El Capitan | Origins | Why nursing, why code. |
| `yosemite-falls` | Yosemite Falls | Clinical | BSN @ Azusa Pacific (Dec 2026); 560 hrs; BLS/ACLS; telemetry. |
| `half-dome` | Half Dome | Builder | NurseJet, Lab Logger, Rate My Hospital Food, Emotion Stock Market. |
| `ahwahnee` | The Ahwahnee | Under the hood | How this site works + the pixel-boy CC0 credit. |
| `merced-bridge` | Merced · Swinging Bridge | Contact | Email, GitHub (LinkedIn omitted until real). |
| `glacier-point` | Glacier Point | Payoff | Dual-identity statement, resume download, panorama. |

## 6. Mechanics
- **Top-down free-roam.** 4-direction movement (WASD/arrows + a hand-rolled touch joystick);
  arcade-physics collision from the map's collision layer; camera follows.
- **Minimap** (DOM overlay) with landmark markers + discovered/undiscovered state.
- **Discovered HUD** (DOM overlay): `N / 7`.
- **Trail cards:** 6 hidden pickups, `card:collect`, session-persisted, flip to an aphorism.
- **Glacier Point payoff:** panorama + dual-identity statement + resume download.
- **Entry card:** "Enter the valley" / "Skip to the portfolio"; persistent "Skip the valley →".
- **Ambient (optional):** a wandering animal; one pack track, OFF by default, never autoplay.

## 7. Custom art (the only hand-drawn pixels — pack palette, must blend)
- **El Capitan** — towering granite cliff (assembled from `TilesetRelief` cliff tiles + custom).
- **Half Dome** — the dome silhouette (grey `TilesetNature` boulders + custom rounded top).
- **Yosemite Falls** — animated waterfall (water tiles + WaterPillar FX + custom strip).
- Small landmark signs/markers (none in the pack).
If these can't blend at an acceptable bar, **bail** and surface options — do not ship
mismatched art.

## 8. Bridge events (`lib/gameBus.ts`)
Phaser emits `game:ready` / `landmark:enter` / `landmark:discovered` / `player:move` /
`card:collect`. React emits `game:pause` / `game:resume` / `game:skip` / `valley:open` /
`valley:close` / `valley:play` (intro PLAY → hand control) / `valley:goto {id}` (nav/minimap
fast-travel) / `valley:zoom {dir}` (zoom buttons step the camera).

## 9. Personal-voice copy (placeholders — Jethro authors, then /stop-slop)
- Tunnel View intro line; Glacier Point dual-identity statement.
- 6 card aphorisms (seeds in `content/portfolio.ts`).

## 10. Implementation notes (what was built, 2026-06-29)

- **Tile indices were chosen by pixel analysis, not by eye.** Reading exact indices off the
  FIT-scaled preview is unreliable; instead each tileset PNG is loaded to a canvas and tiles
  are scored by opacity/mean-color/variance. Verified picks: grass `floor:245`, dirt
  `floor:188`, water (Merced) `water:197`, granite wall `relief:122`, trees `nature` blocks
  top-left 53 and 73 (green canopy over a brown trunk, detected programmatically).
- **firstgids must be assigned explicitly.** Phaser does NOT auto-chain firstgids for a blank
  (non-Tiled) tilemap with multiple tilesets — they all default to 0 and every tile resolves
  to the first tileset. Assign `firstgid` per tileset (chained by tilecount). This was the
  bug behind the early "everything is the floor tileset" render.
- **Map generation is currently in-code** (`ValleyScene.buildValley`) using Phaser's
  `make.tilemap` + `createBlankLayer` + `putTileAt`, for fast screenshot iteration. A
  matching **`game/map/valley.tmj`** export for Tiled hand-polish is the next step (Phase 3
  deliverable) — the same layer/tile data, emitted as Tiled JSON.
- **Landmarks** are currently golden beacon + label placeholders. The custom El Capitan /
  Half Dome / Yosemite Falls art (Phase 5) and the Ahwahnee building (TilesetHouse) replace
  them. Water uses solid tiles (hard edges); grass-water edge autotiling is a polish pass.
- **Done so far:** grass/dirt/Merced/forest/granite-rim valley, hiker 4-dir movement +
  camera + collision, 7 landmark triggers → Framer modal (faceset headshot + real content +
  draft placeholders + pause/focus/ESC), Discovered N/7 HUD, entry card + code-split gate.
- **Not yet:** valley.tmj export, custom landmark art, the Ahwahnee interior, trail cards,
  Glacier Point payoff, ambient audio, water-edge autotiling, mobile joystick polish.
  Verify motion in a focused browser (preview throttles rAF).

## 11. Camera + wayfinding pass (2026-06-29)

The first full frame read as "one small patch, can't navigate." Fixed camera + wayfinding
only (no map/art/mount changes):

- **Camera.** Internal design resolution raised **480×270 → 768×432** (same 16:9), and the
  zoom is now an **integer level set `[1, 2, 3]`, default 2** (`DEFAULT_ZOOM_IDX = 1`). At 2×
  the view is ~24×13.5 tiles — several buildings + plaza + paths at once; 1× is a town
  overview, 3× is detail. Integer zoom keeps pixels crisp under the unavoidable FIT upscale
  (`pixelArt` + `roundPixels`). Camera follows the player with bounds clamped to the map and
  a 48×36 deadzone. Zoom control: mouse wheel + keyboard `+/-` + two-finger pinch (in-scene)
  and DOM `+/-` buttons (`components/HUD/ZoomControls.tsx` → `valley:zoom`). A 320 ms input
  lock on `valley:play` stops the PLAY tap from leaking a walk-to target.
- **Minimap** (`components/HUD/Minimap.tsx`) rebuilt as a real SVG town map (viewBox in tile
  coords): grass, the Merced + bridge, dirt paths from the plaza, plaza/fountain, a marker
  per building (golden once visited) + a live pulsing "you are here", a legend, and a
  visited count. Markers + legend rows fast-travel (`valley:goto`). Geometry is shared, not
  duplicated: `content/portfolio.ts` exports `villageMap` + per-landmark `map:{x,y}` (mirrors
  the scene).
- **Wayfinding.** Top nav fast-travels (`valley:goto` → scene flash-travels, marks
  discovered, opens the panel) and highlights the active district. `DirectionCue` shows a
  bottom-centre arrow rotated toward the nearest unvisited building (hides when close / all
  visited). In-world **signposts**: a crisp canvas-texture nameplate floats above each
  building (supersampled, placed at `1/S` scale), readable from a distance. `ControlsHint`
  shows a one-time, dismissible controls line per session.
- **Perf:** homepage `/` 164 kB and `/village` 104 kB both **unchanged** — all new HUD lives
  in the code-split village chunk, never the initial loads.
