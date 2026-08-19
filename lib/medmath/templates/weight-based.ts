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
        correctAnswer: totalMg,
        answerUnit: "mg",
        answerPrecision: 0,
        roundingInstruction: "Round to nearest whole number if necessary.",
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
        correctAnswer: totalMg,
        answerUnit: "mg",
        answerPrecision: 0,
        roundingInstruction: "State whole number of mg.",
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
        correctAnswer: totalMg,
        answerUnit: "mg",
        answerPrecision: 0,
        roundingInstruction: "State whole number of mg.",
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
        correctAnswer: totalMg,
        answerUnit: "mg",
        answerPrecision: 1,
        roundingInstruction: "Round to the nearest tenth or whole number.",
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
        correctAnswer: totalMg,
        answerUnit: "mg",
        answerPrecision: 0,
        roundingInstruction: "Round to nearest whole number.",
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
        correctAnswer: totalMg,
        answerUnit: "mg",
        answerPrecision: 0,
        roundingInstruction: "State whole number of mg.",
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
        correctAnswer: totalMg,
        answerUnit: "mg",
        answerPrecision: 0,
        roundingInstruction: "State whole number of mg.",
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
        correctAnswer: totalMg,
        answerUnit: "mg",
        answerPrecision: 0,
        roundingInstruction: "State whole number of mg.",
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
        correctAnswer: totalMg,
        answerUnit: "mg",
        answerPrecision: 0,
        roundingInstruction: "State whole number of mg.",
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
        correctAnswer: totalMg,
        answerUnit: "mg",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
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
  {
    id: "wt-reverse-total-mg-to-dose-kg",
    category: "weight-based",
    subtype: "mg-kg-dose",
    difficulty: "intermediate",
    title: "Reverse Weight Calculation: Determine Administered mg/kg Dose",
    clinicalContext: "Adult Inpatient Medication Safety Audit",
    generate: (rng) => {
      const data = pick([
        { weightKg: 80, totalMg: 1200, doseMgKg: 15 },
        { weightKg: 70, totalMg: 1050, doseMgKg: 15 },
        { weightKg: 90, totalMg: 1800, doseMgKg: 20 },
        { weightKg: 60, totalMg: 600, doseMgKg: 10 },
      ], rng);

      return {
        scenario: `An adult inpatient weighing ${data.weightKg} kg received a single intravenous antibiotic infusion containing ${data.totalMg} mg.`,
        orderText: `Administered dose: ${data.totalMg} mg | Patient weight: ${data.weightKg} kg`,
        patientWeightKg: data.weightKg,
        prompt: `Calculate the dose the patient received in mg/kg.`,
        correctAnswer: data.doseMgKg,
        answerUnit: "mg/kg",
        answerPrecision: 1,
        roundingInstruction: "State exact number or round to nearest tenth.",
        hints: [
          "Divide the total milligrams administered by the patient's weight in kilograms.",
          `Formula: Total Dose (mg) ÷ Weight (kg) = Dose (mg/kg).`,
          `Calculate: ${data.totalMg} mg ÷ ${data.weightKg} kg = ${data.doseMgKg} mg/kg.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Dose in mg/kg",
            formula: "Total Milligrams ÷ Patient Weight (kg)",
            calculation: `${data.totalMg} mg ÷ ${data.weightKg} kg = ${data.doseMgKg} mg/kg`,
            result: `${data.doseMgKg} mg/kg`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "wt-reverse-lb-total-to-mg-kg",
    category: "weight-based",
    subtype: "mg-kg-dose",
    difficulty: "advanced",
    title: "Reverse Weight Calculation: Pounds to mg/kg Dose",
    clinicalContext: "Adult Clinical Pharmacokinetics Audit",
    generate: (rng) => {
      const data = pick([
        { lb: 154, kg: 70, totalMg: 350, doseMgKg: 5 },
        { lb: 176, kg: 80, totalMg: 400, doseMgKg: 5 },
        { lb: 198, kg: 90, totalMg: 540, doseMgKg: 6 },
        { lb: 132, kg: 60, totalMg: 360, doseMgKg: 6 },
      ], rng);

      return {
        scenario: `A patient weighing ${data.lb} lb was administered a total dose of ${data.totalMg} mg of an IV antifungal.`,
        orderText: `Total ${data.totalMg} mg administered to ${data.lb} lb patient`,
        patientWeightLb: data.lb,
        patientWeightKg: data.kg,
        prompt: `Calculate the dosage received in mg/kg.`,
        correctAnswer: data.doseMgKg,
        answerUnit: "mg/kg",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          `Step 1: Convert weight in pounds to kilograms: ${data.lb} lb ÷ 2.2 = ${data.kg} kg.`,
          `Step 2: Divide total mg by weight in kg: ${data.totalMg} ÷ ${data.kg}.`,
          `Calculate: ${data.totalMg} ÷ ${data.kg} = ${data.doseMgKg} mg/kg.`,
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
            title: "Calculate mg/kg Dose",
            formula: "Total Milligrams ÷ Weight (kg)",
            calculation: `${data.totalMg} mg ÷ ${data.kg} kg = ${data.doseMgKg} mg/kg`,
            result: `${data.doseMgKg} mg/kg`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "wt-daptomycin-skin-infection",
    category: "weight-based",
    subtype: "mg-kg-dose",
    difficulty: "beginner",
    title: "Weight-Based Daptomycin Dose (6 mg/kg)",
    clinicalContext: "Adult Inpatient MRSA Bacteremia Order",
    generate: (rng) => {
      const weightKg = pick([60, 65, 70, 75, 80, 85, 90, 95], rng);
      const doseMgPerKg = 6;
      const totalMg = weightKg * doseMgPerKg;

      return {
        scenario: `An adult inpatient weighing ${weightKg} kg with complicated skin structure infection is prescribed IV daptomycin at ${doseMgPerKg} mg/kg daily.`,
        orderText: `Daptomycin ${doseMgPerKg} mg/kg IV every 24 hours (Patient weight: ${weightKg} kg)`,
        patientWeightKg: weightKg,
        prompt: `Calculate the daily daptomycin dose in mg.`,
        correctAnswer: totalMg,
        answerUnit: "mg",
        answerPrecision: 0,
        roundingInstruction: "State whole number of mg.",
        hints: [
          "Weight is already in kilograms.",
          `Multiply patient weight (${weightKg} kg) by ${doseMgPerKg} mg/kg.`,
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
    id: "wt-amikacin-loading-dose",
    category: "weight-based",
    subtype: "mg-kg-dose",
    difficulty: "intermediate",
    title: "Weight-Based Aminoglycoside Loading Dose (Pounds)",
    clinicalContext: "Adult ICU Gram-Negative Sepsis",
    generate: (rng) => {
      const pair = pick(ADULT_WEIGHTS_LB, rng);
      const doseMgPerKg = 15;
      const totalMg = pair.kg * doseMgPerKg;

      return {
        scenario: `An adult ICU patient weighing ${pair.lb} lb with multidrug-resistant pseudomonas sepsis is prescribed an amikacin loading dose of ${doseMgPerKg} mg/kg IV.`,
        orderText: `Amikacin ${doseMgPerKg} mg/kg IV loading dose over 60 minutes`,
        patientWeightLb: pair.lb,
        patientWeightKg: pair.kg,
        prompt: `Calculate the total amikacin dose in mg.`,
        correctAnswer: totalMg,
        answerUnit: "mg",
        answerPrecision: 0,
        roundingInstruction: "State whole number of mg.",
        hints: [
          `Step 1: Convert pounds to kilograms: ${pair.lb} lb ÷ 2.2 = ${pair.kg} kg.`,
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
    id: "wt-ketamine-procedural-sedation",
    category: "weight-based",
    subtype: "mg-kg-dose",
    difficulty: "beginner",
    title: "Weight-Based Ketamine Procedural Sedation Dose",
    clinicalContext: "Adult Emergency / Step-Down Sedation Protocol",
    generate: (rng) => {
      const weightKg = pick([60, 70, 75, 80, 85, 90], rng);
      const doseMgPerKg = 1.5;
      const totalMg = Math.round(weightKg * doseMgPerKg * 10) / 10;

      return {
        scenario: `An adult patient weighing ${weightKg} kg requires procedural sedation for joint reduction. The physician orders IV ketamine at ${doseMgPerKg} mg/kg.`,
        orderText: `Ketamine ${doseMgPerKg} mg/kg IV push over 1 minute`,
        patientWeightKg: weightKg,
        prompt: `Calculate the ketamine dose in mg.`,
        correctAnswer: totalMg,
        answerUnit: "mg",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          "Weight is in kilograms.",
          `Multiply ${weightKg} kg by ${doseMgPerKg} mg/kg.`,
          `Calculate: ${weightKg} × 1.5 = ${totalMg} mg.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Sedation Dose",
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
    id: "wt-succinylcholine-rsi-lb",
    category: "weight-based",
    subtype: "mg-kg-dose",
    difficulty: "intermediate",
    title: "Weight-Based Succinylcholine Rapid Sequence Intubation (Pounds)",
    clinicalContext: "Adult Emergency Airway Management",
    generate: (rng) => {
      const pair = pick(ADULT_WEIGHTS_LB, rng);
      const doseMgPerKg = 1.5;
      const totalMg = Math.round(pair.kg * doseMgPerKg * 10) / 10;

      return {
        scenario: `An adult patient weighing ${pair.lb} lb requires urgent endotracheal intubation. The provider orders succinylcholine 1.5 mg/kg IV.`,
        orderText: `Succinylcholine 1.5 mg/kg IV push stat (Weight: ${pair.lb} lb)`,
        patientWeightLb: pair.lb,
        patientWeightKg: pair.kg,
        prompt: `Calculate the succinylcholine dose in mg.`,
        correctAnswer: totalMg,
        answerUnit: "mg",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          `Convert pounds to kilograms: ${pair.lb} lb ÷ 2.2 = ${pair.kg} kg.`,
          `Multiply by 1.5 mg/kg: ${pair.kg} kg × 1.5 mg/kg.`,
          `Calculate: ${pair.kg} × 1.5 = ${totalMg} mg.`,
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
            title: "Calculate Intubation Paralytic Dose",
            formula: "Weight (kg) × 1.5 mg/kg",
            calculation: `${pair.kg} kg × 1.5 mg/kg = ${totalMg} mg`,
            result: `${totalMg} mg`,
          },
        ],
        rawVariables: { lb: pair.lb, kg: pair.kg, doseMgPerKg, totalMg },
      };
    },
  },
  {
    id: "wt-etomidate-induction-dose",
    category: "weight-based",
    subtype: "mg-kg-dose",
    difficulty: "beginner",
    title: "Weight-Based Etomidate Anesthetic Induction Dose",
    clinicalContext: "Adult Emergency / Critical Care Airway Order",
    generate: (rng) => {
      const weightKg = pick([60, 65, 70, 75, 80, 85, 90], rng);
      const doseMgPerKg = 0.3;
      const totalMg = Math.round(weightKg * doseMgPerKg * 10) / 10;

      return {
        scenario: `An adult ICU patient weighing ${weightKg} kg is prescribed etomidate 0.3 mg/kg IV for induction prior to intubation.`,
        orderText: `Etomidate 0.3 mg/kg IV push stat`,
        patientWeightKg: weightKg,
        prompt: `Calculate the etomidate dose in mg.`,
        correctAnswer: totalMg,
        answerUnit: "mg",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          "Patient weight is in kilograms.",
          `Multiply ${weightKg} kg by 0.3 mg/kg.`,
          `Calculate: ${weightKg} × 0.3 = ${totalMg} mg.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Induction Dose",
            formula: "Weight (kg) × 0.3 mg/kg",
            calculation: `${weightKg} kg × 0.3 mg/kg = ${totalMg} mg`,
            result: `${totalMg} mg`,
          },
        ],
        rawVariables: { weightKg, doseMgPerKg, totalMg },
      };
    },
  },
  {
    id: "wt-methylprednisolone-spinal-lb",
    category: "weight-based",
    subtype: "mg-kg-dose",
    difficulty: "intermediate",
    title: "High-Dose Corticosteroid Weight Calculation (Pounds)",
    clinicalContext: "Adult ICU Neurological Trauma Protocol",
    generate: (rng) => {
      const pair = pick(ADULT_WEIGHTS_LB, rng);
      const doseMgPerKg = 30;
      const totalMg = pair.kg * doseMgPerKg;

      return {
        scenario: `An adult trauma patient weighing ${pair.lb} lb is prescribed high-dose methylprednisolone at ${doseMgPerKg} mg/kg IV over 45 minutes.`,
        orderText: `Methylprednisolone ${doseMgPerKg} mg/kg IV over 45 minutes (Weight: ${pair.lb} lb)`,
        patientWeightLb: pair.lb,
        patientWeightKg: pair.kg,
        prompt: `Calculate the total methylprednisolone dose in mg.`,
        correctAnswer: totalMg,
        answerUnit: "mg",
        answerPrecision: 0,
        roundingInstruction: "State whole number of mg.",
        hints: [
          `Step 1: Convert pounds to kilograms: ${pair.lb} lb ÷ 2.2 = ${pair.kg} kg.`,
          `Step 2: Multiply by ${doseMgPerKg} mg/kg: ${pair.kg} kg × 30 mg/kg.`,
          `Calculate: ${pair.kg} × 30 = ${totalMg} mg.`,
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
            title: "Calculate Total Steroid Dose",
            formula: "Weight (kg) × 30 mg/kg",
            calculation: `${pair.kg} kg × 30 mg/kg = ${totalMg} mg`,
            result: `${totalMg} mg`,
          },
        ],
        rawVariables: { lb: pair.lb, kg: pair.kg, doseMgPerKg, totalMg },
      };
    },
  },
];
