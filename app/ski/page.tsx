import type { Metadata, Viewport } from "next";
import { site } from "@/content/content";
import { homeMetadata } from "@/lib/profileSeo";
import { SkiClientWrapper } from "@/components/ski/SkiClientWrapper";

const title = "Wok This Slope · Jethro Chu";
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
    <main id="main" className="relative w-screen h-screen overflow-hidden bg-[#d9ebf7]">
      <SkiClientWrapper />
    </main>
  );
}
