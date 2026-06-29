"use client";

/* ============================================================
   InteriorRoom  ·  walk-into-a-building interior (replaces the modal)
   Entering any of the 7 buildings (landmark:enter) teleports the player
   into that district's room: the full info is the backdrop (crisp DOM,
   reused from content/portfolio), and you walk a little hiker ALL OVER it
   — WASD / arrows / tap — then step through the door to return to the
   village. Rendered full-screen over the paused village; the door (or the
   top-left button, or ESC) emits game:resume and unmounts.

   The character is a CSS spritesheet sprite driven by a single rAF loop
   that writes transforms directly to the DOM (no per-frame React renders),
   with the scroll container following it like a camera.
   ============================================================ */

import { useCallback, useEffect, useRef, useState } from "react";
import { gameBus } from "@/lib/gameBus";
import { landmarkById, projectsForLandmark, type Landmark } from "@/content/portfolio";
import { ResumeSheet } from "./ResumeSheet";

const SHEET = "/game/ninja-adventure/sprites/hunter.png";
const SCALE = 3;
const FRAME = 16;
const SIZE = FRAME * SCALE; // 48px on-screen character
const SHEET_W = 64 * SCALE;
const SHEET_H = 112 * SCALE;
const DIR_ROW: Record<string, number> = { down: 0, up: 1, left: 2, right: 3 };
const SPEED = 230; // px/s
const DOOR_Y = 64; // door centre, from the top of the world
const SPAWN_Y = 250; // hiker starts below the header, clear of the title + door

