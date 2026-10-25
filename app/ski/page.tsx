import type { Metadata, Viewport } from "next";
import { site } from "@/content/content";
import { homeMetadata } from "@/lib/profileSeo";
import { SkiClientWrapper } from "@/components/ski/SkiClientWrapper";

const title = "Wok & Skis · Jethro Chu";
const description =
  "Carve down the mountain while stir-frying ingredients in a blazing carbon-steel wok. Steer through slalom gates, avoid trees, and toss to build Wok Hei without burning!";

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
  themeColor: "#020617",
};

export default function SkiPage() {
  return (
    <main id="main" className="relative w-screen h-screen overflow-hidden bg-slate-950">
      <SkiClientWrapper />
    </main>
  );
}
