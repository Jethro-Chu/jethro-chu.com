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
  {
    id: "conv-mcg-to-mg-fractional",
    category: "conversions",
    subtype: "mcg-to-mg",
    difficulty: "intermediate",
    title: "Fractional Micrograms to Milligrams Conversion",
    clinicalContext: "Adult Thyroid / Cardiac Medication Order",
    generate: (rng) => {
      const mcg = pick([25, 37.5, 75, 88, 112, 137, 175, 225], rng);
      const mg = mcg / 1000;
      return {
        scenario: `An adult inpatient is prescribed levothyroxine ${mcg} mcg daily. The electronic MAR requires documenting the dose in milligrams.`,
        orderText: `Levothyroxine ${mcg} mcg PO daily`,
        prompt: `Convert ${mcg} mcg to mg.`,
        expectedAnswer: mg,
        expectedUnit: "mg",
        roundingMode: "hundredth",
        roundingInstruction: "State exact decimal value or round to nearest hundredth.",
        tolerance: 0.001,
        hints: [
          "Recall that 1 milligram (mg) = 1,000 micrograms (mcg).",
          "To convert from micrograms to milligrams, divide the dose by 1,000.",
          `Calculate: ${mcg} ÷ 1,000.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Micrograms to Milligrams",
            formula: "mcg ÷ 1,000 = mg",
            calculation: `${mcg} mcg ÷ 1,000 = ${mg} mg`,
            result: `${mg} mg`,
          },
        ],
        rawVariables: { mcg, mg },
      };
    },
  },
  {
    id: "conv-mg-to-mcg-small",
    category: "conversions",
    subtype: "mg-to-mcg",
    difficulty: "intermediate",
    title: "Small Decimal Milligrams to Micrograms",
    clinicalContext: "Adult ICU Fentanyl / Digoxin Dosing",
    generate: (rng) => {
      const mg = pick([0.025, 0.05, 0.075, 0.015, 0.035, 0.06], rng);
      const mcg = Math.round(mg * 1000 * 10) / 10;
      return {
        scenario: `A critical care physician orders an IV dose of ${mg} mg of a potent analgesic. The vial is supplied in micrograms.`,
        orderText: `${mg} mg IV push`,
        prompt: `Convert ${mg} mg to mcg.`,
        expectedAnswer: mcg,
        expectedUnit: "mcg",
        roundingMode: "tenth",
        roundingInstruction: "State exact decimal or whole number.",
        tolerance: 0.01,
        hints: [
          "Recall that 1 mg = 1,000 mcg.",
          "Multiply the milligram dose by 1,000 (move the decimal point 3 places right).",
          `Calculate: ${mg} × 1,000.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Milligrams to Micrograms",
            formula: "mg × 1,000 = mcg",
            calculation: `${mg} mg × 1,000 = ${mcg} mcg`,
            result: `${mcg} mcg`,
          },
        ],
        rawVariables: { mg, mcg },
      };
    },
  },
  {
    id: "conv-g-to-mcg-direct",
    category: "conversions",
    subtype: "g-to-mcg",
    difficulty: "intermediate",
    title: "Grams to Micrograms Direct Metric Conversion",
    clinicalContext: "Adult Inpatient Compounding Verification",
    generate: (rng) => {
      const grams = pick([0.001, 0.002, 0.005, 0.0005, 0.0015], rng);
      const mcg = grams * 1000000;
      return {
        scenario: `A bulk medication order lists active substance content as ${grams} g. The nurse needs to calculate the dose in micrograms.`,
        orderText: `Active drug: ${grams} g`,
        prompt: `Convert ${grams} g to mcg.`,
        expectedAnswer: mcg,
        expectedUnit: "mcg",
        roundingMode: "exact",
        roundingInstruction: "State exact whole number.",
        tolerance: 0.1,
        hints: [
          "Recall that 1 g = 1,000 mg and 1 mg = 1,000 mcg, so 1 g = 1,000,000 mcg.",
          "To convert grams directly to micrograms, multiply by 1,000,000.",
          `Calculate: ${grams} × 1,000,000.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Grams to Micrograms",
            formula: "Grams × 1,000,000 = Micrograms",
            calculation: `${grams} g × 1,000,000 = ${mcg} mcg`,
            result: `${mcg} mcg`,
          },
        ],
        rawVariables: { grams, mcg },
      };
    },
  },
  {
    id: "conv-mcg-to-g-direct",
    category: "conversions",
    subtype: "mcg-to-g",
    difficulty: "intermediate",
    title: "Micrograms to Grams Direct Conversion",
    clinicalContext: "Adult Inpatient Pharmacy Verification",
    generate: (rng) => {
      const mcg = pick([500000, 750000, 1000000, 1500000, 2000000, 250000], rng);
      const grams = mcg / 1000000;
      return {
        scenario: `A pharmacy batch label specifies a total content of ${mcg.toLocaleString()} mcg of an antibiotic.`,
        orderText: `Total batch content: ${mcg.toLocaleString()} mcg`,
        prompt: `Convert ${mcg.toLocaleString()} mcg to grams (g).`,
        expectedAnswer: grams,
        expectedUnit: "g",
        roundingMode: "hundredth",
        roundingInstruction: "State exact decimal value.",
        tolerance: 0.001,
        hints: [
          "Recall that 1,000,000 mcg = 1 g.",
          "Divide micrograms by 1,000,000 (move the decimal point 6 places left).",
          `Calculate: ${mcg} ÷ 1,000,000.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Micrograms to Grams",
            formula: "mcg ÷ 1,000,000 = Grams",
            calculation: `${mcg} mcg ÷ 1,000,000 = ${grams} g`,
            result: `${grams} g`,
          },
        ],
        rawVariables: { mcg, grams },
      };
    },
  },
  {
    id: "conv-units-min-to-units-hr",
    category: "conversions",
    subtype: "units-min-to-hr",
    difficulty: "intermediate",
    title: "Units Per Minute to Units Per Hour",
    clinicalContext: "Adult Critical Care Vasopressin Titration",
    generate: (rng) => {
      const unitsMin = pick([0.01, 0.02, 0.03, 0.04, 0.06, 0.08], rng);
      const unitsHr = Math.round(unitsMin * 60 * 100) / 100;
      return {
        scenario: `A continuous vasopressin infusion is prescribed at ${unitsMin} units/min for refractory septic shock.`,
        orderText: `Vasopressin continuous IV infusion at ${unitsMin} units/min`,
        prompt: `Calculate the dosage rate in units/hr.`,
        expectedAnswer: unitsHr,
        expectedUnit: "units/hr",
        roundingMode: "tenth",
        roundingInstruction: "State exact or round to nearest tenth.",
        tolerance: 0.01,
        hints: [
          "Recall that 1 hour contains 60 minutes.",
          "To find units per hour from units per minute, multiply the minute dose by 60.",
          `Calculate: ${unitsMin} × 60.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Minute Units to Hourly Units",
            formula: "units/min × 60 = units/hr",
            calculation: `${unitsMin} units/min × 60 = ${unitsHr} units/hr`,
            result: `${unitsHr} units/hr`,
          },
        ],
        rawVariables: { unitsMin, unitsHr },
      };
    },
  },
  {
    id: "conv-units-hr-to-units-min",
    category: "conversions",
    subtype: "units-hr-to-min",
    difficulty: "intermediate",
    title: "Units Per Hour to Units Per Minute (Reverse)",
    clinicalContext: "Adult Critical Care Infusion Audit",
    generate: (rng) => {
      const unitsHr = pick([1.2, 1.8, 2.4, 3.6, 4.8], rng);
      const unitsMin = Math.round((unitsHr / 60) * 100) / 100;
      return {
        scenario: `An audit reveals a patient is receiving a continuous hormone infusion at ${unitsHr} units/hr.`,
        orderText: `Infusion running at ${unitsHr} units/hr`,
        prompt: `Convert this delivery rate to units/min.`,
        expectedAnswer: unitsMin,
        expectedUnit: "units/min",
        roundingMode: "hundredth",
        roundingInstruction: "Round to nearest hundredth.",
        tolerance: 0.01,
        hints: [
          "Recall that 1 hour = 60 minutes.",
          "To convert hourly units to minute units, divide the hourly units by 60.",
          `Calculate: ${unitsHr} ÷ 60.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Hourly Units to Minute Units",
            formula: "units/hr ÷ 60 = units/min",
            calculation: `${unitsHr} units/hr ÷ 60 = ${unitsMin} units/min`,
            result: `${unitsMin} units/min`,
          },
        ],
        rawVariables: { unitsHr, unitsMin },
      };
    },
  },
  {
    id: "conv-mcg-min-to-mcg-hr",
    category: "conversions",
    subtype: "mcg-min-to-hr",
    difficulty: "intermediate",
    title: "Micrograms Per Minute to Micrograms Per Hour",
    clinicalContext: "Adult CCU Nitroglycerin Infusion Calculation",
    generate: (rng) => {
      const mcgMin = pick([10, 15, 20, 25, 30, 40, 50, 75, 100], rng);
      const mcgHr = mcgMin * 60;
      return {
        scenario: `An adult coronary care patient is receiving IV nitroglycerin at ${mcgMin} mcg/min.`,
        orderText: `Nitroglycerin IV at ${mcgMin} mcg/min`,
        prompt: `Calculate the delivery rate in mcg/hr.`,
        expectedAnswer: mcgHr,
        expectedUnit: "mcg/hr",
        roundingMode: "whole",
        roundingInstruction: "State whole number.",
        tolerance: 0.1,
        hints: [
          "There are 60 minutes in an hour.",
          "Multiply the minute rate in mcg/min by 60.",
          `Calculate: ${mcgMin} × 60.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert to Hourly Micrograms",
            formula: "mcg/min × 60 = mcg/hr",
            calculation: `${mcgMin} mcg/min × 60 = ${mcgHr} mcg/hr`,
            result: `${mcgHr} mcg/hr`,
          },
        ],
        rawVariables: { mcgMin, mcgHr },
      };
    },
  },
  {
    id: "conv-mcg-hr-to-mcg-min",
    category: "conversions",
    subtype: "mcg-hr-to-min",
    difficulty: "intermediate",
    title: "Micrograms Per Hour to Micrograms Per Minute (Reverse)",
    clinicalContext: "Adult Step-Down Infusion Rate Verification",
    generate: (rng) => {
      const mcgMin = pick([10, 15, 20, 25, 30, 40, 50], rng);
      const mcgHr = mcgMin * 60;
      return {
        scenario: `A continuous medication drip is running at ${mcgHr} mcg/hr. The nurse needs to confirm the minute delivery rate.`,
        orderText: `Infusion delivering ${mcgHr} mcg/hr`,
        prompt: `Convert ${mcgHr} mcg/hr to mcg/min.`,
        expectedAnswer: mcgMin,
        expectedUnit: "mcg/min",
        roundingMode: "whole",
        roundingInstruction: "State whole number.",
        tolerance: 0.1,
        hints: [
          "There are 60 minutes in 1 hour.",
          "Divide the hourly microgram delivery by 60.",
          `Calculate: ${mcgHr} ÷ 60.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Hourly Micrograms to Minute Micrograms",
            formula: "mcg/hr ÷ 60 = mcg/min",
            calculation: `${mcgHr} mcg/hr ÷ 60 = ${mcgMin} mcg/min`,
            result: `${mcgMin} mcg/min`,
          },
        ],
        rawVariables: { mcgHr, mcgMin },
      };
    },
  },
  {
    id: "conv-mg-hr-to-mg-day",
    category: "conversions",
    subtype: "mg-hr-to-day",
    difficulty: "intermediate",
    title: "Milligrams Per Hour to Total 24-Hour Daily Dose",
    clinicalContext: "Adult Med-Surg Continuous Diuretic Infusion",
    generate: (rng) => {
      const mgHr = pick([2.5, 5, 7.5, 10, 12.5, 15, 20], rng);
      const mgDay = mgHr * 24;
      return {
        scenario: `An adult heart failure patient is on a continuous IV furosemide infusion at ${mgHr} mg/hr.`,
        orderText: `Furosemide IV continuous infusion at ${mgHr} mg/hr`,
        prompt: `Calculate the total milligrams of furosemide the patient will receive in 24 hours.`,
        expectedAnswer: mgDay,
        expectedUnit: "mg",
        roundingMode: "tenth",
        roundingInstruction: "State exact whole number or decimal.",
        tolerance: 0.1,
        hints: [
          "There are 24 hours in a full day.",
          "Multiply the hourly dose in mg/hr by 24 hours.",
          `Calculate: ${mgHr} × 24.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Total Daily Dose",
            formula: "mg/hr × 24 hr = Total mg/day",
            calculation: `${mgHr} mg/hr × 24 hr = ${mgDay} mg`,
            result: `${mgDay} mg`,
          },
        ],
        rawVariables: { mgHr, mgDay },
      };
    },
  },
  {
    id: "conv-household-tsp-to-ml",
    category: "conversions",
    subtype: "household-to-metric",
    difficulty: "beginner",
    title: "Teaspoons (tsp) to Milliliters (mL) Conversion",
    clinicalContext: "Adult Discharge Medication Education",
    generate: (rng) => {
      const tsp = pick([1, 1.5, 2, 2.5, 3, 4], rng);
      const ml = tsp * 5;
      return {
        scenario: `An adult patient preparing for discharge is prescribed an oral liquid medication at home in teaspoons (${tsp} tsp). The oral measuring syringe is marked in milliliters.`,
        orderText: `Take ${tsp} tsp PO every 6 hours`,
        prompt: `Convert ${tsp} tsp to milliliters (mL).`,
        expectedAnswer: ml,
        expectedUnit: "mL",
        roundingMode: "tenth",
        roundingInstruction: "State exact number.",
        tolerance: 0.05,
        hints: [
          "Recall the standard household-to-metric conversion: 1 teaspoon (tsp) = 5 mL.",
          "Multiply the number of teaspoons by 5.",
          `Calculate: ${tsp} × 5.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Household to Metric Conversion",
            formula: "tsp × 5 mL/tsp = mL",
            calculation: `${tsp} tsp × 5 mL/tsp = ${ml} mL`,
            result: `${ml} mL`,
          },
        ],
        rawVariables: { tsp, ml },
      };
    },
  },
  {
    id: "conv-household-tbsp-to-ml",
    category: "conversions",
    subtype: "household-to-metric",
    difficulty: "beginner",
    title: "Tablespoons (tbsp) to Milliliters (mL) Conversion",
    clinicalContext: "Adult Inpatient Oral Liquid Administration",
    generate: (rng) => {
      const tbsp = pick([1, 1.5, 2, 2.5, 3], rng);
      const ml = tbsp * 15;
      return {
        scenario: `A patient is ordered an oral antacid suspension of ${tbsp} tbsp. The medication cup is calibrated in milliliters.`,
        orderText: `${tbsp} tbsp PO PRN`,
        prompt: `Convert ${tbsp} tbsp to milliliters (mL).`,
        expectedAnswer: ml,
        expectedUnit: "mL",
        roundingMode: "tenth",
        roundingInstruction: "State exact number.",
        tolerance: 0.05,
        hints: [
          "Recall the standard household-to-metric conversion: 1 tablespoon (tbsp) = 15 mL (or 3 tsp).",
          "Multiply the number of tablespoons by 15.",
          `Calculate: ${tbsp} × 15.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Household to Metric Conversion",
            formula: "tbsp × 15 mL/tbsp = mL",
            calculation: `${tbsp} tbsp × 15 mL/tbsp = ${ml} mL`,
            result: `${ml} mL`,
          },
        ],
        rawVariables: { tbsp, ml },
      };
    },
  },
  {
    id: "conv-household-oz-to-ml",
    category: "conversions",
    subtype: "household-to-metric",
    difficulty: "beginner",
    title: "Fluid Ounces (fl oz) to Milliliters (mL) Conversion",
    clinicalContext: "Adult Intake & Output Assessment",
    generate: (rng) => {
      const oz = pick([2, 4, 6, 8, 10, 12, 16], rng);
      const ml = oz * 30;
      return {
        scenario: `During intake and output charting, an adult patient drinks ${oz} fl oz of oral fluids.`,
        orderText: `Oral intake: ${oz} fl oz`,
        prompt: `Convert ${oz} fl oz to milliliters (mL).`,
        expectedAnswer: ml,
        expectedUnit: "mL",
        roundingMode: "whole",
        roundingInstruction: "State exact whole number.",
        tolerance: 0.1,
        hints: [
          "Recall the standard clinical conversion: 1 fluid ounce (fl oz) = 30 mL.",
          "Multiply the number of fluid ounces by 30.",
          `Calculate: ${oz} × 30.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Volume Conversion",
            formula: "fl oz × 30 mL/fl oz = mL",
            calculation: `${oz} fl oz × 30 mL = ${ml} mL`,
            result: `${ml} mL`,
          },
        ],
        rawVariables: { oz, ml },
      };
    },
  },
];
