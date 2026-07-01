"use client";

/* ============================================================
   Joystick (HUD)  ·  on-screen thumbstick for touch movement
   Bottom-right, touch devices only. Drag the knob; the offset from the
   base centre becomes a normalized move vector (valley:move) the scene
   drives the hiker with, just like the keyboard. Snaps back + zeroes on
   release. Pointer-captured so a drag keeps steering even off the base.
   ============================================================ */

import { useEffect, useRef } from "react";
import { gameBus } from "@/lib/gameBus";
import { useIsTouch } from "@/lib/useIsTouch";

const SIZE = 116; // base diameter (px)
const KNOB = 52; // knob diameter (px)
const TRAVEL = (SIZE - KNOB) / 2; // max knob offset from centre
const DEADZONE = 0.16; // ignore tiny wobble around centre

export function Joystick() {
  const touch = useIsTouch();
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const activeId = useRef<number | null>(null);
  const centre = useRef({ x: 0, y: 0 });

  // never leave the hiker walking if this unmounts mid-drag (room open / leave)
  useEffect(() => () => gameBus.emit("valley:move", { x: 0, y: 0 }), []);

  if (!touch) return null;

  const setKnob = (dx: number, dy: number) => {
    if (knobRef.current) knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
  };

  const aim = (clientX: number, clientY: number) => {
    let dx = clientX - centre.current.x;
    let dy = clientY - centre.current.y;
    const dist = Math.hypot(dx, dy);
    if (dist > TRAVEL) {
      dx = (dx / dist) * TRAVEL;
      dy = (dy / dist) * TRAVEL;
    }
    setKnob(dx, dy);
    const nx = dx / TRAVEL;
    const ny = dy / TRAVEL;
    const mag = Math.hypot(nx, ny);
    gameBus.emit("valley:move", mag < DEADZONE ? { x: 0, y: 0 } : { x: nx, y: ny });
  };

  const start = (e: React.PointerEvent) => {
    const base = baseRef.current;
    if (!base) return;
    const r = base.getBoundingClientRect();
    centre.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    activeId.current = e.pointerId;
    base.setPointerCapture(e.pointerId);
    aim(e.clientX, e.clientY);
  };

  const move = (e: React.PointerEvent) => {
    if (activeId.current !== e.pointerId) return;
    aim(e.clientX, e.clientY);
  };

  const end = (e: React.PointerEvent) => {
    if (activeId.current !== e.pointerId) return;
    activeId.current = null;
    setKnob(0, 0);
    gameBus.emit("valley:move", { x: 0, y: 0 });
  };

  return (
    <div
      ref={baseRef}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      className="fixed bottom-6 right-6 z-40 touch-none select-none rounded-full border border-[var(--color-granite-line)] bg-[color-mix(in_oklab,var(--color-shadow)_60%,transparent)] shadow-lg backdrop-blur-[1px]"
      style={{ width: SIZE, height: SIZE }}
      role="application"
      aria-label="Movement joystick"
    >
      <div
        ref={knobRef}
        className="absolute rounded-full border border-[var(--color-granite-line)] bg-[color-mix(in_oklab,var(--color-on-dark)_26%,var(--color-shadow))] shadow-md"
        style={{ width: KNOB, height: KNOB, left: TRAVEL, top: TRAVEL, touchAction: "none" }}
      />
    </div>
  );
}
