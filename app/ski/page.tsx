import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, Space_Mono } from "next/font/google";
import { site } from "@/content/content";
import { homeMetadata } from "@/lib/profileSeo";
import { SkiClientWrapper } from "@/components/ski/SkiClientWrapper";

const title = "Wok This Slope · Jethro Chu";
const display = Space_Grotesk({ subsets: ["latin"], display: "swap", variable: "--font-ski-display" });
const body = Inter({ subsets: ["latin"], display: "swap", variable: "--font-ski-body" });
const mono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], display: "swap", variable: "--font-ski-mono" });
const description =
  "A first-person 3D downhill physics comedy game. Fry 300 grains of rice in a skillet on mini-skis while hurtling down an alpine slope. Balance inertia, avoid trees, cook without burning, and plate your dish at the finish!";

export const metadata: Metadata = {
  ...homeMetadata,
  title,
  description,
  alternates: { canonical: `${site.url}/ski` },
  openGraph: {
    ...homeMetadata.openGraph,
    title,
    description,
    url: `${site.url}/ski`,
  },
  twitter: {
    ...homeMetadata.twitter,
    title,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#d9ebf7",
};

export default function SkiPage() {
  return (
    <main id="main" className={`${display.variable} ${body.variable} ${mono.variable} relative w-screen h-screen overflow-hidden bg-[#d9ebf7]`}>
      <style>{`.ski-game, .ski-game .font-sans { font-family: var(--font-ski-body), sans-serif; }
        .ski-game .font-serif { font-family: var(--font-ski-display), sans-serif; }
        .ski-game .font-mono { font-family: var(--font-ski-mono), monospace; font-variant-numeric: tabular-nums; }`}</style>
      <SkiClientWrapper />
    </main>
  );
}
