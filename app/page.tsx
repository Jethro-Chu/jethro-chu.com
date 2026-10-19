import type { Metadata } from "next";
import { PortfolioPage } from "@/components/PortfolioPage";
import { homeMetadata } from "@/lib/profileSeo";

export const metadata: Metadata = homeMetadata;

export default function Home() {
  return <PortfolioPage />;
}
