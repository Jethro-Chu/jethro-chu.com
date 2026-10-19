import type { Metadata, Viewport } from "next";
import { FlatValley } from "@/components/valley/FlatValley";
import { VillageStandalone } from "@/components/valley/VillageStandalone";
import { homeMetadata } from "@/lib/profileSeo";

export const metadata: Metadata = homeMetadata;

export const viewport: Viewport = {
  themeColor: "#3f7a57",
};

export default function Home() {
  return (
    <main id="main" className="relative min-h-screen bg-[var(--color-sand)]">
      <FlatValley />
      <VillageStandalone />
    </main>
  );
}
