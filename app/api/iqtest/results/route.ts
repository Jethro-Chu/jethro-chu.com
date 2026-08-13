import { NextResponse } from "next/server";
import {
  iqQuestions,
  legacyIQQuestions,
  type StableQuestionId,
} from "@/lib/iqtest/questions";
import {
  RANDOMIZED_TEST_VERSION,
  resolveRandomizedTest,
} from "@/lib/iqtest/randomizer";
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
  consumeIQSubmissionRateLimit,
  getParticipantComparison,
  getTimingAnalytics,
  hasRecordedIQAttempt,
  hasIQResultsStore,
  recordIQAttempt,
} from "@/lib/iqtest/store";
import {
  TIMING_VERSION,
  validateCompletionTiming,
} from "@/lib/iqtest/timing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ATTEMPT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function noStoreJson(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

function clientIdentifier(request: Request) {
  for (const header of [
    "x-vercel-forwarded-for",
    "x-forwarded-for",
    "x-real-ip",
  ]) {
    const value = request.headers.get(header)?.split(",")[0]?.trim();
    if (value) return value;
  }
  return null;
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
    (submission.testVersion !== undefined &&
      submission.testVersion !== 1 &&
      submission.testVersion !== RANDOMIZED_TEST_VERSION) ||
    (submission.timingVersion !== undefined &&
      submission.timingVersion !== TIMING_VERSION) ||
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

  const receivedAtMs = Date.now();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ error: "Invalid JSON body." }, 400);
  }
  if (!validSubmission(body)) {
    return noStoreJson({ error: "Invalid result submission." }, 400);
  }

  const validatedTiming =
    body.timingVersion === TIMING_VERSION
      ? validateCompletionTiming(body, receivedAtMs)
      : undefined;
  if (body.timingVersion === TIMING_VERSION && !validatedTiming) {
    return noStoreJson({ error: "Invalid completion timing." }, 400);
  }
  const timing = validatedTiming ?? undefined;

  let questions = legacyIQQuestions;
  if (body.testVersion === RANDOMIZED_TEST_VERSION) {
    if (
      !Array.isArray(body.selectedQuestionIds) ||
      !body.selectedQuestionIds.every(
        (id): id is StableQuestionId =>
          typeof id === "string" && /^iq_\d{3}$/.test(id),
      )
    ) {
      return noStoreJson({ error: "Invalid randomized test selection." }, 400);
    }
    const randomizedQuestions = resolveRandomizedTest(
      iqQuestions,
      body.selectedQuestionIds,
    );
    if (!randomizedQuestions) {
      return noStoreJson({ error: "Invalid randomized test selection." }, 400);
    }
    questions = randomizedQuestions;
  }

  const selectedNumericIds = new Set(
    questions.map((question) => String(question.id)),
  );
  if (Object.keys(body.answers).some((id) => !selectedNumericIds.has(id))) {
    return noStoreJson({ error: "Answers do not match this test." }, 400);
  }

  const answers = Object.fromEntries(
    Object.entries(body.answers).map(([id, answer]) => [Number(id), answer]),
  );
  const result = scoreAttempt(questions, answers, () => 0);
  const earnedBand = scoreBandForPerformance(result.weightedPerformance);
  const submittedScoreIsValid =
    body.iqScore >= earnedBand.minimum && body.iqScore <= earnedBand.maximum;
  const iqScore = submittedScoreIsValid
    ? body.iqScore
    : iqScoreFromPerformance(result.weightedPerformance);

  try {
    const existingAttempt = await hasRecordedIQAttempt(body.attemptId);
    const identifier = clientIdentifier(request);
    let rateLimitHeaders: Record<string, string> = {};
    if (!existingAttempt && identifier) {
      const rateLimit = await consumeIQSubmissionRateLimit(identifier);
      rateLimitHeaders = {
        "RateLimit-Limit": String(rateLimit.limit),
        "RateLimit-Remaining": String(rateLimit.remaining),
      };
      if (!rateLimit.allowed) {
        return noStoreJson(
          { error: "Too many IQ test submissions. Please try again later." },
          429,
          {
            ...rateLimitHeaders,
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        );
      }
    }

    const accepted = await recordIQAttempt({
      attemptId: body.attemptId,
      iqScore,
      answers,
      completionSeconds: body.completionSeconds,
      result,
      questions,
      testVersion: body.testVersion ?? 1,
      timing,
    });
    const [comparison, timingAnalytics] = await Promise.all([
      getParticipantComparison(iqScore),
      timing ? getTimingAnalytics(body.attemptId) : Promise.resolve(undefined),
    ]);
    const response: IQResultResponse = {
      accepted,
      iqScore,
      comparison,
      timing,
      timingAnalytics,
    };
    return noStoreJson(response, accepted ? 201 : 200, rateLimitHeaders);
  } catch (error) {
    console.error("[iq-results] submission failed", error);
    return noStoreJson({ error: "Result could not be recorded." }, 503);
  }
}
