import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import { inter } from "@/lib/fonts";
import Margillion from "@/components/margillion/Margillion";

const display = Space_Grotesk({ subsets: ["latin"], display: "swap", variable: "--margillion-display" });
const mono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], display: "swap", variable: "--margillion-mono" });
export const viewport: Viewport = { themeColor: "#09090b" };
export const metadata: Metadata = {
  title: "Margillion. | How close can you cut it?",
  description: "Ten estimates. Fifteen seconds each. One hundred percent margin. A daily game of razor margins.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://jethrochu.com/margillion" },
  openGraph: { title: "Margillion.", description: "How close can you cut it? A daily game of razor margins.", url: "https://jethrochu.com/margillion" },
};
export default function Page() {
  return <div className={`${display.variable} ${mono.variable} ${inter.variable}`}><Margillion /></div>;
}
