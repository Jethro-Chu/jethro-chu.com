import type { Metadata, Viewport } from "next";
import { FlatValley } from "@/components/valley/FlatValley";
import { VillageStandalone } from "@/components/valley/VillageStandalone";

export const metadata: Metadata = {
  title: "Yosemite Village · Jethro Chu",
  description:
    "Explore Jethro Chu's pixel-art Yosemite Village and discover his projects, clinical experience, resume, and contact information.",
  alternates: { canonical: "/" },
};

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
