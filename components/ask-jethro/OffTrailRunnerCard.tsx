"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Off-Trail runner — the playable Easter egg shown when a visitor wanders off
 * the portfolio trail (an obviously off-topic ask; never calls Gemini). A tiny
 * Chrome-dino-style runner in the Yosemite / field-guide language: a hiker hops
 * over Half Dome silhouettes and ducks under birds while the route scrolls by.
 *
 * Performance: the simulation lives in refs and runs on a single rAF loop that
 * mutates SVG transforms imperatively — React state only changes on spawn /
 * despawn (a few times a second), score (via ref textContent, not state),
 * status, and best. Reduced motion shows a static map with the route-back
 * buttons and no game.
 */
type OffTrailAction = "projects" | "resume" | "ask" | "about";
type Status = "idle" | "running" | "over";
type Kind = "halfdome" | "bird";
interface Obstacle {
  id: number;
  type: Kind;
  x: number;
  h: number; // half dome height
  w: number; // half dome width
  y: number; // bird top
}

const H = 190; // game area height (px / svg units)
const GROUND_Y = 150;
const RUNNER_X = 34;
const RUNNER_W = 14;
const RUNNER_H = 22;
const GRAVITY = 2000; // px/s^2
const JUMP_V = 545; // px/s  -> peak ~74px, airtime ~0.55s
const START_SPEED = 152;
const MAX_SPEED = 330;
const ACCEL = 6.5; // px/s^2
const TILE = 22; // ground texture spacing
const WIN_SCORE = 100;

const pad = (n: number) => String(Math.max(0, Math.floor(n))).padStart(4, "0");

const DESTS: { key: OffTrailAction; label: string }[] = [
  { key: "projects", label: "View projects" },
  { key: "resume", label: "My resume" },
  { key: "ask", label: "Ask about Jethro" },
  { key: "about", label: "About" },
];

const btn =
  "inline-flex items-center rounded-sm border border-[var(--color-granite-line)] bg-[var(--color-sand)] px-2.5 py-1 text-[0.76rem] font-medium text-[var(--color-shadow)] transition-colors hover:border-[var(--color-pine)] hover:text-[var(--color-pine)]";

