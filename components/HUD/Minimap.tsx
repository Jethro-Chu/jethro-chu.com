"use client";

/* ============================================================
   Minimap (HUD)  ·  a real, readable town map (not a dot box)
   An SVG top-down of the actual village — grass, the Merced + bridge,
   the dirt paths radiating from the plaza, the plaza/fountain, and a
   marker per building (visited = golden) — plus a live "you are here"
   player dot. Markers + legend rows are clickable to fast-travel
   (valley:goto -> the scene flash-travels and opens the panel).
   Geometry comes from content/portfolio (villageMap + landmark.map),
   the single source of truth shared with the scene.
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { gameBus } from "@/lib/gameBus";
import { landmarks, villageMap } from "@/content/portfolio";

const W = villageMap.w;
const H = villageMap.h;
const PLAZA = villageMap.plaza;

export function Minimap() {
  const [pos, setPos] = useState({ x: villageMap.spawn.x / W, y: villageMap.spawn.y / H });
  const [found, setFound] = useState<Set<string>>(new Set());
  const posRef = useRef(pos);

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
    <div className="fixed bottom-3 right-3 z-40 w-36 select-none sm:w-56">
      <div className="overflow-hidden rounded-md border border-[var(--color-granite-line)] bg-[color-mix(in_oklab,var(--color-shadow)_86%,transparent)] shadow-lg">
        <div className="flex items-center justify-between px-2 pt-1.5">
          <span className="label-mono text-[0.58rem] text-[var(--color-on-dark-muted)]!">Yosemite Village</span>
          <span className="label-mono text-[0.58rem] text-[#e6bd73]!">{found.size}/{landmarks.length}</span>
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} className="mt-1 block w-full" role="img" aria-label="Village map">
          {/* grass + granite rim */}
          <rect x="0" y="0" width={W} height={H} fill="#6b9b46" />
          <rect x="0.5" y="0.5" width={W - 1} height={H - 1} fill="none" stroke="#5a6270" strokeWidth="1.4" opacity="0.55" />
          {/* the Merced + plank bridge */}
          <rect x="0" y={villageMap.riverTop} width={W} height={H - villageMap.riverTop} fill="#4a7fa0" />
          <rect x={villageMap.bridge.x} y={villageMap.riverTop} width={villageMap.bridge.w} height={H - villageMap.riverTop} fill="#b88c5a" />
          {/* dirt paths from the plaza to every building */}
          {landmarks.map((l) => (
            <line
              key={`p-${l.id}`}
              x1={villageMap.spawn.x}
              y1={villageMap.spawn.y}
              x2={l.map.x}
              y2={l.map.y}
              stroke="#b88c5a"
              strokeWidth="0.7"
              strokeLinecap="round"
              opacity="0.7"
            />
          ))}
          {/* plaza + fountain */}
          <rect x={PLAZA.x - 5.5} y={PLAZA.y - 2.5} width="11" height="7" rx="1" fill="#e7dcc2" opacity="0.92" />
          <circle cx={PLAZA.x} cy={PLAZA.y} r="1.1" fill="#4a7fa0" />
          {/* building markers (clickable) */}
          {landmarks.map((l) => {
            const on = found.has(l.id);
            return (
              <g key={l.id} onClick={() => travel(l.id)} style={{ cursor: "pointer" }}>
                <title>{l.section}</title>
                <circle cx={l.map.x} cy={l.map.y} r="2.6" fill="transparent" />
                <rect
                  x={l.map.x - 1.2}
                  y={l.map.y - 1.2}
                  width="2.4"
                  height="2.4"
                  rx="0.4"
                  fill={on ? "var(--color-golden)" : "#ece4d3"}
                  stroke="#27292f"
                  strokeWidth="0.5"
                />
              </g>
            );
          })}
          {/* you are here */}
          <circle cx={px} cy={py} r="2.4" fill="none" stroke="var(--color-golden)" strokeWidth="0.5" opacity="0.9">
            <animate attributeName="r" values="1.8;3.4;1.8" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0;0.9" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <circle cx={px} cy={py} r="1.4" fill="#f4efe3" stroke="#27292f" strokeWidth="0.6" />
        </svg>

        {/* legend: name per building, visited in gold, click to travel.
            Desktop-only — on a phone the labeled top nav carries fast-travel and
            the map stays a compact glanceable orientation aid. */}
        <ul className="hidden grid-cols-2 gap-x-2 gap-y-0.5 px-2 pb-2 pt-1.5 sm:grid">
          {landmarks.map((l) => {
            const on = found.has(l.id);
            return (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => travel(l.id)}
                  className="fast-ui flex w-full items-center gap-1.5 rounded-[2px] py-0.5 text-left hover:bg-[color-mix(in_oklab,var(--color-on-dark)_14%,transparent)]"
                >
                  <span
                    className="size-1.5 shrink-0 rounded-[1px]"
                    style={{ backgroundColor: on ? "var(--color-golden)" : "#ece4d3" }}
                  />
                  <span
                    className="label-mono truncate text-[0.56rem]"
                    style={{ color: on ? "#e6bd73" : "var(--color-on-dark)" }}
                  >
                    {l.section}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
