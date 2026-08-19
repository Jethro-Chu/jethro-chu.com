import type { QuestionTemplate } from "../types.ts";
import { pick } from "./helpers.ts";

export const gravityDripsTemplates: QuestionTemplate[] = [
  {
    id: "gravity-15gtt-hours-minutes",
    category: "gravity-drips",
    subtype: "macrodrip-15",
    difficulty: "intermediate",
    title: "Gravity Drip Rate with Hours and Minutes (15 gtt/mL)",
    clinicalContext: "Adult Med-Surg Primary Infusion",
    generate: (rng) => {
      const data = pick([
        { volMl: 850, hrs: 7, mins: 30, totalMins: 450, dropFactor: 15, raw: 28.33, ans: 28 },
        { volMl: 750, hrs: 5, mins: 30, totalMins: 330, dropFactor: 15, raw: 34.09, ans: 34 },
        { volMl: 1000, hrs: 6, mins: 45, totalMins: 405, dropFactor: 15, raw: 37.04, ans: 37 },
        { volMl: 500, hrs: 3, mins: 45, totalMins: 225, dropFactor: 15, raw: 33.33, ans: 33 },
      ], rng);

      return {
        scenario: `An adult inpatient is receiving IV fluids by gravity in an area without an electronic pump.`,
        orderText: `Infuse ${data.volMl} mL Lactated Ringer's IV over ${data.hrs} hours ${data.mins} minutes`,
        availableText: `Macrodrip IV tubing with drop factor of ${data.dropFactor} gtt/mL`,
        prompt: `Calculate the gravity infusion rate in drops per minute (gtt/min).`,
        correctAnswer: data.ans,
        answerUnit: "gtt/min",
        answerPrecision: 0,
        roundingInstruction: "Round to the nearest whole drop.",
        hints: [
          "Use the gravity formula: (Volume in mL × Drop Factor in gtt/mL) ÷ Time in minutes.",
          `Convert time to total minutes: (${data.hrs} hr × 60) + ${data.mins} min = ${data.totalMins} minutes.`,
          `Calculate: (${data.volMl} × ${data.dropFactor}) ÷ ${data.totalMins} = ${data.raw} → round to whole drop.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Total Time to Minutes",
            formula: "(Hours × 60) + Minutes",
            calculation: `(${data.hrs} hr × 60) + ${data.mins} min = ${data.totalMins} min`,
            result: `${data.totalMins} min`,
          },
          {
            stepNumber: 2,
            title: "Calculate Drops per Minute",
            formula: "(Volume × Drop Factor) ÷ Total Minutes",
            calculation: `(${data.volMl} mL × ${data.dropFactor} gtt/mL) ÷ ${data.totalMins} min = ${data.raw} gtt/min`,
            result: `${data.ans} gtt/min (rounded to nearest whole drop)`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "gravity-10gtt-macrodrip",
    category: "gravity-drips",
    subtype: "macrodrip-10",
    difficulty: "beginner",
    title: "Gravity Infusion Rate (10 gtt/mL)",
    clinicalContext: "Adult Inpatient Hydration by Gravity",
    generate: (rng) => {
      const data = pick([
        { volMl: 1000, hrs: 8, totalMins: 480, dropFactor: 10, raw: 20.83, ans: 21 },
        { volMl: 1000, hrs: 10, totalMins: 600, dropFactor: 10, raw: 16.67, ans: 17 },
        { volMl: 500, hrs: 4, totalMins: 240, dropFactor: 10, raw: 20.83, ans: 21 },
        { volMl: 500, hrs: 5, totalMins: 300, dropFactor: 10, raw: 16.67, ans: 17 },
      ], rng);

      return {
        scenario: `A medical floor patient has an order for IV fluid maintenance via gravity tubing.`,
        orderText: `Infuse ${data.volMl} mL 0.9% Normal Saline over ${data.hrs} hours`,
        availableText: `Standard IV infusion set with drop factor of ${data.dropFactor} gtt/mL`,
        prompt: `Calculate the flow rate in gtt/min.`,
        correctAnswer: data.ans,
        answerUnit: "gtt/min",
        answerPrecision: 0,
        roundingInstruction: "Round to the nearest whole drop.",
        hints: [
          "Formula: (Total Volume in mL × Drop Factor) ÷ Total Time in minutes.",
          `Convert ${data.hrs} hours to minutes: ${data.hrs} × 60 = ${data.totalMins} minutes.`,
          `Calculate: (${data.volMl} × ${data.dropFactor}) ÷ ${data.totalMins}.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Hours to Minutes",
            formula: "Hours × 60",
            calculation: `${data.hrs} hr × 60 = ${data.totalMins} min`,
            result: `${data.totalMins} min`,
          },
          {
            stepNumber: 2,
            title: "Calculate gtt/min",
            formula: "(mL × gtt/mL) ÷ minutes",
            calculation: `(${data.volMl} mL × ${data.dropFactor} gtt/mL) ÷ ${data.totalMins} min = ${data.raw} gtt/min`,
            result: `${data.ans} gtt/min`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "gravity-20gtt-macrodrip",
    category: "gravity-drips",
    subtype: "macrodrip-20",
    difficulty: "beginner",
    title: "Gravity Infusion Rate (20 gtt/mL)",
    clinicalContext: "Adult Inpatient Fluid Replacement",
    generate: (rng) => {
      const data = pick([
        { volMl: 1000, hrs: 8, totalMins: 480, dropFactor: 20, raw: 41.67, ans: 42 },
        { volMl: 1000, hrs: 10, totalMins: 600, dropFactor: 20, raw: 33.33, ans: 33 },
        { volMl: 500, hrs: 4, totalMins: 240, dropFactor: 20, raw: 41.67, ans: 42 },
        { volMl: 250, hrs: 2, totalMins: 120, dropFactor: 20, raw: 41.67, ans: 42 },
      ], rng);

      return {
        scenario: `The nurse is setting up an IV infusion using a 20 gtt/mL drop factor administration set.`,
        orderText: `Infuse ${data.volMl} mL D5W over ${data.hrs} hours`,
        availableText: `IV tubing with drop factor 20 gtt/mL`,
        prompt: `How many drops per minute (gtt/min) should the nurse count in the drip chamber?`,
        correctAnswer: data.ans,
        answerUnit: "gtt/min",
        answerPrecision: 0,
        roundingInstruction: "Round to the nearest whole drop.",
        hints: [
          "Formula: (Volume in mL × Drop Factor) ÷ Time in minutes.",
          `Convert ${data.hrs} hours to minutes: ${data.hrs} × 60 = ${data.totalMins} min.`,
          `Calculate: (${data.volMl} × ${data.dropFactor}) ÷ ${data.totalMins}.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Time to Minutes",
            formula: "Hours × 60",
            calculation: `${data.hrs} hr × 60 = ${data.totalMins} min`,
            result: `${data.totalMins} min`,
          },
          {
            stepNumber: 2,
            title: "Calculate Drip Rate",
            formula: "(mL × Drop Factor) ÷ Minutes",
            calculation: `(${data.volMl} mL × ${data.dropFactor} gtt/mL) ÷ ${data.totalMins} min = ${data.raw} gtt/min`,
            result: `${data.ans} gtt/min`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "gravity-60gtt-microdrip",
    category: "gravity-drips",
    subtype: "microdrip-60",
    difficulty: "beginner",
    title: "Microdrip Tubing Rate (60 gtt/mL)",
    clinicalContext: "Adult Med-Surg Controlled Fluid Infusion",
    generate: (rng) => {
      const data = pick([
        { volMl: 100, hrs: 1, totalMins: 60, rateMlHr: 100, dropFactor: 60, ans: 100 },
        { volMl: 125, hrs: 1, totalMins: 60, rateMlHr: 125, dropFactor: 60, ans: 125 },
        { volMl: 500, hrs: 8, totalMins: 480, rateMlHr: 62.5, dropFactor: 60, ans: 63 },
        { volMl: 250, hrs: 4, totalMins: 240, rateMlHr: 62.5, dropFactor: 60, ans: 63 },
        { volMl: 1000, hrs: 12, totalMins: 720, rateMlHr: 83.3, dropFactor: 60, ans: 83 },
      ], rng);

      return {
        scenario: `The nurse is using microdrip tubing (60 gtt/mL) for precise gravity flow rate control.`,
        orderText: `Infuse ${data.volMl} mL 0.45% NS IV over ${data.hrs} hour${data.hrs > 1 ? "s" : ""}`,
        availableText: `Microdrip administration set (60 gtt/mL)`,
        prompt: `Calculate the microdrip rate in gtt/min.`,
        correctAnswer: data.ans,
        answerUnit: "gtt/min",
        answerPrecision: 0,
        roundingInstruction: "Round to nearest whole drop (Note: with 60 gtt/mL tubing, gtt/min equals mL/hr).",
        hints: [
          "Clinical tip: When using 60 gtt/mL (microdrip) tubing, the flow rate in gtt/min is equal to the hourly rate in mL/hr!",
          `Formula: (${data.volMl} mL × 60 gtt/mL) ÷ ${data.totalMins} min.`,
          `Calculate: ${data.volMl} ÷ ${data.hrs}.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Microdrip Calculation",
            formula: "(mL × 60) ÷ (Hours × 60)",
            explanation: "Since 60 in numerator and denominator cancel, gtt/min = mL/hr.",
            calculation: `(${data.volMl} mL × 60) ÷ ${data.totalMins} min = ${data.ans} gtt/min`,
            result: `${data.ans} gtt/min`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "gravity-ivpb-30min-15gtt",
    category: "gravity-drips",
    subtype: "ivpb-gravity",
    difficulty: "beginner",
    title: "IVPB by Gravity (30 Minutes, 15 gtt/mL)",
    clinicalContext: "Adult Inpatient Antibiotic Infusion",
    generate: (rng) => {
      const data = pick([
        { med: "Cefazolin 1 g", volMl: 50, mins: 30, dropFactor: 15, raw: 25, ans: 25 },
        { med: "Cefazolin 2 g", volMl: 100, mins: 30, dropFactor: 15, raw: 50, ans: 50 },
        { med: "Ampicillin 1 g", volMl: 50, mins: 30, dropFactor: 10, raw: 16.67, ans: 17 },
        { med: "Metronidazole 500 mg", volMl: 100, mins: 30, dropFactor: 20, raw: 66.67, ans: 67 },
      ], rng);

      return {
        scenario: `An adult inpatient has an order for an IVPB antibiotic to be infused via gravity.`,
        orderText: `${data.med} in ${data.volMl} mL D5W IVPB over ${data.mins} minutes`,
        availableText: `Secondary tubing with drop factor ${data.dropFactor} gtt/mL`,
        prompt: `Calculate the flow rate in gtt/min.`,
        correctAnswer: data.ans,
        answerUnit: "gtt/min",
        answerPrecision: 0,
        roundingInstruction: "Round to nearest whole drop.",
        hints: [
          "Formula: (Volume in mL × Drop Factor) ÷ Time in minutes.",
          `Note that infusion time is already in minutes (${data.mins} min).`,
          `Calculate: (${data.volMl} mL × ${data.dropFactor} gtt/mL) ÷ ${data.mins} min.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate IVPB Drip Rate",
            formula: "(mL × Drop Factor) ÷ Minutes",
            calculation: `(${data.volMl} mL × ${data.dropFactor} gtt/mL) ÷ ${data.mins} min = ${data.ans} gtt/min`,
            result: `${data.ans} gtt/min`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "gravity-ivpb-60min-10gtt",
    category: "gravity-drips",
    subtype: "ivpb-gravity",
    difficulty: "beginner",
    title: "IVPB by Gravity (60 Minutes, 10 gtt/mL)",
    clinicalContext: "Adult Med-Surg IVPB Administration",
    generate: (rng) => {
      const data = pick([
        { med: "Ceftriaxone 1 g", volMl: 100, mins: 60, dropFactor: 10, raw: 16.67, ans: 17 },
        { med: "Levofloxacin 500 mg", volMl: 100, mins: 60, dropFactor: 15, raw: 25, ans: 25 },
        { med: "Azithromycin 500 mg", volMl: 250, mins: 60, dropFactor: 15, raw: 62.5, ans: 63 },
        { med: "Piperacillin/Tazobactam 3.375 g", volMl: 100, mins: 60, dropFactor: 20, raw: 33.33, ans: 33 },
      ], rng);

      return {
        scenario: `The nurse is preparing to infuse an IVPB antibiotic over 1 hour via gravity.`,
        orderText: `${data.med} in ${data.volMl} mL NS IVPB over 1 hour (${data.mins} minutes)`,
        availableText: `IV tubing with drop factor ${data.dropFactor} gtt/mL`,
        prompt: `Calculate the drip rate in gtt/min.`,
        correctAnswer: data.ans,
        answerUnit: "gtt/min",
        answerPrecision: 0,
        roundingInstruction: "Round to nearest whole drop.",
        hints: [
          "Formula: (Volume in mL × Drop Factor) ÷ Time in minutes.",
          `Time is 1 hour = 60 minutes.`,
          `Calculate: (${data.volMl} × ${data.dropFactor}) ÷ ${data.mins}.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Secondary Drip Rate",
            formula: "(mL × Drop Factor) ÷ Minutes",
            calculation: `(${data.volMl} mL × ${data.dropFactor} gtt/mL) ÷ ${data.mins} min = ${data.raw} gtt/min`,
            result: `${data.ans} gtt/min`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "gravity-blood-10gtt-ytubing",
    category: "gravity-drips",
    subtype: "blood-gravity",
    difficulty: "intermediate",
    title: "PRBC Blood Transfusion via Gravity Y-Tubing (10 gtt/mL)",
    clinicalContext: "Adult Inpatient Blood Transfusion Protocol",
    generate: (rng) => {
      const data = pick([
        { unitVol: 300, hrs: 3, totalMins: 180, dropFactor: 10, raw: 16.67, ans: 17 },
        { unitVol: 350, hrs: 3.5, totalMins: 210, dropFactor: 10, raw: 16.67, ans: 17 },
        { unitVol: 250, hrs: 2, totalMins: 120, dropFactor: 10, raw: 20.83, ans: 21 },
        { unitVol: 320, hrs: 4, totalMins: 240, dropFactor: 10, raw: 13.33, ans: 13 },
      ], rng);

      return {
        scenario: `A unit of Packed Red Blood Cells is ordered to infuse via standard blood Y-tubing (drop factor 10 gtt/mL) by gravity.`,
        orderText: `Transfuse 1 unit PRBCs (${data.unitVol} mL) IV over ${data.hrs} hours`,
        availableText: `Blood administration Y-tubing with 10 gtt/mL filter drop factor`,
        prompt: `Calculate the blood drip rate in gtt/min.`,
        correctAnswer: data.ans,
        answerUnit: "gtt/min",
        answerPrecision: 0,
        roundingInstruction: "Round to nearest whole drop.",
        hints: [
          `Convert ${data.hrs} hours to minutes: ${data.hrs} × 60 = ${data.totalMins} minutes.`,
          "Apply formula: (Volume × Drop Factor) ÷ Total Minutes.",
          `Calculate: (${data.unitVol} × ${data.dropFactor}) ÷ ${data.totalMins}.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Hours to Minutes",
            formula: "Hours × 60",
            calculation: `${data.hrs} hr × 60 = ${data.totalMins} min`,
            result: `${data.totalMins} min`,
          },
          {
            stepNumber: 2,
            title: "Calculate Blood Flow Rate",
            formula: "(mL × Drop Factor) ÷ Minutes",
            calculation: `(${data.unitVol} mL × ${data.dropFactor} gtt/mL) ÷ ${data.totalMins} min = ${data.raw} gtt/min`,
            result: `${data.ans} gtt/min`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "gravity-post-op-bolus-20gtt",
    category: "gravity-drips",
    subtype: "macrodrip-20",
    difficulty: "beginner",
    title: "Post-Op Fluid Replacement via Gravity (20 gtt/mL)",
    clinicalContext: "Adult PACU Recovery Order",
    generate: (rng) => {
      const data = pick([
        { volMl: 500, hrs: 2, totalMins: 120, dropFactor: 20, raw: 83.33, ans: 83 },
        { volMl: 1000, hrs: 4, totalMins: 240, dropFactor: 20, raw: 83.33, ans: 83 },
        { volMl: 500, hrs: 3, totalMins: 180, dropFactor: 20, raw: 55.56, ans: 56 },
        { volMl: 250, hrs: 1, totalMins: 60, dropFactor: 20, raw: 83.33, ans: 83 },
      ], rng);

      return {
        scenario: `A post-operative adult patient is ordered an IV fluid replacement running over ${data.hrs} hour${data.hrs > 1 ? "s" : ""}.`,
        orderText: `Infuse ${data.volMl} mL 0.9% Normal Saline over ${data.hrs} hour${data.hrs > 1 ? "s" : ""}`,
        availableText: `Tubing drop factor: ${data.dropFactor} gtt/mL`,
        prompt: `Calculate the drip rate in gtt/min.`,
        correctAnswer: data.ans,
        answerUnit: "gtt/min",
        answerPrecision: 0,
        roundingInstruction: "Round to nearest whole drop.",
        hints: [
          `Convert ${data.hrs} hr to ${data.totalMins} minutes.`,
          "Use formula: (Volume × Drop Factor) ÷ Minutes.",
          `Calculate: (${data.volMl} × ${data.dropFactor}) ÷ ${data.totalMins}.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Time",
            formula: "Hours × 60",
            calculation: `${data.hrs} hr × 60 = ${data.totalMins} min`,
            result: `${data.totalMins} min`,
          },
          {
            stepNumber: 2,
            title: "Calculate Flow Rate",
            formula: "(mL × Drop Factor) ÷ Minutes",
            calculation: `(${data.volMl} mL × ${data.dropFactor} gtt/mL) ÷ ${data.totalMins} min = ${data.raw} gtt/min`,
            result: `${data.ans} gtt/min`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "gravity-microdrip-90min",
    category: "gravity-drips",
    subtype: "microdrip-60",
    difficulty: "intermediate",
    title: "Microdrip 90-Minute Infusion (60 gtt/mL)",
    clinicalContext: "Adult Inpatient Controlled Rate Infusion",
    generate: (rng) => {
      const data = pick([
        { volMl: 150, mins: 90, dropFactor: 60, raw: 100, ans: 100 },
        { volMl: 225, mins: 90, dropFactor: 60, raw: 150, ans: 150 },
        { volMl: 120, mins: 90, dropFactor: 60, raw: 80, ans: 80 },
        { volMl: 75, mins: 90, dropFactor: 60, raw: 50, ans: 50 },
      ], rng);

      return {
        scenario: `A medication in ${data.volMl} mL is ordered over 90 minutes using 60 gtt/mL microdrip tubing.`,
        orderText: `Infuse ${data.volMl} mL IVPB over 90 minutes`,
        availableText: `Microdrip tubing (${data.dropFactor} gtt/mL)`,
        prompt: `Calculate the drip rate in gtt/min.`,
        correctAnswer: data.ans,
        answerUnit: "gtt/min",
        answerPrecision: 0,
        roundingInstruction: "Round to nearest whole drop.",
        hints: [
          "Formula: (Volume in mL × Drop Factor) ÷ Time in minutes.",
          `Note that microdrip factor is 60 gtt/mL and time is 90 min.`,
          `Calculate: (${data.volMl} × 60) ÷ 90.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Flow Rate",
            formula: "(mL × Drop Factor) ÷ Minutes",
            calculation: `(${data.volMl} mL × ${data.dropFactor} gtt/mL) ÷ ${data.mins} min = ${data.raw} gtt/min`,
            result: `${data.ans} gtt/min`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "gravity-titration-check-15gtt",
    category: "gravity-drips",
    subtype: "macrodrip-15",
    difficulty: "beginner",
    title: "15 gtt/mL Standard Saline Gravity Check",
    clinicalContext: "Adult Step-Down Hydration",
    generate: (rng) => {
      const data = pick([
        { volMl: 1000, hrs: 12, totalMins: 720, dropFactor: 15, raw: 20.83, ans: 21 },
        { volMl: 1000, hrs: 10, totalMins: 600, dropFactor: 15, raw: 25, ans: 25 },
        { volMl: 500, hrs: 6, totalMins: 360, dropFactor: 15, raw: 20.83, ans: 21 },
        { volMl: 250, hrs: 3, totalMins: 180, dropFactor: 15, raw: 20.83, ans: 21 },
      ], rng);

      return {
        scenario: `An adult patient on a step-down unit is receiving maintenance hydration by gravity with a 15 gtt/mL drip set.`,
        orderText: `Infuse ${data.volMl} mL 0.9% NS IV over ${data.hrs} hours`,
        availableText: `15 gtt/mL IV infusion set`,
        prompt: `Calculate the rate in gtt/min.`,
        correctAnswer: data.ans,
        answerUnit: "gtt/min",
        answerPrecision: 0,
        roundingInstruction: "Round to nearest whole drop.",
        hints: [
          `Convert ${data.hrs} hours to ${data.totalMins} minutes.`,
          "Apply formula: (Volume × Drop Factor) ÷ Total Minutes.",
          `Calculate: (${data.volMl} × ${data.dropFactor}) ÷ ${data.totalMins}.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Hours to Minutes",
            formula: "Hours × 60",
            calculation: `${data.hrs} hr × 60 = ${data.totalMins} min`,
            result: `${data.totalMins} min`,
          },
          {
            stepNumber: 2,
            title: "Calculate Drip Rate",
            formula: "(mL × Drop Factor) ÷ Minutes",
            calculation: `(${data.volMl} mL × ${data.dropFactor} gtt/mL) ÷ ${data.totalMins} min = ${data.raw} gtt/min`,
            result: `${data.ans} gtt/min`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "gravity-reverse-gtt-to-volume",
    category: "gravity-drips",
    subtype: "macrodrip-15",
    difficulty: "intermediate",
    title: "Reverse Gravity Calculation: Volume Delivered from Drip Rate",
    clinicalContext: "Adult Inpatient Intake Charting Verification",
    generate: (rng) => {
      const data = pick([
        { gttMin: 25, dropFactor: 15, hrs: 2, totalMins: 120, vol: 200 },
        { gttMin: 30, dropFactor: 15, hrs: 3, totalMins: 180, vol: 360 },
        { gttMin: 20, dropFactor: 10, hrs: 2, totalMins: 120, vol: 240 },
        { gttMin: 50, dropFactor: 60, hrs: 2, totalMins: 120, vol: 100 },
      ], rng);

      return {
        scenario: `A nurse counts a gravity infusion dripping at exactly ${data.gttMin} gtt/min using ${data.dropFactor} gtt/mL tubing. The infusion ran continuously for ${data.hrs} hours.`,
        orderText: `Gravity drip at ${data.gttMin} gtt/min with ${data.dropFactor} gtt/mL set for ${data.hrs} hours`,
        prompt: `Calculate the total volume in mL delivered to the patient.`,
        correctAnswer: data.vol,
        answerUnit: "mL",
        answerPrecision: 0,
        roundingInstruction: "State exact whole number.",
        hints: [
          `Total drops delivered = Drip rate (gtt/min) × Total minutes.`,
          `Calculate total drops: ${data.gttMin} gtt/min × ${data.totalMins} min = ${data.gttMin * data.totalMins} drops.`,
          `Divide total drops by drop factor: (${data.gttMin} × ${data.totalMins}) ÷ ${data.dropFactor} = ${data.vol} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Hours to Total Minutes",
            formula: "Hours × 60",
            calculation: `${data.hrs} hr × 60 = ${data.totalMins} min`,
            result: `${data.totalMins} min`,
          },
          {
            stepNumber: 2,
            title: "Calculate Total Volume Delivered",
            formula: "(gtt/min × Minutes) ÷ Drop Factor",
            calculation: `(${data.gttMin} gtt/min × ${data.totalMins} min) ÷ ${data.dropFactor} gtt/mL = ${data.vol} mL`,
            result: `${data.vol} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "gravity-reverse-gtt-to-time",
    category: "gravity-drips",
    subtype: "macrodrip-10",
    difficulty: "intermediate",
    title: "Reverse Gravity Calculation: Remaining Infusion Time",
    clinicalContext: "Adult Inpatient Gravity Infusion Monitoring",
    generate: (rng) => {
      const data = pick([
        { volMl: 500, dropFactor: 10, gttMin: 25, totalMins: 200, hrs: 3.3 },
        { volMl: 250, dropFactor: 15, gttMin: 25, totalMins: 150, hrs: 2.5 },
        { volMl: 1000, dropFactor: 15, gttMin: 30, totalMins: 500, hrs: 8.3 },
        { volMl: 500, dropFactor: 20, gttMin: 40, totalMins: 250, hrs: 4.2 },
      ], rng);

      return {
        scenario: `A ${data.volMl} mL gravity IV bag is infusing at an observed rate of ${data.gttMin} gtt/min using ${data.dropFactor} gtt/mL tubing.`,
        orderText: `${data.volMl} mL running at ${data.gttMin} gtt/min (${data.dropFactor} gtt/mL set)`,
        prompt: `Calculate the total duration in minutes required for this bag to infuse completely.`,
        correctAnswer: data.totalMins,
        answerUnit: "minutes",
        answerPrecision: 0,
        roundingInstruction: "State exact whole number of minutes.",
        hints: [
          `Total drops in the bag = Volume in mL × Drop Factor = ${data.volMl} × ${data.dropFactor} = ${data.volMl * data.dropFactor} drops.`,
          `Divide total drops by drops per minute: (${data.volMl} × ${data.dropFactor}) ÷ ${data.gttMin}.`,
          `Calculate: ${data.volMl * data.dropFactor} ÷ ${data.gttMin} = ${data.totalMins} minutes.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Total Drops in Bag",
            formula: "Volume (mL) × Drop Factor (gtt/mL)",
            calculation: `${data.volMl} mL × ${data.dropFactor} gtt/mL = ${data.volMl * data.dropFactor} drops`,
            result: `${data.volMl * data.dropFactor} drops`,
          },
          {
            stepNumber: 2,
            title: "Calculate Total Infusion Minutes",
            formula: "Total Drops ÷ Drip Rate (gtt/min)",
            calculation: `${data.volMl * data.dropFactor} drops ÷ ${data.gttMin} gtt/min = ${data.totalMins} min`,
            result: `${data.totalMins} min`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "gravity-20gtt-ivpb-30min",
    category: "gravity-drips",
    subtype: "macrodrip-20",
    difficulty: "beginner",
    title: "20 gtt/mL IV Piggyback Drip Rate (30 Minutes)",
    clinicalContext: "Adult Med-Surg Antibiotic Administration",
    generate: (rng) => {
      const data = pick([
        { med: "Ampicillin-Sulbactam", volMl: 100, mins: 30, dropFactor: 20, raw: 66.67, ans: 67 },
        { med: "Cefuroxime", volMl: 50, mins: 30, dropFactor: 20, raw: 33.33, ans: 33 },
        { med: "Metronidazole", volMl: 100, mins: 30, dropFactor: 20, raw: 66.67, ans: 67 },
      ], rng);

      return {
        scenario: `An adult surgical patient is ordered ${data.med} in ${data.volMl} mL IVPB to infuse over ${data.mins} minutes using a 20 gtt/mL gravity infusion set.`,
        orderText: `${data.med} in ${data.volMl} mL IVPB over ${data.mins} minutes`,
        availableText: `Secondary gravity tubing with drop factor of ${data.dropFactor} gtt/mL`,
        prompt: `Calculate the gravity drip rate in gtt/min.`,
        correctAnswer: data.ans,
        answerUnit: "gtt/min",
        answerPrecision: 0,
        roundingInstruction: "Round to nearest whole drop.",
        hints: [
          "Apply formula: (Volume in mL × Drop Factor) ÷ Time in minutes.",
          `Calculate: (${data.volMl} × ${data.dropFactor}) ÷ ${data.mins}.`,
          `(${data.volMl} × 20) ÷ 30 = ${data.raw} → round to nearest whole drop.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Drops per Minute",
            formula: "(Volume × Drop Factor) ÷ Minutes",
            calculation: `(${data.volMl} mL × ${data.dropFactor} gtt/mL) ÷ ${data.mins} min = ${data.raw} gtt/min`,
            result: `${data.ans} gtt/min`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "gravity-20gtt-ivpb-45min",
    category: "gravity-drips",
    subtype: "macrodrip-20",
    difficulty: "intermediate",
    title: "20 gtt/mL IV Piggyback Drip Rate (45 Minutes)",
    clinicalContext: "Adult Inpatient Antibiotic Infusion",
    generate: (rng) => {
      const data = pick([
        { med: "Levofloxacin", volMl: 100, mins: 45, dropFactor: 20, raw: 44.44, ans: 44 },
        { med: "Azithromycin", volMl: 250, mins: 45, dropFactor: 20, raw: 111.11, ans: 111 },
        { med: "Cefepime", volMl: 100, mins: 45, dropFactor: 20, raw: 44.44, ans: 44 },
      ], rng);

      return {
        scenario: `An adult inpatient is prescribed ${data.med} in ${data.volMl} mL IVPB over ${data.mins} minutes using a 20 gtt/mL set.`,
        orderText: `${data.med} in ${data.volMl} mL IVPB over ${data.mins} minutes`,
        availableText: `20 gtt/mL gravity IV administration set`,
        prompt: `Calculate the drip rate in gtt/min.`,
        correctAnswer: data.ans,
        answerUnit: "gtt/min",
        answerPrecision: 0,
        roundingInstruction: "Round to nearest whole drop.",
        hints: [
          "Formula: (Volume × Drop Factor) ÷ Minutes.",
          `Calculate: (${data.volMl} × 20) ÷ 45.`,
          `Result is ${data.raw} → round to nearest whole drop.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Drip Rate",
            formula: "(mL × Drop Factor) ÷ Minutes",
            calculation: `(${data.volMl} mL × ${data.dropFactor} gtt/mL) ÷ ${data.mins} min = ${data.raw} gtt/min`,
            result: `${data.ans} gtt/min`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "gravity-10gtt-blood-gravity",
    category: "gravity-drips",
    subtype: "blood-10",
    difficulty: "intermediate",
    title: "Packed Red Blood Cells Gravity Drip Rate (10 gtt/mL)",
    clinicalContext: "Adult Inpatient Blood Transfusion Protocol",
    generate: (rng) => {
      const data = pick([
        { unitVol: 300, hrs: 3, totalMins: 180, dropFactor: 10, raw: 16.67, ans: 17 },
        { unitVol: 350, hrs: 3.5, totalMins: 210, dropFactor: 10, raw: 16.67, ans: 17 },
        { unitVol: 250, hrs: 2, totalMins: 120, dropFactor: 10, raw: 20.83, ans: 21 },
        { unitVol: 300, hrs: 4, totalMins: 240, dropFactor: 10, raw: 12.5, ans: 13 },
      ], rng);

      return {
        scenario: `An adult medical inpatient with symptomatic anemia (hemoglobin 6.8 g/dL) is prescribed 1 unit of Packed Red Blood Cells (${data.unitVol} mL) to infuse over ${data.hrs} hours by gravity using blood Y-tubing (10 gtt/mL).`,
        orderText: `1 unit PRBC (${data.unitVol} mL) IV over ${data.hrs} hours`,
        availableText: `Blood Y-type administration tubing with drop factor of ${data.dropFactor} gtt/mL`,
        prompt: `Calculate the required drip rate in gtt/min.`,
        correctAnswer: data.ans,
        answerUnit: "gtt/min",
        answerPrecision: 0,
        roundingInstruction: "Round to nearest whole drop.",
        hints: [
          `Convert ${data.hrs} hours to total minutes: ${data.totalMins} min.`,
          "Apply formula: (Volume × Drop Factor) ÷ Total Minutes.",
          `Calculate: (${data.unitVol} × ${data.dropFactor}) ÷ ${data.totalMins}.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Hours to Minutes",
            formula: "Hours × 60",
            calculation: `${data.hrs} hr × 60 = ${data.totalMins} min`,
            result: `${data.totalMins} min`,
          },
          {
            stepNumber: 2,
            title: "Calculate Blood Drip Rate",
            formula: "(Volume × Drop Factor) ÷ Minutes",
            calculation: `(${data.unitVol} mL × ${data.dropFactor} gtt/mL) ÷ ${data.totalMins} min = ${data.raw} gtt/min`,
            result: `${data.ans} gtt/min (rounded to nearest whole drop)`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "gravity-60gtt-microdrip-2hr",
    category: "gravity-drips",
    subtype: "microdrip-60",
    difficulty: "beginner",
    title: "Microdrip 60 gtt/mL Rate Equivalency Check",
    clinicalContext: "Adult Step-Down Precision Gravity Hydration",
    generate: (rng) => {
      const data = pick([
        { volMl: 250, hrs: 2, rateMlHr: 125, dropFactor: 60, ans: 125 },
        { volMl: 500, hrs: 4, rateMlHr: 125, dropFactor: 60, ans: 125 },
        { volMl: 300, hrs: 3, rateMlHr: 100, dropFactor: 60, ans: 100 },
        { volMl: 150, hrs: 2, rateMlHr: 75, dropFactor: 60, ans: 75 },
      ], rng);

      return {
        scenario: `An adult inpatient is ordered ${data.volMl} mL IV fluids over ${data.hrs} hours using microdrip tubing (60 gtt/mL).`,
        orderText: `Infuse ${data.volMl} mL IV over ${data.hrs} hours via microdrip set`,
        availableText: `Microdrip IV set (${data.dropFactor} gtt/mL)`,
        prompt: `Calculate the drip rate in gtt/min.`,
        correctAnswer: data.ans,
        answerUnit: "gtt/min",
        answerPrecision: 0,
        roundingInstruction: "State whole number (with 60 gtt/mL sets, gtt/min equals mL/hr).",
        hints: [
          `Recall that when drop factor is 60 gtt/mL, gtt/min is mathematically equal to mL/hr.`,
          `Calculate rate in mL/hr: ${data.volMl} mL ÷ ${data.hrs} hr = ${data.rateMlHr} mL/hr.`,
          `Therefore, drip rate is ${data.ans} gtt/min.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Hourly Rate",
            formula: "Volume ÷ Hours",
            calculation: `${data.volMl} mL ÷ ${data.hrs} hr = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
          {
            stepNumber: 2,
            title: "Apply Microdrip Equivalency",
            formula: "(mL/hr × 60 gtt/mL) ÷ 60 min = gtt/min",
            calculation: `(${data.rateMlHr} × 60) ÷ 60 = ${data.ans} gtt/min`,
            result: `${data.ans} gtt/min`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "gravity-60gtt-microdrip-30min",
    category: "gravity-drips",
    subtype: "microdrip-60",
    difficulty: "beginner",
    title: "Microdrip 60 gtt/mL 30-Minute IVPB Drip Rate",
    clinicalContext: "Adult Med-Surg Short IVPB Infusion",
    generate: (rng) => {
      const data = pick([
        { volMl: 50, mins: 30, dropFactor: 60, ans: 100 },
        { volMl: 75, mins: 30, dropFactor: 60, ans: 150 },
        { volMl: 100, mins: 30, dropFactor: 60, ans: 200 },
      ], rng);

      return {
        scenario: `An adult medical inpatient is ordered ${data.volMl} mL IVPB to infuse over ${data.mins} minutes using a 60 gtt/mL microdrip set.`,
        orderText: `Infuse ${data.volMl} mL IVPB over ${data.mins} minutes`,
        availableText: `Microdrip tubing (${data.dropFactor} gtt/mL)`,
        prompt: `Calculate the drip rate in gtt/min.`,
        correctAnswer: data.ans,
        answerUnit: "gtt/min",
        answerPrecision: 0,
        roundingInstruction: "State exact whole number.",
        hints: [
          "Formula: (Volume × Drop Factor) ÷ Minutes.",
          `Calculate: (${data.volMl} × 60) ÷ ${data.mins}.`,
          `(${data.volMl} × 60) ÷ 30 = ${data.ans} gtt/min.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Flow Rate",
            formula: "(Volume × Drop Factor) ÷ Minutes",
            calculation: `(${data.volMl} mL × ${data.dropFactor} gtt/mL) ÷ ${data.mins} min = ${data.ans} gtt/min`,
            result: `${data.ans} gtt/min`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "gravity-15gtt-rapid-hydration",
    category: "gravity-drips",
    subtype: "macrodrip-15",
    difficulty: "intermediate",
    title: "15 gtt/mL Rapid Gravity Hydration Rate",
    clinicalContext: "Adult Step-Down Dehydration Protocol",
    generate: (rng) => {
      const data = pick([
        { volMl: 500, hrs: 1.5, totalMins: 90, dropFactor: 15, raw: 83.33, ans: 83 },
        { volMl: 1000, hrs: 2.5, totalMins: 150, dropFactor: 15, raw: 100, ans: 100 },
        { volMl: 750, hrs: 2.0, totalMins: 120, dropFactor: 15, raw: 93.75, ans: 94 },
      ], rng);

      return {
        scenario: `An adult inpatient requiring expedited fluid replacement is prescribed ${data.volMl} mL 0.9% NS over ${data.hrs} hours by gravity using 15 gtt/mL tubing.`,
        orderText: `0.9% NS ${data.volMl} mL IV over ${data.hrs} hours`,
        availableText: `15 gtt/mL IV administration set`,
        prompt: `Calculate the drip rate in gtt/min.`,
        correctAnswer: data.ans,
        answerUnit: "gtt/min",
        answerPrecision: 0,
        roundingInstruction: "Round to nearest whole drop.",
        hints: [
          `Convert ${data.hrs} hours to minutes: ${data.hrs} × 60 = ${data.totalMins} min.`,
          "Apply formula: (Volume × Drop Factor) ÷ Total Minutes.",
          `Calculate: (${data.volMl} × 15) ÷ ${data.totalMins} = ${data.raw} → ${data.ans} gtt/min.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Hours to Minutes",
            formula: "Hours × 60",
            calculation: `${data.hrs} hr × 60 = ${data.totalMins} min`,
            result: `${data.totalMins} min`,
          },
          {
            stepNumber: 2,
            title: "Calculate Flow Rate",
            formula: "(Volume × Drop Factor) ÷ Minutes",
            calculation: `(${data.volMl} mL × ${data.dropFactor} gtt/mL) ÷ ${data.totalMins} min = ${data.raw} gtt/min`,
            result: `${data.ans} gtt/min (rounded)`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "gravity-reverse-count-rate-check",
    category: "gravity-drips",
    subtype: "macrodrip-15",
    difficulty: "intermediate",
    title: "Reverse Drip Count Audit: Calculate Delivery in mL/hr",
    clinicalContext: "Adult Med-Surg Gravity Infusion Verification",
    generate: (rng) => {
      const data = pick([
        { countedGttMin: 35, dropFactor: 15, rateMlHr: 140 },
        { countedGttMin: 25, dropFactor: 15, rateMlHr: 100 },
        { countedGttMin: 20, dropFactor: 10, rateMlHr: 120 },
        { countedGttMin: 30, dropFactor: 20, rateMlHr: 90 },
      ], rng);

      return {
        scenario: `During a bed check, a nurse times a gravity IV drip chamber and counts exactly ${data.countedGttMin} drops in 60 seconds using a ${data.dropFactor} gtt/mL set.`,
        orderText: `Drip rate measured at ${data.countedGttMin} gtt/min (${data.dropFactor} gtt/mL tubing)`,
        prompt: `Calculate the hourly infusion rate in mL/hr delivering to the patient.`,
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 0,
        roundingInstruction: "State exact whole number.",
        hints: [
          `To convert gtt/min to mL/hr: Rate (mL/hr) = (Drip rate in gtt/min × 60 min/hr) ÷ Drop factor.`,
          `Calculate total drops per hour: ${data.countedGttMin} × 60 = ${data.countedGttMin * 60} drops/hr.`,
          `Divide by drop factor: (${data.countedGttMin * 60}) ÷ ${data.dropFactor} = ${data.rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Drops per Hour",
            formula: "gtt/min × 60 min/hr",
            calculation: `${data.countedGttMin} gtt/min × 60 = ${data.countedGttMin * 60} gtt/hr`,
            result: `${data.countedGttMin * 60} gtt/hr`,
          },
          {
            stepNumber: 2,
            title: "Convert to Milliliters per Hour",
            formula: "gtt/hr ÷ Drop Factor (gtt/mL)",
            calculation: `${data.countedGttMin * 60} gtt/hr ÷ ${data.dropFactor} gtt/mL = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
];
