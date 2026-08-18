"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { PublicMedMathData } from "@/lib/medmath/types";
import { DataCharts } from "@/components/medmath/DataCharts";

export default function MedMathDataPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("all");
  const [data, setData] = useState<PublicMedMathData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchData = useCallback(async (range: "7d" | "30d" | "90d" | "all") => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/medmath/data?timeRange=${range}`);
      if (res.ok) {
        const payload = (await res.json()) as PublicMedMathData;
        setData(payload);
      }
    } catch (err) {
      console.error("Failed to load public analytics data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(timeRange);
  }, [timeRange, fetchData]);

  return (
    <div className="space-y-6 py-4">
      {isLoading && !data ? (
        <div className="flex min-h-[400px] items-center justify-center rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-12">
          <div className="flex flex-col items-center gap-2.5 text-sm text-[var(--color-ink-muted)]">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
            <span>Computing Aggregate Analytics...</span>
          </div>
        </div>
      ) : data ? (
        <DataCharts
          data={data}
          timeRange={timeRange}
          onSelectTimeRange={(range) => setTimeRange(range)}
        />
      ) : (
        <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-8 text-center">
          <p className="font-body text-sm text-[var(--color-ink)]">
            Unable to load public analytics data.
          </p>
        </div>
      )}
    </div>
  );
}
