"use client";

/* ============================================================
   InteriorRoom  ·  walk-into-a-building interior (replaces the modal)
   Entering any of the 7 buildings (landmark:enter) teleports the player
   into that district's room: the full info is the backdrop (crisp DOM,
   reused from content/portfolio), and you walk a little hiker ALL OVER it
   — WASD / arrows / tap — then step through the door to return to the
   village. Rendered full-screen over the paused village.

   It is a proper dialog: role=dialog + aria-modal + aria-labelledby, focus
   moves in on open and restores on close, Tab is trapped, ESC / the door /
   the back button all close. prefers-reduced-motion freezes the walk-cycle.
   The character is a CSS spritesheet sprite driven by one rAF loop that
   writes transforms directly to the DOM (no per-frame React renders), with
   the scroll container following it like a camera.
   ============================================================ */

import { useCallback, useEffect, useRef, useState } from "react";
import { gameBus } from "@/lib/gameBus";
import { landmarkById, projectsForLandmark, type Landmark } from "@/content/portfolio";
import { Joystick } from "@/components/HUD/Joystick";
import { useIsTouch } from "@/lib/useIsTouch";
import { ResumeSheet } from "./ResumeSheet";

// Player ("Jethro"): a horizontal strip of 5 frames (idle, walk1..walk4),
// front-facing only — we flip horizontally for left, and reuse the forward
// frames for up/right/down. See public/game/jethro/player.png.
const SHEET = "/game/jethro/player.png";
const PFW = 16; // native frame width
const PFH = 32; // native frame height
const SCALE = 2;
const CW = PFW * SCALE; // on-screen character width
const CH = PFH * SCALE; // on-screen character height
const SHEET_W = PFW * 5 * SCALE; // 5 frames wide
const SHEET_H = PFH * SCALE;
const SPEED = 460; // 2x walk speed (px/s) — quick to traverse every interior room
const DOOR_Y = 64; // door centre, from the top of the world
const SPAWN_Y = 250; // hiker starts below the header, clear of the title + door
const TITLE_ID = "interior-room-title";

/* ---- per-room identity: each district reads as its own place ----
   The walls + header inks change per building; the content components
   (cream cards, mono facts, tag chips) stay one shared system so the
   rooms feel related, not disjointed. All header inks are AA on their
   own wall (the light clinical plaster and the overlook sky flip to
   dark ink; dark wood rooms keep cream + golden). */
interface RoomTheme {
  wall: string; // CSS background for the whole room
  headerInk: string; // title on the wall
  eyebrow: string; // section eyebrow on the wall
  subInk: string; // landmark sub-label on the wall
  titleShadow?: string;
}
const DEFAULT_THEME: RoomTheme = {
  // the original warm cabin planks (About keeps this exactly)
  wall: "repeating-linear-gradient(90deg,#3a2c1e 0px,#3a2c1e 46px,#352719 46px,#352719 48px),#3a2c1e",
  headerInk: "var(--color-card)",
  eyebrow: "var(--color-golden)",
  subInk: "var(--color-on-dark-muted)",
};
const THEMES: Record<string, Partial<RoomTheme>> = {
  // Clinical — the healer's station: whitewashed boards, calm and clean
  chapel: {
    wall: "repeating-linear-gradient(90deg,#eae6d7 0px,#eae6d7 46px,#e2ddcc 46px,#e2ddcc 48px),#eae6d7",
    headerInk: "var(--color-shadow)",
    eyebrow: "var(--color-pine-deep)",
    subInk: "var(--color-muted)",
  },
  // Projects — the builder's workshop: horizontal planks, a shade deeper
  cabins: {
    wall: "repeating-linear-gradient(0deg,#33261a 0px,#33261a 44px,#2d2117 44px,#2d2117 46px),#33261a",
  },
  // Under the hood — the machine room: cool slate boards behind the wood town
  ahwahnee: {
    wall: "repeating-linear-gradient(90deg,#2c2e35 0px,#2c2e35 46px,#26282e 46px,#26282e 48px),#2c2e35",
  },
  // Contact — the post office: lighter cedar
  "ranger-station": {
    wall: "repeating-linear-gradient(90deg,#4a3620 0px,#4a3620 46px,#432f1c 46px,#432f1c 48px),#4a3620",
  },
  // The overlook — no walls at all: dusk over the valley
  "glacier-point": {
    wall: "linear-gradient(180deg,#26445f 0%,#3e72a6 34%,#7d95a8 55%,#e0a86b 78%,#d98c6a 100%)",
    headerInk: "#f7f2e7",
    eyebrow: "#0e2233",
    subInk: "#122f47",
    titleShadow: "0 2px 8px rgba(10,20,30,0.55)",
  },
};

