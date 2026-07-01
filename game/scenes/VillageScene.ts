/* ============================================================
   VillageScene  ·  hub-based top-down Yosemite Village (polished)
   A compact, densely-composed town: central plaza spawn, paths to 7
   enterable buildings, the Merced along one edge with a bank + plank
   bridge, a forest ring, and lots of props so there is little bare
   grass. Buildings / trees / props are individually DEPTH-SORTED by
   their base Y (the hiker walks behind them), the polish that makes it
   read as a real RPG town rather than a flat map. Art is the Ninja
   Adventure pack (the art is in the objects). DEBUG_ATLAS for indices.
   ============================================================ */

import * as Phaser from "phaser";
import { gameBus } from "@/lib/gameBus";
import { landmarks } from "@/content/portfolio";

export const TILE = 16;

// Player ("Jethro") sprite: front-facing idle + 4-frame walk cycle, sliced from
// public/game/jethro/player.png (5 frames: idle, walk1..walk4). Taller than the
// 16px NPCs so the face/suit/glasses stay legible at the game's zoom levels.
export const PLAYER_FW = 16;
export const PLAYER_FH = 32;

export const TILESETS = [
  { key: "floor", file: "TilesetFloor", cols: 22, rows: 26 },
  { key: "nature", file: "TilesetNature", cols: 24, rows: 21 },
  { key: "water", file: "TilesetWater", cols: 28, rows: 17 },
  { key: "relief", file: "TilesetRelief", cols: 20, rows: 12 },
  { key: "house", file: "TilesetHouse", cols: 33, rows: 23 },
  { key: "camp", file: "tileset_camp", cols: 23, rows: 9 },
] as const;
const BASE = "/game/ninja-adventure/tilesets/";

// Landscape design resolution (Scale.FIT scales this to the viewport). This is
// the shipped desktop view and the anchor for the short (height) side.
export const GAME_W = 768;
export const GAME_H = 432;

// World-px shown across the short (width) side at 1x on a portrait phone. Small
// enough to keep tiles chunky and to keep the tall side within the 736x544 town
// so the camera never reveals void. Tuned to read like a focused stroll.
const PORTRAIT_SHORT = 216;

// Match the internal resolution to the viewport's aspect ratio so Scale.FIT
// fills the screen edge-to-edge instead of letterboxing a fixed 16:9 frame into
// a thin strip on a tall phone. In portrait the camera simply shows a taller,
// narrower slice of the (small) town; desktop 16:9 resolves to exactly 768x432.
export function computeGameSize(vw: number, vh: number): { width: number; height: number } {
  // A not-yet-laid-out container (e.g. a 0-size preview tab) falls back to the
  // landscape design size so FIT still has a sane frame to scale.
  if (!vw || !vh || vw < 2 || vh < 2) return { width: GAME_W, height: GAME_H };
  const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);
  if (vw >= vh) {
    // landscape: hold the short side (height) to 432 — desktop 16:9 stays
    // 768x432; wider screens just reveal more town horizontally.
    return { width: even(GAME_H * (vw / vh)), height: GAME_H };
  }
  // portrait: hold the short side (width), derive the tall side from the aspect.
  return { width: even(PORTRAIT_SHORT), height: even(PORTRAIT_SHORT * (vh / vw)) };
}
// integer camera zoom levels (pixel-perfect). Default = index 0 (1x): the whole
// town overview (Jethro's pick) — you see the place at a glance. 2x = a focused
// stroll, 3x = detail. Wheel / pinch / +- buttons / keyboard step between them.
const ZOOM_LEVELS = [1, 2, 3] as const;
const DEFAULT_ZOOM_IDX = 0;
const MAP_W = 46;
const MAP_H = 34;
const RIVER_TOP = 30;

// flat ground tiles (localId within tileset)
const T = {
  grass: 245,
  grassAlt: [244, 264, 266],
  path: 188,
  plaza: 34, // cream packed-earth square
  water: 197,
  bankTop: 173,
  wall: 122,
  bridge: 338,
  // nature flat decals
  flowerY: 264,
  flowerR: 266,
  flowerW: 265,
  bushS: 216,
  bush2: 217,
};

// y-sorted object rects: [tsKey, srcCol, srcRow, w, h]  (origin = bottom-left)
type Rect = [string, number, number, number, number];
const OBJ = {
  houseOrange: ["house", 0, 0, 4, 3] as Rect,
  houseTan: ["house", 4, 0, 4, 3] as Rect,
  houseOrange2: ["house", 8, 0, 4, 3] as Rect,
  houseRed: ["house", 12, 0, 4, 3] as Rect,
  lodge: ["house", 25, 8, 4, 6] as Rect,
  torii: ["house", 0, 5, 3, 2] as Rect,
  market: ["house", 22, 20, 3, 2] as Rect,
  tent1: ["camp", 4, 0, 3, 3] as Rect,
  tent2: ["camp", 7, 0, 3, 3] as Rect,
  tent3: ["camp", 10, 0, 3, 3] as Rect,
  // full trees, cropped to their exact 3x3 / 2x2 bounds (no cut-off)
  treeA: ["nature", 0, 2, 3, 3] as Rect, // lush green
  treeB: ["nature", 4, 2, 3, 3] as Rect, // lush green, double canopy
  treeSmall: ["nature", 0, 0, 2, 2] as Rect, // small round green (clean, no exposed roots)
  rock: ["nature", 15, 16, 2, 2] as Rect,
  lantern: ["camp", 12, 7, 1, 1] as Rect,
  barrel: ["camp", 0, 1, 1, 1] as Rect,
  campfire: ["camp", 5, 3, 1, 1] as Rect,
  signpost: ["house", 3, 4, 1, 2] as Rect,
};

// custom bushes, hand-authored in the pack's exact tree greens so they blend
// (. transparent · o outline · d dark · m mid · l light)
const BUSH_PAL: Record<string, string | null> = {
  ".": null,
  o: "#141b1b",
  d: "#4a7f4b",
  m: "#74a334",
  l: "#adbc3a",
};
const BUSH1 = [
  "....oooo.....",
  "..oommmmoo...",
  ".ommllmmmmo..",
  ".omllmmmmmo..",
  "ommmmmmmmmmo.",
  "ommmmmmmdmmo.",
  "ommdmmmmmmmo.",
  ".ommmmmmmmo..",
  ".oddmmmmddo..",
  "..oddddddo...",
  "...oooooo....",
];
const BUSH2 = [
  "...oo....oo....",
  "..ommo..ommmo..",
  ".ommmooommmmo..",
  ".ommllmmmllmo..",
  "ommmmmmmmmmmmo.",
  "ommmdmmmmmlmmo.",
  ".ommmmmmmmmmo..",
  ".oddmmmmmmddo..",
  "..oddddddddo...",
  "...oooooooo...."
];

interface BDef {
  id: string;
  rect: Rect;
  tx: number;
  ty: number;
  doorDx: number;
}

