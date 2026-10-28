/**
 * Scoring and Grading Calculation Engine for "Wok This Slope"
 */

import { SKI_CONFIG } from "./config.ts";
import type { GradeRank, RunResults, PersonalBest, FailureReason } from "./types.ts";
import { RiceSimulation } from "./ricePhysics.ts";

const LOCAL_STORAGE_KEY = "wok_this_slope_pb_v1";

export class SkiScoringEngine {
  /**
   * Evaluate a completed or failed run
   */
  public static evaluateRun(
    rice: RiceSimulation,
    timeElapsed: number,
    failureReason?: FailureReason
  ): RunResults {
    const startingGrains = SKI_CONFIG.RICE.GRAIN_COUNT;
    const platedGrains = rice.platedCount;
    const platedPercent = Math.round((platedGrains / startingGrains) * 100);
    const retainedAtFinish = rice.retainedCount;

    // Calculate statistics specifically for plated grains
    // (If none plated, fall back to retained grains stats)
    let avgDoneness = 0;
    let avgBurnDamage = 0;

    const platedParticles = rice.spilledParticles.filter((p) => p.onPlate);
    if (platedParticles.length > 0) {
      let sumD = 0;
      let sumB = 0;
      for (const p of platedParticles) {
        sumD += p.doneness;
        sumB += p.burnDamage;
      }
      avgDoneness = Math.round((sumD / platedParticles.length) * 100);
      avgBurnDamage = Math.round((sumB / platedParticles.length) * 100);
    } else if (retainedAtFinish > 0) {
      avgDoneness = Math.round(rice.avgDoneness * 100);
      avgBurnDamage = Math.round(rice.avgBurnRisk * 100);
    }

    const targetTime = SKI_CONFIG.COURSE.TARGET_TIME_SEC;

    // Handle Catastrophic Failures
    if (failureReason) {
      let failTitle = "DISASTER ON THE SLOPES";
      let failSummary = "Your alpine culinary career has ended abruptly.";

      if (failureReason === "empty_pan") {
        failTitle = "PAN EMPTIED!";
        failSummary = "You fed the entire mountain snowpack. Not a single grain reached the plate.";
      } else if (failureReason === "tree_crash") {
        failTitle = "TREE CRASH!";
        failSummary = "The pine stood its ground. Your kitchen did not.";
      } else if (failureReason === "rock_crash") {
        failTitle = "ROCK CRASH!";
        failSummary = "The rock stayed put. The pan, burner, and rice went elsewhere.";
      } else if (failureReason === "log_crash") {
        failTitle = "LOG CRASH!";
        failSummary = "The fallen log turned your downhill kitchen into a yard sale.";
      } else if (failureReason === "burnt_batch") {
        failTitle = "CHARRED TO ASH!";
        failSummary = "The fire department was summoned to the finish line. The rice is toxic charcoal.";
      }

      return {
        grade: "D",
        title: failTitle,
        summary: failSummary,
        startingGrains,
        retainedAtFinish,
        platedGrains,
        platedPercent,
        avgDoneness,
        avgBurnDamage,
        timeElapsed,
        targetTime,
        score: 0,
        isPersonalBest: false,
        failureReason,
      };
    }

    // Determine Grade based on strict criteria
    let grade: GradeRank = "D";
    let title = "UNDERPORTIONED MESS";
    let summary = "The judges are polite, but your portion was too small and cold to count.";

    const sCrit = SKI_CONFIG.SCORING.S_RANK;
    const aCrit = SKI_CONFIG.SCORING.A_RANK;
    const bCrit = SKI_CONFIG.SCORING.B_RANK;
    const cCrit = SKI_CONFIG.SCORING.C_RANK;

    if (
      platedPercent >= sCrit.MIN_PLATED_PERCENT &&
      avgDoneness >= sCrit.MIN_DONENESS_PERCENT &&
      avgBurnDamage <= sCrit.MAX_BURN_PERCENT &&
      timeElapsed <= sCrit.MAX_TIME_SEC
    ) {
      grade = "S";
      title = "WOK GOD OF THE ALPS";
      summary = "Transcendent wok hei on two skis! Perfectly golden fried rice delivered with Olympic precision.";
    } else if (
      platedPercent >= aCrit.MIN_PLATED_PERCENT &&
      avgDoneness >= aCrit.MIN_DONENESS_PERCENT &&
      avgBurnDamage <= aCrit.MAX_BURN_PERCENT
    ) {
      grade = "A";
      title = "EXECUTIVE DOWNHILL CHEF";
      summary = "Superb skiing and delicious wok balance. A Michelin-worthy descent!";
    } else if (
      platedPercent >= bCrit.MIN_PLATED_PERCENT &&
      avgDoneness >= bCrit.MIN_DONENESS_PERCENT &&
      avgBurnDamage <= bCrit.MAX_BURN_PERCENT
    ) {
      grade = "B";
      title = "ALPINE LINE COOK";
      summary = "Respectable effort! A bit unevenly toasted, but definitely edible after a day on the slopes.";
    } else if (
      platedPercent >= cCrit.MIN_PLATED_PERCENT &&
      avgDoneness >= cCrit.MIN_DONENESS_PERCENT &&
      avgBurnDamage <= cCrit.MAX_BURN_PERCENT
    ) {
      grade = "C";
      title = "COLD LUKEWARM LEFTOVERS";
      summary = "Half the rice is buried in the snowbanks, and what made it is slightly disappointing.";
    } else {
      grade = "D";
      title = "CULINARY AVALANCHE";
      summary = "Too burnt, undercooked, or too few grains landed on the plate.";
    }

    // Calculate score points:
    // Plated rice is primary (up to 5000 pts)
    // Doneness (up to 3000 pts)
    // Burn penalty (up to -3000 pts)
    // Time bonus
    const timeBonus = Math.max(0, Math.round((targetTime - timeElapsed) * 50));
    const rawScore = Math.max(
      0,
      platedGrains * 16 + avgDoneness * 30 - avgBurnDamage * 45 + timeBonus
    );

    // Check & update Personal Best
    const prevPB = this.getPersonalBest();
    let isPB = false;
    if (!prevPB || rawScore > prevPB.score) {
      isPB = true;
      this.savePersonalBest({
        score: rawScore,
        grade,
        platedPercent,
        avgDoneness,
        avgBurnDamage,
        time: timeElapsed,
        date: new Date().toISOString().split("T")[0],
      });
    }

    return {
      grade,
      title,
      summary,
      startingGrains,
      retainedAtFinish,
      platedGrains,
      platedPercent,
      avgDoneness,
      avgBurnDamage,
      timeElapsed,
      targetTime,
      score: rawScore,
      isPersonalBest: isPB,
    };
  }

  public static getPersonalBest(): PersonalBest | null {
    if (typeof window === "undefined" || !window.localStorage) return null;
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data) as PersonalBest;
    } catch {
      return null;
    }
  }

  public static savePersonalBest(pb: PersonalBest): void {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(pb));
    } catch {
      // Ignored if storage is blocked
    }
  }
}
