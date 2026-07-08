import type { Metadata } from "next";
import { BobaCalculator } from "@/components/boba/BobaCalculator";

export const metadata: Metadata = {
  title: "Boba Run Calculator — Jethro Chu",
  description: "Find out how far you'd have to run to earn your milk tea. Just for fun.",
  robots: { index: false, follow: false }, // hidden fun page — keep it out of search
};

export default function Page() {
  return <BobaCalculator />;
}
