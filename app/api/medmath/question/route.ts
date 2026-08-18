import { NextRequest, NextResponse } from "next/server";
import { generateRandomQuestion, generateExamQuestionSet } from "@/lib/medmath/engine";
import type { MedMathCategory, PracticeDifficultySelection } from "@/lib/medmath/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      categories?: MedMathCategory[];
      difficulty?: PracticeDifficultySelection;
      excludeTemplateIds?: string[];
      isExam?: boolean;
      examCount?: number;
    };

    if (body.isExam) {
      const examCount = Math.min(Math.max(body.examCount ?? 20, 5), 50);
      const { clientViews, instances } = generateExamQuestionSet({
        categories: body.categories,
        difficulty: body.difficulty,
        count: examCount,
      });

      return NextResponse.json({
        questions: clientViews,
        count: clientViews.length,
      });
    }

    const { clientView } = generateRandomQuestion({
      categories: body.categories,
      difficulty: body.difficulty,
      excludeTemplateIds: body.excludeTemplateIds,
    });

    return NextResponse.json({
      question: clientView,
    });
  } catch (error) {
    console.error("[api/medmath/question] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate question" },
      { status: 500 },
    );
  }
}