export function InteriorRoom() {
  const [landmark, setLandmark] = useState<Landmark | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const charRef = useRef<HTMLDivElement>(null);

  const pos = useRef({ x: 0, y: SPAWN_Y });
  const target = useRef<{ x: number; y: number } | null>(null);
  const keys = useRef<Record<string, boolean>>({});
  const dir = useRef("down");
  const frame = useRef(0);
  const frameT = useRef(0);

  useEffect(
    () =>
      gameBus.on("landmark:enter", ({ id }) => {
        const l = landmarkById(id);
        if (!l) return;
        setLandmark(l);
        gameBus.emit("game:pause");
      }),
    []
  );

  const close = useCallback(() => {
    setLandmark(null);
    gameBus.emit("game:resume");
  }, []);

  useEffect(() => {
    if (!landmark) return;
    const scroller = scrollRef.current;
    const world = worldRef.current;
    const ch = charRef.current;
    if (!scroller || !world || !ch) return;

    pos.current = { x: scroller.clientWidth / 2, y: SPAWN_Y };
    target.current = null;
    keys.current = {};
    dir.current = "down";
    frame.current = 0;

    const MOVE = ["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"];
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      const k = e.key.toLowerCase();
      if (MOVE.includes(k)) {
        keys.current[k] = true;
        target.current = null;
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    const onPointer = (e: PointerEvent) => {
      const r = world.getBoundingClientRect();
      target.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    scroller.addEventListener("pointerdown", onPointer);

    // per-run flag + local raf id: StrictMode-safe (run1's cleanup flips its own
    // `alive`, so run1's loop stops; run2 owns a fresh flag and keeps ticking)
    let alive = true;
    let rafId = 0;
    let last = performance.now();
    const loop = (t: number) => {
      if (!alive) return;
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const w = worldRef.current;
      const sc = scrollRef.current;
      const c = charRef.current;
      if (!w || !sc || !c) {
        rafId = requestAnimationFrame(loop);
        return;
      }
      let vx = 0;
      let vy = 0;
      const K = keys.current;
      if (K["a"] || K["arrowleft"]) vx -= 1;
      if (K["d"] || K["arrowright"]) vx += 1;
      if (K["w"] || K["arrowup"]) vy -= 1;
      if (K["s"] || K["arrowdown"]) vy += 1;
      if (!vx && !vy && target.current) {
        const dx = target.current.x - pos.current.x;
        const dy = target.current.y - pos.current.y;
        const d = Math.hypot(dx, dy);
        if (d > 5) {
          vx = dx / d;
          vy = dy / d;
        } else target.current = null;
      }
      const moving = !!(vx || vy);
      const len = Math.hypot(vx, vy) || 1;
      pos.current.x += (vx / len) * SPEED * dt;
      pos.current.y += (vy / len) * SPEED * dt;
      const maxX = w.clientWidth - SIZE / 2;
      const maxY = Math.max(w.clientHeight, sc.clientHeight) - SIZE / 2;
      pos.current.x = Math.max(SIZE / 2, Math.min(maxX, pos.current.x));
      pos.current.y = Math.max(SIZE / 2, Math.min(maxY, pos.current.y));

      if (moving) {
        if (Math.abs(vx) > Math.abs(vy)) dir.current = vx < 0 ? "left" : "right";
        else dir.current = vy < 0 ? "up" : "down";
        frameT.current += dt;
        if (frameT.current > 0.12) {
          frameT.current = 0;
          frame.current = (frame.current + 1) % 4;
        }
      } else frame.current = 0;

      c.style.transform = `translate(${pos.current.x - SIZE / 2}px, ${pos.current.y - SIZE / 2}px)`;
      c.style.backgroundPosition = `${-frame.current * SIZE}px ${-DIR_ROW[dir.current] * SIZE}px`;

      sc.scrollTop = pos.current.y - sc.clientHeight / 2;

      // door proximity (centre-top of the world)
      const dxd = pos.current.x - w.clientWidth / 2;
      const dyd = pos.current.y - DOOR_Y;
      if (Math.hypot(dxd, dyd) < 46) {
        close();
        return;
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      alive = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      scroller.removeEventListener("pointerdown", onPointer);
    };
  }, [landmark, close]);

  if (!landmark) return null;
  const projects = projectsForLandmark(landmark);

  return (
    <div className="fixed inset-0 z-50">
      {/* the room: scroll container = camera; world = the walkable hall */}
      <div
        ref={scrollRef}
        className="no-scrollbar absolute inset-0 touch-none overflow-y-auto overflow-x-hidden"
        style={{
          background:
            "repeating-linear-gradient(90deg,#3a2c1e 0px,#3a2c1e 46px,#352719 46px,#352719 48px),#3a2c1e",
        }}
      >
        <div ref={worldRef} className="relative mx-auto w-full" style={{ minHeight: "100%" }}>
          {/* door home, centre-top */}
          <button
            type="button"
            onClick={close}
            aria-label="Back to the village"
            className="fast-ui absolute left-1/2 top-2 z-[40] flex -translate-x-1/2 flex-col items-center gap-1"
          >
            <span
              className="block rounded-t-md border-2 border-[#2a1d10]"
              style={{
                width: 44,
                height: 56,
                background: "linear-gradient(#7a5a32,#5c4326)",
                boxShadow: "inset 0 0 0 4px #6b4f2e, inset 0 -6px 0 #4a3620",
              }}
            >
              <span
                className="mt-3 block h-9 w-7 translate-x-1/2 rounded-sm"
                style={{ background: "#43301c", boxShadow: "1px 4px 0 #2a1d10 inset" }}
              />
            </span>
            <span className="label-mono rounded-sm bg-[color-mix(in_oklab,#1a120a_72%,transparent)] px-2 py-0.5 text-[0.6rem] text-[var(--color-card)]">
              ← back to the village
            </span>
          </button>

          {/* the building's info — the backdrop you walk all over */}
          <div className="relative z-[20] mx-auto w-full max-w-2xl px-5 pb-40 pt-32">
            <header className="flex items-start gap-3">
              {landmark.faceset && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={landmark.faceset}
                  alt=""
                  width={44}
                  height={44}
                  className="size-12 shrink-0 rounded-sm border border-[#5c4326]"
                  style={{ imageRendering: "pixelated" }}
                />
              )}
              <div>
                <span className="eyebrow text-[var(--color-golden)]">{landmark.section}</span>
                <h2 className="text-rise mt-0.5 text-[var(--color-card)]">{landmark.title}</h2>
                <p className="label-mono text-[0.66rem] text-[var(--color-on-dark-muted)]">
                  {landmark.landmark}
                </p>
              </div>
            </header>

            {landmark.authoredLine && (
              <p className="mt-6 rounded-sm border border-dashed border-[var(--color-golden)] bg-[color-mix(in_oklab,var(--color-golden)_12%,transparent)] p-3 text-[0.86rem] italic text-[var(--color-card)]">
                <span className="label-mono not-italic text-[var(--color-golden)]">
                  Draft · Jethro to author —
                </span>{" "}
                {landmark.authoredLine.replace(/^JETHRO:\s*/, "")}
              </p>
            )}

            <div className="mt-6 space-y-5">
              {landmark.body.map((para, i) => (
                <p
                  key={i}
                  className="rounded-md bg-[color-mix(in_oklab,var(--color-card)_96%,transparent)] p-4 text-[0.95rem] leading-relaxed text-[var(--color-shadow)] shadow-md"
                >
                  {para}
                </p>
              ))}
            </div>

            {landmark.resumeSheet && (
              <div className="mt-6 rounded-md bg-[var(--color-card)] p-5 text-[var(--color-shadow)] shadow-md">
                <ResumeSheet />
              </div>
            )}

            {projects.length > 0 && (
              <ul className="mt-6 space-y-4">
                {projects.map((proj) => (
                  <li
                    key={proj.id}
                    className="rounded-md bg-[var(--color-card)] p-4 text-[var(--color-shadow)] shadow-md"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-display text-[1.05rem] font-medium">{proj.title}</span>
                      {proj.link && (
                        <a
                          href={proj.link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="label-mono shrink-0 text-[0.68rem] text-[var(--color-pine)] underline underline-offset-2"
                        >
                          {proj.link.label}
                        </a>
                      )}
                    </div>
                    <p className="mt-1 text-[0.85rem] leading-snug text-[var(--color-muted)]">
                      {proj.summary}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {landmark.links && landmark.links.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {landmark.links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    target={l.href.startsWith("http") ? "_blank" : undefined}
                    rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="fast-ui rounded-sm border border-[var(--color-golden)] px-3 py-1.5 text-[0.82rem] font-medium text-[var(--color-card)] hover:bg-[var(--color-golden)] hover:text-[#2a1d10]"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* the hiker — walks over everything */}
          <div
            ref={charRef}
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 z-[30]"
            style={{
              width: SIZE,
              height: SIZE,
              backgroundImage: `url(${SHEET})`,
              backgroundSize: `${SHEET_W}px ${SHEET_H}px`,
              imageRendering: "pixelated",
              willChange: "transform",
              filter: "drop-shadow(0 3px 2px rgba(0,0,0,0.45))",
            }}
          />
        </div>
      </div>

      {/* fixed chrome */}
      <button
        type="button"
        onClick={close}
        className="fast-ui label-mono fixed left-3 top-3 z-[55] rounded-sm bg-[color-mix(in_oklab,#1a120a_80%,transparent)] px-3 py-2 text-[0.74rem] text-[var(--color-card)]"
      >
        ← Back to the village
      </button>
      <div className="pointer-events-none fixed bottom-3 left-1/2 z-[55] -translate-x-1/2">
        <span className="label-mono rounded-sm bg-[color-mix(in_oklab,#1a120a_72%,transparent)] px-3 py-1.5 text-[0.66rem] text-[var(--color-card)]">
          WASD / arrows or tap to walk · reach the door to head back
        </span>
      </div>
    </div>
  );
}
