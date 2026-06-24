"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * "Ascent" — a hidden climber. Dodge the rockfall and gain elevation from the
 * 4,000 ft valley floor to the 8,839 ft Half Dome summit. Bespoke <canvas>, on the
 * site palette (sand / granite / pine / golden), mono HUD. Lazy-loaded behind the
 * Konami code, so it never touches first-load JS. All game state lives in refs; the
 * live elevation is written straight to the DOM each frame (no per-frame React).
 */

const START_FT = 4000;
const SUMMIT_FT = 8839;
const KEY_BEST = "ascent.best.v1";

type Phase = "ready" | "playing" | "over" | "summit";

interface Rock {
  x: number;
  y: number;
  r: number;
  vy: number;
  spin: number;
  rot: number;
  verts: number[];
}

export default function AscentGame({ onClose }: { onClose: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const elevRef = useRef<HTMLSpanElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const [phase, setPhase] = useState<Phase>("ready");
  const [reached, setReached] = useState(START_FT);
  const [best, setBest] = useState(START_FT);

  // mutable game state (no React churn during play)
  const g = useRef({
    raf: 0,
    last: 0,
    w: 0,
    h: 0,
    dpr: 1,
    px: 0, // player x (css px)
    pv: 0, // player velocity
    target: -1, // pointer target x, -1 = none
    left: false,
    right: false,
    elev: START_FT,
    rocks: [] as Rock[],
    spawn: 0,
    t: 0,
    bgOffset: 0,
    phase: "ready" as Phase,
  });

  useEffect(() => {
    try {
      const b = Number(localStorage.getItem(KEY_BEST));
      if (Number.isFinite(b) && b > START_FT) setBest(b);
    } catch {}
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
    s.w = w;
    s.h = h;
    s.dpr = dpr;
    if (s.px === 0) s.px = w / 2;
  }, []);

  const draw = useCallback(() => {
    const cv = canvasRef.current;
    const ctx = cv?.getContext("2d");
    const s = g.current;
    if (!cv || !ctx) return;
    const css = (k: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(k).trim();
    const SAND = css("--color-sand") || "#ede6d6";
    const GRANITE = css("--color-granite-line") || "#ab9f8b";
    const PINE = css("--color-pine") || "#3e5c46";
    const GOLD = css("--color-golden") || "#c98f45";
    const SHADOW = css("--color-shadow") || "#3c4049";

    ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
    ctx.clearRect(0, 0, s.w, s.h);
    ctx.fillStyle = SAND;
    ctx.fillRect(0, 0, s.w, s.h);

    // golden summit glow grows as you near the top
    const prog = (s.elev - START_FT) / (SUMMIT_FT - START_FT);
    if (prog > 0.45) {
      const a = Math.min(0.22, (prog - 0.45) * 0.5);
      const grd = ctx.createLinearGradient(0, 0, 0, s.h * 0.5);
      grd.addColorStop(0, hexA(GOLD, a));
      grd.addColorStop(1, hexA(GOLD, 0));
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, s.w, s.h * 0.5);
    }

    // faint contour lines scrolling down (the climb)
    ctx.strokeStyle = hexA(GRANITE, 0.5);
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
        const x = Math.cos(ang) * rad;
        const y = Math.sin(ang) * rad;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = hexA(GRANITE, 0.92);
      ctx.fill();
      ctx.strokeStyle = hexA(SHADOW, 0.45);
      ctx.lineWidth = 1.25;
      ctx.stroke();
      ctx.restore();
    }

    // player — a pine climber chevron
    const py = s.h - 64;
    ctx.save();
    ctx.translate(s.px, py);
    ctx.fillStyle = PINE;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(10, 9);
    ctx.lineTo(0, 4);
    ctx.lineTo(-10, 9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }, []);

  const stop = useCallback(() => {
    cancelAnimationFrame(g.current.raf);
    g.current.raf = 0;
  }, []);

  const loop = useCallback(
    (t: number) => {
      const s = g.current;
      if (s.phase !== "playing") return;
      const dt = Math.min(0.05, s.last ? (t - s.last) / 1000 : 0.016);
      s.last = t;
      s.t += dt;

      const prog = (s.elev - START_FT) / (SUMMIT_FT - START_FT);
      // climb rate + difficulty ramp with elevation
      s.elev += (62 + prog * 26) * dt;
      s.bgOffset += (120 + prog * 90) * dt;

      // player movement
      const accel = 1500;
      const dir = (s.right ? 1 : 0) - (s.left ? 1 : 0);
      if (s.target >= 0) {
        s.pv = (s.target - s.px) * 9;
      } else {
        s.pv += dir * accel * dt;
        s.pv *= 0.86; // friction
      }
      s.px += s.pv * dt;
      const pad = 14;
      if (s.px < pad) { s.px = pad; s.pv = 0; }
      if (s.px > s.w - pad) { s.px = s.w - pad; s.pv = 0; }

      // spawn rockfall — denser, faster, and multiple rocks per drop the higher you climb
      s.spawn -= dt;
      const interval = Math.max(0.18, 0.66 - prog * 0.48);
      if (s.spawn <= 0) {
        s.spawn = interval * (0.6 + Math.random() * 0.45);
        const drops = 1 + (Math.random() < prog * 0.7 ? 1 : 0) + (Math.random() < prog * 0.4 ? 1 : 0);
        for (let d = 0; d < drops; d++) {
          const rad = 9 + Math.random() * 17;
          const verts = Array.from({ length: 9 }, () => 0.78 + Math.random() * 0.34);
          s.rocks.push({
            x: rad + Math.random() * (s.w - rad * 2),
            y: -rad - d * 42,
            r: rad,
            vy: 215 + prog * 350 + Math.random() * 90,
            spin: (Math.random() - 0.5) * 2.4,
            rot: 0,
            verts,
          });
        }
      }

      // update rocks + collision
      const py = s.h - 64;
      const pr = 9;
      for (let i = s.rocks.length - 1; i >= 0; i--) {
        const r = s.rocks[i];
        r.y += r.vy * dt;
        r.rot += r.spin * dt;
        if (r.y - r.r > s.h) {
          s.rocks.splice(i, 1);
          continue;
        }
        const dx = r.x - s.px;
        const dy = r.y - py;
        if (dx * dx + dy * dy < (r.r * 0.82 + pr) * (r.r * 0.82 + pr)) {
          end(false);
          return;
        }
      }

      if (elevRef.current) elevRef.current.textContent = Math.round(s.elev).toLocaleString("en-US");

      if (s.elev >= SUMMIT_FT) {
        s.elev = SUMMIT_FT;
        end(true);
        return;
      }

      draw();
      s.raf = requestAnimationFrame(loop);
    },
    [draw]
  );

  const end = useCallback((won: boolean) => {
    const s = g.current;
    stop();
    s.phase = won ? "summit" : "over";
    const final = Math.round(s.elev);
    setReached(final);
    setBest((b) => {
      const nb = Math.max(b, final);
      try { localStorage.setItem(KEY_BEST, String(nb)); } catch {}
      return nb;
    });
    setPhase(won ? "summit" : "over");
  }, [stop]);

  const start = useCallback(() => {
    const s = g.current;
    fit();
    s.elev = START_FT;
    s.rocks = [];
    s.spawn = 0.6;
    s.last = 0;
    s.t = 0;
    s.pv = 0;
    s.target = -1;
    s.px = s.w / 2;
    s.phase = "playing";
    setReached(START_FT);
    setPhase("playing");
    cancelAnimationFrame(s.raf);
    s.raf = requestAnimationFrame(loop);
  }, [fit, loop]);

  // input
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
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [onClose, start]);

  // pointer steering
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const s = g.current;
    const move = (e: PointerEvent) => {
      const rect = cv.getBoundingClientRect();
      s.target = e.clientX - rect.left;
    };
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

  // mount: size, focus, draw the ready frame; cleanup on unmount
  useEffect(() => {
    fit();
    draw();
    // preload the summit reward photo so the win reveal is instant
    const pre = new Image();
    pre.src = "/images/halfdome-summit.jpg";
    closeRef.current?.focus();
    const onResize = () => { fit(); if (g.current.phase !== "playing") draw(); };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(g.current.raf);
    };
  }, [fit, draw]);

  return (
    <div
      ref={wrapRef}
      role="dialog"
      aria-modal="true"
      aria-label="Ascent — a hidden climbing game"
      className="fixed inset-0 z-[100] flex flex-col bg-[var(--color-sand)]"
    >
      {/* clinical top bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-granite-line)] px-4 py-2.5 sm:px-6">
        <p className="label-mono tnum text-[var(--color-shadow)]">
          ASCENT · {START_FT.toLocaleString("en-US")} → {SUMMIT_FT.toLocaleString("en-US")} ft
        </p>
        <div className="flex items-center gap-4">
          <p className="label-mono tnum hidden sm:block">
            elev <span ref={elevRef} className="text-[var(--color-pine)]">{START_FT.toLocaleString("en-US")}</span> ft
            <span className="mx-2 text-[var(--color-granite-line)]">·</span>
            best {best.toLocaleString("en-US")}
          </p>
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

        {(phase === "ready" || phase === "over") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[color-mix(in_oklab,var(--color-sand)_72%,transparent)] px-8 text-center">
            <p className="text-rise font-display text-[var(--color-shadow)]">
              {phase === "ready" ? "Ascent" : "Rockfall."}
            </p>
            <p className="max-w-xs text-pretty leading-relaxed text-[var(--color-muted)]">
              {phase === "ready"
                ? "Climb from the valley floor to the Half Dome summit. Dodge the rockfall."
                : `You reached ${reached.toLocaleString("en-US")} ft. Best ${best.toLocaleString("en-US")} ft.`}
            </p>
            <button
              onClick={start}
              className="rounded-sm bg-[var(--color-pine)] px-5 py-2.5 font-body text-sm font-medium text-[var(--color-on-dark)] transition-colors hover:bg-[var(--color-pine-deep)]"
            >
              {phase === "ready" ? "Begin the climb" : "Climb again"}
            </button>
            <p className="label-mono">← → or A D to move · Esc to exit</p>
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
          {/* golden summit bloom */}
          <div
            className="summit-bloom pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(85% 55% at 50% 26%, color-mix(in oklab, var(--color-golden) 78%, transparent) 0%, transparent 60%)",
            }}
          />
          {/* legibility vignette */}
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
            <p className="label-mono tnum tracking-[0.14em] text-[var(--color-golden)]">
              8,839 FT · HALF DOME
            </p>
            <p className="text-ridge font-display text-[var(--color-on-dark)]">You reached the summit</p>
            <p className="max-w-sm text-pretty leading-relaxed text-[var(--color-on-dark-muted)]">
              Best {best.toLocaleString("en-US")} ft. The view earns the climb.
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

/** hex (#rrggbb) + alpha 0..1 → rgba(); falls back through as-is for non-hex */
function hexA(hex: string, a: number) {
  const m = hex.replace("#", "");
  if (m.length < 6) return hex;
  const r = parseInt(m.slice(0, 2), 16);
  const gg = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r}, ${gg}, ${b}, ${a})`;
}
