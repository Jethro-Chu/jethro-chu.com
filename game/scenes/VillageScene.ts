/* ============================================================
   VillageScene  ·  hub-based top-down Yosemite Village
   A compact town: central plaza spawn, paths radiating to enterable
   buildings (each a portfolio district), the Merced along one edge
   with proper banks + a plank bridge, trees/props filling negative
   space. Buildings are stamped from the Ninja Adventure pack's
   pre-composed TilesetHouse + tileset_camp (the art is in the objects).
   Reuses the valley engine patterns: explicit firstgids, FIT camera,
   per-cell colliders, the gameBus bridge. DEBUG_ATLAS for index reads.
   ============================================================ */

import * as Phaser from "phaser";
import { gameBus } from "@/lib/gameBus";
import { landmarks } from "@/content/portfolio";

export const TILE = 16;

export const TILESETS = [
  { key: "floor", file: "TilesetFloor", cols: 22, rows: 26 },
  { key: "floorDetail", file: "TilesetFloorDetail", cols: 16, rows: 5 },
  { key: "nature", file: "TilesetNature", cols: 24, rows: 21 },
  { key: "water", file: "TilesetWater", cols: 28, rows: 17 },
  { key: "relief", file: "TilesetRelief", cols: 20, rows: 12 },
  { key: "house", file: "TilesetHouse", cols: 33, rows: 23 },
  { key: "camp", file: "tileset_camp", cols: 23, rows: 9 },
] as const;

const BASE = "/game/ninja-adventure/tilesets/";

export const GAME_W = 480;
export const GAME_H = 270;
const ZOOM = 2;

const MAP_W = 56;
const MAP_H = 44;

// verified tile localIds (pixel analysis / atlas reads)
const T = {
  grass: 245,
  grassAlt: [244, 264, 266],
  path: 188, // dirt
  water: 197, // solid blue (grass-edged set)
  bankTop: 173, // grass-on-top, water-below edge
  wall: 122, // granite cliff face (relief)
  bridge: 338, // wooden plank deck (water)
};
const TREE_A = [
  [53, 54],
  [77, 78],
  [101, 102],
];

