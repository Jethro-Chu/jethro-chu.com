import type { Metadata } from "next";
import { MedicalAkinatorPage } from "@/components/medical-akinator/MedicalAkinatorPage";

export const metadata: Metadata = {
  title: "Medical Akinator — Jethro Chu",
  description: "An educational guessing game: think of a medication or medical topic and it narrows it down with yes/no questions.",
  robots: { index: false, follow: false }, // hidden easter egg — keep it out of search
};

export default function Page() {
  return <MedicalAkinatorPage />;
}
