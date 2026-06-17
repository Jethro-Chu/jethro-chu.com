"use client";

import { useEffect, useRef } from "react";

/**
 * EyeOverlay — an ambient, behind-content visualization of the user's eyes while
 * Eye Scroll is active. It reads the 468-point face mesh that WebGazer ALREADY
 * computes every frame (window.webgazer.getTracker().getPositions(), in video
 * pixels) — no second tracker, model, or camera — extracts just the two eye
 * contours, mirrors + recenters them to the middle of the page, and draws soft
 * glowing outlines in the site's palette. The pupils drift with the live gaze.
 *
 * Lightweight by construction: one canvas (DPR-capped), one rAF loop, refs only
 * (no React state per frame), pointer-events:none, behind content (-z-[5]).
 * Mounted only while active; the loop stops and the canvas clears on unmount.
 */

// MediaPipe FaceMesh eye contour rings (the model WebGazer runs)
const RIGHT_EYE = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7];
const LEFT_EYE = [263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249];

type Pt = { x: number; y: number };
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function hexToRgba(hex: string, a: number): string {
  const h = hex.trim().replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(f || "3e5c46", 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export function EyeOverlay({ gazeRef }: { gazeRef: React.MutableRefObject<Pt | null> }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const css = getComputedStyle(document.documentElement);
    const PINE = css.getPropertyValue("--color-pine") || "#3e5c46";
    const GRANITE = css.getPropertyValue("--color-granite-line") || "#ab9f8b";
    const GOLD = css.getPropertyValue("--color-golden") || "#c98f45";
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);

    let W = 0;
    let H = 0;
    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const smooth: Record<string, Pt[]> = {};
    const lerpRing = (key: string, pts: Pt[], f: number) => {
      const prev = smooth[key];
      if (!prev || prev.length !== pts.length) {
        smooth[key] = pts.map((p) => ({ ...p }));
        return smooth[key];
      }
      for (let i = 0; i < pts.length; i++) {
        prev[i].x += (pts[i].x - prev[i].x) * f;
        prev[i].y += (pts[i].y - prev[i].y) * f;
      }
      return prev;
    };

    const ringCenter = (pts: Pt[]): Pt => {
      let x = 0;
      let y = 0;
      for (const p of pts) {
        x += p.x;
        y += p.y;
      }
      return { x: x / pts.length, y: y / pts.length };
    };

    const pathRing = (pts: Pt[]) => {
      const n = pts.length;
      ctx.beginPath();
      ctx.moveTo((pts[n - 1].x + pts[0].x) / 2, (pts[n - 1].y + pts[0].y) / 2);
      for (let i = 0; i < n; i++) {
        const cur = pts[i];
        const nxt = pts[(i + 1) % n];
        ctx.quadraticCurveTo(cur.x, cur.y, (cur.x + nxt.x) / 2, (cur.y + nxt.y) / 2);
      }
      ctx.closePath();
    };

    let fade = 0; // overall fade-in/out
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      ctx.clearRect(0, 0, W, H);
      if (document.hidden) return;

      const wg = window.webgazer;
      const positions = wg?.getTracker?.()?.getPositions?.() as unknown[] | null | undefined;
      const video = document.getElementById("webgazerVideoFeed") as HTMLVideoElement | null;
      if (!positions || positions.length < 468 || !video || !video.videoWidth) {
        fade += (0 - fade) * 0.1;
        return;
      }
      fade += (1 - fade) * 0.07;

      const at = (i: number): Pt => {
        const p = positions[i] as number[] | { x: number; y: number };
        return Array.isArray(p) ? { x: p[0], y: p[1] } : { x: p.x, y: p.y };
      };
      const rEyeV = RIGHT_EYE.map(at);
      const lEyeV = LEFT_EYE.map(at);
      const rcV = ringCenter(rEyeV);
      const lcV = ringCenter(lEyeV);
      const iodV = Math.hypot(rcV.x - lcV.x, rcV.y - lcV.y);
      if (iodV < 1) return;

      const C = { x: (rcV.x + lcV.x) / 2, y: (rcV.y + lcV.y) / 2 };
      const targetIOD = clamp(Math.min(W, H) * 0.17, 130, 250);
      const scale = targetIOD / iodV;
      const cx = W / 2;
      const cy = H * 0.5;
      // video px -> page px, mirrored horizontally (selfie)
      const map = (p: Pt): Pt => ({ x: cx - (p.x - C.x) * scale, y: cy + (p.y - C.y) * scale });

      const rPts = lerpRing("r", rEyeV.map(map), 0.3);
      const lPts = lerpRing("l", lEyeV.map(map), 0.3);
      const rc = ringCenter(rPts);
      const lc = ringCenter(lPts);
      const eyeW = targetIOD * 0.62;

      const g = gazeRef.current;
      const gx = g ? clamp((g.x / window.innerWidth - 0.5) * 2, -1, 1) : 0;
      const gy = g ? clamp((g.y / window.innerHeight - 0.5) * 2, -1, 1) : 0;

      ctx.save();
      ctx.globalAlpha = fade;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      // soft glow eye outlines
      ctx.shadowColor = hexToRgba(PINE, 0.6);
      ctx.shadowBlur = 12;
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = hexToRgba(PINE, 0.5);
      pathRing(rPts);
      ctx.stroke();
      pathRing(lPts);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // iris ring + pupil, drifting with the live gaze
      const off = eyeW * 0.14;
      for (const ec of [rc, lc]) {
        const ix = ec.x - gx * off;
        const iy = ec.y + gy * off;
        const r = eyeW * 0.2;
        ctx.beginPath();
        ctx.arc(ix, iy, r, 0, Math.PI * 2);
        ctx.strokeStyle = hexToRgba(GRANITE, 0.55);
        ctx.lineWidth = 1.1;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(ix, iy, r * 0.42, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(PINE, 0.5);
        ctx.fill();
      }

      // a faint instrument axis + corner ticks — quiet "AI OS" framing
      ctx.strokeStyle = hexToRgba(GRANITE, 0.22);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rc.x - eyeW * 0.7, (rc.y + lc.y) / 2);
      ctx.lineTo(lc.x + eyeW * 0.7, (rc.y + lc.y) / 2);
      ctx.stroke();
      const bx = Math.min(rc.x, lc.x) - eyeW;
      const bX = Math.max(rc.x, lc.x) + eyeW;
      const by = cy - eyeW * 0.9;
      const bY = cy + eyeW * 0.9;
      const tick = 9;
      ctx.strokeStyle = hexToRgba(GOLD, 0.3);
      const corner = (x: number, y: number, dx: number, dy: number) => {
        ctx.beginPath();
        ctx.moveTo(x + dx * tick, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + dy * tick);
        ctx.stroke();
      };
      corner(bx, by, 1, 1);
      corner(bX, by, -1, 1);
      corner(bx, bY, 1, -1);
      corner(bX, bY, -1, -1);

      ctx.restore();
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      ctx.clearRect(0, 0, W, H);
    };
  }, [gazeRef]);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 -z-[5]" />;
}
