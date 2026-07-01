"use client";

/* ============================================================
   Minimap (HUD)  ·  a parchment survey map of the town
   An SVG top-down of the actual village drawn like a field map:
   parchment ground, a pine fringe at the rim, the Merced + plank
   bridge, golden trails radiating from the plaza, and a tiny house
   glyph per building (golden once visited) plus a pulsing "you are
   here". Markers + legend rows fast-travel (valley:goto). The whole
   panel collapses to its header (chevron; collapsed by default on
   touch, expanded on desktop; choice persists for the session).
   Geometry comes from content/portfolio (villageMap + landmark.map),
   the single source of truth shared with the scene.
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { gameBus } from "@/lib/gameBus";
import { useIsTouch } from "@/lib/useIsTouch";
import { landmarks, villageMap } from "@/content/portfolio";

const W = villageMap.w;
const H = villageMap.h;
const PLAZA = villageMap.plaza;

// deterministic pine fringe along the rim (mirrors the scene's forest ring)
const PINES: [number, number][] = [];
for (let x = 3; x < W - 2; x += 3.1) {
  PINES.push([x, 2.1 + ((x * 7) % 2)]);
}
for (let y = 5; y < villageMap.riverTop - 2; y += 3.4) {
  PINES.push([2.2 + ((y * 5) % 2), y]);
  PINES.push([W - 2.4 - ((y * 3) % 2), y]);
}

export function Minimap() {
  const [pos, setPos] = useState({ x: villageMap.spawn.x / W, y: villageMap.spawn.y / H });
  const [found, setFound] = useState<Set<string>>(new Set());
  const posRef = useRef(pos);
  // Touch: bottom-left (the joystick owns bottom-right). Desktop: bottom-right.
  const touch = useIsTouch();
  const [open, setOpen] = useState<boolean | null>(null); // null until touch is known

  // default: expanded on desktop, collapsed on touch; session remembers the choice
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = sessionStorage.getItem("village-minimap");
    } catch {
      /* private mode */
    }
    setOpen(saved ? saved === "1" : !touch);
  }, [touch]);

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem("village-minimap", next ? "1" : "0");
      } catch {
        /* private mode */
      }
      return next;
    });
  };

  useEffect(() => {
    const off1 = gameBus.on("player:move", (p) => {
      if (Math.abs(p.x - posRef.current.x) > 0.004 || Math.abs(p.y - posRef.current.y) > 0.004) {
        posRef.current = p;
        setPos(p);
      }
    });
    const off2 = gameBus.on("landmark:discovered", ({ id }) =>
      setFound((prev) => new Set(prev).add(id))
    );
    return () => {
      off1();
      off2();
    };
  }, []);

  const travel = (id: string) => gameBus.emit("valley:goto", { id });
  const px = pos.x * W;
  const py = pos.y * H;

  return (
    <div
      className={`fixed bottom-3 z-40 w-40 select-none sm:w-56 ${touch ? "left-3" : "right-3"}`}
    >
      <div className="hud-plaque overflow-hidden">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open === true}
          className="fast-ui flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left"
        >
          <span className="label-mono text-[0.6rem] text-[var(--color-on-dark)]!">
            Yosemite Village
          </span>
          <span className="flex items-center gap-1.5">
            <span
              role="status"
              aria-live="polite"
              className="label-mono tnum text-[0.6rem] text-[var(--color-golden)]!"
            >
              {found.size}/{landmarks.length} found
            </span>
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              aria-hidden
              className={`transition-transform duration-150 ${open ? "" : "rotate-180"}`}
              style={{ color: "var(--color-on-dark-muted)" }}
            >
              <path d="M1.5 3.5 5 7l3.5-3.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>

        {open && (
          <>
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="block w-full"
              role="img"
              aria-label="Village map"
            >
              {/* parchment ground */}
              <rect x="0" y="0" width={W} height={H} fill="#e2d5b4" />
              <rect x="0" y="0" width={W} height={H} fill="#c9b98f" opacity="0.25" />
              {/* the Merced + plank bridge */}
              <rect x="0" y={villageMap.riverTop} width={W} height={H - villageMap.riverTop} fill="#4a7fa0" />
              <rect x="0" y={villageMap.riverTop} width={W} height="0.7" fill="#7fb0c8" opacity="0.8" />
              <rect x={villageMap.bridge.x} y={villageMap.riverTop} width={villageMap.bridge.w} height={H - villageMap.riverTop} fill="#b88c5a" />
              {/* golden trails from the plaza to every building */}
              {landmarks.map((l) => (
                <line
                  key={`p-${l.id}`}
                  x1={villageMap.spawn.x}
                  y1={villageMap.spawn.y}
                  x2={l.map.x}
                  y2={l.map.y}
                  stroke="#a97f3f"
                  strokeWidth="0.6"
                  strokeDasharray="1.3 0.9"
                  strokeLinecap="round"
                  opacity="0.75"
                />
              ))}
              {/* pine fringe at the rim */}
              {PINES.map(([x, y], i) => (
                <circle key={`t-${i}`} cx={x} cy={y} r="0.9" fill="#3e5c46" opacity="0.75" />
              ))}
              {/* plaza + fountain */}
              <rect x={PLAZA.x - 5.5} y={PLAZA.y - 2.5} width="11" height="7" rx="1" fill="#efe3c4" />
              <circle cx={PLAZA.x} cy={PLAZA.y} r="1.1" fill="#4a7fa0" />
              {/* building markers: tiny house glyphs (clickable) */}
              {landmarks.map((l) => {
                const on = found.has(l.id);
                const fill = on ? "var(--color-golden)" : "#f7f1e2";
                return (
                  <g key={l.id} onClick={() => travel(l.id)} style={{ cursor: "pointer" }}>
                    <title>{l.section}</title>
                    <circle cx={l.map.x} cy={l.map.y} r="3" fill="transparent" />
                    <path
                      d={`M ${l.map.x - 1.4} ${l.map.y + 1.4} v -1.6 l 1.4 -1.5 l 1.4 1.5 v 1.6 z`}
                      fill={fill}
                      stroke="#3a2d18"
                      strokeWidth="0.45"
                      strokeLinejoin="round"
                    />
                  </g>
                );
              })}
              {/* you are here */}
              <circle cx={px} cy={py} r="2.4" fill="none" stroke="var(--color-golden)" strokeWidth="0.5" opacity="0.9">
                <animate attributeName="r" values="1.8;3.4;1.8" dur="1.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;0;0.9" dur="1.8s" repeatCount="indefinite" />
              </circle>
              <circle cx={px} cy={py} r="1.3" fill="var(--color-golden)" stroke="#3a2d18" strokeWidth="0.5" />
            </svg>

            {/* legend: name per building, visited in gold, click to travel.
                Desktop-only — on a phone the labeled top nav carries fast-travel
                and the map stays a compact glanceable orientation aid. */}
            <ul className="hidden grid-cols-2 gap-x-2 gap-y-0.5 px-2 pb-2 pt-1.5 sm:grid">
              {landmarks.map((l) => {
                const on = found.has(l.id);
                return (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => travel(l.id)}
                      className="fast-ui flex w-full items-center gap-1.5 rounded-[2px] py-0.5 text-left hover:bg-[color-mix(in_oklab,var(--color-golden)_16%,transparent)]"
                    >
                      <span
                        className="size-1.5 shrink-0 rounded-[1px]"
                        style={{ backgroundColor: on ? "var(--color-golden)" : "#ece4d3" }}
                      />
                      <span
                        className="label-mono truncate text-[0.56rem]"
                        style={{ color: on ? "var(--color-golden)" : "var(--color-on-dark)" }}
                      >
                        {l.section}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
