import { CATEGORY_MAP, MEDMATH_CATEGORIES } from "./categories.ts";
import type {
  CategorySummaryStat,
  DifficultySummaryStat,
  MedMathCategory,
  MedMathDifficulty,
  PublicMedMathData,
  StoredAttemptRecord,
  StoredSession,
  SubtypeSummaryStat,
  TimeRangeTrendPoint,
} from "./types.ts";

export interface DataFilterOptions {
  timeRange?: "7d" | "30d" | "90d" | "all";
  difficulty?: MedMathDifficulty | "all";
  category?: MedMathCategory | "all";
}

function computeMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10;
  }
  return Math.round(sorted[mid] * 10) / 10;
}

export function buildPublicMedMathData(
  attempts: StoredAttemptRecord[],
  sessions: StoredSession[],
  filters: DataFilterOptions = {},
): PublicMedMathData {
  const now = Date.now();
  const timeLimitMs =
    filters.timeRange === "7d"
      ? 7 * 24 * 60 * 60 * 1000
      : filters.timeRange === "30d"
      ? 30 * 24 * 60 * 60 * 1000
      : filters.timeRange === "90d"
      ? 90 * 24 * 60 * 60 * 1000
      : Infinity;

  // Filter attempts based on time, difficulty, and category
  const filteredAttempts = attempts.filter((a) => {
    const ageMs = now - new Date(a.timestamp).getTime();
    if (ageMs > timeLimitMs) return false;
    if (filters.difficulty && filters.difficulty !== "all" && a.difficulty !== filters.difficulty) {
      return false;
    }
    if (filters.category && filters.category !== "all" && a.category !== filters.category) {
      return false;
    }
    return true;
  });

  const filteredSessions = sessions.filter((s) => {
    const ageMs = now - new Date(s.startedAt).getTime();
    return ageMs <= timeLimitMs;
  });

  // Group attempts by question instance to compute first-attempt vs eventual accuracy
  const instanceMap = new Map<string, StoredAttemptRecord[]>();
  for (const a of filteredAttempts) {
    const group = instanceMap.get(a.instanceId) || [];
    group.push(a);
    instanceMap.set(a.instanceId, group);
  }

  let totalQuestions = 0;
  let firstTryCorrect = 0;
  let eventualCorrect = 0;
  let questionsWithHint = 0;
  let questionsWithSolution = 0;
  let solvedOnFirst = 0;
  let solvedOnSecond = 0;
  let solvedOnThirdOrLater = 0;
  const validResponseTimes: number[] = [];

  for (const [, instAttempts] of instanceMap.entries()) {
    totalQuestions += 1;
    // Sort attempts by attemptNumber
    instAttempts.sort((a, b) => a.attemptNumber - b.attemptNumber);
    const firstAttempt = instAttempts[0];
    const anyCorrect = instAttempts.some((a) => a.isCorrect);
    const anyHint = instAttempts.some((a) => a.hintsUsedCount > 0);
    const anySolution = instAttempts.some((a) => a.solutionRevealed);

    if (firstAttempt.isCorrect) {
      firstTryCorrect += 1;
      solvedOnFirst += 1;
    } else if (instAttempts.length >= 2 && instAttempts[1].isCorrect) {
      solvedOnSecond += 1;
    } else if (anyCorrect) {
      solvedOnThirdOrLater += 1;
    }

    if (anyCorrect) eventualCorrect += 1;
    if (anyHint) questionsWithHint += 1;
    if (anySolution) questionsWithSolution += 1;

    for (const a of instAttempts) {
      // Cap response times at 300s to avoid background tab idle skew
      if (a.responseTimeSeconds > 0 && a.responseTimeSeconds <= 300) {
        validResponseTimes.push(a.responseTimeSeconds);
      }
    }
  }

  // Summary stats
  const firstAttemptAccuracy = totalQuestions > 0 ? Math.round((firstTryCorrect / totalQuestions) * 1000) / 10 : 0;
  const eventualAccuracy = totalQuestions > 0 ? Math.round((eventualCorrect / totalQuestions) * 1000) / 10 : 0;
  const medianResponseTimeSeconds = computeMedian(validResponseTimes);

  // Category breakdown
  const categoryStats: CategorySummaryStat[] = MEDMATH_CATEGORIES.map((catMeta) => {
    const catAttempts = filteredAttempts.filter((a) => a.category === catMeta.id);
    const catInstances = new Map<string, StoredAttemptRecord[]>();
    for (const a of catAttempts) {
      const g = catInstances.get(a.instanceId) || [];
      g.push(a);
      catInstances.set(a.instanceId, g);
    }

    let catQuestions = 0;
    let catFirstTry = 0;
    let catEventual = 0;
    let catHints = 0;
    const catTimes: number[] = [];

    for (const [, instAttempts] of catInstances.entries()) {
      catQuestions += 1;
      instAttempts.sort((a, b) => a.attemptNumber - b.attemptNumber);
      if (instAttempts[0].isCorrect) catFirstTry += 1;
      if (instAttempts.some((a) => a.isCorrect)) catEventual += 1;
      if (instAttempts.some((a) => a.hintsUsedCount > 0)) catHints += 1;
      for (const a of instAttempts) {
        if (a.responseTimeSeconds > 0 && a.responseTimeSeconds <= 300) {
          catTimes.push(a.responseTimeSeconds);
        }
      }
    }

    return {
      category: catMeta.id,
      name: catMeta.name,
      track: catMeta.track,
      totalQuestions: catQuestions,
      totalAttempts: catAttempts.length,
      firstAttemptAccuracy: catQuestions > 0 ? Math.round((catFirstTry / catQuestions) * 1000) / 10 : 0,
      eventualAccuracy: catQuestions > 0 ? Math.round((catEventual / catQuestions) * 1000) / 10 : 0,
      medianResponseTimeSeconds: computeMedian(catTimes),
      hintUsageRate: catQuestions > 0 ? Math.round((catHints / catQuestions) * 1000) / 10 : 0,
    };
  });

  // Hardest topics (ranked by firstAttemptAccuracy ascending, minimum 5 questions for ranking)
  const rankedCategories = [...categoryStats]
    .filter((c) => c.totalQuestions >= 5)
    .sort((a, b) => a.firstAttemptAccuracy - b.firstAttemptAccuracy);

  // Subtype stats with sample size protection (minimum 20 attempts for public subtype listing)
  const subtypeMap = new Map<string, StoredAttemptRecord[]>();
  for (const a of filteredAttempts) {
    const list = subtypeMap.get(a.subtype) || [];
    list.push(a);
    subtypeMap.set(a.subtype, list);
  }

  const mostMissedSubtypes: SubtypeSummaryStat[] = [];
  for (const [subtype, subAttempts] of subtypeMap.entries()) {
    if (subAttempts.length < 20) continue; // Sample size protection
    const subInstances = new Map<string, StoredAttemptRecord[]>();
    for (const a of subAttempts) {
      const g = subInstances.get(a.instanceId) || [];
      g.push(a);
      subInstances.set(a.instanceId, g);
    }
    let subQuestions = 0;
    let subFirstTry = 0;
    let subEventual = 0;
    const subTimes: number[] = [];

    for (const [, instAttempts] of subInstances.entries()) {
      subQuestions += 1;
      instAttempts.sort((a, b) => a.attemptNumber - b.attemptNumber);
      if (instAttempts[0].isCorrect) subFirstTry += 1;
      if (instAttempts.some((a) => a.isCorrect)) subEventual += 1;
      for (const a of instAttempts) {
        if (a.responseTimeSeconds > 0 && a.responseTimeSeconds <= 300) {
          subTimes.push(a.responseTimeSeconds);
        }
      }
    }

    const firstAcc = subQuestions > 0 ? Math.round((subFirstTry / subQuestions) * 1000) / 10 : 0;
    const eventAcc = subQuestions > 0 ? Math.round((subEventual / subQuestions) * 1000) / 10 : 0;
    const sampleCategory = subAttempts[0].category;

    mostMissedSubtypes.push({
      subtype,
      category: sampleCategory,
      title: subtype.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      totalAttempts: subAttempts.length,
      firstAttemptAccuracy: firstAcc,
      eventualAccuracy: eventAcc,
      medianResponseTimeSeconds: computeMedian(subTimes),
    });
  }
  mostMissedSubtypes.sort((a, b) => a.firstAttemptAccuracy - b.firstAttemptAccuracy);

  // Difficulty breakdown
  const difficulties: MedMathDifficulty[] = ["beginner", "intermediate", "advanced", "critical-care"];
  const difficultyStats: DifficultySummaryStat[] = difficulties.map((diff) => {
    const diffAttempts = filteredAttempts.filter((a) => a.difficulty === diff);
    const diffInstances = new Map<string, StoredAttemptRecord[]>();
    for (const a of diffAttempts) {
      const g = diffInstances.get(a.instanceId) || [];
      g.push(a);
      diffInstances.set(a.instanceId, g);
    }

    let diffQuestions = 0;
    let diffFirstTry = 0;
    let diffEventual = 0;
    const diffTimes: number[] = [];

    for (const [, instAttempts] of diffInstances.entries()) {
      diffQuestions += 1;
      instAttempts.sort((a, b) => a.attemptNumber - b.attemptNumber);
      if (instAttempts[0].isCorrect) diffFirstTry += 1;
      if (instAttempts.some((a) => a.isCorrect)) diffEventual += 1;
      for (const a of instAttempts) {
        if (a.responseTimeSeconds > 0 && a.responseTimeSeconds <= 300) {
          diffTimes.push(a.responseTimeSeconds);
        }
      }
    }

    return {
      difficulty: diff,
      totalQuestions: diffQuestions,
      totalAttempts: diffAttempts.length,
      firstAttemptAccuracy: diffQuestions > 0 ? Math.round((diffFirstTry / diffQuestions) * 1000) / 10 : 0,
      eventualAccuracy: diffQuestions > 0 ? Math.round((diffEventual / diffQuestions) * 1000) / 10 : 0,
      medianResponseTimeSeconds: computeMedian(diffTimes),
    };
  });

  // Attempts required distribution
  const attemptsDistribution = {
    firstAttemptPercent: totalQuestions > 0 ? Math.round((solvedOnFirst / totalQuestions) * 1000) / 10 : 0,
    secondAttemptPercent: totalQuestions > 0 ? Math.round((solvedOnSecond / totalQuestions) * 1000) / 10 : 0,
    thirdOrLaterPercent: totalQuestions > 0 ? Math.round((solvedOnThirdOrLater / totalQuestions) * 1000) / 10 : 0,
    afterHintPercent: totalQuestions > 0 ? Math.round((questionsWithHint / totalQuestions) * 1000) / 10 : 0,
    solutionRevealedPercent: totalQuestions > 0 ? Math.round((questionsWithSolution / totalQuestions) * 1000) / 10 : 0,
  };

  // Top hint categories
  const topHintCategories = [...categoryStats]
    .filter((c) => c.totalQuestions >= 5)
    .sort((a, b) => b.hintUsageRate - a.hintUsageRate)
    .slice(0, 5)
    .map((c) => ({ category: c.category, name: c.name, rate: c.hintUsageRate }));

  // Med-Surg vs Critical Care track comparison
  const medSurgAttempts = filteredAttempts.filter((a) => {
    const meta = CATEGORY_MAP.get(a.category);
    return meta?.track === "med-surg";
  });
  const medSurgInstances = new Map<string, StoredAttemptRecord[]>();
  for (const a of medSurgAttempts) {
    const g = medSurgInstances.get(a.instanceId) || [];
    g.push(a);
    medSurgInstances.set(a.instanceId, g);
  }
  let msQ = 0, msFirst = 0, msEvent = 0;
  const msTimes: number[] = [];
  for (const [, ia] of medSurgInstances.entries()) {
    msQ += 1;
    ia.sort((a, b) => a.attemptNumber - b.attemptNumber);
    if (ia[0].isCorrect) msFirst += 1;
    if (ia.some((a) => a.isCorrect)) msEvent += 1;
    for (const a of ia) {
      if (a.responseTimeSeconds > 0 && a.responseTimeSeconds <= 300) msTimes.push(a.responseTimeSeconds);
    }
  }

  const ccAttempts = filteredAttempts.filter((a) => {
    const meta = CATEGORY_MAP.get(a.category);
    return meta?.track === "critical-care";
  });
  const ccInstances = new Map<string, StoredAttemptRecord[]>();
  for (const a of ccAttempts) {
    const g = ccInstances.get(a.instanceId) || [];
    g.push(a);
    ccInstances.set(a.instanceId, g);
  }
  let ccQ = 0, ccFirst = 0, ccEvent = 0;
  const ccTimes: number[] = [];
  for (const [, ia] of ccInstances.entries()) {
    ccQ += 1;
    ia.sort((a, b) => a.attemptNumber - b.attemptNumber);
    if (ia[0].isCorrect) ccFirst += 1;
    if (ia.some((a) => a.isCorrect)) ccEvent += 1;
    for (const a of ia) {
      if (a.responseTimeSeconds > 0 && a.responseTimeSeconds <= 300) ccTimes.push(a.responseTimeSeconds);
    }
  }

  // Time series: Group by date (YYYY-MM-DD)
  const dateMap = new Map<string, { total: number; firstCorrect: number }>();
  for (const [, ia] of instanceMap.entries()) {
    ia.sort((a, b) => a.attemptNumber - b.attemptNumber);
    const dateKey = ia[0].timestamp.slice(0, 10);
    const curr = dateMap.get(dateKey) || { total: 0, firstCorrect: 0 };
    curr.total += 1;
    if (ia[0].isCorrect) curr.firstCorrect += 1;
    dateMap.set(dateKey, curr);
  }

  const timeSeries: TimeRangeTrendPoint[] = Array.from(dateMap.entries())
    .map(([date, val]) => ({
      date,
      questionsPracticed: val.total,
      firstAttemptAccuracy: val.total > 0 ? Math.round((val.firstCorrect / val.total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    summary: {
      totalQuestionsAnswered: totalQuestions,
      totalPracticeSessions: filteredSessions.length,
      firstAttemptAccuracy,
      eventualAccuracy,
      medianResponseTimeSeconds,
    },
    categories: categoryStats,
    hardestTopics: rankedCategories,
    mostMissedSubtypes,
    difficulties: difficultyStats,
    attemptsDistribution,
    hintStats: {
      overallHintUsageRate: totalQuestions > 0 ? Math.round((questionsWithHint / totalQuestions) * 1000) / 10 : 0,
      topHintCategories,
    },
    trackComparison: {
      medSurg: {
        questionsAttempted: msQ,
        firstAttemptAccuracy: msQ > 0 ? Math.round((msFirst / msQ) * 1000) / 10 : 0,
        eventualAccuracy: msQ > 0 ? Math.round((msEvent / msQ) * 1000) / 10 : 0,
        medianResponseTimeSeconds: computeMedian(msTimes),
      },
      criticalCare: {
        questionsAttempted: ccQ,
        firstAttemptAccuracy: ccQ > 0 ? Math.round((ccFirst / ccQ) * 1000) / 10 : 0,
        eventualAccuracy: ccQ > 0 ? Math.round((ccEvent / ccQ) * 1000) / 10 : 0,
        medianResponseTimeSeconds: computeMedian(ccTimes),
      },
    },
    timeSeries,
    lastUpdated: new Date().toISOString(),
  };
}
