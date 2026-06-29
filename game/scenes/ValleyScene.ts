/* ============================================================
   ValleyScene  ·  the top-down Yosemite valley (GAME_DESIGN §3-6)
   Loads the Ninja Adventure tilesets, generates the valley (grass,
   the Merced, forest, trails, granite walls), the hiker with 4-dir
   movement + camera + collision, and landmark triggers. A DEBUG_ATLAS
   mode (off by default) renders a labeled tileset for index-reading.
   ============================================================ */

import * as Phaser from "phaser";
import { gameBus } from "@/lib/gameBus";
import { landmarks } from "@/content/portfolio";

export const TILE = 16;

export const TILESETS = [
  { key: "floor", file: "TilesetFloor", cols: 22, rows: 26 },
  { key: "floorB", file: "TilesetFloorB", cols: 11, rows: 7 },
  { key: "floorDetail", file: "TilesetFloorDetail", cols: 16, rows: 5 },
  { key: "nature", file: "TilesetNature", cols: 24, rows: 21 },
  { key: "water", file: "TilesetWater", cols: 28, rows: 17 },
  { key: "relief", file: "TilesetRelief", cols: 20, rows: 12 },
  { key: "reliefDetail", file: "TilesetReliefDetail", cols: 12, rows: 12 },
  { key: "house", file: "TilesetHouse", cols: 33, rows: 23 },
  { key: "element", file: "TilesetElement", cols: 16, rows: 15 },
  { key: "camp", file: "tileset_camp", cols: 23, rows: 9 },
] as const;

const BASE = "/game/ninja-adventure/tilesets/";

// ---- DEBUG: render one tileset as a labeled atlas to read tile indices ----
const DEBUG_ATLAS = false;
const ATLAS = "relief";
const ATLAS_FOCUS = { c0: 0, r0: 0, c1: 13, r1: 11 };

export const GAME_W = DEBUG_ATLAS ? 440 : 480;
export const GAME_H = DEBUG_ATLAS ? 456 : 270;

// ---- map dimensions + tile picks (localIds within each tileset) ----
const MAP_W = 64;
const MAP_H = 44;
const ZOOM = 2;

// tile localIds verified by pixel analysis of each tileset (not by eye)
const T = {
  grass: 245, // uniform green grass [floor]
  grassAlt: [244, 264, 266], // subtle variation [floor]
  dirt: 188, // brown trail [floor]
  water: 197, // grass-edged blue water (the Merced) [water]
  wall: 122, // tan granite cliff face [relief]
};
// trees as multi-tile blocks (rows of localIds) drawn from `nature`
// (green canopy over a brown trunk, detected programmatically)
const TREE_BIG = [
  [53, 54],
  [77, 78],
  [101, 102],
];
const TREE_SMALL = [
  [73, 74],
  [97, 98],
  [121, 122],
];

const LANDMARK_POS: Record<string, { tx: number; ty: number }> = {
  "tunnel-view": { tx: 32, ty: 35 },
  "el-capitan": { tx: 9, ty: 9 },
  "half-dome": { tx: 33, ty: 7 },
  "yosemite-falls": { tx: 54, ty: 8 },
  ahwahnee: { tx: 49, ty: 24 },
  "merced-bridge": { tx: 31, ty: 28 },
  "glacier-point": { tx: 55, ty: 37 },
};

