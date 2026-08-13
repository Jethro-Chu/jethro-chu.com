import type { Metadata } from "next";
import { IQTest } from "@/components/iqtest/IQTest";

export const metadata: Metadata = {
  title: "The Jethro IQ Test",
  description:
    "25 difficult questions in probability, logic, patterns, quantitative reasoning, and spatial thinking.",
  openGraph: {
    title: "The Jethro IQ Test",
    description:
      "25 difficult questions in probability, logic, patterns, quantitative reasoning, and spatial thinking.",
    url: "/iqtest",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Jethro IQ Test",
    description:
      "25 difficult questions in probability, logic, patterns, quantitative reasoning, and spatial thinking.",
  },
  robots: { index: false, follow: false },
};

export default function IQTestPage() {
  return <IQTest />;
}
