import type { Metadata } from "next";
import { Inter, Space_Grotesk, Space_Mono } from "next/font/google";
import Link from "next/link";
import styles from "@/components/abg/ABGArena.module.css";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--abg-font-display", display: "swap" });
const body = Inter({ subsets: ["latin"], variable: "--abg-font-body", display: "swap" });
const mono = Space_Mono({ subsets: ["latin"], variable: "--abg-font-mono", weight: ["400", "700"], display: "swap" });

export const metadata: Metadata = {
  title: "ABG Arena · Nursing ABG Trainer",
  description: "Build speed and accuracy interpreting arterial blood gases in a 10-question ranked challenge.",
  openGraph: {
    title: "ABG Arena",
    description: "How fast can you interpret an arterial blood gas?",
    url: "https://jethrochu.com/ABG",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "ABG Arena", description: "How fast can you interpret an arterial blood gas?" },
};

export default function ABGLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${styles.shell} ${display.variable} ${body.variable} ${mono.variable}`}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/ABG" className={styles.brand} aria-label="ABG Arena home">
            <span className={styles.brandMark} aria-hidden="true"><i /><i /><i /></span>
            <span><strong>ABG Arena</strong><small>Arterial blood gas trainer</small></span>
          </Link>
          <nav className={styles.nav} aria-label="ABG Arena navigation">
            <Link href="/ABG">Play</Link>
            <Link href="/ABG/leaderboard">Ranks</Link>
          </nav>
        </div>
      </header>
      <main id="main" className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <p>For educational use only. This tool is intended for nursing and healthcare education and should not be used to make clinical decisions or replace institutional protocols or professional medical judgment.</p>
      </footer>
    </div>
  );
}
