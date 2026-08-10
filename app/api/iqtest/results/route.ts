import { NextResponse } from "next/server";
import { iqQuestions } from "@/lib/iqtest/questions";
import type {
  IQResultResponse,
  IQResultSubmission,
} from "@/lib/iqtest/results";
import {
  iqScoreFromPerformance,
  scoreAttempt,
  scoreBandForPerformance,
} from "@/lib/iqtest/scoring";
import {
  getParticipantComparison,
  hasIQResultsStore,
  recordIQAttempt,
} from "@/lib/iqtest/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ATTEMPT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function validSubmission(value: unknown): value is IQResultSubmission {
  if (!value || typeof value !== "object") return false;
  const submission = value as Partial<IQResultSubmission>;
  if (
    typeof submission.attemptId !== "string" ||
    !ATTEMPT_ID_PATTERN.test(submission.attemptId) ||
    !Number.isInteger(submission.iqScore) ||
    (submission.iqScore ?? 0) < 32 ||
    (submission.iqScore ?? 0) > 129 ||
    !Number.isInteger(submission.completionSeconds) ||
    (submission.completionSeconds ?? -1) < 0 ||
    (submission.completionSeconds ?? 0) > 21600 ||
    !submission.answers ||
    typeof submission.answers !== "object" ||
    Array.isArray(submission.answers)
  ) {
    return false;
  }

  const validIds = new Set(iqQuestions.map((question) => String(question.id)));
  for (const [id, answer] of Object.entries(submission.answers)) {
    const question = iqQuestions.find((item) => String(item.id) === id);
    if (
      !validIds.has(id) ||
      typeof answer !== "string" ||
      !question?.options.some((option) => option.id === answer)
    ) {
      return false;
    }
  }
  return true;
}

export async function GET(request: Request) {
  if (!hasIQResultsStore()) {
    return noStoreJson({ error: "Participant comparison is unavailable." }, 503);
  }

  const score = Number(new URL(request.url).searchParams.get("score"));
  if (!Number.isInteger(score) || score < 32 || score > 129) {
    return noStoreJson({ error: "A valid IQ score is required." }, 400);
  }

  try {
    return noStoreJson(await getParticipantComparison(score));
  } catch (error) {
    console.error("[iq-results] aggregate read failed", error);
    return noStoreJson({ error: "Participant comparison is unavailable." }, 503);
  }
}

export async function POST(request: Request) {
  if (!hasIQResultsStore()) {
    return noStoreJson({ error: "Participant comparison is unavailable." }, 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ error: "Invalid JSON body." }, 400);
  }
  if (!validSubmission(body)) {
    return noStoreJson({ error: "Invalid result submission." }, 400);
  }

  const answers = Object.fromEntries(
    Object.entries(body.answers).map(([id, answer]) => [Number(id), answer]),
  );
  const result = scoreAttempt(iqQuestions, answers, () => 0);
  const earnedBand = scoreBandForPerformance(result.weightedPerformance);
  const submittedScoreIsValid =
    body.iqScore >= earnedBand.minimum && body.iqScore <= earnedBand.maximum;
  const iqScore = submittedScoreIsValid
    ? body.iqScore
    : iqScoreFromPerformance(result.weightedPerformance);

  try {
    const accepted = await recordIQAttempt({
      attemptId: body.attemptId,
      iqScore,
      answers,
      completionSeconds: body.completionSeconds,
      result,
      questions: iqQuestions,
    });
    const comparison = await getParticipantComparison(iqScore);
    const response: IQResultResponse = { accepted, iqScore, comparison };
    return noStoreJson(response, accepted ? 201 : 200);
  } catch (error) {
    console.error("[iq-results] submission failed", error);
    return noStoreJson({ error: "Result could not be recorded." }, 503);
  }
}
