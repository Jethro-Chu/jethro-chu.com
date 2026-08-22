import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-canvas-display",
  display: "swap",
});

const mono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-canvas-mono",
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dosage Calculation Competency | Med Math",
  description:
    "A 30-question nursing medication math competency exam and guided practice mode.",
  alternates: {
    canonical: "/medmath/canvas",
  },
};

export default function CanvasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={`${display.variable} ${mono.variable}`}>{children}</div>;
}
