import { NextRequest, NextResponse } from "next/server";
import { saveSession, getSession } from "@/lib/medmath/store";
import type { MedMathCategory, StoredSession } from "@/lib/medmath/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as Partial<StoredSession> & { sessionId: string };

    if (!payload.sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const existing = (await getSession(payload.sessionId)) || ({} as StoredSession);

    // Identify weak categories: categories attempted with < 75% first attempt accuracy
    const categoryBreakdown = payload.categoryBreakdown || existing.categoryBreakdown || {};
    const weakCategories: MedMathCategory[] = [];

    for (const [catKey, stats] of Object.entries(categoryBreakdown)) {
      if (stats.totalQuestions > 0) {
        const accuracy = stats.firstAttemptCorrect / stats.totalQuestions;
        if (accuracy < 0.75) {
          weakCategories.push(catKey as MedMathCategory);
        }
      }
    }

    const completedSession: StoredSession = {
      ...existing,
      ...payload,
      sessionId: payload.sessionId,
      visitorId: payload.visitorId || existing.visitorId || "anon",
      sessionType: payload.sessionType || existing.sessionType || "practice",
      selectedCategories: payload.selectedCategories || existing.selectedCategories || [],
      selectedDifficulty: payload.selectedDifficulty || existing.selectedDifficulty || "mixed",
      plannedQuestionCount: payload.plannedQuestionCount ?? existing.plannedQuestionCount ?? 0,
      completedQuestionCount: payload.completedQuestionCount ?? existing.completedQuestionCount ?? 0,
      startedAt: existing.startedAt || new Date().toISOString(),
      completedAt: new Date().toISOString(),
      isCompleted: true,
      totalAttempts: payload.totalAttempts ?? existing.totalAttempts ?? 0,
      firstAttemptCorrectCount: payload.firstAttemptCorrectCount ?? existing.firstAttemptCorrectCount ?? 0,
      eventualCorrectCount: payload.eventualCorrectCount ?? existing.eventualCorrectCount ?? 0,
      totalHintsUsed: payload.totalHintsUsed ?? existing.totalHintsUsed ?? 0,
      totalSolutionsRevealed: payload.totalSolutionsRevealed ?? existing.totalSolutionsRevealed ?? 0,
      averageResponseTimeSeconds: payload.averageResponseTimeSeconds ?? existing.averageResponseTimeSeconds ?? 0,
      categoryBreakdown,
      difficultyBreakdown: payload.difficultyBreakdown || existing.difficultyBreakdown || {},
      weakCategories,
    };

    await saveSession(completedSession);

    return NextResponse.json({
      success: true,
      session: completedSession,
    });
  } catch (error) {
    console.error("[api/medmath/complete] Error:", error);
    return NextResponse.json(
      { error: "Failed to finalize session" },
      { status: 500 },
    );
  }
}
