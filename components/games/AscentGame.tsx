"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * "Ascent" — a hidden climber. Climb from the 4,000 ft valley floor to the 8,839 ft
 * Half Dome summit: dodge the rockfall AND grab golden route-holds to build a combo
 * and rack up score (the holds pull you toward the falling rocks — that tension is
 * the game). Bespoke <canvas> on the site palette, mono HUD, lazy-loaded behind the
 * Konami code. State lives in refs; score/elev are written to the DOM each frame
 * (no per-frame React). Reaching the summit reveals the real Half Dome photo.
 */

const START_FT = 4000;
const SUMMIT_FT = 8839;
const KEY_BEST = "ascent.score.v1";

const MILESTONES: { ft: number; name: string }[] = [
  { ft: 4800, name: "El Capitan" },
  { ft: 5900, name: "Nevada Fall" },
  { ft: 7000, name: "the shoulder" },
  { ft: 8200, name: "the cables" },
];

type Phase = "ready" | "playing" | "over" | "summit";

interface Rock { x: number; y: number; r: number; vy: number; spin: number; rot: number; verts: number[]; near: boolean }
interface Hold { x: number; y: number; r: number; vy: number; t: number }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string }
interface Palette { sand: string; granite: string; pine: string; gold: string; shadow: string }

function readPalette(): Palette {
  const css = (k: string, fb: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(k).trim() || fb;
  return {
    sand: css("--color-sand", "#ede6d6"),
    granite: css("--color-granite-line", "#ab9f8b"),
    pine: css("--color-pine", "#3e5c46"),
    gold: css("--color-golden", "#c98f45"),
    shadow: css("--color-shadow", "#3c4049"),
  };
}

export default function AscentGame({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const elevRef = useRef<HTMLSpanElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const comboRef = useRef<HTMLSpanElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const [phase, setPhase] = useState<Phase>("ready");
  const [reached, setReached] = useState(START_FT);
  const [finalScore, setFinalScore] = useState(0);
  const [best, setBest] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const flashTimer = useRef(0);

  const g = useRef({
    raf: 0, last: 0, w: 0, h: 0, dpr: 1,
    px: 0, pv: 0, target: -1, left: false, right: false,
    elev: START_FT, bgOffset: 0, t: 0,
    rocks: [] as Rock[], rockSpawn: 0,
    holds: [] as Hold[], holdSpawn: 0,
    particles: [] as Particle[],
    score: 0, combo: 0, nextMile: 0, shake: 0,
    colors: readPaletteSafe(),
    phase: "ready" as Phase,
  });

  useEffect(() => {
    try { const b = Number(localStorage.getItem(KEY_BEST)); if (Number.isFinite(b) && b > 0) setBest(b); } catch {}
  }, []);

  const showFlash = useCallback((name: string) => {
    setFlash(name);
    clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), 1700);
  }, []);

  const fit = useCallback(() => {
    const cv = canvasRef.current;
    const wrap = cv?.parentElement;
    if (!cv || !wrap) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    cv.style.width = w + "px";
    cv.style.height = h + "px";
    const s = g.current;
    s.w = w; s.h = h; s.dpr = dpr;
    s.colors = readPalette();
    if (s.px === 0) s.px = w / 2;
  }, []);

  const draw = useCallback(() => {
    const cv = canvasRef.current;
    const ctx = cv?.getContext("2d");
    const s = g.current;
    if (!cv || !ctx) return;
    const C = s.colors;
    ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
    ctx.clearRect(0, 0, s.w, s.h);

    const shx = s.shake ? (Math.random() - 0.5) * s.shake : 0;
    const shy = s.shake ? (Math.random() - 0.5) * s.shake : 0;
    ctx.save();
    ctx.translate(shx, shy);

    ctx.fillStyle = C.sand;
    ctx.fillRect(-8, -8, s.w + 16, s.h + 16);

    // golden summit glow grows as you near the top
    const prog = (s.elev - START_FT) / (SUMMIT_FT - START_FT);
    if (prog > 0.45) {
      const a = Math.min(0.22, (prog - 0.45) * 0.5);
      const grd = ctx.createLinearGradient(0, 0, 0, s.h * 0.5);
      grd.addColorStop(0, hexA(C.gold, a));
      grd.addColorStop(1, hexA(C.gold, 0));
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, s.w, s.h * 0.5);
    }

    // contour lines scrolling down (the climb)
    ctx.strokeStyle = hexA(C.granite, 0.5);
    ctx.lineWidth = 1;
    const gap = 46;
    for (let y = (s.bgOffset % gap) - gap; y < s.h; y += gap) {
      ctx.beginPath();
      for (let x = 0; x <= s.w; x += 24) {
        const yy = y + Math.sin((x + y) * 0.012) * 5;
        x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }

    // holds — golden diamonds, gently pulsing
    for (const hd of s.holds) {
      ctx.save();
      ctx.translate(hd.x, hd.y);
      ctx.rotate(Math.PI / 4);
      const r = hd.r * (1 + Math.sin(hd.t * 6) * 0.12);
      ctx.fillStyle = C.gold;
      ctx.globalAlpha = 0.94;
      ctx.fillRect(-r, -r, r * 2, r * 2);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = hexA(C.shadow, 0.32);
      ctx.lineWidth = 1;
      ctx.strokeRect(-r, -r, r * 2, r * 2);
      ctx.restore();
    }

    // rocks
    for (const r of s.rocks) {
      ctx.save();
      ctx.translate(r.x, r.y);
      ctx.rotate(r.rot);
      ctx.beginPath();
      const n = r.verts.length;
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2;
        const rad = r.r * r.verts[i];
        i === 0 ? ctx.moveTo(Math.cos(ang) * rad, Math.sin(ang) * rad) : ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
      }
      ctx.closePath();
      ctx.fillStyle = hexA(C.granite, 0.92);
      ctx.fill();
      ctx.strokeStyle = hexA(C.shadow, 0.45);
      ctx.lineWidth = 1.25;
      ctx.stroke();
      ctx.restore();
    }

    // particles
    for (const p of s.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // player — a pine climber chevron, leaning into the move
    const py = s.h - 64;
    ctx.save();
    ctx.translate(s.px, py);
    ctx.rotate(Math.max(-0.5, Math.min(0.5, s.pv * 0.0016)));
    ctx.fillStyle = C.pine;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(10, 9);
    ctx.lineTo(0, 4);
    ctx.lineTo(-10, 9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore(); // end shake
  }, []);

  const stop = useCallback(() => {
    cancelAnimationFrame(g.current.raf);
    g.current.raf = 0;
  }, []);

  const endRef = useRef<(won: boolean) => void>(() => {});

  const loop = useCallback(
    (t: number) => {
      const s = g.current;
      if (s.phase !== "playing") return;
      const dt = Math.min(0.05, s.last ? (t - s.last) / 1000 : 0.016);
      s.last = t;
      s.t += dt;
      const C = s.colors;
      const prog = (s.elev - START_FT) / (SUMMIT_FT - START_FT);

      s.elev += (60 + prog * 30) * dt;
      s.bgOffset += (120 + prog * 90) * dt;
      if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 22);

      // player movement
      const dir = (s.right ? 1 : 0) - (s.left ? 1 : 0);
      if (s.target >= 0) s.pv = (s.target - s.px) * 9;
      else { s.pv += dir * 1700 * dt; s.pv *= 0.86; }
      s.px += s.pv * dt;
      const pad = 14;
      if (s.px < pad) { s.px = pad; s.pv = 0; }
      if (s.px > s.w - pad) { s.px = s.w - pad; s.pv = 0; }

      const py = s.h - 64;
      const pr = 9;

      // spawn rockfall — denser/faster the higher you climb, multiple per drop
      s.rockSpawn -= dt;
      const interval = Math.max(0.22, 0.72 - prog * 0.46);
      if (s.rockSpawn <= 0) {
        s.rockSpawn = interval * (0.65 + Math.random() * 0.45);
        const drops = 1 + (Math.random() < prog * 0.6 ? 1 : 0) + (Math.random() < prog * 0.3 ? 1 : 0);
        for (let d = 0; d < drops; d++) {
          const rad = 9 + Math.random() * 16;
          s.rocks.push({
            x: rad + Math.random() * (s.w - rad * 2),
            y: -rad - d * 44,
            r: rad,
            vy: 200 + prog * 320 + Math.random() * 90,
            spin: (Math.random() - 0.5) * 2.4,
            rot: 0,
            verts: Array.from({ length: 9 }, () => 0.78 + Math.random() * 0.34),
            near: false,
          });
        }
      }

      // spawn holds — slower, catchable; the carrot
      s.holdSpawn -= dt;
      if (s.holdSpawn <= 0) {
        s.holdSpawn = 0.85 + Math.random() * 0.7;
        const r = 8;
        s.holds.push({ x: 26 + Math.random() * (s.w - 52), y: -r, r, vy: 150 + prog * 110, t: 0 });
      }

      // update holds + collect
      for (let i = s.holds.length - 1; i >= 0; i--) {
        const hd = s.holds[i];
        hd.y += hd.vy * dt;
        hd.t += dt;
        const dx = hd.x - s.px, dy = hd.y - py;
        if (dx * dx + dy * dy < (hd.r + pr + 5) * (hd.r + pr + 5)) {
          s.combo++;
          s.score += 10 * Math.min(5, s.combo);
          burst(s, hd.x, hd.y, C.gold, 12);
          s.holds.splice(i, 1);
          continue;
        }
        if (hd.y - hd.r > s.h) { s.holds.splice(i, 1); s.combo = 0; } // missed → break the chain
      }

      // update rocks + collision + near-miss
      for (let i = s.rocks.length - 1; i >= 0; i--) {
        const r = s.rocks[i];
        r.y += r.vy * dt;
        r.rot += r.spin * dt;
        if (r.y - r.r > s.h) { s.rocks.splice(i, 1); continue; }
        const dx = r.x - s.px, dy = r.y - py;
        const hitR = r.r * 0.82 + pr;
        const d2 = dx * dx + dy * dy;
        if (d2 < hitR * hitR) {
          s.shake = 11;
          burst(s, s.px, py, C.granite, 18);
          endRef.current(false);
          return;
        }
        if (!r.near && Math.abs(dy) < 7 && d2 < (hitR + 20) * (hitR + 20)) {
          r.near = true;
          s.score += 5;
          s.shake = Math.max(s.shake, 3);
          burst(s, r.x, py, C.gold, 4);
        }
      }

      // particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.life -= dt;
        if (p.life <= 0) { s.particles.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt;
      }

      // milestones
      while (s.nextMile < MILESTONES.length && s.elev >= MILESTONES[s.nextMile].ft) {
        showFlash(MILESTONES[s.nextMile].name);
        s.score += 30;
        s.nextMile++;
      }

      // HUD (DOM, no React churn)
      if (scoreRef.current) scoreRef.current.textContent = s.score.toLocaleString("en-US");
      if (elevRef.current) elevRef.current.textContent = Math.round(s.elev).toLocaleString("en-US");
      if (comboRef.current) comboRef.current.textContent = s.combo > 1 ? "×" + Math.min(5, s.combo) : "";

      if (s.elev >= SUMMIT_FT) {
        s.elev = SUMMIT_FT;
        s.score += 250;
        endRef.current(true);
        return;
      }

      draw();
      s.raf = requestAnimationFrame(loop);
    },
    [draw, showFlash]
  );

  const end = useCallback((won: boolean) => {
    const s = g.current;
    stop();
    s.phase = won ? "summit" : "over";
    setReached(Math.round(s.elev));
    const fs = s.score;
    setFinalScore(fs);
    setBest((b) => {
      const nb = Math.max(b, fs);
      try { localStorage.setItem(KEY_BEST, String(nb)); } catch {}
      return nb;
    });
    setPhase(won ? "summit" : "over");
  }, [stop]);
  endRef.current = end;

  const start = useCallback(() => {
    const s = g.current;
    fit();
    s.elev = START_FT; s.rocks = []; s.holds = []; s.particles = [];
    s.rockSpawn = 0.6; s.holdSpawn = 0.5; s.last = 0; s.t = 0;
    s.pv = 0; s.target = -1; s.px = s.w / 2;
    s.score = 0; s.combo = 0; s.nextMile = 0; s.shake = 0;
    s.phase = "playing";
    setFlash(null);
    setFinalScore(0);
    setPhase("playing");
    cancelAnimationFrame(s.raf);
    s.raf = requestAnimationFrame(loop);
  }, [fit, loop]);

  // keyboard
  useEffect(() => {
    const s = g.current;
    const down = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") s.left = true;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") s.right = true;
      if ((e.key === " " || e.key === "Enter") && s.phase !== "playing") { e.preventDefault(); start(); }
      if (["ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") s.left = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") s.right = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [onClose, start]);

  // pointer steering
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const s = g.current;
    const move = (e: PointerEvent) => { const rect = cv.getBoundingClientRect(); s.target = e.clientX - rect.left; };
    const leave = () => { s.target = -1; };
    cv.addEventListener("pointerdown", move);
    cv.addEventListener("pointermove", move);
    cv.addEventListener("pointerup", leave);
    cv.addEventListener("pointercancel", leave);
    return () => {
      cv.removeEventListener("pointerdown", move);
      cv.removeEventListener("pointermove", move);
      cv.removeEventListener("pointerup", leave);
      cv.removeEventListener("pointercancel", leave);
    };
  }, []);

  // mount: size, focus, draw the ready frame; preload the reward; cleanup
  useEffect(() => {
    fit();
    draw();
    const pre = new Image();
    pre.src = "/images/halfdome-summit.jpg";
    closeRef.current?.focus();
    const onResize = () => { fit(); if (g.current.phase !== "playing") draw(); };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(g.current.raf);
      clearTimeout(flashTimer.current);
    };
  }, [fit, draw]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ascent — a hidden climbing game"
      className="fixed inset-0 z-[100] flex flex-col bg-[var(--color-sand)]"
    >
      {/* clinical top bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-granite-line)] px-4 py-2.5 sm:px-6">
        <p className="label-mono tnum text-[var(--color-shadow)]">
          ASCENT · <span ref={elevRef} className="text-[var(--color-pine)]">{START_FT.toLocaleString("en-US")}</span> ft
        </p>
        <div className="flex items-center gap-4">
          <p className="label-mono tnum text-[var(--color-shadow)]">
            score <span ref={scoreRef} className="font-medium text-[var(--color-pine)]">0</span>
            <span ref={comboRef} className="ml-1.5 font-medium text-[var(--color-golden-deep)]" />
          </p>
          <p className="label-mono tnum hidden sm:block">best {best.toLocaleString("en-US")}</p>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close game"
            className="rounded-sm p-1.5 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-card)] hover:text-[var(--color-shadow)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* play column */}
      <div className="relative mx-auto w-full max-w-[480px] flex-1 overflow-hidden">
        <canvas ref={canvasRef} className="block h-full w-full touch-none" />

        {flash && (
          <p key={flash} className="ascent-flash label-mono pointer-events-none absolute left-1/2 top-[20%] tracking-[0.14em] text-[var(--color-golden-deep)]">
            {flash}
          </p>
        )}

        {(phase === "ready" || phase === "over") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[color-mix(in_oklab,var(--color-sand)_72%,transparent)] px-8 text-center">
            <p className="text-rise font-display text-[var(--color-shadow)]">
              {phase === "ready" ? "Ascent" : "Rockfall."}
            </p>
            <p className="max-w-xs text-pretty leading-relaxed text-[var(--color-muted)]">
              {phase === "ready"
                ? "Climb to the Half Dome summit. Dodge the rockfall, and grab the golden holds to build a combo."
                : `Scored ${finalScore.toLocaleString("en-US")} · reached ${reached.toLocaleString("en-US")} ft. Best ${best.toLocaleString("en-US")}.`}
            </p>
            <button
              onClick={start}
              className="rounded-sm bg-[var(--color-pine)] px-5 py-2.5 font-body text-sm font-medium text-[var(--color-on-dark)] transition-colors hover:bg-[var(--color-pine-deep)]"
            >
              {phase === "ready" ? "Begin the climb" : "Climb again"}
            </button>
            <p className="label-mono">← → or A D to move · grab the gold · Esc to exit</p>
          </div>
        )}
      </div>

      {/* SUMMIT — the reward: the real Half Dome summit photo, revealed */}
      {phase === "summit" && (
        <div className="absolute inset-0 z-[110] overflow-hidden bg-[var(--color-shadow)]">
          <img
            src="/images/halfdome-summit.jpg"
            alt="Jethro Chu on the granite summit of Half Dome at golden hour."
            className="summit-photo absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="summit-bloom pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(85% 55% at 50% 26%, color-mix(in oklab, var(--color-golden) 78%, transparent) 0%, transparent 60%)" }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(24,22,18,0.88) 0%, rgba(24,22,18,0.12) 44%, transparent 72%)" }}
          />
          <button
            onClick={onClose}
            aria-label="Close game"
            className="absolute right-3 top-3 rounded-sm p-2 text-[var(--color-on-dark)] transition-colors hover:bg-[color-mix(in_oklab,var(--color-shadow)_45%,transparent)]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          <div className="summit-rise absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-8 pb-12 text-center">
            <p className="label-mono tnum tracking-[0.14em] text-[var(--color-golden)]">8,839 FT · HALF DOME</p>
            <p className="text-ridge font-display text-[var(--color-on-dark)]">You reached the summit</p>
            <p className="max-w-sm text-pretty leading-relaxed text-[var(--color-on-dark-muted)]">
              Scored {finalScore.toLocaleString("en-US")}. Best {best.toLocaleString("en-US")}. The view earns the climb.
            </p>
            <button
              onClick={start}
              className="mt-1 rounded-sm bg-[var(--color-on-dark)] px-5 py-2.5 font-body text-sm font-medium text-[var(--color-shadow)] transition-transform hover:scale-[1.03]"
            >
              Climb again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** burst of particles from (x,y) in `color` */
function burst(s: { particles: Particle[] }, x: number, y: number, color: string, n: number) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 40 + Math.random() * 170;
    s.particles.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 50,
      life: 0.45 + Math.random() * 0.45,
      max: 0.9,
      size: 1.4 + Math.random() * 2.4,
      color,
    });
  }
}

/** SSR-safe palette default (readPalette touches document; this is the fallback) */
function readPaletteSafe(): Palette {
  return { sand: "#ede6d6", granite: "#ab9f8b", pine: "#3e5c46", gold: "#c98f45", shadow: "#3c4049" };
}

/** hex (#rrggbb) + alpha 0..1 → rgba(); falls back through as-is for non-hex */
function hexA(hex: string, a: number) {
  const m = hex.replace("#", "");
  if (m.length < 6) return hex;
  const r = parseInt(m.slice(0, 2), 16);
  const gg = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r}, ${gg}, ${b}, ${a})`;
}
