import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import { inter } from "@/lib/fonts";
import Timeundle from "@/components/timeundle/Timeundle";

const display = Space_Grotesk({ subsets: ["latin"], display: "swap", variable: "--timeundle-display" });
const mono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], display: "swap", variable: "--timeundle-mono" });
export const metadata: Metadata = {
  title: "Timeundle | A daily game of when",
  description: "You know what happened. But do you know when? Put seven events in order in this daily timeline puzzle.",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  alternates: { canonical: "https://jethrochu.com/timeundle" },
  openGraph: { title: "Timeundle", description: "You know what happened. But do you know when?", url: "https://jethrochu.com/timeundle" },
};
export default function Page() {
  return <div className={`${display.variable} ${mono.variable} ${inter.variable}`}><Timeundle /></div>;
}
