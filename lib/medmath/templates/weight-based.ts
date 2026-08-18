import type { QuestionTemplate } from "../types.ts";
import { pick, ADULT_WEIGHTS_LB, ADULT_WEIGHTS_KG } from "./helpers.ts";

export const weightBasedTemplates: QuestionTemplate[] = [
  {
    id: "wt-cefazolin-mg-kg-lb",
    category: "weight-based",
    subtype: "mg-kg-dose",
    difficulty: "intermediate",
    title: "Weight-Based Antibiotic Dose (Pounds to Kilograms)",
    clinicalContext: "Adult Perioperative Surgical Prophylaxis",
    generate: (rng) => {
      const weightPair = pick(ADULT_WEIGHTS_LB, rng);
      const doseMgPerKg = pick([20, 25, 30], rng);
      const totalMg = weightPair.kg * doseMgPerKg;

      return {
        scenario: `An adult pre-operative patient weighing ${weightPair.lb} lb is ordered prophylactic IV cefazolin prior to orthopedic surgery.`,
        orderText: `Cefazolin ${doseMgPerKg} mg/kg IV 30 minutes prior to surgical incision`,
        patientWeightLb: weightPair.lb,
        patientWeightKg: weightPair.kg,
        prompt: `Calculate the total ordered dose in mg.`,
        expectedAnswer: totalMg,
        expectedUnit: "mg",
        roundingMode: "whole",
        roundingInstruction: "Round to nearest whole number if necessary.",
        tolerance: 0.1,
        hints: [
          `Step 1: Convert weight in pounds to kilograms: ${weightPair.lb} lb ÷ 2.2 = ${weightPair.kg} kg.`,
          `Step 2: Multiply weight by ordered dose: ${weightPair.kg} kg × ${doseMgPerKg} mg/kg.`,
          `Calculate: ${weightPair.kg} × ${doseMgPerKg} = ${totalMg} mg.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Weight (lb to kg)",
            formula: "Weight (lb) ÷ 2.2",
            calculation: `${weightPair.lb} lb ÷ 2.2 = ${weightPair.kg} kg`,
            result: `${weightPair.kg} kg`,
          },
          {
            stepNumber: 2,
            title: "Calculate Total Dose",
            formula: "Weight (kg) × Dose (mg/kg)",
            calculation: `${weightPair.kg} kg × ${doseMgPerKg} mg/kg = ${totalMg} mg`,
            result: `${totalMg} mg`,
          },
        ],
        rawVariables: { lb: weightPair.lb, kg: weightPair.kg, doseMgPerKg, totalMg },
      };
    },
  },
  {
    id: "wt-vancomycin-mg-kg",
    category: "weight-based",
    subtype: "mg-kg-dose",
    difficulty: "beginner",
    title: "Weight-Based Vancomycin Dose (Metric Weight)",
    clinicalContext: "Adult Inpatient MRSA Protocol",
    generate: (rng) => {
      const weightKg = pick(ADULT_WEIGHTS_KG, rng);
      const doseMgPerKg = pick([15, 20], rng);
      const totalMg = weightKg * doseMgPerKg;

      return {
        scenario: `An adult inpatient weighing ${weightKg} kg has a target weight-based vancomycin order for serious gram-positive infection.`,
        orderText: `Vancomycin ${doseMgPerKg} mg/kg IV every 12 hours`,
        patientWeightKg: weightKg,
        prompt: `Calculate the ordered single dose in mg.`,
        expectedAnswer: totalMg,
        expectedUnit: "mg",
        roundingMode: "whole",
        roundingInstruction: "State whole number of mg.",
        tolerance: 0.1,
        hints: [
          "Weight is already in kilograms.",
          `Multiply patient weight (${weightKg} kg) by dose (${doseMgPerKg} mg/kg).`,
          `Calculate: ${weightKg} × ${doseMgPerKg} = ${totalMg} mg.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Total mg Dose",
            formula: "Weight (kg) × Dose (mg/kg)",
            calculation: `${weightKg} kg × ${doseMgPerKg} mg/kg = ${totalMg} mg`,
            result: `${totalMg} mg`,
          },
        ],
        rawVariables: { weightKg, doseMgPerKg, totalMg },
      };
    },
  },
  {
    id: "wt-enoxaparin-therapeutic",
    category: "weight-based",
    subtype: "mg-kg-dose",
    difficulty: "beginner",
    title: "Therapeutic Enoxaparin Subcutaneous Dose",
    clinicalContext: "Adult Med-Surg DVT/PE Anticoagulation",
    generate: (rng) => {
      const weightKg = pick([60, 68, 72, 75, 80, 85, 90, 95, 100], rng);
      const totalMg = weightKg; // 1 mg/kg q12h

      return {
        scenario: `An adult patient with an acute lower extremity deep vein thrombosis (DVT) is prescribed therapeutic full-dose anticoagulation.`,
        orderText: `Enoxaparin (Lovenox) 1 mg/kg SubQ every 12 hours for patient weight ${weightKg} kg`,
        patientWeightKg: weightKg,
        prompt: `Calculate the single dose in mg to be administered every 12 hours.`,
        expectedAnswer: totalMg,
        expectedUnit: "mg",
        roundingMode: "whole",
        roundingInstruction: "State whole number of mg.",
        tolerance: 0.1,
        hints: [
          "Dose is 1 mg per kilogram.",
          `Multiply ${weightKg} kg by 1 mg/kg.`,
          `Result is ${totalMg} mg.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Enoxaparin Dose",
            formula: "Weight (kg) × 1 mg/kg",
            calculation: `${weightKg} kg × 1 mg/kg = ${totalMg} mg`,
            result: `${totalMg} mg`,
          },
        ],
        rawVariables: { weightKg, totalMg },
      };
    },
  },
  {
    id: "wt-succinylcholine-rsi",
    category: "weight-based",
    subtype: "mg-kg-dose",
    difficulty: "intermediate",
    title: "Rapid Sequence Intubation Paralytic Dose",
    clinicalContext: "Adult Critical Care / Emergency Airway Protocol",
    generate: (rng) => {
      const weightKg = pick([60, 70, 80, 90, 100], rng);
      const doseMgPerKg = 1.5;
      const totalMg = Math.round(weightKg * doseMgPerKg * 10) / 10;

      return {
        scenario: `An adult patient in acute respiratory failure requires emergency rapid sequence intubation (RSI). The intubation protocol specifies succinylcholine 1.5 mg/kg IV.`,
        orderText: `Succinylcholine 1.5 mg/kg IV push for patient weight ${weightKg} kg`,
        patientWeightKg: weightKg,
        prompt: `Calculate the total ordered succinylcholine dose in mg.`,
        expectedAnswer: totalMg,
        expectedUnit: "mg",
        roundingMode: "tenth",
        roundingInstruction: "Round to the nearest tenth or whole number.",
        tolerance: 0.05,
        hints: [
          "Dose formula: Weight (kg) × 1.5 mg/kg.",
          `Multiply ${weightKg} kg by 1.5 mg/kg.`,
          `Calculate: ${weightKg} × 1.5 = ${totalMg} mg.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Intubation Paralytic Dose",
            formula: "Weight (kg) × 1.5 mg/kg",
            calculation: `${weightKg} kg × 1.5 mg/kg = ${totalMg} mg`,
            result: `${totalMg} mg`,
          },
        ],
        rawVariables: { weightKg, doseMgPerKg, totalMg },
      };
    },
  },
  {
    id: "wt-methylprednisolone-pulse-lb",
    category: "weight-based",
    subtype: "mg-kg-dose",
    difficulty: "intermediate",
    title: "Weight-Based High-Dose Steroid (Pounds to Kilograms)",
    clinicalContext: "Adult Inpatient Autoimmune Protocol",
    generate: (rng) => {
      const pair = pick(ADULT_WEIGHTS_LB, rng);
      const doseMgPerKg = pick([1, 2], rng);
      const totalMg = pair.kg * doseMgPerKg;

      return {
        scenario: `An adult patient weighing ${pair.lb} lb is ordered IV methylprednisolone for severe acute inflammation.`,
        orderText: `Methylprednisolone ${doseMgPerKg} mg/kg IV daily`,
        patientWeightLb: pair.lb,
        patientWeightKg: pair.kg,
        prompt: `Calculate the ordered dose in mg.`,
        expectedAnswer: totalMg,
        expectedUnit: "mg",
        roundingMode: "whole",
        roundingInstruction: "Round to nearest whole number.",
        tolerance: 0.1,
        hints: [
          `Step 1: Convert ${pair.lb} lb to kg (${pair.lb} ÷ 2.2 = ${pair.kg} kg).`,
          `Step 2: Multiply by ${doseMgPerKg} mg/kg.`,
          `Calculate: ${pair.kg} × ${doseMgPerKg} = ${totalMg} mg.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Pounds to Kilograms",
            formula: "Weight (lb) ÷ 2.2",
            calculation: `${pair.lb} lb ÷ 2.2 = ${pair.kg} kg`,
            result: `${pair.kg} kg`,
          },
          {
            stepNumber: 2,
            title: "Calculate Total Dose",
            formula: "Weight (kg) × Dose (mg/kg)",
            calculation: `${pair.kg} kg × ${doseMgPerKg} mg/kg = ${totalMg} mg`,
            result: `${totalMg} mg`,
          },
        ],
        rawVariables: { lb: pair.lb, kg: pair.kg, doseMgPerKg, totalMg },
      };
    },
  },
  {
    id: "wt-daptomycin-mg-kg",
    category: "weight-based",
    subtype: "mg-kg-dose",
    difficulty: "beginner",
    title: "Weight-Based Lipopeptide Antibiotic Dose",
    clinicalContext: "Adult Inpatient Bacteremia Order",
    generate: (rng) => {
      const weightKg = pick([60, 70, 75, 80, 85, 90, 100], rng);
      const doseMgPerKg = pick([6, 8], rng);
      const totalMg = weightKg * doseMgPerKg;

      return {
        scenario: `An adult patient weighing ${weightKg} kg with Staphylococcus aureus bacteremia is prescribed IV daptomycin.`,
        orderText: `Daptomycin ${doseMgPerKg} mg/kg IV once every 24 hours`,
        patientWeightKg: weightKg,
        prompt: `Calculate the total daily dose in mg.`,
        expectedAnswer: totalMg,
        expectedUnit: "mg",
        roundingMode: "whole",
        roundingInstruction: "State whole number of mg.",
        tolerance: 0.1,
        hints: [
          "Weight is already provided in kilograms.",
          `Multiply patient weight (${weightKg} kg) by dose (${doseMgPerKg} mg/kg).`,
          `Calculate: ${weightKg} × ${doseMgPerKg} = ${totalMg} mg.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Daily Dose",
            formula: "Weight (kg) × Dose (mg/kg)",
            calculation: `${weightKg} kg × ${doseMgPerKg} mg/kg = ${totalMg} mg`,
            result: `${totalMg} mg`,
          },
        ],
        rawVariables: { weightKg, doseMgPerKg, totalMg },
      };
    },
  },
  {
    id: "wt-phenytoin-loading-lb",
    category: "weight-based",
    subtype: "mg-kg-dose",
    difficulty: "intermediate",
    title: "Anticonvulsant Weight-Based Loading Dose",
    clinicalContext: "Adult Neurology / ED Status Epilepticus Protocol",
    generate: (rng) => {
      const pair = pick(ADULT_WEIGHTS_LB, rng);
      const doseMgPerKg = pick([15, 18, 20], rng);
      const totalMg = pair.kg * doseMgPerKg;

      return {
        scenario: `An adult patient weighing ${pair.lb} lb is admitted with acute seizure activity requiring an IV phenytoin loading dose.`,
        orderText: `Phenytoin ${doseMgPerKg} mg/kg IV loading dose at a rate not to exceed 50 mg/min`,
        patientWeightLb: pair.lb,
        patientWeightKg: pair.kg,
        prompt: `Calculate the total loading dose in mg.`,
        expectedAnswer: totalMg,
        expectedUnit: "mg",
        roundingMode: "whole",
        roundingInstruction: "State whole number of mg.",
        tolerance: 0.1,
        hints: [
          `Step 1: Convert ${pair.lb} lb to kg: ${pair.lb} ÷ 2.2 = ${pair.kg} kg.`,
          `Step 2: Multiply ${pair.kg} kg by ${doseMgPerKg} mg/kg.`,
          `Calculate: ${pair.kg} × ${doseMgPerKg} = ${totalMg} mg.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Weight to Kilograms",
            formula: "Weight (lb) ÷ 2.2",
            calculation: `${pair.lb} lb ÷ 2.2 = ${pair.kg} kg`,
            result: `${pair.kg} kg`,
          },
          {
            stepNumber: 2,
            title: "Calculate Loading Dose",
            formula: "Weight (kg) × Dose (mg/kg)",
            calculation: `${pair.kg} kg × ${doseMgPerKg} mg/kg = ${totalMg} mg`,
            result: `${totalMg} mg`,
          },
        ],
        rawVariables: { lb: pair.lb, kg: pair.kg, doseMgPerKg, totalMg },
      };
    },
  },
  {
    id: "wt-gentamicin-extended-interval",
    category: "weight-based",
    subtype: "mg-kg-dose",
    difficulty: "beginner",
    title: "Extended-Interval Aminoglycoside Dose",
    clinicalContext: "Adult Inpatient Sepsis Protocol",
    generate: (rng) => {
      const weightKg = pick([50, 60, 65, 70, 75, 80, 85, 90], rng);
      const doseMgPerKg = pick([5, 7], rng);
      const totalMg = weightKg * doseMgPerKg;

      return {
        scenario: `An adult inpatient weighing ${weightKg} kg is started on once-daily extended-interval gentamicin therapy.`,
        orderText: `Gentamicin ${doseMgPerKg} mg/kg IVPB in 100 mL NS once every 24 hours`,
        patientWeightKg: weightKg,
        prompt: `Calculate the dose in mg to be administered for each 24-hour infusion.`,
        expectedAnswer: totalMg,
        expectedUnit: "mg",
        roundingMode: "whole",
        roundingInstruction: "State whole number of mg.",
        tolerance: 0.1,
        hints: [
          "Weight is already in kilograms.",
          `Multiply patient weight (${weightKg} kg) by ${doseMgPerKg} mg/kg.`,
          `Calculate: ${weightKg} × ${doseMgPerKg} = ${totalMg} mg.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Extended-Interval Dose",
            formula: "Weight (kg) × Dose (mg/kg)",
            calculation: `${weightKg} kg × ${doseMgPerKg} mg/kg = ${totalMg} mg`,
            result: `${totalMg} mg`,
          },
        ],
        rawVariables: { weightKg, doseMgPerKg, totalMg },
      };
    },
  },
  {
    id: "wt-acyclovir-mg-kg",
    category: "weight-based",
    subtype: "mg-kg-dose",
    difficulty: "beginner",
    title: "Weight-Based Antiviral Infusion Dose",
    clinicalContext: "Adult Inpatient Encephalitis Order",
    generate: (rng) => {
      const weightKg = pick([55, 60, 65, 70, 75, 80, 85], rng);
      const doseMgPerKg = 10;
      const totalMg = weightKg * doseMgPerKg;

      return {
        scenario: `An adult patient weighing ${weightKg} kg is prescribed IV acyclovir for viral central nervous system infection.`,
        orderText: `Acyclovir 10 mg/kg IV every 8 hours`,
        patientWeightKg: weightKg,
        prompt: `Calculate the dose in mg for one administration.`,
        expectedAnswer: totalMg,
        expectedUnit: "mg",
        roundingMode: "whole",
        roundingInstruction: "State whole number of mg.",
        tolerance: 0.1,
        hints: [
          "Patient weight is already recorded in kilograms.",
          `Multiply ${weightKg} kg by 10 mg/kg.`,
          `Calculate: ${weightKg} × 10 = ${totalMg} mg.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Single Dose",
            formula: "Weight (kg) × 10 mg/kg",
            calculation: `${weightKg} kg × 10 mg/kg = ${totalMg} mg`,
            result: `${totalMg} mg`,
          },
        ],
        rawVariables: { weightKg, doseMgPerKg, totalMg },
      };
    },
  },
  {
    id: "wt-rocuronium-paralytic-lb",
    category: "weight-based",
    subtype: "mg-kg-dose",
    difficulty: "intermediate",
    title: "Weight-Based Non-Depolarizing Paralytic Dose",
    clinicalContext: "Adult Critical Care / OR Neuromuscular Blockade",
    generate: (rng) => {
      const pair = pick(ADULT_WEIGHTS_LB, rng);
      const doseMgPerKg = 0.6;
      const totalMg = Math.round(pair.kg * doseMgPerKg * 10) / 10;

      return {
        scenario: `An adult patient weighing ${pair.lb} lb is scheduled for rapid intubation using rocuronium bromide 0.6 mg/kg IV.`,
        orderText: `Rocuronium 0.6 mg/kg IV push`,
        patientWeightLb: pair.lb,
        patientWeightKg: pair.kg,
        prompt: `Calculate the total ordered rocuronium dose in mg.`,
        expectedAnswer: totalMg,
        expectedUnit: "mg",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.05,
        hints: [
          `Step 1: Convert ${pair.lb} lb to kilograms: ${pair.lb} ÷ 2.2 = ${pair.kg} kg.`,
          `Step 2: Multiply ${pair.kg} kg by 0.6 mg/kg.`,
          `Calculate: ${pair.kg} × 0.6 = ${totalMg} mg.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Weight to Kilograms",
            formula: "Weight (lb) ÷ 2.2",
            calculation: `${pair.lb} lb ÷ 2.2 = ${pair.kg} kg`,
            result: `${pair.kg} kg`,
          },
          {
            stepNumber: 2,
            title: "Calculate Rocuronium Dose",
            formula: "Weight (kg) × 0.6 mg/kg",
            calculation: `${pair.kg} kg × 0.6 mg/kg = ${totalMg} mg`,
            result: `${totalMg} mg`,
          },
        ],
        rawVariables: { lb: pair.lb, kg: pair.kg, doseMgPerKg, totalMg },
      };
    },
  },
];
