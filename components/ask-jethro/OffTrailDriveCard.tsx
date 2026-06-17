"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Off-Trail drive — the desktop Easter egg shown when a visitor wanders off the
 * portfolio trail (an obviously off-topic ask; never calls Gemini). An ORIGINAL
 * pseudo-3D trail racer rendered with plain Canvas 2D in the Yosemite /
 * field-guide palette: steer a marker down a winding granite road past Half
 * Dome rocks and pines to find your way back. No engine, no assets, no third
 * party game. Arrow keys to steer, Space to start / restart. Mobile gets the
 * runner instead (see OffTrailCard). Reduced motion shows a static card.
 *
 * Performance: simulation in refs on one rAF loop drawing to a single canvas;
 * React state only changes on status / best (score updates a ref textContent).
 */
type OffTrailAction = "projects" | "resume" | "ask" | "about";
type Status = "idle" | "running" | "over";

const HEIGHT = 230; // canvas css height
const SEG = 200; // segment length (world units)
const ROAD_W = 1000; // road half-width (world units)
const RUMBLE = 3; // segments per colour stripe
const DRAW = 90; // segments drawn
const FOV = 100;
const CAM_H = 1000; // camera height
const CENTRIFUGAL = 0.32;
const MAX_SPEED = SEG * 58; // ~ one segment per frame at 58fps
const ACCEL = MAX_SPEED * 0.85;
const BRAKE = -MAX_SPEED * 1.1;
const OFFROAD_LIMIT = MAX_SPEED * 0.45;

const C = {
  skyTop: "#dfe3e2",
  skyBot: "#e9e3d4",
  dome: "#bcb6a6",
  domeFace: "#a99f8c",
  hill: "#cfc8b6",
  grassL: "#e4ddca",
  grassD: "#dcd4bf",
  roadL: "#828d79",
  roadD: "#79856f",
  rumbleL: "#efe9d9",
  rumbleD: "#ab9f8b",
  lane: "#ece4d3",
  pine: "#3e5c46",
  pineDeep: "#2c4334",
  car: "#c98f45",
  carD: "#9a6a31",
  shadow: "#3c4049",
};

type Sprite = { offset: number; kind: "dome" | "pine" }; // offset in road-half units
interface Seg {
  i: number;
  z: number;
  curve: number;
  sprites: Sprite[];
  p1: Pt;
  p2: Pt;
}
type Pt = { w: { x: number; y: number; z: number }; c: { x: number; y: number; z: number }; s: { x: number; y: number; w: number; scale: number } };
const mkPt = (z: number): Pt => ({ w: { x: 0, y: 0, z }, c: { x: 0, y: 0, z: 0 }, s: { x: 0, y: 0, w: 0, scale: 0 } });

const pad = (n: number) => String(Math.max(0, Math.floor(n))).padStart(4, "0");
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const easeIn = (a: number, b: number, p: number) => a + (b - a) * Math.pow(p, 2);
const easeOut = (a: number, b: number, p: number) => a + (b - a) * (1 - Math.pow(1 - p, 2));

const DESTS: { key: OffTrailAction; label: string }[] = [
  { key: "projects", label: "View projects" },
  { key: "resume", label: "My resume" },
  { key: "ask", label: "Ask about Jethro" },
  { key: "about", label: "About" },
];
const btn =
  "inline-flex items-center rounded-sm border border-[var(--color-granite-line)] bg-[var(--color-sand)] px-2.5 py-1 text-[0.76rem] font-medium text-[var(--color-shadow)] transition-colors hover:border-[var(--color-pine)] hover:text-[var(--color-pine)]";

