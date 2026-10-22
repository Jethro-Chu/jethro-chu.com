import { ownerToken, ownsSession, publicSession, validSessionPayload } from "@/lib/medmath/sessionSecurity";
import { protectApi } from "@/lib/apiSecurity";
import { NextRequest, NextResponse } from "next/server";
import { saveSession, getSession } from "@/lib/medmath/store";
import { getStoredQuestion, gradeQuestionAnswer, createQuestionInstance } from "@/lib/medmath/engine";
import type { ExamQuestionReview, MedMathCategory, StoredSession } from "@/lib/medmath/types";

export const dynamic = "force-dynamic";

async function handlePOST(req: NextRequest) {
  try {
    const payload = (await req.json()) as Partial<StoredSession> & { sessionId: string };

    if (!payload || typeof payload.sessionId !== "string" || !/^[a-zA-Z0-9_-]{8,100}$/.test(payload.sessionId)) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const existing = await getSession(payload.sessionId);
    if (!existing || !ownsSession(existing, ownerToken(req))) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (!validSessionPayload({ ...existing, ...payload })) return NextResponse.json({ error: "Invalid session" }, { status: 400 });

    if (payload.examReview !== undefined) {
      if (!Array.isArray(payload.examReview)) {
        return NextResponse.json(
          { error: "examReview must be an array" },
          { status: 400 },
        );
      }

      for (const item of payload.examReview as ExamQuestionReview[]) {
        const storedQuestion = getStoredQuestion(item.templateId);
        if (!storedQuestion) {
          return NextResponse.json(
            { error: `Unknown MedMath question ${item.templateId}` },
            { status: 400 },
          );
        }
        if (
          !Number.isFinite(item.correctAnswer) ||
          item.correctAnswer !== storedQuestion.correctAnswer ||
          item.answerUnit !== storedQuestion.answerUnit ||
          item.answerPrecision !== storedQuestion.answerPrecision ||
          !Array.isArray(item.solutionSteps) ||
          item.solutionSteps.length === 0 ||
          item.isCorrect !== gradeQuestionAnswer(createQuestionInstance(storedQuestion), item.studentAnswer)
        ) {
          return NextResponse.json(
            { error: `Invalid stored answer payload for ${item.templateId}` },
            { status: 400 },
          );
        }
      }
    }


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
      ownerHash: existing.ownerHash,
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
      examMode: payload.examMode || existing.examMode,
      examReview: payload.examReview ?? existing.examReview,
    };

    await saveSession(completedSession);

    return NextResponse.json({
      success: true,
      session: publicSession(completedSession),
    });
  } catch (error) {
    console.error("[api/medmath/complete] Error:", error);
    return NextResponse.json(
      { error: "Failed to finalize session" },
      { status: 500 },
    );
  }
}

export const POST = protectApi(handlePOST, { scope: "medmath-complete", perMinute: 15, daily: 5000, maxBytes: 262144 });
