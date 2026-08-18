import type { QuestionTemplate } from "../types.ts";
import { pick, ADULT_WEIGHTS_KG } from "./helpers.ts";

export const insulinTemplates: QuestionTemplate[] = [
  {
    id: "insulin-sliding-scale-only",
    category: "insulin",
    subtype: "correction-scale",
    difficulty: "beginner",
    title: "Correction Sliding Scale Insulin Dose",
    clinicalContext: "Adult Inpatient Endocrine Protocol",
    generate: (rng) => {
      const data = pick([
        { bg: 224, tier: "200–249 mg/dL", units: 4 },
        { bg: 287, tier: "250–299 mg/dL", units: 6 },
        { bg: 178, tier: "150–199 mg/dL", units: 2 },
        { bg: 312, tier: "300–349 mg/dL", units: 8 },
        { bg: 365, tier: "350–399 mg/dL", units: 10 },
      ], rng);

      return {
        scenario: `The nurse checks an adult patient's pre-meal capillary blood glucose before lunch. The point-of-care reading is ${data.bg} mg/dL.`,
        orderText: `Administer subcutaneous Lispro insulin per institutional Low-Dose Sliding Scale:
• BG < 150 mg/dL: 0 units
• BG 150–199 mg/dL: 2 units
• BG 200–249 mg/dL: 4 units
• BG 250–299 mg/dL: 6 units
• BG 300–349 mg/dL: 8 units
• BG 350–399 mg/dL: 10 units
• BG ≥ 400 mg/dL: 12 units and notify provider`,
        prompt: `According to the sliding scale order, how many units of subcutaneous Lispro should the nurse administer for a blood glucose of ${data.bg} mg/dL?`,
        expectedAnswer: data.units,
        expectedUnit: "units",
        roundingMode: "whole",
        roundingInstruction: "State exact whole number of units.",
        tolerance: 0.01,
        hints: [
          `Find the range in the table that contains ${data.bg} mg/dL.`,
          `${data.bg} mg/dL falls within the ${data.tier} tier.`,
          `Administer ${data.units} units.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Locate Blood Glucose Tier",
            explanation: `Blood glucose of ${data.bg} mg/dL falls in the bracket: ${data.tier}.`,
            calculation: `${data.bg} mg/dL in [${data.tier}] = ${data.units} units`,
            result: `${data.units} units`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "insulin-scheduled-plus-correction",
    category: "insulin",
    subtype: "scheduled-plus-correction",
    difficulty: "intermediate",
    title: "Combined Scheduled Mealtime & Correction Insulin",
    clinicalContext: "Adult Med-Surg Diabetes Management",
    generate: (rng) => {
      const data = pick([
        { bg: 287, scheduledUnits: 8, correctionUnits: 6, totalUnits: 14, tier: "250–299 mg/dL" },
        { bg: 218, scheduledUnits: 6, correctionUnits: 4, totalUnits: 10, tier: "200–249 mg/dL" },
        { bg: 326, scheduledUnits: 10, correctionUnits: 8, totalUnits: 18, tier: "300–349 mg/dL" },
        { bg: 182, scheduledUnits: 5, correctionUnits: 2, totalUnits: 7, tier: "150–199 mg/dL" },
        { bg: 142, scheduledUnits: 6, correctionUnits: 0, totalUnits: 6, tier: "< 150 mg/dL" },
      ], rng);

      return {
        scenario: `An adult medical-surgical patient with Type 2 Diabetes is about to eat dinner. Pre-meal capillary blood glucose is ${data.bg} mg/dL.`,
        orderText: `1. Lispro insulin ${data.scheduledUnits} units SubQ TID with meals
2. Lispro insulin sliding scale SubQ before meals:
• < 150 mg/dL: 0 units
• 150–199 mg/dL: 2 units
• 200–249 mg/dL: 4 units
• 250–299 mg/dL: 6 units
• 300–349 mg/dL: 8 units
• ≥ 350 mg/dL: 10 units`,
        prompt: `Calculate the total units of Lispro insulin the nurse should draw into the single insulin syringe.`,
        expectedAnswer: data.totalUnits,
        expectedUnit: "units",
        roundingMode: "whole",
        roundingInstruction: "State whole number of units.",
        tolerance: 0.01,
        hints: [
          `Identify the scheduled mealtime dose (${data.scheduledUnits} units).`,
          `Look up the correction dose for BG ${data.bg} mg/dL (${data.correctionUnits} units).`,
          `Add scheduled dose + correction dose: ${data.scheduledUnits} + ${data.correctionUnits} = ${data.totalUnits} units.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Identify Scheduled Meal Dose",
            calculation: `Scheduled Meal Dose = ${data.scheduledUnits} units`,
            result: `${data.scheduledUnits} units`,
          },
          {
            stepNumber: 2,
            title: "Determine Sliding Scale Correction",
            calculation: `Correction for BG ${data.bg} mg/dL (${data.tier}) = ${data.correctionUnits} units`,
            result: `${data.correctionUnits} units`,
          },
          {
            stepNumber: 3,
            title: "Calculate Total Dose",
            formula: "Scheduled Dose + Correction Dose",
            calculation: `${data.scheduledUnits} units + ${data.correctionUnits} units = ${data.totalUnits} units`,
            result: `${data.totalUnits} units`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "insulin-carb-ratio-coverage",
    category: "insulin",
    subtype: "carb-counting",
    difficulty: "intermediate",
    title: "Carbohydrate Ratio Insulin Coverage",
    clinicalContext: "Adult Inpatient Meal Carbohydrate Counting",
    generate: (rng) => {
      const data = pick([
        { carbGrams: 60, ratio: 10, units: 6 },
        { carbGrams: 75, ratio: 15, units: 5 },
        { carbGrams: 90, ratio: 15, units: 6 },
        { carbGrams: 80, ratio: 10, units: 8 },
        { carbGrams: 45, ratio: 15, units: 3 },
      ], rng);

      return {
        scenario: `An adult inpatient on a carbohydrate-counting meal protocol consumes a meal containing ${data.carbGrams} grams of carbohydrates.`,
        orderText: `Administer Regular insulin SubQ with meals: 1 unit per ${data.ratio} grams of carbohydrates consumed`,
        prompt: `How many units of Regular insulin should the nurse administer for this meal?`,
        expectedAnswer: data.units,
        expectedUnit: "units",
        roundingMode: "whole",
        roundingInstruction: "State whole number of units.",
        tolerance: 0.01,
        hints: [
          "Use the formula: Total Carbs (grams) ÷ Insulin-to-Carb Ratio.",
          `Divide ${data.carbGrams} g by ${data.ratio} g/unit.`,
          `Calculate: ${data.carbGrams} ÷ ${data.ratio}.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Carbohydrate Insulin Dose",
            formula: "Grams Carbs ÷ Carb Ratio",
            calculation: `${data.carbGrams} g ÷ ${data.ratio} g/unit = ${data.units} units`,
            result: `${data.units} units`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "insulin-carb-and-correction-factor",
    category: "insulin",
    subtype: "advanced-insulin",
    difficulty: "advanced",
    title: "Advanced Insulin: Carb Coverage Plus Correction Factor",
    clinicalContext: "Adult Endocrine Inpatient Protocol",
    generate: (rng) => {
      const data = pick([
        { currentBg: 310, targetBg: 150, cf: 40, carbs: 60, icr: 10, carbUnits: 6, corrUnits: 4, total: 10 },
        { currentBg: 270, targetBg: 150, cf: 30, carbs: 45, icr: 15, carbUnits: 3, corrUnits: 4, total: 7 },
        { currentBg: 250, targetBg: 130, cf: 40, carbs: 75, icr: 15, carbUnits: 5, corrUnits: 3, total: 8 },
        { currentBg: 350, targetBg: 150, cf: 50, carbs: 80, icr: 10, carbUnits: 8, corrUnits: 4, total: 12 },
      ], rng);

      return {
        scenario: `An adult patient has an insulin regimen calculating meal coverage plus high glucose correction.`,
        orderText: `• Carbohydrate ratio: 1 unit per ${data.icr} g carbs
• High BG correction: 1 unit for every ${data.cf} mg/dL above target BG of ${data.targetBg} mg/dL
• Current blood glucose: ${data.currentBg} mg/dL
• Meal intake: ${data.carbs} g carbohydrates`,
        prompt: `Calculate the total units of rapid-acting insulin to administer.`,
        expectedAnswer: data.total,
        expectedUnit: "units",
        roundingMode: "whole",
        roundingInstruction: "Round final dose to the nearest whole unit.",
        tolerance: 0.05,
        hints: [
          `Step 1: Calculate carb coverage (${data.carbs} g ÷ ${data.icr} g/unit = ${data.carbUnits} units).`,
          `Step 2: Calculate correction ((${data.currentBg} - ${data.targetBg}) ÷ ${data.cf} = ${data.corrUnits} units).`,
          `Step 3: Add both components (${data.carbUnits} + ${data.corrUnits} = ${data.total} units).`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Meal Carb Coverage",
            formula: "Carbs (g) ÷ Carb Ratio",
            calculation: `${data.carbs} g ÷ ${data.icr} g/unit = ${data.carbUnits} units`,
            result: `${data.carbUnits} units`,
          },
          {
            stepNumber: 2,
            title: "Calculate Glucose Correction Dose",
            formula: "(Current BG - Target BG) ÷ Correction Factor",
            calculation: `(${data.currentBg} mg/dL - ${data.targetBg} mg/dL) ÷ ${data.cf} = ${data.corrUnits} units`,
            result: `${data.corrUnits} units`,
          },
          {
            stepNumber: 3,
            title: "Sum Total Insulin Dose",
            formula: "Carb Dose + Correction Dose",
            calculation: `${data.carbUnits} units + ${data.corrUnits} units = ${data.total} units`,
            result: `${data.total} units`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "insulin-iv-drip-1to1",
    category: "insulin",
    subtype: "insulin-infusion",
    difficulty: "beginner",
    title: "Regular Insulin Continuous IV Infusion (Standard 1:1 Concentration)",
    clinicalContext: "Adult Step-Down / Telemetry Hyperglycemia Protocol",
    generate: (rng) => {
      const data = pick([
        { orderedUnitsHr: 4, bagUnits: 100, bagMl: 100, rateMlHr: 4 },
        { orderedUnitsHr: 6, bagUnits: 100, bagMl: 100, rateMlHr: 6 },
        { orderedUnitsHr: 8.5, bagUnits: 100, bagMl: 100, rateMlHr: 8.5 },
        { orderedUnitsHr: 5, bagUnits: 100, bagMl: 100, rateMlHr: 5 },
        { orderedUnitsHr: 12, bagUnits: 100, bagMl: 100, rateMlHr: 12 },
      ], rng);

      return {
        scenario: `An adult inpatient is placed on a continuous regular insulin IV infusion for persistent hyperglycemia.`,
        orderText: `Regular Insulin continuous IV infusion at ${data.orderedUnitsHr} units/hr`,
        availableText: `Regular Insulin 100 units in 100 mL 0.9% Normal Saline (1 unit/mL)`,
        prompt: `At what rate in mL/hr should the IV pump be set?`,
        expectedAnswer: data.rateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "State exact or rounded to nearest tenth.",
        tolerance: 0.05,
        hints: [
          "Check the concentration: 100 units in 100 mL equals 1 unit per 1 mL.",
          "Since 1 unit = 1 mL, the rate in mL/hr equals the ordered units/hr.",
          `Rate is ${data.rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Determine Concentration",
            formula: "Units in Bag ÷ Volume in Bag",
            calculation: `${data.bagUnits} units ÷ ${data.bagMl} mL = 1 unit/mL`,
            result: "1 unit/mL",
          },
          {
            stepNumber: 2,
            title: "Calculate Hourly Pump Rate",
            formula: "Ordered Units/hr ÷ Concentration (units/mL)",
            calculation: `${data.orderedUnitsHr} units/hr ÷ 1 unit/mL = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "insulin-iv-drip-weight-based-dka",
    category: "insulin",
    subtype: "insulin-infusion",
    difficulty: "intermediate",
    title: "Weight-Based Regular Insulin Drip for DKA Protocol",
    clinicalContext: "Adult Critical Care DKA Protocol",
    generate: (rng) => {
      const weightKg = pick(ADULT_WEIGHTS_KG, rng);
      const doseRateUnitsKgHr = 0.1; // Standard adult DKA initial rate
      const unitsHr = Math.round(weightKg * doseRateUnitsKgHr * 10) / 10;
      // Standard 100 units / 100 mL bag -> rate in mL/hr = units/hr
      const rateMlHr = unitsHr;

      return {
        scenario: `An adult patient weighing ${weightKg} kg is admitted to the ICU with Diabetic Ketoacidosis (DKA). Institutional protocol dictates starting a regular insulin infusion at 0.1 units/kg/hr.`,
        orderText: `Regular Insulin IV drip at 0.1 units/kg/hr for patient weight ${weightKg} kg`,
        availableText: `Standard IV bag: Regular Insulin 100 units in 100 mL 0.9% NS (1 unit/mL)`,
        patientWeightKg: weightKg,
        prompt: `Calculate the initial IV pump rate in mL/hr.`,
        expectedAnswer: rateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to the nearest tenth.",
        tolerance: 0.1,
        hints: [
          `Step 1: Calculate hourly units needed: ${weightKg} kg × 0.1 units/kg/hr = ${unitsHr} units/hr.`,
          "Step 2: Note concentration: 100 units / 100 mL = 1 unit/mL.",
          `Step 3: Pump rate in mL/hr = ${unitsHr} units/hr ÷ 1 unit/mL = ${rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Ordered Units per Hour",
            formula: "Weight (kg) × Dose (units/kg/hr)",
            calculation: `${weightKg} kg × 0.1 units/kg/hr = ${unitsHr} units/hr`,
            result: `${unitsHr} units/hr`,
          },
          {
            stepNumber: 2,
            title: "Convert to IV Pump Rate",
            formula: "Units/hr ÷ Concentration (1 unit/mL)",
            calculation: `${unitsHr} units/hr ÷ 1 unit/mL = ${rateMlHr} mL/hr`,
            result: `${rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { weightKg, doseRateUnitsKgHr, unitsHr, rateMlHr },
      };
    },
  },
  {
    id: "insulin-iv-drip-250units",
    category: "insulin",
    subtype: "insulin-infusion",
    difficulty: "intermediate",
    title: "Regular Insulin Drip (250 units / 250 mL)",
    clinicalContext: "Adult Step-Down Infusion Order",
    generate: (rng) => {
      const data = pick([
        { orderedUnitsHr: 7, bagUnits: 250, bagMl: 250, rateMlHr: 7 },
        { orderedUnitsHr: 9.5, bagUnits: 250, bagMl: 250, rateMlHr: 9.5 },
        { orderedUnitsHr: 14, bagUnits: 250, bagMl: 250, rateMlHr: 14 },
        { orderedUnitsHr: 3.5, bagUnits: 250, bagMl: 250, rateMlHr: 3.5 },
      ], rng);

      return {
        scenario: `A regular insulin continuous infusion is ordered for an adult inpatient on a step-down unit.`,
        orderText: `Regular Insulin IV at ${data.orderedUnitsHr} units/hr`,
        availableText: `Regular Insulin 250 units in 250 mL 0.9% Normal Saline`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        expectedAnswer: data.rateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.05,
        hints: [
          `Concentration is 250 units in 250 mL, which equals 1 unit/mL.`,
          `Since 1 unit = 1 mL, ${data.orderedUnitsHr} units/hr requires ${data.rateMlHr} mL/hr.`,
          `Calculate: ${data.orderedUnitsHr} units/hr ÷ 1 unit/mL = ${data.rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Determine Concentration",
            formula: "Units in Bag ÷ Volume in Bag",
            calculation: `${data.bagUnits} units ÷ ${data.bagMl} mL = 1 unit/mL`,
            result: "1 unit/mL",
          },
          {
            stepNumber: 2,
            title: "Calculate Flow Rate",
            formula: "Units/hr ÷ Concentration",
            calculation: `${data.orderedUnitsHr} units/hr ÷ 1 unit/mL = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "insulin-basal-glargine",
    category: "insulin",
    subtype: "basal-insulin",
    difficulty: "beginner",
    title: "Long-Acting Basal Insulin Administration",
    clinicalContext: "Adult Inpatient Bedtime Basal Order",
    generate: (rng) => {
      const data = pick([
        { med: "Glargine (Lantus)", units: 24 },
        { med: "Glargine (Lantus)", units: 32 },
        { med: "Degludec (Tresiba)", units: 20 },
        { med: "Detemir (Levemir)", units: 18 },
        { med: "Glargine (Lantus)", units: 45 },
      ], rng);

      return {
        scenario: `An adult inpatient with diabetes has a nightly basal insulin order.`,
        orderText: `${data.med} ${data.units} units SubQ daily at 2100`,
        availableText: `U-100 Insulin syringe (100 units/mL)`,
        prompt: `How many units should the nurse draw up in the U-100 insulin syringe?`,
        expectedAnswer: data.units,
        expectedUnit: "units",
        roundingMode: "whole",
        roundingInstruction: "State exact number of units.",
        tolerance: 0.01,
        hints: [
          "U-100 insulin syringes are calibrated directly in units.",
          "Check the prescription for the exact required basal dose.",
          `Draw up exactly the ordered dose of ${data.units} units.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Read Insulin Syringe",
            explanation: "On a standard U-100 syringe, 1 mark = 1 unit. No mathematical conversion is needed.",
            calculation: `Administer ordered dose = ${data.units} units`,
            result: `${data.units} units`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "insulin-titration-protocol-increase",
    category: "insulin",
    subtype: "insulin-infusion",
    difficulty: "intermediate",
    title: "IV Insulin Drip Titration Adjustment",
    clinicalContext: "Adult Inpatient Critical Care Insulin Protocol",
    generate: (rng) => {
      const data = pick([
        { currentRate: 5, currentBg: 245, adjustment: 2, newRate: 7 },
        { currentRate: 8, currentBg: 260, adjustment: 3, newRate: 11 },
        { currentRate: 4, currentBg: 220, adjustment: 1.5, newRate: 5.5 },
        { currentRate: 6.5, currentBg: 280, adjustment: 2.5, newRate: 9.0 },
      ], rng);

      return {
        scenario: `An adult patient on an IV regular insulin drip (1 unit/mL) has an hourly blood glucose of ${data.currentBg} mg/dL. The current pump rate is ${data.currentRate} mL/hr.`,
        orderText: `Per protocol: If hourly BG is 200–299 mg/dL and increasing, increase current infusion rate by ${data.adjustment} units/hr.`,
        availableText: `Regular Insulin 100 units in 100 mL NS (1 unit/mL)`,
        prompt: `Calculate the new IV pump rate in mL/hr.`,
        expectedAnswer: data.newRate,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.05,
        hints: [
          `Current rate: ${data.currentRate} mL/hr (${data.currentRate} units/hr).`,
          `Protocol calls for adding ${data.adjustment} units/hr.`,
          `New rate = ${data.currentRate} + ${data.adjustment} = ${data.newRate} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate New Rate",
            formula: "Current Rate + Rate Increase",
            calculation: `${data.currentRate} mL/hr + ${data.adjustment} mL/hr = ${data.newRate} mL/hr`,
            result: `${data.newRate} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "insulin-nph-regular-mix",
    category: "insulin",
    subtype: "scheduled-plus-correction",
    difficulty: "beginner",
    title: "Dual Insulin Mixed Injection Total Volume",
    clinicalContext: "Adult Med-Surg Morning Insulin Order",
    generate: (rng) => {
      const data = pick([
        { nphUnits: 20, regUnits: 6, total: 26 },
        { nphUnits: 24, regUnits: 8, total: 32 },
        { nphUnits: 30, regUnits: 10, total: 40 },
        { nphUnits: 16, regUnits: 4, total: 20 },
      ], rng);

      return {
        scenario: `An adult patient with Type 1 Diabetes is prescribed morning NPH (intermediate-acting) and Regular (short-acting) insulin to be combined in one syringe.`,
        orderText: `Administer NPH insulin ${data.nphUnits} units and Regular insulin ${data.regUnits} units SubQ every morning before breakfast`,
        availableText: `U-100 NPH vial, U-100 Regular vial, U-100 Insulin syringe`,
        prompt: `How many total units of combined insulin will be in the syringe?`,
        expectedAnswer: data.total,
        expectedUnit: "units",
        roundingMode: "whole",
        roundingInstruction: "State whole number of units.",
        tolerance: 0.01,
        hints: [
          "Clinical pearl: Draw up Clear (Regular) before Cloudy (NPH).",
          `Total units in the syringe = NPH units + Regular units = ${data.nphUnits} + ${data.regUnits}.`,
          `Calculate: ${data.nphUnits} + ${data.regUnits} = ${data.total} units.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Add Prescribed Units",
            formula: "NPH Units + Regular Units",
            calculation: `${data.nphUnits} units + ${data.regUnits} units = ${data.total} units`,
            result: `${data.total} units`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
];
