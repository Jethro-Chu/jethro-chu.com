import type { Metadata, Viewport } from "next";
import { FlatValley } from "@/components/valley/FlatValley";
import { VillageStandalone } from "@/components/valley/VillageStandalone";
import { homeMetadata } from "@/lib/profileSeo";

const title = "Yosemite Village · Jethro Chu";

export const metadata: Metadata = {
  ...homeMetadata,
  title,
  alternates: { canonical: "/website" },
  openGraph: { ...homeMetadata.openGraph, type: "website", title, url: "/website" },
  twitter: { ...homeMetadata.twitter, title },
};

export const viewport: Viewport = {
  themeColor: "#3f7a57",
};

export default function Website() {
  return (
    <main id="main" className="relative min-h-screen bg-[var(--color-sand)]">
      <FlatValley />
      <VillageStandalone />
    </main>
  );
}
