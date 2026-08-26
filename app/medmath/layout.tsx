import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { MedMathHeader } from "@/components/medmath/MedMathHeader";
import { MEDICATION_EDUCATION_DISCLAIMER } from "@/lib/medmath/medication-facts";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Medmath practice",
  description: "Medmath practice",
  openGraph: {
    title: "Medmath practice",
    description: "Medmath practice",
    url: "https://jethrochu.com/medmath",
    siteName: "Medmath practice",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Medmath practice",
    description: "Medmath practice",
  },
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
    <div
      className={`min-h-screen bg-[var(--color-sand)] text-[var(--color-ink)] flex flex-col selection:bg-[var(--color-primary)]/20 text-base leading-relaxed ${inter.className}`}
    >
      <MedMathHeader />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 sm:px-6">
        {children}
      </main>
      <footer className="border-t border-[var(--color-line)] bg-[var(--color-surface)] py-6 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--color-ink-muted)]">
          <div>
            <span className="font-medium text-[var(--color-ink)]">MedMath</span> · Adult Clinical Dosage Lab
          </div>
          <div>
            <span>Strict Adult Med-Surg & ICU Formulas · Practice & Exam Simulator</span>
          </div>
          <p className="max-w-md text-center text-xs leading-relaxed sm:text-right">
            {MEDICATION_EDUCATION_DISCLAIMER}
          </p>
        </div>
      </footer>
    </div>
  );
}
