"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/**
 * Eye Scroll — a desktop-only, opt-in webcam gaze-scroller. Look near the top
 * of the screen to scroll up, the bottom to scroll down, the middle to stop.
 *
 * Privacy & weight: WebGazer.js does ALL gaze processing locally in the browser
 * (no video or gaze data ever leaves the machine). It is GPLv3/LGPLv3 and ~heavy
 * (bundles TensorFlow.js), so it is NOT in our build — it is loaded from a pinned
 * CDN only when the user clicks Enable, and fully torn down (camera stopped, data
 * cleared) on disable. Live gaze coordinates live in refs and drive a single rAF
 * loop, so they never trigger React re-renders or hurt normal scrolling.
 *
 * Never auto-starts. Esc disables. Pauses when the tab is hidden. Hidden entirely
 * under reduced motion or on touch/small screens.
 */

const WEBGAZER_SRC = "https://cdn.jsdelivr.net/npm/webgazer@3.3.0/dist/webgazer.min.js";

const DEADZONE = 0.14; // fraction of the calibrated half-range that does nothing
const MAX_SPEED = 950; // px/sec cap
const SMOOTH = 0.16; // per-frame approach toward the target speed

type Status = "off" | "loading" | "calibrating" | "active" | "denied" | "error";
type LoadingPhase = "camera" | "model" | "warmup";

interface WebGazer {
  setGazeListener(cb: (data: { x: number; y: number } | null, ts: number) => void): WebGazer;
  begin(): Promise<unknown>;
  end(): WebGazer;
  pause(): WebGazer;
  resume(): WebGazer;
  showVideoPreview(b: boolean): WebGazer;
  showPredictionPoints(b: boolean): WebGazer;
  showFaceOverlay(b: boolean): WebGazer;
  showFaceFeedbackBox(b: boolean): WebGazer;
  saveDataAcrossSessions(b: boolean): WebGazer;
  setRegression(name: string): WebGazer;
  clearGazeListener(): WebGazer;
  clearData?(): void;
}
declare global {
  interface Window {
    webgazer?: WebGazer;
  }
}

interface EyeScrollCtx {
  supported: boolean;
  status: Status;
  enable: () => void;
  disable: () => void;
}
const Ctx = createContext<EyeScrollCtx>({ supported: false, status: "off", enable: () => {}, disable: () => {} });
export const useEyeScroll = () => useContext(Ctx);

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const CALIB = [
  { key: "center", label: "center", x: 50, y: 50 },
  { key: "top", label: "top", x: 50, y: 12 },
  { key: "bottom", label: "bottom", x: 50, y: 88 },
  { key: "left", label: "left", x: 12, y: 50 },
  { key: "right", label: "right", x: 88, y: 50 },
] as const;

function loadWebgazer(): Promise<WebGazer> {
  if (window.webgazer) return Promise.resolve(window.webgazer);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = WEBGAZER_SRC;
    s.async = true;
    s.dataset.eyescroll = "1";
    s.onload = () => (window.webgazer ? resolve(window.webgazer) : reject(new Error("webgazer missing")));
    s.onerror = () => reject(new Error("script load failed"));
    document.head.appendChild(s);
  });
}

/** belt-and-suspenders: stop any camera stream WebGazer left open */
function stopCamera() {
  const v = document.getElementById("webgazerVideoFeed") as HTMLVideoElement | null;
  const stream = v?.srcObject as MediaStream | null;
  stream?.getTracks().forEach((t) => t.stop());
}

