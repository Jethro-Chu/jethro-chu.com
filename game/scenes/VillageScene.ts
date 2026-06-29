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

export const TILE = 16;

export const TILESETS = [
  { key: "floor", file: "TilesetFloor", cols: 22, rows: 26 },
  { key: "nature", file: "TilesetNature", cols: 24, rows: 21 },
  { key: "water", file: "TilesetWater", cols: 28, rows: 17 },
  { key: "relief", file: "TilesetRelief", cols: 20, rows: 12 },
  { key: "house", file: "TilesetHouse", cols: 33, rows: 23 },
  { key: "camp", file: "tileset_camp", cols: 23, rows: 9 },
] as const;
const BASE = "/game/ninja-adventure/tilesets/";

export const GAME_W = 480;
export const GAME_H = 270;
const ZOOM = 2.5;
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
  treeA: ["nature", 5, 2, 2, 3] as Rect,
  treeB: ["nature", 1, 3, 2, 3] as Rect,
  cypress: ["nature", 12, 14, 2, 4] as Rect,
  bigTree: ["nature", 4, 17, 4, 4] as Rect,
  rock: ["nature", 15, 16, 2, 2] as Rect,
  lantern: ["camp", 12, 7, 1, 1] as Rect,
  barrel: ["camp", 0, 1, 1, 1] as Rect,
  campfire: ["camp", 5, 3, 1, 1] as Rect,
  signpost: ["house", 3, 4, 1, 2] as Rect,
};

interface BDef {
  id: string;
  rect: Rect;
  tx: number;
  ty: number;
  doorDx: number;
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
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys?: Record<string, Phaser.Input.Keyboard.Key>;
  private firstgids: Record<string, number> = {};
  private tsRefs: Record<string, Phaser.Tilemaps.Tileset> = {};
  private solid: boolean[][] = [];
  private facing = "down";
  private paused = false;
  private discovered = new Set<string>();
  private active: string | null = null;
  private armed = new Set<string>();
  private doors: { id: string; x: number; y: number }[] = [];
  private busOff: Array<() => void> = [];
  private moveTarget: { x: number; y: number } | null = null;
  private lastEmit = 0;

  constructor() {
    super("village");
  }

  preload() {
    for (const t of TILESETS) this.load.image(t.key, `${BASE}${t.file}.png`);
    this.load.spritesheet("hunter", "/game/ninja-adventure/sprites/hunter.png", {
      frameWidth: TILE,
      frameHeight: TILE,
    });
  }

