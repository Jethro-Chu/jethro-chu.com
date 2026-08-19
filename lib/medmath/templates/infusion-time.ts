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
        correctAnswer: data.hrs,
        answerUnit: "hours",
        answerPrecision: 0,
        roundingInstruction: "State exact whole number of hours.",
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
        correctAnswer: data.hrs,
        answerUnit: "hours",
        answerPrecision: 1,
        roundingInstruction: "Express as decimal hours rounded to the nearest tenth (e.g., 3.4).",
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
        correctAnswer: data.wholeHrs * 60 + data.remMins,
        answerUnit: "minutes",
        answerPrecision: 0,
        roundingInstruction: "Calculate total remaining minutes (e.g. 3 hr 24 min = 204 min).",
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
        correctAnswer: data.hrs,
        answerUnit: "hours",
        answerPrecision: 0,
        roundingInstruction: "State whole number of hours.",
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
        correctAnswer: data.hrs,
        answerUnit: "hours",
        answerPrecision: 1,
        roundingInstruction: "Express as decimal hours (e.g. 1.5).",
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
        correctAnswer: data.hrs,
        answerUnit: "hours",
        answerPrecision: 1,
        roundingInstruction: "Round to the nearest tenth.",
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
  {
    id: "time-total-minutes-from-rate-vol",
    category: "infusion-time",
    subtype: "total-hours",
    difficulty: "intermediate",
    title: "Small-Volume IVPB Infusion Duration in Minutes",
    clinicalContext: "Adult Inpatient Short Piggyback Infusion",
    generate: (rng) => {
      const data = pick([
        { volMl: 50, rateMlHr: 150, mins: 20 },
        { volMl: 50, rateMlHr: 100, mins: 30 },
        { volMl: 100, rateMlHr: 200, mins: 30 },
        { volMl: 100, rateMlHr: 300, mins: 20 },
        { volMl: 25, rateMlHr: 75, mins: 20 },
      ], rng);

      return {
        scenario: `An IV piggyback containing ${data.volMl} mL is programmed into an infusion pump at a rate of ${data.rateMlHr} mL/hr.`,
        orderText: `IVPB ${data.volMl} mL infusing at ${data.rateMlHr} mL/hr`,
        prompt: `How many minutes will it take for this piggyback to finish infusing?`,
        correctAnswer: data.mins,
        answerUnit: "minutes",
        answerPrecision: 0,
        roundingInstruction: "State exact whole number of minutes.",
        hints: [
          `First calculate duration in hours: ${data.volMl} mL ÷ ${data.rateMlHr} mL/hr = ${data.volMl / data.rateMlHr} hr.`,
          `Convert hours to minutes by multiplying by 60.`,
          `Calculate: (${data.volMl} ÷ ${data.rateMlHr}) × 60 = ${data.mins} minutes.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Hours",
            formula: "Volume ÷ Rate",
            calculation: `${data.volMl} mL ÷ ${data.rateMlHr} mL/hr = ${data.volMl / data.rateMlHr} hr`,
            result: `${data.volMl / data.rateMlHr} hr`,
          },
          {
            stepNumber: 2,
            title: "Convert Hours to Minutes",
            formula: "Hours × 60",
            calculation: `${data.volMl / data.rateMlHr} hr × 60 = ${data.mins} min`,
            result: `${data.mins} min`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "time-reverse-hours-rate-to-initial-vol",
    category: "infusion-time",
    subtype: "total-hours",
    difficulty: "beginner",
    title: "Reverse Time Calculation: Total Volume Infused over Elapsed Hours",
    clinicalContext: "Adult Intake Charting Reconciliation",
    generate: (rng) => {
      const data = pick([
        { rateMlHr: 125, hrs: 5.5, vol: 687.5 },
        { rateMlHr: 100, hrs: 6.5, vol: 650 },
        { rateMlHr: 75, hrs: 8.5, vol: 637.5 },
        { rateMlHr: 150, hrs: 3.5, vol: 525 },
      ], rng);

      return {
        scenario: `A continuous IV hydration line running at ${data.rateMlHr} mL/hr has been infusing continuously for ${data.hrs} hours.`,
        orderText: `0.9% NS IV at ${data.rateMlHr} mL/hr for ${data.hrs} hours`,
        prompt: `Calculate the total volume in mL that has infused into the patient.`,
        correctAnswer: data.vol,
        answerUnit: "mL",
        answerPrecision: 1,
        roundingInstruction: "State exact number or round to nearest tenth.",
        hints: [
          "To find volume infused: Rate (mL/hr) × Elapsed Time (hours).",
          `Multiply ${data.rateMlHr} mL/hr by ${data.hrs} hours.`,
          `Calculate: ${data.rateMlHr} × ${data.hrs} = ${data.vol} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Infused Volume",
            formula: "Rate (mL/hr) × Hours",
            calculation: `${data.rateMlHr} mL/hr × ${data.hrs} hr = ${data.vol} mL`,
            result: `${data.vol} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "time-multi-bag-daily-supply",
    category: "infusion-time",
    subtype: "total-hours",
    difficulty: "beginner",
    title: "24-Hour IV Bag Quantity Requirement",
    clinicalContext: "Adult Med-Surg Fluid Supply Planning",
    generate: (rng) => {
      const data = pick([
        { bagSizeMl: 1000, rateMlHr: 125, totalDailyMl: 3000, bagsNeeded: 3 },
        { bagSizeMl: 1000, rateMlHr: 100, totalDailyMl: 2400, bagsNeeded: 2.4 },
        { bagSizeMl: 1000, rateMlHr: 83.3, totalDailyMl: 2000, bagsNeeded: 2 },
        { bagSizeMl: 500, rateMlHr: 125, totalDailyMl: 3000, bagsNeeded: 6 },
      ], rng);

      return {
        scenario: `An adult medical inpatient has an IV fluid order running at ${data.rateMlHr} mL/hr around the clock. The hospital pharmacy stocks ${data.bagSizeMl} mL bags.`,
        orderText: `0.9% Normal Saline IV continuous at ${data.rateMlHr} mL/hr`,
        prompt: `Calculate the total volume in mL required over a 24-hour period.`,
        correctAnswer: data.totalDailyMl,
        answerUnit: "mL",
        answerPrecision: 0,
        roundingInstruction: "State exact whole number.",
        hints: [
          "Multiply the hourly pump rate by 24 hours to find 24-hour volume.",
          `Calculate: ${data.rateMlHr} mL/hr × 24 hr.`,
          `${data.rateMlHr} × 24 = ${data.totalDailyMl} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate 24-Hour Total Volume",
            formula: "Rate (mL/hr) × 24 Hours",
            calculation: `${data.rateMlHr} mL/hr × 24 hr = ${data.totalDailyMl} mL`,
            result: `${data.totalDailyMl} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "time-delayed-infusion-finish-clock",
    category: "infusion-time",
    subtype: "remaining-hours",
    difficulty: "intermediate",
    title: "Decimal Hours to Hours & Minutes Conversion",
    clinicalContext: "Adult Inpatient Infusion Schedule Planning",
    generate: (rng) => {
      const data = pick([
        { volRem: 750, rateMlHr: 100, decimalHrs: 7.5, wholeHrs: 7, mins: 30 },
        { volRem: 450, rateMlHr: 120, decimalHrs: 3.75, wholeHrs: 3, mins: 45 },
        { volRem: 350, rateMlHr: 140, decimalHrs: 2.5, wholeHrs: 2, mins: 30 },
        { volRem: 250, rateMlHr: 100, decimalHrs: 2.5, wholeHrs: 2, mins: 30 },
      ], rng);

      return {
        scenario: `A primary IV bag has ${data.volRem} mL remaining and is infusing at ${data.rateMlHr} mL/hr.`,
        orderText: `IV running at ${data.rateMlHr} mL/hr | Remaining: ${data.volRem} mL`,
        prompt: `How many total decimal hours remain until this bag is empty?`,
        correctAnswer: data.decimalHrs,
        answerUnit: "hours",
        answerPrecision: 2,
        roundingInstruction: "State exact decimal hours (e.g. 7.5 or 3.75).",
        hints: [
          "Formula: Remaining Volume ÷ Hourly Rate.",
          `Calculate: ${data.volRem} ÷ ${data.rateMlHr}.`,
          `${data.volRem} ÷ ${data.rateMlHr} = ${data.decimalHrs} hours (${data.wholeHrs} hr ${data.mins} min).`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Remaining Decimal Hours",
            formula: "Remaining Volume ÷ Rate",
            calculation: `${data.volRem} mL ÷ ${data.rateMlHr} mL/hr = ${data.decimalHrs} hours`,
            result: `${data.decimalHrs} hours`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "time-reverse-remaining-volume-from-time",
    category: "infusion-time",
    subtype: "remaining-hours",
    difficulty: "beginner",
    title: "Reverse Calculation: Volume from Time and Rate",
    clinicalContext: "Adult Inpatient Shift Bag Audit",
    generate: (rng) => {
      const data = pick([
        { rateMlHr: 100, remainingHrs: 2.5, remainingVol: 250 },
        { rateMlHr: 125, remainingHrs: 3.2, remainingVol: 400 },
        { rateMlHr: 75, remainingHrs: 4.0, remainingVol: 300 },
        { rateMlHr: 80, remainingHrs: 5.5, remainingVol: 440 },
      ], rng);

      return {
        scenario: `An infusion pump is running at ${data.rateMlHr} mL/hr. The pump display indicates exactly ${data.remainingHrs} hours of run time remaining.`,
        orderText: `Pump rate ${data.rateMlHr} mL/hr | Time remaining: ${data.remainingHrs} hours`,
        prompt: `Calculate the volume in mL remaining in the IV bag.`,
        correctAnswer: data.remainingVol,
        answerUnit: "mL",
        answerPrecision: 0,
        roundingInstruction: "State exact whole number.",
        hints: [
          "To find remaining volume, multiply rate by remaining hours.",
          `Formula: Rate (mL/hr) × Remaining Hours = Remaining Volume (mL).`,
          `Calculate: ${data.rateMlHr} × ${data.remainingHrs} = ${data.remainingVol} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Remaining Volume",
            formula: "Rate (mL/hr) × Remaining Hours",
            calculation: `${data.rateMlHr} mL/hr × ${data.remainingHrs} hr = ${data.remainingVol} mL`,
            result: `${data.remainingVol} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "time-infusion-completion-clock-time",
    category: "infusion-time",
    subtype: "total-hours",
    difficulty: "intermediate",
    title: "IV Infusion Military Completion Time",
    clinicalContext: "Adult Inpatient Schedule Coordination",
    generate: (rng) => {
      const data = pick([
        { startClock: "0800", startHour: 8, volMl: 1000, rateMlHr: 125, durationHrs: 8, finishHour: 16, finishClock: "1600" },
        { startClock: "0700", startHour: 7, volMl: 1000, rateMlHr: 100, durationHrs: 10, finishHour: 17, finishClock: "1700" },
        { startClock: "0600", startHour: 6, volMl: 500, rateMlHr: 125, durationHrs: 4, finishHour: 10, finishClock: "1000" },
        { startClock: "1200", startHour: 12, volMl: 500, rateMlHr: 100, durationHrs: 5, finishHour: 17, finishClock: "1700" },
      ], rng);

      return {
        scenario: `A primary IV infusion of ${data.volMl} mL is initiated at ${data.startClock} military time at a rate of ${data.rateMlHr} mL/hr.`,
        orderText: `Start ${data.volMl} mL 0.9% NS IV at ${data.startClock} at ${data.rateMlHr} mL/hr`,
        prompt: `How many total hours will this infusion take to complete?`,
        correctAnswer: data.durationHrs,
        answerUnit: "hours",
        answerPrecision: 0,
        roundingInstruction: "State exact whole number of hours.",
        hints: [
          "Formula: Total Volume ÷ Rate.",
          `Divide ${data.volMl} mL by ${data.rateMlHr} mL/hr.`,
          `Calculate: ${data.volMl} ÷ ${data.rateMlHr} = ${data.durationHrs} hours (completes at ${data.finishClock}).`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Total Infusion Duration",
            formula: "Volume ÷ Rate",
            calculation: `${data.volMl} mL ÷ ${data.rateMlHr} mL/hr = ${data.durationHrs} hours`,
            result: `${data.durationHrs} hours`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "time-volume-consumed-after-hours",
    category: "infusion-time",
    subtype: "total-hours",
    difficulty: "beginner",
    title: "Partial Shift Volume Delivery Calculation",
    clinicalContext: "Adult Intake and Output Charting",
    generate: (rng) => {
      const data = pick([
        { initialBagMl: 1000, rateMlHr: 125, hoursRun: 4, volumeInfused: 500, volumeLeft: 500 },
        { initialBagMl: 1000, rateMlHr: 80, hoursRun: 5, volumeInfused: 400, volumeLeft: 600 },
        { initialBagMl: 1000, rateMlHr: 100, hoursRun: 3, volumeInfused: 300, volumeLeft: 700 },
        { initialBagMl: 500, rateMlHr: 75, hoursRun: 4, volumeInfused: 300, volumeLeft: 200 },
      ], rng);

      return {
        scenario: `A ${data.initialBagMl} mL IV bag has been running at ${data.rateMlHr} mL/hr for exactly ${data.hoursRun} hours.`,
        orderText: `0.9% NS IV at ${data.rateMlHr} mL/hr for ${data.hoursRun} hours`,
        prompt: `How many mL remain in the IV bag?`,
        correctAnswer: data.volumeLeft,
        answerUnit: "mL",
        answerPrecision: 0,
        roundingInstruction: "State exact whole number.",
        hints: [
          `First find volume infused: ${data.rateMlHr} mL/hr × ${data.hoursRun} hr = ${data.volumeInfused} mL.`,
          `Subtract from starting volume: ${data.initialBagMl} mL - ${data.volumeInfused} mL = ${data.volumeLeft} mL.`,
          `Calculate: ${data.initialBagMl} - (${data.rateMlHr} × ${data.hoursRun}) = ${data.volumeLeft} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Infused Volume",
            formula: "Rate × Hours",
            calculation: `${data.rateMlHr} mL/hr × ${data.hoursRun} hr = ${data.volumeInfused} mL`,
            result: `${data.volumeInfused} mL`,
          },
          {
            stepNumber: 2,
            title: "Calculate Remaining Volume",
            formula: "Initial Volume - Infused Volume",
            calculation: `${data.initialBagMl} mL - ${data.volumeInfused} mL = ${data.volumeLeft} mL`,
            result: `${data.volumeLeft} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
];
