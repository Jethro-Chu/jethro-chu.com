"use client";

/* ============================================================
   BOBA RUN CALCULATOR  ·  hidden fun page (route: /boba)
   "Yokocho Neon" — a 3AM Tokyo night-market boba stand. This page
   DELIBERATELY does not match the calm host site (per request): ink-black
   alley, hot-magenta + electric-cyan neon, a glowing SVG boba cup that
   fills to your result, a terminal compute-log, and a count-up hero number.

   Inputs: bobas this week + body weight. caloriesPerBoba is a fixed 450.
     miles = (bobas * 450) / (weight * 0.75)

   Self-contained: all visuals are inline CSS/SVG (no external fonts, CDN,
   images, or network). Fonts reuse the host's IBM Plex Mono (var(--font-mono),
   loaded 400/500 only — never 700) and Fraunces (var(--font-display)).
   Accessible + reduced-motion aware: real labels, neon focus ring, AA text on
   near-black, and every animation collapses to a static state under
   prefers-reduced-motion (useReducedMotion + the global reduced-motion rule).
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { site } from "@/content/content";

const CALORIES_PER_BOBA = 450;
const CALORIES_PER_MILE_PER_LB = 0.75;
const FULL_CUP_MILES = 20; // miles that fill the cup to the brim

/** escalating, comedic, never calorie-guilt (the joke is the whiplash) */
function quipFor(miles: number, bobas: number): string {
  if (bobas === 0) return "Zero bobas this week. Disciplined. Suspicious.";
  if (miles < 3) return "Light work. Go get another.";
  if (miles < 6) return "A solid jog for your tapioca habit.";
  if (miles < 12) return "Okay, that's a real run. Worth it though.";
  if (miles < 20) return "Half-marathon fuel, fully caffeinated.";
  return "An ultramarathon of pearls. Respect. (bring napkins)";
}

