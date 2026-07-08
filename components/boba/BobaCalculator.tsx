"use client";

/* ============================================================
   BOBA RUN CALCULATOR  ·  hidden fun page (route: /boba)
   Tally this week's bobas, and from your body weight it works out how
   far you'd have to run to burn off the whole week's worth. Not linked
   anywhere and noindex'd (see app/boba/page.tsx) — a small treat for
   anyone who guesses the URL.

   Aesthetic matches the rest of the site (resume / akinator pages):
   sand wash + route line, hairline rules, monospace labels, pine
   accent, soft radii. All maths run in the browser; no API.

   totalCalories = bobasThisWeek * caloriesPerBoba
   miles = totalCalories / (bodyWeightLb * 0.75)
   ============================================================ */

import { useState } from "react";
import Link from "next/link";
import { m, useReducedMotion } from "framer-motion";
import { site } from "@/content/content";
import { BackgroundGradient } from "@/components/scenery/BackgroundGradient";
import { RouteLine } from "@/components/scenery/RouteLine";

const CALORIES_PER_MILE_PER_LB = 0.75;
const DEFAULT_BOBA_CALORIES = 450;

/** a playful nudge keyed to the distance (based on the rounded, shown miles) */
function runLine(miles: number): string {
  if (miles < 3) return "Light work. Go get that boba.";
  if (miles <= 5) return "A solid jog for one sweet drink.";
  return "That boba came with a half-marathon subscription.";
}

/** parse a text field into a positive finite number, or null */
function positive(value: string): number | null {
  const n = parseFloat(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** a boba count: a non-negative finite number (0 is a valid, boba-free week) */
function count(value: string): number | null {
  const n = parseFloat(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function BobaCalculator() {
  const reduce = useReducedMotion();
  const [bobas, setBobas] = useState("");
  const [weight, setWeight] = useState("");
  const [calories, setCalories] = useState(String(DEFAULT_BOBA_CALORIES));

  const bobaCount = count(bobas);
  const weightLb = positive(weight);
  const perBoba = positive(calories);

  const totalCalories = bobaCount != null && perBoba != null ? bobaCount * perBoba : null;

  // miles rounded to 1 decimal; both the number shown and the line use it so
  // they never disagree (e.g. 3.0 mi reading "light work").
  const miles =
    totalCalories != null && weightLb
      ? Math.round((totalCalories / (weightLb * CALORIES_PER_MILE_PER_LB)) * 10) / 10
      : null;

  return (
    <div className="relative flex min-h-screen flex-col">
      <BackgroundGradient />
      <RouteLine />

      {/* top bar — the only way back (no public link points here) */}
      <header className="relative z-10 flex items-center justify-between border-b border-[var(--color-granite-line)] px-6 py-4 sm:px-10 lg:px-16">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 font-display text-[1.05rem] font-medium text-[var(--color-shadow)]"
        >
          <span aria-hidden className="text-[var(--color-pine)] transition-transform group-hover:-translate-x-0.5">
            ←
          </span>
          {site.name}
        </Link>
        <span className="label-mono">boba run calculator</span>
      </header>

      <main id="main" className="relative z-10 flex flex-1 items-center justify-center px-6 py-12 sm:py-16">
        <m.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0.15 : 0.34, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          {/* title block */}
          <div className="text-center">
            <p className="label-mono">Hidden · just for fun</p>
            <h1 className="mt-3 font-display text-[2rem] font-medium leading-tight text-[var(--color-shadow)] sm:text-[2.5rem]">
              Boba Run Calculator <span aria-hidden>🧋</span>
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-[0.98rem] leading-relaxed text-[var(--color-muted)]">
              Count this week&rsquo;s bobas and see how far you&rsquo;d run to burn them off.
            </p>
          </div>

          {/* inputs — the weekly count is the headline field */}
          <div className="mt-9 space-y-4">
            <Field
              id="bobas"
              label="Bobas this week"
              unit="bobas"
              value={bobas}
              onChange={setBobas}
              placeholder="3"
              step="1"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                id="weight"
                label="Body weight"
                unit="lb"
                value={weight}
                onChange={setWeight}
                placeholder="150"
              />
              <Field
                id="calories"
                label="Calories per boba"
                unit="cal"
                value={calories}
                onChange={setCalories}
                placeholder={String(DEFAULT_BOBA_CALORIES)}
              />
            </div>
          </div>

          {/* result */}
          <div
            aria-live="polite"
            className="mt-6 rounded-md border border-[var(--color-granite-line)] bg-[var(--color-card)] px-6 py-7 text-center"
          >
            <p className="label-mono">Miles to run</p>
            {miles == null ? (
              <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--color-muted)]">
                Add this week&rsquo;s bobas and your body weight to see the distance.
              </p>
            ) : (
              <>
                <m.p
                  key={miles}
                  initial={reduce ? false : { opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="tnum mt-2 font-display text-[3.25rem] font-medium leading-none text-[var(--color-shadow)]"
                >
                  {miles.toFixed(1)}
                  <span className="ml-2 align-baseline text-[1.4rem] font-normal text-[var(--color-muted)]">mi</span>
                </m.p>
                <p className="label-mono mt-3">
                  {bobaCount} {bobaCount === 1 ? "boba" : "bobas"} · {totalCalories!.toLocaleString()} cal this week
                </p>
                <p className="mt-3 text-[0.98rem] leading-relaxed text-[var(--color-pine)]">{runLine(miles)}</p>
              </>
            )}
          </div>

          {/* disclaimer */}
          <p className="mt-6 text-center text-[0.8rem] leading-relaxed text-[var(--color-muted)]">
            This is just for fun. Food does not need to be earned.
          </p>
        </m.div>
      </main>

      <footer className="relative z-10 flex items-center justify-between border-t border-[var(--color-granite-line)] px-6 py-4 sm:px-10 lg:px-16">
        <p className="label-mono text-[0.6rem]">{CALORIES_PER_MILE_PER_LB} cal / mile / lb · rough math</p>
        <Link href="/" className="label-mono transition-colors hover:text-[var(--color-pine)]">
          ← Back to portfolio
        </Link>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Field({
  id,
  label,
  unit,
  value,
  onChange,
  placeholder,
  step,
}: {
  id: string;
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  step?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="label-mono mb-2 block">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-md border border-[var(--color-granite-line)] bg-[var(--color-card)] px-4 py-2.5 focus-within:border-[var(--color-pine)]">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          step={step ?? "any"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-[0.98rem] text-[var(--color-shadow)] outline-none placeholder:text-[var(--color-muted)]"
        />
        <span className="label-mono shrink-0 text-[0.7rem]">{unit}</span>
      </div>
    </div>
  );
}
