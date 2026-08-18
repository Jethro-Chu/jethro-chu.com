import type { QuestionTemplate } from "../types.ts";
import { pick, randInt } from "./helpers.ts";

export const ivPumpTemplates: QuestionTemplate[] = [
  {
    id: "iv-pump-continuous-hourly",
    category: "iv-pump",
    subtype: "continuous-ml-hr",
    difficulty: "beginner",
    title: "Continuous IV Infusion Pump Rate (Even Hours)",
    clinicalContext: "Adult Inpatient Hydration Order",
    generate: (rng) => {
      const data = pick([
        { volMl: 1000, hrs: 8, fluid: "0.9% Normal Saline", rate: 125 },
        { volMl: 1000, hrs: 10, fluid: "Lactated Ringer's", rate: 100 },
        { volMl: 1000, hrs: 12, fluid: "D5W", rate: 83.3 },
        { volMl: 500, hrs: 4, fluid: "0.45% Normal Saline", rate: 125 },
        { volMl: 500, hrs: 5, fluid: "0.9% Normal Saline", rate: 100 },
        { volMl: 250, hrs: 2, fluid: "0.9% Normal Saline", rate: 125 },
      ], rng);

      const rateRounded = Math.round(data.rate * 10) / 10;
      return {
        scenario: `An adult medical-surgical patient requires maintenance IV fluid hydration.`,
        orderText: `Infuse ${data.volMl} mL ${data.fluid} IV over ${data.hrs} hours`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        expectedAnswer: rateRounded,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to the nearest tenth if necessary (e.g. 83.3).",
        tolerance: 0.1,
        hints: [
          "Use the standard IV pump formula: Total Volume (mL) ÷ Total Time (hours).",
          `Divide ${data.volMl} mL by ${data.hrs} hours.`,
          `Calculate: ${data.volMl} ÷ ${data.hrs}.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Hourly Infusion Rate",
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
    id: "iv-pump-hours-minutes",
    category: "iv-pump",
    subtype: "partial-hours",
    difficulty: "intermediate",
    title: "IV Pump Rate with Hours and Minutes",
    clinicalContext: "Adult Med-Surg Fluid Order",
    generate: (rng) => {
      const data = pick([
        { volMl: 1000, hrs: 6, mins: 45, decimalHrs: 6.75, rate: 148.1 },
        { volMl: 1000, hrs: 7, mins: 30, decimalHrs: 7.5, rate: 133.3 },
        { volMl: 800, hrs: 5, mins: 20, decimalHrs: 5.333, rate: 150 },
        { volMl: 750, hrs: 4, mins: 30, decimalHrs: 4.5, rate: 166.7 },
        { volMl: 500, hrs: 3, mins: 45, decimalHrs: 3.75, rate: 133.3 },
      ], rng);

      const rateRounded = Math.round(data.rate * 10) / 10;
      return {
        scenario: `An adult inpatient has an intravenous hydration order specified in hours and minutes.`,
        orderText: `Infuse ${data.volMl} mL 0.9% NS IV over ${data.hrs} hours ${data.mins} minutes`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        expectedAnswer: rateRounded,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to the nearest tenth.",
        tolerance: 0.2,
        hints: [
          `First convert ${data.mins} minutes into a fraction or decimal of an hour: ${data.mins} ÷ 60 = ${data.mins / 60} hr.`,
          `Total time in hours = ${data.hrs + data.mins / 60} hr.`,
          `Calculate: ${data.volMl} mL ÷ ${data.hrs + data.mins / 60} hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Minutes to Decimal Hours",
            formula: "Minutes ÷ 60",
            calculation: `${data.mins} min ÷ 60 = ${data.mins / 60} hr`,
            result: `${data.hrs + data.mins / 60} total hours`,
          },
          {
            stepNumber: 2,
            title: "Calculate mL/hr Rate",
            formula: "Total Volume (mL) ÷ Total Hours",
            calculation: `${data.volMl} mL ÷ ${data.hrs + data.mins / 60} hr = ${rateRounded} mL/hr`,
            result: `${rateRounded} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "iv-pump-ivpb-30min",
    category: "iv-pump",
    subtype: "ivpb",
    difficulty: "beginner",
    title: "IV Piggyback 30-Minute Infusion",
    clinicalContext: "Adult Inpatient IVPB Antibiotic",
    generate: (rng) => {
      const data = pick([
        { med: "Cefazolin 1 g", volMl: 50, mins: 30, rate: 100 },
        { med: "Cefazolin 2 g", volMl: 100, mins: 30, rate: 200 },
        { med: "Ampicillin 1 g", volMl: 50, mins: 30, rate: 100 },
        { med: "Metronidazole 500 mg", volMl: 100, mins: 30, rate: 200 },
      ], rng);

      return {
        scenario: `The nurse is preparing to program an electronic infusion pump for an IV piggyback antibiotic.`,
        orderText: `${data.med} in ${data.volMl} mL D5W IVPB over ${data.mins} minutes`,
        prompt: `At what rate in mL/hr should the nurse set the IV pump?`,
        expectedAnswer: data.rate,
        expectedUnit: "mL/hr",
        roundingMode: "whole",
        roundingInstruction: "State whole number.",
        tolerance: 0.05,
        hints: [
          "Convert 30 minutes to hours: 30 min ÷ 60 = 0.5 hr.",
          "Use the formula: Volume (mL) ÷ Time (hours).",
          `Calculate: ${data.volMl} mL ÷ 0.5 hr (or ${data.volMl} × 2).`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Minutes to Hours",
            formula: "Minutes ÷ 60",
            calculation: `30 min ÷ 60 = 0.5 hr`,
            result: "0.5 hr",
          },
          {
            stepNumber: 2,
            title: "Calculate Pump Rate",
            formula: "Volume ÷ Hours",
            calculation: `${data.volMl} mL ÷ 0.5 hr = ${data.rate} mL/hr`,
            result: `${data.rate} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "iv-pump-ivpb-60min",
    category: "iv-pump",
    subtype: "ivpb",
    difficulty: "beginner",
    title: "IV Piggyback 60-Minute Infusion",
    clinicalContext: "Adult Med-Surg Antibiotic Order",
    generate: (rng) => {
      const data = pick([
        { med: "Ceftriaxone 1 g", volMl: 100, mins: 60, rate: 100 },
        { med: "Ceftriaxone 2 g", volMl: 100, mins: 60, rate: 100 },
        { med: "Levofloxacin 500 mg", volMl: 100, mins: 60, rate: 100 },
        { med: "Piperacillin/Tazobactam 3.375 g", volMl: 100, mins: 60, rate: 100 },
        { med: "Azithromycin 500 mg", volMl: 250, mins: 60, rate: 250 },
      ], rng);

      return {
        scenario: `An adult inpatient has an intravenous antibiotic order scheduled over 1 hour (60 minutes).`,
        orderText: `${data.med} in ${data.volMl} mL 0.9% NS IVPB over ${data.mins} minutes`,
        prompt: `At what rate in mL/hr should the IV pump be set?`,
        expectedAnswer: data.rate,
        expectedUnit: "mL/hr",
        roundingMode: "whole",
        roundingInstruction: "State whole number.",
        tolerance: 0.05,
        hints: [
          "When the infusion time is 60 minutes (1 hour), the pump rate in mL/hr equals the total volume in mL.",
          `Calculate: ${data.volMl} mL ÷ 1 hr.`,
          `Answer is ${data.rate} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Rate for 1-Hour Infusion",
            formula: "Volume (mL) ÷ 1 hour",
            calculation: `${data.volMl} mL ÷ 1 hr = ${data.rate} mL/hr`,
            result: `${data.rate} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "iv-pump-ivpb-90min-vancomycin",
    category: "iv-pump",
    subtype: "ivpb",
    difficulty: "intermediate",
    title: "IVPB Extended Infusion (90 Minutes)",
    clinicalContext: "Adult Inpatient Glycopeptide Antibiotic Order",
    generate: (rng) => {
      const data = pick([
        { med: "Vancomycin 1,000 mg", volMl: 250, mins: 90, rate: 166.7 },
        { med: "Vancomycin 1,250 mg", volMl: 250, mins: 90, rate: 166.7 },
        { med: "Vancomycin 1,500 mg", volMl: 500, mins: 90, rate: 333.3 },
        { med: "Ciprofloxacin 400 mg", volMl: 200, mins: 90, rate: 133.3 },
      ], rng);

      const rateRounded = Math.round(data.rate * 10) / 10;
      return {
        scenario: `To avoid infusion-related reactions (such as Red Man Syndrome), an antibiotic is ordered over 90 minutes.`,
        orderText: `${data.med} in ${data.volMl} mL 0.9% NS IVPB over ${data.mins} minutes`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        expectedAnswer: rateRounded,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to the nearest tenth.",
        tolerance: 0.2,
        hints: [
          "Convert 90 minutes to hours: 90 min ÷ 60 = 1.5 hr.",
          "Use the formula: Volume (mL) ÷ Time (hours).",
          `Calculate: ${data.volMl} mL ÷ 1.5 hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Minutes to Hours",
            formula: "Minutes ÷ 60",
            calculation: `90 min ÷ 60 = 1.5 hr`,
            result: "1.5 hr",
          },
          {
            stepNumber: 2,
            title: "Calculate Hourly Rate",
            formula: "Volume ÷ Hours",
            calculation: `${data.volMl} mL ÷ 1.5 hr = ${rateRounded} mL/hr`,
            result: `${rateRounded} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "iv-pump-ivpb-45min",
    category: "iv-pump",
    subtype: "ivpb",
    difficulty: "intermediate",
    title: "IVPB 45-Minute Infusion",
    clinicalContext: "Adult Inpatient Antibiotic Infusion",
    generate: (rng) => {
      const data = pick([
        { med: "Ampicillin/Sulbactam 1.5 g", volMl: 100, mins: 45, rate: 133.3 },
        { med: "Tobramycin 100 mg", volMl: 100, mins: 45, rate: 133.3 },
        { med: "Gentamicin 120 mg", volMl: 100, mins: 45, rate: 133.3 },
        { med: "Cefepime 1 g", volMl: 50, mins: 45, rate: 66.7 },
      ], rng);

      const rateRounded = Math.round(data.rate * 10) / 10;
      return {
        scenario: `The pharmacy dispenses an IV piggyback medication with an administration time of 45 minutes.`,
        orderText: `${data.med} in ${data.volMl} mL D5W IVPB over ${data.mins} minutes`,
        prompt: `What rate in mL/hr should the nurse program into the IV pump?`,
        expectedAnswer: rateRounded,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to the nearest tenth.",
        tolerance: 0.2,
        hints: [
          "Convert 45 minutes to hours: 45 ÷ 60 = 0.75 hr.",
          "Use the formula: Volume (mL) ÷ Hours.",
          `Calculate: ${data.volMl} mL ÷ 0.75 hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Minutes to Hours",
            formula: "Minutes ÷ 60",
            calculation: `45 min ÷ 60 = 0.75 hr`,
            result: "0.75 hr",
          },
          {
            stepNumber: 2,
            title: "Calculate Pump Rate",
            formula: "Volume ÷ Hours",
            calculation: `${data.volMl} mL ÷ 0.75 hr = ${rateRounded} mL/hr`,
            result: `${rateRounded} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "iv-pump-ivpb-2hour",
    category: "iv-pump",
    subtype: "ivpb",
    difficulty: "beginner",
    title: "IVPB 2-Hour Infusion (120 Minutes)",
    clinicalContext: "Adult Oncology / Med-Surg Infusion",
    generate: (rng) => {
      const data = pick([
        { med: "Vancomycin 2,000 mg", volMl: 500, hrs: 2, rate: 250 },
        { med: "Magnesium Sulfate 4 g", volMl: 250, hrs: 2, rate: 125 },
        { med: "Potassium Chloride 20 mEq", volMl: 250, hrs: 2, rate: 125 },
        { med: "Iron Sucrose 200 mg", volMl: 100, hrs: 2, rate: 50 },
      ], rng);

      return {
        scenario: `An adult inpatient is prescribed an IV infusion to run over 2 hours.`,
        orderText: `${data.med} in ${data.volMl} mL NS IVPB over ${data.hrs} hours`,
        prompt: `At what rate in mL/hr should the infusion pump be programmed?`,
        expectedAnswer: data.rate,
        expectedUnit: "mL/hr",
        roundingMode: "whole",
        roundingInstruction: "State whole number.",
        tolerance: 0.05,
        hints: [
          "Use the formula: Volume (mL) ÷ Time (hours).",
          `Divide ${data.volMl} mL by ${data.hrs} hours.`,
          `Calculate: ${data.volMl} ÷ ${data.hrs}.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Hourly Rate",
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
    id: "iv-pump-blood-transfusion",
    category: "iv-pump",
    subtype: "blood-product",
    difficulty: "intermediate",
    title: "Packed Red Blood Cells Transfusion Rate",
    clinicalContext: "Adult Inpatient Blood Administration Protocol",
    generate: (rng) => {
      const data = pick([
        { unitVol: 300, hrs: 3, mins: 0, rate: 100 },
        { unitVol: 350, hrs: 3, mins: 30, decimalHrs: 3.5, rate: 100 },
        { unitVol: 280, hrs: 2, mins: 0, rate: 140 },
        { unitVol: 320, hrs: 4, mins: 0, rate: 80 },
      ], rng);

      return {
        scenario: `An adult telemetry patient with symptomatic anemia is ordered 1 unit of Packed Red Blood Cells (PRBCs). Institutional policy requires completing the unit within the prescribed duration.`,
        orderText: `Transfuse 1 unit PRBCs (${data.unitVol} mL) IV over ${data.hrs}${data.mins ? ` hr ${data.mins} min` : " hours"}`,
        prompt: `What rate in mL/hr should the nurse set on the blood-approved infusion pump?`,
        expectedAnswer: data.rate,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to the nearest whole number or tenth.",
        tolerance: 0.1,
        hints: [
          `Total volume to infuse is ${data.unitVol} mL.`,
          data.mins ? `Convert ${data.hrs} hr ${data.mins} min to ${data.decimalHrs} hours.` : `Time is ${data.hrs} hours.`,
          `Calculate: ${data.unitVol} mL ÷ ${data.decimalHrs ?? data.hrs} hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Transfusion Rate",
            formula: "Volume (mL) ÷ Hours",
            calculation: `${data.unitVol} mL ÷ ${data.decimalHrs ?? data.hrs} hr = ${data.rate} mL/hr`,
            result: `${data.rate} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "iv-pump-bolus-rapid",
    category: "iv-pump",
    subtype: "fluid-bolus",
    difficulty: "beginner",
    title: "Rapid Fluid Bolus Rate Calculation",
    clinicalContext: "Adult Emergency / Step-Down Hypotension Protocol",
    generate: (rng) => {
      const data = pick([
        { volMl: 500, mins: 30, rate: 1000 },
        { volMl: 1000, mins: 60, rate: 1000 },
        { volMl: 500, mins: 60, rate: 500 },
        { volMl: 250, mins: 15, rate: 1000 },
      ], rng);

      return {
        scenario: `An adult inpatient experiencing post-op hypotension is prescribed a rapid IV fluid bolus.`,
        orderText: `0.9% Normal Saline ${data.volMl} mL IV bolus over ${data.mins} minutes`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        expectedAnswer: data.rate,
        expectedUnit: "mL/hr",
        roundingMode: "whole",
        roundingInstruction: "State whole number.",
        tolerance: 0.05,
        hints: [
          `Convert ${data.mins} minutes to hours: ${data.mins} ÷ 60 = ${data.mins / 60} hr.`,
          "Apply formula: Volume ÷ Hours.",
          `Calculate: ${data.volMl} ÷ (${data.mins} ÷ 60).`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Bolus Time to Hours",
            formula: "Minutes ÷ 60",
            calculation: `${data.mins} min ÷ 60 = ${data.mins / 60} hr`,
            result: `${data.mins / 60} hr`,
          },
          {
            stepNumber: 2,
            title: "Calculate Pump Rate",
            formula: "Volume ÷ Hours",
            calculation: `${data.volMl} mL ÷ ${data.mins / 60} hr = ${data.rate} mL/hr`,
            result: `${data.rate} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "iv-pump-tpn-infusion",
    category: "iv-pump",
    subtype: "continuous-ml-hr",
    difficulty: "beginner",
    title: "Total Parenteral Nutrition (TPN) Rate",
    clinicalContext: "Adult Med-Surg Nutrition Support Order",
    generate: (rng) => {
      const data = pick([
        { totalVol: 2000, hrs: 24, rate: 83.3 },
        { totalVol: 1500, hrs: 24, rate: 62.5 },
        { totalVol: 1800, hrs: 24, rate: 75 },
        { totalVol: 2400, hrs: 24, rate: 100 },
      ], rng);

      const rateRounded = Math.round(data.rate * 10) / 10;
      return {
        scenario: `An adult medical-surgical patient with bowel obstruction is started on 24-hour continuous Total Parenteral Nutrition (TPN).`,
        orderText: `TPN 2-in-1 solution ${data.totalVol} mL IV via central line over 24 hours`,
        prompt: `At what rate in mL/hr should the infusion pump be programmed?`,
        expectedAnswer: rateRounded,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to the nearest tenth.",
        tolerance: 0.1,
        hints: [
          "Use the standard IV pump formula: Total Volume ÷ Total Hours.",
          `Divide ${data.totalVol} mL by 24 hours.`,
          `Calculate: ${data.totalVol} ÷ 24.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate 24-Hour TPN Rate",
            formula: "Total Volume ÷ 24 Hours",
            calculation: `${data.totalVol} mL ÷ 24 hr = ${rateRounded} mL/hr`,
            result: `${rateRounded} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
];
