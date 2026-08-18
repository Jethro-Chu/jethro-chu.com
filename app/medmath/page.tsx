import Link from "next/link";
import { MEDMATH_CATEGORIES } from "@/lib/medmath/categories";

export default function MedMathLandingPage() {
  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <section className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-xs bg-[var(--color-pine)] px-3 py-1 text-xs font-semibold text-white">
          <span>Clinical Dosage Laboratory</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[var(--color-ink)] leading-tight">
          Adult Med-Surg & Critical Care Medication Math
        </h1>
        <p className="text-base sm:text-lg leading-relaxed text-[var(--color-ink-muted)]">
          Master high-stakes medication calculations through 270+ validated adult clinical question templates across 13 core competencies.
          Features progressive educational hints, worked step-by-step solutions, full-length simulation exams, and anonymous analytics.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-3">
          <Link
            href="/medmath/exam"
            className="rounded-sm bg-[var(--color-pine)] px-6 py-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[var(--color-pine)]/90"
          >
            Take Nursing Med Math Exam →
          </Link>
          <Link
            href="/medmath/practice"
            className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] px-6 py-3 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-sand)]"
          >
            Practice by Category
          </Link>
          <Link
            href="/medmath/data"
            className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-3 text-sm font-medium text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)] hover:bg-[var(--color-sand)]"
          >
            Public Analytics
          </Link>
        </div>
      </section>

      {/* Primary Study Pathway Cards */}
      <section className="space-y-4">
        <div className="border-b border-[var(--color-line)] pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-ink)]">
            Choose Your Study Pathway
          </h2>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Select between traditional nursing school exams, high-acuity ICU calculations, or targeted topic drills.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {/* Pathway 1: Nursing Med Math Exam */}
          <div className="rounded-md border-2 border-[var(--color-pine)] bg-[var(--color-surface)] p-6 shadow-xs space-y-3 relative">
            <div className="inline-flex items-center gap-1.5 rounded-xs bg-[var(--color-pine)] px-2.5 py-1 text-xs font-bold text-white">
              <span>Primary Exam</span>
            </div>
            <h3 className="text-lg font-bold text-[var(--color-ink)]">
              Nursing Med Math Exam
            </h3>
            <p className="text-xs font-semibold text-[var(--color-primary)]">
              Standard Adult Med-Surg Floor
            </p>
            <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">
              Traditional nursing-school dosage calculation exam. Balanced mix of unit conversions, oral tablets & liquids, IV pump rates, gravity drip rates, insulin, reconstitution, and basic weight-based dosing without heavy ICU drips.
            </p>
            <div className="pt-2">
              <Link
                href="/medmath/exam"
                className="inline-flex items-center gap-1 text-sm font-bold text-[var(--color-pine)] hover:underline"
              >
                Start Nursing Exam →
              </Link>
            </div>
          </div>

          {/* Pathway 2: Critical Care Exam */}
          <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-xs space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-xs bg-[var(--color-primary)] px-2.5 py-1 text-xs font-bold text-white">
              <span>ICU Challenge</span>
            </div>
            <h3 className="text-lg font-bold text-[var(--color-ink)]">
              Critical Care Exam
            </h3>
            <p className="text-xs font-semibold text-[var(--color-primary)]">
              High-Acuity ICU & Emergency
            </p>
            <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">
              Advanced critical care math: weight-based vasoactive drips (mcg/kg/min, mcg/min), heparin titration protocols, DKA insulin infusions, inotropes, and multi-step ICU workflows.
            </p>
            <div className="pt-2">
              <Link
                href="/medmath/exam"
                className="inline-flex items-center gap-1 text-sm font-bold text-[var(--color-primary)] hover:underline"
              >
                Start Critical Care Exam →
              </Link>
            </div>
          </div>

          {/* Pathway 3: Practice by Category */}
          <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-xs space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-xs bg-[var(--color-sand)] px-2.5 py-1 text-xs font-bold text-[var(--color-ink)]">
              <span>Skill Mastery</span>
            </div>
            <h3 className="text-lg font-bold text-[var(--color-ink)]">
              Practice by Category
            </h3>
            <p className="text-xs font-semibold text-[var(--color-ink-muted)]">
              Targeted Remediation & Drills
            </p>
            <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">
              Infinite randomized practice on specific calculation skills. Includes 3 progressive hints per question, step-by-step solutions, and immediate feedback.
            </p>
            <div className="pt-2">
              <Link
                href="/medmath/practice"
                className="inline-flex items-center gap-1 text-sm font-bold text-[var(--color-ink)] hover:underline"
              >
                Launch Category Practice →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 13 Adult Clinical Categories Grid */}
      <section className="space-y-6">
        <div className="flex flex-col gap-1 border-b border-[var(--color-line)] pb-4">
          <h2 className="text-2xl font-bold text-[var(--color-ink)]">
            13 Adult Clinical Core Competencies
          </h2>
          <p className="text-sm text-[var(--color-ink-muted)]">
            Organized into standard Medical-Surgical floor administration and high-acuity Critical Care tracks.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MEDMATH_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-xs space-y-3 transition-colors hover:border-[var(--color-pine)]"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`rounded-xs px-2.5 py-0.5 text-xs font-semibold ${
                    cat.track === "critical-care"
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : "bg-[var(--color-pine)]/10 text-[var(--color-pine)] border border-[var(--color-pine)]/30"
                  }`}
                >
                  {cat.track === "critical-care" ? "ICU Track" : "Med-Surg Track"}
                </span>
                <span className="text-xs font-medium text-[var(--color-ink-muted)]">
                  {cat.defaultUnit}
                </span>
              </div>

              <h3 className="text-base font-bold text-[var(--color-ink)]">
                {cat.name}
              </h3>
              <p className="text-xs leading-relaxed text-[var(--color-ink-muted)]">
                {cat.description}
              </p>

              <div className="pt-1">
                <Link
                  href={`/medmath/practice?category=${cat.id}`}
                  className="text-xs font-semibold text-[var(--color-primary)] hover:underline"
                >
                  Practice {cat.shortName} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
