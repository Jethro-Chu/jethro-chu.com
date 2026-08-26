"use client";

import { Suspense } from "react";
import { PracticeView } from "@/components/medmath/PracticeView";

export default function AnticoagulantPracticePage() {
  return (
    <Suspense fallback={<div className="min-h-[300px]" />}>
      <PracticeView
        fixedCategories={["anticoagulants"]}
        heading="Anticoagulant Practice"
        description="Practice heparin, LMWH, warfarin, direct oral anticoagulants, laboratory monitoring, reversal concepts, bleeding safety, and adult anticoagulant calculations."
        hideFilters
      />
    </Suspense>
  );
}
