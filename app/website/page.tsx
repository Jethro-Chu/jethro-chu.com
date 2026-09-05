import type { Metadata } from "next";
import { PortfolioPage } from "@/components/PortfolioPage";

export const metadata: Metadata = {
  title: "Portfolio · Jethro Chu",
  description:
    "Read about Jethro Chu's healthcare, research, and AI software, or ask the portfolio chatbot about his work.",
  alternates: { canonical: "/website" },
};

export default function Website() {
  return <PortfolioPage />;
}