interface NpcRec {
  spr: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  shadow: Phaser.GameObjects.Ellipse;
  texture: string;
  fourDir: boolean;
  speed: number;
  timer: number;
  dir: { x: number; y: number };
}
const BUILDINGS: BDef[] = [
  { id: "visitor-center", rect: OBJ.houseTan, tx: 19, ty: 5, doorDx: 1 },
  { id: "ranger-station", rect: OBJ.houseOrange, tx: 8, ty: 6, doorDx: 1 },
  { id: "ahwahnee", rect: OBJ.lodge, tx: 32, ty: 4, doorDx: 1 },
  { id: "chapel", rect: OBJ.houseRed, tx: 6, ty: 18, doorDx: 1 },
  { id: "general-store", rect: OBJ.houseOrange2, tx: 34, ty: 18, doorDx: 1 },
];
const TENTS = [
  { rect: OBJ.tent1, tx: 7, ty: 24 },
  { rect: OBJ.tent2, tx: 12, ty: 24 },
  { rect: OBJ.tent3, tx: 17, ty: 24 },
];
const CABINS_DOOR = { tx: 13, ty: 27 };
const GLACIER_DOOR = { tx: 23, ty: MAP_H - 2 };
const SPAWN = { tx: 23, ty: 16 };

export class VillageScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private collGroup!: Phaser.Physics.Arcade.StaticGroup;
  private npcGroup!: Phaser.Physics.Arcade.Group;
  private npcs: NpcRec[] = [];
  private shimmers: Phaser.GameObjects.TileSprite[] = [];
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys?: Record<string, Phaser.Input.Keyboard.Key>;
  private firstgids: Record<string, number> = {};
  private tsRefs: Record<string, Phaser.Tilemaps.Tileset> = {};
  private solid: boolean[][] = [];
  // sprite-footprint reservation (decor spacing only; NOT collision — that's `solid`)
  private occupied: boolean[][] = [];
  // path/plaza tiles — trees & scattered bushes must NOT land on the roads
  private isPath: boolean[][] = [];
  private facing = "down";
  private paused = false;
  private intro = true; // title-screen mode: scenic camera, controls off
  private zoomIdx = DEFAULT_ZOOM_IDX;
  private pinchDist = 0;
  private playLockUntil = 0; // brief input lock after PLAY so the tap can't set a move-target
  private discovered = new Set<string>();
  private nearDoor: string | null = null; // door the player is currently standing on (drives the Enter? prompt)
  private teleporting = false; // mid warp-in animation: freeze input until the room opens
  private doors: { id: string; x: number; y: number }[] = [];
  private busOff: Array<() => void> = [];
  private moveTarget: { x: number; y: number } | null = null;
  private lastEmit = 0;
  private signs: Record<string, Phaser.GameObjects.Image> = {};

  constructor() {
    super("village");
  }

  preload() {
    for (const t of TILESETS) this.load.image(t.key, `${BASE}${t.file}.png`);
    const S = "/game/ninja-adventure/sprites/";
    for (const k of ["bear", "racoon", "frog", "cat", "villager", "oldman"])
      this.load.spritesheet(k, `${S}${k}.png`, { frameWidth: TILE, frameHeight: TILE });
    // player — Jethro: front-facing idle + 4-frame walk (no side/back art)
    this.load.spritesheet("jethro", "/game/jethro/player.png", { frameWidth: PLAYER_FW, frameHeight: PLAYER_FH });
  }

  create() {
    this.buildGround();
    this.buildPlayer();
    this.makeBushTextures();
    this.makeFxTextures();
    this.decorate();
    this.placeSigns();
    this.animateWater();
    this.buildNpcs();
    this.addAmbientFx();
    this.addBirds();
    this.bindInput();
    this.bindBus();

    this.cameras.main.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    this.cameras.main.roundPixels = true;
    // boot into the title-screen view: a scenic shot of the plaza + fountain,
    // the scene alive (water/NPCs/birds) but the player hidden + controls off
    this.cameras.main.setZoom(ZOOM_LEVELS[this.zoomIdx]);
    this.cameras.main.centerOn(SPAWN.tx * TILE, (SPAWN.ty - 1) * TILE);
    this.player.setVisible(false);
    this.playerShadow.setVisible(false);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());
    if (process.env.NODE_ENV !== "production")
      (window as unknown as { __village?: unknown }).__village = this;
    gameBus.emit("game:ready");
  }

  private gid(ts: string, localId: number) {
    return this.firstgids[ts] + localId;
  }
  private cols(ts: string) {
    return TILESETS.find((t) => t.key === ts)!.cols;
  }

  // ---- ground (tilemap layers, low depth) ----
  private buildGround() {
    const map = this.make.tilemap({ tileWidth: TILE, tileHeight: TILE, width: MAP_W, height: MAP_H });
    let g = 1;
    for (const t of TILESETS) {
      this.firstgids[t.key] = g;
      this.tsRefs[t.key] = map.addTilesetImage(t.key, t.key, TILE, TILE, 0, 0, g)!;
      g += t.cols * t.rows;
    }
    const all = Object.values(this.tsRefs);
    const ground = map.createBlankLayer("ground", all)!.setDepth(0);
    const overlay = map.createBlankLayer("overlay", all)!.setDepth(1); // paths/plaza/water
    const decals = map.createBlankLayer("decals", all)!.setDepth(2); // flowers (flat)
    this.solid = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(false));
    this.occupied = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(false));
    this.isPath = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(false));
    const rnd = this.rng(99173);

    for (let y = 0; y < MAP_H; y++)
      for (let x = 0; x < MAP_W; x++) {
        const tile = rnd() > 0.88 ? T.grassAlt[Math.floor(rnd() * T.grassAlt.length)] : T.grass;
        ground.putTileAt(this.gid("floor", tile), x, y);
      }

    // Merced along the bottom + bank + bridge + overlook deck
    for (let x = 0; x < MAP_W; x++) {
      overlay.putTileAt(this.gid("water", T.bankTop), x, RIVER_TOP);
      this.solid[RIVER_TOP][x] = true;
      for (let y = RIVER_TOP + 1; y < MAP_H; y++) {
        overlay.putTileAt(this.gid("water", T.water), x, y);
        this.solid[y][x] = true;
      }
    }
    for (let y = RIVER_TOP; y < MAP_H; y++)
      for (const bx of [GLACIER_DOOR.tx - 1, GLACIER_DOOR.tx]) {
        overlay.putTileAt(this.gid("water", T.bridge), bx, y);
        this.solid[y][bx] = false;
      }
    for (let dx = -2; dx <= 2; dx++) {
      const x = GLACIER_DOOR.tx + dx;
      for (const yy of [MAP_H - 1, MAP_H - 2]) {
        overlay.putTileAt(this.gid("floor", T.grass), x, yy);
        this.solid[yy][x] = false;
      }
    }

    // granite rim (north + sides, above the river)
    for (let x = 0; x < MAP_W; x++) for (let t = 0; t < 2; t++) this.wall(overlay, x, t);
    for (let y = 0; y < RIVER_TOP; y++)
      for (let t = 0; t < 2; t++) {
        this.wall(overlay, t, y);
        this.wall(overlay, MAP_W - 1 - t, y);
      }

    // plaza: cream square
    for (let y = SPAWN.ty - 3; y <= SPAWN.ty + 3; y++)
      for (let x = SPAWN.tx - 5; x <= SPAWN.tx + 5; x++)
        if (!this.solid[y]?.[x]) {
          overlay.putTileAt(this.gid("floor", T.plaza), x, y);
          if (this.isPath[y]) this.isPath[y][x] = true;
        }

    // doors known before paths
    for (const b of BUILDINGS) this.doors.push({ id: b.id, x: b.tx + b.doorDx, y: b.ty + b.rect[4] });
    this.doors.push({ id: "cabins", x: CABINS_DOOR.tx, y: CABINS_DOOR.ty });
    this.doors.push({ id: "glacier-point", x: GLACIER_DOOR.tx, y: GLACIER_DOOR.ty });

    // dirt paths from plaza to each door
    for (const d of this.doors) this.carvePath(overlay, SPAWN.tx, SPAWN.ty, d.x, d.y + 1);

    // a few flower decals scattered on grass (kept sparse to avoid clutter)
    let f = 0;
    let guard = 0;
    while (f < 46 && guard++ < 4000) {
      const x = 2 + Math.floor(rnd() * (MAP_W - 4));
      const y = 2 + Math.floor(rnd() * (RIVER_TOP - 3));
      if (this.solid[y][x] || overlay.getTileAt(x, y)) continue;
      const pick = [T.flowerY, T.flowerR, T.flowerW][Math.floor(rnd() * 3)];
      decals.putTileAt(this.gid("nature", pick), x, y);
      f++;
    }
  }

  private wall(layer: Phaser.Tilemaps.TilemapLayer, x: number, y: number) {
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return;
    layer.putTileAt(this.gid("relief", T.wall), x, y);
    this.solid[y][x] = true;
  }

  private carvePath(layer: Phaser.Tilemaps.TilemapLayer, x0: number, y0: number, x1: number, y1: number) {
    let x = x0;
    let y = y0;
    const put = () => {
      if (x > 1 && y > 1 && x < MAP_W - 2 && y < MAP_H - 2 && !this.solid[y][x]) {
        layer.putTileAt(this.gid("floor", T.path), x, y);
        if (this.isPath[y]) this.isPath[y][x] = true;
      }
    };
    while (x !== x1) {
      put();
      x += x < x1 ? 1 : -1;
    }
    while (y !== y1) {
      put();
      y += y < y1 ? 1 : -1;
    }
    put();
  }

  // ---- a depth-sorted object (framed image, base-Y anchored) ----
  private obj(rect: Rect, tx: number, ty: number, solidBlock = true): Phaser.GameObjects.Image {
    const [ts, sc, sr, w, h] = rect;
    const tex = this.textures.get(ts);
    const fname = `${ts}_${sc}_${sr}_${w}_${h}`;
    if (!tex.has(fname)) tex.add(fname, 0, sc * TILE, sr * TILE, w * TILE, h * TILE);
    const px = tx * TILE;
    const py = (ty + h) * TILE; // bottom edge in px
    // soft drop shadow grounds the object (the "3D" pop)
    this.add
      .ellipse(px + (w * TILE) / 2, py - 2, w * TILE * 0.82, Math.min(11, 5 + w * 1.5), 0x0d1014, 0.2)
      .setDepth(py - 1);
    const img = this.add.image(px, py, ts, fname).setOrigin(0, 1);
    img.setDepth(py);
    if (solidBlock)
      for (let dy = 0; dy < h; dy++)
        for (let dx = 0; dx < w; dx++) {
          const gx = tx + dx;
          const gy = ty + dy;
          if (this.solid[gy]) this.solid[gy][gx] = true;
        }
    return img;
  }

  // paint the custom bushes into canvas textures (pack greens, blends in)
  private makeBushTextures() {
    const make = (key: string, grid: string[]) => {
      const w = grid.reduce((m, r) => Math.max(m, r.length), 0);
      const h = grid.length;
      const tex = this.textures.createCanvas(key, w, h);
      if (!tex) return;
      const ctx = tex.getContext();
      for (let y = 0; y < h; y++) {
        const row = grid[y];
        for (let x = 0; x < row.length; x++) {
          const col = BUSH_PAL[row[x]];
          if (col) {
            ctx.fillStyle = col;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
      tex.refresh();
    };
    make("bush1", BUSH1);
    make("bush2", BUSH2);
  }

  // author small FX + fountain textures in canvas (no asset guesswork)
  private makeFxTextures() {
    const mk = (key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) => {
      if (this.textures.exists(key)) return;
      const t = this.textures.createCanvas(key, w, h);
      if (!t) return;
      draw(t.getContext());
      t.refresh();
    };
    // white particles (emitter tints them)
    mk("leaf", 5, 5, (c) => {
      c.fillStyle = "#ffffff";
      c.fillRect(1, 0, 3, 5);
      c.fillRect(0, 1, 5, 3);
    });
    mk("ember", 3, 3, (c) => {
      c.fillStyle = "#ffffff";
      c.fillRect(1, 0, 1, 3);
      c.fillRect(0, 1, 3, 1);
    });
    mk("smoke", 8, 8, (c) => {
      c.fillStyle = "#ffffff";
      c.beginPath();
      c.arc(4, 4, 3.6, 0, Math.PI * 2);
      c.fill();
    });
    // bird: 2 frames (5x3) dark silhouette, registered as a sheet
    mk("bird", 10, 3, (c) => {
      c.fillStyle = "#2b2b33";
      // frame 0 (wings up): cols 0-4
      [[0, 0], [4, 0], [1, 1], [3, 1], [2, 2]].forEach(([x, y]) => c.fillRect(x, y, 1, 1));
      // frame 1 (wings level): cols 5-9
      [[5, 1], [6, 1], [8, 1], [9, 1], [7, 2]].forEach(([x, y]) => c.fillRect(x, y, 1, 1));
    });
    const bt = this.textures.get("bird");
    if (!bt.has("0")) {
      bt.add("0", 0, 0, 0, 5, 3);
      bt.add("1", 0, 5, 0, 5, 3);
    }
    if (!this.anims.exists("bird-fly"))
      this.anims.create({
        key: "bird-fly",
        frames: [{ key: "bird", frame: "0" }, { key: "bird", frame: "1" }],
        frameRate: 7,
        repeat: -1,
      });
    // fountain 32x32: stone basin + water
    mk("fountain", 32, 32, (c) => {
      const ring = (r: number, col: string) => {
        c.fillStyle = col;
        c.beginPath();
        c.arc(16, 20, r, 0, Math.PI * 2);
        c.fill();
      };
      ring(14, "#3a3f4a");
      ring(13, "#9aa3b2");
      ring(11, "#6a7180");
      ring(9, "#4a7fa0");
      ring(7, "#7fb0c8");
      c.fillStyle = "#3a3f4a"; // pedestal
      c.fillRect(14, 6, 4, 12);
      c.fillStyle = "#6a7180";
      c.fillRect(15, 6, 2, 12);
      c.fillStyle = "#d6ecf5"; // basin top rim
      c.fillRect(8, 18, 16, 1);
    });
  }

  private placeFountain(tx: number, ty: number) {
    const px = tx * TILE;
    const py = (ty + 2) * TILE;
    this.add.ellipse(px + 16, py - 2, 30, 9, 0x0d1014, 0.2).setDepth(py - 1);
    this.add.image(px, py, "fountain").setOrigin(0, 1).setDepth(py);
    // animated water in the basin: ripple + shimmer dot
    const ring = this.add.ellipse(px + 16, py - 12, 6, 3, 0xd6ecf5, 0.6).setDepth(py + 0.5);
    this.tweens.add({ targets: ring, scaleX: 2.4, scaleY: 2.4, alpha: 0, duration: 1500, repeat: -1, ease: "Quad.out" });
    // a small water spout
    this.add
      .particles(px + 16, py - 16, "ember", {
        speedY: { min: -34, max: -22 },
        speedX: { min: -6, max: 6 },
        gravityY: 90,
        lifespan: 700,
        scale: { start: 1, end: 0.4 },
        alpha: { start: 0.9, end: 0 },
        frequency: 90,
        quantity: 1,
        tint: [0x7fb0c8, 0xd6ecf5],
      })
      .setDepth(py + 1);
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) if (this.solid[ty + dy]) this.solid[ty + dy][tx + dx] = true;
  }

  // ambient particles: drifting leaves + campfire embers/smoke
  private addAmbientFx() {
    this.add
      .particles(0, 0, "leaf", {
        x: { min: 0, max: MAP_W * TILE },
        y: { min: -10, max: 4 },
        lifespan: 7000,
        speedY: { min: 8, max: 22 },
        speedX: { min: -16, max: 16 },
        rotate: { min: 0, max: 360 },
        scale: { min: 0.5, max: 0.9 },
        alpha: { start: 0.7, end: 0.3 },
        frequency: 1500,
        quantity: 1,
        tint: [0xadbc3a, 0x74a334, 0xc98f45],
      })
      .setDepth(9000);

    const cx = 12 * TILE + 8;
    const cy = 28 * TILE + 6;
    this.add
      .particles(cx, cy, "ember", {
        speedY: { min: -34, max: -14 },
        speedX: { min: -8, max: 8 },
        lifespan: 850,
        scale: { start: 1.1, end: 0 },
        alpha: { start: 1, end: 0 },
        frequency: 110,
        quantity: 1,
        tint: [0xffa028, 0xff6a1f, 0xffe18d],
      })
      .setDepth(cy + 30);
    this.add
      .particles(cx, cy - 6, "smoke", {
        speedY: { min: -16, max: -8 },
        speedX: { min: -5, max: 7 },
        lifespan: 1800,
        scale: { start: 0.5, end: 1.7 },
        alpha: { start: 0.22, end: 0 },
        frequency: 320,
        quantity: 1,
        tint: 0x9aa3b2,
      })
      .setDepth(cy + 31);
  }

  // birds drifting across the sky on a loop
  private addBirds() {
    const fly = (delay: number) => {
      if (!this.sys || !this.sys.displayList) return; // bail only if the scene is torn down
      const y = 18 + Math.random() * 110;
      const fromLeft = Math.random() > 0.5;
      const b = this.add
        .sprite(fromLeft ? -12 : MAP_W * TILE + 12, y, "bird", "0")
        .setDepth(9500)
        .setFlipX(!fromLeft);
      b.play("bird-fly");
      this.tweens.add({
        targets: b,
        x: fromLeft ? MAP_W * TILE + 12 : -12,
        y: y + (Math.random() * 50 - 25),
        duration: 7000 + Math.random() * 5000,
        delay,
        onComplete: () => {
          b.destroy();
          fly(1500 + Math.random() * 5000);
        },
      });
    };
    for (let i = 0; i < 3; i++) fly(Math.random() * 4000);
  }

  // a readable wooden nameplate, rendered to a canvas texture. Supersampled
  // (S x) and placed at setScale(1/S) so it stays crisp under the FIT upscale.
  private makeSign(key: string, text: string): number {
    const S = 3;
    if (this.textures.exists(key)) return S;
    const fontPx = 9 * S;
    const padX = 5 * S;
    const padY = 3 * S;
    const stake = 3 * S;
    const font = `bold ${fontPx}px ui-monospace, Menlo, monospace`;
    const probe = document.createElement("canvas").getContext("2d");
    if (!probe) return S;
    probe.font = font;
    const tw = Math.ceil(probe.measureText(text).width);
    const w = tw + padX * 2;
    const plaqueH = fontPx + padY * 2;
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = plaqueH + stake;
    const c = cv.getContext("2d");
    if (!c) return S;
    c.fillStyle = "#5c4326"; // stake
    c.fillRect(w / 2 - S, plaqueH - S, 2 * S, stake + S);
    c.fillStyle = "#272a31"; // plaque
    c.fillRect(0, 0, w, plaqueH);
    c.fillStyle = "#c9a86a"; // border
    c.fillRect(0, 0, w, S);
    c.fillRect(0, plaqueH - S, w, S);
    c.fillRect(0, 0, S, plaqueH);
    c.fillRect(w - S, 0, S, plaqueH);
    c.font = font; // text
    c.fillStyle = "#f4efe3";
    c.textBaseline = "middle";
    c.textAlign = "center";
    c.fillText(text, w / 2, plaqueH / 2 + S);
    this.textures.addCanvas(key, cv);
    // LINEAR so the 3x supersample resolves crisp at every zoom — under the
    // scene's NEAREST default the antialiased text would just minify and drop
    // strokes at the 1x overview (the default). Signs only; tiles stay NEAREST.
    this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
    return S;
  }

  // float a nameplate above each building so you can read the town from a distance
  private placeSigns() {
    const anchors: { id: string; tx: number; ty: number }[] = [
      ...BUILDINGS.map((b) => ({ id: b.id, tx: b.tx + b.rect[3] / 2, ty: b.ty })),
      { id: "cabins", tx: 12, ty: 23 },
      { id: "glacier-point", tx: 23, ty: 29 },
    ];
    for (const a of anchors) {
      const l = landmarks.find((x) => x.id === a.id);
      if (!l) continue;
      const key = `sign-${a.id}`;
      const S = this.makeSign(key, l.section);
      if (!this.textures.exists(key)) continue; // canvas ctx failed → no sign, no __MISSING box
      const img = this.add
        .image(a.tx * TILE, a.ty * TILE - 1, key)
        .setOrigin(0.5, 1)
        .setScale(1 / S)
        .setDepth(8800);
      this.signs[a.id] = img;
    }
  }

  // a custom bush: shadow + y-sorted image (decorative, not solid)
  private placeBush(tx: number, ty: number, key: string) {
    const px = tx * TILE;
    const py = ty * TILE + TILE;
    this.add.ellipse(px + 6, py - 1, 13, 5, 0x0d1014, 0.18).setDepth(py - 1);
    this.add.image(px, py, key).setOrigin(0, 1).setDepth(py);
  }

  // ---- decoration: buildings, tents, props, trees (all y-sorted) ----
  private decorate() {
    const rnd = this.rng(424242);

    for (const b of BUILDINGS) {
      this.obj(b.rect, b.tx, b.ty);
      const doorX = b.tx + b.doorDx;
      const doorY = b.ty + b.rect[4] - 1;
      if (this.solid[doorY]) this.solid[doorY][doorX] = false;
      // bushes flank the door (landscaped entrance)
      this.placeBush(doorX - 1, b.ty + b.rect[4] - 1, "bush2");
      this.placeBush(doorX + 1, b.ty + b.rect[4] - 1, "bush1");
    }
    // tents (projects)
    for (const tent of TENTS) this.obj(tent.rect, tent.tx, tent.ty);
    if (this.solid[CABINS_DOOR.ty]) this.solid[CABINS_DOOR.ty][CABINS_DOOR.tx] = false;
    // campground props
    this.obj(OBJ.campfire, 12, 28, false);
    this.campfireGlow(12 * TILE + 8, 28 * TILE + 8);
    this.obj(OBJ.barrel, 7, 27);
    this.obj(OBJ.barrel, 18, 27);

    // glacier overlook: torii + a bench-ish + rocks
    this.obj(OBJ.torii, GLACIER_DOOR.tx - 1, MAP_H - 3, false);
    this.obj(OBJ.rock, GLACIER_DOOR.tx - 4, MAP_H - 2);
    this.obj(OBJ.rock, GLACIER_DOOR.tx + 2, MAP_H - 2);

    // plaza: a fountain centerpiece (north), a market stall to the side, props
    this.placeFountain(SPAWN.tx - 1, SPAWN.ty - 3);
    this.obj(OBJ.market, SPAWN.tx - 5, SPAWN.ty + 1);
    this.obj(OBJ.barrel, SPAWN.tx + 4, SPAWN.ty + 2);
    for (const [lx, ly] of [
      [SPAWN.tx - 5, SPAWN.ty - 3],
      [SPAWN.tx + 5, SPAWN.ty - 3],
      [SPAWN.tx - 5, SPAWN.ty + 3],
      [SPAWN.tx + 5, SPAWN.ty + 3],
    ])
      this.placeBush(lx, ly, "bush1");

    // a forest ring around the rim + a few clusters. Mostly green trees,
    // edge-biased so the town interior stays clean (not a messy thicket).
    const trees = [OBJ.treeA, OBJ.treeB, OBJ.treeA, OBJ.treeB, OBJ.treeSmall];
    let placed = 0;
    let guard = 0;
    while (placed < 52 && guard++ < 5000) {
      const edge = rnd();
      let x: number;
      let y: number;
      if (edge < 0.72) {
        // ring near the rim
        const side = Math.floor(rnd() * 3);
        if (side === 0) {
          x = 2 + Math.floor(rnd() * (MAP_W - 4));
          y = 2 + Math.floor(rnd() * 3);
        } else if (side === 1) {
          x = 2 + Math.floor(rnd() * 4);
          y = 3 + Math.floor(rnd() * (RIVER_TOP - 6));
        } else {
          x = MAP_W - 6 + Math.floor(rnd() * 4);
          y = 3 + Math.floor(rnd() * (RIVER_TOP - 6));
        }
      } else {
        x = 2 + Math.floor(rnd() * (MAP_W - 4));
        y = 3 + Math.floor(rnd() * (RIVER_TOP - 5));
      }
      const t = trees[Math.floor(rnd() * trees.length)];
      const [, , , w, h] = t;
      if (this.canBlock(x, y, w, h)) {
        this.obj(t, x, y);
        // reserve the canopy footprint so no other tree/bush overlaps it
        this.reserve(x, y, w, h);
        // only the trunk cell collides
        if (this.solid[y + h - 1]) this.solid[y + h - 1][x + Math.floor(w / 2)] = true;
        // (clear the non-trunk footprint so it doesn't wall off the town)
        for (let dy = 0; dy < h; dy++)
          for (let dx = 0; dx < w; dx++)
            if (!(dy === h - 1 && dx === Math.floor(w / 2)) && this.solid[y + dy]) this.solid[y + dy][x + dx] = false;
        placed++;
      }
    }
    // a couple of river rocks
    this.obj(OBJ.rock, 4, RIVER_TOP - 2);
    this.obj(OBJ.rock, MAP_W - 6, RIVER_TOP - 2);

    // scatter custom bushes (shadowed, y-sorted) to enrich the ground
    let bplaced = 0;
    let bguard = 0;
    while (bplaced < 24 && bguard++ < 3000) {
      const x = 2 + Math.floor(rnd() * (MAP_W - 4));
      const y = 3 + Math.floor(rnd() * (RIVER_TOP - 4));
      if (this.solid[y][x] || this.occupied[y]?.[x] || this.isPath[y]?.[x]) continue;
      this.placeBush(x, y, rnd() > 0.5 ? "bush1" : "bush2");
      this.reserve(x, y, 1, 1);
      bplaced++;
    }

    // subtle atmosphere: god-ray overlay, screen-fixed, very low alpha
    if (this.textures.exists("ray")) {
      /* not loaded; skipped */
    }
  }

  private campfireGlow(x: number, y: number) {
    const glow = this.add.circle(x, y, 26, 0xffa028, 0.22).setDepth(y - 1).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: glow, alpha: 0.34, scale: 1.12, duration: 900, yoyo: true, repeat: -1, ease: "Sine.inOut" });
  }

  private buildPlayer() {
    // Front-facing art only: one walk loop (frames 1..4), mirrored for left/right;
    // up/down reuse the forward frames. Frame 0 is the idle pose.
    this.anims.create({
      key: "player-walk",
      frames: this.anims.generateFrameNumbers("jethro", { start: 1, end: 4 }),
      frameRate: 8,
      repeat: -1,
    });
    this.player = this.physics.add.sprite(SPAWN.tx * TILE + 8, SPAWN.ty * TILE + 8, "jethro", 0);
    this.player.setOrigin(0.5, 0.92); // pivot at the feet for clean y-sorting
    this.player.body.setSize(9, 6).setOffset(3.5, 25); // small collider at the feet
    this.playerShadow = this.add.ellipse(this.player.x, this.player.y + 1, 11, 5, 0x0d1014, 0.22);
    this.physics.world.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    this.player.setCollideWorldBounds(true);
    this.buildColliders();
  }

  private buildColliders() {
    const group = this.physics.add.staticGroup();
    for (let y = 0; y < MAP_H; y++) {
      let x = 0;
      while (x < MAP_W) {
        if (this.solid[y][x]) {
          let run = 1;
          while (x + run < MAP_W && this.solid[y][x + run]) run++;
          const rect = group.create(x * TILE + (run * TILE) / 2, y * TILE + TILE / 2, undefined) as Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
          rect.setVisible(false);
          rect.body.setSize(run * TILE, TILE);
          rect.refreshBody();
          x += run;
        } else x++;
      }
    }
    this.collGroup = group;
    this.physics.add.collider(this.player, group);
  }

  // ---- animated water: scrolling shimmer + looping ripples ----
  private animateWater() {
    // a small translucent caustic texture
    const tex = this.textures.createCanvas("shimmer", 48, 48);
    if (tex) {
      const ctx = tex.getContext();
      ctx.clearRect(0, 0, 48, 48);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      const rnd = this.rng(8181);
      for (let i = 0; i < 14; i++) {
        const x = Math.floor(rnd() * 48);
        const y = Math.floor(rnd() * 48);
        ctx.fillRect(x, y, 2 + Math.floor(rnd() * 3), 1);
      }
      tex.refresh();
    }
    const ry = RIVER_TOP * TILE;
    const rh = (MAP_H - RIVER_TOP) * TILE;
    for (let i = 0; i < 2; i++) {
      const s = this.add
        .tileSprite(0, ry, MAP_W * TILE, rh, "shimmer")
        .setOrigin(0, 0)
        .setDepth(3)
        .setAlpha(i === 0 ? 0.16 : 0.1);
      this.shimmers.push(s);
    }
    // a few ripple rings on the water
    const rnd = this.rng(5151);
    for (let i = 0; i < 7; i++) {
      const rx = 4 * TILE + rnd() * (MAP_W - 8) * TILE;
      const ryy = (RIVER_TOP + 1) * TILE + rnd() * (rh - 2 * TILE);
      const ring = this.add.ellipse(rx, ryy, 6, 3, 0xd6ecf5, 0.5).setDepth(4);
      this.tweens.add({
        targets: ring,
        scaleX: 3,
        scaleY: 3,
        alpha: 0,
        duration: 1800 + rnd() * 1400,
        delay: rnd() * 2000,
        repeat: -1,
        ease: "Quad.out",
      });
    }
  }

  private findOpen(tx: number, ty: number): { tx: number; ty: number } {
    for (let r = 0; r < 6; r++)
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          const x = tx + dx;
          const y = ty + dy;
          if (x > 1 && y > 1 && x < MAP_W - 2 && y < RIVER_TOP - 1 && !this.solid[y][x]) return { tx: x, ty: y };
        }
    return { tx, ty };
  }

  // ---- ambient NPCs: hikers + Yosemite wildlife, wandering ----
  private buildNpcs() {
    const fourDir = (key: string) => {
      if (!this.textures.exists(key)) return;
      ([
        ["down", 0],
        ["up", 4],
        ["left", 8],
        ["right", 12],
      ] as [string, number][]).forEach(([n, s]) =>
        this.anims.create({
          key: `${key}-${n}`,
          frames: this.anims.generateFrameNumbers(key, { start: s, end: s + 3 }),
          frameRate: 7,
          repeat: -1,
        })
      );
    };
    fourDir("villager");
    fourDir("oldman");
    if (this.textures.exists("bear"))
      this.anims.create({ key: "bear-walk", frames: this.anims.generateFrameNumbers("bear", { start: 0, end: 3 }), frameRate: 5, repeat: -1 });
    for (const k of ["racoon", "frog", "cat"])
      if (this.textures.exists(k))
        this.anims.create({ key: `${k}-walk`, frames: this.anims.generateFrameNumbers(k, { start: 0, end: 1 }), frameRate: 5, repeat: -1 });

    this.npcGroup = this.physics.add.group();
    const spawn = (
      texture: string,
      tx: number,
      ty: number,
      opts: { fourDir?: boolean; speed?: number; tint?: number } = {}
    ) => {
      if (!this.textures.exists(texture)) return; // skip any sprite that failed to load
      const p = this.findOpen(tx, ty);
      const spr = this.physics.add.sprite(p.tx * TILE + 8, p.ty * TILE + 8, texture, 0) as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      spr.setOrigin(0.5, 0.7);
      spr.body.setSize(8, 7).setOffset(4, 8);
      if (opts.tint) spr.setTint(opts.tint);
      const shadow = this.add.ellipse(spr.x, spr.y + 3, 10, 4, 0x0d1014, 0.2);
      this.npcGroup.add(spr);
      this.npcs.push({ spr, shadow, texture, fourDir: !!opts.fourDir, speed: opts.speed ?? 26, timer: 0, dir: { x: 0, y: 0 } });
    };

    // hikers on the paths
    spawn("villager", 21, 18, { fourDir: true, speed: 34 });
    spawn("oldman", 26, 13, { fourDir: true, speed: 28 });
    spawn("villager", 16, 16, { fourDir: true, speed: 34 });
    // Yosemite wildlife
    spawn("bear", 38, 9, { speed: 18 });
    spawn("bear", 12, 10, { speed: 20, tint: 0xd8c39a }); // tan = deer/elk
    spawn("bear", 30, 11, { speed: 20, tint: 0xd8c39a });
    spawn("racoon", 10, 22, { speed: 30 });
    spawn("frog", 19, 28, { speed: 22 });
    spawn("cat", 36, 21, { speed: 28 });

    this.physics.add.collider(this.npcGroup, this.collGroup);
    this.physics.add.collider(this.npcGroup, this.player);
    this.physics.add.collider(this.npcGroup, this.npcGroup);
  }

  private updateNpcs(dt: number) {
    for (const n of this.npcs) {
      if (!n.spr || !n.spr.body || !n.spr.active) continue;
      const body = n.spr.body;
      const blocked = body.blocked.up || body.blocked.down || body.blocked.left || body.blocked.right;
      n.timer -= dt;
      if (n.timer <= 0 || blocked) {
        const r = Math.random();
        if (r < 0.3) n.dir = { x: 0, y: 0 };
        else {
          const dirs = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ];
          const d = dirs[Math.floor(Math.random() * 4)];
          n.dir = { x: d[0], y: d[1] };
        }
        n.timer = 0.8 + Math.random() * 2.2;
      }
      body.setVelocity(n.dir.x * n.speed, n.dir.y * n.speed);
      if (n.dir.x || n.dir.y) {
        if (n.fourDir) {
          const f = Math.abs(n.dir.x) > Math.abs(n.dir.y) ? (n.dir.x < 0 ? "left" : "right") : n.dir.y < 0 ? "up" : "down";
          n.spr.anims.play(`${n.texture}-${f}`, true);
        } else {
          n.spr.anims.play(`${n.texture}-walk`, true);
          if (n.dir.x) n.spr.setFlipX(n.dir.x < 0);
        }
      } else n.spr.anims.stop();
      n.spr.setDepth(n.spr.y);
      n.shadow.setPosition(n.spr.x, n.spr.y + 3).setDepth(n.spr.y - 1);
    }
  }

  private stopNpcs() {
    for (const n of this.npcs) {
      if (n.spr && n.spr.body) n.spr.body.setVelocity(0, 0);
      n.dir = { x: 0, y: 0 };
    }
  }

  private bindInput() {
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.keys = this.input.keyboard?.addKeys("W,A,S,D") as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.addPointer(1); // a 2nd touch pointer so pinch-zoom works on mobile
    const setTarget = (p: Phaser.Input.Pointer) => {
      // no walk during intro, the post-PLAY lock, or a two-finger pinch
      if (this.intro || this.time.now < this.playLockUntil || this.input.pointer2?.isDown) return;
      this.moveTarget = { x: p.worldX, y: p.worldY };
    };
    // tap-to-walk (same feel as the project rooms): a single tap sets a target
    // the hiker walks to and stops at. Holding + dragging keeps re-aiming, so a
    // press-drag still steers. Releasing does NOT cancel the walk — the hiker
    // finishes the trip; the update loop clears the target on arrival, and
    // keyboard input cancels it.
    this.input.on("pointerdown", setTarget);
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (p.isDown) setTarget(p);
    });
    // mouse wheel -> zoom (desktop)
    this.input.on("wheel", (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      if (!this.intro) this.applyZoom(this.zoomIdx + (dy > 0 ? -1 : 1));
    });
    // keyboard +/- -> zoom
    this.input.keyboard?.on("keydown", (e: KeyboardEvent) => {
      if (this.intro) return;
      if (e.key === "+" || e.key === "=") this.applyZoom(this.zoomIdx + 1);
      else if (e.key === "-" || e.key === "_") this.applyZoom(this.zoomIdx - 1);
      // Enter / E confirms the door prompt when the player is standing on a door
      else if ((e.key === "Enter" || e.key === "e" || e.key === "E") && this.nearDoor) this.enterNearDoor();
    });
  }

  private bindBus() {
    this.busOff.push(
      gameBus.on("game:pause", () => {
        this.paused = true;
        this.pinchDist = 0; // don't carry a stale pinch span across an interior room
        this.player?.body?.setVelocity(0, 0);
        this.stopNpcs();
      })
    );
    this.busOff.push(
      gameBus.on("game:resume", () => {
        this.paused = false;
        this.moveTarget = null;
      })
    );
    // "PLAY": leave the title screen and hand the player control
    this.busOff.push(
      gameBus.on("valley:play", () => {
        if (!this.intro) return;
        this.intro = false;
        this.moveTarget = null;
        this.playLockUntil = this.time.now + 320; // swallow the PLAY tap
        this.player.setVisible(true);
        this.playerShadow.setVisible(true);
        const cam = this.cameras.main;
        cam.setZoom(ZOOM_LEVELS[this.zoomIdx]);
        cam.startFollow(this.player, true, 0.16, 0.16);
        cam.setDeadzone(48, 36);
        cam.flash(260, 244, 239, 227);
      })
    );
    // zoom buttons: step the camera zoom level
    this.busOff.push(gameBus.on("valley:zoom", ({ dir }) => this.applyZoom(this.zoomIdx + dir)));
    // "Enter?" prompt confirmed: enter the door the player is standing on
    this.busOff.push(gameBus.on("valley:enter", () => this.enterNearDoor()));
    // nav teleport: jump the player + camera to the door, then warp in through
    // the SAME teleport animation the walk-in path uses (consistent entry feel)
    this.busOff.push(
      gameBus.on("valley:goto", ({ id }) => {
        const door = this.doors.find((d) => d.id === id);
        if (!door || !this.player || this.intro || this.teleporting) return;
        const x = door.x * TILE + 8;
        const y = (door.y + 1) * TILE + 8;
        this.player.setPosition(x, y);
        this.player.body.setVelocity(0, 0);
        this.moveTarget = null;
        this.cameras.main.centerOn(x, y); // keep the warp on-screen
        this.playerShadow?.setPosition(x, y + 1);
        // arm this door and run the warp-in (discovery + room open happen there)
        this.nearDoor = id;
        this.enterNearDoor();
      })
    );
  }

  // step the camera zoom level (clamped), tweened so it never snaps
  private applyZoom(idx: number) {
    const clamped = Phaser.Math.Clamp(idx, 0, ZOOM_LEVELS.length - 1);
    if (clamped === this.zoomIdx) return;
    this.zoomIdx = clamped;
    this.tweens.add({ targets: this.cameras.main, zoom: ZOOM_LEVELS[clamped], duration: 200, ease: "Quad.out" });
  }

  // two-finger pinch -> step zoom (discrete). Suppresses walk-to-tap while pinching.
  private handlePinch() {
    const p1 = this.input.pointer1;
    const p2 = this.input.pointer2;
    if (p1?.isDown && p2?.isDown) {
      const d = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
      if (this.pinchDist > 0) {
        const r = d / this.pinchDist;
        if (r > 1.28) {
          this.applyZoom(this.zoomIdx + 1);
          this.pinchDist = d;
        } else if (r < 0.78) {
          this.applyZoom(this.zoomIdx - 1);
          this.pinchDist = d;
        }
      } else this.pinchDist = d;
      this.moveTarget = null; // don't walk toward a finger mid-pinch
    } else this.pinchDist = 0;
  }

  update(time: number, delta: number) {
    if (!this.player) return;
    this.shimmers.forEach((s, i) => (s.tilePositionX += (i === 0 ? 0.32 : -0.22) * (delta / 16)));
    if (!this.paused) this.updateNpcs(delta / 1000); // NPCs wander during the intro too (life)
    if (this.intro || this.paused) {
      this.player.body.setVelocity(0, 0);
      return;
    }
    if (this.teleporting) {
      // a warp tween owns the player's scale/alpha; just keep it still
      this.player.body.setVelocity(0, 0);
      return;
    }
    this.handlePinch();
    const speed = 92; // uniform across the village — the 2x boost now lives inside the Projects/Resume rooms
    let vx = 0;
    let vy = 0;
    const left = this.cursors?.left.isDown || this.keys?.A.isDown;
    const right = this.cursors?.right.isDown || this.keys?.D.isDown;
    const up = this.cursors?.up.isDown || this.keys?.W.isDown;
    const down = this.cursors?.down.isDown || this.keys?.S.isDown;
    if (left) vx = -1;
    else if (right) vx = 1;
    if (up) vy = -1;
    else if (down) vy = 1;
    if (vx || vy) this.moveTarget = null; // keyboard overrides + cancels a tap-walk
    if (!vx && !vy && this.moveTarget) {
      const dx = this.moveTarget.x - this.player.x;
      const dy = this.moveTarget.y - this.player.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        const len = Math.hypot(dx, dy) || 1;
        vx = dx / len;
        vy = dy / len;
      } else {
        this.moveTarget = null; // arrived — settle into idle
      }
    }
    const len = Math.hypot(vx, vy) || 1;
    this.player.body.setVelocity((vx / len) * speed, (vy / len) * speed);
    this.player.setDepth(this.player.y); // y-sort against objects
    this.playerShadow.setPosition(this.player.x, this.player.y + 1).setDepth(this.player.y - 1);
    if (vx || vy) {
      if (Math.abs(vx) > Math.abs(vy)) this.facing = vx < 0 ? "left" : "right";
      else this.facing = vy < 0 ? "up" : "down";
      this.player.setFlipX(this.facing === "left"); // mirror the front frames
      this.player.anims.play("player-walk", true);
    } else {
      this.player.anims.stop();
      this.player.setFrame(0); // idle pose
    }

    if (time - this.lastEmit > 110) {
      this.lastEmit = time;
      gameBus.emit("player:move", { x: this.player.x / (MAP_W * TILE), y: this.player.y / (MAP_H * TILE) });
    }
    this.checkDoors();
    if (this.nearDoor) this.emitNearAnchor(); // keep the "Enter?" prompt over the doorway
  }

  // Project a world point to viewport (CSS px) and emit it so the "Enter?" HUD
  // can float just above the hiker's head, right at the building's entrance —
  // tracking the doorway as the camera follows the player.
  private emitNearAnchor() {
    const cam = this.cameras.main;
    const view = cam.worldView; // world rect currently on screen (zoom-aware)
    const wx = this.player.x;
    const wy = this.player.y - this.player.displayHeight * this.player.originY - 6; // just above the head
    const fx = (wx - view.x) / view.width; // 0..1 across the camera viewport
    const fy = (wy - view.y) / view.height;
    const rect = this.game.canvas.getBoundingClientRect(); // letterboxed canvas box, viewport coords
    gameBus.emit("valley:nearpos", {
      x: rect.left + fx * rect.width,
      y: rect.top + fy * rect.height,
    });
  }

  // Surface the "Enter?" prompt only when the hiker is actually ON the door —
  // the door tile (d) or the threshold one row up — never a tile early, and
  // never automatically. Entering is the player's choice (button / Enter key).
  private checkDoors() {
    const ptx = Math.floor(this.player.x / TILE);
    const pty = Math.floor(this.player.y / TILE);
    let near: string | null = null;
    for (const d of this.doors) {
      if (ptx === d.x && (pty === d.y || pty === d.y - 1)) {
        near = d.id;
        break;
      }
    }
    if (near !== this.nearDoor) {
      this.nearDoor = near;
      gameBus.emit("valley:near", { id: near });
    }
  }

  // Confirmed entry (Enter? button or Enter/E key): play a short teleport warp,
  // then open the room. No-op if not at a door or the scene is busy. The room is
  // opened from the warp's completion callback — the scene is still un-paused
  // until then, so the tween + timers run reliably (unlike after a room pause).
  private enterNearDoor() {
    const id = this.nearDoor;
    if (!id || this.intro || this.paused || this.teleporting) return;
    this.teleporting = true;
    this.player.body.setVelocity(0, 0);
    this.player.anims.stop();
    this.player.setFrame(0);
    this.moveTarget = null;
    // clear the prompt the moment we commit to the warp
    this.nearDoor = null;
    gameBus.emit("valley:near", { id: null });
    if (!this.discovered.has(id)) {
      this.discovered.add(id);
      gameBus.emit("landmark:discovered", { id });
    }
    const open = () => {
      this.teleporting = false;
      this.resetPlayerFx();
      gameBus.emit("landmark:enter", { id }); // pauses the scene + opens the room
    };
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduce) {
      this.cameras.main.flash(160, 244, 239, 227);
      open();
    } else {
      this.playTeleport(open);
    }
  }

  // the warp itself: a golden ground ring + a burst of sparkles, the hiker
  // squashing to a bright sliver and fading out, capped by a cream flash. ~460ms.
  private playTeleport(onDone: () => void) {
    const px = this.player.x;
    const py = this.player.y; // feet (origin 0.92)

    const ring = this.add
      .ellipse(px, py, 14, 6, 0xffe18d, 0.85)
      .setDepth(py - 0.5)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: ring, scaleX: 4.4, scaleY: 4.4, alpha: 0, duration: 440, ease: "Quad.out" });

    const burst = this.add
      .particles(px, py - 10, "ember", {
        speedY: { min: -96, max: -38 },
        speedX: { min: -28, max: 28 },
        lifespan: 480,
        scale: { start: 1.4, end: 0 },
        alpha: { start: 1, end: 0 },
        tint: [0xffe18d, 0xffffff, 0xffa028],
        emitting: false,
      })
      .setDepth(py + 3);
    burst.explode(18, px, py - 10);

    this.player.setTint(0xfff4d0);
    this.tweens.add({
      targets: this.player,
      scaleX: 0.12,
      scaleY: 1.5,
      angle: 6,
      alpha: 0,
      duration: 340,
      ease: "Back.in",
    });
    this.tweens.add({ targets: this.playerShadow, scaleX: 0.1, scaleY: 0.1, alpha: 0, duration: 300, ease: "Quad.in" });

    this.time.delayedCall(300, () => this.cameras.main.flash(240, 244, 239, 227));
    this.time.delayedCall(460, () => {
      ring.destroy();
      burst.destroy();
      onDone();
    });
  }

  // restore the hiker after a warp (the room covers the village, so this is unseen
  // until the player returns and the scene resumes). Kill any in-flight warp tween
  // first so a frame hitch can't leave the sprite mid-squash on return.
  private resetPlayerFx() {
    this.tweens.killTweensOf(this.player);
    this.tweens.killTweensOf(this.playerShadow);
    this.player.setScale(1).setAlpha(1).setAngle(0).clearTint();
    this.playerShadow.setScale(1).setAlpha(0.22);
  }

  // can a w×h decoration sit here? rejects map obstacles (exact footprint) and
  // keeps a `gap`-tile clearance from other decorations so sprites never overlap
  // (overlap = a front sprite's hard outline/base slicing the canopy behind it).
  private canBlock(x: number, y: number, w: number, h: number, gap = 1) {
    if (x < 2 || y < 2 || x + w > MAP_W - 2 || y + h > MAP_H - 2) return false;
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) if (this.solid[y + dy][x + dx]) return false;
    // never cover a road/plaza — keep the whole footprint off path tiles
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) if (this.isPath[y + dy]?.[x + dx]) return false;
    for (let dy = -gap; dy < h + gap; dy++)
      for (let dx = -gap; dx < w + gap; dx++) if (this.occupied[y + dy]?.[x + dx]) return false;
    return true;
  }

  // mark a w×h footprint as taken so later decorations keep their distance
  private reserve(x: number, y: number, w: number, h: number) {
    for (let dy = 0; dy < h; dy++)
      for (let dx = 0; dx < w; dx++) if (this.occupied[y + dy]) this.occupied[y + dy][x + dx] = true;
  }

  private rng(seed: number) {
    let a = seed >>> 0;
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  private teardown() {
    this.busOff.forEach((off) => off());
    this.busOff = [];
    this.input.removeAllListeners();
  }
}
