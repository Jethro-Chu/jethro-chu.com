"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useScroll, useTransform } from "framer-motion";
import { sections } from "@/content/content";
import { STATIC_P } from "./yosemite/cameraPath";

/**
 * The 3D Yosemite ascent, as a fixed background behind all content. A client-only
 * R3F canvas (no SSR) whose camera flies up the canyon driven by the SAME scroll
 * progress the page already uses (Framer useScroll, which reads the Lenis-updated
 * native scroll), so the 3D, the DOM, and the altimeter stay in lockstep.
 *
 * It is always a background, never an obstacle:
 *  - lazy-mounted after idle, so the canvas never blocks LCP; a warm valley wash
 *    paints first and the canvas fades in over it.
 *  - reduced-motion, small screens, and low-core devices get ONE static composed
 *    frame (no camera motion), not the live crane.
 *  - rendering pauses when the tab is hidden.
 *  - a sand veil keeps the centered reading column legible while thinning toward
 *    the gutters where the canyon walls live.
 *  - WebGL failure falls back to the static wash. Native scroll always works.
 */

type Mode = "off" | "static" | "animate";
type FrameLoop = "always" | "demand" | "never";

const YosemiteScene = dynamic(() => import("./yosemite/Scene"), { ssr: false });

// Camera-progress reached as each anchor section arrives at the top of the page.
// Indexes align with sections[0..3] (hero, approach, projects, about) plus a 1.0
// terminal. The dome arrival (camera-progress ~0.70) is pinned to the About/summit
// section, so the 3D crest lands with the real summit photo at ANY viewport height.
const ANCHOR_CP = [0, 0.14, 0.34, 0.7, 1];
const DEFAULT_ANCHOR_SF = [0, 0.27, 0.44, 0.74, 1];
const ANCHOR_IDS = sections.slice(0, 4).map((s) => s.id);

class SceneErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function decideMode(): Mode {
  if (typeof window === "undefined") return "off";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "static";
  const small = window.innerWidth < 768;
  const lowCore = (navigator.hardwareConcurrency ?? 8) <= 4;
  if (small || lowCore) return "static";
  return "animate";
}

export function YosemiteBackground() {
  const { scrollYProgress } = useScroll();
  const [anchorSf, setAnchorSf] = useState<number[]>(DEFAULT_ANCHOR_SF);
  // remap raw scroll progress through the measured section positions so the
  // climb's beats stay pinned to the sections (same source as the altimeter)
  const cameraProgress = useTransform(scrollYProgress, anchorSf, ANCHOR_CP, { clamp: true });
  const [mode, setMode] = useState<Mode>("off");
  const [mounted, setMounted] = useState(false);

  // measure where the anchor sections sit in the document; rebuild the scroll->
  // camera-progress map on resize, font load, and layout change (no silent zeros)
  useEffect(() => {
    const measure = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const xs = [0];
      for (let i = 1; i < ANCHOR_IDS.length; i++) {
        const el = document.getElementById(ANCHOR_IDS[i]);
        if (!el) continue;
        const sf = (el.getBoundingClientRect().top + window.scrollY) / max;
        xs.push(Math.min(0.999, Math.max(xs[xs.length - 1] + 0.001, sf)));
      }
      xs.push(1);
      if (xs.length === ANCHOR_CP.length) setAnchorSf(xs);
    };
    measure();
    document.fonts?.ready.then(measure).catch(() => {});
    const ro = new ResizeObserver(measure);
    ro.observe(document.documentElement);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    setMode(decideMode());

    // lazy-init: defer the canvas past first paint / LCP. Use requestIdleCallback
    // when visible, but ALWAYS keep a setTimeout backstop — rIC is deferred
    // indefinitely in hidden/background tabs, which would otherwise never mount.
    let done = false;
    const fire = () => {
      if (done) return;
      done = true;
      setMounted(true);
    };
    const hasRIC = typeof window.requestIdleCallback === "function";
    const idle = hasRIC ? window.requestIdleCallback(fire, { timeout: 1200 }) : 0;
    const to = window.setTimeout(fire, 1200);

    const reMode = () => setMode(decideMode());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener?.("change", reMode);
    window.addEventListener("resize", reMode);

    return () => {
      mq.removeEventListener?.("change", reMode);
      window.removeEventListener("resize", reMode);
      window.clearTimeout(to);
      if (hasRIC && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
    };
  }, []);

  const animate = mode === "animate";
  const showCanvas = mounted && mode !== "off";
  // animate continuously; the browser already throttles rAF when the tab is hidden
  const frameloop: FrameLoop = animate ? "always" : "demand";
  const dpr: [number, number] = animate ? [1, 1.75] : [1, 2];

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* warm valley wash: the first-paint base and the no-canvas fallback */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg," +
            " color-mix(in oklab, var(--color-sky) 24%, var(--color-sand)) 0%," +
            " var(--color-sand) 52%," +
            " color-mix(in oklab, var(--color-horizon) 18%, var(--color-sand)) 100%)",
        }}
      />

      {showCanvas && (
        <SceneErrorBoundary>
          <YosemiteScene
            progress={cameraProgress}
            animate={animate}
            staticP={STATIC_P}
            frameloop={frameloop}
            dpr={dpr}
          />
        </SceneErrorBoundary>
      )}

      {/* sand veil: protects the centered reading column's contrast, thinning to
          near-transparent at the gutters where the canyon walls show through */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 78% at 50% 40%," +
            " color-mix(in oklab, var(--color-sand) 26%, transparent) 0%," +
            " color-mix(in oklab, var(--color-sand) 14%, transparent) 46%," +
            " transparent 82%)",
        }}
      />
    </div>
  );
}
