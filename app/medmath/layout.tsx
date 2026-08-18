import type { Metadata } from "next";
import { MedMathHeader } from "@/components/medmath/MedMathHeader";

export const metadata: Metadata = {
  title: "MedMath | Adult Clinical Medication Math Lab",
  description:
    "Interactive adult Medical-Surgical and Critical Care medication math practice platform for nursing students and clinicians.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MedMathLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-sand)] text-[var(--color-ink)] flex flex-col selection:bg-[var(--color-primary)]/20">
      <MedMathHeader />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 sm:px-6">
        {children}
      </main>
      <footer className="border-t border-[var(--color-line)] bg-[var(--color-surface)] py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[var(--color-ink-muted)]">
          <div>
            <span>MedMath · Adult Clinical Dosage Lab</span>
          </div>
          <div>
            <span>Strict Adult Med-Surg & ICU Formulas · Practice & Exam Simulator</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
