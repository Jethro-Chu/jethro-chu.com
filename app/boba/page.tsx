import type { Metadata } from "next";
import { BobaCalculator } from "@/components/boba/BobaCalculator";

export const metadata: Metadata = {
  title: "Boba Run Calculator — Jethro Chu",
  description: "Tally this week's bobas and see how far you'd run to burn them off. Just for fun.",
  robots: { index: false, follow: false }, // hidden fun page — keep it out of search
};

export default function Page() {
  return <BobaCalculator />;
}
