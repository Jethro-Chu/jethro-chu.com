import type { Metadata } from "next";
import { ABGRanks } from "@/components/abg/ABGRanks";

export const metadata: Metadata = {
  title: "Ranks · ABG Arena",
  description: "Global ABG Arena ranked standings by player rating.",
};

export default function ABGRanksPage() {
  return <ABGRanks />;
}
