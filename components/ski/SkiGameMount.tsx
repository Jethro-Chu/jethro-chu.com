"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { SKI_CONFIG } from "@/lib/ski/config";
import type { GamePhase, RunResults, PersonalBest, FailureReason } from "@/lib/ski/types";
import { SkiCourse } from "@/lib/ski/course";
import { SkiAudioEngine } from "@/lib/ski/audio";
import { RiceSimulation } from "@/lib/ski/ricePhysics";
import { SkierController } from "@/lib/ski/skierController";
import { SkiRenderer } from "@/lib/ski/renderer";
import { SkiScoringEngine } from "@/lib/ski/scoring";

export function SkiGameMount() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Engine refs
  const courseRef = useRef<SkiCourse | null>(null);
  const audioRef = useRef<SkiAudioEngine | null>(null);
  const riceRef = useRef<RiceSimulation | null>(null);
  const skierRef = useRef<SkierController | null>(null);
  const rendererRef = useRef<SkiRenderer | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Game state
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [countdownNumber, setCountdownNumber] = useState<number>(3);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [reducedShake, setReducedShake] = useState<boolean>(false);
  const [pointerLockActive, setPointerLockActive] = useState<boolean>(false);
  const [pointerLockSupported, setPointerLockSupported] = useState<boolean>(true);
  const [webglSupported, setWebglSupported] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      const canvas = document.createElement("canvas");
      return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    } catch {
      return false;
    }
  });
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);

  // HUD stats state
  const [grainsRemaining, setGrainsRemaining] = useState<number>(SKI_CONFIG.RICE.GRAIN_COUNT);
  const [platedCount, setPlatedCount] = useState<number>(0);
  const [speedKmh, setSpeedKmh] = useState<number>(0);
  const [progressFraction, setProgressFraction] = useState<number>(0);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [donenessPercent, setDonenessPercent] = useState<number>(0);
  const [burnPercent, setBurnPercent] = useState<number>(0);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [tossReady, setTossReady] = useState<boolean>(true);

  // Results & Personal Best
  const [runResults, setRunResults] = useState<RunResults | null>(null);
  const [personalBest, setPersonalBest] = useState<PersonalBest | null>(null);

  // Auto-finish timer for plating
  const platingTimerRef = useRef<number>(0);
  const timeElapsedRef = useRef<number>(0);
  const phaseRef = useRef<GamePhase>(phase);
  phaseRef.current = phase;

  const updatePhase = useCallback((newPhase: GamePhase) => {
    phaseRef.current = newPhase;
    setPhase(newPhase);
  }, []);

  // Detect mobile & pointer lock support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      setIsMobileDevice(isTouch);

      const hasPointerLock = "pointerLockElement" in document || "mozPointerLockElement" in document;
      setPointerLockSupported(hasPointerLock);

      setPersonalBest(SkiScoringEngine.getPersonalBest());

      // Check WebGL
      try {
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
        if (!gl) setWebglSupported(false);
      } catch {
        setWebglSupported(false);
      }
    }
  }, []);

  /**
   * Request Pointer Lock
   */
  const requestPointerLock = useCallback(() => {
    if (containerRef.current && pointerLockSupported) {
      try {
        const promise = containerRef.current.requestPointerLock() as unknown as Promise<void> | undefined;
        if (promise && typeof promise.catch === "function") {
          promise.catch(() => {
            // Pointer lock rejected or not allowed; seamlessly use mouse position fallback
          });
        }
      } catch {
        // Fallback gracefully to standard mouse tracking
      }
    }
  }, [pointerLockSupported]);

  /**
   * Start or Restart the run
   */
  const startRun = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new SkiAudioEngine();
    }
    audioRef.current.init();
    audioRef.current.setMuted(isMuted);

    if (riceRef.current) riceRef.current.reset();
    if (skierRef.current) skierRef.current.reset();

    platingTimerRef.current = 0;
    timeElapsedRef.current = 0;
    setPlatedCount(0);
    setGrainsRemaining(SKI_CONFIG.RICE.GRAIN_COUNT);
    setTimeElapsed(0);
    setRunResults(null);
    setWarningMessage(null);

    // Countdown sequence
    updatePhase("countdown");
    setCountdownNumber(3);
    audioRef.current.playCountdown(3);

    requestPointerLock();
  }, [isMuted, requestPointerLock, updatePhase]);

  // Countdown countdown loop
  useEffect(() => {
    if (phase !== "countdown") return;

    const timer = setInterval(() => {
      setCountdownNumber((prev) => {
        const next = prev - 1;
        if (next > 0) {
          if (audioRef.current) audioRef.current.playCountdown(next);
          return next;
        } else if (next === 0) {
          if (audioRef.current) audioRef.current.playCountdown(0);
          // Transition to active skiing!
          setTimeout(() => {
            updatePhase("skiing");
          }, 350);
          return 0;
        }
        return 0;
      });
    }, 900);

    return () => clearInterval(timer);
  }, [phase, updatePhase]);

  /**
   * Complete plating phase and grade run
   */
  const finishPlating = useCallback(
    (reason?: FailureReason) => {
      if (!riceRef.current) return;

      const results = SkiScoringEngine.evaluateRun(riceRef.current, timeElapsedRef.current, reason);
      setRunResults(results);
      setPersonalBest(SkiScoringEngine.getPersonalBest());

      if (reason) {
        updatePhase("failed");
        if (audioRef.current) audioRef.current.playFanfare(false);
      } else {
        updatePhase("result");
        if (audioRef.current) audioRef.current.playFanfare(results.grade !== "D");
      }

      if (document.exitPointerLock) {
        try {
          document.exitPointerLock();
        } catch {
          // Ignore
        }
      }
    },
    [updatePhase]
  );

  const finishPlatingRef = useRef(finishPlating);
  finishPlatingRef.current = finishPlating;

  const startRunRef = useRef(startRun);
  startRunRef.current = startRun;

  const requestPointerLockRef = useRef(requestPointerLock);
  requestPointerLockRef.current = requestPointerLock;

  /**
   * Initialize Three.js scene & animation loop
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !webglSupported) return;

    // Build modules
    const audio = new SkiAudioEngine();
    audioRef.current = audio;

    const course = new SkiCourse();
    courseRef.current = course;

    const rice = new RiceSimulation(audio);
    riceRef.current = rice;

    const skier = new SkierController(course, audio);
    skierRef.current = skier;

    let renderer: SkiRenderer | null = null;
    try {
      renderer = new SkiRenderer(container, course, skier, rice);
      rendererRef.current = renderer;
    } catch {
      setWebglSupported(false);
      return;
    }

    lastTimeRef.current = performance.now();

    // Input Handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!skierRef.current) return;

      if (e.code === "KeyA" || e.code === "ArrowLeft") {
        skierRef.current.input.steerLeft = true;
      } else if (e.code === "KeyD" || e.code === "ArrowRight") {
        skierRef.current.input.steerRight = true;
      } else if (e.code === "Space") {
        e.preventDefault();
        skierRef.current.input.tossPressed = true;
      } else if (e.code === "KeyR") {
        startRunRef.current();
      } else if (e.code === "Escape") {
        if (phaseRef.current === "skiing" || phaseRef.current === "plating") {
          if (document.exitPointerLock) {
            try {
              document.exitPointerLock();
            } catch {
              // Ignore
            }
          }
          updatePhase("paused");
        } else if (phaseRef.current === "paused") {
          requestPointerLockRef.current();
          updatePhase("skiing");
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!skierRef.current) return;

      if (e.code === "KeyA" || e.code === "ArrowLeft") {
        skierRef.current.input.steerLeft = false;
      } else if (e.code === "KeyD" || e.code === "ArrowRight") {
        skierRef.current.input.steerRight = false;
      } else if (e.code === "Space") {
        skierRef.current.input.tossPressed = false;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!skierRef.current) return;

      const isLocked = document.pointerLockElement === container;
      skierRef.current.input.pointerLocked = isLocked;

      if (isLocked) {
        skierRef.current.input.mouseDeltaX += e.movementX;
        skierRef.current.input.mouseDeltaY += e.movementY;
      } else {
        // Fallback: track mouse relative to center of canvas
        const rect = container.getBoundingClientRect();
        const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const normY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        skierRef.current.input.mouseNormalizedX = normX;
        skierRef.current.input.mouseNormalizedY = normY;
      }
    };

    const handlePointerLockChange = () => {
      const isLocked = document.pointerLockElement === container;
      setPointerLockActive(isLocked);
      if (skierRef.current) {
        skierRef.current.input.pointerLocked = isLocked;
      }
    };

    const handleBlur = () => {
      if (skierRef.current) {
        skierRef.current.clearInputs();
      }
    };

    const handleResize = () => {
      if (rendererRef.current && container) {
        rendererRef.current.resize(container.clientWidth, container.clientHeight);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("pointerlockchange", handlePointerLockChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("resize", handleResize);

    // Animation Tick
    const tick = (now: number) => {
      const rawDt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      const dt = Math.min(rawDt, 0.05); // clamp delta

      const curPhase = phaseRef.current;

      if (curPhase === "skiing" || curPhase === "plating") {
        timeElapsedRef.current += dt;
        setTimeElapsed(timeElapsedRef.current);

        // Update Skier & Pan
        const transition = skierRef.current?.update(dt, curPhase, () => {
          // Toss callback
          riceRef.current?.toss(curPhase === "plating" ? 0.6 : 1.0);
        });

        // Handle phase changes from controller (e.g. reach finish line or crash)
        if (transition?.phaseTransition) {
          if (transition.phaseTransition === "failed") {
            finishPlatingRef.current(transition.failureReason);
          } else if (transition.phaseTransition === "plating" && curPhase !== "plating") {
            updatePhase("plating");
          }
        } else if (riceRef.current && riceRef.current.retainedCount <= 0 && curPhase === "skiing") {
          // Check Empty Pan failure
          finishPlatingRef.current("empty_pan");
        } else if (
          riceRef.current &&
          (riceRef.current.avgBurnRisk >= SKI_CONFIG.COOKING.MAX_ALLOWABLE_BURN ||
            riceRef.current.charredFraction >= SKI_CONFIG.COOKING.MAX_CHARRED_FRACTION) &&
          curPhase === "skiing"
        ) {
          // Ruined batch: average burn is charred, or so many grains are
          // individually charred that raw grains cannot dilute it away
          finishPlatingRef.current("burnt_batch");
        } else if (curPhase === "plating") {
          // Plating timeout check
          platingTimerRef.current += dt;
          if (
            platingTimerRef.current >= SKI_CONFIG.PLATING.AUTO_FINISH_DELAY_SEC ||
            (riceRef.current && riceRef.current.retainedCount === 0)
          ) {
            finishPlatingRef.current();
          }
        }

        // Update HUD values
        if (riceRef.current && skierRef.current) {
          setGrainsRemaining(riceRef.current.retainedCount);
          setPlatedCount(riceRef.current.platedCount);
          setSpeedKmh(Math.round(skierRef.current.state.speed * 3.6));
          setProgressFraction(
            Math.min(1.0, skierRef.current.state.distance / (courseRef.current?.finishZ || 950))
          );
          setDonenessPercent(Math.round(riceRef.current.avgDoneness * 100));
          setBurnPercent(Math.round(riceRef.current.avgBurnRisk * 100));
          setTossReady(skierRef.current.tossCooldownTimer <= 0);

          // Warning indicators
          if (riceRef.current.avgBurnRisk > SKI_CONFIG.COOKING.WARNING_BURN_THRESHOLD) {
            setWarningMessage("⚠️ RICE BURNING! TOSS WITH SPACEBAR!");
          } else if (skierRef.current.cameraShakeIntensity > 0.4) {
            setWarningMessage("🌲 OBSTACLE JOLT! STEADY THE WOK!");
          } else {
            setWarningMessage(null);
          }
        }
      }

      // Render scene
      if (rendererRef.current) {
        rendererRef.current.render(dt, phaseRef.current);
      }

      animFrameIdRef.current = requestAnimationFrame(tick);
    };

    // Expose test hooks for automated verification suites
    if (typeof window !== "undefined") {
      (window as unknown as { __skiDev: unknown }).__skiDev = {
        triggerEmptyPan: () => {
          if (riceRef.current) {
            riceRef.current.retainedCount = 0;
            for (const g of riceRef.current.grains) g.retained = false;
          }
          finishPlatingRef.current("empty_pan");
        },
        triggerBurntBatch: () => {
          if (riceRef.current) {
            riceRef.current.avgBurnRisk = 0.55;
            for (const g of riceRef.current.grains) g.burnDamage = 0.6;
          }
          finishPlatingRef.current("burnt_batch");
        },
        advanceToFinish: () => {
          if (skierRef.current && courseRef.current) {
            skierRef.current.state.distance = courseRef.current.finishZ;
            skierRef.current.state.speed = 0;
          }
          updatePhase("plating");
        },
        triggerPlatingPour: () => {
          if (skierRef.current) {
            // Negative pitch tips the pan's front edge down to pour.
            skierRef.current.panOrientation.pitch = -0.85;
          }
        },
        simulatePlatedGrains: (count = 265, doneness = 0.96, burn = 0.03) => {
          if (riceRef.current) {
            riceRef.current.platedCount = count;
            for (let i = 0; i < count; i++) {
              riceRef.current.spilledParticles.push({
                x: 0,
                y: 0,
                z: 0,
                vx: 0,
                vy: 0,
                vz: 0,
                life: 10,
                maxLife: 10,
                doneness,
                burnDamage: burn,
                settled: true,
                onPlate: true,
              });
            }
          }
        },
        finishPlating: () => {
          finishPlatingRef.current();
        },
        getState: () => ({
          phase: phaseRef.current,
          retained: riceRef.current?.retainedCount ?? 0,
          plated: riceRef.current?.platedCount ?? 0,
          distance: skierRef.current?.state.distance ?? 0,
        }),
      };
    }

    animFrameIdRef.current = requestAnimationFrame(tick);

    // CLEANUP
    return () => {
      delete (window as unknown as { __skiDev?: unknown }).__skiDev;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("pointerlockchange", handlePointerLockChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("resize", handleResize);

      if (audioRef.current) audioRef.current.dispose();
      if (rendererRef.current) rendererRef.current.dispose();
      if (document.exitPointerLock) {
        try {
          document.exitPointerLock();
        } catch {
          // Ignore
        }
      }
    };
  }, [updatePhase, webglSupported]);

  // Sync options to controller/audio
  useEffect(() => {
    if (audioRef.current) audioRef.current.setMuted(isMuted);
  }, [isMuted]);

  useEffect(() => {
    if (skierRef.current) skierRef.current.reducedCameraShake = reducedShake;
  }, [reducedShake]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#d9ebf7] select-none font-sans">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        onClick={() => {
          if (phase === "skiing" || phase === "plating") {
            requestPointerLock();
          }
        }}
        className="absolute inset-0 cursor-crosshair outline-none"
      />

      {/* Top Navigation Bar: Back to Portfolio & Quick Controls */}
      <header className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
        <Link
          href="/"
          className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#2b2114]/85 text-[#ece4d3] text-xs font-mono font-medium tracking-wide shadow-md backdrop-blur-sm hover:bg-[#3e5c46] hover:text-white transition-colors"
        >
          <span>←</span>
          <span>Portfolio</span>
        </Link>

        {/* Audio Mute & Shake Toggles */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => setIsMuted((m) => !m)}
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
            className="px-2.5 py-1.5 rounded-md bg-[#2b2114]/85 text-[#ece4d3] text-xs font-mono shadow backdrop-blur-sm hover:bg-[#3c4049] transition-colors"
          >
            {isMuted ? "🔇 MUTED" : "🔊 SOUND"}
          </button>
          <button
            onClick={() => setReducedShake((s) => !s)}
            className="px-2.5 py-1.5 rounded-md bg-[#2b2114]/85 text-[#ece4d3] text-xs font-mono shadow backdrop-blur-sm hover:bg-[#3c4049] transition-colors"
          >
            {reducedShake ? "STABLE CAM" : "CAM SHAKE"}
          </button>
        </div>
      </header>

      {/* IN-GAME HUD (Skiing & Plating) */}
      {(phase === "skiing" || phase === "plating" || phase === "countdown") && (
        <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-6 pt-16">
          {/* Top HUD: Grains, Progress Bar, Speed, Timer */}
          <div className="flex items-start justify-between">
            {/* Left: Grains Remaining */}
            <div className="bg-[#2b2114]/85 backdrop-blur-md rounded-lg p-3 px-4 shadow-lg border border-[#c5beb1]/20">
              <div className="text-[10px] uppercase font-mono tracking-wider text-[#b9b0a0]">
                {phase === "plating" ? "Plated / Retained" : "Grains Remaining"}
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-mono font-bold text-[#ece4d3]">
                  {phase === "plating" ? platedCount : grainsRemaining}
                </span>
                <span className="text-xs font-mono text-[#b9b0a0]">/ 300</span>
                {phase === "plating" && (
                  <span className="text-xs font-mono text-[#c98f45]">
                    ({Math.round((platedCount / 300) * 100)}%)
                  </span>
                )}
              </div>
            </div>

            {/* Center: Course Progress Bar */}
            <div className="hidden sm:flex flex-col items-center bg-[#2b2114]/85 backdrop-blur-md rounded-lg p-3 px-6 shadow-lg border border-[#c5beb1]/20 w-72">
              <div className="flex justify-between w-full text-[10px] font-mono tracking-wider text-[#b9b0a0] mb-1.5">
                <span>START</span>
                <span className="text-[#ece4d3] font-bold">
                  {phase === "plating" ? "FINISH PLATE" : `${Math.round(progressFraction * 100)}%`}
                </span>
                <span>FINISH</span>
              </div>
              <div className="w-full h-2.5 bg-[#1a150e] rounded-full overflow-hidden p-0.5 border border-[#c5beb1]/20">
                <div
                  className="h-full bg-gradient-to-r from-[#3e5c46] to-[#c98f45] rounded-full transition-all duration-150"
                  style={{ width: `${Math.max(3, progressFraction * 100)}%` }}
                />
              </div>
            </div>

            {/* Right: Stopwatch & Speedometer */}
            <div className="bg-[#2b2114]/85 backdrop-blur-md rounded-lg p-3 px-4 shadow-lg border border-[#c5beb1]/20 text-right">
              <div className="text-[10px] uppercase font-mono tracking-wider text-[#b9b0a0]">
                Time & Speed
              </div>
              <div className="flex items-baseline gap-3 mt-0.5">
                <span className="text-2xl font-mono font-bold text-[#ece4d3]">
                  {timeElapsed.toFixed(1)}s
                </span>
                <span className="text-xs font-mono text-[#c98f45] font-semibold">
                  {speedKmh} km/h
                </span>
              </div>
            </div>
          </div>

          {/* Warning Banner (Center Screen Toast) */}
          {warningMessage && (
            <div className="self-center bg-[#bf2626]/90 text-white font-mono text-xs sm:text-sm font-bold tracking-wide px-5 py-2 rounded-full shadow-xl animate-bounce border border-white/30">
              {warningMessage}
            </div>
          )}

          {/* Lower Floating HUD: Cooking Gauges & Toss Indicator */}
          <div className="flex items-end justify-between">
            {/* Left: Toss readiness */}
            <div className="bg-[#2b2114]/85 backdrop-blur-md rounded-lg p-2.5 px-3.5 shadow-lg border border-[#c5beb1]/20">
              <div className="text-[10px] uppercase font-mono tracking-wider text-[#b9b0a0]">
                Spacebar Toss
              </div>
              <div className="text-xs font-mono font-semibold text-[#ece4d3] mt-0.5 flex items-center gap-1.5">
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${
                    tossReady ? "bg-emerald-400" : "bg-amber-500 animate-pulse"
                  }`}
                />
                {tossReady ? "READY [SPACE]" : "COOLING..."}
              </div>
            </div>

            {/* Right: Cooking Doneness & Burn Gauges */}
            <div className="bg-[#2b2114]/85 backdrop-blur-md rounded-lg p-3 px-4 shadow-lg border border-[#c5beb1]/20 w-64">
              {/* Doneness */}
              <div className="mb-2">
                <div className="flex justify-between text-[10px] font-mono tracking-wider text-[#b9b0a0] mb-1">
                  <span>DONENESS</span>
                  <span className="text-[#ece4d3] font-bold">{donenessPercent}%</span>
                </div>
                <div className="w-full h-2 bg-[#1a150e] rounded-full overflow-hidden border border-[#c5beb1]/20">
                  <div
                    className="h-full bg-gradient-to-r from-amber-200 to-amber-500 rounded-full transition-all duration-100"
                    style={{ width: `${donenessPercent}%` }}
                  />
                </div>
              </div>

              {/* Burn Risk */}
              <div>
                <div className="flex justify-between text-[10px] font-mono tracking-wider text-[#b9b0a0] mb-1">
                  <span>BURN DAMAGE</span>
                  <span
                    className={`font-mono font-bold ${
                      burnPercent > 10 ? "text-red-400" : "text-[#b9b0a0]"
                    }`}
                  >
                    {burnPercent}%
                  </span>
                </div>
                <div className="w-full h-2 bg-[#1a150e] rounded-full overflow-hidden border border-[#c5beb1]/20">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-red-600 rounded-full transition-all duration-100"
                    style={{ width: `${burnPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PLATING PHASE PROMPT (At finish line). The skier rolls ~35 m
          into the serving area after crossing the finish; inviting the
          pour immediately made players dump the pan on the snow, so the
          pour instructions wait until the skier has nearly stopped. */}
      {phase === "plating" && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-40 pointer-events-auto flex flex-col items-center gap-2">
          <div className="bg-[#2b2114]/95 text-[#ece4d3] px-6 py-3 rounded-xl border border-[#c98f45]/50 shadow-2xl backdrop-blur-md text-center max-w-md">
            <h3 className="font-mono text-sm tracking-widest text-[#c98f45] uppercase font-bold">
              {speedKmh > 2 ? "Rolling Into The Serving Area…" : "Serving Platter Reached!"}
            </h3>
            <p className="font-sans text-xs text-[#ece4d3]/90 mt-1">
              {speedKmh > 2
                ? "Glide to a stop at the banquet table. Keep the pan level!"
                : "Move mouse forward / tilt down to pour rice onto the golden banquet plate!"}
            </p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <button
                onClick={() => finishPlating()}
                className="px-4 py-1.5 rounded-md bg-[#3e5c46] hover:bg-[#2c4334] text-white text-xs font-mono font-bold tracking-wider shadow transition-all active:scale-95"
              >
                COMPLETE & GRADE DISH
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COUNTDOWN OVERLAY */}
      {phase === "countdown" && (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className="text-8xl sm:text-9xl font-mono font-extrabold text-[#2b2114] drop-shadow-2xl animate-pulse">
            {countdownNumber === 0 ? "WOK!" : countdownNumber}
          </div>
        </div>
      )}

      {/* TITLE / READY SCREEN */}
      {phase === "ready" && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-[#2b2114]/75 backdrop-blur-md">
          <div className="bg-[#f4efe3] text-[#3c4049] rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-[#c5beb1]/60">
            <div className="text-center">
              <span className="inline-block px-3 py-1 rounded-full bg-[#3e5c46]/15 text-[#3e5c46] text-xs font-mono font-semibold tracking-widest uppercase mb-2">
                3D Downhill Culinary Challenge
              </span>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#2b2114] tracking-tight">
                Wok This Slope
              </h1>
              <p className="text-xs sm:text-sm text-[#5e5749] mt-2 font-sans leading-relaxed">
                Fry 300 grains of rice in a skillet on mini-skis while hurtling down an alpine
                mountain. Balance inertia, avoid trees, cook without burning, and plate your dish at
                the bottom!
              </p>
            </div>

            {/* Controls Guide */}
            <div className="mt-6 bg-[#ede6d6] rounded-xl p-4 border border-[#c5beb1]/40 text-xs font-mono space-y-2">
              <div className="text-[#3e5c46] font-bold tracking-wider uppercase text-[10px]">
                Skier Controls
              </div>
              <div className="grid grid-cols-2 gap-2 text-[#3c4049]">
                <div>
                  <span className="font-bold">A / D</span> or <span className="font-bold">← / →</span>: Steer
                </div>
                <div>
                  <span className="font-bold">Mouse</span>: Tilt pan balance
                </div>
                <div>
                  <span className="font-bold">Space</span>: Toss & flip rice
                </div>
                <div>
                  <span className="font-bold">Esc</span>: Pause / Release
                </div>
              </div>
            </div>

            {/* S-Rank Scoring Requirements */}
            <div className="mt-4 bg-[#ede6d6] rounded-xl p-3 border border-[#c5beb1]/40 text-[11px] font-mono text-[#5e5749]">
              <span className="font-bold text-[#c98f45]">S-Rank Target:</span> ≥85% rice plated, ≥95%
              doneness, ≤5% burn, within 80s.
            </div>

            {/* Personal Best Display */}
            {personalBest && (
              <div className="mt-3 flex items-center justify-between text-xs font-mono px-2 text-[#5e5749]">
                <span>Personal Best:</span>
                <span className="font-bold text-[#3e5c46]">
                  Grade {personalBest.grade} · {personalBest.score.toLocaleString()} pts ({personalBest.platedPercent}% plated)
                </span>
              </div>
            )}

            {/* Start Button */}
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={startRun}
                className="w-full py-3.5 rounded-xl bg-[#3e5c46] hover:bg-[#2c4334] text-white font-mono font-bold text-sm tracking-wider uppercase shadow-lg transition-all active:scale-[0.98]"
              >
                Start Skiing (Click to Lock Mouse)
              </button>
              <div className="text-center text-[10px] font-mono text-[#5e5749]/80 mt-1">
                Tip: Press <kbd className="px-1 py-0.5 bg-white rounded border">Esc</kbd> anytime to
                pause and release mouse cursor.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAUSE MENU */}
      {phase === "paused" && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-[#2b2114]/80 backdrop-blur-md">
          <div className="bg-[#f4efe3] text-[#3c4049] rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-[#c5beb1]/60 text-center">
            <h2 className="text-2xl font-serif font-bold text-[#2b2114]">Run Paused</h2>
            <p className="text-xs font-mono text-[#5e5749] mt-1">Take a breath. The wok is frozen in time.</p>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                onClick={() => {
                  requestPointerLock();
                  updatePhase("skiing");
                }}
                className="w-full py-2.5 rounded-lg bg-[#3e5c46] hover:bg-[#2c4334] text-white font-mono font-bold text-xs tracking-wider uppercase transition-all"
              >
                Resume Run
              </button>
              <button
                onClick={startRun}
                className="w-full py-2.5 rounded-lg bg-[#2b2114] hover:bg-[#3c4049] text-[#ece4d3] font-mono font-bold text-xs tracking-wider uppercase transition-all"
              >
                Restart (R)
              </button>
              <Link
                href="/"
                className="w-full py-2.5 rounded-lg border border-[#c5beb1] hover:bg-[#ede6d6] text-[#3c4049] font-mono font-bold text-xs tracking-wider uppercase transition-all text-center"
              >
                Back to Portfolio
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* RESULTS SCREEN (Graded Completion) */}
      {phase === "result" && runResults && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-[#2b2114]/80 backdrop-blur-md">
          <div className="bg-[#f4efe3] text-[#3c4049] rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-[#c5beb1]/60 text-center relative overflow-hidden">
            {/* Rank badge */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#2b2114] text-[#ece4d3] shadow-xl border-2 border-[#c98f45] mb-3">
              <span
                className={`text-5xl font-mono font-extrabold ${
                  runResults.grade === "S"
                    ? "text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]"
                    : runResults.grade === "A"
                    ? "text-emerald-400"
                    : runResults.grade === "B"
                    ? "text-amber-400"
                    : "text-[#ece4d3]"
                }`}
              >
                {runResults.grade}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#2b2114]">
              {runResults.title}
            </h2>
            <p className="text-xs sm:text-sm text-[#5e5749] mt-2 font-sans px-4">
              {runResults.summary}
            </p>

            {/* Results Data Table */}
            <div className="mt-5 bg-[#ede6d6] rounded-xl p-4 border border-[#c5beb1]/40 text-xs font-mono space-y-2 text-left">
              <div className="flex justify-between border-b border-[#c5beb1]/40 pb-1.5">
                <span className="text-[#5e5749]">Plated Rice:</span>
                <span className="font-bold text-[#2b2114]">
                  {runResults.platedGrains} / {runResults.startingGrains} ({runResults.platedPercent}%)
                </span>
              </div>
              <div className="flex justify-between border-b border-[#c5beb1]/40 pb-1.5">
                <span className="text-[#5e5749]">Cooking Doneness:</span>
                <span className="font-bold text-[#2b2114]">{runResults.avgDoneness}%</span>
              </div>
              <div className="flex justify-between border-b border-[#c5beb1]/40 pb-1.5">
                <span className="text-[#5e5749]">Burn Damage:</span>
                <span className="font-bold text-[#2b2114]">{runResults.avgBurnDamage}%</span>
              </div>
              <div className="flex justify-between border-b border-[#c5beb1]/40 pb-1.5">
                <span className="text-[#5e5749]">Course Time:</span>
                <span className="font-bold text-[#2b2114]">{runResults.timeElapsed.toFixed(1)}s</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-[#3e5c46] font-bold">Final Score:</span>
                <span className="font-bold text-base text-[#3e5c46]">
                  {runResults.score.toLocaleString()} pts
                  {runResults.isPersonalBest && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-emerald-600 text-white font-mono">
                      NEW BEST!
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={startRun}
                className="flex-1 py-3 rounded-xl bg-[#3e5c46] hover:bg-[#2c4334] text-white font-mono font-bold text-xs tracking-wider uppercase shadow-md transition-all active:scale-[0.98]"
              >
                Play Again (R)
              </button>
              <Link
                href="/"
                className="flex-1 py-3 rounded-xl border border-[#c5beb1] hover:bg-[#ede6d6] text-[#3c4049] font-mono font-bold text-xs tracking-wider uppercase shadow-sm transition-all text-center flex items-center justify-center"
              >
                Portfolio
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* FAILURE SCREEN (Crash / Empty Pan / Burnt) */}
      {phase === "failed" && runResults && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-[#2b2114]/85 backdrop-blur-md">
          <div className="bg-[#f4efe3] text-[#3c4049] rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-red-300 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 text-3xl font-mono font-bold mb-3 border border-red-300">
              ✗
            </div>
            <h2 className="text-2xl font-serif font-bold text-[#2b2114]">
              {runResults.title}
            </h2>
            <p className="text-xs sm:text-sm text-[#5e5749] mt-2 font-sans px-2">
              {runResults.summary}
            </p>

            <div className="mt-5 bg-[#ede6d6] rounded-xl p-3 border border-[#c5beb1]/40 text-xs font-mono text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#5e5749]">Grade:</span>
                <span className="font-bold text-red-600">D (Disqualified)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5e5749]">Distance reached:</span>
                <span className="font-bold text-[#2b2114]">{Math.round(progressFraction * 100)}% of course</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5e5749]">Grains remaining:</span>
                <span className="font-bold text-[#2b2114]">{grainsRemaining} / 300</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={startRun}
                className="flex-1 py-3 rounded-xl bg-[#bf2626] hover:bg-[#991b1b] text-white font-mono font-bold text-xs tracking-wider uppercase shadow-md transition-all active:scale-[0.98]"
              >
                Retry Run (R)
              </button>
              <Link
                href="/"
                className="flex-1 py-3 rounded-xl border border-[#c5beb1] hover:bg-[#ede6d6] text-[#3c4049] font-mono font-bold text-xs tracking-wider uppercase shadow-sm transition-all text-center flex items-center justify-center"
              >
                Portfolio
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* WebGL Not Supported Fallback */}
      {!webglSupported && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-[#2b2114] text-[#ece4d3] text-center">
          <div className="max-w-md">
            <h2 className="text-2xl font-serif font-bold mb-2">WebGL Unavailable</h2>
            <p className="text-xs font-mono text-[#b9b0a0]">
              Wok This Slope requires hardware-accelerated 3D WebGL to simulate 300 physics-driven rice
              grains. Please enable WebGL in your browser settings.
            </p>
            <Link
              href="/"
              className="inline-block mt-4 px-4 py-2 bg-[#3e5c46] rounded-md font-mono text-xs text-white"
            >
              Back to Portfolio
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
