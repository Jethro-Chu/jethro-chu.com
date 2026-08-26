"use client";

import { Suspense } from "react";
import { PracticeView } from "@/components/medmath/PracticeView";

export default function InsulinPracticePage() {
  return (
    <Suspense fallback={<div className="min-h-[300px]" />}>
      <PracticeView
        fixedCategories={["insulin"]}
        heading="Insulin Practice"
        description="Connect insulin types, timing, administration safety, and hypoglycemia risk with sliding scales, scheduled doses, concentrations, and infusion calculations."
        hideFilters
      />
    </Suspense>
  );
}
