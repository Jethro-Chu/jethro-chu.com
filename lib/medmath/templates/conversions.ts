import type { QuestionTemplate } from "../types.ts";
import { pick, randFloat, randInt, ADULT_WEIGHTS_LB, ADULT_WEIGHTS_KG } from "./helpers.ts";

export const conversionTemplates: QuestionTemplate[] = [
  {
    id: "conv-g-to-mg",
    category: "conversions",
    subtype: "g-to-mg",
    difficulty: "beginner",
    title: "Grams to Milligrams Conversion",
    clinicalContext: "Adult Medical-Surgical Medication Order",
    generate: (rng) => {
      const grams = pick([0.25, 0.5, 0.75, 1.25, 1.5, 2, 2.5, 3, 0.125, 0.375], rng);
      const mg = grams * 1000;
      return {
        scenario: `A provider prescribes an oral medication dose of ${grams} g.`,
        orderText: `${grams} g PO`,
        prompt: `Convert ${grams} g to mg.`,
        expectedAnswer: mg,
        expectedUnit: "mg",
        roundingMode: "exact",
        roundingInstruction: "State exact numerical value.",
        tolerance: 0.01,
        hints: [
          "Recall the metric prefix relationship: 1 gram (g) = 1,000 milligrams (mg).",
          "To convert grams to milligrams, multiply the number of grams by 1,000.",
          `Calculate: ${grams} × 1,000.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Metric Conversion",
            formula: "Grams × 1,000 = Milligrams",
            calculation: `${grams} g × 1,000 = ${mg} mg`,
            result: `${mg} mg`,
          },
        ],
        rawVariables: { grams, mg },
      };
    },
  },
  {
    id: "conv-mg-to-g",
    category: "conversions",
    subtype: "mg-to-g",
    difficulty: "beginner",
    title: "Milligrams to Grams Conversion",
    clinicalContext: "Adult Inpatient Medication Order",
    generate: (rng) => {
      const mg = pick([250, 500, 750, 1000, 1250, 1500, 2000, 3000, 4000], rng);
      const grams = mg / 1000;
      return {
        scenario: `The pharmacy label provides dosage in grams for a medication ordered in milligrams.`,
        orderText: `${mg} mg PO daily`,
        prompt: `Convert ${mg} mg to g.`,
        expectedAnswer: grams,
        expectedUnit: "g",
        roundingMode: "exact",
        roundingInstruction: "State exact decimal value.",
        tolerance: 0.001,
        hints: [
          "Recall the metric prefix relationship: 1,000 milligrams (mg) = 1 gram (g).",
          "To convert milligrams to grams, divide the number of milligrams by 1,000 (or move the decimal 3 places left).",
          `Calculate: ${mg} ÷ 1,000.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Metric Conversion",
            formula: "Milligrams ÷ 1,000 = Grams",
            calculation: `${mg} mg ÷ 1,000 = ${grams} g`,
            result: `${grams} g`,
          },
        ],
        rawVariables: { mg, grams },
      };
    },
  },
  {
    id: "conv-mg-to-mcg",
    category: "conversions",
    subtype: "mg-to-mcg",
    difficulty: "beginner",
    title: "Milligrams to Micrograms Conversion",
    clinicalContext: "Adult Telemetry / Med-Surg Order",
    generate: (rng) => {
      const mg = pick([0.05, 0.1, 0.125, 0.25, 0.4, 0.5, 0.8, 1, 1.5, 2], rng);
      const mcg = Math.round(mg * 1000);
      return {
        scenario: `A cardiac medication is ordered in milligrams, but the pharmacy supplies the formulation labeled in micrograms.`,
        orderText: `${mg} mg IV`,
        prompt: `Convert ${mg} mg to mcg.`,
        expectedAnswer: mcg,
        expectedUnit: "mcg",
        roundingMode: "exact",
        roundingInstruction: "State exact numerical value.",
        tolerance: 0.01,
        hints: [
          "Recall the metric prefix relationship: 1 milligram (mg) = 1,000 micrograms (mcg).",
          "To convert milligrams to micrograms, multiply by 1,000 (move the decimal point 3 places to the right).",
          `Calculate: ${mg} × 1,000.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Metric Conversion",
            formula: "Milligrams × 1,000 = Micrograms",
            calculation: `${mg} mg × 1,000 = ${mcg} mcg`,
            result: `${mcg} mcg`,
          },
        ],
        rawVariables: { mg, mcg },
      };
    },
  },
  {
    id: "conv-mcg-to-mg",
    category: "conversions",
    subtype: "mcg-to-mg",
    difficulty: "beginner",
    title: "Micrograms to Milligrams Conversion",
    clinicalContext: "Adult Medical-Surgical Order",
    generate: (rng) => {
      const mcg = pick([125, 250, 400, 500, 750, 1000, 1250, 1500, 2500], rng);
      const mg = mcg / 1000;
      return {
        scenario: `A medication order is written as ${mcg} mcg. The medication administration record requires charting in milligrams.`,
        orderText: `${mcg} mcg PO`,
        prompt: `Convert ${mcg} mcg to mg.`,
        expectedAnswer: mg,
        expectedUnit: "mg",
        roundingMode: "exact",
        roundingInstruction: "State exact decimal value.",
        tolerance: 0.001,
        hints: [
          "Recall the metric prefix relationship: 1,000 micrograms (mcg) = 1 milligram (mg).",
          "To convert micrograms to milligrams, divide the number of micrograms by 1,000.",
          `Calculate: ${mcg} ÷ 1,000.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Metric Conversion",
            formula: "Micrograms ÷ 1,000 = Milligrams",
            calculation: `${mcg} mcg ÷ 1,000 = ${mg} mg`,
            result: `${mg} mg`,
          },
        ],
        rawVariables: { mcg, mg },
      };
    },
  },
  {
    id: "conv-l-to-ml",
    category: "conversions",
    subtype: "l-to-ml",
    difficulty: "beginner",
    title: "Liters to Milliliters Conversion",
    clinicalContext: "Adult Inpatient Fluid Management",
    generate: (rng) => {
      const liters = pick([0.5, 0.75, 1, 1.5, 2, 2.5, 3, 0.25], rng);
      const ml = liters * 1000;
      return {
        scenario: `An adult patient has an IV order for ${liters} L of normal saline.`,
        orderText: `${liters} L 0.9% Normal Saline IV`,
        prompt: `Convert ${liters} L to mL.`,
        expectedAnswer: ml,
        expectedUnit: "mL",
        roundingMode: "exact",
        roundingInstruction: "State exact whole number.",
        tolerance: 0.01,
        hints: [
          "Recall that 1 Liter (L) = 1,000 milliliters (mL).",
          "Multiply the volume in liters by 1,000.",
          `Calculate: ${liters} × 1,000.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Volume Conversion",
            formula: "Liters × 1,000 = Milliliters",
            calculation: `${liters} L × 1,000 = ${ml} mL`,
            result: `${ml} mL`,
          },
        ],
        rawVariables: { liters, ml },
      };
    },
  },
  {
    id: "conv-ml-to-l",
    category: "conversions",
    subtype: "ml-to-l",
    difficulty: "beginner",
    title: "Milliliters to Liters Conversion",
    clinicalContext: "Adult Fluid Balance Charting",
    generate: (rng) => {
      const ml = pick([250, 500, 750, 1000, 1250, 1500, 2000, 2500, 3000], rng);
      const liters = ml / 1000;
      return {
        scenario: `An adult patient received a total of ${ml} mL IV fluids over a 24-hour shift.`,
        orderText: `Total IV Intake: ${ml} mL`,
        prompt: `Convert ${ml} mL to L.`,
        expectedAnswer: liters,
        expectedUnit: "L",
        roundingMode: "exact",
        roundingInstruction: "State exact decimal value.",
        tolerance: 0.001,
        hints: [
          "Recall that 1,000 milliliters (mL) = 1 Liter (L).",
          "Divide the volume in milliliters by 1,000.",
          `Calculate: ${ml} ÷ 1,000.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Volume Conversion",
            formula: "Milliliters ÷ 1,000 = Liters",
            calculation: `${ml} mL ÷ 1,000 = ${liters} L`,
            result: `${liters} L`,
          },
        ],
        rawVariables: { ml, liters },
      };
    },
  },
  {
    id: "conv-lb-to-kg",
    category: "conversions",
    subtype: "lb-to-kg",
    difficulty: "beginner",
    title: "Pounds to Kilograms Weight Conversion",
    clinicalContext: "Adult Patient Admission Assessment",
    generate: (rng) => {
      const pair = pick(ADULT_WEIGHTS_LB, rng);
      return {
        scenario: `An adult patient is admitted with a documented weight of ${pair.lb} lb.`,
        orderText: `Patient weight: ${pair.lb} lb`,
        patientWeightLb: pair.lb,
        patientWeightKg: pair.kg,
        prompt: `Convert ${pair.lb} lb to kilograms (kg).`,
        expectedAnswer: pair.kg,
        expectedUnit: "kg",
        roundingMode: "tenth",
        roundingInstruction: "Round to the nearest tenth if necessary.",
        tolerance: 0.1,
        hints: [
          "Recall the standard conversion factor: 1 kg = 2.2 lb.",
          "To convert pounds to kilograms, divide the patient's weight in pounds by 2.2.",
          `Calculate: ${pair.lb} ÷ 2.2.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Weight Conversion",
            formula: "Pounds ÷ 2.2 = Kilograms",
            calculation: `${pair.lb} lb ÷ 2.2 = ${pair.kg} kg`,
            result: `${pair.kg} kg`,
          },
        ],
        rawVariables: { lb: pair.lb, kg: pair.kg },
      };
    },
  },
  {
    id: "conv-kg-to-lb",
    category: "conversions",
    subtype: "kg-to-lb",
    difficulty: "beginner",
    title: "Kilograms to Pounds Weight Conversion",
    clinicalContext: "Adult Inpatient Weight Verification",
    generate: (rng) => {
      const kg = pick(ADULT_WEIGHTS_KG, rng);
      const lb = Math.round(kg * 2.2 * 10) / 10;
      return {
        scenario: `An adult patient's electronic health record lists their metric weight as ${kg} kg.`,
        orderText: `Patient weight: ${kg} kg`,
        patientWeightKg: kg,
        patientWeightLb: lb,
        prompt: `Convert ${kg} kg to pounds (lb).`,
        expectedAnswer: lb,
        expectedUnit: "lb",
        roundingMode: "tenth",
        roundingInstruction: "Round to the nearest tenth.",
        tolerance: 0.1,
        hints: [
          "Recall the conversion factor: 1 kg = 2.2 lb.",
          "To convert kilograms to pounds, multiply the weight in kilograms by 2.2.",
          `Calculate: ${kg} × 2.2.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Weight Conversion",
            formula: "Kilograms × 2.2 = Pounds",
            calculation: `${kg} kg × 2.2 = ${lb} lb`,
            result: `${lb} lb`,
          },
        ],
        rawVariables: { kg, lb },
      };
    },
  },
  {
    id: "conv-hours-to-mins",
    category: "conversions",
    subtype: "hours-to-mins",
    difficulty: "beginner",
    title: "Hours & Minutes to Total Minutes Conversion",
    clinicalContext: "Adult IV Infusion Planning",
    generate: (rng) => {
      const hours = randInt(2, 8, rng);
      const mins = pick([15, 20, 30, 45], rng);
      const totalMins = hours * 60 + mins;
      return {
        scenario: `An IV infusion order specifies a duration of ${hours} hours and ${mins} minutes.`,
        orderText: `Infusion duration: ${hours} hr ${mins} min`,
        prompt: `Convert ${hours} hr ${mins} min into total minutes.`,
        expectedAnswer: totalMins,
        expectedUnit: "minutes",
        roundingMode: "whole",
        roundingInstruction: "State exact whole number of minutes.",
        tolerance: 0.01,
        hints: [
          "Recall that 1 hour = 60 minutes.",
          `First convert ${hours} hours to minutes by multiplying by 60, then add ${mins} minutes.`,
          `Calculate: (${hours} × 60) + ${mins}.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Hours to Minutes",
            formula: "Hours × 60",
            calculation: `${hours} hr × 60 = ${hours * 60} min`,
            result: `${hours * 60} min`,
          },
          {
            stepNumber: 2,
            title: "Add Remaining Minutes",
            formula: "Minutes + Additional Minutes",
            calculation: `${hours * 60} min + ${mins} min = ${totalMins} min`,
            result: `${totalMins} min`,
          },
        ],
        rawVariables: { hours, mins, totalMins },
      };
    },
  },
  {
    id: "conv-mins-to-hours",
    category: "conversions",
    subtype: "mins-to-hours",
    difficulty: "intermediate",
    title: "Minutes to Decimal Hours Conversion",
    clinicalContext: "Adult IV Pump Rate Programming",
    generate: (rng) => {
      const mins = pick([30, 45, 90, 120, 150, 180, 240], rng);
      const hours = mins / 60;
      return {
        scenario: `An IV piggyback antibiotic is scheduled to infuse over ${mins} minutes.`,
        orderText: `Infuse over ${mins} minutes`,
        prompt: `Convert ${mins} minutes into hours (for pump rate calculation).`,
        expectedAnswer: hours,
        expectedUnit: "hours",
        roundingMode: "tenth",
        roundingInstruction: "State exact decimal value or round to nearest tenth.",
        tolerance: 0.01,
        hints: [
          "Recall that 60 minutes = 1 hour.",
          "To convert minutes into hours, divide the minutes by 60.",
          `Calculate: ${mins} ÷ 60.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Time Conversion",
            formula: "Minutes ÷ 60 = Hours",
            calculation: `${mins} min ÷ 60 = ${hours} hr`,
            result: `${hours} hr`,
          },
        ],
        rawVariables: { mins, hours },
      };
    },
  },
];
