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
        expectedAnswer: rateRounded,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "State whole number or round to nearest tenth.",
        tolerance: 0.1,
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
        expectedAnswer: data.rate,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.1,
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
        expectedAnswer: data.rate,
        expectedUnit: "mL/hr",
        roundingMode: "whole",
        roundingInstruction: "State whole number.",
        tolerance: 0.05,
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
        expectedAnswer: rateRounded,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.1,
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
        expectedAnswer: data.rate,
        expectedUnit: "mL/hr",
        roundingMode: "whole",
        roundingInstruction: "State whole number.",
        tolerance: 0.05,
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
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "whole",
        roundingInstruction: "State whole number of mL.",
        tolerance: 0.05,
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
];