export function OffTrailRunnerCard({ onAction }: { onAction: (a: OffTrailAction) => void }) {
  const reduce = useReducedMotion();

  const [status, setStatusState] = useState<Status>("idle");
  const [obstacleList, setObstacleList] = useState<Obstacle[]>([]);
  const [best, setBest] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [won, setWon] = useState(false);
  const [worldW, setWorldW] = useState(360);

  // refs: fast-changing game state + DOM handles
  const areaRef = useRef<HTMLDivElement>(null);
  const runnerRef = useRef<SVGGElement>(null);
  const groundTexRef = useRef<SVGGElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const elMap = useRef(new Map<number, SVGGElement>());
  const worldWRef = useRef(360);
  const idRef = useRef(1);
  const visibleRef = useRef(true);
  const wonTimer = useRef<number | null>(null);

  const g = useRef({
    status: "idle" as Status,
    jump: 0, // height above ground
    vy: 0,
    onGround: true,
    speed: START_SPEED,
    scoreAcc: 0,
    score: 0,
    obstacles: [] as Obstacle[],
    spawnIn: 1.1,
    groundOffset: 0,
    elapsed: 0,
    won: false,
  });

  const setStatus = useCallback((s: Status) => {
    g.current.status = s;
    setStatusState(s);
  }, []);

  const regObstacle = useCallback((id: number, el: SVGGElement | null) => {
    if (el) elMap.current.set(id, el);
    else elMap.current.delete(id);
  }, []);

  const resetGame = useCallback(() => {
    const c = g.current;
    c.jump = 0;
    c.vy = 0;
    c.onGround = true;
    c.speed = START_SPEED;
    c.scoreAcc = 0;
    c.score = 0;
    c.obstacles = [];
    c.spawnIn = 1.1;
    c.groundOffset = 0;
    c.elapsed = 0;
    c.won = false;
    setObstacleList([]);
    setWon(false);
    if (scoreRef.current) scoreRef.current.textContent = "0000";
  }, []);

  const start = useCallback(() => {
    resetGame();
    setStatus("running");
  }, [resetGame, setStatus]);

  const jump = useCallback(() => {
    const c = g.current;
    if (c.onGround) {
      c.vy = JUMP_V;
      c.onGround = false;
    }
  }, []);

  const onInput = useCallback(() => {
    const s = g.current.status;
    if (s === "running") jump();
    else start();
  }, [jump, start]);

  // measure width so the game runs in real pixels (no viewBox distortion)
  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const measure = () => {
      const w = Math.round(el.clientWidth);
      if (w > 0) {
        worldWRef.current = w;
        setWorldW(w);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // best score from localStorage (client only)
  useEffect(() => {
    try {
      const b = Number(window.localStorage.getItem("offtrail.best") || "0");
      if (Number.isFinite(b) && b > 0) setBest(b);
    } catch {
      /* ignore */
    }
  }, []);

  // pause the loop when the card is scrolled out of view
  useEffect(() => {
    const el = areaRef.current;
    if (!el || reduce) return;
    const io = new IntersectionObserver(([e]) => (visibleRef.current = e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  // the single game loop
  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    let last = 0;

    const spawn = () => {
      const c = g.current;
      const w = worldWRef.current;
      // birds only once it's warmed up; otherwise Half Dome
      const bird = c.score > 28 && Math.random() < 0.34;
      const id = idRef.current++;
      if (bird) {
        const high = Math.random() < 0.55;
        const y = high ? 90 + Math.random() * 12 : 120 + Math.random() * 10;
        c.obstacles.push({ id, type: "bird", x: w + 8, h: 0, w: 16, y });
      } else {
        const h = 28 + Math.random() * 14;
        c.obstacles.push({ id, type: "halfdome", x: w + 8, h, w: h * 1.05, y: 0 });
      }
      setObstacleList(c.obstacles.slice());
    };

    const collide = (c: typeof g.current) => {
      const rx = RUNNER_X + 2;
      const rw = RUNNER_W - 5;
      const ry = GROUND_Y - RUNNER_H - c.jump + 2;
      const rh = RUNNER_H - 4;
      for (const o of c.obstacles) {
        let ox: number, oy: number, ow: number, oh: number;
        if (o.type === "halfdome") {
          ox = o.x + 2;
          ow = o.w - 5;
          oy = GROUND_Y - o.h + 2;
          oh = o.h - 2;
        } else {
          ox = o.x + 2;
          ow = 12;
          oy = o.y + 1;
          oh = 7;
        }
        if (rx < ox + ow && rx + rw > ox && ry < oy + oh && ry + rh > oy) return true;
      }
      return false;
    };

    const draw = () => {
      const c = g.current;
      runnerRef.current?.setAttribute("transform", `translate(${RUNNER_X} ${GROUND_Y - RUNNER_H - c.jump})`);
      groundTexRef.current?.setAttribute("transform", `translate(${c.groundOffset.toFixed(2)} 0)`);
      for (const o of c.obstacles) {
        const el = elMap.current.get(o.id);
        if (el) {
          const y = o.type === "halfdome" ? GROUND_Y - o.h : o.y;
          el.setAttribute("transform", `translate(${o.x.toFixed(2)} ${y.toFixed(2)})`);
        }
      }
    };

    const loop = (t: number) => {
      if (!last) last = t;
      let dt = (t - last) / 1000;
      last = t;
      if (!visibleRef.current) {
        raf = requestAnimationFrame(loop);
        return;
      }
      if (dt > 0.05) dt = 0.05; // clamp after tab/scroll stalls

      const c = g.current;
      if (c.status === "running") {
        c.elapsed += dt;
        c.speed = Math.min(MAX_SPEED, START_SPEED + c.elapsed * ACCEL);

        if (!c.onGround) {
          c.vy -= GRAVITY * dt;
          c.jump += c.vy * dt;
          if (c.jump <= 0) {
            c.jump = 0;
            c.vy = 0;
            c.onGround = true;
          }
        }

        c.groundOffset = ((c.groundOffset - c.speed * dt) % TILE);

        let changed = false;
        c.spawnIn -= dt;
        if (c.spawnIn <= 0) {
          spawn();
          c.spawnIn = Math.max(0.74, (200 + Math.random() * 130) / c.speed);
          changed = true;
        }
        for (const o of c.obstacles) o.x -= c.speed * dt;
        if (c.obstacles.some((o) => o.x < -70)) {
          c.obstacles = c.obstacles.filter((o) => o.x >= -70);
          changed = true;
        }
        if (changed) setObstacleList(c.obstacles.slice());

        c.scoreAcc += c.speed * dt;
        const sc = Math.floor(c.scoreAcc / 14);
        if (sc !== c.score) {
          c.score = sc;
          if (scoreRef.current) scoreRef.current.textContent = pad(sc);
          if (sc >= WIN_SCORE && !c.won) {
            c.won = true;
            setWon(true);
            if (wonTimer.current) window.clearTimeout(wonTimer.current);
            wonTimer.current = window.setTimeout(() => setWon(false), 1700);
          }
        }

        if (collide(c)) {
          const final = c.score;
          setFinalScore(final);
          setBest((b) => {
            const nb = Math.max(b, final);
            try {
              window.localStorage.setItem("offtrail.best", String(nb));
            } catch {
              /* ignore */
            }
            return nb;
          });
          setStatus("over");
        }
      }

      draw();
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      if (wonTimer.current) window.clearTimeout(wonTimer.current);
    };
  }, [reduce, setStatus]);

  // focus the game so Space starts it immediately (scoped to this element). The
  // card is the response to the user's submit, so grabbing focus is intended and
  // never traps. A short delay wins the race with the composer keeping focus.
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

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.code === "Space" || e.key === " ") {
      e.preventDefault();
      onInput();
    }
  };
  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    areaRef.current?.focus({ preventScroll: true });
    onInput();
  };

  const instruction =
    status === "running" ? "Space / tap to jump" : status === "over" ? "Press Space to try again" : "Press Space to start";

  /* ---------- reduced motion: static map, no game ---------- */
  if (reduce) {
    return (
      <div className="overflow-hidden rounded-md rounded-tl-xs border border-[var(--color-granite-line)] bg-[var(--color-card)]">
        <div className="flex items-center justify-between border-b border-[var(--color-granite-line)] bg-[var(--color-sand)] px-4 py-2">
          <span className="label-mono text-[0.6rem] text-[var(--color-pine)]">off trail</span>
        </div>
        <div className="bg-[var(--color-sand)] px-4">
          <StaticScene worldW={worldW} />
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

  /* ---------- the game ---------- */
  return (
    <div className="overflow-hidden rounded-md rounded-tl-xs border border-[var(--color-granite-line)] bg-[var(--color-card)]">
      {/* header: label + score / best */}
      <div className="flex items-center justify-between border-b border-[var(--color-granite-line)] bg-[var(--color-sand)] px-4 py-2">
        <span className="label-mono text-[0.6rem] text-[var(--color-pine)]">off trail</span>
        <span className="label-mono tnum text-[0.6rem] text-[var(--color-muted)]">
          score <span ref={scoreRef} className="text-[var(--color-shadow)]">0000</span>
          <span className="px-1.5 text-[var(--color-granite-line)]">·</span>
          best {pad(best)}
        </span>
      </div>

      {/* game area */}
      <div
        ref={areaRef}
        tabIndex={0}
        role="application"
        aria-label="Off-trail runner game. Press Space or tap to jump."
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        className="relative cursor-pointer select-none bg-[var(--color-sand)] outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--color-pine)]"
        style={{ height: H, touchAction: "manipulation" }}
      >
        <svg viewBox={`0 0 ${worldW} ${H}`} width="100%" height={H} preserveAspectRatio="xMidYMid meet" className="block">
          {/* topo contour hints */}
          <g fill="none" stroke="var(--color-granite-line)" strokeWidth="1" opacity="0.4">
            <path d={`M0 34 C ${worldW * 0.3} 26, ${worldW * 0.62} 30, ${worldW} 22`} />
            <path d={`M0 62 C ${worldW * 0.32} 56, ${worldW * 0.6} 58, ${worldW} 52`} />
          </g>

          {/* ground line — pulses gold on a win */}
          <line
            x1="0"
            y1={GROUND_Y}
            x2={worldW}
            y2={GROUND_Y}
            stroke={won ? "var(--color-golden)" : "var(--color-granite-line)"}
            strokeWidth="1.5"
          />
          {/* scrolling ground texture */}
          <g ref={groundTexRef}>
            {Array.from({ length: Math.ceil(worldW / TILE) + 3 }).map((_, i) => (
              <line
                key={i}
                x1={i * TILE}
                y1={GROUND_Y + 4}
                x2={i * TILE - 4}
                y2={GROUND_Y + 9}
                stroke="var(--color-granite-line)"
                strokeWidth="1"
                opacity="0.5"
              />
            ))}
          </g>

          {/* obstacles (positioned imperatively per frame) */}
          {obstacleList.map((o) => (
            <g key={o.id} ref={(el) => regObstacle(o.id, el)}>
              {o.type === "halfdome" ? <HalfDome h={o.h} /> : <Bird />}
            </g>
          ))}

          {/* the runner */}
          <Runner innerRef={runnerRef} />
        </svg>

        {/* center overlay: state messages */}
        {status !== "running" && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
            {status === "over" && (
              <p className="label-mono text-[0.66rem] text-[var(--color-pine)]">off trail · score {pad(finalScore)}</p>
            )}
            <p className="font-display text-[1rem] font-medium text-[var(--color-shadow)]">
              {status === "over" ? "Press Space to try again" : "Press Space to find the trail."}
            </p>
          </div>
        )}
        {won && (
          <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
            <span className="label-mono rounded-full border border-[var(--color-golden)] bg-[var(--color-card)] px-2.5 py-0.5 text-[0.6rem] text-[var(--color-golden-deep)]">
              back on trail
            </span>
          </div>
        )}
      </div>

      {/* footer: instruction + route-back buttons */}
      <div className="px-4 py-3">
        <p className="label-mono text-[0.6rem] text-[var(--color-muted)]">{instruction}</p>
        <RouteButtons onAction={onAction} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  pieces                                                            */
/* ------------------------------------------------------------------ */

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

function Runner({ innerRef }: { innerRef: React.Ref<SVGGElement> }) {
  return (
    <g ref={innerRef} transform={`translate(${RUNNER_X} ${GROUND_Y - RUNNER_H})`}>
      <g stroke="var(--color-shadow)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="7" cy="4" r="3" fill="var(--color-golden)" strokeWidth="1.2" />
        <path d="M7 7 L7 14" />
        <path d="M7 14 L3 21" />
        <path d="M7 14 L11 20" />
        <path d="M7 9.5 L12 12" />
        <path d="M7 9.5 L2.5 11.5" />
      </g>
    </g>
  );
}

function HalfDome({ h }: { h: number }) {
  const w = h * 1.05;
  const d = `M2 ${h.toFixed(1)} L2 ${(h * 0.52).toFixed(1)} C ${(w * 0.12).toFixed(1)} ${(h * 0.16).toFixed(1)}, ${(w * 0.46).toFixed(1)} 0, ${(w * 0.7).toFixed(1)} ${(h * 0.1).toFixed(1)} L ${(w - 2).toFixed(1)} ${(h * 0.3).toFixed(1)} L ${(w - 2).toFixed(1)} ${h.toFixed(1)} Z`;
  return (
    <path
      d={d}
      fill="color-mix(in oklab, var(--color-pine) 9%, transparent)"
      stroke="var(--color-pine)"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  );
}

function Bird() {
  return (
    <g fill="none" stroke="var(--color-pine)" strokeWidth="1.3" strokeLinecap="round">
      <path d="M0 5 Q 4.5 0.5 8 4" />
      <path d="M8 4 Q 11.5 0.5 16 5" />
    </g>
  );
}

/* static scene for reduced motion */
function StaticScene({ worldW }: { worldW: number }) {
  return (
    <svg viewBox={`0 0 ${worldW} ${H}`} width="100%" height={H} preserveAspectRatio="xMidYMid meet" className="block" aria-hidden>
      <g fill="none" stroke="var(--color-granite-line)" strokeWidth="1" opacity="0.4">
        <path d={`M0 34 C ${worldW * 0.3} 26, ${worldW * 0.62} 30, ${worldW} 22`} />
        <path d={`M0 62 C ${worldW * 0.32} 56, ${worldW * 0.6} 58, ${worldW} 52`} />
      </g>
      <line x1="0" y1={GROUND_Y} x2={worldW} y2={GROUND_Y} stroke="var(--color-granite-line)" strokeWidth="1.5" />
      <g transform={`translate(${worldW * 0.62} ${GROUND_Y - 38})`}>
        <HalfDome h={38} />
      </g>
      <Runner innerRef={null} />
    </svg>
  );
}
