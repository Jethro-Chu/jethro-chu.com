import Link from "next/link";
import { MEDMATH_CATEGORIES, MED_SURG_CATEGORIES, CRITICAL_CARE_CATEGORIES } from "@/lib/medmath/categories";

export default function MedMathLandingPage() {
  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <section className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-xs bg-[var(--color-pine)] px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-white">
          <span>Clinical Dosage Laboratory</span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-ink)] sm:text-5xl">
          Adult Med-Surg & Critical Care Medication Math
        </h1>
        <p className="font-body text-base leading-relaxed text-[var(--color-ink-muted)] sm:text-lg">
          Master high-stakes medication calculations through realistic adult clinical scenarios.
          Features 120+ parameterized templates across 13 adult competencies, immediate educational solutions,
          adaptive difficulty, full exams, and public aggregate analytics.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/medmath/practice"
            className="rounded-sm bg-[var(--color-pine)] px-6 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-[var(--color-pine)]/90"
          >
            Start Practice Mode →
          </Link>
          <Link
            href="/medmath/exam"
            className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] px-6 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--color-ink)] transition-colors hover:bg-[var(--color-sand)]"
          >
            Take Full Practice Exam
          </Link>
          <Link
            href="/medmath/data"
            className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)] hover:bg-[var(--color-sand)]"
          >
            View Analytics
          </Link>
        </div>
      </section>

      {/* Feature Pillar Cards */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-xs space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-[var(--color-sand)] font-mono text-base font-bold text-[var(--color-primary)]">
            01
          </div>
          <h2 className="font-display text-lg font-bold text-[var(--color-ink)]">
            Interactive Practice
          </h2>
          <p className="font-body text-xs leading-relaxed text-[var(--color-ink-muted)]">
            Single-question practice with 3 progressive hints, multi-attempt retries, detailed formula breakdowns, and adaptive difficulty progression.
          </p>
          <div className="pt-2">
            <Link
              href="/medmath/practice"
              className="font-mono text-xs font-semibold text-[var(--color-primary)] hover:underline"
            >
              Launch Practice →
            </Link>
          </div>
        </div>

        <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-xs space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-[var(--color-sand)] font-mono text-base font-bold text-[var(--color-primary)]">
            02
          </div>
          <h2 className="font-display text-lg font-bold text-[var(--color-ink)]">
            Full Practice Exams
          </h2>
          <p className="font-body text-xs leading-relaxed text-[var(--color-ink-muted)]">
            Simulate 10, 20, 25, or 50 question testing sessions in timed or untimed modes with diagnostic category scoring and weak-area targeting.
          </p>
          <div className="pt-2">
            <Link
              href="/medmath/exam"
              className="font-mono text-xs font-semibold text-[var(--color-primary)] hover:underline"
            >
              Configure Exam →
            </Link>
          </div>
        </div>

        <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-xs space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-[var(--color-sand)] font-mono text-base font-bold text-[var(--color-primary)]">
            03
          </div>
          <h2 className="font-display text-lg font-bold text-[var(--color-ink)]">
            Anonymous Analytics
          </h2>
          <p className="font-body text-xs leading-relaxed text-[var(--color-ink-muted)]">
            Explore aggregate nursing performance metrics, the hardest adult topics, solve times, and category accuracy distributions.
          </p>
          <div className="pt-2">
            <Link
              href="/medmath/data"
              className="font-mono text-xs font-semibold text-[var(--color-primary)] hover:underline"
            >
              Explore Data →
            </Link>
          </div>
        </div>
      </section>

      {/* 13 Adult Clinical Categories Grid */}
      <section className="space-y-6">
        <div className="flex flex-col gap-1 border-b border-[var(--color-line)] pb-4">
          <h2 className="font-display text-2xl font-bold text-[var(--color-ink)]">
            13 Adult Clinical Core Competencies
          </h2>
          <p className="font-body text-xs text-[var(--color-ink-muted)]">
            Organized into standard Medical-Surgical floor administration and high-acuity Critical Care tracks.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MEDMATH_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-xs space-y-2 hover:border-[var(--color-primary)] transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-semibold text-[var(--color-ink)]">
                  {cat.name}
                </span>
                <span className="rounded-xs bg-[var(--color-sand)] px-2 py-0.5 font-mono text-[10px] uppercase text-[var(--color-ink-muted)]">
                  {cat.track === "med-surg" ? "Med-Surg" : "Critical Care"}
                </span>
              </div>
              <p className="font-body text-xs text-[var(--color-ink-muted)] leading-relaxed">
                {cat.description}
              </p>
              <div className="pt-2">
                <Link
                  href={`/medmath/practice?category=${cat.id}`}
                  className="font-mono text-[11px] font-semibold text-[var(--color-primary)] hover:underline"
                >
                  Practice this topic →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Clinical Standards Notice */}
      <section className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-6 space-y-2">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">
          Clinical Calculation Standards
        </h3>
        <p className="font-body text-xs leading-relaxed text-[var(--color-ink-muted)]">
          All questions on this platform are calibrated strictly to adult inpatient Medical-Surgical and Critical Care clinical dosing guidelines. Dosing concentrations reflect standard hospital formularies (e.g. Norepinephrine 8 mg/250 mL, Heparin 25,000 units/500 mL, Regular Insulin 100 units/100 mL). Patient weights are bounded within realistic adult metrics (50–120 kg / 110–264 lb).
        </p>
      </section>
    </div>
  );
}
