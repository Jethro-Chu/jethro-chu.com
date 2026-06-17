"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Off-Trail runner — the playable Easter egg shown when a visitor wanders off
 * the portfolio trail (an obviously off-topic ask; never calls Gemini). Jethro's
 * own Half Dome runner: a figure whose eye tracks the cursor hops Half Dome
 * silhouettes and dodges birds over parallax peaks and drifting clouds. Recoloured
 * to the field-guide palette; Space is scoped to the focused game so it never
 * hijacks the chat composer or the page. Reduced motion shows a static card.
 */
type OffTrailAction = "projects" | "resume" | "ask" | "about";

type Obstacle = { x: number; y: number; w: number; h: number; type: "halfdome" | "bird"; frame: number };
type Cloud = { x: number; y: number; w: number; speed: number };

// field-guide palette (canvas hexes mapped from the original slate version)
const COL = {
  skyTop: "#eae4d4",
  skyBot: "#e2dbc7",
  ink: "#3c4049",
  granite: "#ab9f8b",
  graniteSoft: "#8c8473",
  cloud: "#d8d0bd",
  pine: "#3e5c46",
  domeDark: "#454c45",
  domeMid: "#79836e",
  domeHi: "rgba(236,228,211,0.5)",
  gold: "#c98f45",
};

const DESTS: { key: OffTrailAction; label: string }[] = [
  { key: "projects", label: "View projects" },
  { key: "resume", label: "My resume" },
  { key: "ask", label: "Ask about Jethro" },
  { key: "about", label: "About" },
];
const btn =
  "inline-flex items-center rounded-sm border border-[var(--color-granite-line)] bg-[var(--color-sand)] px-2.5 py-1 text-[0.76rem] font-medium text-[var(--color-shadow)] transition-colors hover:border-[var(--color-pine)] hover:text-[var(--color-pine)]";
const GAME_H = 200;

