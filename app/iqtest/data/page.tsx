import type { Metadata } from "next";
import { IQData } from "@/components/iqtest/IQData";
import { getPublicIQData, hasIQResultsStore } from "@/lib/iqtest/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "IQ Test Data | Jethro Chu",
  description:
    "Anonymous IQ scores, raw results, percentiles, and completion-time statistics from the Jethro IQ Test.",
  robots: { index: true, follow: true },
};

export default async function IQDataPage() {
  let initialData = null;
  if (hasIQResultsStore()) {
    try {
      initialData = await getPublicIQData({ page: 1, pageSize: 20, sort: "recent" });
    } catch {
      // The client keeps a retry path if the public snapshot is temporarily unavailable.
    }
  }

  return <IQData initialData={initialData} />;
}