export function EyeScrollProvider({ children }: { children: React.ReactNode }) {
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState<Status>("off");
  const [calibStep, setCalibStep] = useState(0);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("camera");

  const gaze = useRef<{ x: number; y: number } | null>(null);
  const calib = useRef({ centerY: 0, topY: 0, bottomY: 0, ok: false });
  const speed = useRef(0);
  const paused = useRef(false);
  const raf = useRef(0);
  const lastT = useRef(0);
  const statusRef = useRef<Status>("off");
  const setStatusSafe = useCallback((s: Status) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  // desktop + fine pointer + camera API + motion allowed
  useEffect(() => {
    const ok =
      window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      !!navigator.mediaDevices?.getUserMedia;
    setSupported(ok);
  }, []);

  const disable = useCallback(() => {
    cancelAnimationFrame(raf.current);
    const wg = window.webgazer;
    if (wg) {
      try {
        wg.clearGazeListener();
        wg.clearData?.();
        wg.end();
      } catch {
        /* ignore */
      }
    }
    stopCamera();
    gaze.current = null;
    speed.current = 0;
    paused.current = false;
    setCalibStep(0);
    setStatusSafe("off");
  }, [setStatusSafe]);

  // the scroll loop — refs only, never setState
  const startLoop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    lastT.current = 0;
    const loop = (t: number) => {
      raf.current = requestAnimationFrame(loop);
      const dt = lastT.current ? Math.min(0.05, (t - lastT.current) / 1000) : 0;
      lastT.current = t;
      if (paused.current || !dt) return;

      const g = gaze.current;
      let target = 0;
      if (g) {
        const c = calib.current;
        const halfUp = Math.max(40, c.centerY - c.topY);
        const halfDown = Math.max(40, c.bottomY - c.centerY);
        // calibrated position: -1 looking at top dot, +1 at bottom dot
        const pos = g.y < c.centerY ? -(c.centerY - g.y) / halfUp : (g.y - c.centerY) / halfDown;
        if (pos < -DEADZONE) target = -MAX_SPEED * Math.min(1, (-pos - DEADZONE) / (1 - DEADZONE));
        else if (pos > DEADZONE) target = MAX_SPEED * Math.min(1, (pos - DEADZONE) / (1 - DEADZONE));
      }
      speed.current += (target - speed.current) * SMOOTH;
      const v = speed.current * dt;
      if (Math.abs(v) > 0.08) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const next = clamp(window.scrollY + v, 0, max);
        const lenis = window.__lenis;
        if (lenis) lenis.scrollTo(next, { immediate: true, force: true });
        else window.scrollTo(0, next);
      }
    };
    raf.current = requestAnimationFrame(loop);
  }, []);

  const enable = useCallback(async () => {
    if (!supported || statusRef.current !== "off") return;
    setLoadingPhase("camera");
    setStatusSafe("loading");
    // probe permission first so a denial is detected cleanly
    try {
      const probe = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      probe.getTracks().forEach((tk) => tk.stop());
    } catch {
      setStatusSafe("denied");
      return;
    }
    let wg: WebGazer;
    try {
      setLoadingPhase("model");
      wg = await loadWebgazer();
      wg.saveDataAcrossSessions(false);
      wg.setGazeListener((data) => {
        if (data && Number.isFinite(data.x) && Number.isFinite(data.y)) gaze.current = { x: data.x, y: data.y };
      });
      wg.showVideoPreview(false).showPredictionPoints(false).showFaceOverlay(false).showFaceFeedbackBox(false);
      wg.setRegression("ridge");
      await wg.begin();
    } catch {
      setStatusSafe("error");
      return;
    }
    // wait for the first real prediction (model warm-up), then calibrate
    setLoadingPhase("warmup");
    const startedAt = performance.now();
    const waitReady = () => {
      if (statusRef.current !== "loading") return;
      if (gaze.current || performance.now() - startedAt > 9000) {
        // default mapping (viewport thirds) until calibration refines it
        const h = window.innerHeight;
        calib.current = { centerY: h * 0.5, topY: h * 0.22, bottomY: h * 0.78, ok: false };
        setCalibStep(0);
        setStatusSafe("calibrating");
        return;
      }
      window.setTimeout(waitReady, 120);
    };
    waitReady();
  }, [supported, setStatusSafe]);

  const onCalibClick = useCallback(
    (key: string) => {
      const g = gaze.current;
      if (g) {
        if (key === "center") calib.current.centerY = g.y;
        else if (key === "top") calib.current.topY = g.y;
        else if (key === "bottom") calib.current.bottomY = g.y;
      }
      setCalibStep((s) => {
        const next = s + 1;
        if (next >= CALIB.length) {
          const c = calib.current;
          // sanity: keep a sensible increasing range, else fall back to thirds
          if (!(c.topY < c.centerY - 8 && c.bottomY > c.centerY + 8)) {
            const h = window.innerHeight;
            calib.current = { centerY: h * 0.5, topY: h * 0.24, bottomY: h * 0.76, ok: false };
          } else {
            calib.current.ok = true;
          }
          setStatusSafe("active");
          startLoop();
        }
        return next;
      });
    },
    [setStatusSafe, startLoop],
  );

  // Esc to disable; pause when the tab is hidden
  useEffect(() => {
    if (status === "off") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") disable();
    };
    const onVis = () => {
      const hidden = document.hidden;
      paused.current = hidden && status === "active";
      const wg = window.webgazer;
      if (wg) {
        try {
          hidden ? wg.pause() : wg.resume();
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [status, disable]);

  // tear down on unmount
  useEffect(() => () => disable(), [disable]);

  return (
    <Ctx.Provider value={{ supported, status, enable, disable }}>
      {children}
      <EyeScrollOverlay
        status={status}
        loadingPhase={loadingPhase}
        calibStep={calibStep}
        onCalibClick={onCalibClick}
        onDisable={disable}
      />
    </Ctx.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  overlay UI                                                        */
/* ------------------------------------------------------------------ */

function EyeScrollOverlay({
  status,
  loadingPhase,
  calibStep,
  onCalibClick,
  onDisable,
}: {
  status: Status;
  loadingPhase: LoadingPhase;
  calibStep: number;
  onCalibClick: (key: string) => void;
  onDisable: () => void;
}) {
  if (status === "off") return null;

  if (status === "loading") {
    const steps = [
      { key: "camera", label: "Allow camera access" },
      { key: "model", label: "Loading the eye tracker" },
      { key: "warmup", label: "Warming up · look at your screen" },
    ] as const;
    const activeIdx = steps.findIndex((s) => s.key === loadingPhase);
    return (
      <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-5 bg-[color-mix(in_oklab,var(--color-sand)_88%,transparent)] px-6 text-center">
        <p className="label-mono text-[0.66rem] text-[var(--color-pine)]">eye scroll</p>
        {/* a small drawing route line that loops while it loads */}
        <svg width="150" height="26" viewBox="0 0 150 26" fill="none" aria-hidden>
          <path d="M4 18 C 34 6, 60 22, 86 12 S 134 6, 146 16" stroke="var(--color-granite-line)" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="75" cy="13" r="3" fill="var(--color-golden)" className="animate-pulse" />
        </svg>
        <p className="font-display text-[1.35rem] font-medium text-[var(--color-shadow)]">Starting eye scroll…</p>
        <ul className="flex flex-col items-start gap-2">
          {steps.map((s, i) => {
            const state = i < activeIdx ? "done" : i === activeIdx ? "active" : "pending";
            return (
              <li key={s.key} className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className={
                    state === "active"
                      ? "size-2 animate-pulse rounded-full bg-[var(--color-pine)]"
                      : state === "done"
                        ? "size-2 rounded-full bg-[var(--color-pine)]"
                        : "size-2 rounded-full border border-[var(--color-granite-line)]"
                  }
                />
                <span
                  className={`label-mono text-[0.7rem] ${
                    state === "pending" ? "text-[var(--color-granite-line)]" : "text-[var(--color-shadow)]"
                  }`}
                >
                  {s.label}
                  {state === "done" && " ✓"}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="max-w-xs text-pretty text-[0.78rem] leading-relaxed text-[var(--color-muted)]">
          First time takes a few seconds while the tracker downloads. Everything runs on your device — nothing is
          recorded or uploaded.
        </p>
        <button
          onClick={onDisable}
          className="label-mono text-[0.62rem] text-[var(--color-muted)] underline underline-offset-2 transition-colors hover:text-[var(--color-pine)]"
        >
          cancel (Esc)
        </button>
      </div>
    );
  }

  if (status === "denied" || status === "error") {
    return (
      <div className="fixed inset-x-0 top-4 z-[90] flex justify-center px-4">
        <div className="flex max-w-sm items-center gap-3 rounded-md border border-[var(--color-granite-line)] bg-[var(--color-card)] px-4 py-2.5 shadow-[0_8px_30px_-12px_rgba(60,64,73,0.4)]">
          <p className="text-[0.82rem] leading-snug text-[var(--color-muted)]">
            {status === "denied"
              ? "Eye scroll needs camera access, and it was blocked. Allow the camera in your browser, then try again."
              : "Eye scroll couldn't start. Your browser may not support it, or the model failed to load."}
          </p>
          <button
            onClick={onDisable}
            className="label-mono shrink-0 rounded-sm border border-[var(--color-granite-line)] px-2 py-1 text-[0.6rem] text-[var(--color-shadow)] transition duration-150 ease-[var(--ease-fast)] hover:border-[var(--color-pine)] hover:text-[var(--color-pine)] active:scale-95"
          >
            dismiss
          </button>
        </div>
      </div>
    );
  }

  if (status === "calibrating") {
    const dot = CALIB[Math.min(calibStep, CALIB.length - 1)];
    return (
      <div className="fixed inset-0 z-[90] bg-[color-mix(in_oklab,var(--color-sand)_70%,transparent)]">
        <div className="absolute inset-x-0 top-10 flex flex-col items-center gap-1 px-4 text-center">
          <p className="label-mono text-[0.66rem] text-[var(--color-pine)]">calibrate eye scroll · {calibStep + 1} / {CALIB.length}</p>
          <p className="font-display text-[1.05rem] font-medium text-[var(--color-shadow)]">Look at the dot, then click it.</p>
          <button
            onClick={onDisable}
            className="label-mono mt-1 text-[0.6rem] text-[var(--color-muted)] underline underline-offset-2 hover:text-[var(--color-pine)]"
          >
            cancel (Esc)
          </button>
        </div>
        <button
          key={dot.key}
          onClick={() => onCalibClick(dot.key)}
          aria-label={`Calibration dot: ${dot.label}`}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
        >
          <span className="relative flex size-7 items-center justify-center">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--color-pine)] opacity-50" aria-hidden />
            <span className="relative size-3.5 rounded-full border-2 border-[var(--color-sand)] bg-[var(--color-pine)] shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-pine)_22%,transparent)]" />
          </span>
        </button>
      </div>
    );
  }

  // active
  return (
    <div className="fixed inset-x-0 top-4 z-[90] flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-full border border-[var(--color-pine)] bg-[var(--color-card)] py-1.5 pl-3.5 pr-1.5 shadow-[0_8px_30px_-12px_rgba(60,64,73,0.45)]">
        <span className="relative flex size-2" aria-hidden>
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--color-pine)] opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-[var(--color-pine)]" />
        </span>
        <span className="label-mono text-[0.64rem] text-[var(--color-shadow)]">
          eye scroll on · look up / down · Esc to stop
        </span>
        <button
          onClick={onDisable}
          className="label-mono rounded-full bg-[var(--color-pine)] px-2.5 py-1 text-[0.6rem] text-[var(--color-on-dark)] transition duration-150 ease-[var(--ease-fast)] hover:bg-[var(--color-pine-deep)] active:scale-95"
        >
          Turn off
        </button>
      </div>
    </div>
  );
}
