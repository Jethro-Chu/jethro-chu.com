import type { Metadata } from "next";
import { PortfolioPage } from "@/components/PortfolioPage";
import { profileDescription, profileMetadata, profileOpenGraphDescription, profileTwitterDescription } from "@/lib/profileSeo";

const websiteMetadata = profileMetadata(
  "Jethro Chu | BSN Candidate & Healthcare Software Portfolio",
  profileDescription,
  "/website",
);

export const metadata: Metadata = {
  ...websiteMetadata,
  openGraph: { ...websiteMetadata.openGraph, description: profileOpenGraphDescription },
  twitter: { ...websiteMetadata.twitter, description: profileTwitterDescription },
};

export default function Website() {
  return <PortfolioPage />;
}