function buildTrack(): { segs: Seg[]; length: number } {
  const segs: Seg[] = [];
  const add = (curve: number) => {
    const i = segs.length;
    segs.push({ i, z: i * SEG, curve, sprites: [], p1: mkPt(i * SEG), p2: mkPt((i + 1) * SEG) });
  };
  const road = (enter: number, hold: number, leave: number, curve: number) => {
    for (let n = 0; n < enter; n++) add(easeIn(0, curve, n / enter));
    for (let n = 0; n < hold; n++) add(curve);
    for (let n = 0; n < leave; n++) add(easeOut(curve, 0, n / leave));
  };
  road(20, 16, 14, 0); // start straight
  road(16, 18, 16, 2.6); // gentle right
  road(14, 14, 14, 0);
  road(16, 20, 16, -3.0); // left
  road(12, 14, 12, 0);
  road(14, 16, 14, 4.0); // sharper right
  road(14, 18, 16, -2.4);
  road(20, 18, 20, 0); // long straight home

  // sprites: dodgeable rocks/pines on the road, decoration on the verges
  for (let i = 26; i < segs.length - 6; i++) {
    if (i % 11 === 0) segs[i].sprites.push({ offset: (i % 22 === 0 ? -0.5 : 0.5), kind: "dome" });
    if (i % 7 === 0) segs[i].sprites.push({ offset: i % 14 === 0 ? -1.7 : 1.7, kind: "pine" });
    if (i % 17 === 0) segs[i].sprites.push({ offset: 0, kind: "pine" });
  }
  return { segs, length: segs.length * SEG };
}

