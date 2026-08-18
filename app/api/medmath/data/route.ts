import { NextRequest, NextResponse } from "next/server";
import { getPublicMedMathData } from "@/lib/medmath/store";
import type { DataFilterOptions } from "@/lib/medmath/public-data";
import type { MedMathCategory, MedMathDifficulty } from "@/lib/medmath/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const timeRange = (searchParams.get("timeRange") || "all") as DataFilterOptions["timeRange"];
    const difficulty = (searchParams.get("difficulty") || "all") as MedMathDifficulty | "all";
    const category = (searchParams.get("category") || "all") as MedMathCategory | "all";

    const filters: DataFilterOptions = {
      timeRange: ["7d", "30d", "90d", "all"].includes(timeRange ?? "") ? timeRange : "all",
      difficulty: ["beginner", "intermediate", "advanced", "critical-care", "all"].includes(difficulty) ? difficulty : "all",
      category,
    };

    const data = await getPublicMedMathData(filters);

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("[api/medmath/data] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch public analytics data" },
      { status: 500 },
    );
  }
}
