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
import "./ski-ui.css";

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
  const [engineReady, setEngineReady] = useState(false);
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
  const crashTimerRef = useRef<number>(0);
  const crashReasonRef = useRef<FailureReason>("tree_crash");
  const timeElapsedRef = useRef<number>(0);
  const phaseRef = useRef<GamePhase>(phase);
  const pausedFromRef = useRef<"skiing" | "plating">("skiing");
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
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setReducedShake(true);

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
    if (!rendererRef.current || !riceRef.current || !skierRef.current) return;
    if (!audioRef.current) {
      audioRef.current = new SkiAudioEngine();
    }
    audioRef.current.init();
    audioRef.current.setMuted(isMuted);

    if (riceRef.current) riceRef.current.reset();
    if (skierRef.current) {
      skierRef.current.clearInputs();
      skierRef.current.reset();
    }
    rendererRef.current?.resetCrash();

    platingTimerRef.current = 0;
    crashTimerRef.current = 0;
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

  // A cancellable timeout prevents an old countdown from starting a new run
  // after a restart or unmount.
  useEffect(() => {
    if (phase !== "countdown") return;
    const timer = window.setTimeout(() => {
      if (countdownNumber === 0) {
        updatePhase("skiing");
      } else {
        const next = countdownNumber - 1;
        audioRef.current?.playCountdown(next);
        setCountdownNumber(next);
      }
    }, countdownNumber === 0 ? 350 : 900);
    return () => window.clearTimeout(timer);
  }, [phase, countdownNumber, updatePhase]);

  /**
   * Complete plating phase and grade run
   */
  const finishPlating = useCallback(
    (reason?: FailureReason) => {
      if (!riceRef.current) return;

      const results = SkiScoringEngine.evaluateRun(riceRef.current, timeElapsedRef.current, reason);
      setRunResults(results);
      setPersonalBest(SkiScoringEngine.getPersonalBest());
      audioRef.current?.stopAll();

      if (reason) {
        updatePhase("failed");
        if (audioRef.current) audioRef.current.playFanfare(false);
      } else {
        updatePhase("result");
        if (audioRef.current) audioRef.current.playFanfare(results.grade !== "D", results.grade === "S");
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
        if (!e.repeat && (phaseRef.current === "skiing" || phaseRef.current === "plating")) {
          skierRef.current.input.tossPressed = true;
        }
      } else if (e.code === "KeyR") {
        startRunRef.current();
      } else if (e.code === "Escape") {
        if (phaseRef.current === "skiing" || phaseRef.current === "plating") {
          pausedFromRef.current = phaseRef.current;
          skierRef.current.clearInputs();
          audioRef.current?.stopAll();
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
          updatePhase(pausedFromRef.current);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!skierRef.current) return;

      if (e.code === "KeyA" || e.code === "ArrowLeft") {
        skierRef.current.input.steerLeft = false;
      } else if (e.code === "KeyD" || e.code === "ArrowRight") {
        skierRef.current.input.steerRight = false;
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
          if (transition.phaseTransition === "crashing") {
            crashReasonRef.current = transition.failureReason ?? "tree_crash";
            crashTimerRef.current = 0;
            rendererRef.current?.beginCrash();
            updatePhase("crashing");
          } else if (transition.phaseTransition === "failed") {
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
          if (skierRef.current && skierRef.current.state.speed <= 2 / 3.6) {
            platingTimerRef.current += dt;
          }
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
            setWarningMessage("RICE BURNING. TOSS WITH SPACEBAR!");
          } else if (skierRef.current.cameraShakeIntensity > 0.4) {
            setWarningMessage("OBSTACLE JOLT. STEADY THE WOK!");
          } else {
            setWarningMessage(null);
          }
        }
      } else if (curPhase === "crashing") {
        crashTimerRef.current += dt;
        if (crashTimerRef.current >= 1.8) finishPlatingRef.current(crashReasonRef.current);
      }

      // Render scene
      if (rendererRef.current) {
        rendererRef.current.render(dt, phaseRef.current);
      }

      animFrameIdRef.current = requestAnimationFrame(tick);
    };

    // Expose test hooks for automated verification suites
    if (process.env.NODE_ENV === "development") {
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
        // Developer scenario: move to an obstacle, then let the actual
        // controller and renderer handle the collision on subsequent frames.
        approachObstacle: (type: "pine" | "rock" | "log") => {
          const course = courseRef.current;
          const skier = skierRef.current;
          const obstacle = course?.obstacles.find((o) => o.type === type && o.distance > 100 && o.distance < course.finishZ - 60 && Math.abs(o.lateralOffset - course.getTrackCenter(o.distance).x) < course.width / 2 - 2);
          if (!course || !skier || !obstacle || phaseRef.current !== "skiing") return false;
          const distance = obstacle.distance - 3;
          skier.state.distance = distance;
          skier.state.lateralOffset = obstacle.lateralOffset - course.getTrackCenter(distance).x;
          skier.state.lateralSpeed = 0;
          skier.state.speed = 10;
          return true;
        },
        getState: () => ({
          phase: phaseRef.current,
          retained: riceRef.current?.retainedCount ?? 0,
          plated: riceRef.current?.platedCount ?? 0,
          distance: skierRef.current?.state.distance ?? 0,
          lateral: skierRef.current?.state.lateralOffset ?? 0,
          speed: skierRef.current?.state.speed ?? 0,
          elapsed: timeElapsedRef.current,
          crash: skierRef.current?.crashImpact?.obstacle ?? null,
          crashTime: crashTimerRef.current,
        }),
      };
    }

    setEngineReady(true);
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
    <div className="ski-game ski-shell">
      <div
        ref={containerRef}
        onClick={() => {
          if (phase === "skiing" || phase === "plating") requestPointerLock();
        }}
        className="ski-canvas"
      />

      <header className="ski-nav" aria-label="Game controls">
        <Link href="/" className="ski-nav-link"><span aria-hidden="true">←</span> Portfolio</Link>
        <span className="ski-nav-name" aria-hidden="true">WOK THIS SLOPE <span> / </span> DOWNHILL SERVICE</span>
        <div className="ski-nav-options">
          <button onClick={() => setIsMuted((m) => !m)} aria-label={isMuted ? "Unmute audio" : "Mute audio"} aria-pressed={isMuted}>
            SOUND <span>{isMuted ? "OFF" : "ON"}</span>
          </button>
          <button onClick={() => setReducedShake((s) => !s)} aria-label="Reduce camera shake" aria-pressed={reducedShake}>
            SHAKE <span>{reducedShake ? "OFF" : "ON"}</span>
          </button>
        </div>
      </header>

      {(phase === "skiing" || phase === "plating" || phase === "countdown") && (
        <div className="ski-hud" aria-label="Run status">
          <div className="ski-hud-top">
            <div className="ski-instrument ski-grains">
              <span className="ski-label">{phase === "plating" ? "Plated / Retained" : "Grains Remaining"}</span>
              <div className="ski-number">{phase === "plating" ? platedCount : grainsRemaining}<span> / 300</span></div>
            </div>
            <div className="ski-instrument ski-progress">
              <div className="ski-progress-head"><span>START</span><strong>{phase === "plating" ? "FINISH PLATE" : `${Math.round(progressFraction * 100)}%`}</strong><span>FINISH</span></div>
              <div className="ski-progress-track"><span style={{ width: `${Math.max(1, progressFraction * 100)}%` }} /></div>
            </div>
            <div className="ski-instrument ski-timer">
              <span className="ski-label">Time & Speed</span>
              <div className="ski-number">{timeElapsed.toFixed(1)}<span> sec</span></div>
              <span className="ski-speed">{speedKmh} KM/H</span>
            </div>
          </div>

          {warningMessage && <div className="ski-alert" role="status">{warningMessage.replace(/^[^A-Z]+/, "")}</div>}

          <div className="ski-hud-bottom">
            <div className="ski-instrument ski-toss">
              <span className="ski-label">Spacebar Toss</span>
              <div className="ski-toss-state"><span aria-hidden="true" className={tossReady ? "ski-ready" : "ski-cooling"} />{tossReady ? "READY [SPACE]" : "COOLING"}</div>
            </div>
            <div className="ski-instrument ski-cooking">
              <div className="ski-cooking-title"><span>THE PAN</span><span>COOK MONITOR</span></div>
              <div className="ski-gauge">
                <div><span>DONENESS</span><strong>{donenessPercent}%</strong></div>
                <div className="ski-gauge-track"><span className="ski-gauge-cooked" style={{ width: `${donenessPercent}%` }} /></div>
              </div>
              <div className="ski-gauge">
                <div><span>BURN DAMAGE</span><strong>{burnPercent}%</strong></div>
                <div className="ski-gauge-track"><span className="ski-gauge-burn" style={{ width: `${burnPercent}%` }} /></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {phase === "plating" && (
        <div className="ski-serve" role="status">
          <span className="ski-serve-step">03 / SERVICE</span>
          <h2>{speedKmh > 2 ? "Rolling Into The Serving Area…" : "Serving Platter Reached!"}</h2>
          <p>{speedKmh > 2 ? "Glide to a stop. Keep the pan level." : "Move the mouse forward to pour onto the plate."}</p>
          <button onClick={() => finishPlating()} disabled={speedKmh > 2} className="ski-button ski-button-light">COMPLETE &amp; GRADE DISH <span aria-hidden="true">↗</span></button>
        </div>
      )}

      {phase === "countdown" && <div className="ski-countdown" aria-live="polite">{countdownNumber === 0 ? "WOK!" : countdownNumber}</div>}

      {phase === "ready" && (
        <div className="ski-overlay">
          <section className="ski-start-sheet" aria-labelledby="ski-title">
            <div className="ski-sheet-header"><span>DOWNHILL SERVICE <b>01</b></span><span>THE ALPINE RICE TRIAL</span></div>
            <div className="ski-start-main">
              <div className="ski-intro">
                <p className="ski-eyebrow"><span aria-hidden="true" /> ONE SLOPE. ONE PAN.</p>
                <h1 id="ski-title">Wok This Slope</h1>
                <p className="ski-deck">Fry rice. Ski downhill.<br />Try to keep it in the pan.</p>
                <p className="ski-intro-copy">Get 300 grains to the plate at the bottom. Toss to cook evenly and find the gaps in the barriers.</p>
                {isMobileDevice && <p className="ski-device-note">This run requires a keyboard and mouse.</p>}
              </div>
              <div className="ski-briefing">
                <div className="ski-brief-heading"><span>THE BRIEFING</span><span>01 / 03</span></div>
                <div className="ski-brief-row"><span>01</span><div><strong>STEER THE SLOPE</strong><p><kbd>A</kbd> / <kbd>D</kbd> or arrows</p></div></div>
                <div className="ski-brief-row"><span>02</span><div><strong>KEEP THE PAN LEVEL</strong><p>Move your mouse to balance.</p></div></div>
                <div className="ski-brief-row"><span>03</span><div><strong>FRY, THEN SERVE</strong><p><kbd>SPACE</kbd> tosses the rice. Tip forward to plate.</p></div></div>
                <div className="ski-target"><span>S-RANK TARGET</span><p>≥85% plated · ≥95% cooked<br />≤5% burn · under 80 seconds</p></div>
              </div>
            </div>
            {personalBest && <div className="ski-personal-best"><span>PERSONAL BEST</span><strong>GRADE {personalBest.grade} · {personalBest.score.toLocaleString()} PTS · {personalBest.platedPercent}% PLATED</strong></div>}
            <div className="ski-sheet-footer">
              <p>Short turns. Regular tosses. <span>Esc pauses the run.</span></p>
              <button onClick={startRun} disabled={!engineReady} className="ski-button ski-button-primary">
                {engineReady ? "Start Skiing (Click to Lock Mouse)" : "Preparing the slope…"}<span aria-hidden="true">↗</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {phase === "paused" && (
        <div className="ski-overlay">
          <section className="ski-result-sheet ski-pause-sheet" aria-labelledby="ski-pause-title">
            <div className="ski-sheet-header"><span>DOWNHILL SERVICE</span><span>PAUSED</span></div>
            <div className="ski-pause-body"><p className="ski-eyebrow">RUN ON HOLD</p><h2 id="ski-pause-title">Run Paused</h2><p>The wok is frozen in time.</p></div>
            <div className="ski-result-actions">
              <button onClick={() => { requestPointerLock(); updatePhase(pausedFromRef.current); }} className="ski-button ski-button-primary">Resume Run <span aria-hidden="true">→</span></button>
              <button onClick={startRun} className="ski-button ski-button-outline">Restart (R)</button>
              <Link href="/" className="ski-text-link">Back to Portfolio</Link>
            </div>
          </section>
        </div>
      )}

      {phase === "result" && runResults && (
        <div className="ski-overlay">
          <section className="ski-result-sheet" aria-labelledby="ski-result-title">
            {runResults.grade === "S" && <div aria-hidden="true" className="ski-confetti-wrap">{Array.from({ length: 22 }, (_, i) => <span className="ski-confetti" key={i} style={{ left: `${4 + (i * 37) % 92}%`, animationDelay: `${(i % 8) * .08}s` }} />)}</div>}
            <div className="ski-sheet-header"><span>DOWNHILL SERVICE</span><span>FINAL REPORT / 01</span></div>
            <div className="ski-result-intro">
              <div><p className="ski-eyebrow">{runResults.grade === "S" ? "SUMMIT SERVICE · S RANK" : "SERVICE COMPLETE"}</p><h2 id="ski-result-title">{runResults.title}</h2><p>{runResults.summary}</p></div>
              <div className="ski-grade" aria-label={`Grade ${runResults.grade}`}>{runResults.grade}<span>RANK</span></div>
            </div>
            <div className="ski-result-table">
              <div><span>Plated Rice:</span><strong>{runResults.platedGrains} / {runResults.startingGrains} <small>({runResults.platedPercent}%)</small></strong></div>
              <div><span>Cooking Doneness:</span><strong>{runResults.avgDoneness}%</strong></div>
              <div><span>Burn Damage:</span><strong>{runResults.avgBurnDamage}%</strong></div>
              <div><span>Course Time:</span><strong>{runResults.timeElapsed.toFixed(1)}s</strong></div>
              <div className="ski-score"><span>Final Score:</span><strong>{runResults.score.toLocaleString()} pts {runResults.isPersonalBest && <small>NEW BEST</small>}</strong></div>
            </div>
            <div className="ski-result-actions ski-result-actions-row"><button onClick={startRun} className="ski-button ski-button-primary">Play Again (R) <span aria-hidden="true">↗</span></button><Link href="/" className="ski-button ski-button-outline">Portfolio <span aria-hidden="true">→</span></Link></div>
          </section>
        </div>
      )}

      {phase === "failed" && runResults && (
        <div className="ski-overlay">
          <section className="ski-result-sheet" aria-labelledby="ski-fail-title">
            <div className="ski-sheet-header"><span>DOWNHILL SERVICE</span><span>RUN ENDED / 01</span></div>
            <div className="ski-result-intro"><div><p className="ski-eyebrow ski-fail-label">SERVICE INTERRUPTED</p><h2 id="ski-fail-title">{runResults.title}</h2><p>{runResults.summary}</p></div><div className="ski-grade ski-grade-fail" aria-label="Grade D">D<span>RANK</span></div></div>
            <div className="ski-result-table"><div><span>Grade:</span><strong>D (Disqualified)</strong></div><div><span>Distance reached:</span><strong>{Math.round(progressFraction * 100)}% of course</strong></div><div><span>Grains remaining:</span><strong>{grainsRemaining} / 300</strong></div></div>
            <div className="ski-result-actions ski-result-actions-row"><button onClick={startRun} className="ski-button ski-button-primary">Retry Run (R) <span aria-hidden="true">↗</span></button><Link href="/" className="ski-button ski-button-outline">Portfolio <span aria-hidden="true">→</span></Link></div>
          </section>
        </div>
      )}

      {!webglSupported && (
        <div className="ski-overlay ski-error"><section className="ski-result-sheet ski-pause-sheet"><div className="ski-sheet-header"><span>DOWNHILL SERVICE</span><span>UNAVAILABLE</span></div><div className="ski-pause-body"><h2>WebGL Unavailable</h2><p>Wok This Slope requires hardware-accelerated WebGL to simulate the rice. Enable WebGL in your browser settings.</p></div><div className="ski-result-actions"><Link href="/" className="ski-button ski-button-primary">Back to Portfolio <span aria-hidden="true">→</span></Link></div></section></div>
      )}
    </div>
  );
}
