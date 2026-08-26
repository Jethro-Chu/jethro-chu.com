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
        correctAnswer: data.units,
        answerUnit: "units",
        answerPrecision: 0,
        roundingInstruction: "State exact whole number of units.",
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
        correctAnswer: data.totalUnits,
        answerUnit: "units",
        answerPrecision: 0,
        roundingInstruction: "State whole number of units.",
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
        correctAnswer: data.units,
        answerUnit: "units",
        answerPrecision: 0,
        roundingInstruction: "State whole number of units.",
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
        correctAnswer: data.total,
        answerUnit: "units",
        answerPrecision: 0,
        roundingInstruction: "Round final dose to the nearest whole unit.",
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
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "State exact or rounded to nearest tenth.",
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
        correctAnswer: rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to the nearest tenth.",
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
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
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
        correctAnswer: data.units,
        answerUnit: "units",
        answerPrecision: 0,
        roundingInstruction: "State exact number of units.",
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
        correctAnswer: data.newRate,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
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
        correctAnswer: data.total,
        answerUnit: "units",
        answerPrecision: 0,
        roundingInstruction: "State whole number of units.",
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
  {
    id: "insulin-carb-ratio-snack",
    category: "insulin",
    subtype: "carbohydrate-coverage",
    difficulty: "beginner",
    title: "Carbohydrate Ratio Meal Coverage (1:10)",
    clinicalContext: "Adult Inpatient Mealtime Insulin Coverage",
    generate: (rng) => {
      const data = pick([
        { carbGrams: 50, ratio: 10, units: 5 },
        { carbGrams: 70, ratio: 10, units: 7 },
        { carbGrams: 40, ratio: 10, units: 4 },
        { carbGrams: 60, ratio: 10, units: 6 },
        { carbGrams: 80, ratio: 10, units: 8 },
      ], rng);

      return {
        scenario: `An adult diabetic inpatient is ordered rapid-acting Lispro insulin before a meal with an insulin-to-carbohydrate ratio of 1 unit for every ${data.ratio} grams of carbohydrates. The meal contains ${data.carbGrams} g of carbohydrates.`,
        orderText: `Lispro insulin SubQ with meal: 1 unit per ${data.ratio} g carbohydrate intake`,
        prompt: `How many units of Lispro insulin should the nurse administer to cover this ${data.carbGrams} g meal?`,
        correctAnswer: data.units,
        answerUnit: "units",
        answerPrecision: 0,
        roundingInstruction: "State whole number of units.",
        hints: [
          `Divide total carbohydrate grams by the carbohydrate ratio.`,
          `Formula: Total Carbs (g) ÷ Carb Ratio (g/unit).`,
          `Calculate: ${data.carbGrams} ÷ ${data.ratio} = ${data.units} units.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Mealtime Carb Dose",
            formula: "Carbohydrates (g) ÷ Carb Ratio (g/unit)",
            calculation: `${data.carbGrams} g ÷ ${data.ratio} g/unit = ${data.units} units`,
            result: `${data.units} units`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "insulin-carb-ratio-dinner",
    category: "insulin",
    subtype: "carbohydrate-coverage",
    difficulty: "beginner",
    title: "Carbohydrate Ratio Meal Coverage (1:15)",
    clinicalContext: "Adult Inpatient Nutrition Coverage",
    generate: (rng) => {
      const data = pick([
        { carbGrams: 60, ratio: 15, units: 4 },
        { carbGrams: 75, ratio: 15, units: 5 },
        { carbGrams: 90, ratio: 15, units: 6 },
        { carbGrams: 45, ratio: 15, units: 3 },
      ], rng);

      return {
        scenario: `An adult patient is prescribed rapid-acting Aspart insulin at a ratio of 1 unit per ${data.ratio} grams of dietary carbohydrate. The patient consumes ${data.carbGrams} grams of carbohydrates for dinner.`,
        orderText: `Aspart insulin SubQ TID with meals per carb ratio 1 unit : ${data.ratio} g carbs`,
        prompt: `How many units of Aspart insulin should be administered?`,
        correctAnswer: data.units,
        answerUnit: "units",
        answerPrecision: 0,
        roundingInstruction: "State whole number of units.",
        hints: [
          "Apply formula: Total Carbs (g) ÷ Carb Ratio (g/unit).",
          `Calculate: ${data.carbGrams} ÷ ${data.ratio}.`,
          `${data.carbGrams} ÷ ${data.ratio} = ${data.units} units.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Mealtime Dose",
            formula: "Carbs ÷ Ratio",
            calculation: `${data.carbGrams} g ÷ ${data.ratio} g/unit = ${data.units} units`,
            result: `${data.units} units`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "insulin-correction-factor-isf",
    category: "insulin",
    subtype: "correction-scale",
    difficulty: "intermediate",
    title: "Insulin Sensitivity Factor (ISF) Correction Dose",
    clinicalContext: "Adult Endocrine Correction Protocol",
    generate: (rng) => {
      const data = pick([
        { currentBg: 260, targetBg: 120, isf: 35, bgDiff: 140, units: 4 },
        { currentBg: 280, targetBg: 130, isf: 50, bgDiff: 150, units: 3 },
        { currentBg: 320, targetBg: 120, isf: 40, bgDiff: 200, units: 5 },
        { currentBg: 220, targetBg: 120, isf: 50, bgDiff: 100, units: 2 },
      ], rng);

      return {
        scenario: `An adult patient has a pre-meal blood glucose of ${data.currentBg} mg/dL. The endocrinology order provides an Insulin Sensitivity Factor (ISF) of ${data.isf} mg/dL per unit with a target blood glucose of ${data.targetBg} mg/dL.`,
        orderText: `Correction Dose = (Current BG - ${data.targetBg}) ÷ ${data.isf}`,
        prompt: `Calculate the correction dose of rapid-acting insulin in units.`,
        correctAnswer: data.units,
        answerUnit: "units",
        answerPrecision: 0,
        roundingInstruction: "State exact whole number of units.",
        hints: [
          `First calculate points above target: ${data.currentBg} - ${data.targetBg} = ${data.bgDiff} mg/dL.`,
          `Divide difference by the ISF (${data.isf}): ${data.bgDiff} ÷ ${data.isf}.`,
          `Calculate: ${data.bgDiff} ÷ ${data.isf} = ${data.units} units.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Blood Glucose Elevation Above Target",
            formula: "Current BG - Target BG",
            calculation: `${data.currentBg} mg/dL - ${data.targetBg} mg/dL = ${data.bgDiff} mg/dL`,
            result: `${data.bgDiff} mg/dL`,
          },
          {
            stepNumber: 2,
            title: "Apply Insulin Sensitivity Factor",
            formula: "BG Elevation ÷ ISF",
            calculation: `${data.bgDiff} mg/dL ÷ ${data.isf} mg/dL/unit = ${data.units} units`,
            result: `${data.units} units`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "insulin-correction-factor-isf-meal",
    category: "insulin",
    subtype: "scheduled-plus-correction",
    difficulty: "advanced",
    title: "Combined ISF Correction and Carbohydrate Coverage",
    clinicalContext: "Adult Inpatient Comprehensive Insulin Dosing",
    generate: (rng) => {
      const data = pick([
        { currentBg: 240, targetBg: 120, isf: 40, isfUnits: 3, carbGrams: 60, carbRatio: 15, carbUnits: 4, totalUnits: 7 },
        { currentBg: 270, targetBg: 120, isf: 50, isfUnits: 3, carbGrams: 75, carbRatio: 15, carbUnits: 5, totalUnits: 8 },
        { currentBg: 280, targetBg: 130, isf: 30, isfUnits: 5, carbGrams: 50, carbRatio: 10, carbUnits: 5, totalUnits: 10 },
        { currentBg: 220, targetBg: 120, isf: 50, isfUnits: 2, carbGrams: 60, carbRatio: 12, carbUnits: 5, totalUnits: 7 },
      ], rng);

      return {
        scenario: `An adult inpatient before lunch has a point-of-care blood glucose of ${data.currentBg} mg/dL and plans to consume ${data.carbGrams} g of carbohydrates.`,
        orderText: `• Correction: (Current BG - ${data.targetBg}) ÷ ${data.isf}
• Meal Coverage: 1 unit per ${data.carbRatio} g carbs
• Administer total combined dose SubQ pre-meal`,
        prompt: `Calculate the total units of rapid-acting insulin the nurse should administer.`,
        correctAnswer: data.totalUnits,
        answerUnit: "units",
        answerPrecision: 0,
        roundingInstruction: "State whole number of units.",
        hints: [
          `Step 1 (Correction): (${data.currentBg} - ${data.targetBg}) ÷ ${data.isf} = ${data.isfUnits} units.`,
          `Step 2 (Carb coverage): ${data.carbGrams} g ÷ ${data.carbRatio} g/unit = ${data.carbUnits} units.`,
          `Step 3 (Total): ${data.isfUnits} + ${data.carbUnits} = ${data.totalUnits} units.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Correction Dose",
            formula: "(Current BG - Target BG) ÷ ISF",
            calculation: `(${data.currentBg} - ${data.targetBg}) ÷ ${data.isf} = ${data.isfUnits} units`,
            result: `${data.isfUnits} units`,
          },
          {
            stepNumber: 2,
            title: "Calculate Meal Coverage Dose",
            formula: "Carb Grams ÷ Carb Ratio",
            calculation: `${data.carbGrams} g ÷ ${data.carbRatio} g/unit = ${data.carbUnits} units`,
            result: `${data.carbUnits} units`,
          },
          {
            stepNumber: 3,
            title: "Calculate Total Combined Injection",
            formula: "Correction Units + Carb Coverage Units",
            calculation: `${data.isfUnits} units + ${data.carbUnits} units = ${data.totalUnits} units`,
            result: `${data.totalUnits} units`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "insulin-infusion-weight-units-kg-hr",
    category: "insulin",
    subtype: "infusion-rate",
    difficulty: "intermediate",
    title: "Weight-Based Continuous Insulin Infusion (units/kg/hr)",
    clinicalContext: "Adult ICU Diabetic Ketoacidosis (DKA) Protocol",
    generate: (rng) => {
      const data = pick([
        { weightKg: 80, rateUnitsKgHr: 0.1, hourlyUnits: 8, bagUnits: 100, bagMl: 100, rateMlHr: 8 },
        { weightKg: 70, rateUnitsKgHr: 0.1, hourlyUnits: 7, bagUnits: 100, bagMl: 100, rateMlHr: 7 },
        { weightKg: 90, rateUnitsKgHr: 0.14, hourlyUnits: 12.6, bagUnits: 100, bagMl: 100, rateMlHr: 12.6 },
        { weightKg: 65, rateUnitsKgHr: 0.1, hourlyUnits: 6.5, bagUnits: 100, bagMl: 100, rateMlHr: 6.5 },
      ], rng);

      return {
        scenario: `An adult ICU patient with DKA weighing ${data.weightKg} kg is prescribed a continuous regular insulin infusion at ${data.rateUnitsKgHr} units/kg/hr.`,
        orderText: `Regular Insulin continuous IV infusion at ${data.rateUnitsKgHr} units/kg/hr (Patient weight: ${data.weightKg} kg)`,
        availableText: `Regular Insulin 100 units in 0.9% Normal Saline 100 mL (1 unit/mL)`,
        prompt: `Calculate the initial IV pump rate in mL/hr.`,
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          `Calculate hourly units: ${data.weightKg} kg × ${data.rateUnitsKgHr} units/kg/hr = ${data.hourlyUnits} units/hr.`,
          `Since the bag concentration is 1 unit/mL, pump rate in mL/hr equals hourly units.`,
          `Calculate: ${data.hourlyUnits} units/hr ÷ 1 unit/mL = ${data.rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Total Units per Hour",
            formula: "Weight (kg) × Dose (units/kg/hr)",
            calculation: `${data.weightKg} kg × ${data.rateUnitsKgHr} units/kg/hr = ${data.hourlyUnits} units/hr`,
            result: `${data.hourlyUnits} units/hr`,
          },
          {
            stepNumber: 2,
            title: "Calculate IV Pump Rate",
            formula: "Units/hr ÷ Concentration (units/mL)",
            calculation: `${data.hourlyUnits} units/hr ÷ 1 unit/mL = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "insulin-infusion-weight-bolus-dka",
    category: "insulin",
    subtype: "injectable",
    difficulty: "beginner",
    title: "Weight-Based Initial IV Insulin Bolus for DKA",
    clinicalContext: "Adult ICU Initial DKA Resuscitation",
    generate: (rng) => {
      const data = pick([
        { weightKg: 75, bolusUnitsKg: 0.14, totalUnits: 10.5 },
        { weightKg: 80, bolusUnitsKg: 0.1, totalUnits: 8.0 },
        { weightKg: 70, bolusUnitsKg: 0.1, totalUnits: 7.0 },
        { weightKg: 95, bolusUnitsKg: 0.1, totalUnits: 9.5 },
      ], rng);

      return {
        scenario: `An adult patient admitted with severe diabetic ketoacidosis weighing ${data.weightKg} kg is ordered an initial IV push bolus of Regular insulin at ${data.bolusUnitsKg} units/kg.`,
        orderText: `Regular Insulin ${data.bolusUnitsKg} units/kg IV bolus stat (Patient weight: ${data.weightKg} kg)`,
        availableText: `Regular Insulin U-100 vial (100 units/mL)`,
        prompt: `How many units of Regular insulin should the nurse administer for this IV bolus?`,
        correctAnswer: data.totalUnits,
        answerUnit: "units",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          "Multiply the patient's weight in kg by the ordered units/kg.",
          `Calculate: ${data.weightKg} kg × ${data.bolusUnitsKg} units/kg.`,
          `${data.weightKg} × ${data.bolusUnitsKg} = ${data.totalUnits} units.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate IV Bolus Dose",
            formula: "Weight (kg) × Dose (units/kg)",
            calculation: `${data.weightKg} kg × ${data.bolusUnitsKg} units/kg = ${data.totalUnits} units`,
            result: `${data.totalUnits} units`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "insulin-reverse-mlhr-to-unitshr",
    category: "insulin",
    subtype: "infusion-rate",
    difficulty: "beginner",
    title: "Reverse Insulin Infusion: Calculate Units/hr Delivered",
    clinicalContext: "Adult Critical Care Shift Audit",
    generate: (rng) => {
      const data = pick([
        { rateMlHr: 6.5, concUnitsMl: 1, unitsHr: 6.5 },
        { rateMlHr: 8.0, concUnitsMl: 1, unitsHr: 8.0 },
        { rateMlHr: 4.5, concUnitsMl: 1, unitsHr: 4.5 },
        { rateMlHr: 12.0, concUnitsMl: 1, unitsHr: 12.0 },
        { rateMlHr: 3.5, concUnitsMl: 1, unitsHr: 3.5 },
      ], rng);

      return {
        scenario: `A continuous IV regular insulin infusion is running on an electronic pump at ${data.rateMlHr} mL/hr. The IV bag contains 100 units of Regular insulin in 100 mL of 0.9% Normal Saline (1 unit/mL).`,
        orderText: `Regular insulin drip running at ${data.rateMlHr} mL/hr`,
        availableText: `Regular Insulin 100 units / 100 mL NS (1 unit/mL)`,
        prompt: `How many units/hr of insulin is the patient currently receiving?`,
        correctAnswer: data.unitsHr,
        answerUnit: "units/hr",
        answerPrecision: 1,
        roundingInstruction: "State exact number or round to nearest tenth.",
        hints: [
          "Multiply the infusion pump rate (mL/hr) by the bag concentration (units/mL).",
          `Calculate: ${data.rateMlHr} mL/hr × ${data.concUnitsMl} unit/mL.`,
          `${data.rateMlHr} × 1 = ${data.unitsHr} units/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Hourly Units Delivered",
            formula: "Pump Rate (mL/hr) × Concentration (units/mL)",
            calculation: `${data.rateMlHr} mL/hr × 1 unit/mL = ${data.unitsHr} units/hr`,
            result: `${data.unitsHr} units/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "insulin-reverse-mlhr-to-units-kg-hr",
    category: "insulin",
    subtype: "infusion-rate",
    difficulty: "advanced",
    title: "Reverse Insulin Infusion: Calculate units/kg/hr from Pump Rate",
    clinicalContext: "Adult ICU DKA Delivery Rate Audit",
    generate: (rng) => {
      const data = pick([
        { rateMlHr: 7.0, weightKg: 70, unitsHr: 7.0, doseUnitsKgHr: 0.1 },
        { rateMlHr: 8.0, weightKg: 80, unitsHr: 8.0, doseUnitsKgHr: 0.1 },
        { rateMlHr: 9.0, weightKg: 60, unitsHr: 9.0, doseUnitsKgHr: 0.15 },
        { rateMlHr: 12.0, weightKg: 80, unitsHr: 12.0, doseUnitsKgHr: 0.15 },
      ], rng);

      return {
        scenario: `An adult DKA patient weighing ${data.weightKg} kg is receiving a regular insulin infusion (1 unit/mL) running at ${data.rateMlHr} mL/hr.`,
        orderText: `Insulin infusion at ${data.rateMlHr} mL/hr | Patient weight: ${data.weightKg} kg`,
        availableText: `Regular Insulin 100 units in 100 mL NS (1 unit/mL)`,
        prompt: `Calculate the current dose delivered to the patient in units/kg/hr.`,
        correctAnswer: data.doseUnitsKgHr,
        answerUnit: "units/kg/hr",
        answerPrecision: 2,
        roundingInstruction: "Round to nearest hundredth (e.g. 0.10).",
        hints: [
          `Find units per hour: ${data.rateMlHr} mL/hr × 1 unit/mL = ${data.unitsHr} units/hr.`,
          `Divide hourly units by patient weight in kg: ${data.unitsHr} units/hr ÷ ${data.weightKg} kg.`,
          `Calculate: ${data.unitsHr} ÷ ${data.weightKg} = ${data.doseUnitsKgHr} units/kg/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Total Hourly Units",
            formula: "Pump Rate (mL/hr) × Concentration (units/mL)",
            calculation: `${data.rateMlHr} mL/hr × 1 unit/mL = ${data.unitsHr} units/hr`,
            result: `${data.unitsHr} units/hr`,
          },
          {
            stepNumber: 2,
            title: "Calculate Weight-Normalized Dose",
            formula: "Hourly Units ÷ Weight (kg)",
            calculation: `${data.unitsHr} units/hr ÷ ${data.weightKg} kg = ${data.doseUnitsKgHr} units/kg/hr`,
            result: `${data.doseUnitsKgHr} units/kg/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "insulin-infusion-total-units-delivered",
    category: "insulin",
    subtype: "infusion-rate",
    difficulty: "beginner",
    title: "Shift Total Insulin Delivery Calculation",
    clinicalContext: "Adult Inpatient Shift Intake Reconciliation",
    generate: (rng) => {
      const data = pick([
        { rateMlHr: 4.5, hrs: 8, totalUnits: 36 },
        { rateMlHr: 6.0, hrs: 12, totalUnits: 72 },
        { rateMlHr: 5.0, hrs: 8, totalUnits: 40 },
        { rateMlHr: 3.5, hrs: 10, totalUnits: 35 },
      ], rng);

      return {
        scenario: `A patient has received a continuous IV Regular insulin infusion (1 unit/mL) running at a steady ${data.rateMlHr} mL/hr for ${data.hrs} hours.`,
        orderText: `Regular Insulin 1 unit/mL IV at ${data.rateMlHr} mL/hr for ${data.hrs} hours`,
        prompt: `How many total units of insulin were delivered to the patient during this ${data.hrs}-hour period?`,
        correctAnswer: data.totalUnits,
        answerUnit: "units",
        answerPrecision: 0,
        roundingInstruction: "State whole number of units.",
        hints: [
          "Total units = Hourly rate (units/hr) × Number of hours.",
          `Calculate: ${data.rateMlHr} units/hr × ${data.hrs} hr.`,
          `${data.rateMlHr} × ${data.hrs} = ${data.totalUnits} units.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Total Units Infused",
            formula: "Hourly Rate (units/hr) × Hours",
            calculation: `${data.rateMlHr} units/hr × ${data.hrs} hr = ${data.totalUnits} units`,
            result: `${data.totalUnits} units`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "insulin-u500-syringe-volume",
    category: "insulin",
    subtype: "injectable",
    difficulty: "intermediate",
    title: "High-Potency U-500 Regular Insulin Syringe Volume",
    clinicalContext: "Adult Severe Insulin Resistance Management",
    generate: (rng) => {
      const data = pick([
        { orderUnits: 150, conc: 500, volMl: 0.3 },
        { orderUnits: 200, conc: 500, volMl: 0.4 },
        { orderUnits: 250, conc: 500, volMl: 0.5 },
        { orderUnits: 100, conc: 500, volMl: 0.2 },
        { orderUnits: 300, conc: 500, volMl: 0.6 },
      ], rng);

      return {
        scenario: `An adult inpatient with severe insulin resistance is prescribed ${data.orderUnits} units of concentrated U-500 Regular Insulin SubQ. The nurse is measuring the dose using a standard 1 mL tuberculin syringe calibrated in milliliters.`,
        orderText: `Humulin R U-500 ${data.orderUnits} units SubQ BID with meals`,
        availableText: `Humulin R U-500 vial (500 units/mL)`,
        prompt: `How many mL should the nurse draw up in the syringe?`,
        correctAnswer: data.volMl,
        answerUnit: "mL",
        answerPrecision: 1,
        roundingInstruction: "State exact decimal value (e.g. 0.3).",
        hints: [
          "Recall that U-500 insulin contains 500 units per 1 mL.",
          "Apply formula: Desired Units ÷ Have Units per mL.",
          `Calculate: ${data.orderUnits} units ÷ 500 units/mL = ${data.volMl} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate U-500 Syringe Volume",
            formula: "Prescribed Units ÷ 500 units/mL",
            calculation: `${data.orderUnits} units ÷ 500 units/mL = ${data.volMl} mL`,
            result: `${data.volMl} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "insulin-u500-units-from-volume",
    category: "insulin",
    subtype: "injectable",
    difficulty: "intermediate",
    title: "Reverse U-500 Calculation: Units Delivered from Syringe Volume",
    clinicalContext: "Adult Inpatient High-Potency Insulin Verification",
    generate: (rng) => {
      const data = pick([
        { volMl: 0.4, conc: 500, units: 200 },
        { volMl: 0.35, conc: 500, units: 175 },
        { volMl: 0.25, conc: 500, units: 125 },
        { volMl: 0.5, conc: 500, units: 250 },
      ], rng);

      return {
        scenario: `An audit reveals a nurse administered ${data.volMl} mL of U-500 Regular Insulin (500 units/mL) to a patient with extreme insulin resistance.`,
        orderText: `${data.volMl} mL of U-500 Regular Insulin administered`,
        availableText: `Humulin R U-500 (500 units/mL)`,
        prompt: `Calculate the total units of insulin the patient received.`,
        correctAnswer: data.units,
        answerUnit: "units",
        answerPrecision: 0,
        roundingInstruction: "State whole number of units.",
        hints: [
          "Multiply volume in mL by 500 units/mL.",
          `Calculate: ${data.volMl} mL × 500 units/mL.`,
          `${data.volMl} × 500 = ${data.units} units.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Units Administered",
            formula: "Volume (mL) × 500 units/mL",
            calculation: `${data.volMl} mL × 500 units/mL = ${data.units} units`,
            result: `${data.units} units`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "insulin-detemir-split-dose",
    category: "insulin",
    subtype: "scheduled-plus-correction",
    difficulty: "intermediate",
    title: "Weight-Based Split Daily Basal Insulin Dosing",
    clinicalContext: "Adult Med-Surg Basal Insulin Initiation",
    generate: (rng) => {
      const data = pick([
        { weightKg: 80, dailyDoseFactor: 0.4, totalDailyUnits: 32, bidDose: 16 },
        { weightKg: 70, dailyDoseFactor: 0.4, totalDailyUnits: 28, bidDose: 14 },
        { weightKg: 90, dailyDoseFactor: 0.4, totalDailyUnits: 36, bidDose: 18 },
        { weightKg: 75, dailyDoseFactor: 0.4, totalDailyUnits: 30, bidDose: 15 },
      ], rng);

      return {
        scenario: `An adult inpatient weighing ${data.weightKg} kg is prescribed long-acting Detemir (Levemir) insulin at ${data.dailyDoseFactor} units/kg/day, to be divided into equal twice-daily (BID) morning and evening doses.`,
        orderText: `Detemir insulin ${data.dailyDoseFactor} units/kg/day SubQ divided BID (Patient weight: ${data.weightKg} kg)`,
        availableText: `U-100 Detemir vial (100 units/mL)`,
        prompt: `How many units should the nurse administer for each single BID dose?`,
        correctAnswer: data.bidDose,
        answerUnit: "units",
        answerPrecision: 0,
        roundingInstruction: "State whole number of units.",
        hints: [
          `Calculate total daily units: ${data.weightKg} kg × ${data.dailyDoseFactor} units/kg/day = ${data.totalDailyUnits} units/day.`,
          `Divide total daily units by 2 for the BID dose: ${data.totalDailyUnits} ÷ 2.`,
          `Calculate: ${data.totalDailyUnits} ÷ 2 = ${data.bidDose} units per dose.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Total Daily Requirement",
            formula: "Weight (kg) × Daily Factor (units/kg/day)",
            calculation: `${data.weightKg} kg × ${data.dailyDoseFactor} units/kg/day = ${data.totalDailyUnits} units/day`,
            result: `${data.totalDailyUnits} units/day`,
          },
          {
            stepNumber: 2,
            title: "Divide into Equal BID Doses",
            formula: "Total Daily Units ÷ 2",
            calculation: `${data.totalDailyUnits} units ÷ 2 = ${data.bidDose} units`,
            result: `${data.bidDose} units`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "insulin-sliding-scale-moderate",
    category: "insulin",
    subtype: "correction-scale",
    difficulty: "beginner",
    title: "Moderate-Dose Correction Sliding Scale",
    clinicalContext: "Adult Inpatient Endocrine Protocol",
    generate: (rng) => {
      const data = pick([
        { bg: 218, tier: "201–250 mg/dL", units: 6 },
        { bg: 274, tier: "251–300 mg/dL", units: 9 },
        { bg: 165, tier: "150–200 mg/dL", units: 3 },
        { bg: 320, tier: "301–350 mg/dL", units: 12 },
      ], rng);

      return {
        scenario: `An adult inpatient has a point-of-care pre-dinner blood glucose reading of ${data.bg} mg/dL.`,
        orderText: `Administer SubQ Regular Insulin per Moderate Sliding Scale:
• BG < 150 mg/dL: 0 units
• BG 150–200 mg/dL: 3 units
• BG 201–250 mg/dL: 6 units
• BG 251–300 mg/dL: 9 units
• BG 301–350 mg/dL: 12 units
• BG > 350 mg/dL: 15 units and call provider`,
        prompt: `How many units of Regular insulin should the nurse administer for a BG of ${data.bg} mg/dL?`,
        correctAnswer: data.units,
        answerUnit: "units",
        answerPrecision: 0,
        roundingInstruction: "State whole number of units.",
        hints: [
          `Find the tier matching ${data.bg} mg/dL.`,
          `${data.bg} mg/dL falls in the ${data.tier} bracket.`,
          `Administer ${data.units} units.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Locate Blood Glucose Bracket",
            explanation: `BG of ${data.bg} mg/dL falls in ${data.tier}.`,
            calculation: `${data.bg} mg/dL in [${data.tier}] = ${data.units} units`,
            result: `${data.units} units`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "insulin-correction-target-difference",
    category: "insulin",
    subtype: "correction-scale",
    difficulty: "intermediate",
    title: "Point-Based Linear Stepwise Correction Dose",
    clinicalContext: "Adult Inpatient Post-Surgical Glycemic Control",
    generate: (rng) => {
      const data = pick([
        { bg: 275, baseBg: 150, stepBg: 25, unitsPerStep: 1, diff: 125, units: 5 },
        { bg: 250, baseBg: 150, stepBg: 25, unitsPerStep: 1, diff: 100, units: 4 },
        { bg: 300, baseBg: 150, stepBg: 25, unitsPerStep: 1, diff: 150, units: 6 },
        { bg: 225, baseBg: 150, stepBg: 25, unitsPerStep: 1, diff: 75, units: 3 },
      ], rng);

      return {
        scenario: `An adult surgical patient has a blood glucose of ${data.bg} mg/dL. The physician orders: "Give 1 unit of Humalog insulin for every ${data.stepBg} mg/dL over ${data.baseBg} mg/dL."`,
        orderText: `Humalog SubQ: 1 unit per ${data.stepBg} mg/dL above ${data.baseBg} mg/dL`,
        prompt: `Calculate the number of units of Humalog insulin to administer.`,
        correctAnswer: data.units,
        answerUnit: "units",
        answerPrecision: 0,
        roundingInstruction: "State whole number of units.",
        hints: [
          `Find points over ${data.baseBg}: ${data.bg} - ${data.baseBg} = ${data.diff} mg/dL.`,
          `Divide points above base by step size (${data.stepBg}): ${data.diff} ÷ ${data.stepBg}.`,
          `Calculate: ${data.diff} ÷ ${data.stepBg} = ${data.units} units.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Excess Blood Glucose",
            formula: "Current BG - Base Threshold",
            calculation: `${data.bg} mg/dL - ${data.baseBg} mg/dL = ${data.diff} mg/dL`,
            result: `${data.diff} mg/dL`,
          },
          {
            stepNumber: 2,
            title: "Calculate Stepwise Units",
            formula: "Excess BG ÷ Step Size",
            calculation: `${data.diff} mg/dL ÷ ${data.stepBg} mg/dL/unit = ${data.units} units`,
            result: `${data.units} units`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "insulin-u100-volume-calculation",
    category: "insulin",
    subtype: "insulin-concentration",
    difficulty: "beginner",
    title: "U-100 Insulin Syringe Volume Calculation",
    clinicalContext: "Adult Inpatient Insulin Administration",
    generate: (rng) => {
      const data = pick([
        { units: 35, conc: 100, volMl: 0.35 },
        { units: 45, conc: 100, volMl: 0.45 },
        { units: 25, conc: 100, volMl: 0.25 },
        { units: 60, conc: 100, volMl: 0.6 },
        { units: 15, conc: 100, volMl: 0.15 },
      ], rng);

      return {
        scenario: `A nurse is preparing to administer ${data.units} units of Regular U-100 insulin subcutaneously using a 1 mL syringe calibrated in milliliters.`,
        orderText: `Regular Insulin U-100 ${data.units} units SubQ stat`,
        availableText: `Regular Insulin U-100 vial (${data.conc} units/mL)`,
        prompt: `How many mL should the nurse draw into the syringe?`,
        correctAnswer: data.volMl,
        answerUnit: "mL",
        answerPrecision: 2,
        roundingInstruction: "State exact decimal value (e.g. 0.35 or 0.6).",
        safetyPearl: "U-100 means 100 units per mL. Whenever possible, use an insulin syringe calibrated directly in units to minimize calculation errors.",
        hints: [
          `Recall that U-100 insulin contains 100 units per mL.`,
          `Apply formula: Desired Units ÷ 100 units/mL.`,
          `Calculate: ${data.units} units ÷ 100 units/mL = ${data.volMl} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Volume in Milliliters",
            formula: "Prescribed Units ÷ 100 units/mL",
            calculation: `${data.units} units ÷ 100 units/mL = ${data.volMl} mL`,
            result: `${data.volMl} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "insulin-u100-units-from-volume",
    category: "insulin",
    subtype: "insulin-concentration",
    difficulty: "beginner",
    title: "Reverse U-100 Calculation: Units Delivered from Syringe Volume",
    clinicalContext: "Adult Inpatient Medication Safety Audit",
    generate: (rng) => {
      const data = pick([
        { volMl: 0.4, conc: 100, units: 40 },
        { volMl: 0.25, conc: 100, units: 25 },
        { volMl: 0.5, conc: 100, units: 50 },
        { volMl: 0.18, conc: 100, units: 18 },
      ], rng);

      return {
        scenario: `A medication audit notes that a patient received ${data.volMl} mL of U-100 Regular Insulin (100 units/mL).`,
        orderText: `${data.volMl} mL of Regular U-100 Insulin administered`,
        availableText: `Regular Insulin U-100 (100 units/mL)`,
        prompt: `How many units of insulin were administered?`,
        correctAnswer: data.units,
        answerUnit: "units",
        answerPrecision: 0,
        roundingInstruction: "State whole number of units.",
        safetyPearl: "Always double-check both the insulin vial concentration (U-100 vs U-500) and the syringe calibration before administering insulin.",
        hints: [
          "Multiply volume in mL by 100 units/mL.",
          `Calculate: ${data.volMl} mL × 100 units/mL.`,
          `${data.volMl} × 100 = ${data.units} units.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Units Administered",
            formula: "Volume (mL) × 100 units/mL",
            calculation: `${data.volMl} mL × 100 units/mL = ${data.units} units`,
            result: `${data.units} units`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
];