export class ValleyScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys?: Record<string, Phaser.Input.Keyboard.Key>;
  private tsRefs: Record<string, Phaser.Tilemaps.Tileset> = {};
  private firstgids: Record<string, number> = {};
  private solid: boolean[][] = [];
  private facing = "down";
  private paused = false;
  private discovered = new Set<string>();
  private activeLandmark: string | null = null;
  private armed = new Set<string>();
  private busOff: Array<() => void> = [];
  private moveTarget: { x: number; y: number } | null = null;
  private lastEmit = 0;

  constructor() {
    super("valley");
  }

  preload() {
    for (const t of TILESETS) this.load.image(t.key, `${BASE}${t.file}.png`);
    this.load.spritesheet("hunter", "/game/ninja-adventure/sprites/hunter.png", {
      frameWidth: TILE,
      frameHeight: TILE,
    });
  }

  create() {
    if (DEBUG_ATLAS) {
      this.buildAtlas(ATLAS);
      return;
    }
    this.buildValley();
    this.placeLandmarkMarkers();
    this.buildPlayer();
    this.bindInput();
    this.bindBus();

    this.cameras.main.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    this.cameras.main.setZoom(ZOOM);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.roundPixels = true;

    for (const l of landmarks) this.armed.add(l.id);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());
    if (process.env.NODE_ENV !== "production")
      (window as unknown as { __valley?: unknown }).__valley = this;
    gameBus.emit("game:ready");
  }

  private gid(tsKey: string, localId: number) {
    return this.firstgids[tsKey] + localId;
  }

  private buildValley() {
    const map = this.make.tilemap({
      tileWidth: TILE,
      tileHeight: TILE,
      width: MAP_W,
      height: MAP_H,
    });
    // explicit firstgids: Phaser does NOT auto-chain them for a blank (non-Tiled) map
    let nextGid = 1;
    for (const t of TILESETS) {
      this.firstgids[t.key] = nextGid;
      this.tsRefs[t.key] = map.addTilesetImage(t.key, t.key, TILE, TILE, 0, 0, nextGid)!;
      nextGid += t.cols * t.rows;
    }
    const allTs = Object.values(this.tsRefs);

    const ground = map.createBlankLayer("ground", allTs)!.setDepth(0);
    const water = map.createBlankLayer("water", allTs)!.setDepth(1);
    const decoration = map.createBlankLayer("decoration", allTs)!.setDepth(2);
    const walls = map.createBlankLayer("walls", allTs)!.setDepth(3);

    this.solid = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(false));
    const rnd = this.rng(20260628);

    // 1) grass everywhere, with subtle variation
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const v = rnd();
        const tile =
          v > 0.9 ? T.grassAlt[Math.floor(rnd() * T.grassAlt.length)] : T.grass;
        ground.putTileAt(this.gid("floor", tile), x, y);
      }
    }

    // 2) the Merced: a winding water band across the valley
    for (let x = 0; x < MAP_W; x++) {
      const cy = 28 + Math.round(Math.sin(x * 0.16) * 2.4);
      for (let dy = -1; dy <= 1; dy++) {
        const y = cy + dy;
        if (y < 0 || y >= MAP_H) continue;
        water.putTileAt(this.gid("water", T.water), x, y);
        this.solid[y][x] = true;
      }
    }
    // a wooden crossing at the Merced bridge landmark (walkable gap)
    const bridge = LANDMARK_POS["merced-bridge"];
    for (let dy = -2; dy <= 2; dy++) {
      const y = bridge.ty + dy;
      if (y < 0 || y >= MAP_H) continue;
      ground.putTileAt(this.gid("floor", T.dirt), bridge.tx, y);
      water.removeTileAt(bridge.tx, y);
      this.solid[y][bridge.tx] = false;
    }

    // 3) trails: dirt paths from spawn to each landmark
    const spawn = LANDMARK_POS["tunnel-view"];
    for (const id of Object.keys(LANDMARK_POS)) {
      if (id === "tunnel-view") continue;
      const dst = LANDMARK_POS[id];
      this.carvePath(ground, spawn.tx, spawn.ty, dst.tx, dst.ty);
    }

    // 4) granite valley walls around the rim (collide)
    for (let x = 0; x < MAP_W; x++) {
      for (let t = 0; t < 2; t++) {
        this.placeWall(walls, x, t);
        this.placeWall(walls, x, MAP_H - 1 - t);
      }
    }
    for (let y = 0; y < MAP_H; y++) {
      for (let t = 0; t < 2; t++) {
        this.placeWall(walls, t, y);
        this.placeWall(walls, MAP_W - 1 - t, y);
      }
    }

    // 5) forest: scatter trees in clusters, avoiding water/paths/walls
    let placed = 0;
    let guard = 0;
    while (placed < 90 && guard++ < 4000) {
      const x = 3 + Math.floor(rnd() * (MAP_W - 6));
      const y = 3 + Math.floor(rnd() * (MAP_H - 8));
      const big = rnd() > 0.45;
      const block = big ? TREE_BIG : TREE_SMALL;
      if (this.canPlaceBlock(x, y, block[0].length, block.length)) {
        this.stampBlock(decoration, "nature", block, x, y);
        // collide on the trunk row only
        const trunkY = y + block.length - 1;
        for (let dx = 0; dx < block[0].length; dx++) this.solid[trunkY][x + dx] = true;
        placed++;
      }
    }
  }

  /** visible beacon + label per landmark (placeholder until custom art, Phase 5) */
  private placeLandmarkMarkers() {
    for (const l of landmarks) {
      const p = LANDMARK_POS[l.id];
      if (!p) continue;
      const x = p.tx * TILE + 8;
      const y = p.ty * TILE + 8;
      const beacon = this.add
        .ellipse(x, y - 1, 12, 8, 0xc98f45)
        .setStrokeStyle(1, 0x3c4049)
        .setDepth(4);
      this.tweens.add({
        targets: beacon,
        scaleX: 1.35,
        scaleY: 1.35,
        alpha: 0.55,
        duration: 720,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
      this.add
        .text(x, y - 14, l.landmark.split(" · ")[0], {
          fontSize: "7px",
          color: "#2c4334",
          backgroundColor: "#ece4d3dd",
          padding: { x: 2, y: 1 },
        })
        .setOrigin(0.5, 1)
        .setDepth(11)
        .setResolution(2);
    }
  }

  private placeWall(layer: Phaser.Tilemaps.TilemapLayer, x: number, y: number) {
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return;
    layer.putTileAt(this.gid("relief", T.wall), x, y);
    this.solid[y][x] = true;
  }

  private carvePath(
    layer: Phaser.Tilemaps.TilemapLayer,
    x0: number,
    y0: number,
    x1: number,
    y1: number
  ) {
    let x = x0;
    let y = y0;
    const put = () => {
      if (x > 1 && y > 1 && x < MAP_W - 2 && y < MAP_H - 2 && !this.solid[y][x]) {
        layer.putTileAt(this.gid("floor", T.dirt), x, y);
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

  private canPlaceBlock(x: number, y: number, w: number, h: number) {
    if (x < 2 || y < 2 || x + w > MAP_W - 2 || y + h > MAP_H - 2) return false;
    for (let dy = 0; dy < h; dy++)
      for (let dx = 0; dx < w; dx++) if (this.solid[y + dy][x + dx]) return false;
    // keep trees off the dirt paths (rough: skip if any cell is near a landmark line)
    return true;
  }

  private stampBlock(
    layer: Phaser.Tilemaps.TilemapLayer,
    tsKey: string,
    block: number[][],
    x: number,
    y: number
  ) {
    for (let dy = 0; dy < block.length; dy++)
      for (let dx = 0; dx < block[dy].length; dx++)
        layer.putTileAt(this.gid(tsKey, block[dy][dx]), x + dx, y + dy);
  }

  private buildPlayer() {
    // 4-direction walk anims (NA sheet: 4 cols x 7 rows). Verified/adjusted by screenshot.
    const dirs: [string, number][] = [
      ["down", 0],
      ["up", 4],
      ["left", 8],
      ["right", 12],
    ];
    for (const [name, start] of dirs) {
      this.anims.create({
        key: `walk-${name}`,
        frames: this.anims.generateFrameNumbers("hunter", { start, end: start + 3 }),
        frameRate: 8,
        repeat: -1,
      });
    }

    // spawn a few tiles below the Tunnel View marker so its modal does not auto-open
    this.player = this.physics.add.sprite(
      32 * TILE + 8,
      39 * TILE + 8,
      "hunter",
      0
    );
    this.player.setDepth(5);
    this.player.body.setSize(10, 10).setOffset(3, 5);

    // collide with solid cells via a static physics grid
    this.physics.world.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    this.player.setCollideWorldBounds(true);
    this.buildColliders();
  }

  /** one static body per solid cell, merged into horizontal runs to keep counts low */
  private buildColliders() {
    const group = this.physics.add.staticGroup();
    for (let y = 0; y < MAP_H; y++) {
      let x = 0;
      while (x < MAP_W) {
        if (this.solid[y][x]) {
          let run = 1;
          while (x + run < MAP_W && this.solid[y][x + run]) run++;
          const rect = group.create(
            x * TILE + (run * TILE) / 2,
            y * TILE + TILE / 2,
            undefined
          ) as Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
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
    this.keys = this.input.keyboard?.addKeys("W,A,S,D") as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;
    // tap/drag to move toward a point
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.moveTarget = { x: p.worldX, y: p.worldY };
    });
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
    const speed = 84;
    const body = this.player.body;
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

    // pointer steering when no keys held
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
    body.setVelocity((vx / len) * speed, (vy / len) * speed);

    if (vx || vy) {
      if (Math.abs(vx) > Math.abs(vy)) this.facing = vx < 0 ? "left" : "right";
      else this.facing = vy < 0 ? "up" : "down";
      this.player.anims.play(`walk-${this.facing}`, true);
    } else {
      this.player.anims.stop();
    }

    // throttled position for the minimap
    if (time - this.lastEmit > 120) {
      this.lastEmit = time;
      gameBus.emit("player:move", {
        x: this.player.x / (MAP_W * TILE),
        y: this.player.y / (MAP_H * TILE),
      });
    }

    this.checkLandmarks();
  }

  private checkLandmarks() {
    let inside: string | null = null;
    for (const l of landmarks) {
      const p = LANDMARK_POS[l.id];
      if (!p) continue;
      const d = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        p.tx * TILE + 8,
        p.ty * TILE + 8
      );
      if (d < 26) inside = l.id;
      else if (d > 40) this.armed.add(l.id);
    }
    if (inside && inside !== this.activeLandmark && this.armed.has(inside)) {
      this.activeLandmark = inside;
      this.armed.delete(inside);
      if (!this.discovered.has(inside)) {
        this.discovered.add(inside);
        gameBus.emit("landmark:discovered", { id: inside });
      }
      gameBus.emit("landmark:enter", { id: inside });
    } else if (!inside && this.activeLandmark) {
      this.activeLandmark = null;
    }
  }

  // ---- helpers ----
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

  // ---- debug atlas (index reader) ----
  private buildAtlas(key: string) {
    const meta = TILESETS.find((t) => t.key === key)!;
    const { cols, rows } = meta;
    const map = this.make.tilemap({ tileWidth: TILE, tileHeight: TILE, width: cols, height: rows });
    const ts = map.addTilesetImage(key, key, TILE, TILE, 0, 0)!;
    const layer = map.createBlankLayer("atlas", ts)!;
    for (let L = 0; L < cols * rows; L++)
      layer.putTileAt(ts.firstgid + L, L % cols, Math.floor(L / cols));

    const g = this.add.graphics().setDepth(10);
    g.lineStyle(1, 0x000000, 0.25);
    for (let c = 0; c <= cols; c++) g.lineBetween(c * TILE, 0, c * TILE, rows * TILE);
    for (let r = 0; r <= rows; r++) g.lineBetween(0, r * TILE, cols * TILE, r * TILE);

    const F = ATLAS_FOCUS;
    for (let r = F.r0; r <= F.r1 && r < rows; r++)
      for (let c = F.c0; c <= F.c1 && c < cols; c++)
        this.add
          .text(c * TILE + 1, r * TILE + 4, String(r * cols + c), {
            fontSize: "7px",
            color: "#ffffff",
            backgroundColor: "#000000cc",
          })
          .setDepth(12);

    const cam = this.cameras.main;
    const fw = (F.c1 - F.c0 + 1) * TILE;
    const fh = (F.r1 - F.r0 + 1) * TILE;
    cam.setZoom(Math.min(GAME_W / fw, GAME_H / fh));
    cam.centerOn((F.c0 + F.c1 + 1) * 0.5 * TILE, (F.r0 + F.r1 + 1) * 0.5 * TILE);
  }
}