  create() {
    this.buildGround();
    this.buildPlayer();
    this.decorate();
    this.bindInput();
    this.bindBus();

    this.cameras.main.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    this.cameras.main.setZoom(ZOOM);
    this.cameras.main.startFollow(this.player, true, 0.16, 0.16);
    this.cameras.main.setDeadzone(40, 30);
    this.cameras.main.roundPixels = true;

    for (const d of this.doors) this.armed.add(d.id);
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
        if (!this.solid[y]?.[x]) overlay.putTileAt(this.gid("floor", T.plaza), x, y);

    // doors known before paths
    for (const b of BUILDINGS) this.doors.push({ id: b.id, x: b.tx + b.doorDx, y: b.ty + b.rect[4] });
    this.doors.push({ id: "cabins", x: CABINS_DOOR.tx, y: CABINS_DOOR.ty });
    this.doors.push({ id: "glacier-point", x: GLACIER_DOOR.tx, y: GLACIER_DOOR.ty });

    // dirt paths from plaza to each door
    for (const d of this.doors) this.carvePath(overlay, SPAWN.tx, SPAWN.ty, d.x, d.y + 1);

    // flat flower / bush decals scattered on grass (not on path/plaza/solid)
    let f = 0;
    let guard = 0;
    while (f < 120 && guard++ < 5000) {
      const x = 2 + Math.floor(rnd() * (MAP_W - 4));
      const y = 2 + Math.floor(rnd() * (RIVER_TOP - 3));
      if (this.solid[y][x] || overlay.getTileAt(x, y)) continue;
      const pick = [T.flowerY, T.flowerR, T.flowerW, T.bushS, T.bush2][Math.floor(rnd() * 5)];
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
      if (x > 1 && y > 1 && x < MAP_W - 2 && y < MAP_H - 2 && !this.solid[y][x])
        layer.putTileAt(this.gid("floor", T.path), x, y);
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

  // ---- decoration: buildings, tents, props, trees (all y-sorted) ----
  private decorate() {
    const rnd = this.rng(424242);

    for (const b of BUILDINGS) {
      this.obj(b.rect, b.tx, b.ty);
      const doorX = b.tx + b.doorDx;
      const doorY = b.ty + b.rect[4] - 1;
      if (this.solid[doorY]) this.solid[doorY][doorX] = false;
      // lanterns flank the door
      this.obj(OBJ.lantern, doorX - 1, b.ty + b.rect[4] - 1, false);
      this.obj(OBJ.lantern, doorX + 1, b.ty + b.rect[4] - 1, false);
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

    // plaza centerpiece: a market stall + benches + a signpost + flowers
    this.obj(OBJ.market, SPAWN.tx - 1, SPAWN.ty - 1);
    this.obj(OBJ.signpost, SPAWN.tx - 4, SPAWN.ty + 1, false);
    this.obj(OBJ.barrel, SPAWN.tx + 4, SPAWN.ty + 2);
    for (const [lx, ly] of [
      [SPAWN.tx - 5, SPAWN.ty - 3],
      [SPAWN.tx + 5, SPAWN.ty - 3],
      [SPAWN.tx - 5, SPAWN.ty + 3],
      [SPAWN.tx + 5, SPAWN.ty + 3],
    ])
      this.obj(OBJ.lantern, lx, ly, false);

    // a forest ring around the rim + clusters, plus rocks near the river
    const trees = [OBJ.treeA, OBJ.treeB, OBJ.cypress];
    let placed = 0;
    let guard = 0;
    while (placed < 70 && guard++ < 5000) {
      const edge = rnd();
      let x: number;
      let y: number;
      if (edge < 0.55) {
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
    const dirs: [string, number][] = [
      ["down", 0],
      ["up", 4],
      ["left", 8],
      ["right", 12],
    ];
    for (const [name, start] of dirs)
      this.anims.create({
        key: `walk-${name}`,
        frames: this.anims.generateFrameNumbers("hunter", { start, end: start + 3 }),
        frameRate: 8,
        repeat: -1,
      });
    this.player = this.physics.add.sprite(SPAWN.tx * TILE + 8, SPAWN.ty * TILE + 8, "hunter", 0);
    this.player.setOrigin(0.5, 0.7);
    this.player.body.setSize(9, 8).setOffset(3.5, 7);
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
    this.physics.add.collider(this.player, group);
  }

  private bindInput() {
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.keys = this.input.keyboard?.addKeys("W,A,S,D") as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => (this.moveTarget = { x: p.worldX, y: p.worldY }));
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (p.isDown) this.moveTarget = { x: p.worldX, y: p.worldY };
    });
    this.input.on("pointerup", () => (this.moveTarget = null));
  }

  private bindBus() {
    this.busOff.push(gameBus.on("game:pause", () => (this.paused = true)));
    this.busOff.push(
      gameBus.on("game:resume", () => {
        this.paused = false;
        this.moveTarget = null;
      })
    );
  }

  update(time: number) {
    if (this.paused || !this.player) return;
    const speed = 92;
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
    if (!vx && !vy && this.moveTarget) {
      const dx = this.moveTarget.x - this.player.x;
      const dy = this.moveTarget.y - this.player.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        const len = Math.hypot(dx, dy) || 1;
        vx = dx / len;
        vy = dy / len;
      }
    }
    const len = Math.hypot(vx, vy) || 1;
    this.player.body.setVelocity((vx / len) * speed, (vy / len) * speed);
    this.player.setDepth(this.player.y); // y-sort against objects
    if (vx || vy) {
      if (Math.abs(vx) > Math.abs(vy)) this.facing = vx < 0 ? "left" : "right";
      else this.facing = vy < 0 ? "up" : "down";
      this.player.anims.play(`walk-${this.facing}`, true);
    } else this.player.anims.stop();

    if (time - this.lastEmit > 110) {
      this.lastEmit = time;
      gameBus.emit("player:move", { x: this.player.x / (MAP_W * TILE), y: this.player.y / (MAP_H * TILE) });
    }
    this.checkDoors();
  }

  private checkDoors() {
    let inside: string | null = null;
    for (const d of this.doors) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, d.x * TILE + 8, d.y * TILE + 8);
      if (dist < 20) inside = d.id;
      else if (dist > 34) this.armed.add(d.id);
    }
    if (inside && inside !== this.active && this.armed.has(inside)) {
      this.active = inside;
      this.armed.delete(inside);
      if (!this.discovered.has(inside)) {
        this.discovered.add(inside);
        gameBus.emit("landmark:discovered", { id: inside });
      }
      gameBus.emit("landmark:enter", { id: inside });
    } else if (!inside && this.active) this.active = null;
  }

  private canBlock(x: number, y: number, w: number, h: number) {
    if (x < 2 || y < 2 || x + w > MAP_W - 2 || y + h > MAP_H - 2) return false;
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) if (this.solid[y + dy][x + dx]) return false;
    return true;
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
