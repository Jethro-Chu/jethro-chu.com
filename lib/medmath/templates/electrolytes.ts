import type { QuestionTemplate } from "../types.ts";
import { pick } from "./helpers.ts";

export const electrolyteTemplates: QuestionTemplate[] = [
  {
    id: "lytes-kcl-peripheral-10meq",
    category: "electrolytes",
    subtype: "kcl-replacement",
    difficulty: "beginner",
    title: "Potassium Chloride (KCl) Peripheral IVPB Rate",
    clinicalContext: "Adult Med-Surg Hypokalemia Replacement Protocol",
    generate: (rng) => {
      const data = pick([
        { meq: 10, volMl: 100, hrs: 1, rate: 100 },
        { meq: 10, volMl: 100, hrs: 2, rate: 50 },
        { meq: 20, volMl: 250, hrs: 2, rate: 125 },
        { meq: 20, volMl: 250, hrs: 4, rate: 62.5 },
      ], rng);

      const rateRounded = Math.round(data.rate * 10) / 10;
      return {
        scenario: `An adult medical-surgical patient with a serum potassium of 3.3 mEq/L is prescribed IV potassium replacement via peripheral IV line (max peripheral infusion rate: 10 mEq/hr).`,
        orderText: `Potassium Chloride ${data.meq} mEq in ${data.volMl} mL 0.9% NS IVPB over ${data.hrs} hour${data.hrs > 1 ? "s" : ""}`,
        prompt: `At what rate in mL/hr should the nurse set the infusion pump?`,
        correctAnswer: rateRounded,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "State whole number or round to nearest tenth.",
        hints: [
          "Use the formula: Volume (mL) ÷ Time (hours).",
          `Divide ${data.volMl} mL by ${data.hrs} hours.`,
          `Calculate: ${data.volMl} mL ÷ ${data.hrs} hr = ${rateRounded} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate IV Pump Flow Rate",
            formula: "Total Volume (mL) ÷ Hours",
            calculation: `${data.volMl} mL ÷ ${data.hrs} hr = ${rateRounded} mL/hr`,
            result: `${rateRounded} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "lytes-kcl-central-line-20meq",
    category: "electrolytes",
    subtype: "kcl-replacement",
    difficulty: "intermediate",
    title: "Potassium Chloride Central Line Rapid Replacement Rate",
    clinicalContext: "Adult Step-Down / Telemetry Monitored Potassium Protocol",
    generate: (rng) => {
      const data = pick([
        { meq: 20, volMl: 100, hrs: 1, rate: 100 },
        { meq: 20, volMl: 100, hrs: 2, rate: 50 },
        { meq: 40, volMl: 250, hrs: 2, rate: 125 },
        { meq: 40, volMl: 250, hrs: 4, rate: 62.5 },
      ], rng);

      return {
        scenario: `An adult telemetry patient with a central venous catheter and continuous cardiac monitoring is ordered concentrated IV potassium chloride.`,
        orderText: `KCl ${data.meq} mEq in ${data.volMl} mL sterile water IVPB via central line over ${data.hrs} hour${data.hrs > 1 ? "s" : ""}`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: data.rate,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          "Formula: Total Volume (mL) ÷ Time (hours).",
          `Divide ${data.volMl} mL by ${data.hrs} hours.`,
          `Calculate: ${data.volMl} ÷ ${data.hrs} = ${data.rate} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Central Line Pump Rate",
            formula: "Volume ÷ Hours",
            calculation: `${data.volMl} mL ÷ ${data.hrs} hr = ${data.rate} mL/hr`,
            result: `${data.rate} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "lytes-magnesium-sulfate-2g",
    category: "electrolytes",
    subtype: "magnesium-replacement",
    difficulty: "beginner",
    title: "Magnesium Sulfate 2 g IVPB Rate (1 Hour)",
    clinicalContext: "Adult Inpatient Hypomagnesemia Protocol",
    generate: (rng) => {
      const data = pick([
        { grams: 2, volMl: 100, mins: 60, rate: 100 },
        { grams: 1, volMl: 100, mins: 60, rate: 100 },
        { grams: 2, volMl: 50, mins: 60, rate: 50 },
        { grams: 2, volMl: 100, mins: 30, rate: 200 },
      ], rng);

      return {
        scenario: `An adult inpatient with serum magnesium of 1.4 mg/dL is ordered IV magnesium replacement.`,
        orderText: `Magnesium Sulfate ${data.grams} g in ${data.volMl} mL D5W IVPB over ${data.mins} minutes`,
        prompt: `Calculate the pump rate in mL/hr.`,
        correctAnswer: data.rate,
        answerUnit: "mL/hr",
        answerPrecision: 0,
        roundingInstruction: "State whole number.",
        hints: [
          `Convert ${data.mins} minutes to hours: ${data.mins} ÷ 60 = ${data.mins / 60} hr.`,
          `Apply formula: Volume (mL) ÷ Hours.`,
          `Calculate: ${data.volMl} mL ÷ ${data.mins / 60} hr = ${data.rate} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Hourly Rate",
            formula: "Volume (mL) ÷ Hours",
            calculation: `${data.volMl} mL ÷ (${data.mins} ÷ 60 hr) = ${data.rate} mL/hr`,
            result: `${data.rate} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "lytes-magnesium-sulfate-4g-2hr",
    category: "electrolytes",
    subtype: "magnesium-replacement",
    difficulty: "beginner",
    title: "Magnesium Sulfate 4 g Extended Infusion Rate",
    clinicalContext: "Adult Inpatient Severe Hypomagnesemia Protocol",
    generate: (rng) => {
      const data = pick([
        { grams: 4, volMl: 250, hrs: 2, rate: 125 },
        { grams: 4, volMl: 250, hrs: 4, rate: 62.5 },
        { grams: 4, volMl: 500, hrs: 4, rate: 125 },
        { grams: 4, volMl: 200, hrs: 2, rate: 100 },
      ], rng);

      const rateRounded = Math.round(data.rate * 10) / 10;
      return {
        scenario: `An adult telemetry patient with symptomatic low magnesium and telemetry ectopy is ordered an extended IV magnesium sulfate infusion.`,
        orderText: `Magnesium Sulfate ${data.grams} g in ${data.volMl} mL 0.9% NS IVPB over ${data.hrs} hours`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: rateRounded,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          "Formula: Volume (mL) ÷ Hours.",
          `Divide ${data.volMl} mL by ${data.hrs} hours.`,
          `Calculate: ${data.volMl} ÷ ${data.hrs} = ${rateRounded} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Flow Rate",
            formula: "Total Volume ÷ Total Hours",
            calculation: `${data.volMl} mL ÷ ${data.hrs} hr = ${rateRounded} mL/hr`,
            result: `${rateRounded} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "lytes-calcium-gluconate-ivpb",
    category: "electrolytes",
    subtype: "calcium-replacement",
    difficulty: "intermediate",
    title: "Calcium Gluconate 30-Minute IVPB Rate",
    clinicalContext: "Adult Med-Surg Hypocalcemia / Hyperkalemia Protocol",
    generate: (rng) => {
      const data = pick([
        { grams: 1, volMl: 50, mins: 30, rate: 100 },
        { grams: 2, volMl: 100, mins: 30, rate: 200 },
        { grams: 1, volMl: 100, mins: 60, rate: 100 },
        { grams: 2, volMl: 100, mins: 60, rate: 100 },
      ], rng);

      return {
        scenario: `An adult inpatient with acute hypocalcemia (ionized Ca 0.85 mmol/L) is ordered IV calcium gluconate piggyback.`,
        orderText: `Calcium Gluconate ${data.grams} g in ${data.volMl} mL D5W IVPB over ${data.mins} minutes`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: data.rate,
        answerUnit: "mL/hr",
        answerPrecision: 0,
        roundingInstruction: "State whole number.",
        hints: [
          `Convert ${data.mins} minutes to hours: ${data.mins} ÷ 60 = ${data.mins / 60} hr.`,
          `Apply formula: Volume ÷ (Minutes ÷ 60).`,
          `Calculate: ${data.volMl} mL ÷ ${data.mins / 60} hr = ${data.rate} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Rate in mL/hr",
            formula: "Volume ÷ (Minutes ÷ 60)",
            calculation: `${data.volMl} mL ÷ (${data.mins} ÷ 60 hr) = ${data.rate} mL/hr`,
            result: `${data.rate} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "lytes-sodium-bicarb-ampule",
    category: "electrolytes",
    subtype: "bicarbonate-calc",
    difficulty: "beginner",
    title: "Sodium Bicarbonate 8.4% Volume & mEq Calculation",
    clinicalContext: "Adult Inpatient Severe Metabolic Acidosis Order",
    generate: (rng) => {
      const data = pick([
        { orderedMeq: 50, ampMeq: 50, ampMl: 50, ans: 50 },
        { orderedMeq: 100, ampMeq: 50, ampMl: 50, ans: 100 },
        { orderedMeq: 25, ampMeq: 50, ampMl: 50, ans: 25 },
      ], rng);

      return {
        scenario: `An adult inpatient in acute metabolic acidosis is ordered IV push sodium bicarbonate. Standard 8.4% Sodium Bicarbonate contains 50 mEq in 50 mL (1 mEq/mL).`,
        orderText: `Sodium Bicarbonate ${data.orderedMeq} mEq IV push over 5 minutes`,
        availableText: `Sodium Bicarbonate 8.4% prefilled syringe containing ${data.ampMeq} mEq in ${data.ampMl} mL (1 mEq/mL)`,
        prompt: `How many mL should the nurse administer to deliver ${data.orderedMeq} mEq?`,
        correctAnswer: data.ans,
        answerUnit: "mL",
        answerPrecision: 0,
        roundingInstruction: "State whole number of mL.",
        hints: [
          "Note the concentration: 50 mEq in 50 mL = 1 mEq/mL.",
          "Apply formula: Desired mEq ÷ Have (1 mEq/mL).",
          `Calculate: ${data.orderedMeq} mEq ÷ 1 mEq/mL = ${data.ans} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Syringe Volume",
            formula: "Desired mEq ÷ Concentration (1 mEq/mL)",
            calculation: `${data.orderedMeq} mEq ÷ 1 mEq/mL = ${data.ans} mL`,
            result: `${data.ans} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "lytes-hypertonic-3-percent-rate",
    category: "electrolytes",
    subtype: "hypertonic-saline",
    difficulty: "intermediate",
    title: "3% Hypertonic Saline Continuous Infusion Rate",
    clinicalContext: "Adult Neuro-ICU Symptomatic Severe Hyponatremia",
    generate: (rng) => {
      const data = pick([
        { orderedMlHr: 30, bagMl: 500, hoursToRun: 16.7 },
        { orderedMlHr: 50, bagMl: 500, hoursToRun: 10.0 },
        { orderedMlHr: 25, bagMl: 500, hoursToRun: 20.0 },
        { orderedMlHr: 40, bagMl: 500, hoursToRun: 12.5 },
      ], rng);

      return {
        scenario: `An adult ICU patient with severe symptomatic hyponatremia (serum Na+ 112 mEq/L) is ordered 3% Hypertonic Saline continuous IV infusion via central line at ${data.orderedMlHr} mL/hr with q2h sodium checks.`,
        orderText: `3% Sodium Chloride continuous IV infusion at ${data.orderedMlHr} mL/hr via central line`,
        availableText: `3% Sodium Chloride 500 mL IV infusion bag (513 mEq Na+/L)`,
        prompt: `How many hours will one 500 mL bag of 3% saline last running at ${data.orderedMlHr} mL/hr?`,
        correctAnswer: data.hoursToRun,
        answerUnit: "hours",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth (e.g. 16.7 or 10.0).",
        hints: [
          `Divide bag volume (${data.bagMl} mL) by the hourly rate (${data.orderedMlHr} mL/hr).`,
          `Calculate: ${data.bagMl} ÷ ${data.orderedMlHr} = ${data.hoursToRun} hours.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Infusion Duration",
            formula: "Bag Volume (mL) ÷ Rate (mL/hr)",
            calculation: `${data.bagMl} mL ÷ ${data.orderedMlHr} mL/hr = ${data.hoursToRun} hours`,
            result: `${data.hoursToRun} hours`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "lytes-calcium-gluconate-cardioprotection",
    category: "electrolytes",
    subtype: "calcium-replacement",
    difficulty: "beginner",
    title: "10% Calcium Gluconate Cardioprotection IV Push Volume",
    clinicalContext: "Adult Inpatient Hyperkalemia Cardiac Membrane Stabilization",
    generate: (rng) => {
      const data = pick([
        { orderedGrams: 1.0, concMgMl: 100, ampGrams: 1.0, ampMl: 10, ansMl: 10 },
        { orderedGrams: 2.0, concMgMl: 100, ampGrams: 1.0, ampMl: 10, ansMl: 20 },
        { orderedGrams: 3.0, concMgMl: 100, ampGrams: 1.0, ampMl: 10, ansMl: 30 },
      ], rng);

      return {
        scenario: `An adult patient on telemetry with peaked T waves from severe hyperkalemia (K+ 6.8 mEq/L) is prescribed ${data.orderedGrams} g IV Calcium Gluconate over 5 minutes for myocardial membrane stabilization.`,
        orderText: `Calcium Gluconate ${data.orderedGrams} g IV push over 5 minutes stat`,
        availableText: `Calcium Gluconate 10% injection (1 g in 10 mL vial = 100 mg/mL)`,
        prompt: `How many mL of 10% Calcium Gluconate should the nurse draw up?`,
        correctAnswer: data.ansMl,
        answerUnit: "mL",
        answerPrecision: 0,
        roundingInstruction: "State whole number of mL.",
        hints: [
          "Each 10 mL vial of 10% Calcium Gluconate contains 1 g (1,000 mg).",
          `Calculate: ${data.orderedGrams} g × (10 mL / 1 g) = ${data.ansMl} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Administration Volume",
            formula: "Ordered Grams × 10 mL/g",
            calculation: `${data.orderedGrams} g × 10 mL/g = ${data.ansMl} mL`,
            result: `${data.ansMl} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "lytes-potassium-phosphate-infusion",
    category: "electrolytes",
    subtype: "phosphate-replacement",
    difficulty: "intermediate",
    title: "Potassium Phosphate IVPB Flow Rate (mL/hr)",
    clinicalContext: "Adult ICU Refeeding Syndrome Hypophosphatemia",
    generate: (rng) => {
      const data = pick([
        { mmol: 15, meqK: 22, bagMl: 250, hours: 4, rateMlHr: 62.5 },
        { mmol: 30, meqK: 44, bagMl: 500, hours: 6, rateMlHr: 83.3 },
        { mmol: 15, meqK: 22, bagMl: 100, hours: 2, rateMlHr: 50.0 },
        { mmol: 20, meqK: 30, bagMl: 250, hours: 4, rateMlHr: 62.5 },
      ], rng);

      return {
        scenario: `An adult ICU patient with refeeding syndrome develops acute hypophosphatemia (serum PO4 1.2 mg/dL) and is prescribed IV potassium phosphate (${data.mmol} mmol containing ${data.meqK} mEq K+) in ${data.bagMl} mL 0.9% NS to infuse over ${data.hours} hours.`,
        orderText: `Potassium Phosphate ${data.mmol} mmol in ${data.bagMl} mL NS IVPB over ${data.hours} hours`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth (e.g. 62.5 or 83.3).",
        hints: [
          `Divide total volume (${data.bagMl} mL) by ordered hours (${data.hours} hr).`,
          `Calculate: ${data.bagMl} ÷ ${data.hours} = ${data.rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Flow Rate",
            formula: "Total Volume (mL) ÷ Run Time (hours)",
            calculation: `${data.bagMl} mL ÷ ${data.hours} hr = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "lytes-tpn-dextrose-daily-calories",
    category: "electrolytes",
    subtype: "tpn-calc",
    difficulty: "advanced",
    title: "Total Parenteral Nutrition (TPN) Dextrose Grams & Calories",
    clinicalContext: "Adult Inpatient Clinical Nutrition Support",
    generate: (rng) => {
      const data = pick([
        { rateMlHr: 80, dailyMl: 1920, dextrosePercent: 20, dextroseGrams: 384, kcal: 1305.6 },
        { rateMlHr: 100, dailyMl: 2400, dextrosePercent: 15, dextroseGrams: 360, kcal: 1224.0 },
        { rateMlHr: 75, dailyMl: 1800, dextrosePercent: 25, dextroseGrams: 450, kcal: 1530.0 },
        { rateMlHr: 60, dailyMl: 1440, dextrosePercent: 20, dextroseGrams: 288, kcal: 979.2 },
      ], rng);

      return {
        scenario: `An adult post-operative patient unable to tolerate enteral feeding receives a continuous 24-hour TPN infusion at ${data.rateMlHr} mL/hr. The solution contains ${data.dextrosePercent}% Dextrose (D${data.dextrosePercent}W = ${data.dextrosePercent * 10} g/L = ${data.dextrosePercent / 100} g/mL).`,
        orderText: `TPN with ${data.dextrosePercent}% Dextrose at ${data.rateMlHr} mL/hr continuous infusion`,
        prompt: `How many grams of dextrose will the patient receive over the full 24-hour day?`,
        correctAnswer: data.dextroseGrams,
        answerUnit: "g",
        answerPrecision: 0,
        roundingInstruction: "State whole number of grams.",
        hints: [
          `Step 1: Calculate 24-hour volume: ${data.rateMlHr} mL/hr × 24 hr = ${data.dailyMl} mL.`,
          `Step 2: A ${data.dextrosePercent}% dextrose solution contains ${data.dextrosePercent} g per 100 mL (${data.dextrosePercent / 100} g/mL).`,
          `Calculate: ${data.dailyMl} mL × ${data.dextrosePercent / 100} g/mL = ${data.dextroseGrams} g.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Total Daily Volume",
            formula: "Rate (mL/hr) × 24 Hours",
            calculation: `${data.rateMlHr} mL/hr × 24 hr = ${data.dailyMl} mL`,
            result: `${data.dailyMl} mL`,
          },
          {
            stepNumber: 2,
            title: "Calculate Total Dextrose Grams",
            formula: "Daily Volume (mL) × (Dextrose % ÷ 100)",
            calculation: `${data.dailyMl} mL × ${data.dextrosePercent / 100} = ${data.dextroseGrams} g`,
            result: `${data.dextroseGrams} g`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "lytes-tpn-amino-acid-delivery",
    category: "electrolytes",
    subtype: "tpn-calc",
    difficulty: "intermediate",
    title: "TPN Daily Amino Acid (Protein) Delivery Calculation",
    clinicalContext: "Adult ICU Catabolic Nitrogen Balance Management",
    generate: (rng) => {
      const data = pick([
        { rateMlHr: 75, dailyMl: 1800, aaPercent: 5, aaGrams: 90 },
        { rateMlHr: 80, dailyMl: 1920, aaPercent: 4.25, aaGrams: 81.6 },
        { rateMlHr: 100, dailyMl: 2400, aaPercent: 5, aaGrams: 120 },
        { rateMlHr: 60, dailyMl: 1440, aaPercent: 6, aaGrams: 86.4 },
      ], rng);

      return {
        scenario: `An adult surgical ICU patient with severe wound breakdown is receiving TPN containing ${data.aaPercent}% Amino Acids infusing at ${data.rateMlHr} mL/hr continuously.`,
        orderText: `TPN with ${data.aaPercent}% Amino Acids at ${data.rateMlHr} mL/hr`,
        prompt: `How many grams of amino acids (protein) are delivered to the patient in 24 hours?`,
        correctAnswer: data.aaGrams,
        answerUnit: "g",
        answerPrecision: 1,
        roundingInstruction: "State exact number or round to nearest tenth.",
        hints: [
          `Step 1: Calculate total volume: ${data.rateMlHr} mL/hr × 24 hr = ${data.dailyMl} mL.`,
          `Step 2: Multiply volume by ${data.aaPercent}% (${data.aaPercent / 100} g/mL).`,
          `Calculate: ${data.dailyMl} × ${data.aaPercent / 100} = ${data.aaGrams} g.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Total Volume Delivered",
            formula: "Rate (mL/hr) × 24 hr",
            calculation: `${data.rateMlHr} mL/hr × 24 hr = ${data.dailyMl} mL`,
            result: `${data.dailyMl} mL`,
          },
          {
            stepNumber: 2,
            title: "Calculate Total Amino Acid Grams",
            formula: "Volume (mL) × (Amino Acid % ÷ 100)",
            calculation: `${data.dailyMl} mL × ${data.aaPercent / 100} = ${data.aaGrams} g`,
            result: `${data.aaGrams} g`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "lytes-kcl-fluid-additive-volume",
    category: "electrolytes",
    subtype: "kcl-replacement",
    difficulty: "beginner",
    title: "Potassium Chloride Additive Volume to Maintenance Bag",
    clinicalContext: "Adult Inpatient Fluid Compounding Verification",
    generate: (rng) => {
      const data = pick([
        { desiredMeq: 20, vialConcMeqMl: 2.0, ansMl: 10 },
        { desiredMeq: 40, vialConcMeqMl: 2.0, ansMl: 20 },
        { desiredMeq: 30, vialConcMeqMl: 2.0, ansMl: 15 },
        { desiredMeq: 10, vialConcMeqMl: 2.0, ansMl: 5 },
      ], rng);

      return {
        scenario: `A physician orders D5 0.45% Normal Saline + ${data.desiredMeq} mEq KCl per 1,000 mL bag for maintenance hydration. The pharmacy supplies concentrated Potassium Chloride vials labeled 2 mEq/mL.`,
        orderText: `Add ${data.desiredMeq} mEq KCl to 1,000 mL D5 0.45% NS`,
        availableText: `Potassium Chloride 2 mEq/mL vial`,
        prompt: `How many mL of KCl solution should be added to the IV fluid bag?`,
        correctAnswer: data.ansMl,
        answerUnit: "mL",
        answerPrecision: 0,
        roundingInstruction: "State whole number of mL.",
        hints: [
          "Divide prescribed mEq by vial concentration (2 mEq/mL).",
          `Calculate: ${data.desiredMeq} mEq ÷ 2 mEq/mL = ${data.ansMl} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Additive Volume",
            formula: "Prescribed mEq ÷ Concentration (2 mEq/mL)",
            calculation: `${data.desiredMeq} mEq ÷ 2 mEq/mL = ${data.ansMl} mL`,
            result: `${data.ansMl} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "lytes-sodium-phosphate-infusion",
    category: "electrolytes",
    subtype: "phosphate-replacement",
    difficulty: "intermediate",
    title: "Sodium Phosphate IVPB Flow Rate (mL/hr)",
    clinicalContext: "Adult Inpatient Hypophosphatemia Replacement",
    generate: (rng) => {
      const data = pick([
        { mmol: 30, bagMl: 500, hours: 6, rateMlHr: 83.3 },
        { mmol: 15, bagMl: 250, hours: 4, rateMlHr: 62.5 },
        { mmol: 45, bagMl: 500, hours: 6, rateMlHr: 83.3 },
        { mmol: 20, bagMl: 250, hours: 3, rateMlHr: 83.3 },
      ], rng);

      return {
        scenario: `An adult medical inpatient with severe hypophosphatemia is prescribed IV sodium phosphate (${data.mmol} mmol) compounded in ${data.bagMl} mL D5W to infuse over ${data.hours} hours.`,
        orderText: `Sodium Phosphate ${data.mmol} mmol in ${data.bagMl} mL D5W IVPB over ${data.hours} hours`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth (e.g. 83.3 or 62.5).",
        hints: [
          `Divide bag volume (${data.bagMl} mL) by duration (${data.hours} hr).`,
          `Calculate: ${data.bagMl} ÷ ${data.hours} = ${data.rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Flow Rate",
            formula: "Total Volume ÷ Run Time (hours)",
            calculation: `${data.bagMl} mL ÷ ${data.hours} hr = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "lytes-tpn-lipid-rate-over-time",
    category: "electrolytes",
    subtype: "tpn-calc",
    difficulty: "intermediate",
    title: "20% Lipid Emulsion Infusion Rate over 12 Hours",
    clinicalContext: "Adult Inpatient Parenteral Nutrition Fatty Acid Delivery",
    generate: (rng) => {
      const data = pick([
        { bagMl: 250, hours: 12, rateMlHr: 20.8 },
        { bagMl: 500, hours: 24, rateMlHr: 20.8 },
        { bagMl: 250, hours: 10, rateMlHr: 25.0 },
        { bagMl: 500, hours: 12, rateMlHr: 41.7 },
      ], rng);

      return {
        scenario: `An adult inpatient on home parenteral nutrition requires supplemental essential fatty acids. The physician prescribes a ${data.bagMl} mL bottle of 20% Lipid Emulsion to infuse via central line over ${data.hours} hours.`,
        orderText: `20% Lipid Emulsion ${data.bagMl} mL IV infusion over ${data.hours} hours`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth (e.g. 20.8).",
        hints: [
          `Divide total volume (${data.bagMl} mL) by run time (${data.hours} hours).`,
          `Calculate: ${data.bagMl} ÷ ${data.hours} = ${data.rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Hourly Flow Rate",
            formula: "Total Volume (mL) ÷ Hours",
            calculation: `${data.bagMl} mL ÷ ${data.hours} hr = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "lytes-magnesium-sulfate-2g-100ml",
    category: "electrolytes",
    subtype: "magnesium-calc",
    difficulty: "beginner",
    title: "Magnesium Sulfate 2 g IVPB Rate (60 Minutes)",
    clinicalContext: "Adult Med-Surg Hypomagnesemia Replacement",
    generate: (rng) => {
      const data = pick([
        { grams: 2, volMl: 100, mins: 60, rateMlHr: 100 },
        { grams: 1, volMl: 100, mins: 60, rateMlHr: 100 },
        { grams: 4, volMl: 250, mins: 120, rateMlHr: 125 },
        { grams: 2, volMl: 100, mins: 30, rateMlHr: 200 },
      ], rng);

      return {
        scenario: `An adult medical patient with a serum magnesium of 1.4 mg/dL is prescribed IV magnesium sulfate replacement.`,
        orderText: `Magnesium Sulfate ${data.grams} g in ${data.volMl} mL D5W IVPB over ${data.mins} minutes`,
        prompt: `Calculate the IV pump infusion rate in mL/hr.`,
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 0,
        roundingInstruction: "State whole number of mL/hr.",
        hints: [
          `Apply IV pump formula: (Total Volume in mL ÷ Run Time in Minutes) × 60.`,
          `Calculate: (${data.volMl} ÷ ${data.mins}) × 60 = ${data.rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Flow Rate",
            formula: "(Volume ÷ Minutes) × 60",
            calculation: `(${data.volMl} mL ÷ ${data.mins} min) × 60 = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "lytes-calcium-chloride-potency",
    category: "electrolytes",
    subtype: "calcium-replacement",
    difficulty: "intermediate",
    title: "10% Calcium Chloride Central Line IV Push Volume",
    clinicalContext: "Adult ICU Severe Hyperkalemia / Calcium Channel Blocker Toxicity",
    generate: (rng) => {
      const data = pick([
        { orderedGrams: 1.0, ampGrams: 1.0, ampMl: 10, concMgMl: 100, ansMl: 10 },
        { orderedGrams: 0.5, ampGrams: 1.0, ampMl: 10, concMgMl: 100, ansMl: 5 },
        { orderedGrams: 2.0, ampGrams: 1.0, ampMl: 10, concMgMl: 100, ansMl: 20 },
      ], rng);

      return {
        scenario: `An adult ICU patient in severe cardiac collapse from calcium channel blocker overdose is ordered 10% Calcium Chloride IV push via central line over 5 minutes (Note: 10% Calcium Chloride contains 3x the elemental calcium of gluconate and must only be given via central venous access).`,
        orderText: `Calcium Chloride 10% ${data.orderedGrams} g IV push over 5 minutes stat via central line`,
        availableText: `Calcium Chloride 10% 1 g / 10 mL syringe (100 mg/mL)`,
        prompt: `How many mL should the nurse administer?`,
        correctAnswer: data.ansMl,
        answerUnit: "mL",
        answerPrecision: 0,
        roundingInstruction: "State whole number of mL.",
        hints: [
          "Each 10 mL syringe contains 1 g (1,000 mg) of Calcium Chloride.",
          `Calculate: ${data.orderedGrams} g × (10 mL / 1 g) = ${data.ansMl} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Syringe Volume",
            formula: "Ordered Grams × (10 mL / 1 g)",
            calculation: `${data.orderedGrams} g × 10 mL/g = ${data.ansMl} mL`,
            result: `${data.ansMl} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
];