export function InteriorRoom() {
  const [landmark, setLandmark] = useState<Landmark | null>(null);
  const touch = useIsTouch();

  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const charRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const closing = useRef(false);

  const pos = useRef({ x: 0, y: SPAWN_Y });
  const target = useRef<{ x: number; y: number } | null>(null);
  const joy = useRef({ x: 0, y: 0 }); // on-screen joystick vector (touch)
  const keys = useRef<Record<string, boolean>>({});
  const dir = useRef("down");
  const frame = useRef(0);
  const frameT = useRef(0);

  useEffect(
    () =>
      gameBus.on("landmark:enter", ({ id }) => {
        const l = landmarkById(id);
        if (!l) return;
        lastFocus.current = document.activeElement as HTMLElement;
        setLandmark(l);
        gameBus.emit("game:pause");
      }),
    []
  );

  // Play the exit teleport veil first, then actually leave once it has covered
  // the screen — so the room→village swap is hidden behind the flash.
  const close = useCallback(() => {
    if (closing.current) return; // guard against double-close (ESC + door, etc.)
    closing.current = true;
    gameBus.emit("room:exit"); // veil starts covering
    window.setTimeout(() => {
      setLandmark(null);
      gameBus.emit("game:resume");
      lastFocus.current?.focus?.();
    }, 160); // ~when the veil is fully covering (see RoomTransition timing)
  }, []);

  useEffect(() => {
    if (!landmark) return;
    closing.current = false; // fresh room open; re-arm the exit guard
    const scroller = scrollRef.current;
    const world = worldRef.current;
    const ch = charRef.current;
    if (!scroller || !world || !ch) return;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    pos.current = { x: scroller.clientWidth / 2, y: SPAWN_Y };
    target.current = null;
    joy.current = { x: 0, y: 0 };
    keys.current = {};
    dir.current = "down";
    frame.current = 0;
    // paint the hiker at spawn synchronously so it never flashes at (0,0)
    ch.style.transform = `translate(${pos.current.x - CW / 2}px, ${SPAWN_Y - CH / 2}px)`;
    ch.style.backgroundPosition = "0px 0px"; // idle frame (column 0)

    // move focus into the room (a11y); restored in close()
    backRef.current?.focus();

    const MOVE = ["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"];
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "Tab" && rootRef.current) {
        const f = rootRef.current.querySelectorAll<HTMLElement>(
          'a[href], button, [tabindex]:not([tabindex="-1"])'
        );
        if (f.length) {
          const first = f[0];
          const lastEl = f[f.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            lastEl.focus();
          } else if (!e.shiftKey && document.activeElement === lastEl) {
            e.preventDefault();
            first.focus();
          }
        }
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
      // a tap on a link/button follows it — don't also send the hiker walking
      if ((e.target as HTMLElement)?.closest("a, button")) return;
      const r = world.getBoundingClientRect();
      target.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    let last = performance.now();
    const onVisible = () => {
      if (!document.hidden) last = performance.now(); // no dt spike after a hidden stretch
    };
    // on-screen joystick (touch): analog move vector; a push cancels a tap-walk
    const offJoy = gameBus.on("valley:move", (v) => {
      joy.current = v;
      if (v.x !== 0 || v.y !== 0) target.current = null;
    });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    scroller.addEventListener("pointerdown", onPointer);
    document.addEventListener("visibilitychange", onVisible);

    // per-run flag + local raf id: StrictMode-safe (run1's cleanup flips its own
    // `alive`, so run1's loop stops; run2 owns a fresh flag and keeps ticking)
    let alive = true;
    let rafId = 0;
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
      // on-screen joystick (touch): analog direction when the keyboard is idle
      if (!vx && !vy && (joy.current.x !== 0 || joy.current.y !== 0)) {
        vx = joy.current.x;
        vy = joy.current.y;
      }
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
      const maxX = w.clientWidth - CW / 2;
      const maxY = Math.max(w.clientHeight, sc.clientHeight) - CH / 2;
      pos.current.x = Math.max(CW / 2, Math.min(maxX, pos.current.x));
      pos.current.y = Math.max(CH / 2, Math.min(maxY, pos.current.y));

      if (moving) {
        if (Math.abs(vx) > Math.abs(vy)) dir.current = vx < 0 ? "left" : "right";
        else dir.current = vy < 0 ? "up" : "down";
        if (!reduce) {
          frameT.current += dt;
          if (frameT.current > 0.12) {
            frameT.current = 0;
            frame.current = (frame.current + 1) % 4;
          }
        }
      } else frame.current = 0;

      // front-only art: column 0 = idle, 1..4 = walk; mirror for left
      const col = moving ? 1 + (frame.current % 4) : 0;
      const flip = dir.current === "left" ? " scaleX(-1)" : "";
      c.style.transform = `translate(${pos.current.x - CW / 2}px, ${pos.current.y - CH / 2}px)${flip}`;
      c.style.backgroundPosition = `${-col * CW}px 0px`;

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
      offJoy();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      scroller.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [landmark, close]);

  if (!landmark) return null;
  const projects = projectsForLandmark(landmark);
  const theme: RoomTheme = { ...DEFAULT_THEME, ...(THEMES[landmark.id] ?? {}) };
  const overlook = landmark.id === "glacier-point";
  const postOffice = landmark.id === "ranger-station";
  // short landmarks (Contact, Overlook) would dangle at the top of a tall empty
  // room — centre their content vertically so the room reads as intentional
  const isShort =
    !landmark.resumeSheet && projects.length === 0 && !landmark.facts && landmark.body.length <= 2;

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={TITLE_ID}
      className="room-warp-in fixed inset-0 z-50"
    >
      {/* the room: scroll container = camera; world = the walkable hall */}
      <div
        ref={scrollRef}
        className="no-scrollbar absolute inset-0 touch-none overflow-y-auto overflow-x-hidden"
        style={{ background: theme.wall }}
      >
        <div
          ref={worldRef}
          className={`relative mx-auto w-full ${isShort ? "flex items-center justify-center" : ""}`}
          style={{ minHeight: "100%" }}
        >
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
            <span className="label-mono rounded-sm bg-[color-mix(in_oklab,#1a120a_88%,transparent)] px-2 py-0.5 text-[0.6rem] text-[var(--color-card)]!">
              ← back to the village
            </span>
          </button>

          {/* the building's info — the backdrop you walk all over */}
          <div
            className={`relative z-[20] mx-auto w-full max-w-2xl px-5 ${
              isShort ? "py-24" : "pb-40 pt-36"
            }`}
          >
            <header className="flex items-start gap-3">
              {landmark.faceset && (
                // Jethro's own character as the headshot: the idle frame (col 0)
                // cropped from the 5-frame player strip and centred in the tile.
                <div
                  aria-hidden
                  className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-[#5c4326] bg-[#2a1d10]"
                >
                  <div
                    style={{
                      width: PFW * 1.375,
                      height: PFH * 1.375,
                      backgroundImage: `url(${SHEET})`,
                      backgroundSize: `${PFW * 5 * 1.375}px ${PFH * 1.375}px`,
                      backgroundPosition: "0px 0px",
                      backgroundRepeat: "no-repeat",
                      imageRendering: "pixelated",
                    }}
                  />
                </div>
              )}
              <div>
                <span className="eyebrow" style={{ color: theme.eyebrow }}>
                  {landmark.section}
                </span>
                <h2
                  id={TITLE_ID}
                  className="text-rise mt-0.5"
                  style={{ color: theme.headerInk, textShadow: theme.titleShadow }}
                >
                  {landmark.title}
                </h2>
                <p className="label-mono text-[0.66rem]" style={{ color: theme.subInk }}>
                  {landmark.landmark}
                </p>
              </div>
            </header>

            {landmark.authoredLine && (
              <p className="mt-6 rounded-sm border border-dashed border-[var(--color-golden)] bg-[color-mix(in_oklab,#1a120a_60%,transparent)] p-3 text-[0.86rem] italic text-[var(--color-card)]">
                <span className="label-mono not-italic text-[var(--color-golden)]!">
                  Draft · Jethro to author:
                </span>{" "}
                {landmark.authoredLine.replace(/^JETHRO:\s*/, "")}
              </p>
            )}

            <div className="mt-6 space-y-5">
              {landmark.body.map((para, i) => (
                <p
                  key={i}
                  className={`rounded-md border border-[color-mix(in_oklab,var(--color-granite-line)_55%,transparent)] bg-[color-mix(in_oklab,var(--color-card)_96%,transparent)] p-4 leading-relaxed text-[var(--color-shadow)] shadow-md ${
                    overlook ? "text-center font-display text-[1.02rem]" : "text-[0.95rem]"
                  }`}
                >
                  {para}
                </p>
              ))}
            </div>

            {/* flowsheet-style facts: mono key/value rows (Clinical, Under the hood) */}
            {landmark.facts && (
              <dl className="mt-6 overflow-hidden rounded-md border border-[color-mix(in_oklab,var(--color-granite-line)_55%,transparent)] bg-[var(--color-card)] shadow-md">
                {landmark.facts.map((f, i) => (
                  <div
                    key={f.k}
                    className={`flex gap-3 px-4 py-2.5 ${
                      i ? "border-t border-[color-mix(in_oklab,var(--color-granite-line)_45%,transparent)]" : ""
                    }`}
                  >
                    <dt className="label-mono w-24 shrink-0 text-[0.64rem] uppercase tracking-wider text-[var(--color-muted)]">
                      {f.k}
                    </dt>
                    <dd className="label-mono flex-1 text-[0.72rem] leading-relaxed text-[var(--color-shadow)]!">
                      {f.v}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {/* Resume: the download is the point — promote it above the sheet */}
            {landmark.resumeSheet && landmark.links && landmark.links.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {landmark.links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    className="fast-ui rounded-sm px-4 py-2 text-[0.84rem] font-semibold shadow-md"
                    style={{ background: "var(--color-golden)", color: "#2a2012" }}
                  >
                    {l.label} ↓
                  </a>
                ))}
              </div>
            )}

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
                    className="fast-ui rounded-md border border-[color-mix(in_oklab,var(--color-granite-line)_55%,transparent)] bg-[var(--color-card)] p-4 text-[var(--color-shadow)] shadow-md hover:shadow-lg"
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
                    {(proj.role || proj.stack.length > 0) && (
                      <p className="label-mono mt-0.5 text-[0.62rem] text-[var(--color-muted)]!">
                        {[proj.role, ...proj.stack].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    <p className="mt-1.5 text-[0.85rem] leading-snug text-[var(--color-muted)]">
                      {proj.summary}
                    </p>
                    {proj.tags && proj.tags.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {proj.tags.map((t) => (
                          <span
                            key={t}
                            className="label-mono rounded-full border border-[color-mix(in_oklab,var(--color-pine)_55%,transparent)] px-2 py-0.5 text-[0.6rem] text-[var(--color-pine)]!"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* Contact: the post office — each way to reach me is a letter */}
            {postOffice && landmark.links && landmark.links.length > 0 ? (
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {landmark.links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      target={l.href.startsWith("http") ? "_blank" : undefined}
                      rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="fast-ui relative block rounded-md border border-[color-mix(in_oklab,var(--color-granite-line)_60%,transparent)] bg-[var(--color-card)] p-4 pr-12 shadow-md hover:shadow-lg"
                    >
                      {/* the stamp */}
                      <span
                        aria-hidden
                        className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-[2px] border border-[var(--color-golden)]"
                        style={{ background: "color-mix(in oklab, var(--color-golden) 16%, transparent)" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M1.5 11 6 4l3 4.5L11 6l1.5 5z" fill="var(--color-golden-deep)" />
                          <circle cx="10.5" cy="3.2" r="1.3" fill="var(--color-golden)" />
                        </svg>
                      </span>
                      <span className="font-display text-[1rem] font-medium text-[var(--color-shadow)]">
                        {l.label}
                      </span>
                      <span className="label-mono mt-1 block truncate text-[0.68rem] text-[var(--color-muted)]!">
                        {l.href.replace(/^mailto:|^https?:\/\//, "")}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              !landmark.resumeSheet &&
              landmark.links &&
              landmark.links.length > 0 && (
                <div className={`mt-6 flex flex-wrap gap-2 ${overlook ? "justify-center" : ""}`}>
                  {landmark.links.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      target={l.href.startsWith("http") ? "_blank" : undefined}
                      rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className={`fast-ui rounded-sm border px-3 py-1.5 text-[0.82rem] font-medium ${
                        overlook
                          ? "border-[#2a1d10] bg-[color-mix(in_oklab,#1a120a_55%,transparent)] text-[var(--color-card)] hover:bg-[#2a1d10]"
                          : "border-[var(--color-golden)] text-[var(--color-card)] hover:bg-[var(--color-golden)] hover:text-[#2a1d10]"
                      }`}
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
              )
            )}
          </div>

          {/* the hiker — walks over everything */}
          <div
            ref={charRef}
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 z-[30]"
            style={{
              width: CW,
              height: CH,
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
        ref={backRef}
        type="button"
        onClick={close}
        aria-label="Back to the village"
        className="hud-plaque fast-ui label-mono fixed left-3 top-3 z-[55] px-3 py-2 text-[0.74rem] text-[var(--color-on-dark)]! hover:text-[var(--color-golden)]!"
      >
        ← Village
      </button>
      <div className="pointer-events-none fixed bottom-3 left-1/2 z-[55] w-max max-w-[94vw] -translate-x-1/2">
        <span className="hud-plaque label-mono block px-3 py-1.5 text-[0.66rem] text-[var(--color-on-dark)]!">
          {touch
            ? "Joystick or tap to walk · reach the door to head back"
            : "WASD / arrows or tap to walk · reach the door to head back"}
        </span>
      </div>

      {/* the same movement stick as the village — walk the room on touch, then
          reach the door to leave. Touch-only (renders null on desktop). */}
      <Joystick />
    </div>
  );
}