export function OffTrailDriveCard({ onAction }: { onAction: (a: OffTrailAction) => void }) {
  const reduce = useReducedMotion();
  const [status, setStatusState] = useState<Status>("idle");
  const [best, setBest] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [cssW, setCssW] = useState(420);

  const areaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const keys = useRef({ left: false, right: false, brake: false });
  const cssWRef = useRef(420);
  const track = useRef(buildTrack());

  const g = useRef({
    status: "idle" as Status,
    pos: 0, // camera z along the track
    x: 0, // lateral, -1..1 = road edges
    speed: 0,
    dist: 0,
    score: 0,
  });

  const setStatus = useCallback((s: Status) => {
    g.current.status = s;
    setStatusState(s);
  }, []);

  const clearKeys = useCallback(() => {
    keys.current.left = false;
    keys.current.right = false;
    keys.current.brake = false;
  }, []);

  const reset = useCallback(() => {
    const c = g.current;
    c.pos = 0;
    c.x = 0;
    c.speed = 0;
    c.dist = 0;
    c.score = 0;
    clearKeys(); // don't carry a held key into the next run
    if (scoreRef.current) scoreRef.current.textContent = "0000";
  }, [clearKeys]);

  const startOrRestart = useCallback(() => {
    reset();
    setStatus("running");
  }, [reset, setStatus]);

  const onInput = useCallback(() => {
    if (g.current.status !== "running") startOrRestart();
  }, [startOrRestart]);

  // measure width
  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const measure = () => {
      const w = Math.round(el.clientWidth);
      if (w > 0) {
        cssWRef.current = w;
        setCssW(w);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    try {
      const b = Number(window.localStorage.getItem("offtrail.drive.best") || "0");
      if (Number.isFinite(b) && b > 0) setBest(b);
    } catch {
      /* ignore */
    }
  }, []);

  // size the canvas for crisp rendering
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(cssW * dpr);
    cv.height = Math.round(HEIGHT * dpr);
    const ctx = cv.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, [cssW]);

  // the loop
  useEffect(() => {
    if (reduce) return;
    const cv = canvasRef.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const { segs, length } = track.current;
    const camDepth = 1 / Math.tan(((FOV / 2) * Math.PI) / 180);
    const PLAYER_Z = CAM_H * camDepth;
    let raf = 0;
    let last = 0;

    const findSeg = (z: number) => segs[Math.floor(z / SEG) % segs.length];

    const project = (p: Pt, camX: number, camZ: number, W: number) => {
      p.c.x = p.w.x - camX;
      p.c.y = p.w.y - CAM_H;
      p.c.z = p.w.z - camZ;
      p.s.scale = camDepth / p.c.z;
      p.s.x = Math.round(W / 2 + (p.s.scale * p.c.x * W) / 2);
      p.s.y = Math.round(HEIGHT / 2 - (p.s.scale * p.c.y * HEIGHT) / 2);
      p.s.w = Math.round((p.s.scale * ROAD_W * W) / 2);
    };

    const poly = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number, fill: string) => {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.lineTo(x4, y4);
      ctx.closePath();
      ctx.fill();
    };

    const drawDome = (cx: number, baseY: number, scale: number) => {
      const h = clamp(scale * 1400, 8, HEIGHT);
      const w = h * 1.15;
      ctx.beginPath();
      ctx.moveTo(cx - w / 2, baseY);
      ctx.lineTo(cx - w / 2, baseY - h * 0.5);
      ctx.bezierCurveTo(cx - w * 0.3, baseY - h * 0.95, cx + w * 0.1, baseY - h, cx + w * 0.35, baseY - h * 0.86);
      ctx.lineTo(cx + w / 2, baseY - h * 0.62);
      ctx.lineTo(cx + w / 2, baseY);
      ctx.closePath();
      ctx.fillStyle = C.dome;
      ctx.fill();
      ctx.fillStyle = C.domeFace;
      ctx.fillRect(cx + w / 2 - Math.max(1, w * 0.08), baseY - h * 0.62, Math.max(1, w * 0.08), h * 0.62);
    };

    const drawPine = (cx: number, baseY: number, scale: number) => {
      const h = clamp(scale * 1100, 6, HEIGHT);
      const w = h * 0.5;
      ctx.fillStyle = C.pine;
      ctx.beginPath();
      ctx.moveTo(cx, baseY - h);
      ctx.lineTo(cx + w / 2, baseY - h * 0.18);
      ctx.lineTo(cx - w / 2, baseY - h * 0.18);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = C.pineDeep;
      ctx.fillRect(cx - Math.max(0.6, w * 0.08), baseY - h * 0.2, Math.max(1.2, w * 0.16), h * 0.2);
    };

    const drawCar = (W: number, steer: number) => {
      const cx = W / 2 + steer * 10;
      const by = HEIGHT - 14;
      const w = 30;
      const h = 16;
      ctx.fillStyle = "rgba(60,64,73,0.16)";
      ctx.beginPath();
      ctx.ellipse(cx, by + 5, w * 0.62, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.car;
      ctx.beginPath();
      ctx.moveTo(cx - w / 2, by);
      ctx.lineTo(cx - w * 0.34, by - h);
      ctx.lineTo(cx + w * 0.34, by - h);
      ctx.lineTo(cx + w / 2, by);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = C.carD;
      ctx.fillRect(cx - w * 0.3, by - h - 5, w * 0.6, 6); // cabin
      ctx.fillStyle = C.shadow;
      ctx.fillRect(cx - w / 2, by - 4, 5, 6);
      ctx.fillRect(cx + w / 2 - 5, by - 4, 5, 6);
    };

    const render = (W: number) => {
      const c = g.current;
      // sky
      const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT * 0.7);
      sky.addColorStop(0, C.skyTop);
      sky.addColorStop(1, C.skyBot);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, HEIGHT);
      // distant Half Dome on the horizon, parallax with curve
      const hx = W * 0.62 - (c.x * 40) - (findSeg(c.pos).curve * 12);
      const horizon = HEIGHT / 2;
      ctx.fillStyle = C.hill;
      ctx.beginPath();
      ctx.moveTo(hx - 90, horizon);
      ctx.bezierCurveTo(hx - 60, horizon - 34, hx - 6, horizon - 46, hx + 22, horizon - 38);
      ctx.lineTo(hx + 40, horizon - 20);
      ctx.lineTo(hx + 40, horizon);
      ctx.closePath();
      ctx.fill();

      const base = findSeg(c.pos);
      const basePercent = (c.pos % SEG) / SEG;
      let maxy = HEIGHT;
      let x = 0;
      let dx = -(base.curve * basePercent);

      for (let n = 0; n < DRAW; n++) {
        const seg = segs[(base.i + n) % segs.length];
        const looped = seg.i < base.i;
        const camZ = c.pos - (looped ? length : 0);
        project(seg.p1, c.x * ROAD_W - x, camZ, W);
        project(seg.p2, c.x * ROAD_W - x - dx, camZ, W);
        x += dx;
        dx += seg.curve;
        if (seg.p1.c.z <= camDepth || seg.p2.s.y >= seg.p1.s.y || seg.p2.s.y >= maxy) continue;

        const dark = Math.floor(seg.i / RUMBLE) % 2 === 1;
        const p1 = seg.p1.s;
        const p2 = seg.p2.s;
        // grass
        ctx.fillStyle = dark ? C.grassD : C.grassL;
        ctx.fillRect(0, p2.y, W, p1.y - p2.y);
        // rumble
        const r1 = p1.w / 5;
        const r2 = p2.w / 5;
        poly(p1.x - p1.w - r1, p1.y, p1.x - p1.w, p1.y, p2.x - p2.w, p2.y, p2.x - p2.w - r2, p2.y, dark ? C.rumbleD : C.rumbleL);
        poly(p1.x + p1.w + r1, p1.y, p1.x + p1.w, p1.y, p2.x + p2.w, p2.y, p2.x + p2.w + r2, p2.y, dark ? C.rumbleD : C.rumbleL);
        // road
        poly(p1.x - p1.w, p1.y, p1.x + p1.w, p1.y, p2.x + p2.w, p2.y, p2.x - p2.w, p2.y, dark ? C.roadD : C.roadL);
        // lane dashes on light segments
        if (!dark) {
          const l1 = p1.w * 0.04;
          const l2 = p2.w * 0.04;
          poly(p1.x - l1, p1.y, p1.x + l1, p1.y, p2.x + l2, p2.y, p2.x - l2, p2.y, C.lane);
        }
        maxy = p2.y;
      }

      // sprites + collision markers, far to near
      for (let n = DRAW - 1; n > 0; n--) {
        const seg = segs[(base.i + n) % segs.length];
        for (const sp of seg.sprites) {
          const p = seg.p1.s;
          if (p.scale <= 0) continue;
          const sx = p.x + p.scale * sp.offset * ROAD_W * (W / 2);
          if (sp.kind === "dome") drawDome(sx, p.y, p.scale);
          else drawPine(sx, p.y, p.scale);
        }
      }

      drawCar(W, (keys.current.left ? -1 : 0) + (keys.current.right ? 1 : 0));
    };

    const loop = (t: number) => {
      if (!last) last = t;
      let dt = (t - last) / 1000;
      last = t;
      if (dt > 0.05) dt = 0.05;
      const W = cssWRef.current;
      const c = g.current;

      if (c.status === "running") {
        const sp = c.speed / MAX_SPEED;
        const steer = dt * 1.6 * Math.max(0.18, sp);
        if (keys.current.left) c.x -= steer;
        else if (keys.current.right) c.x += steer;

        const curve = findSeg(c.pos + PLAYER_Z).curve;
        c.x -= curve * sp * CENTRIFUGAL * dt;

        // accelerate / brake, then hard-cap speed off the road (the off-road slowdown)
        c.speed += (keys.current.brake ? BRAKE : ACCEL) * dt;
        c.speed = clamp(c.speed, 0, MAX_SPEED);
        if (Math.abs(c.x) > 1) c.speed = Math.min(c.speed, OFFROAD_LIMIT);
        c.x = clamp(c.x, -2.2, 2.2);

        const total = segs.length;
        const prevSegI = Math.floor((c.pos + PLAYER_Z) / SEG);
        c.pos = (c.pos + c.speed * dt) % length;
        c.dist += c.speed * dt;
        const score = Math.floor(c.dist / 260);
        if (score !== c.score) {
          c.score = score;
          if (scoreRef.current) scoreRef.current.textContent = pad(score);
        }

        // collision: sweep EVERY segment entered this frame so a fast/dropped
        // frame can't tunnel through an on-road rock or pine
        const curSegI = Math.floor((c.pos + PLAYER_Z) / SEG);
        let steps = curSegI - prevSegI;
        if (steps < 0) steps += total;
        let crashed = false;
        for (let s = 0; s <= steps && !crashed; s++) {
          for (const spr of segs[(prevSegI + s) % total].sprites) {
            if (Math.abs(spr.offset) <= 1 && Math.abs(c.x - spr.offset) < 0.42) {
              crashed = true;
              break;
            }
          }
        }
        if (crashed) {
          setFinalScore(c.score);
          setBest((b) => {
            const nb = Math.max(b, c.score);
            try {
              window.localStorage.setItem("offtrail.drive.best", String(nb));
            } catch {
              /* ignore */
            }
            return nb;
          });
          setStatus("over");
        }
      }

      render(W);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduce, setStatus]);

  // focus so "Press Space to drive back" works immediately. The game card IS the
  // response to the user's submit, so grabbing focus is intended; it never traps
  // (click the composer or Tab away anytime). A short delay wins the race with
  // the composer keeping focus after submit; don't yank a deliberately-focused button.
  useEffect(() => {
    if (reduce) return;
    // 220ms beats the panel's own 120ms composer-focus when the panel opens fresh
    const t = window.setTimeout(() => {
      const a = document.activeElement as HTMLElement | null;
      if (!a || a === document.body || a.tagName === "INPUT" || a.tagName === "TEXTAREA") {
        areaRef.current?.focus({ preventScroll: true });
      }
    }, 220);
    return () => window.clearTimeout(t);
  }, [reduce]);

  // a held key whose keyup lands elsewhere (tab/window blur, focus loss) must
  // not leave the car steering itself
  useEffect(() => {
    if (reduce) return;
    const drop = () => clearKeys();
    window.addEventListener("blur", drop);
    document.addEventListener("visibilitychange", drop);
    return () => {
      window.removeEventListener("blur", drop);
      document.removeEventListener("visibilitychange", drop);
    };
  }, [reduce, clearKeys]);

  const setKey = (e: React.KeyboardEvent, down: boolean) => {
    const k = e.code;
    if (k === "ArrowLeft" || k === "KeyA") {
      keys.current.left = down;
      e.preventDefault();
    } else if (k === "ArrowRight" || k === "KeyD") {
      keys.current.right = down;
      e.preventDefault();
    } else if (k === "ArrowDown" || k === "KeyS") {
      keys.current.brake = down;
      e.preventDefault();
    } else if (k === "Space" || k === "ArrowUp" || k === "Enter") {
      e.preventDefault();
      if (down) onInput();
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    areaRef.current?.focus({ preventScroll: true });
    if (g.current.status !== "running") {
      onInput();
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const left = e.clientX - r.left < r.width / 2;
    keys.current.left = left;
    keys.current.right = !left;
  };
  const onPointerUp = () => clearKeys();

  const instruction =
    status === "running" ? "← → steer · ↓ brake" : status === "over" ? "Press Space to try again" : "Press Space to drive back";

  if (reduce) {
    return (
      <div className="overflow-hidden rounded-md rounded-tl-xs border border-[var(--color-granite-line)] bg-[var(--color-card)]">
        <div className="border-b border-[var(--color-granite-line)] bg-[var(--color-sand)] px-4 py-2">
          <span className="label-mono text-[0.6rem] text-[var(--color-pine)]">off trail</span>
        </div>
        <div className="px-4 py-3.5">
          <p className="text-[0.9rem] leading-relaxed text-[var(--color-muted)]">
            You wandered off the portfolio trail. Pick a route to get back.
          </p>
          <RouteButtons onAction={onAction} />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md rounded-tl-xs border border-[var(--color-granite-line)] bg-[var(--color-card)]">
      <div className="flex items-center justify-between border-b border-[var(--color-granite-line)] bg-[var(--color-sand)] px-4 py-2">
        <span className="label-mono text-[0.6rem] text-[var(--color-pine)]">off trail</span>
        <span className="label-mono tnum text-[0.6rem] text-[var(--color-muted)]">
          score <span ref={scoreRef} className="text-[var(--color-shadow)]">0000</span>
          <span className="px-1.5 text-[var(--color-granite-line)]">·</span>
          best {pad(best)}
        </span>
      </div>

      <div
        ref={areaRef}
        tabIndex={0}
        role="application"
        aria-label="Off-trail trail-drive game. Arrow keys to steer, Space to start."
        onKeyDown={(e) => setKey(e, true)}
        onKeyUp={(e) => setKey(e, false)}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onBlur={clearKeys}
        className="relative cursor-pointer select-none bg-[var(--color-sand)] outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--color-pine)]"
        style={{ height: HEIGHT, touchAction: "none" }}
      >
        <canvas ref={canvasRef} style={{ width: "100%", height: HEIGHT, display: "block" }} />
        {status !== "running" && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
            {status === "over" && (
              <p className="label-mono text-[0.66rem] text-[var(--color-pine)]">off trail · score {pad(finalScore)}</p>
            )}
            <p className="font-display text-[1rem] font-medium text-[var(--color-shadow)]">
              {status === "over" ? "Press Space to try again" : "Press Space to drive back."}
            </p>
          </div>
        )}
      </div>

      <div className="px-4 py-3">
        <p className="label-mono text-[0.6rem] text-[var(--color-muted)]">{instruction}</p>
        <RouteButtons onAction={onAction} />
      </div>
    </div>
  );
}

function RouteButtons({ onAction }: { onAction: (a: OffTrailAction) => void }) {
  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {DESTS.map((d) => (
        <button key={d.key} onClick={() => onAction(d.key)} className={btn}>
          {d.label}
        </button>
      ))}
    </div>
  );
}
