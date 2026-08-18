import type { QuestionTemplate } from "../types.ts";
import { pick, ADULT_WEIGHTS_LB, ADULT_WEIGHTS_KG } from "./helpers.ts";

export const heparinTemplates: QuestionTemplate[] = [
  {
    id: "heparin-infusion-rate-500ml",
    category: "heparin",
    subtype: "heparin-infusion",
    difficulty: "intermediate",
    title: "Heparin Weight-Based Infusion Rate (25,000 units / 500 mL)",
    clinicalContext: "Adult Inpatient DVT / PE Anticoagulation Protocol",
    generate: (rng) => {
      const weightKg = pick([60, 70, 75, 80, 82, 85, 90, 95, 100], rng);
      const unitsKgHr = 18;
      const totalUnitsHr = weightKg * unitsKgHr; // e.g. 82 * 18 = 1476
      const concUnitsMl = 25000 / 500; // 50 units/mL
      const rateMlHr = Math.round((totalUnitsHr / concUnitsMl) * 10) / 10; // 1476 / 50 = 29.52 -> 29.5

      return {
        scenario: `An adult patient weighing ${weightKg} kg is admitted with an acute pulmonary embolism and started on a weight-based heparin protocol.`,
        orderText: `Heparin sodium continuous IV infusion at 18 units/kg/hr`,
        availableText: `Heparin 25,000 USP units in 500 mL 0.9% Normal Saline (${concUnitsMl} units/mL)`,
        patientWeightKg: weightKg,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        expectedAnswer: rateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to the nearest tenth.",
        tolerance: 0.1,
        hints: [
          `Step 1: Calculate hourly units: ${weightKg} kg × 18 units/kg/hr = ${totalUnitsHr} units/hr.`,
          `Step 2: Determine concentration: 25,000 units ÷ 500 mL = 50 units/mL.`,
          `Step 3: Divide units/hr by concentration: ${totalUnitsHr} units/hr ÷ 50 units/mL = ${rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Ordered Units per Hour",
            formula: "Weight (kg) × Dose (units/kg/hr)",
            calculation: `${weightKg} kg × 18 units/kg/hr = ${totalUnitsHr} units/hr`,
            result: `${totalUnitsHr} units/hr`,
          },
          {
            stepNumber: 2,
            title: "Determine Bag Concentration",
            formula: "Total Units ÷ Bag Volume",
            calculation: `25,000 units ÷ 500 mL = 50 units/mL`,
            result: `50 units/mL`,
          },
          {
            stepNumber: 3,
            title: "Calculate IV Pump Flow Rate",
            formula: "Units/hr ÷ Concentration (units/mL)",
            calculation: `${totalUnitsHr} units/hr ÷ 50 units/mL = ${rateMlHr} mL/hr`,
            result: `${rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { weightKg, unitsKgHr, totalUnitsHr, concUnitsMl, rateMlHr },
      };
    },
  },
  {
    id: "heparin-infusion-rate-250ml",
    category: "heparin",
    subtype: "heparin-infusion",
    difficulty: "intermediate",
    title: "Heparin Weight-Based Infusion Rate (25,000 units / 250 mL)",
    clinicalContext: "Adult Critical Care Acute Coronary Syndrome Protocol",
    generate: (rng) => {
      const weightKg = pick([60, 70, 75, 80, 85, 90, 95, 100], rng);
      const unitsKgHr = pick([14, 15, 18], rng);
      const totalUnitsHr = weightKg * unitsKgHr;
      const concUnitsMl = 25000 / 250; // 100 units/mL
      const rateMlHr = Math.round((totalUnitsHr / concUnitsMl) * 10) / 10;

      return {
        scenario: `An adult telemetry patient with Non-ST Elevation Myocardial Infarction (NSTEMI) is started on weight-based heparin.`,
        orderText: `Heparin IV infusion at ${unitsKgHr} units/kg/hr for patient weight ${weightKg} kg`,
        availableText: `Premixed bag: Heparin 25,000 units in 250 mL D5W (100 units/mL)`,
        patientWeightKg: weightKg,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        expectedAnswer: rateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.1,
        hints: [
          `Step 1: Calculate hourly units: ${weightKg} kg × ${unitsKgHr} units/kg/hr = ${totalUnitsHr} units/hr.`,
          `Step 2: Bag concentration: 25,000 units ÷ 250 mL = 100 units/mL.`,
          `Step 3: Calculate pump rate: ${totalUnitsHr} units/hr ÷ 100 units/mL = ${rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Units per Hour",
            formula: "Weight (kg) × Dose (units/kg/hr)",
            calculation: `${weightKg} kg × ${unitsKgHr} units/kg/hr = ${totalUnitsHr} units/hr`,
            result: `${totalUnitsHr} units/hr`,
          },
          {
            stepNumber: 2,
            title: "Determine Concentration",
            formula: "25,000 units ÷ 250 mL",
            calculation: `25,000 units ÷ 250 mL = 100 units/mL`,
            result: `100 units/mL`,
          },
          {
            stepNumber: 3,
            title: "Calculate Infusion Rate",
            formula: "Units/hr ÷ 100 units/mL",
            calculation: `${totalUnitsHr} units/hr ÷ 100 units/mL = ${rateMlHr} mL/hr`,
            result: `${rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { weightKg, unitsKgHr, totalUnitsHr, concUnitsMl, rateMlHr },
      };
    },
  },
  {
    id: "heparin-bolus-volume-1000u-ml",
    category: "heparin",
    subtype: "heparin-bolus",
    difficulty: "intermediate",
    title: "Heparin IV Loading Bolus Dose & Volume",
    clinicalContext: "Adult Inpatient Anticoagulation Initiation",
    generate: (rng) => {
      const weightKg = pick([60, 70, 74, 80, 85, 90, 100], rng);
      const bolusUnitsKg = pick([60, 70, 80], rng);
      const totalBolusUnits = weightKg * bolusUnitsKg;
      const vialConcUnitsMl = 1000; // 1,000 units/mL
      const volumeMl = Math.round((totalBolusUnits / vialConcUnitsMl) * 100) / 100;

      return {
        scenario: `An adult patient weighing ${weightKg} kg is ordered an initial IV heparin loading bolus prior to starting maintenance infusion.`,
        orderText: `Heparin ${bolusUnitsKg} units/kg IV bolus stat`,
        availableText: `Heparin sodium injection 1,000 USP units/mL vial`,
        patientWeightKg: weightKg,
        prompt: `How many mL should the nurse draw up to deliver the ordered bolus?`,
        expectedAnswer: volumeMl,
        expectedUnit: "mL",
        roundingMode: "hundredth",
        roundingInstruction: "Round to nearest hundredth (or tenth if clean decimal, e.g. 5.92).",
        tolerance: 0.05,
        hints: [
          `Step 1: Calculate total units: ${weightKg} kg × ${bolusUnitsKg} units/kg = ${totalBolusUnits} units.`,
          `Step 2: Available vial is 1,000 units/mL.`,
          `Step 3: Calculate volume: ${totalBolusUnits} units ÷ 1,000 units/mL = ${volumeMl} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Bolus Units",
            formula: "Weight (kg) × Bolus Dose (units/kg)",
            calculation: `${weightKg} kg × ${bolusUnitsKg} units/kg = ${totalBolusUnits} units`,
            result: `${totalBolusUnits} units`,
          },
          {
            stepNumber: 2,
            title: "Calculate Syringe Volume",
            formula: "Desired Units ÷ Have (1,000 units/mL)",
            calculation: `${totalBolusUnits} units ÷ 1,000 units/mL = ${volumeMl} mL`,
            result: `${volumeMl} mL`,
          },
        ],
        rawVariables: { weightKg, bolusUnitsKg, totalBolusUnits, vialConcUnitsMl, volumeMl },
      };
    },
  },
  {
    id: "heparin-infusion-from-pounds",
    category: "heparin",
    subtype: "heparin-infusion",
    difficulty: "advanced",
    title: "Heparin Infusion with Pound to Kilogram Conversion",
    clinicalContext: "Adult Step-Down Anticoagulation Order",
    generate: (rng) => {
      const pair = pick(ADULT_WEIGHTS_LB, rng);
      const unitsKgHr = 18;
      const totalUnitsHr = pair.kg * unitsKgHr;
      const concUnitsMl = 50; // 25,000 u / 500 mL
      const rateMlHr = Math.round((totalUnitsHr / concUnitsMl) * 10) / 10;

      return {
        scenario: `An adult inpatient weighing ${pair.lb} lb has a heparin order for acute deep vein thrombosis.`,
        orderText: `Heparin continuous IV infusion at 18 units/kg/hr`,
        availableText: `Heparin 25,000 USP units in 500 mL 0.9% NS (50 units/mL)`,
        patientWeightLb: pair.lb,
        patientWeightKg: pair.kg,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        expectedAnswer: rateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.1,
        hints: [
          `Step 1: Convert weight: ${pair.lb} lb ÷ 2.2 = ${pair.kg} kg.`,
          `Step 2: Calculate units/hr: ${pair.kg} kg × 18 units/kg/hr = ${totalUnitsHr} units/hr.`,
          `Step 3: Divide by 50 units/mL: ${totalUnitsHr} ÷ 50 = ${rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Weight to Kilograms",
            formula: "Pounds ÷ 2.2",
            calculation: `${pair.lb} lb ÷ 2.2 = ${pair.kg} kg`,
            result: `${pair.kg} kg`,
          },
          {
            stepNumber: 2,
            title: "Calculate Hourly Units",
            formula: "Weight (kg) × 18 units/kg/hr",
            calculation: `${pair.kg} kg × 18 units/kg/hr = ${totalUnitsHr} units/hr`,
            result: `${totalUnitsHr} units/hr`,
          },
          {
            stepNumber: 3,
            title: "Calculate Pump Rate",
            formula: "Units/hr ÷ 50 units/mL",
            calculation: `${totalUnitsHr} units/hr ÷ 50 units/mL = ${rateMlHr} mL/hr`,
            result: `${rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { lb: pair.lb, kg: pair.kg, unitsKgHr, totalUnitsHr, concUnitsMl, rateMlHr },
      };
    },
  },
  {
    id: "heparin-reverse-units-delivered",
    category: "heparin",
    subtype: "reverse-calculation",
    difficulty: "intermediate",
    title: "Determine Units Delivered from Pump Rate",
    clinicalContext: "Adult Telemetry Heparin Verification",
    generate: (rng) => {
      const data = pick([
        { rateMlHr: 24, concUnitsMl: 50, unitsHr: 1200 },
        { rateMlHr: 28, concUnitsMl: 50, unitsHr: 1400 },
        { rateMlHr: 15, concUnitsMl: 100, unitsHr: 1500 },
        { rateMlHr: 12, concUnitsMl: 100, unitsHr: 1200 },
        { rateMlHr: 30, concUnitsMl: 50, unitsHr: 1500 },
      ], rng);

      return {
        scenario: `During bedside safety verification, the nurse observes the heparin IV pump running at ${data.rateMlHr} mL/hr. The bag contains 25,000 units in ${data.concUnitsMl === 50 ? "500 mL" : "250 mL"} (${data.concUnitsMl} units/mL).`,
        orderText: `Current IV pump rate: ${data.rateMlHr} mL/hr`,
        availableText: `Heparin concentration: ${data.concUnitsMl} units/mL`,
        prompt: `How many units per hour is the patient receiving?`,
        expectedAnswer: data.unitsHr,
        expectedUnit: "units/hr",
        roundingMode: "whole",
        roundingInstruction: "State whole number of units/hr.",
        tolerance: 0.1,
        hints: [
          "Formula: Units/hr = Pump Rate (mL/hr) × Concentration (units/mL).",
          `Calculate: ${data.rateMlHr} mL/hr × ${data.concUnitsMl} units/mL.`,
          `Result is ${data.unitsHr} units/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Hourly Dosage",
            formula: "Pump Rate (mL/hr) × Concentration (units/mL)",
            calculation: `${data.rateMlHr} mL/hr × ${data.concUnitsMl} units/mL = ${data.unitsHr} units/hr`,
            result: `${data.unitsHr} units/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "heparin-titration-aptt-increase",
    category: "heparin",
    subtype: "titration-protocol",
    difficulty: "advanced",
    title: "Heparin Titration: Subtherapeutic aPTT Rate Increase",
    clinicalContext: "Adult Inpatient Weight-Based Titration Protocol",
    generate: (rng) => {
      const weightKg = pick([60, 70, 75, 80, 85, 90, 100], rng);
      const currentRateUnitsKgHr = 18;
      const increaseUnitsKgHr = 2;
      const newDoseUnitsKgHr = currentRateUnitsKgHr + increaseUnitsKgHr; // 20
      const totalUnitsHr = weightKg * newDoseUnitsKgHr;
      const concUnitsMl = 50; // 25,000 / 500
      const newRateMlHr = Math.round((totalUnitsHr / concUnitsMl) * 10) / 10;

      return {
        scenario: `An adult patient weighing ${weightKg} kg is on a heparin drip running at 18 units/kg/hr. A 6-hour aPTT returns at 42 seconds (target 60–85 sec).
Institutional Titration Protocol specifies:
• aPTT < 45 sec: Re-bolus 40 units/kg and increase infusion rate by 2 units/kg/hr.`,
        orderText: `Adjust heparin infusion per protocol for patient weight ${weightKg} kg`,
        availableText: `Heparin 25,000 units in 500 mL NS (50 units/mL)`,
        patientWeightKg: weightKg,
        prompt: `Calculate the NEW IV pump rate in mL/hr after applying the protocol rate increase.`,
        expectedAnswer: newRateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.1,
        hints: [
          `Step 1: Determine new dosage rate: 18 + 2 = ${newDoseUnitsKgHr} units/kg/hr.`,
          `Step 2: Calculate total units/hr: ${weightKg} kg × ${newDoseUnitsKgHr} units/kg/hr = ${totalUnitsHr} units/hr.`,
          `Step 3: Divide by 50 units/mL: ${totalUnitsHr} ÷ 50 = ${newRateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Determine New Units/kg/hr Rate",
            formula: "Current Rate + Protocol Adjustment",
            calculation: `${currentRateUnitsKgHr} units/kg/hr + ${increaseUnitsKgHr} units/kg/hr = ${newDoseUnitsKgHr} units/kg/hr`,
            result: `${newDoseUnitsKgHr} units/kg/hr`,
          },
          {
            stepNumber: 2,
            title: "Calculate Total Units per Hour",
            formula: "Weight (kg) × New Rate (units/kg/hr)",
            calculation: `${weightKg} kg × ${newDoseUnitsKgHr} units/kg/hr = ${totalUnitsHr} units/hr`,
            result: `${totalUnitsHr} units/hr`,
          },
          {
            stepNumber: 3,
            title: "Calculate New Pump Rate",
            formula: "Units/hr ÷ 50 units/mL",
            calculation: `${totalUnitsHr} units/hr ÷ 50 units/mL = ${newRateMlHr} mL/hr`,
            result: `${newRateMlHr} mL/hr`,
          },
        ],
        rawVariables: { weightKg, currentRateUnitsKgHr, increaseUnitsKgHr, newDoseUnitsKgHr, totalUnitsHr, newRateMlHr },
      };
    },
  },
  {
    id: "heparin-titration-aptt-decrease",
    category: "heparin",
    subtype: "titration-protocol",
    difficulty: "advanced",
    title: "Heparin Titration: Supratherapeutic aPTT Rate Decrease",
    clinicalContext: "Adult Inpatient Anticoagulation Safety Protocol",
    generate: (rng) => {
      const weightKg = pick([60, 70, 75, 80, 85, 90, 100], rng);
      const currentRateUnitsKgHr = 18;
      const decreaseUnitsKgHr = 2;
      const newDoseUnitsKgHr = currentRateUnitsKgHr - decreaseUnitsKgHr; // 16
      const totalUnitsHr = weightKg * newDoseUnitsKgHr;
      const concUnitsMl = 50; // 25,000 / 500
      const newRateMlHr = Math.round((totalUnitsHr / concUnitsMl) * 10) / 10;

      return {
        scenario: `An adult patient weighing ${weightKg} kg has a repeat aPTT of 98 seconds (target 60–85 sec) on heparin 18 units/kg/hr.
Institutional Protocol:
• aPTT 90–110 sec: Hold infusion for 1 hour, then decrease infusion rate by 2 units/kg/hr.`,
        orderText: `Adjust heparin infusion per protocol for patient weight ${weightKg} kg`,
        availableText: `Heparin 25,000 units in 500 mL NS (50 units/mL)`,
        patientWeightKg: weightKg,
        prompt: `Calculate the new IV pump rate in mL/hr when resuming the infusion.`,
        expectedAnswer: newRateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.1,
        hints: [
          `Step 1: Subtract 2 units/kg/hr: 18 - 2 = ${newDoseUnitsKgHr} units/kg/hr.`,
          `Step 2: Multiply by weight: ${weightKg} kg × ${newDoseUnitsKgHr} units/kg/hr = ${totalUnitsHr} units/hr.`,
          `Step 3: Divide by 50 units/mL: ${totalUnitsHr} ÷ 50 = ${newRateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Determine Adjusted Dosage Rate",
            formula: "Current Rate - Protocol Reduction",
            calculation: `${currentRateUnitsKgHr} units/kg/hr - ${decreaseUnitsKgHr} units/kg/hr = ${newDoseUnitsKgHr} units/kg/hr`,
            result: `${newDoseUnitsKgHr} units/kg/hr`,
          },
          {
            stepNumber: 2,
            title: "Calculate Total Units per Hour",
            formula: "Weight (kg) × Adjusted Rate",
            calculation: `${weightKg} kg × ${newDoseUnitsKgHr} units/kg/hr = ${totalUnitsHr} units/hr`,
            result: `${totalUnitsHr} units/hr`,
          },
          {
            stepNumber: 3,
            title: "Calculate Resumption Pump Rate",
            formula: "Units/hr ÷ 50 units/mL",
            calculation: `${totalUnitsHr} units/hr ÷ 50 units/mL = ${newRateMlHr} mL/hr`,
            result: `${newRateMlHr} mL/hr`,
          },
        ],
        rawVariables: { weightKg, currentRateUnitsKgHr, decreaseUnitsKgHr, newDoseUnitsKgHr, totalUnitsHr, newRateMlHr },
      };
    },
  },
  {
    id: "heparin-prophylaxis-fixed-dose",
    category: "heparin",
    subtype: "subq-prophylaxis",
    difficulty: "beginner",
    title: "Subcutaneous Heparin DVT Prophylaxis Volume",
    clinicalContext: "Adult Med-Surg Post-Op DVT Prophylaxis",
    generate: (rng) => {
      const data = pick([
        { orderedUnits: 5000, vialConc: 5000, ans: 1 },
        { orderedUnits: 5000, vialConc: 10000, ans: 0.5 },
        { orderedUnits: 7500, vialConc: 10000, ans: 0.75 },
        { orderedUnits: 2500, vialConc: 5000, ans: 0.5 },
      ], rng);

      return {
        scenario: `An adult post-surgical inpatient is ordered subcutaneous heparin for deep vein thrombosis prophylaxis.`,
        orderText: `Heparin ${data.orderedUnits} USP units SubQ every 8 hours`,
        availableText: `Heparin sodium injection ${data.vialConc} units/mL vial`,
        prompt: `How many mL should the nurse draw up for subcutaneous injection?`,
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "hundredth",
        roundingInstruction: "Round to nearest hundredth or tenth (e.g. 0.5 or 0.75).",
        tolerance: 0.01,
        hints: [
          "Check the available vial concentration.",
          "Apply formula: Desired Units ÷ Have Concentration (units/mL).",
          `Calculate: ${data.orderedUnits} units ÷ ${data.vialConc} units/mL = ${data.ans} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Injection Volume",
            formula: "Desired Units ÷ Have Concentration",
            calculation: `${data.orderedUnits} units ÷ ${data.vialConc} units/mL = ${data.ans} mL`,
            result: `${data.ans} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
];
