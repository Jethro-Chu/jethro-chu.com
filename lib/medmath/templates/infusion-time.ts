import type { QuestionTemplate } from "../types.ts";
import { pick } from "./helpers.ts";

export const infusionTimeTemplates: QuestionTemplate[] = [
  {
    id: "time-total-hours-even",
    category: "infusion-time",
    subtype: "total-hours",
    difficulty: "beginner",
    title: "Total Infusion Duration (Even Hours)",
    clinicalContext: "Adult Inpatient Fluid Management",
    generate: (rng) => {
      const data = pick([
        { volMl: 1000, rateMlHr: 125, hrs: 8 },
        { volMl: 1000, rateMlHr: 100, hrs: 10 },
        { volMl: 500, rateMlHr: 125, hrs: 4 },
        { volMl: 500, rateMlHr: 100, hrs: 5 },
        { volMl: 250, rateMlHr: 125, hrs: 2 },
        { volMl: 1000, rateMlHr: 200, hrs: 5 },
      ], rng);

      return {
        scenario: `An IV bag containing ${data.volMl} mL 0.9% Normal Saline is infusing at ${data.rateMlHr} mL/hr on an electronic infusion pump.`,
        orderText: `Infuse ${data.volMl} mL NS at ${data.rateMlHr} mL/hr`,
        prompt: `How many total hours will it take for the infusion to complete?`,
        expectedAnswer: data.hrs,
        expectedUnit: "hours",
        roundingMode: "whole",
        roundingInstruction: "State exact whole number of hours.",
        tolerance: 0.05,
        hints: [
          "Use the formula: Time (hours) = Total Volume (mL) ÷ Infusion Rate (mL/hr).",
          `Divide ${data.volMl} mL by ${data.rateMlHr} mL/hr.`,
          `Calculate: ${data.volMl} ÷ ${data.rateMlHr} = ${data.hrs} hours.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Total Hours",
            formula: "Volume (mL) ÷ Rate (mL/hr)",
            calculation: `${data.volMl} mL ÷ ${data.rateMlHr} mL/hr = ${data.hrs} hours`,
            result: `${data.hrs} hours`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "time-remaining-decimal-hrs",
    category: "infusion-time",
    subtype: "remaining-hours",
    difficulty: "intermediate",
    title: "IV Bag Remaining Infusion Time (Decimal Hours)",
    clinicalContext: "Adult Med-Surg Shift Change Assessment",
    generate: (rng) => {
      const data = pick([
        { volRem: 425, rateMlHr: 125, hrs: 3.4 },
        { volRem: 350, rateMlHr: 100, hrs: 3.5 },
        { volRem: 650, rateMlHr: 125, hrs: 5.2 },
        { volRem: 225, rateMlHr: 75, hrs: 3.0 },
        { volRem: 480, rateMlHr: 80, hrs: 6.0 },
      ], rng);

      return {
        scenario: `During shift change bedside handover, the nurse checks the IV pump and notes ${data.volRem} mL remaining in the primary fluid bag. The pump is running at ${data.rateMlHr} mL/hr.`,
        orderText: `IV running at ${data.rateMlHr} mL/hr with ${data.volRem} mL remaining in bag`,
        prompt: `How many hours of infusion time remain?`,
        expectedAnswer: data.hrs,
        expectedUnit: "hours",
        roundingMode: "tenth",
        roundingInstruction: "Express as decimal hours rounded to the nearest tenth (e.g., 3.4).",
        tolerance: 0.05,
        hints: [
          "Formula: Hours Remaining = Volume Remaining (mL) ÷ Rate (mL/hr).",
          `Divide ${data.volRem} mL remaining by ${data.rateMlHr} mL/hr.`,
          `Calculate: ${data.volRem} ÷ ${data.rateMlHr} = ${data.hrs} hours.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Remaining Hours",
            formula: "Volume Remaining ÷ Rate",
            calculation: `${data.volRem} mL ÷ ${data.rateMlHr} mL/hr = ${data.hrs} hours`,
            result: `${data.hrs} hours`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "time-remaining-hours-minutes",
    category: "infusion-time",
    subtype: "hours-and-minutes",
    difficulty: "intermediate",
    title: "IV Remaining Time in Hours and Minutes",
    clinicalContext: "Adult Step-Down IV Monitoring",
    generate: (rng) => {
      const data = pick([
        { volRem: 425, rateMlHr: 125, rawHrs: 3.4, wholeHrs: 3, remMins: 24 },
        { volRem: 375, rateMlHr: 100, rawHrs: 3.75, wholeHrs: 3, remMins: 45 },
        { volRem: 250, rateMlHr: 100, rawHrs: 2.5, wholeHrs: 2, remMins: 30 },
        { volRem: 550, rateMlHr: 125, rawHrs: 4.4, wholeHrs: 4, remMins: 24 },
      ], rng);

      return {
        scenario: `An IV infusion bag has ${data.volRem} mL remaining and is infusing at ${data.rateMlHr} mL/hr. The oncoming nurse needs to plan the exact time for the next bag change.`,
        orderText: `Infusion rate: ${data.rateMlHr} mL/hr | Volume remaining: ${data.volRem} mL`,
        prompt: `How many hours and minutes remain before the IV bag is empty? (Enter total remaining minutes).`,
        expectedAnswer: data.wholeHrs * 60 + data.remMins,
        expectedUnit: "minutes",
        roundingMode: "whole",
        roundingInstruction: "Calculate total remaining minutes (e.g. 3 hr 24 min = 204 min).",
        tolerance: 1,
        hints: [
          `First divide remaining volume by rate: ${data.volRem} ÷ ${data.rateMlHr} = ${data.rawHrs} hours.`,
          `Convert ${data.rawHrs} hours to total minutes by multiplying by 60: ${data.rawHrs} × 60.`,
          `Calculate: ${data.rawHrs} × 60 = ${data.wholeHrs * 60 + data.remMins} minutes (${data.wholeHrs} hr ${data.remMins} min).`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Decimal Hours",
            formula: "Volume Remaining ÷ Rate",
            calculation: `${data.volRem} mL ÷ ${data.rateMlHr} mL/hr = ${data.rawHrs} hours`,
            result: `${data.rawHrs} hours`,
          },
          {
            stepNumber: 2,
            title: "Convert to Total Minutes and Hours/Minutes",
            formula: "Decimal Hours × 60 min",
            calculation: `${data.rawHrs} hr × 60 = ${data.wholeHrs * 60 + data.remMins} min (${data.wholeHrs} hr ${data.remMins} min)`,
            result: `${data.wholeHrs * 60 + data.remMins} minutes`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "time-ivpb-finish",
    category: "infusion-time",
    subtype: "total-hours",
    difficulty: "beginner",
    title: "Secondary Antibiotic Infusion Duration",
    clinicalContext: "Adult Med-Surg Extended Antibiotic Protocol",
    generate: (rng) => {
      const data = pick([
        { med: "Vancomycin 1,000 mg", volMl: 250, rateMlHr: 125, hrs: 2 },
        { med: "Vancomycin 1,500 mg", volMl: 500, rateMlHr: 250, hrs: 2 },
        { med: "Piperacillin/Tazobactam 3.375 g", volMl: 100, rateMlHr: 25, hrs: 4 },
        { med: "Cefepime 2 g", volMl: 100, rateMlHr: 50, hrs: 2 },
      ], rng);

      return {
        scenario: `An extended-infusion antibiotic is programmed on the primary infusion pump.`,
        orderText: `${data.med} in ${data.volMl} mL NS infusing at ${data.rateMlHr} mL/hr`,
        prompt: `How many hours will this antibiotic infusion run?`,
        expectedAnswer: data.hrs,
        expectedUnit: "hours",
        roundingMode: "whole",
        roundingInstruction: "State whole number of hours.",
        tolerance: 0.05,
        hints: [
          "Use the formula: Duration = Volume (mL) ÷ Rate (mL/hr).",
          `Divide ${data.volMl} mL by ${data.rateMlHr} mL/hr.`,
          `Calculate: ${data.volMl} ÷ ${data.rateMlHr} = ${data.hrs} hours.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Run Time",
            formula: "Volume ÷ Rate",
            calculation: `${data.volMl} mL ÷ ${data.rateMlHr} mL/hr = ${data.hrs} hours`,
            result: `${data.hrs} hours`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "time-blood-remaining",
    category: "infusion-time",
    subtype: "remaining-hours",
    difficulty: "beginner",
    title: "Blood Transfusion Remaining Run Time",
    clinicalContext: "Adult PRBC Transfusion Monitoring",
    generate: (rng) => {
      const data = pick([
        { volRem: 150, rateMlHr: 100, hrs: 1.5 },
        { volRem: 200, rateMlHr: 100, hrs: 2.0 },
        { volRem: 120, rateMlHr: 80, hrs: 1.5 },
        { volRem: 210, rateMlHr: 140, hrs: 1.5 },
      ], rng);

      return {
        scenario: `A unit of Packed Red Blood Cells is actively infusing at ${data.rateMlHr} mL/hr. The nurse checks the bag volume and sees ${data.volRem} mL remaining.`,
        orderText: `PRBC transfusion running at ${data.rateMlHr} mL/hr | Volume remaining: ${data.volRem} mL`,
        prompt: `How many hours remain until the blood transfusion is complete?`,
        expectedAnswer: data.hrs,
        expectedUnit: "hours",
        roundingMode: "tenth",
        roundingInstruction: "Express as decimal hours (e.g. 1.5).",
        tolerance: 0.05,
        hints: [
          "Formula: Volume remaining ÷ Rate.",
          `Divide ${data.volRem} mL by ${data.rateMlHr} mL/hr.`,
          `Calculate: ${data.volRem} ÷ ${data.rateMlHr} = ${data.hrs} hours.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Remaining Time",
            formula: "Volume ÷ Rate",
            calculation: `${data.volRem} mL ÷ ${data.rateMlHr} mL/hr = ${data.hrs} hours`,
            result: `${data.hrs} hours`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "time-overnight-bag-change",
    category: "infusion-time",
    subtype: "remaining-hours",
    difficulty: "intermediate",
    title: "Overnight Continuous IV Run Time Estimation",
    clinicalContext: "Adult Inpatient Night Shift Hydration",
    generate: (rng) => {
      const data = pick([
        { volRem: 650, rateMlHr: 75, hrs: 8.7 },
        { volRem: 500, rateMlHr: 60, hrs: 8.3 },
        { volRem: 700, rateMlHr: 80, hrs: 8.8 },
        { volRem: 600, rateMlHr: 75, hrs: 8.0 },
      ], rng);

      return {
        scenario: `At 2300, the night nurse notes ${data.volRem} mL remaining in the patient's continuous IV bag infusing at ${data.rateMlHr} mL/hr.`,
        orderText: `0.9% Normal Saline at ${data.rateMlHr} mL/hr | Volume remaining: ${data.volRem} mL`,
        prompt: `Calculate the hours remaining before this bag runs dry.`,
        expectedAnswer: data.hrs,
        expectedUnit: "hours",
        roundingMode: "tenth",
        roundingInstruction: "Round to the nearest tenth.",
        tolerance: 0.1,
        hints: [
          "Formula: Hours = Remaining Volume ÷ Infusion Rate.",
          `Divide ${data.volRem} mL by ${data.rateMlHr} mL/hr.`,
          `Calculate: ${data.volRem} ÷ ${data.rateMlHr} = ${data.hrs} hours.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Remaining Hours",
            formula: "Volume ÷ Rate",
            calculation: `${data.volRem} mL ÷ ${data.rateMlHr} mL/hr = ${data.hrs} hours`,
            result: `${data.hrs} hours`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
];