export function OffTrailCard({ onAction }: { onAction: (a: OffTrailAction) => void }) {
  const reduce = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (reduce) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 480;
    let height = GAME_H;
    let groundY = height - 52;
    let raf = 0;
    let last = performance.now();

    let running = false;
    let dead = false;
    let score = 0;
    let hi = Number(localStorage.getItem("half-dome-hi") || 0);
    let speed = 6;
    let spawnTimer = 0;
    let groundOffset = 0;
    let mouseX = 0.5;
    let mouseY = 0.5;

    const player = {
      x: 58,
      y: groundY - 48,
      w: 44,
      h: 48,
      vy: 0,
      gravity: 0.85,
      jump: -15.5,
      grounded: true,
      runFrame: 0,
    };

    let obstacles: Obstacle[] = [];
    const clouds: Cloud[] = [
      { x: 80, y: 42, w: 54, speed: 0.28 },
      { x: 330, y: 28, w: 72, speed: 0.22 },
      { x: 610, y: 58, w: 46, speed: 0.34 },
    ];

    function resize() {
      const rect = wrap!.getBoundingClientRect();
      width = Math.max(280, Math.floor(rect.width));
      height = Math.max(180, Math.floor(rect.height));
      groundY = height - 52;
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (player.grounded) player.y = groundY - player.h;
    }

    function reset() {
      running = true;
      dead = false;
      score = 0;
      speed = 6;
      spawnTimer = 0;
      groundOffset = 0;
      obstacles = [];
      player.y = groundY - player.h;
      player.vy = 0;
      player.grounded = true;
      player.runFrame = 0;
    }

    function jump() {
      if (!running || dead) {
        reset();
        return;
      }
      if (player.grounded) {
        player.vy = player.jump;
        player.grounded = false;
      }
    }

    function spawnObstacle() {
      const birdChance = score > 300 ? 0.32 : 0.12;
      const type: "halfdome" | "bird" = Math.random() < birdChance ? "bird" : "halfdome";
      if (type === "bird") {
        const birdY = Math.random() < 0.5 ? groundY - 92 : groundY - 124;
        obstacles.push({ x: width + 24, y: birdY, w: 42, h: 28, type, frame: 0 });
      } else {
        const size = 34 + Math.random() * 18;
        obstacles.push({ x: width + 24, y: groundY - size, w: size * 1.15, h: size, type, frame: 0 });
      }
      spawnTimer = 72 + Math.random() * 52 - Math.min(score / 80, 28);
    }

    function hit(a: { x: number; y: number; w: number; h: number }, b: Obstacle) {
      const padA = 8;
      const padB = b.type === "bird" ? 7 : 5;
      return (
        a.x + padA < b.x + b.w - padB &&
        a.x + a.w - padA > b.x + padB &&
        a.y + padA < b.y + b.h - padB &&
        a.y + a.h - padA > b.y + padB
      );
    }

    function roundRect(x: number, y: number, w: number, h: number, r: number) {
      ctx!.beginPath();
      ctx!.moveTo(x + r, y);
      ctx!.arcTo(x + w, y, x + w, y + h, r);
      ctx!.arcTo(x + w, y + h, x, y + h, r);
      ctx!.arcTo(x, y + h, x, y, r);
      ctx!.arcTo(x, y, x + w, y, r);
      ctx!.closePath();
    }

    function drawCloud(c: Cloud) {
      ctx!.save();
      ctx!.globalAlpha = 0.7;
      ctx!.fillStyle = COL.cloud;
      ctx!.beginPath();
      ctx!.ellipse(c.x, c.y + 8, c.w * 0.35, 11, 0, 0, Math.PI * 2);
      ctx!.ellipse(c.x + c.w * 0.28, c.y, c.w * 0.28, 15, 0, 0, Math.PI * 2);
      ctx!.ellipse(c.x + c.w * 0.58, c.y + 8, c.w * 0.35, 11, 0, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.restore();
    }

    function drawHalfDome(o: Obstacle) {
      ctx!.save();
      ctx!.translate(o.x, o.y);
      ctx!.fillStyle = COL.domeDark;
      ctx!.beginPath();
      ctx!.moveTo(2, o.h);
      ctx!.lineTo(o.w * 0.18, o.h * 0.55);
      ctx!.quadraticCurveTo(o.w * 0.48, -o.h * 0.12, o.w * 0.86, o.h * 0.08);
      ctx!.quadraticCurveTo(o.w * 0.78, o.h * 0.52, o.w - 2, o.h);
      ctx!.closePath();
      ctx!.fill();
      ctx!.fillStyle = COL.domeMid;
      ctx!.beginPath();
      ctx!.moveTo(o.w * 0.18, o.h);
      ctx!.lineTo(o.w * 0.34, o.h * 0.5);
      ctx!.quadraticCurveTo(o.w * 0.52, o.h * 0.02, o.w * 0.82, o.h * 0.1);
      ctx!.quadraticCurveTo(o.w * 0.7, o.h * 0.5, o.w * 0.78, o.h);
      ctx!.closePath();
      ctx!.fill();
      ctx!.strokeStyle = COL.domeHi;
      ctx!.lineWidth = 2;
      ctx!.beginPath();
      ctx!.moveTo(o.w * 0.38, o.h * 0.42);
      ctx!.quadraticCurveTo(o.w * 0.54, o.h * 0.15, o.w * 0.78, o.h * 0.16);
      ctx!.stroke();
      ctx!.restore();
    }

    function drawBird(o: Obstacle) {
      const flap = Math.sin(o.frame * 0.35) * 8;
      ctx!.save();
      ctx!.translate(o.x, o.y);
      ctx!.strokeStyle = COL.pine;
      ctx!.lineWidth = 4;
      ctx!.lineCap = "round";
      ctx!.beginPath();
      ctx!.moveTo(2, 14);
      ctx!.quadraticCurveTo(13, 2 + flap, 22, 14);
      ctx!.quadraticCurveTo(31, 2 - flap, 42, 14);
      ctx!.stroke();
      ctx!.fillStyle = COL.pine;
      ctx!.beginPath();
      ctx!.ellipse(22, 15, 5, 4, 0, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.restore();
    }

    function drawPlayer() {
      const legFrame = Math.floor(player.runFrame / 6) % 2;
      const eyeShiftX = (mouseX - 0.5) * 2;
      const eyeShiftY = (mouseY - 0.5) * 1.5;
      ctx!.save();
      ctx!.translate(player.x, player.y);
      ctx!.fillStyle = COL.ink;
      roundRect(11, 8, 26, 25, 5);
      ctx!.fill();
      ctx!.fillRect(17, 28, 18, 12);
      ctx!.fillRect(5, 25, 14, 7);
      ctx!.fillRect(31, 31, 11, 6);
      if (player.grounded && running && !dead) {
        if (legFrame === 0) {
          ctx!.fillRect(16, 39, 7, 9);
          ctx!.fillRect(29, 39, 6, 5);
          ctx!.fillRect(33, 43, 9, 5);
        } else {
          ctx!.fillRect(16, 39, 6, 5);
          ctx!.fillRect(7, 43, 14, 5);
          ctx!.fillRect(30, 39, 7, 9);
        }
      } else {
        ctx!.fillRect(16, 39, 7, 9);
        ctx!.fillRect(30, 39, 7, 9);
      }
      ctx!.fillStyle = COL.gold;
      ctx!.fillRect(29 + eyeShiftX, 15 + eyeShiftY, 4, 4);
      ctx!.restore();
    }

    function drawGround() {
      ctx!.strokeStyle = COL.ink;
      ctx!.lineWidth = 2;
      ctx!.beginPath();
      ctx!.moveTo(0, groundY + 1);
      ctx!.lineTo(width, groundY + 1);
      ctx!.stroke();
      ctx!.fillStyle = COL.graniteSoft;
      for (let x = -groundOffset; x < width; x += 42) {
        const y = groundY + 13 + Math.sin((x + score) * 0.02) * 5;
        ctx!.fillRect(x, y, 12, 2);
      }
      ctx!.fillStyle = COL.granite;
      for (let x = -groundOffset * 0.55; x < width; x += 95) {
        ctx!.fillRect(x, groundY + 28, 18, 2);
      }
    }

    function drawMountains() {
      const parallax = (mouseX - 0.5) * 14;
      ctx!.save();
      ctx!.globalAlpha = 0.13;
      ctx!.fillStyle = COL.ink;
      ctx!.beginPath();
      ctx!.moveTo(-20 - parallax, groundY);
      ctx!.lineTo(90 - parallax, groundY - 58);
      ctx!.lineTo(180 - parallax, groundY);
      ctx!.closePath();
      ctx!.fill();
      ctx!.beginPath();
      ctx!.moveTo(130 - parallax * 0.6, groundY);
      ctx!.lineTo(260 - parallax * 0.6, groundY - 78);
      ctx!.lineTo(390 - parallax * 0.6, groundY);
      ctx!.closePath();
      ctx!.fill();
      ctx!.beginPath();
      ctx!.moveTo(width - 250 - parallax, groundY);
      ctx!.lineTo(width - 105 - parallax, groundY - 65);
      ctx!.lineTo(width + 20 - parallax, groundY);
      ctx!.closePath();
      ctx!.fill();
      ctx!.restore();
    }

    function drawHud() {
      ctx!.fillStyle = COL.ink;
      ctx!.font = "700 13px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
      ctx!.textAlign = "right";
      ctx!.fillText(
        `HI ${String(Math.floor(hi)).padStart(5, "0")}  ${String(Math.floor(score)).padStart(5, "0")}`,
        width - 16,
        24,
      );
      if (!running && !dead) {
        ctx!.textAlign = "center";
        ctx!.font = "700 14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
        ctx!.fillText("PRESS SPACE TO START", width / 2, height / 2 - 8);
        ctx!.font = "500 11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
        ctx!.fillText("jump Half Dome · dodge birds", width / 2, height / 2 + 14);
      }
      if (dead) {
        ctx!.textAlign = "center";
        ctx!.font = "800 14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
        ctx!.fillText("OFF TRAIL", width / 2, height / 2 - 12);
        ctx!.font = "500 11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
        ctx!.fillText("press space to run again", width / 2, height / 2 + 12);
      }
    }

    function update(dt: number) {
      if (!running || dead) return;
      const step = dt / 16.6667;
      score += step * 0.72;
      speed = 6 + Math.min(score / 140, 7);
      player.vy += player.gravity * step;
      player.y += player.vy * step;
      if (player.y >= groundY - player.h) {
        player.y = groundY - player.h;
        player.vy = 0;
        player.grounded = true;
      }
      if (player.grounded) player.runFrame += step;
      spawnTimer -= step;
      if (spawnTimer <= 0) spawnObstacle();
      for (const o of obstacles) {
        o.x -= speed * step;
        o.frame += step;
        if (hit(player, o)) {
          dead = true;
          running = false;
          hi = Math.max(hi, Math.floor(score));
          try {
            localStorage.setItem("half-dome-hi", String(hi));
          } catch {
            /* ignore */
          }
        }
      }
      obstacles = obstacles.filter((o) => o.x + o.w > -20);
      groundOffset = (groundOffset + speed * step) % 42;
      for (const c of clouds) {
        c.x -= (c.speed + speed * 0.015) * step;
        if (c.x + c.w < -30) {
          c.x = width + 40 + Math.random() * 180;
          c.y = 22 + Math.random() * 48;
          c.w = 42 + Math.random() * 44;
        }
      }
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height);
      const gradient = ctx!.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, COL.skyTop);
      gradient.addColorStop(1, COL.skyBot);
      ctx!.fillStyle = gradient;
      ctx!.fillRect(0, 0, width, height);
      drawMountains();
      for (const c of clouds) drawCloud(c);
      drawGround();
      for (const o of obstacles) {
        if (o.type === "bird") drawBird(o);
        else drawHalfDome(o);
      }
      drawPlayer();
      drawHud();
    }

    function loop(now: number) {
      const dt = Math.min(34, now - last);
      last = now;
      update(dt);
      draw();
      raf = requestAnimationFrame(loop);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    }
    function onPointerMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouseX = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      mouseY = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    }
    function onPointerDown() {
      wrap!.focus({ preventScroll: true });
      jump();
    }

    resize();
    draw();

    window.addEventListener("resize", resize);
    // keys are SCOPED to the focused game so Space never hijacks the composer / page
    wrap.addEventListener("keydown", onKeyDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    raf = requestAnimationFrame(loop);

    // grab focus so "Press Space" works, after the panel's own composer focus (120ms)
    const focusT = window.setTimeout(() => {
      const a = document.activeElement as HTMLElement | null;
      if (!a || a === document.body || a.tagName === "INPUT" || a.tagName === "TEXTAREA") {
        wrap.focus({ preventScroll: true });
      }
    }, 220);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(focusT);
      window.removeEventListener("resize", resize);
      wrap.removeEventListener("keydown", onKeyDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
    };
  }, [reduce]);

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
      <div className="border-b border-[var(--color-granite-line)] bg-[var(--color-sand)] px-4 py-2">
        <span className="label-mono text-[0.6rem] text-[var(--color-pine)]">off trail</span>
      </div>
      <div
        ref={wrapRef}
        tabIndex={0}
        role="application"
        aria-label="Half Dome runner game. Space or tap to jump, dodge Half Dome and birds."
        className="relative select-none bg-[var(--color-sand)] outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--color-pine)]"
        style={{ height: GAME_H, touchAction: "manipulation" }}
      >
        <canvas ref={canvasRef} aria-hidden style={{ width: "100%", height: "100%", display: "block", cursor: "pointer" }} />
      </div>
      <div className="px-4 py-3">
        <RouteButtons onAction={onAction} />
      </div>
    </div>
  );
}

function RouteButtons({ onAction }: { onAction: (a: OffTrailAction) => void }) {
  return (
    <div className="mt-0.5 flex flex-wrap gap-1.5">
      {DESTS.map((d) => (
        <button key={d.key} onClick={() => onAction(d.key)} className={btn}>
          {d.label}
        </button>
      ))}
    </div>
  );
}
