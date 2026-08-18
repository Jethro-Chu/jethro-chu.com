import type { QuestionTemplate } from "../types.ts";
import { pick } from "./helpers.ts";

export const concentrationTemplates: QuestionTemplate[] = [
  {
    id: "conc-mg-ml-simple",
    category: "concentrations",
    subtype: "bag-concentration",
    difficulty: "beginner",
    title: "IV Bag Concentration in mg/mL",
    clinicalContext: "Adult Inpatient IV Preparation",
    generate: (rng) => {
      const data = pick([
        { med: "Medication", totalMg: 400, bagMl: 250, concMgMl: 1.6 },
        { med: "Amiodarone", totalMg: 450, bagMl: 250, concMgMl: 1.8 },
        { med: "Diltiazem", totalMg: 125, bagMl: 100, concMgMl: 1.25 },
        { med: "Nicardipine", totalMg: 25, bagMl: 250, concMgMl: 0.1 },
        { med: "Lidocaine", totalMg: 1000, bagMl: 250, concMgMl: 4 },
      ], rng);

      return {
        scenario: `The pharmacy delivers an IV infusion bag containing ${data.totalMg} mg of ${data.med} in ${data.bagMl} mL solution.`,
        orderText: `${data.med} ${data.totalMg} mg in ${data.bagMl} mL solution`,
        prompt: `What is the concentration of the medication in mg/mL?`,
        expectedAnswer: data.concMgMl,
        expectedUnit: "mg/mL",
        roundingMode: "hundredth",
        roundingInstruction: "Round to nearest tenth or hundredth (e.g. 1.6 or 1.25).",
        tolerance: 0.05,
        hints: [
          "Use the formula: Concentration (mg/mL) = Total Milligrams ÷ Total Volume (mL).",
          `Divide ${data.totalMg} mg by ${data.bagMl} mL.`,
          `Calculate: ${data.totalMg} ÷ ${data.bagMl} = ${data.concMgMl} mg/mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Concentration",
            formula: "Total Milligrams ÷ Total Milliliters",
            calculation: `${data.totalMg} mg ÷ ${data.bagMl} mL = ${data.concMgMl} mg/mL`,
            result: `${data.concMgMl} mg/mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "conc-mcg-ml-vasopressor",
    category: "concentrations",
    subtype: "bag-concentration",
    difficulty: "beginner",
    title: "Vasopressor IV Bag Concentration in mcg/mL",
    clinicalContext: "Adult Critical Care Infusion Setup",
    generate: (rng) => {
      const data = pick([
        { med: "Norepinephrine", totalMg: 4, bagMl: 250, totalMcg: 4000, concMcgMl: 16 },
        { med: "Norepinephrine", totalMg: 8, bagMl: 250, totalMcg: 8000, concMcgMl: 32 },
        { med: "Epinephrine", totalMg: 4, bagMl: 250, totalMcg: 4000, concMcgMl: 16 },
        { med: "Phenylephrine", totalMg: 20, bagMl: 250, totalMcg: 20000, concMcgMl: 80 },
        { med: "Nitroglycerin", totalMg: 50, bagMl: 250, totalMcg: 50000, concMcgMl: 200 },
      ], rng);

      return {
        scenario: `The nurse is preparing to program a vasoactive drip. The bag contains ${data.totalMg} mg of ${data.med} diluted in ${data.bagMl} mL D5W.`,
        orderText: `${data.med} ${data.totalMg} mg in ${data.bagMl} mL IV solution`,
        prompt: `Calculate the final drug concentration in mcg/mL.`,
        expectedAnswer: data.concMcgMl,
        expectedUnit: "mcg/mL",
        roundingMode: "whole",
        roundingInstruction: "State whole number of mcg/mL.",
        tolerance: 0.1,
        hints: [
          `Step 1: Convert ${data.totalMg} mg to mcg by multiplying by 1,000 (${data.totalMg} × 1,000 = ${data.totalMcg} mcg).`,
          `Step 2: Divide total mcg by bag volume: ${data.totalMcg} mcg ÷ ${data.bagMl} mL.`,
          `Calculate: ${data.totalMcg} ÷ ${data.bagMl} = ${data.concMcgMl} mcg/mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Milligrams to Micrograms",
            formula: "mg × 1,000",
            calculation: `${data.totalMg} mg × 1,000 = ${data.totalMcg} mcg`,
            result: `${data.totalMcg} mcg`,
          },
          {
            stepNumber: 2,
            title: "Calculate Concentration (mcg/mL)",
            formula: "Total mcg ÷ Bag Volume (mL)",
            calculation: `${data.totalMcg} mcg ÷ ${data.bagMl} mL = ${data.concMcgMl} mcg/mL`,
            result: `${data.concMcgMl} mcg/mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "conc-subsequent-rate-calc",
    category: "concentrations",
    subtype: "titration-rate",
    difficulty: "intermediate",
    title: "Concentration to Infusion Rate Calculation",
    clinicalContext: "Adult Inpatient Medication Infusion",
    generate: (rng) => {
      const data = pick([
        { med: "Aminophylline", totalMg: 500, bagMl: 250, concMgMl: 2, orderedMgHr: 50, rateMlHr: 25 },
        { med: "Aminophylline", totalMg: 500, bagMl: 250, concMgMl: 2, orderedMgHr: 40, rateMlHr: 20 },
        { med: "Procainamide", totalMg: 1000, bagMl: 250, concMgMl: 4, orderedMgHr: 120, rateMlHr: 30 },
        { med: "Labetalol", totalMg: 200, bagMl: 200, concMgMl: 1, orderedMgHr: 20, rateMlHr: 20 },
      ], rng);

      return {
        scenario: `An adult inpatient has an order for a continuous IV infusion. The IV bag contains ${data.totalMg} mg in ${data.bagMl} mL. The physician orders ${data.orderedMgHr} mg/hr.`,
        orderText: `${data.med} continuous IV infusion at ${data.orderedMgHr} mg/hr`,
        availableText: `${data.med} ${data.totalMg} mg in ${data.bagMl} mL NS (${data.concMgMl} mg/mL)`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        expectedAnswer: data.rateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "whole",
        roundingInstruction: "State whole number.",
        tolerance: 0.1,
        hints: [
          `Step 1: Determine concentration: ${data.totalMg} mg ÷ ${data.bagMl} mL = ${data.concMgMl} mg/mL.`,
          `Step 2: Use formula: Ordered mg/hr ÷ Concentration (mg/mL).`,
          `Calculate: ${data.orderedMgHr} mg/hr ÷ ${data.concMgMl} mg/mL = ${data.rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Determine Drug Concentration",
            formula: "Total mg ÷ Total mL",
            calculation: `${data.totalMg} mg ÷ ${data.bagMl} mL = ${data.concMgMl} mg/mL`,
            result: `${data.concMgMl} mg/mL`,
          },
          {
            stepNumber: 2,
            title: "Calculate Pump Rate",
            formula: "Ordered mg/hr ÷ Concentration (mg/mL)",
            calculation: `${data.orderedMgHr} mg/hr ÷ ${data.concMgMl} mg/mL = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "conc-lidocaine-antiarrhythmic",
    category: "concentrations",
    subtype: "titration-rate",
    difficulty: "intermediate",
    title: "Lidocaine Drip Concentration & Rate (mg/min to mL/hr)",
    clinicalContext: "Adult CCU Ventricular Ectopy Protocol",
    generate: (rng) => {
      const data = pick([
        { totalGrams: 2, totalMg: 2000, bagMl: 500, concMgMl: 4, doseMgMin: 2, doseMgHr: 120, rateMlHr: 30 },
        { totalGrams: 2, totalMg: 2000, bagMl: 500, concMgMl: 4, doseMgMin: 1, doseMgHr: 60, rateMlHr: 15 },
        { totalGrams: 1, totalMg: 1000, bagMl: 250, concMgMl: 4, doseMgMin: 3, doseMgHr: 180, rateMlHr: 45 },
        { totalGrams: 2, totalMg: 2000, bagMl: 500, concMgMl: 4, doseMgMin: 4, doseMgHr: 240, rateMlHr: 60 },
      ], rng);

      return {
        scenario: `An adult coronary care unit patient with frequent ventricular arrhythmias is started on a continuous lidocaine maintenance drip.`,
        orderText: `Lidocaine IV infusion at ${data.doseMgMin} mg/min`,
        availableText: `Lidocaine ${data.totalGrams} g in ${data.bagMl} mL D5W (${data.concMgMl} mg/mL)`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        expectedAnswer: data.rateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "whole",
        roundingInstruction: "State whole number.",
        tolerance: 0.1,
        hints: [
          `Step 1: Convert ${data.totalGrams} g to milligrams: ${data.totalGrams} g = ${data.totalMg} mg.`,
          `Step 2: Concentration: ${data.totalMg} mg ÷ ${data.bagMl} mL = ${data.concMgMl} mg/mL.`,
          `Step 3: Convert ${data.doseMgMin} mg/min to mg/hr: ${data.doseMgMin} × 60 = ${data.doseMgHr} mg/hr, then divide by ${data.concMgMl} = ${data.rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Determine Drug Concentration",
            formula: "Total mg ÷ Total mL",
            calculation: `${data.totalMg} mg ÷ ${data.bagMl} mL = ${data.concMgMl} mg/mL`,
            result: `${data.concMgMl} mg/mL`,
          },
          {
            stepNumber: 2,
            title: "Convert Minute Dose to Hourly Dose",
            formula: "mg/min × 60",
            calculation: `${data.doseMgMin} mg/min × 60 = ${data.doseMgHr} mg/hr`,
            result: `${data.doseMgHr} mg/hr`,
          },
          {
            stepNumber: 3,
            title: "Calculate Flow Rate",
            formula: "Hourly mg ÷ Concentration (mg/mL)",
            calculation: `${data.doseMgHr} mg/hr ÷ ${data.concMgMl} mg/mL = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "conc-percentage-lidocaine",
    category: "concentrations",
    subtype: "percentage-solution",
    difficulty: "beginner",
    title: "Percentage Solution to mg/mL Conversion",
    clinicalContext: "Adult Procedural Local Anesthesia",
    generate: (rng) => {
      const data = pick([
        { percent: 1, mgPerMl: 10, volMl: 10, totalMg: 100 },
        { percent: 2, mgPerMl: 20, volMl: 10, totalMg: 200 },
        { percent: 0.5, mgPerMl: 5, volMl: 20, totalMg: 100 },
        { percent: 2, mgPerMl: 20, volMl: 5, totalMg: 100 },
      ], rng);

      return {
        scenario: `A provider is preparing to infiltrate local anesthesia prior to suturing an adult laceration. The vial is labeled ${data.percent}% Lidocaine.`,
        orderText: `${data.percent}% Lidocaine injection (${data.volMl} mL vial)`,
        prompt: `How many mg of lidocaine are in 1 mL of a ${data.percent}% solution?`,
        expectedAnswer: data.mgPerMl,
        expectedUnit: "mg/mL",
        roundingMode: "whole",
        roundingInstruction: "Recall standard rule: 1% solution = 1 g/100 mL = 10 mg/mL.",
        tolerance: 0.05,
        hints: [
          "Recall the clinical rule: A 1% solution contains 1 gram per 100 mL, which equals 10 mg/mL.",
          `Multiply the percentage (${data.percent}) by 10 to find mg/mL.`,
          `Calculate: ${data.percent} × 10 = ${data.mgPerMl} mg/mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Percentage Solution Rule",
            formula: "Percent (%) × 10 = mg/mL",
            calculation: `${data.percent}% × 10 = ${data.mgPerMl} mg/mL`,
            result: `${data.mgPerMl} mg/mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "conc-dextrose-percentage-d50",
    category: "concentrations",
    subtype: "percentage-solution",
    difficulty: "intermediate",
    title: "Dextrose 50% (D50W) Hyperglycemic Rescue Grams",
    clinicalContext: "Adult Inpatient Severe Hypoglycemia Protocol",
    generate: (rng) => {
      const data = pick([
        { percent: 50, volMl: 50, gramsPerMl: 0.5, totalGrams: 25 },
        { percent: 50, volMl: 25, gramsPerMl: 0.5, totalGrams: 12.5 },
        { percent: 10, volMl: 500, gramsPerMl: 0.1, totalGrams: 50 },
        { percent: 5, volMl: 1000, gramsPerMl: 0.05, totalGrams: 50 },
      ], rng);

      return {
        scenario: `An adult inpatient with symptomatic severe hypoglycemia (BG 38 mg/dL) is administered IV ${data.percent}% Dextrose.`,
        orderText: `Administer ${data.volMl} mL D${data.percent}W IV push stat`,
        availableText: `Dextrose ${data.percent}% (${data.volMl} mL prefilled syringe)`,
        prompt: `How many total grams of dextrose are delivered in ${data.volMl} mL of D${data.percent}W?`,
        expectedAnswer: data.totalGrams,
        expectedUnit: "g",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth or whole number.",
        tolerance: 0.05,
        hints: [
          `Recall: ${data.percent}% means ${data.percent} grams per 100 mL (${data.gramsPerMl} g/mL).`,
          `Multiply ${data.volMl} mL by ${data.gramsPerMl} g/mL.`,
          `Calculate: ${data.volMl} × ${data.gramsPerMl} = ${data.totalGrams} g.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Determine Grams per mL",
            formula: "Percent ÷ 100 = g/mL",
            calculation: `${data.percent} g ÷ 100 mL = ${data.gramsPerMl} g/mL`,
            result: `${data.gramsPerMl} g/mL`,
          },
          {
            stepNumber: 2,
            title: "Calculate Total Grams Administered",
            formula: "Volume (mL) × g/mL",
            calculation: `${data.volMl} mL × ${data.gramsPerMl} g/mL = ${data.totalGrams} g`,
            result: `${data.totalGrams} g`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "conc-morphine-pca-volume",
    category: "concentrations",
    subtype: "pca-concentration",
    difficulty: "beginner",
    title: "Patient-Controlled Analgesia (PCA) Demand Dose Volume",
    clinicalContext: "Adult Post-Operative PCA Protocol",
    generate: (rng) => {
      const data = pick([
        { med: "Morphine", totalMg: 100, bagMl: 100, concMgMl: 1, demandDoseMg: 1, doseMl: 1 },
        { med: "Morphine", totalMg: 100, bagMl: 100, concMgMl: 1, demandDoseMg: 0.5, doseMl: 0.5 },
        { med: "Hydromorphone", totalMg: 30, bagMl: 30, concMgMl: 1, demandDoseMg: 0.2, doseMl: 0.2 },
        { med: "Hydromorphone", totalMg: 15, bagMl: 30, concMgMl: 0.5, demandDoseMg: 0.25, doseMl: 0.5 },
      ], rng);

      return {
        scenario: `An adult post-operative patient is placed on IV Patient-Controlled Analgesia (PCA).`,
        orderText: `${data.med} PCA demand dose: ${data.demandDoseMg} mg every 10 minutes PRN with lockout`,
        availableText: `${data.med} prefilled cartridge: ${data.totalMg} mg in ${data.bagMl} mL (${data.concMgMl} mg/mL)`,
        prompt: `How many mL will the PCA pump deliver for each patient-initiated demand dose?`,
        expectedAnswer: data.doseMl,
        expectedUnit: "mL",
        roundingMode: "tenth",
        roundingInstruction: "State exact or rounded to nearest tenth.",
        tolerance: 0.05,
        hints: [
          `Step 1: Check concentration: ${data.totalMg} mg ÷ ${data.bagMl} mL = ${data.concMgMl} mg/mL.`,
          `Step 2: Apply formula: Demand Dose (mg) ÷ Concentration (mg/mL).`,
          `Calculate: ${data.demandDoseMg} mg ÷ ${data.concMgMl} mg/mL = ${data.doseMl} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Determine PCA Concentration",
            formula: "Total mg ÷ Total mL",
            calculation: `${data.totalMg} mg ÷ ${data.bagMl} mL = ${data.concMgMl} mg/mL`,
            result: `${data.concMgMl} mg/mL`,
          },
          {
            stepNumber: 2,
            title: "Calculate Demand Volume",
            formula: "Demand Dose (mg) ÷ Concentration (mg/mL)",
            calculation: `${data.demandDoseMg} mg ÷ ${data.concMgMl} mg/mL = ${data.doseMl} mL`,
            result: `${data.doseMl} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "conc-reverse-drug-delivered",
    category: "concentrations",
    subtype: "titration-rate",
    difficulty: "intermediate",
    title: "Determine Drug Amount Delivered in 24 Hours",
    clinicalContext: "Adult Med-Surg Total Daily Dose Audit",
    generate: (rng) => {
      const data = pick([
        { med: "Pantoprazole", concValue: 0.8, unit: "mg", rateMlHr: 10, dailyMl: 240, dailyDose: 192 },
        { med: "Octreotide", concValue: 10, unit: "mcg", rateMlHr: 5, dailyMl: 120, dailyDose: 1200 },
        { med: "Furosemide", concValue: 1, unit: "mg", rateMlHr: 10, dailyMl: 240, dailyDose: 240 },
        { med: "Epoprostenol", concValue: 20, unit: "mcg", rateMlHr: 4, dailyMl: 96, dailyDose: 1920 },
      ], rng);

      return {
        scenario: `A continuous IV infusion of ${data.med} is running at ${data.rateMlHr} mL/hr. The concentration is ${data.concValue} ${data.unit}/mL.`,
        orderText: `${data.med} IV continuous infusion running at ${data.rateMlHr} mL/hr for 24 hours`,
        availableText: `Concentration: ${data.concValue} ${data.unit}/mL`,
        prompt: `How many total ${data.unit} will the patient receive over a full 24-hour period?`,
        expectedAnswer: data.dailyDose,
        expectedUnit: data.unit,
        roundingMode: "whole",
        roundingInstruction: "State whole number.",
        tolerance: 0.1,
        hints: [
          `Step 1: Calculate total volume delivered in 24 hours: ${data.rateMlHr} mL/hr × 24 hr = ${data.dailyMl} mL.`,
          `Step 2: Multiply total volume by concentration (${data.concValue} ${data.unit}/mL).`,
          `Calculate: ${data.dailyMl} mL × ${data.concValue} ${data.unit}/mL = ${data.dailyDose} ${data.unit}.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate 24-Hour Total Volume",
            formula: "Rate (mL/hr) × 24 hr",
            calculation: `${data.rateMlHr} mL/hr × 24 hr = ${data.dailyMl} mL`,
            result: `${data.dailyMl} mL`,
          },
          {
            stepNumber: 2,
            title: "Calculate Total Drug Delivered",
            formula: "Volume × Concentration",
            calculation: `${data.dailyMl} mL × ${data.concValue} ${data.unit}/mL = ${data.dailyDose} ${data.unit}`,
            result: `${data.dailyDose} ${data.unit}`,
          },
        ],
        rawVariables: { med: data.med, concValue: data.concValue, unit: data.unit, rateMlHr: data.rateMlHr, dailyMl: data.dailyMl, dailyDose: data.dailyDose },
      };
    },
  },
];
