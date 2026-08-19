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
        correctAnswer: rateRounded,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to the nearest tenth if necessary (e.g. 83.3).",
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
        correctAnswer: rateRounded,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to the nearest tenth.",
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
        correctAnswer: data.rate,
        answerUnit: "mL/hr",
        answerPrecision: 0,
        roundingInstruction: "State whole number.",
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
        correctAnswer: data.rate,
        answerUnit: "mL/hr",
        answerPrecision: 0,
        roundingInstruction: "State whole number.",
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
        correctAnswer: rateRounded,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to the nearest tenth.",
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
        correctAnswer: rateRounded,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to the nearest tenth.",
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
        correctAnswer: data.rate,
        answerUnit: "mL/hr",
        answerPrecision: 0,
        roundingInstruction: "State whole number.",
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
        correctAnswer: data.rate,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to the nearest whole number or tenth.",
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
        correctAnswer: data.rate,
        answerUnit: "mL/hr",
        answerPrecision: 0,
        roundingInstruction: "State whole number.",
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
        correctAnswer: rateRounded,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to the nearest tenth.",
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
  {
    id: "iv-pump-reverse-rate-to-volume",
    category: "iv-pump",
    subtype: "continuous-ml-hr",
    difficulty: "beginner",
    title: "Reverse IV Calculation: Total Volume Delivered from Rate",
    clinicalContext: "Adult Intake and Output Shift Reconciliation",
    generate: (rng) => {
      const data = pick([
        { rate: 125, hrs: 6, vol: 750 },
        { rate: 100, hrs: 8, vol: 800 },
        { rate: 75, hrs: 12, vol: 900 },
        { rate: 150, hrs: 4, vol: 600 },
        { rate: 80, hrs: 7, vol: 560 },
      ], rng);

      return {
        scenario: `A primary IV infusion of 0.9% Normal Saline has been running at a constant ${data.rate} mL/hr for exactly ${data.hrs} hours.`,
        orderText: `0.9% Normal Saline IV at ${data.rate} mL/hr`,
        prompt: `Calculate the total volume in mL infused into the patient.`,
        correctAnswer: data.vol,
        answerUnit: "mL",
        answerPrecision: 0,
        roundingInstruction: "State exact whole number.",
        hints: [
          "To find total volume delivered, multiply the hourly rate by elapsed hours.",
          `Formula: Rate (mL/hr) × Elapsed Time (hr) = Volume (mL).`,
          `Calculate: ${data.rate} × ${data.hrs} = ${data.vol} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Total Volume Delivered",
            formula: "Rate (mL/hr) × Hours = Total Volume (mL)",
            calculation: `${data.rate} mL/hr × ${data.hrs} hr = ${data.vol} mL`,
            result: `${data.vol} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "iv-pump-reverse-vol-time-to-rate",
    category: "iv-pump",
    subtype: "partial-hours",
    difficulty: "intermediate",
    title: "Reverse IV Calculation: Rate from Volume and Elapsed Time",
    clinicalContext: "Adult Med-Surg Infusion Verification",
    generate: (rng) => {
      const data = pick([
        { volMl: 450, hrs: 3, mins: 45, decimalHrs: 3.75, rate: 120 },
        { volMl: 600, hrs: 4, mins: 30, decimalHrs: 4.5, rate: 133.3 },
        { volMl: 350, hrs: 2, mins: 30, decimalHrs: 2.5, rate: 140 },
        { volMl: 800, hrs: 6, mins: 15, decimalHrs: 6.25, rate: 128 },
      ], rng);

      return {
        scenario: `A volume of ${data.volMl} mL infused over a period of ${data.hrs} hours and ${data.mins} minutes.`,
        orderText: `Total infused: ${data.volMl} mL in ${data.hrs} hr ${data.mins} min`,
        prompt: `Calculate the average IV pump rate in mL/hr during this period.`,
        correctAnswer: data.rate,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          `First convert ${data.mins} minutes into decimal hours: ${data.mins} ÷ 60 = ${data.mins / 60} hr.`,
          `Add to ${data.hrs} hours to get total hours: ${data.decimalHrs} hr.`,
          `Calculate: ${data.volMl} mL ÷ ${data.decimalHrs} hr = ${data.rate} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Total Time to Decimal Hours",
            formula: "Hours + (Minutes ÷ 60)",
            calculation: `${data.hrs} hr + (${data.mins} ÷ 60) = ${data.decimalHrs} hr`,
            result: `${data.decimalHrs} hr`,
          },
          {
            stepNumber: 2,
            title: "Calculate Average Infusion Rate",
            formula: "Volume ÷ Decimal Hours",
            calculation: `${data.volMl} mL ÷ ${data.decimalHrs} hr = ${data.rate} mL/hr`,
            result: `${data.rate} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "iv-pump-remaining-bag-rate-adjust",
    category: "iv-pump",
    subtype: "continuous-ml-hr",
    difficulty: "intermediate",
    title: "Pump Rate Adjustment for Remaining Bag Volume",
    clinicalContext: "Adult Inpatient Hydration Target Schedule",
    generate: (rng) => {
      const data = pick([
        { remainingMl: 350, targetHrs: 2.5, rate: 140 },
        { remainingMl: 500, targetHrs: 4.0, rate: 125 },
        { remainingMl: 450, targetHrs: 3.0, rate: 150 },
        { remainingMl: 600, targetHrs: 5.0, rate: 120 },
      ], rng);

      return {
        scenario: `At change of shift, the nurse notes exactly ${data.remainingMl} mL remaining in the patient's primary IV bag. The provider orders the remaining volume to finish in ${data.targetHrs} hours.`,
        orderText: `Complete remaining ${data.remainingMl} mL IV over ${data.targetHrs} hours`,
        prompt: `At what rate in mL/hr should the nurse set the IV pump?`,
        correctAnswer: data.rate,
        answerUnit: "mL/hr",
        answerPrecision: 0,
        roundingInstruction: "State whole number.",
        hints: [
          "Divide the remaining volume by the target remaining hours.",
          `Formula: Remaining Volume (mL) ÷ Target Hours (hr).`,
          `Calculate: ${data.remainingMl} ÷ ${data.targetHrs} = ${data.rate} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate New Pump Rate",
            formula: "Remaining Volume ÷ Remaining Hours",
            calculation: `${data.remainingMl} mL ÷ ${data.targetHrs} hr = ${data.rate} mL/hr`,
            result: `${data.rate} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "iv-pump-multihour-stepdown-rate",
    category: "iv-pump",
    subtype: "continuous-ml-hr",
    difficulty: "advanced",
    title: "Two-Stage Infusion Remaining Rate Calculation",
    clinicalContext: "Adult Step-Down Fluid Protocol",
    generate: (rng) => {
      const data = pick([
        { totalVol: 1000, stage1Rate: 150, stage1Hrs: 2, stage1Vol: 300, remainingVol: 700, stage2Hrs: 5, stage2Rate: 140 },
        { totalVol: 1000, stage1Rate: 200, stage1Hrs: 2, stage1Vol: 400, remainingVol: 600, stage2Hrs: 4, stage2Rate: 150 },
        { totalVol: 500, stage1Rate: 100, stage1Hrs: 2, stage1Vol: 200, remainingVol: 300, stage2Hrs: 3, stage2Rate: 100 },
      ], rng);

      return {
        scenario: `A patient is ordered a total of ${data.totalVol} mL IV fluids over ${data.stage1Hrs + data.stage2Hrs} hours. The first ${data.stage1Hrs} hours ran at ${data.stage1Rate} mL/hr.`,
        orderText: `Total ${data.totalVol} mL to complete over remaining ${data.stage2Hrs} hours`,
        prompt: `Calculate the required pump rate in mL/hr for the final ${data.stage2Hrs} hours to complete the ordered volume on time.`,
        correctAnswer: data.stage2Rate,
        answerUnit: "mL/hr",
        answerPrecision: 0,
        roundingInstruction: "State whole number.",
        hints: [
          `First find volume infused in stage 1: ${data.stage1Rate} mL/hr × ${data.stage1Hrs} hr = ${data.stage1Vol} mL.`,
          `Subtract from total to find remaining volume: ${data.totalVol} mL - ${data.stage1Vol} mL = ${data.remainingVol} mL.`,
          `Divide remaining volume by remaining time: ${data.remainingVol} mL ÷ ${data.stage2Hrs} hr = ${data.stage2Rate} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Initial Volume Infused",
            formula: "Initial Rate × Initial Hours",
            calculation: `${data.stage1Rate} mL/hr × ${data.stage1Hrs} hr = ${data.stage1Vol} mL`,
            result: `${data.stage1Vol} mL`,
          },
          {
            stepNumber: 2,
            title: "Calculate Remaining Volume",
            formula: "Total Volume - Initial Volume",
            calculation: `${data.totalVol} mL - ${data.stage1Vol} mL = ${data.remainingVol} mL`,
            result: `${data.remainingVol} mL`,
          },
          {
            stepNumber: 3,
            title: "Calculate Stage 2 Rate",
            formula: "Remaining Volume ÷ Remaining Hours",
            calculation: `${data.remainingVol} mL ÷ ${data.stage2Hrs} hr = ${data.stage2Rate} mL/hr`,
            result: `${data.stage2Rate} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "iv-pump-ivpb-15min-bolus",
    category: "iv-pump",
    subtype: "ivpb",
    difficulty: "beginner",
    title: "15-Minute IV Piggyback Infusion Rate",
    clinicalContext: "Adult Inpatient Short-Duration IVPB",
    generate: (rng) => {
      const data = pick([
        { med: "Ampicillin", volMl: 50, mins: 15, rate: 200 },
        { med: "Cefazolin", volMl: 50, mins: 15, rate: 200 },
        { med: "Metoclopramide", volMl: 50, mins: 15, rate: 200 },
        { med: "Ranitidine", volMl: 50, mins: 15, rate: 200 },
      ], rng);

      return {
        scenario: `An adult surgical inpatient is prescribed an IV piggyback dose of ${data.med} in ${data.volMl} mL to infuse over ${data.mins} minutes.`,
        orderText: `${data.med} in ${data.volMl} mL 0.9% NS IVPB over ${data.mins} minutes`,
        prompt: `At what rate in mL/hr should the IV pump be programmed?`,
        correctAnswer: data.rate,
        answerUnit: "mL/hr",
        answerPrecision: 0,
        roundingInstruction: "State whole number.",
        hints: [
          `Convert ${data.mins} minutes to hours: 15 ÷ 60 = 0.25 hr.`,
          "Apply formula: Volume ÷ Hours.",
          `Calculate: ${data.volMl} ÷ 0.25 = ${data.rate} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Minutes to Hours",
            formula: "Minutes ÷ 60",
            calculation: `${data.mins} min ÷ 60 = 0.25 hr`,
            result: "0.25 hr",
          },
          {
            stepNumber: 2,
            title: "Calculate IV Pump Rate",
            formula: "Volume ÷ Hours",
            calculation: `${data.volMl} mL ÷ 0.25 hr = ${data.rate} mL/hr`,
            result: `${data.rate} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "iv-pump-ivpb-20min-dose",
    category: "iv-pump",
    subtype: "ivpb",
    difficulty: "beginner",
    title: "20-Minute IV Piggyback Infusion Rate",
    clinicalContext: "Adult Inpatient Short-Duration IVPB",
    generate: (rng) => {
      const data = pick([
        { med: "Gentamicin", volMl: 100, mins: 20, rate: 300 },
        { med: "Tobramycin", volMl: 100, mins: 20, rate: 300 },
        { med: "Cefepime", volMl: 50, mins: 20, rate: 150 },
      ], rng);

      return {
        scenario: `An adult patient with bacteremia is prescribed ${data.med} in ${data.volMl} mL to infuse over ${data.mins} minutes.`,
        orderText: `${data.med} in ${data.volMl} mL D5W IVPB over ${data.mins} minutes`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: data.rate,
        answerUnit: "mL/hr",
        answerPrecision: 0,
        roundingInstruction: "State whole number.",
        hints: [
          `Convert 20 minutes to hours: 20 ÷ 60 = 1/3 hr (0.333 hr).`,
          `Formula: Volume × (60 ÷ Minutes).`,
          `Calculate: ${data.volMl} × (60 ÷ ${data.mins}) = ${data.rate} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Hourly Rate",
            formula: "(Volume ÷ Minutes) × 60",
            calculation: `(${data.volMl} mL ÷ ${data.mins} min) × 60 min/hr = ${data.rate} mL/hr`,
            result: `${data.rate} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "iv-pump-ivpb-buffered-bag",
    category: "iv-pump",
    subtype: "ivpb",
    difficulty: "intermediate",
    title: "IVPB with Line Flush Volume Included",
    clinicalContext: "Adult Oncology / Med-Surg Complete Delivery Protocol",
    generate: (rng) => {
      const data = pick([
        { medVol: 100, flushVol: 20, totalVol: 120, mins: 45, rate: 160 },
        { medVol: 100, flushVol: 25, totalVol: 125, mins: 50, rate: 150 },
        { medVol: 50, flushVol: 20, totalVol: 70, mins: 30, rate: 140 },
      ], rng);

      return {
        scenario: `An adult inpatient protocol requires infusing an antibiotic (${data.medVol} mL) followed by a secondary line flush (${data.flushVol} mL) for a combined volume of ${data.totalVol} mL to be completed in ${data.mins} minutes.`,
        orderText: `Total ${data.totalVol} mL (medication + flush) IVPB over ${data.mins} minutes`,
        prompt: `At what rate in mL/hr should the pump be set?`,
        correctAnswer: data.rate,
        answerUnit: "mL/hr",
        answerPrecision: 0,
        roundingInstruction: "State whole number.",
        hints: [
          `Use total volume (${data.totalVol} mL) and time (${data.mins} minutes).`,
          `Formula: (Total Volume ÷ Minutes) × 60.`,
          `Calculate: (${data.totalVol} ÷ ${data.mins}) × 60 = ${data.rate} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Combined Infusion Rate",
            formula: "(Total Combined Volume ÷ Minutes) × 60",
            calculation: `(${data.totalVol} mL ÷ ${data.mins} min) × 60 = ${data.rate} mL/hr`,
            result: `${data.rate} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "iv-pump-platelets-transfusion",
    category: "iv-pump",
    subtype: "blood-transfusion",
    difficulty: "beginner",
    title: "Platelet Transfusion Infusion Rate",
    clinicalContext: "Adult Hematology Platelet Transfusion Order",
    generate: (rng) => {
      const data = pick([
        { poolVol: 250, mins: 30, rate: 500 },
        { poolVol: 300, mins: 30, rate: 600 },
        { poolVol: 200, mins: 30, rate: 400 },
        { poolVol: 250, mins: 60, rate: 250 },
      ], rng);

      return {
        scenario: `An adult patient with thrombocytopenia (platelet count 18,000/mcL) is ordered 1 apheresis unit of platelets (${data.poolVol} mL) to infuse over ${data.mins} minutes.`,
        orderText: `Platelets 1 unit (${data.poolVol} mL) IV over ${data.mins} minutes`,
        prompt: `At what rate in mL/hr should the infusion pump be programmed?`,
        correctAnswer: data.rate,
        answerUnit: "mL/hr",
        answerPrecision: 0,
        roundingInstruction: "State whole number.",
        hints: [
          `Convert ${data.mins} minutes to hours: ${data.mins} ÷ 60 hr.`,
          "Apply formula: Volume ÷ Hours.",
          `Calculate: ${data.poolVol} ÷ (${data.mins} ÷ 60).`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Infusion Rate",
            formula: "(Volume ÷ Minutes) × 60",
            calculation: `(${data.poolVol} mL ÷ ${data.mins} min) × 60 = ${data.rate} mL/hr`,
            result: `${data.rate} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "iv-pump-albumin-25pct-infusion",
    category: "iv-pump",
    subtype: "continuous-ml-hr",
    difficulty: "beginner",
    title: "Albumin 25% Infusion Rate Calculation",
    clinicalContext: "Adult Inpatient Post-Paracentesis Colloid Order",
    generate: (rng) => {
      const data = pick([
        { volMl: 50, mins: 30, rate: 100 },
        { volMl: 100, mins: 60, rate: 100 },
        { volMl: 50, mins: 60, rate: 50 },
        { volMl: 100, mins: 120, rate: 50 },
      ], rng);

      return {
        scenario: `Following a large-volume paracentesis, an adult patient with cirrhosis is ordered 25% Albumin (${data.volMl} mL) IV to infuse over ${data.mins} minutes.`,
        orderText: `Albumin 25% ${data.volMl} mL IV over ${data.mins} minutes`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: data.rate,
        answerUnit: "mL/hr",
        answerPrecision: 0,
        roundingInstruction: "State whole number.",
        hints: [
          `Convert minutes to hours: ${data.mins} ÷ 60 = ${data.mins / 60} hr.`,
          "Apply formula: Volume ÷ Hours.",
          `Calculate: ${data.volMl} ÷ ${data.mins / 60} = ${data.rate} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Infusion Rate",
            formula: "(Volume ÷ Minutes) × 60",
            calculation: `(${data.volMl} mL ÷ ${data.mins} min) × 60 = ${data.rate} mL/hr`,
            result: `${data.rate} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "iv-pump-lipid-emulsion-rate",
    category: "iv-pump",
    subtype: "continuous-ml-hr",
    difficulty: "beginner",
    title: "20% Intravenous Fat Emulsion (IVFE) Pump Rate",
    clinicalContext: "Adult Inpatient Parenteral Nutrition Protocol",
    generate: (rng) => {
      const data = pick([
        { volMl: 250, hrs: 12, rate: 20.8 },
        { volMl: 500, hrs: 24, rate: 20.8 },
        { volMl: 250, hrs: 10, rate: 25.0 },
        { volMl: 500, hrs: 12, rate: 41.7 },
      ], rng);

      return {
        scenario: `An adult inpatient receiving parenteral nutrition is prescribed 20% lipid emulsion ${data.volMl} mL IV over ${data.hrs} hours.`,
        orderText: `20% IV Fat Emulsion ${data.volMl} mL IV over ${data.hrs} hours`,
        prompt: `Calculate the infusion pump rate in mL/hr.`,
        correctAnswer: data.rate,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          "Divide total lipid volume by ordered hours.",
          `Calculate: ${data.volMl} mL ÷ ${data.hrs} hr.`,
          `${data.volMl} ÷ ${data.hrs} = ${data.rate} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Lipid Infusion Rate",
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
    id: "iv-pump-furosemide-infusion-rate",
    category: "iv-pump",
    subtype: "continuous-ml-hr",
    difficulty: "intermediate",
    title: "Continuous Furosemide Infusion Rate in mL/hr",
    clinicalContext: "Adult Med-Surg Continuous Diuretic Protocol",
    generate: (rng) => {
      const data = pick([
        { doseMgHr: 10, bagMg: 100, bagMl: 100, rateMlHr: 10 },
        { doseMgHr: 20, bagMg: 100, bagMl: 100, rateMlHr: 20 },
        { doseMgHr: 15, bagMg: 200, bagMl: 200, rateMlHr: 15 },
        { doseMgHr: 5, bagMg: 100, bagMl: 100, rateMlHr: 5 },
      ], rng);

      return {
        scenario: `An adult heart failure patient with severe fluid retention is ordered a continuous IV furosemide infusion.`,
        orderText: `Furosemide continuous IV infusion at ${data.doseMgHr} mg/hr`,
        availableText: `Furosemide ${data.bagMg} mg in 0.9% Normal Saline ${data.bagMl} mL (1 mg/mL)`,
        prompt: `At what rate in mL/hr should the infusion pump be programmed?`,
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 0,
        roundingInstruction: "State whole number.",
        hints: [
          `Find the concentration in mg/mL: ${data.bagMg} mg ÷ ${data.bagMl} mL = ${data.bagMg / data.bagMl} mg/mL.`,
          `Divide ordered hourly dose by concentration: ${data.doseMgHr} mg/hr ÷ ${data.bagMg / data.bagMl} mg/mL.`,
          `Calculate: ${data.doseMgHr} ÷ 1 = ${data.rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Determine Infusion Concentration",
            formula: "Bag mg ÷ Bag mL",
            calculation: `${data.bagMg} mg ÷ ${data.bagMl} mL = 1 mg/mL`,
            result: "1 mg/mL",
          },
          {
            stepNumber: 2,
            title: "Calculate Pump Rate",
            formula: "Dose (mg/hr) ÷ Concentration (mg/mL)",
            calculation: `${data.doseMgHr} mg/hr ÷ 1 mg/mL = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "iv-pump-maintenance-liter-day",
    category: "iv-pump",
    subtype: "continuous-ml-hr",
    difficulty: "intermediate",
    title: "Daily Liters to Hourly Pump Rate Calculation",
    clinicalContext: "Adult Post-Operative Fluid Maintenance",
    generate: (rng) => {
      const data = pick([
        { liters: 2.4, ml: 2400, rate: 100 },
        { liters: 3.0, ml: 3000, rate: 125 },
        { liters: 1.8, ml: 1800, rate: 75 },
        { liters: 2.0, ml: 2000, rate: 83.3 },
      ], rng);

      return {
        scenario: `A surgeon writes a post-op order for ${data.liters} L of D5 0.45% NS to infuse over 24 hours.`,
        orderText: `D5 0.45% NS ${data.liters} L IV over 24 hours`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: data.rate,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth if necessary.",
        hints: [
          `First convert liters to milliliters: ${data.liters} L × 1,000 = ${data.ml} mL.`,
          `Divide total volume in mL by 24 hours: ${data.ml} ÷ 24.`,
          `Calculate: ${data.ml} ÷ 24 = ${data.rate} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Liters to Milliliters",
            formula: "Liters × 1,000",
            calculation: `${data.liters} L × 1,000 = ${data.ml} mL`,
            result: `${data.ml} mL`,
          },
          {
            stepNumber: 2,
            title: "Calculate Hourly Rate",
            formula: "Total mL ÷ 24 hr",
            calculation: `${data.ml} mL ÷ 24 hr = ${data.rate} mL/hr`,
            result: `${data.rate} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "iv-pump-potassium-max-rate",
    category: "iv-pump",
    subtype: "ivpb",
    difficulty: "beginner",
    title: "Peripheral IV Potassium Infusion Rate",
    clinicalContext: "Adult Med-Surg Hypokalemia Correction",
    generate: (rng) => {
      const data = pick([
        { meq: 10, volMl: 100, hrs: 1, rate: 100 },
        { meq: 20, volMl: 250, hrs: 2, rate: 125 },
        { meq: 20, volMl: 100, hrs: 2, rate: 50 },
        { meq: 10, volMl: 50, hrs: 1, rate: 50 },
      ], rng);

      return {
        scenario: `An adult inpatient is prescribed IV potassium chloride replacement via peripheral line (maximum safe peripheral infusion rate 10 mEq/hr).`,
        orderText: `Potassium chloride ${data.meq} mEq in ${data.volMl} mL 0.9% NS IVPB over ${data.hrs} hour(s)`,
        prompt: `At what rate in mL/hr should the IV pump be programmed?`,
        correctAnswer: data.rate,
        answerUnit: "mL/hr",
        answerPrecision: 0,
        roundingInstruction: "State whole number.",
        hints: [
          "Use the formula: Volume (mL) ÷ Hours (hr).",
          `Divide ${data.volMl} mL by ${data.hrs} hr.`,
          `Calculate: ${data.volMl} ÷ ${data.hrs} = ${data.rate} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Infusion Rate",
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
    id: "iv-pump-reverse-ivpb-delivered",
    category: "iv-pump",
    subtype: "ivpb",
    difficulty: "intermediate",
    title: "Reverse IVPB Calculation: Volume Infused over Partial Minutes",
    clinicalContext: "Adult Inpatient Infusion Interruption Assessment",
    generate: (rng) => {
      const data = pick([
        { rate: 150, mins: 40, ans: 100 },
        { rate: 200, mins: 30, ans: 100 },
        { rate: 300, mins: 15, ans: 75 },
        { rate: 120, mins: 45, ans: 90 },
      ], rng);

      return {
        scenario: `An IV piggyback antibiotic running at ${data.rate} mL/hr is stopped after exactly ${data.mins} minutes due to IV site infiltration.`,
        orderText: `Infusion running at ${data.rate} mL/hr for ${data.mins} minutes`,
        prompt: `Calculate how many mL of the piggyback solution the patient received before the infusion was stopped.`,
        correctAnswer: data.ans,
        answerUnit: "mL",
        answerPrecision: 0,
        roundingInstruction: "State whole number.",
        hints: [
          `Convert ${data.mins} minutes to decimal hours: ${data.mins} ÷ 60 hr.`,
          `Multiply rate in mL/hr by elapsed hours.`,
          `Calculate: ${data.rate} × (${data.mins} ÷ 60) = ${data.ans} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Minutes to Hours",
            formula: "Minutes ÷ 60",
            calculation: `${data.mins} min ÷ 60 = ${data.mins / 60} hr`,
            result: `${data.mins / 60} hr`,
          },
          {
            stepNumber: 2,
            title: "Calculate Volume Delivered",
            formula: "Rate × Hours",
            calculation: `${data.rate} mL/hr × ${data.mins / 60} hr = ${data.ans} mL`,
            result: `${data.ans} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "iv-pump-syringe-pump-micro-rate",
    category: "iv-pump",
    subtype: "continuous-ml-hr",
    difficulty: "intermediate",
    title: "Syringe Micro-Infusion Pump Rate Calculation",
    clinicalContext: "Adult Step-Down / Telemetry Micro-Infusion",
    generate: (rng) => {
      const data = pick([
        { syringeVol: 30, hrs: 4, rate: 7.5 },
        { syringeVol: 60, hrs: 8, rate: 7.5 },
        { syringeVol: 20, hrs: 5, rate: 4.0 },
        { syringeVol: 50, hrs: 10, rate: 5.0 },
      ], rng);

      return {
        scenario: `A concentrated continuous medication in a ${data.syringeVol} mL syringe is ordered to infuse via dedicated syringe pump over ${data.hrs} hours.`,
        orderText: `Syringe ${data.syringeVol} mL continuous IV over ${data.hrs} hours`,
        prompt: `Calculate the syringe pump rate in mL/hr.`,
        correctAnswer: data.rate,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "State exact number or round to nearest tenth.",
        hints: [
          "Divide syringe volume by ordered hours.",
          `Calculate: ${data.syringeVol} mL ÷ ${data.hrs} hr.`,
          `${data.syringeVol} ÷ ${data.hrs} = ${data.rate} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Syringe Pump Rate",
            formula: "Syringe Volume ÷ Hours",
            calculation: `${data.syringeVol} mL ÷ ${data.hrs} hr = ${data.rate} mL/hr`,
            result: `${data.rate} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
];
