import { ownerToken, ownsSession } from "@/lib/medmath/sessionSecurity";
import { getSession } from "@/lib/medmath/store";
import { protectApi } from "@/lib/apiSecurity";
import { NextRequest, NextResponse } from "next/server";
import { gradeAttempt, getCachedQuestionInstance } from "@/lib/medmath/engine";
import { recordAttempt } from "@/lib/medmath/store";
import type { AttemptSubmission, StoredAttemptRecord } from "@/lib/medmath/types";

export const dynamic = "force-dynamic";

async function handlePOST(req: NextRequest) {
  try {
    const body = (await req.json()) as AttemptSubmission & {
      action?: "grade" | "hint" | "reveal-solution";
      hintIndex?: number;
    };

    if (typeof body?.sessionId !== "string" || body.sessionId.length > 100 || typeof body.instanceId !== "string" || body.instanceId.length > 200) return NextResponse.json({ error: "Invalid attempt" }, { status: 400 });
    const session = await getSession(body.sessionId);
    if (session && !ownsSession(session, ownerToken(req))) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (body.action === undefined || body.action === "grade") {
      if (typeof body.submittedAnswer !== "string" || body.submittedAnswer.length > 200 || !Number.isInteger(body.attemptNumber) || body.attemptNumber < 1 || body.attemptNumber > 100) return NextResponse.json({ error: "Invalid attempt" }, { status: 400 });
    }
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
        correctAnswer: instance.correctAnswer,
        correctAnswerLabel: instance.correctAnswerLabel,
        answerUnit: instance.answerUnit,
        answerPrecision: instance.answerPrecision,
        safetyPearl: instance.safetyPearl,
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
      questionKind: instance.questionKind,
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

export const POST = protectApi(handlePOST, { scope: "medmath-attempt", perMinute: 120, daily: 20000, maxBytes: 32768 });