// building source rects in their tileset: [tsKey, srcCol, srcRow, w, h, doorDx]
interface BDef {
  id: string;
  ts: string;
  sc: number;
  sr: number;
  w: number;
  h: number;
  doorDx: number;
  tx: number;
  ty: number;
}
const BUILDINGS: BDef[] = [
  { id: "visitor-center", ts: "house", sc: 4, sr: 0, w: 4, h: 3, doorDx: 1, tx: 24, ty: 6 },
  { id: "ranger-station", ts: "house", sc: 0, sr: 0, w: 4, h: 3, doorDx: 1, tx: 11, ty: 8 },
  { id: "ahwahnee", ts: "house", sc: 25, sr: 8, w: 4, h: 6, doorDx: 1, tx: 42, ty: 8 },
  { id: "chapel", ts: "house", sc: 12, sr: 0, w: 4, h: 3, doorDx: 1, tx: 9, ty: 22 },
  { id: "general-store", ts: "house", sc: 8, sr: 0, w: 4, h: 3, doorDx: 1, tx: 42, ty: 24 },
];
// the projects "cabins" = three tents (the trigger sits at the middle tent door)
const TENTS = [
  { sc: 4, ty: 31, tx: 8 },
  { sc: 7, ty: 31, tx: 13 },
  { sc: 10, ty: 31, tx: 18 },
];
const CABINS_DOOR = { tx: 14, ty: 33 };
const GLACIER_DOOR = { tx: 28, ty: 41 }; // the overlook deck across the bridge
const SPAWN = { tx: 28, ty: 20 };

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
    this.buildTown();
    this.buildPlayer();
    this.bindInput();
    this.bindBus();

    this.cameras.main.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    this.cameras.main.setZoom(ZOOM);
    this.cameras.main.startFollow(this.player, true, 0.14, 0.14);
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

  private buildTown() {
    const map = this.make.tilemap({ tileWidth: TILE, tileHeight: TILE, width: MAP_W, height: MAP_H });
    let g = 1;
    for (const t of TILESETS) {
      this.firstgids[t.key] = g;
      this.tsRefs[t.key] = map.addTilesetImage(t.key, t.key, TILE, TILE, 0, 0, g)!;
      g += t.cols * t.rows;
    }
    const all = Object.values(this.tsRefs);
    const ground = map.createBlankLayer("ground", all)!.setDepth(0);
    const paths = map.createBlankLayer("paths", all)!.setDepth(1);
    const water = map.createBlankLayer("water", all)!.setDepth(1);
    const deco = map.createBlankLayer("deco", all)!.setDepth(4);
    const walls = map.createBlankLayer("walls", all)!.setDepth(3);
    this.solid = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(false));
    const rnd = this.rng(70707);

    // 1) grass
    for (let y = 0; y < MAP_H; y++)
      for (let x = 0; x < MAP_W; x++) {
        const tile = rnd() > 0.9 ? T.grassAlt[Math.floor(rnd() * T.grassAlt.length)] : T.grass;
        ground.putTileAt(this.gid("floor", tile), x, y);
      }

    // 2) the Merced along the bottom edge, with a grass bank and solid water
    const RIVER_TOP = 37;
    for (let x = 0; x < MAP_W; x++) {
      ground.putTileAt(this.gid("water", T.bankTop), x, RIVER_TOP);
      this.solid[RIVER_TOP][x] = true;
      for (let y = RIVER_TOP + 1; y < MAP_H; y++) {
        water.putTileAt(this.gid("water", T.water), x, y);
        this.solid[y][x] = true;
      }
    }
    // a plank bridge to the Glacier Point overlook deck
    const bx = GLACIER_DOOR.tx;
    for (let y = RIVER_TOP; y < MAP_H; y++) {
      ground.putTileAt(this.gid("water", T.bridge), bx, y);
      ground.putTileAt(this.gid("water", T.bridge), bx - 1, y);
      water.removeTileAt(bx, y);
      water.removeTileAt(bx - 1, y);
      this.solid[y][bx] = false;
      this.solid[y][bx - 1] = false;
    }
    // overlook deck (a little grass platform at the far bank)
    for (let dx = -2; dx <= 2; dx++) {
      const x = GLACIER_DOOR.tx + dx;
      ground.putTileAt(this.gid("floor", T.grass), x, MAP_H - 1);
      ground.putTileAt(this.gid("floor", T.grass), x, MAP_H - 2);
      water.removeTileAt(x, MAP_H - 1);
      water.removeTileAt(x, MAP_H - 2);
      this.solid[MAP_H - 1][x] = false;
      this.solid[MAP_H - 2][x] = false;
    }

    // 3) buildings + their doors
    for (const b of BUILDINGS) {
      this.stampRect(deco, b.ts, b.sc, b.sr, b.w, b.h, b.tx, b.ty);
      for (let dy = 0; dy < b.h; dy++)
        for (let dx = 0; dx < b.w; dx++) this.solid[b.ty + dy][b.tx + dx] = true;
      const doorX = b.tx + b.doorDx;
      const doorY = b.ty + b.h - 1;
      this.solid[doorY][doorX] = false; // step into the doorway
      this.doors.push({ id: b.id, x: doorX, y: doorY });
    }
    // tent cabins (projects)
    for (const tent of TENTS) {
      this.stampRect(deco, "camp", tent.sc, 0, 3, 3, tent.tx, tent.ty);
      for (let dy = 0; dy < 3; dy++)
        for (let dx = 0; dx < 3; dx++) this.solid[tent.ty + dy][tent.tx + dx] = true;
    }
    this.solid[CABINS_DOOR.ty][CABINS_DOOR.tx] = false;
    this.doors.push({ id: "cabins", x: CABINS_DOOR.tx, y: CABINS_DOOR.ty });
    // glacier-point: a torii arch on the overlook deck + trigger
    this.stampRect(deco, "house", 0, 5, 3, 2, GLACIER_DOOR.tx - 1, MAP_H - 3);
    this.doors.push({ id: "glacier-point", x: GLACIER_DOOR.tx, y: GLACIER_DOOR.ty });

    // 4) granite valley walls around the rim (the town sits in the valley)
    for (let x = 0; x < MAP_W; x++)
      for (let t = 0; t < 2; t++) {
        this.wall(walls, x, t);
        if (RIVER_TOP > MAP_H - 2) this.wall(walls, x, MAP_H - 1 - t);
      }
    for (let y = 0; y < RIVER_TOP; y++)
      for (let t = 0; t < 2; t++) {
        this.wall(walls, t, y);
        this.wall(walls, MAP_W - 1 - t, y);
      }

    // 5) the plaza: a packed-dirt green with a signpost + lanterns + benches
    for (let y = SPAWN.ty - 3; y <= SPAWN.ty + 3; y++)
      for (let x = SPAWN.tx - 5; x <= SPAWN.tx + 5; x++)
        if (!this.solid[y]?.[x]) paths.putTileAt(this.gid("floor", T.path), x, y);

    // 6) paths from the plaza to each door
    for (const d of this.doors) this.carvePath(paths, SPAWN.tx, SPAWN.ty, d.x, d.y + 1);

    // 7) props: lanterns flanking doors, trees + fences filling negative space
    for (const d of this.doors) {
      this.prop(deco, "camp", 12, 7, d.x - 1, d.y); // lantern L
      this.prop(deco, "camp", 12, 7, d.x + 1, d.y); // lantern R
    }
    // a campfire + barrels in the cabins district
    this.prop(deco, "camp", 5, 3, 15, 35);
    this.prop(deco, "camp", 0, 1, 7, 34);
    this.prop(deco, "camp", 1, 1, 20, 34);
    // a notice board / signpost at the plaza center
    this.prop(deco, "house", 3, 4, SPAWN.tx + 3, SPAWN.ty - 2);

    // trees in clusters, avoiding solid + paths
    let placed = 0;
    let guard = 0;
    while (placed < 46 && guard++ < 3000) {
      const x = 3 + Math.floor(rnd() * (MAP_W - 6));
      const y = 3 + Math.floor(rnd() * (RIVER_TOP - 6));
      if (this.canBlock(x, y, 2, 3) && !this.nearPath(paths, x, y, 2, 3)) {
        this.stampRect(deco, "nature", -1, -1, 0, 0, x, y, TREE_A);
        const trunkY = y + 2;
        this.solid[trunkY][x] = true;
        this.solid[trunkY][x + 1] = true;
        placed++;
      }
    }
  }

  private wall(layer: Phaser.Tilemaps.TilemapLayer, x: number, y: number) {
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return;
    layer.putTileAt(this.gid("relief", T.wall), x, y);
    this.solid[y][x] = true;
  }

  private prop(layer: Phaser.Tilemaps.TilemapLayer, ts: string, sc: number, sr: number, x: number, y: number) {
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return;
    layer.putTileAt(this.gid(ts, sr * this.cols(ts) + sc), x, y);
  }

  /** stamp a source rect (sc,sr,w,h) from tileset `ts`, OR an explicit localId block */
  private stampRect(
    layer: Phaser.Tilemaps.TilemapLayer,
    ts: string,
    sc: number,
    sr: number,
    w: number,
    h: number,
    dx: number,
    dy: number,
    block?: number[][]
  ) {
    if (block) {
      for (let y = 0; y < block.length; y++)
        for (let x = 0; x < block[y].length; x++)
          layer.putTileAt(this.gid(ts, block[y][x]), dx + x, dy + y);
      return;
    }
    const cols = this.cols(ts);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        layer.putTileAt(this.gid(ts, (sr + y) * cols + (sc + x)), dx + x, dy + y);
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

  private canBlock(x: number, y: number, w: number, h: number) {
    if (x < 2 || y < 2 || x + w > MAP_W - 2 || y + h > MAP_H - 2) return false;
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) if (this.solid[y + dy][x + dx]) return false;
    return true;
  }
  private nearPath(layer: Phaser.Tilemaps.TilemapLayer, x: number, y: number, w: number, h: number) {
    for (let dy = -1; dy <= h; dy++)
      for (let dx = -1; dx <= w; dx++) {
        const t = layer.getTileAt(x + dx, y + dy);
        if (t) return true;
      }
    return false;
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
    this.player.setDepth(5);
    this.player.body.setSize(10, 10).setOffset(3, 5);
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
    const speed = 88;
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
      if (dist < 22) inside = d.id;
      else if (dist > 36) this.armed.add(d.id);
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