function positive(v: string): number | null {
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}
function nonNeg(v: string): number | null {
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function BobaCalculator() {
  const reduce = useReducedMotion();
  const [bobas, setBobas] = useState("");
  const [weight, setWeight] = useState("");

  const bobaCount = nonNeg(bobas);
  const weightLb = positive(weight);
  const miles =
    bobaCount != null && weightLb
      ? Math.round(((bobaCount * CALORIES_PER_BOBA) / (weightLb * CALORIES_PER_MILE_PER_LB)) * 10) / 10
      : null;

  // ---- count-up hero number ----------------------------------------------
  // Live value tracks input instantly; the animated count-up only fires on the
  // FIRST valid result and on an explicit re-run (Enter / blur) — never on every
  // keystroke (which would be maddening). Reduced motion => land instantly.
  const [display, setDisplay] = useState(0);
  const [flashKey, setFlashKey] = useState(0);
  const rafRef = useRef(0);
  const revealed = useRef(false);

  const animateTo = (target: number) => {
    cancelAnimationFrame(rafRef.current);
    if (reduce) {
      setDisplay(target);
      return;
    }
    setFlashKey((k) => k + 1); // one-shot glitch overlay
    const dur = 720;
    let start = 0;
    const step = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(target * eased);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
      else setDisplay(target);
    };
    rafRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    if (miles == null) {
      revealed.current = false;
      cancelAnimationFrame(rafRef.current);
      setDisplay(0);
      return;
    }
    if (!revealed.current) {
      revealed.current = true;
      animateTo(miles);
    } else {
      setDisplay(miles); // live update, no re-animation while typing
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [miles]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // paint the whole document (incl. overscroll) ink-dark so the host site's
  // sand never flashes behind this takeover; restore on leave.
  useEffect(() => {
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#0A0616";
    return () => {
      document.body.style.backgroundColor = prev;
    };
  }, []);

  const rerun = () => {
    if (miles != null) animateTo(miles);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") rerun();
  };

  // ---- cup gauge (live) ----------------------------------------------------
  const fill = miles == null ? 0.06 : clamp(miles / FULL_CUP_MILES, 0.06, 1);
  const pearls = bobaCount == null ? 3 : clamp(Math.round(bobaCount), 0, 9);

  const shown = miles == null ? "0.0" : display.toFixed(1);
  const log =
    miles == null
      ? "> awaiting input_"
      : `> (${bobaCount} × 450) ÷ (${weightLb} × 0.75) = ${miles.toFixed(1)}`;

  return (
    <div className="bobahp">
      <style>{CSS}</style>

      {/* ---- neon alley scene (decorative) ---- */}
      <div className="bobahp-scene" aria-hidden="true">
        <div className="bloom bloom-mag" />
        <div className="bloom bloom-cyan" />
        <div className="grain" />
        <div className="scanlines" />
        <div className="pavement" />
        <div className="bubbles">
          {[...Array(7)].map((_, i) => (
            <span key={i} style={{ ["--i" as string]: i }} />
          ))}
        </div>
      </div>

      {/* ---- brutalist HUD chrome (decorative) ---- */}
      <div className="bobahp-hud" aria-hidden="true">
        <span className="ruler" />
        <span className="corner tl" />
        <span className="corner tr" />
        <span className="corner bl" />
        <span className="corner br" />
        <span className="tele tele-r">SECTOR 夜市 · SYS//OK</span>
        <span className="tele tele-l">34.0522°N · 118.2437°W</span>
      </div>

      <header className="bobahp-top">
        <Link href="/" className="bobahp-back">
          <span aria-hidden>←</span> {site.name}
        </Link>
        <span className="bobahp-tag">BOBA.EXE</span>
      </header>

      <main id="main" className="bobahp-main">
        <div className="bobahp-panel">
          <p className="bobahp-kicker">◇ BOBA CALCULATOR ◇</p>

          <div className="bobahp-cup-wrap">
            <Cup fill={fill} pearls={pearls} />
          </div>

          <p className="bobahp-sub">How many bobas did you inhale this week?</p>

          <div className="bobahp-fields">
            <Field
              id="bobas"
              label="Bobas this week"
              unit="cups"
              value={bobas}
              onChange={setBobas}
              onKeyDown={onKey}
              onBlur={rerun}
              placeholder="3"
              step="1"
            />
            <Field
              id="weight"
              label="Body weight"
              unit="lb"
              value={weight}
              onChange={setWeight}
              onKeyDown={onKey}
              onBlur={rerun}
              placeholder="150"
            />
          </div>

          <div className="bobahp-result" aria-live="polite">
            <p className="bobahp-log">{log}</p>
            <div className={`bobahp-readout${miles == null ? " is-idle" : ""}`}>
              <span className="bobahp-miles">{shown}</span>
              <span className="bobahp-unit">mi</span>
              {miles != null && !reduce && <span key={flashKey} className="bobahp-glitch" aria-hidden />}
            </div>
            <p className="bobahp-kicker2">
              {miles == null
                ? "MILES · TO BURN THIS WEEK"
                : `MILES TO RUN · ${(bobaCount! * CALORIES_PER_BOBA).toLocaleString()} CAL THIS WEEK`}
            </p>
            <p className="bobahp-quip">{miles == null ? " " : quipFor(miles, bobaCount!)}</p>
          </div>

        </div>
      </main>

      <footer className="bobahp-foot">
        <span className="bobahp-formula">(cups × 450) ÷ (lb × 0.75)</span>
        <Link href="/" className="bobahp-exit">
          EXIT →
        </Link>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Cup({ fill, pearls }: { fill: number; pearls: number }) {
  const top = 52;
  const bottom = 162;
  const levelY = top + (1 - fill) * (bottom - top);
  const slots = [
    { x: 70, y: 155 },
    { x: 59, y: 153 },
    { x: 81, y: 153 },
    { x: 65, y: 146 },
    { x: 76, y: 146 },
    { x: 54, y: 146 },
    { x: 87, y: 146 },
    { x: 70, y: 139 },
    { x: 59, y: 139 },
  ].slice(0, clamp(pearls, 0, 9));

  return (
    <svg className="cup" viewBox="0 0 140 180" role="img" aria-label="A neon boba cup that fills with your result">
      <defs>
        <clipPath id="cup-interior">
          <path d="M32 52 L108 52 L96 160 L44 160 Z" />
        </clipPath>
      </defs>
      {/* liquid — fills bottom-up to match miles */}
      <g clipPath="url(#cup-interior)">
        <rect className="cup-liquid" x="30" y={levelY} width="80" height={bottom - levelY + 4} />
        <rect className="cup-liquid-top" x="30" y={levelY} width="80" height="4" />
      </g>
      {/* tapioca pearls — count matches bobas */}
      {slots.map((p, i) => (
        <g className="cup-pearl" key={i}>
          <circle cx={p.x} cy={p.y} r="6.4" fill="#FFC43D" />
          <circle cx={p.x - 2} cy={p.y - 2.4} r="1.9" fill="#FFF7E0" opacity="0.85" />
        </g>
      ))}
      {/* cup body */}
      <path
        className="cup-line-mag"
        fill="none"
        d="M32 52 L108 52 L97 160 Q96 167 89 167 L51 167 Q44 167 43 160 Z"
      />
      {/* lid */}
      <path
        className="cup-line-mag"
        fill="none"
        d="M26 50 L114 50 L110 40 Q109 36 104 36 L36 36 Q31 36 30 40 Z"
      />
      {/* straw */}
      <line className="cup-line-cyan" x1="88" y1="46" x2="104" y2="8" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */

function Field({
  id,
  label,
  unit,
  value,
  onChange,
  onKeyDown,
  onBlur,
  placeholder,
  step,
}: {
  id: string;
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onBlur?: () => void;
  placeholder?: string;
  step?: string;
}) {
  return (
    <div className="bobahp-field">
      <label htmlFor={id}>{label}</label>
      <div className="well">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          step={step ?? "any"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          placeholder={placeholder}
        />
        <span className="unit">{unit}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const CSS = `
.bobahp {
  --void:#04020A; --ink:#0A0616; --panel:#140A24; --card:#1E1036;
  --mag:#FF2EA6; --cyan:#14F0FF; --violet:#B152FF; --amber:#FFC43D;
  --white:#F6EEFF; --lilac:#D8CCF0;
  position:relative; min-height:100dvh; display:flex; flex-direction:column;
  background:var(--ink); color:var(--white); overflow-x:hidden;
  font-family:var(--font-mono), ui-monospace, "SF Mono", monospace;
  -webkit-tap-highlight-color:transparent;
}
.bobahp ::selection { background:rgba(20,240,255,.3); color:#fff; }

/* scene */
.bobahp-scene { position:fixed; inset:0; z-index:-2; background:var(--ink); pointer-events:none; overflow:hidden; }
.bobahp .bloom { position:absolute; border-radius:50%; filter:blur(46px); mix-blend-mode:screen; opacity:.55; }
.bobahp .bloom-mag { width:64vw; height:64vw; left:-16vw; top:-22vw; background:radial-gradient(circle, rgba(255,46,166,.6), transparent 65%); }
.bobahp .bloom-cyan { width:58vw; height:58vw; right:-14vw; top:-8vw; background:radial-gradient(circle, rgba(20,240,255,.52), transparent 65%); }
.bobahp .pavement {
  position:absolute; left:0; right:0; bottom:0; height:36vh; opacity:.85;
  background:
    repeating-linear-gradient(90deg, transparent 0 26px, rgba(20,240,255,.05) 26px 28px),
    radial-gradient(60% 120% at 22% 130%, rgba(255,46,166,.3), transparent 60%),
    radial-gradient(60% 120% at 80% 130%, rgba(20,240,255,.26), transparent 60%);
  filter:blur(5px);
  -webkit-mask-image:linear-gradient(to top, #000, transparent);
  mask-image:linear-gradient(to top, #000, transparent);
}
.bobahp .scanlines {
  position:absolute; inset:0; mix-blend-mode:multiply; opacity:.5;
  background:repeating-linear-gradient(0deg, rgba(0,0,0,.32) 0 1px, transparent 1px 3px);
}
.bobahp .grain {
  position:absolute; inset:0; opacity:.05;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
.bobahp .bubbles { position:absolute; inset:0; }
.bobahp .bubbles span {
  position:absolute; bottom:-24px; left:calc(8% + (var(--i) * 13%));
  width:calc(6px + (var(--i) * 1.5px)); height:calc(6px + (var(--i) * 1.5px));
  border-radius:50%; background:radial-gradient(circle at 35% 30%, rgba(20,240,255,.5), rgba(177,82,255,.12));
  box-shadow:0 0 8px rgba(20,240,255,.4);
  animation:hp-rise calc(9s + (var(--i) * 1.7s)) linear infinite;
  animation-delay:calc(var(--i) * -1.6s);
}
@keyframes hp-rise { to { transform:translateY(-92vh); opacity:0; } }

/* HUD chrome */
.bobahp-hud { position:fixed; inset:0; z-index:2; pointer-events:none; }
.bobahp .ruler { position:absolute; left:0; top:0; bottom:0; width:7px;
  background:repeating-linear-gradient(0deg, transparent 0 19px, rgba(216,204,240,.25) 19px 20px); }
.bobahp .corner { position:absolute; width:15px; height:15px; }
.bobahp .corner::before, .bobahp .corner::after { content:""; position:absolute; background:rgba(20,240,255,.45); }
.bobahp .corner::before { left:50%; top:0; width:1px; height:100%; transform:translateX(-.5px); }
.bobahp .corner::after { top:50%; left:0; height:1px; width:100%; transform:translateY(-.5px); }
.bobahp .corner.tl { left:12px; top:12px; } .bobahp .corner.tr { right:12px; top:12px; }
.bobahp .corner.bl { left:12px; bottom:12px; } .bobahp .corner.br { right:12px; bottom:12px; }
.bobahp .tele { position:absolute; font-size:.56rem; letter-spacing:.22em; color:rgba(216,204,240,.4); text-transform:uppercase; }
.bobahp .tele-r { top:14px; right:34px; } .bobahp .tele-l { bottom:14px; left:34px; }

/* chrome header / footer */
.bobahp-top, .bobahp-foot { position:relative; z-index:3; display:flex; align-items:center; justify-content:space-between;
  padding:1.1rem 1.5rem; }
.bobahp-back { display:inline-flex; align-items:center; gap:.5rem; color:var(--white); text-decoration:none;
  font-family:var(--font-display), serif; font-size:1.05rem; letter-spacing:.01em; }
.bobahp-back span { color:var(--cyan); transition:transform .15s ease; }
.bobahp-back:hover span { transform:translateX(-3px); }
.bobahp-tag, .bobahp-formula, .bobahp-exit { font-size:.62rem; letter-spacing:.2em; text-transform:uppercase; color:var(--lilac); }
.bobahp-exit { color:var(--cyan); text-decoration:none; }
.bobahp-formula { color:rgba(216,204,240,.55); }

/* main */
.bobahp-main { position:relative; z-index:3; flex:1; display:flex; align-items:center; justify-content:center;
  padding:1.5rem 1.25rem 3rem; }
.bobahp-panel { width:100%; max-width:32rem; text-align:center; }
.bobahp-kicker { font-size:.72rem; letter-spacing:.34em; text-transform:uppercase; color:var(--cyan);
  text-shadow:0 0 8px rgba(20,240,255,.7); }
.bobahp-cup-wrap { display:flex; justify-content:center; margin:.4rem 0 .2rem; }
.cup { width:150px; height:auto; }
.cup-line-mag { stroke:var(--mag); stroke-width:3.4; stroke-linejoin:round;
  filter:drop-shadow(0 0 3px var(--mag)) drop-shadow(0 0 9px rgba(255,46,166,.7)); }
.cup-line-cyan { stroke:var(--cyan); stroke-width:7; stroke-linecap:round;
  filter:drop-shadow(0 0 3px var(--cyan)) drop-shadow(0 0 9px rgba(20,240,255,.7)); }
.cup-liquid { fill:rgba(255,46,166,.26); transition:y .55s var(--ease-trail, cubic-bezier(.22,1,.36,1)), height .55s var(--ease-trail, cubic-bezier(.22,1,.36,1)); }
.cup-liquid-top { fill:rgba(255,46,166,.6); transition:y .55s var(--ease-trail, cubic-bezier(.22,1,.36,1)); }
.cup-pearl circle:first-child { filter:drop-shadow(0 0 4px rgba(255,196,61,.85)); }

.bobahp-sub { margin:.5rem auto 0; max-width:24rem; font-size:.92rem; line-height:1.55; color:var(--lilac); }

/* inputs */
.bobahp-fields { margin-top:1.6rem; display:grid; grid-template-columns:1fr 1fr; gap:.9rem; text-align:left; }
.bobahp-field label { display:block; margin-bottom:.5rem; font-size:.66rem; letter-spacing:.2em; text-transform:uppercase; color:var(--lilac); }
.bobahp-field .well { display:flex; align-items:center; gap:.5rem; min-height:52px; padding:0 .9rem;
  background:var(--panel); border:1px solid rgba(20,240,255,.4); border-radius:5px;
  box-shadow:inset 0 0 14px rgba(20,240,255,.06); transition:border-color .15s, box-shadow .15s; }
.bobahp-field .well:focus-within { border-color:var(--cyan);
  box-shadow:inset 0 0 0 1px var(--cyan), inset 0 0 18px rgba(20,240,255,.16), 0 0 0 3px rgba(255,46,166,.45); }
.bobahp-field input { flex:1; min-width:0; background:transparent; border:0; outline:none; color:var(--white);
  font-family:var(--font-mono), monospace; font-size:1.3rem; font-weight:500; font-variant-numeric:tabular-nums; }
.bobahp-field input::placeholder { color:rgba(216,204,240,.4); }
.bobahp-field .unit { font-size:.66rem; letter-spacing:.14em; text-transform:uppercase; color:rgba(216,204,240,.65); }

/* result sign-card */
.bobahp-result { position:relative; margin-top:1.4rem; padding:1.5rem 1rem 1.7rem;
  background:rgba(30,16,54,.5); backdrop-filter:blur(9px) saturate(140%); -webkit-backdrop-filter:blur(9px) saturate(140%);
  clip-path:polygon(0 11px,11px 0,calc(100% - 11px) 0,100% 11px,100% calc(100% - 11px),calc(100% - 11px) 100%,11px 100%,0 calc(100% - 11px)); }
.bobahp-result::before { content:""; position:absolute; inset:0; clip-path:inherit; border:1px solid rgba(20,240,255,.32); pointer-events:none; }
.bobahp-log { font-size:.66rem; letter-spacing:.1em; color:rgba(216,204,240,.7); word-break:break-word; }
.bobahp-readout { position:relative; display:flex; align-items:baseline; justify-content:center; gap:.35rem; margin-top:.5rem; }
.bobahp-miles { font-family:var(--font-mono), monospace; font-weight:500; font-variant-numeric:tabular-nums;
  font-size:clamp(4rem, 20vw, 8rem); line-height:.92; color:var(--white);
  text-shadow:0 0 6px rgba(246,238,255,.9), 0 0 20px rgba(20,240,255,.9), 0 0 44px rgba(20,240,255,.6), 0 0 72px rgba(255,46,166,.5); }
.bobahp-unit { font-family:var(--font-mono), monospace; font-size:1.5rem; color:var(--mag);
  text-shadow:0 0 10px rgba(255,46,166,.8); }
.bobahp-readout.is-idle .bobahp-miles { color:rgba(216,204,240,.4); text-shadow:0 0 14px rgba(20,240,255,.28); }
.bobahp-readout.is-idle .bobahp-unit { color:rgba(216,204,240,.35); text-shadow:none; }
.bobahp-glitch { position:absolute; inset:0; pointer-events:none; opacity:0;
  background:linear-gradient(90deg, transparent 0 46%, rgba(20,240,255,.5) 46% 54%, transparent 54%);
  mix-blend-mode:screen; animation:hp-glitch .42s steps(2) 1; }
@keyframes hp-glitch {
  0% { clip-path:inset(12% 0 60% 0); transform:translateX(-6px); opacity:1; }
  30% { clip-path:inset(58% 0 18% 0); transform:translateX(7px); }
  60% { clip-path:inset(30% 0 44% 0); transform:translateX(-4px); opacity:.8; }
  100% { clip-path:inset(0 0 100% 0); transform:none; opacity:0; }
}
.bobahp-kicker2 { margin-top:.5rem; font-size:.64rem; letter-spacing:.24em; text-transform:uppercase; color:var(--lilac); }
.bobahp-quip { margin-top:.9rem; min-height:1.4em; font-family:var(--font-display), serif; font-style:italic;
  font-size:1.08rem; line-height:1.4; color:var(--cyan); text-shadow:0 0 12px rgba(20,240,255,.45); }

/* accessible neon focus ring (overrides the site's pine :focus-visible, invisible here) */
.bobahp a:focus-visible, .bobahp input:focus-visible, .bobahp button:focus-visible {
  outline:2px solid var(--cyan); outline-offset:2px; border-radius:3px;
}

@media (max-width: 420px) {
  .bobahp-fields { grid-template-columns:1fr; }
  .bobahp-miles { text-shadow:0 0 5px rgba(246,238,255,.9), 0 0 16px rgba(20,240,255,.85), 0 0 34px rgba(255,46,166,.5); }
  .bobahp .pavement { height:24vh; }
  .bobahp .tele { display:none; }
}

/* the global prefers-reduced-motion rule already freezes all keyframe loops
   (bubbles/glitch) to a static state; the count-up is gated in JS via
   useReducedMotion (lands instantly). Kept explicit for the composited layers. */
@media (prefers-reduced-motion: reduce) {
  .bobahp .bubbles span { animation:none; opacity:.5; }
  .bobahp-glitch { display:none; }
}
`;
