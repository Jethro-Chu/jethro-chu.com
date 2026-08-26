import type { QuestionTemplate } from "../types.ts";
import { pick, ADULT_WEIGHTS_LB, ADULT_WEIGHTS_KG } from "./helpers.ts";

export const heparinTemplates: QuestionTemplate[] = [
  {
    id: "heparin-infusion-rate-500ml",
    category: "anticoagulants",
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
        correctAnswer: rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to the nearest tenth.",
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
    category: "anticoagulants",
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
        correctAnswer: rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
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
    category: "anticoagulants",
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
        correctAnswer: volumeMl,
        answerUnit: "mL",
        answerPrecision: 2,
        roundingInstruction: "Round to nearest hundredth (or tenth if clean decimal, e.g. 5.92).",
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
    category: "anticoagulants",
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
        correctAnswer: rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
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
    category: "anticoagulants",
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
        correctAnswer: data.unitsHr,
        answerUnit: "units/hr",
        answerPrecision: 0,
        roundingInstruction: "State whole number of units/hr.",
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
    category: "anticoagulants",
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
        correctAnswer: newRateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
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
    category: "anticoagulants",
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
        correctAnswer: newRateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
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
    category: "anticoagulants",
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
        correctAnswer: data.ans,
        answerUnit: "mL",
        answerPrecision: 2,
        roundingInstruction: "Round to nearest hundredth or tenth (e.g. 0.5 or 0.75).",
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
  {
    id: "heparin-bolus-80units-kg-1000u",
    category: "anticoagulants",
    subtype: "heparin-bolus",
    difficulty: "intermediate",
    title: "Initial 80 units/kg Heparin IV Bolus Syringe Volume",
    clinicalContext: "Adult Acute DVT / PE Resuscitation",
    generate: (rng) => {
      const weightKg = pick([60, 65, 70, 74, 80, 85, 90], rng);
      const bolusUnitsKg = 80;
      const totalUnits = weightKg * bolusUnitsKg;
      const vialConc = 1000;
      const volMl = Math.round((totalUnits / vialConc) * 100) / 100;

      return {
        scenario: `An adult patient weighing ${weightKg} kg diagnosed with acute pulmonary embolism is prescribed an initial IV heparin loading bolus of ${bolusUnitsKg} units/kg.`,
        orderText: `Heparin ${bolusUnitsKg} units/kg IV bolus stat (Patient weight: ${weightKg} kg)`,
        availableText: `Heparin sodium vial 1,000 USP units/mL`,
        patientWeightKg: weightKg,
        prompt: `Calculate the volume in mL the nurse should draw up for the IV bolus.`,
        correctAnswer: volMl,
        answerUnit: "mL",
        answerPrecision: 2,
        roundingInstruction: "State exact number or round to nearest hundredth (e.g. 5.92).",
        hints: [
          `Step 1: Calculate total bolus units: ${weightKg} kg × ${bolusUnitsKg} units/kg = ${totalUnits} units.`,
          `Step 2: Divide total units by vial concentration (${vialConc} units/mL).`,
          `Calculate: ${totalUnits} ÷ ${vialConc} = ${volMl} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Total Bolus Units",
            formula: "Weight (kg) × Dose (units/kg)",
            calculation: `${weightKg} kg × ${bolusUnitsKg} units/kg = ${totalUnits} units`,
            result: `${totalUnits} units`,
          },
          {
            stepNumber: 2,
            title: "Calculate Syringe Volume",
            formula: "Total Units ÷ Concentration (1,000 units/mL)",
            calculation: `${totalUnits} units ÷ 1,000 units/mL = ${volMl} mL`,
            result: `${volMl} mL`,
          },
        ],
        rawVariables: { weightKg, bolusUnitsKg, totalUnits, vialConc, volMl },
      };
    },
  },
  {
    id: "heparin-bolus-60units-kg-acs",
    category: "anticoagulants",
    subtype: "heparin-bolus",
    difficulty: "intermediate",
    title: "Weight-Based Heparin Bolus for Acute Coronary Syndrome (60 units/kg)",
    clinicalContext: "Adult CCU Acute Coronary Syndrome Protocol",
    generate: (rng) => {
      const weightKg = pick([60, 65, 70, 75, 80, 85], rng);
      const bolusUnitsKg = 60;
      const totalUnits = weightKg * bolusUnitsKg;
      const vialConc = 1000;
      const volMl = Math.round((totalUnits / vialConc) * 100) / 100;

      return {
        scenario: `An adult patient weighing ${weightKg} kg with non-ST segment elevation myocardial infarction (NSTEMI) is prescribed an initial ACS heparin bolus of ${bolusUnitsKg} units/kg (maximum 4,000 units).`,
        orderText: `Heparin ${bolusUnitsKg} units/kg IV bolus stat`,
        availableText: `Heparin 1,000 USP units/mL vial`,
        patientWeightKg: weightKg,
        prompt: `How many units of Heparin should be administered?`,
        correctAnswer: totalUnits,
        answerUnit: "units",
        answerPrecision: 0,
        roundingInstruction: "State whole number of units.",
        hints: [
          `Multiply patient weight by ${bolusUnitsKg} units/kg.`,
          `Calculate: ${weightKg} kg × ${bolusUnitsKg} units/kg = ${totalUnits} units.`,
          `Verify that total dose (${totalUnits} units) does not exceed 4,000 units maximum.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Bolus Dose",
            formula: "Weight (kg) × 60 units/kg",
            calculation: `${weightKg} kg × ${bolusUnitsKg} units/kg = ${totalUnits} units`,
            result: `${totalUnits} units`,
          },
        ],
        rawVariables: { weightKg, bolusUnitsKg, totalUnits, vialConc, volMl },
      };
    },
  },
  {
    id: "heparin-infusion-12units-kg-acs",
    category: "anticoagulants",
    subtype: "heparin-infusion",
    difficulty: "intermediate",
    title: "ACS Heparin Maintenance Infusion Rate (12 units/kg/hr)",
    clinicalContext: "Adult CCU Myocardial Infarction Management",
    generate: (rng) => {
      const weightKg = pick([60, 70, 75, 80, 85, 90], rng);
      const doseUnitsKgHr = 12;
      const hourlyUnits = weightKg * doseUnitsKgHr;
      const concUnitsMl = 100; // 25,000u in 250 mL
      const rateMlHr = Math.round((hourlyUnits / concUnitsMl) * 10) / 10;

      return {
        scenario: `An adult coronary care patient weighing ${weightKg} kg is prescribed a continuous ACS heparin infusion at ${doseUnitsKgHr} units/kg/hr (max 1,000 units/hr).`,
        orderText: `Heparin continuous IV infusion at ${doseUnitsKgHr} units/kg/hr`,
        availableText: `Heparin 25,000 USP units in 250 mL D5W (${concUnitsMl} units/mL)`,
        patientWeightKg: weightKg,
        prompt: `Calculate the IV pump flow rate in mL/hr.`,
        correctAnswer: rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          `Step 1: Calculate hourly units: ${weightKg} kg × ${doseUnitsKgHr} units/kg/hr = ${hourlyUnits} units/hr.`,
          `Step 2: Bag concentration is 25,000 units ÷ 250 mL = 100 units/mL.`,
          `Step 3: Divide hourly units by concentration: ${hourlyUnits} ÷ 100 = ${rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Ordered Units per Hour",
            formula: "Weight (kg) × Dose (units/kg/hr)",
            calculation: `${weightKg} kg × ${doseUnitsKgHr} units/kg/hr = ${hourlyUnits} units/hr`,
            result: `${hourlyUnits} units/hr`,
          },
          {
            stepNumber: 2,
            title: "Calculate Flow Rate",
            formula: "Units/hr ÷ Concentration (100 units/mL)",
            calculation: `${hourlyUnits} units/hr ÷ 100 units/mL = ${rateMlHr} mL/hr`,
            result: `${rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { weightKg, doseUnitsKgHr, hourlyUnits, concUnitsMl, rateMlHr },
      };
    },
  },
  {
    id: "heparin-reverse-mlhr-to-units-hr",
    category: "anticoagulants",
    subtype: "heparin-infusion",
    difficulty: "beginner",
    title: "Reverse Heparin Infusion: Units Delivered per Hour",
    clinicalContext: "Adult Med-Surg Anticoagulation Chart Audit",
    generate: (rng) => {
      const data = pick([
        { rateMlHr: 24, concUnitsMl: 50, bagUnits: 25000, bagMl: 500, unitsHr: 1200 },
        { rateMlHr: 28, concUnitsMl: 50, bagUnits: 25000, bagMl: 500, unitsHr: 1400 },
        { rateMlHr: 20, concUnitsMl: 50, bagUnits: 25000, bagMl: 500, unitsHr: 1000 },
        { rateMlHr: 14, concUnitsMl: 100, bagUnits: 25000, bagMl: 250, unitsHr: 1400 },
        { rateMlHr: 10, concUnitsMl: 100, bagUnits: 25000, bagMl: 250, unitsHr: 1000 },
      ], rng);

      return {
        scenario: `A continuous heparin infusion is currently infusing on an electronic IV pump at ${data.rateMlHr} mL/hr. The IV bag is labeled ${data.bagUnits.toLocaleString()} units in ${data.bagMl} mL 0.9% Normal Saline (${data.concUnitsMl} units/mL).`,
        orderText: `Heparin IV infusion running at ${data.rateMlHr} mL/hr`,
        availableText: `Heparin ${data.bagUnits.toLocaleString()} units / ${data.bagMl} mL`,
        prompt: `Calculate the dosage rate the patient is currently receiving in units/hr.`,
        correctAnswer: data.unitsHr,
        answerUnit: "units/hr",
        answerPrecision: 0,
        roundingInstruction: "State exact whole number of units/hr.",
        hints: [
          "Multiply the infusion pump rate (mL/hr) by the bag concentration (units/mL).",
          `Calculate: ${data.rateMlHr} mL/hr × ${data.concUnitsMl} units/mL.`,
          `${data.rateMlHr} × ${data.concUnitsMl} = ${data.unitsHr} units/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Hourly Dosage Delivered",
            formula: "Pump Rate (mL/hr) × Bag Concentration (units/mL)",
            calculation: `${data.rateMlHr} mL/hr × ${data.concUnitsMl} units/mL = ${data.unitsHr} units/hr`,
            result: `${data.unitsHr} units/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "heparin-reverse-mlhr-to-units-kg-hr",
    category: "anticoagulants",
    subtype: "heparin-infusion",
    difficulty: "advanced",
    title: "Reverse Heparin Infusion: Weight-Based Rate (units/kg/hr)",
    clinicalContext: "Adult Inpatient Anticoagulation Safety Reconciliation",
    generate: (rng) => {
      const data = pick([
        { rateMlHr: 28, concUnitsMl: 50, hourlyUnits: 1400, weightKg: 80, doseUnitsKgHr: 17.5 },
        { rateMlHr: 25, concUnitsMl: 50, hourlyUnits: 1250, weightKg: 70, doseUnitsKgHr: 17.9 },
        { rateMlHr: 30, concUnitsMl: 50, hourlyUnits: 1500, weightKg: 75, doseUnitsKgHr: 20.0 },
        { rateMlHr: 16, concUnitsMl: 100, hourlyUnits: 1600, weightKg: 80, doseUnitsKgHr: 20.0 },
      ], rng);

      return {
        scenario: `An adult inpatient weighing ${data.weightKg} kg is receiving IV heparin from a bag containing 25,000 units in 500 mL NS (${data.concUnitsMl} units/mL). The pump is set at ${data.rateMlHr} mL/hr.`,
        orderText: `Heparin infusion at ${data.rateMlHr} mL/hr | Patient weight: ${data.weightKg} kg`,
        availableText: `Heparin 25,000 units in 500 mL NS (${data.concUnitsMl} units/mL)`,
        patientWeightKg: data.weightKg,
        prompt: `Calculate the current weight-based dose the patient is receiving in units/kg/hr.`,
        correctAnswer: data.doseUnitsKgHr,
        answerUnit: "units/kg/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth (e.g. 17.5).",
        hints: [
          `Step 1: Find hourly units delivered: ${data.rateMlHr} mL/hr × ${data.concUnitsMl} units/mL = ${data.hourlyUnits} units/hr.`,
          `Step 2: Divide hourly units by patient weight in kg: ${data.hourlyUnits} units/hr ÷ ${data.weightKg} kg.`,
          `Calculate: ${data.hourlyUnits} ÷ ${data.weightKg} = ${data.doseUnitsKgHr} units/kg/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Total Units per Hour",
            formula: "Pump Rate (mL/hr) × Concentration (units/mL)",
            calculation: `${data.rateMlHr} mL/hr × ${data.concUnitsMl} units/mL = ${data.hourlyUnits} units/hr`,
            result: `${data.hourlyUnits} units/hr`,
          },
          {
            stepNumber: 2,
            title: "Calculate Weight-Based Delivery Rate",
            formula: "Hourly Units ÷ Weight (kg)",
            calculation: `${data.hourlyUnits} units/hr ÷ ${data.weightKg} kg = ${data.doseUnitsKgHr} units/kg/hr`,
            result: `${data.doseUnitsKgHr} units/kg/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "heparin-reverse-units-delivered-shift",
    category: "anticoagulants",
    subtype: "heparin-infusion",
    difficulty: "beginner",
    title: "12-Hour Shift Total Heparin Units Delivered",
    clinicalContext: "Adult Inpatient Shift Intake Reconciliation",
    generate: (rng) => {
      const data = pick([
        { unitsHr: 1100, hrs: 12, totalUnits: 13200 },
        { unitsHr: 1400, hrs: 12, totalUnits: 16800 },
        { unitsHr: 1250, hrs: 8, totalUnits: 10000 },
        { unitsHr: 1500, hrs: 12, totalUnits: 18000 },
      ], rng);

      return {
        scenario: `A patient has received a continuous IV heparin infusion infusing at a steady ${data.unitsHr.toLocaleString()} units/hr for ${data.hrs} consecutive hours.`,
        orderText: `Heparin IV continuous infusion at ${data.unitsHr.toLocaleString()} units/hr`,
        prompt: `How many total units of heparin did the patient receive over this ${data.hrs}-hour period?`,
        correctAnswer: data.totalUnits,
        answerUnit: "units",
        answerPrecision: 0,
        roundingInstruction: "State exact whole number of units.",
        hints: [
          "Multiply the hourly dose by the number of hours.",
          `Calculate: ${data.unitsHr} units/hr × ${data.hrs} hr.`,
          `${data.unitsHr} × ${data.hrs} = ${data.totalUnits} units.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Total Units Administered",
            formula: "Hourly Rate (units/hr) × Hours",
            calculation: `${data.unitsHr} units/hr × ${data.hrs} hr = ${data.totalUnits} units`,
            result: `${data.totalUnits} units`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "heparin-protocol-aptt-rebolus-volume",
    category: "anticoagulants",
    subtype: "heparin-bolus",
    difficulty: "intermediate",
    title: "Protocol-Driven Subtherapeutic aPTT Re-Bolus Syringe Volume",
    clinicalContext: "Adult Inpatient Heparin Nomogram Management",
    generate: (rng) => {
      const weightKg = pick([65, 70, 75, 80, 85, 90], rng);
      const rebolusUnitsKg = 40;
      const totalUnits = weightKg * rebolusUnitsKg;
      const vialConc = 1000;
      const volMl = Math.round((totalUnits / vialConc) * 10) / 10;

      return {
        scenario: `An adult inpatient weighing ${weightKg} kg on a weight-based heparin protocol has an aPTT of 44 seconds (therapeutic target 60–85 sec). The institutional protocol dictates: "Give 40 units/kg IV bolus and increase rate by 2 units/kg/hr."`,
        orderText: `Heparin ${rebolusUnitsKg} units/kg IV push re-bolus per protocol (Weight: ${weightKg} kg)`,
        availableText: `Heparin 1,000 USP units/mL vial`,
        patientWeightKg: weightKg,
        prompt: `How many mL should the nurse draw up for the IV push re-bolus?`,
        correctAnswer: volMl,
        answerUnit: "mL",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          `Step 1: Calculate re-bolus units: ${weightKg} kg × ${rebolusUnitsKg} units/kg = ${totalUnits} units.`,
          `Step 2: Divide by vial concentration: ${totalUnits} units ÷ 1,000 units/mL = ${volMl} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Re-Bolus Units",
            formula: "Weight (kg) × 40 units/kg",
            calculation: `${weightKg} kg × ${rebolusUnitsKg} units/kg = ${totalUnits} units`,
            result: `${totalUnits} units`,
          },
          {
            stepNumber: 2,
            title: "Calculate Syringe Volume",
            formula: "Total Units ÷ 1,000 units/mL",
            calculation: `${totalUnits} units ÷ 1,000 units/mL = ${volMl} mL`,
            result: `${volMl} mL`,
          },
        ],
        rawVariables: { weightKg, rebolusUnitsKg, totalUnits, vialConc, volMl },
      };
    },
  },
  {
    id: "heparin-non-weight-fixed-rate",
    category: "anticoagulants",
    subtype: "heparin-infusion",
    difficulty: "beginner",
    title: "Non-Weight-Based Fixed Heparin Infusion Rate (mL/hr)",
    clinicalContext: "Adult Cardiology Fixed Anticoagulation Order",
    generate: (rng) => {
      const data = pick([
        { orderedUnitsHr: 1000, bagUnits: 25000, bagMl: 500, concUnitsMl: 50, rateMlHr: 20 },
        { orderedUnitsHr: 1200, bagUnits: 25000, bagMl: 500, concUnitsMl: 50, rateMlHr: 24 },
        { orderedUnitsHr: 800, bagUnits: 25000, bagMl: 500, concUnitsMl: 50, rateMlHr: 16 },
        { orderedUnitsHr: 1500, bagUnits: 25000, bagMl: 500, concUnitsMl: 50, rateMlHr: 30 },
      ], rng);

      return {
        scenario: `A cardiologist prescribes a standard non-weight-based continuous heparin infusion at ${data.orderedUnitsHr} units/hr.`,
        orderText: `Heparin sodium continuous IV infusion at ${data.orderedUnitsHr} units/hr`,
        availableText: `Heparin ${data.bagUnits.toLocaleString()} units in 500 mL 0.9% NS (${data.concUnitsMl} units/mL)`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 0,
        roundingInstruction: "State exact whole number.",
        hints: [
          `Find concentration: ${data.bagUnits} units ÷ ${data.bagMl} mL = ${data.concUnitsMl} units/mL.`,
          `Divide ordered units/hr by concentration: ${data.orderedUnitsHr} units/hr ÷ ${data.concUnitsMl} units/mL.`,
          `Calculate: ${data.orderedUnitsHr} ÷ ${data.concUnitsMl} = ${data.rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Flow Rate",
            formula: "Ordered Units/hr ÷ Bag Concentration (units/mL)",
            calculation: `${data.orderedUnitsHr} units/hr ÷ ${data.concUnitsMl} units/mL = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "heparin-flush-catheter-lock",
    category: "anticoagulants",
    subtype: "subq-prophylaxis",
    difficulty: "beginner",
    title: "Central Venous Catheter Heparin Flush Lock Volume",
    clinicalContext: "Adult Inpatient Central Line Maintenance",
    generate: (rng) => {
      const data = pick([
        { desiredUnits: 300, flushConc: 100, ans: 3.0 },
        { desiredUnits: 500, flushConc: 100, ans: 5.0 },
        { desiredUnits: 200, flushConc: 100, ans: 2.0 },
        { desiredUnits: 100, flushConc: 100, ans: 1.0 },
      ], rng);

      return {
        scenario: `A nurse is preparing to lock an adult patient's central venous catheter port per hospital policy using a heparin flush solution (100 units/mL).`,
        orderText: `Heparin lock ${data.desiredUnits} units into central line catheter lumen`,
        availableText: `Heparin lock flush 100 USP units/mL vial`,
        prompt: `How many mL should the nurse draw up to instill ${data.desiredUnits} units?`,
        correctAnswer: data.ans,
        answerUnit: "mL",
        answerPrecision: 1,
        roundingInstruction: "State exact number.",
        safetyPearl: "Catheter flush concentrations (e.g. 10 to 100 units/mL) must never be confused with therapeutic heparin concentrations (e.g. 1,000 to 25,000 units/mL).",
        hints: [
          "Divide prescribed units by flush concentration (100 units/mL).",
          `Calculate: ${data.desiredUnits} units ÷ 100 units/mL = ${data.ans} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Flush Volume",
            formula: "Prescribed Units ÷ 100 units/mL",
            calculation: `${data.desiredUnits} units ÷ 100 units/mL = ${data.ans} mL`,
            result: `${data.ans} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "enoxaparin-weight-based-mg",
    category: "anticoagulants",
    subtype: "enoxaparin-dosing",
    difficulty: "beginner",
    title: "Weight-Based Enoxaparin (Lovenox) Therapeutic Dosing",
    clinicalContext: "Adult Inpatient DVT / PE Therapeutic Anticoagulation",
    generate: (rng) => {
      const data = pick([
        { weightKg: 82, doseMgKg: 1, totalMg: 82 },
        { weightKg: 70, doseMgKg: 1, totalMg: 70 },
        { weightKg: 95, doseMgKg: 1, totalMg: 95 },
        { weightKg: 64, doseMgKg: 1, totalMg: 64 },
        { weightKg: 80, doseMgKg: 1.5, totalMg: 120 },
      ], rng);

      return {
        scenario: `An adult inpatient weighing ${data.weightKg} kg is diagnosed with acute deep vein thrombosis. The physician orders therapeutic enoxaparin (Lovenox) at ${data.doseMgKg} mg/kg subcutaneously.`,
        orderText: `Enoxaparin ${data.doseMgKg} mg/kg SubQ q12h (Patient weight: ${data.weightKg} kg)`,
        availableText: `Enoxaparin injection 100 mg/mL prefilled syringes`,
        patientWeightKg: data.weightKg,
        prompt: `How many mg of enoxaparin should the nurse administer for this dose?`,
        correctAnswer: data.totalMg,
        answerUnit: "mg",
        answerPrecision: 0,
        roundingInstruction: "State whole number of mg.",
        safetyPearl: "Do not expel the air bubble in prefilled enoxaparin syringes before administration unless adjusting dose.",
        hints: [
          "Multiply patient weight in kg by the ordered dose in mg/kg.",
          `Calculate: ${data.weightKg} kg × ${data.doseMgKg} mg/kg.`,
          `${data.weightKg} × ${data.doseMgKg} = ${data.totalMg} mg.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Therapeutic Enoxaparin Dose",
            formula: "Weight (kg) × Dose (mg/kg)",
            calculation: `${data.weightKg} kg × ${data.doseMgKg} mg/kg = ${data.totalMg} mg`,
            result: `${data.totalMg} mg`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "enoxaparin-syringe-volume-ml",
    category: "anticoagulants",
    subtype: "enoxaparin-dosing",
    difficulty: "intermediate",
    title: "Enoxaparin Subcutaneous Syringe Volume",
    clinicalContext: "Adult Inpatient Anticoagulation Administration",
    generate: (rng) => {
      const data = pick([
        { weightKg: 80, doseMgKg: 1, totalMg: 80, concMgMl: 100, volMl: 0.8 },
        { weightKg: 60, doseMgKg: 1, totalMg: 60, concMgMl: 100, volMl: 0.6 },
        { weightKg: 70, doseMgKg: 1, totalMg: 70, concMgMl: 100, volMl: 0.7 },
        { weightKg: 90, doseMgKg: 1, totalMg: 90, concMgMl: 100, volMl: 0.9 },
        { weightKg: 100, doseMgKg: 1, totalMg: 100, concMgMl: 100, volMl: 1.0 },
      ], rng);

      return {
        scenario: `An adult inpatient weighing ${data.weightKg} kg is prescribed enoxaparin 1 mg/kg subcutaneously. The pharmacy supplies enoxaparin at a concentration of ${data.concMgMl} mg/mL.`,
        orderText: `Enoxaparin 1 mg/kg SubQ q12h for patient weight ${data.weightKg} kg`,
        availableText: `Enoxaparin ${data.concMgMl} mg/mL syringe`,
        patientWeightKg: data.weightKg,
        prompt: `How many mL should the nurse prepare to deliver the ordered dose?`,
        correctAnswer: data.volMl,
        answerUnit: "mL",
        answerPrecision: 1,
        roundingInstruction: "State exact decimal value (e.g. 0.8).",
        safetyPearl: "Administer enoxaparin in the abdominal subcutaneous tissue, at least 2 inches away from the umbilicus.",
        hints: [
          `Step 1: Calculate ordered mg: ${data.weightKg} kg × 1 mg/kg = ${data.totalMg} mg.`,
          `Step 2: Divide ordered mg by concentration (${data.concMgMl} mg/mL).`,
          `Calculate: ${data.totalMg} mg ÷ ${data.concMgMl} mg/mL = ${data.volMl} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Total Dose in Milligrams",
            formula: "Weight (kg) × 1 mg/kg",
            calculation: `${data.weightKg} kg × 1 mg/kg = ${data.totalMg} mg`,
            result: `${data.totalMg} mg`,
          },
          {
            stepNumber: 2,
            title: "Calculate Syringe Volume",
            formula: "Dose (mg) ÷ Concentration (mg/mL)",
            calculation: `${data.totalMg} mg ÷ ${data.concMgMl} mg/mL = ${data.volMl} mL`,
            result: `${data.volMl} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "heparin-bolus-from-pounds-units",
    category: "anticoagulants",
    subtype: "heparin-bolus",
    difficulty: "intermediate",
    title: "Heparin IV Loading Bolus from Patient Weight in Pounds",
    clinicalContext: "Adult Inpatient Anticoagulation Protocol Initiation",
    generate: (rng) => {
      const data = pick([
        { lb: 176, kg: 80, bolusUnitsKg: 80, totalUnits: 6400 },
        { lb: 198, kg: 90, bolusUnitsKg: 80, totalUnits: 7200 },
        { lb: 154, kg: 70, bolusUnitsKg: 80, totalUnits: 5600 },
        { lb: 132, kg: 60, bolusUnitsKg: 80, totalUnits: 4800 },
      ], rng);

      return {
        scenario: `An adult inpatient weighing ${data.lb} lb is admitted with acute deep vein thrombosis and ordered an initial IV heparin loading bolus of ${data.bolusUnitsKg} units/kg.`,
        orderText: `Heparin ${data.bolusUnitsKg} units/kg IV bolus stat (Patient weight: ${data.lb} lb)`,
        availableText: `Heparin sodium 1,000 USP units/mL vial`,
        patientWeightLb: data.lb,
        patientWeightKg: data.kg,
        prompt: `How many total units of Heparin should the nurse administer for this bolus?`,
        correctAnswer: data.totalUnits,
        answerUnit: "units",
        answerPrecision: 0,
        roundingInstruction: "State whole number of units.",
        safetyPearl: "Always convert patient weight accurately from pounds to kilograms (divide by 2.2) before calculating weight-based heparin doses.",
        hints: [
          `Step 1: Convert pounds to kilograms: ${data.lb} lb ÷ 2.2 = ${data.kg} kg.`,
          `Step 2: Multiply kg by ${data.bolusUnitsKg} units/kg: ${data.kg} kg × ${data.bolusUnitsKg} units/kg.`,
          `Calculate: ${data.kg} × ${data.bolusUnitsKg} = ${data.totalUnits} units.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Weight to Kilograms",
            formula: "Weight (lb) ÷ 2.2",
            calculation: `${data.lb} lb ÷ 2.2 = ${data.kg} kg`,
            result: `${data.kg} kg`,
          },
          {
            stepNumber: 2,
            title: "Calculate Bolus Units",
            formula: "Weight (kg) × Bolus Dose (units/kg)",
            calculation: `${data.kg} kg × ${data.bolusUnitsKg} units/kg = ${data.totalUnits} units`,
            result: `${data.totalUnits} units`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "heparin-protocol-rate-increase-from-units-hr",
    category: "anticoagulants",
    subtype: "titration-protocol",
    difficulty: "advanced",
    title: "Heparin Protocol Titration: Increase from Units/hr Infusion",
    clinicalContext: "Adult Inpatient Weight-Based Titration Protocol",
    generate: (rng) => {
      const data = pick([
        { weightKg: 75, currentUnitsHr: 1200, increaseUnitsKgHr: 2, deltaUnitsHr: 150, newUnitsHr: 1350, concUnitsMl: 50, newRateMlHr: 27 },
        { weightKg: 70, currentUnitsHr: 1100, increaseUnitsKgHr: 2, deltaUnitsHr: 140, newUnitsHr: 1240, concUnitsMl: 50, newRateMlHr: 24.8 },
        { weightKg: 80, currentUnitsHr: 1300, increaseUnitsKgHr: 2, deltaUnitsHr: 160, newUnitsHr: 1460, concUnitsMl: 50, newRateMlHr: 29.2 },
        { weightKg: 85, currentUnitsHr: 1200, increaseUnitsKgHr: 2, deltaUnitsHr: 170, newUnitsHr: 1370, concUnitsMl: 50, newRateMlHr: 27.4 },
      ], rng);

      return {
        scenario: `An adult patient weighing ${data.weightKg} kg is receiving a continuous heparin infusion currently running at ${data.currentUnitsHr} units/hr. The 6-hour aPTT is subtherapeutic. The protocol directs the nurse to increase the infusion by ${data.increaseUnitsKgHr} units/kg/hr. The IV bag contains 25,000 units in 500 mL Normal Saline (${data.concUnitsMl} units/mL).`,
        orderText: `Adjust heparin infusion: increase current rate by ${data.increaseUnitsKgHr} units/kg/hr (Weight: ${data.weightKg} kg)`,
        availableText: `Heparin 25,000 units in 500 mL NS (${data.concUnitsMl} units/mL)`,
        patientWeightKg: data.weightKg,
        prompt: `Calculate the NEW pump rate in mL/hr.`,
        correctAnswer: data.newRateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        safetyPearl: "Unfractionated heparin is monitored via aPTT or anti-Xa protocols. Independent double-checks are critical when changing pump infusion rates.",
        hints: [
          `Step 1: Calculate rate increase: ${data.weightKg} kg × ${data.increaseUnitsKgHr} units/kg/hr = ${data.deltaUnitsHr} units/hr.`,
          `Step 2: Add to current rate: ${data.currentUnitsHr} + ${data.deltaUnitsHr} = ${data.newUnitsHr} units/hr.`,
          `Step 3: Convert to mL/hr: ${data.newUnitsHr} units/hr ÷ ${data.concUnitsMl} units/mL = ${data.newRateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Hourly Rate Increase",
            formula: "Weight (kg) × Rate Increase (units/kg/hr)",
            calculation: `${data.weightKg} kg × ${data.increaseUnitsKgHr} units/kg/hr = ${data.deltaUnitsHr} units/hr`,
            result: `${data.deltaUnitsHr} units/hr`,
          },
          {
            stepNumber: 2,
            title: "Calculate New Total Units per Hour",
            formula: "Current Units/hr + Hourly Increase",
            calculation: `${data.currentUnitsHr} units/hr + ${data.deltaUnitsHr} units/hr = ${data.newUnitsHr} units/hr`,
            result: `${data.newUnitsHr} units/hr`,
          },
          {
            stepNumber: 3,
            title: "Calculate New Pump Rate",
            formula: "New Units/hr ÷ Concentration (units/mL)",
            calculation: `${data.newUnitsHr} units/hr ÷ ${data.concUnitsMl} units/mL = ${data.newRateMlHr} mL/hr`,
            result: `${data.newRateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
];
