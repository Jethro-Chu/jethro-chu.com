import { NextRequest, NextResponse } from "next/server";
import { gradeAttempt, getCachedQuestionInstance } from "@/lib/medmath/engine";
import { recordAttempt } from "@/lib/medmath/store";
import type { AttemptSubmission, StoredAttemptRecord } from "@/lib/medmath/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AttemptSubmission & {
      action?: "grade" | "hint" | "reveal-solution";
      hintIndex?: number;
    };

    const instance = getCachedQuestionInstance(body.instanceId);
    if (!instance) {
      return NextResponse.json(
        { error: "Question expired. Please load the next question." },
        { status: 404 },
      );
    }

    if (body.action === "hint") {
      const hintIndex = Math.max(0, Math.min(body.hintIndex ?? 0, instance.hints.length - 1));
      return NextResponse.json({
        hint: instance.hints[hintIndex],
        hintIndex,
        totalHints: instance.hints.length,
      });
    }

    if (body.action === "reveal-solution") {
      return NextResponse.json({
        solutionSteps: instance.solutionSteps,
        expectedAnswer: instance.expectedAnswer,
        expectedUnit: instance.expectedUnit,
      });
    }

    // Standard grading
    const gradeResult = gradeAttempt(body, instance);

    // Record attempt asynchronously in store
    const attemptRecord: StoredAttemptRecord = {
      attemptId: gradeResult.attemptId,
      sessionId: body.sessionId,
      instanceId: instance.instanceId,
      templateId: instance.templateId,
      category: instance.category,
      subtype: instance.subtype,
      difficulty: instance.difficulty,
      attemptNumber: body.attemptNumber,
      submittedAnswer: body.submittedAnswer,
      isCorrect: gradeResult.isCorrect,
      responseTimeSeconds: Math.min(Math.max(body.responseTimeSeconds || 0, 0), 600),
      hintsUsedCount: body.hintsUsedCount || 0,
      solutionRevealed: Boolean(body.solutionRevealed),
      timestamp: new Date().toISOString(),
    };

    await recordAttempt(attemptRecord);

    return NextResponse.json(gradeResult);
  } catch (error) {
    console.error("[api/medmath/attempt] Error:", error);
    return NextResponse.json(
      { error: "Failed to grade attempt" },
      { status: 500 },
    );
  }
}
