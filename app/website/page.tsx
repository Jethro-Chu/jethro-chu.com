import type { Metadata } from "next";
import { PortfolioPage } from "@/components/PortfolioPage";
import { profileMetadata } from "@/lib/profileSeo";

export const metadata: Metadata = profileMetadata(
  "Jethro Chu | BSN Candidate & Healthcare Software Portfolio",
  "Jethro Chu, Azusa Pacific University BSN candidate graduating December 2026. Explore his clinical background, healthcare and AI software, and nursing resume.",
  "/website",
);

export default function Website() {
  return <PortfolioPage />;
}
