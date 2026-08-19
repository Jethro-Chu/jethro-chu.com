import type { QuestionTemplate } from "../types.ts";
import { pick, ADULT_WEIGHTS_LB } from "./helpers.ts";

export const multiStepTemplates: QuestionTemplate[] = [
  {
    id: "multi-dopamine-lb-to-mlhr",
    category: "multi-step",
    subtype: "full-workflow-icu",
    difficulty: "critical-care",
    title: "Full Workflow: Dopamine Infusion from Pounds (lb → kg → mcg/min → mL/hr)",
    clinicalContext: "Adult Critical Care Shock Management",
    generate: (rng) => {
      const pair = pick(ADULT_WEIGHTS_LB, rng);
      const doseMcgKgMin = pick([5, 7.5, 10], rng);
      const bagMg = 400;
      const bagMl = 250;
      const concMcgMl = (bagMg * 1000) / bagMl; // 1600 mcg/mL
      const totalMcgMin = pair.kg * doseMcgKgMin;
      const totalMcgHr = totalMcgMin * 60;
      const rateMlHr = Math.round((totalMcgHr / concMcgMl) * 10) / 10;

      return {
        scenario: `An adult ICU patient weighing ${pair.lb} lb with persistent cardiogenic hypotension requires dopamine titrated to achieve adequate renal and cardiac perfusion.`,
        orderText: `Dopamine continuous IV infusion at ${doseMcgKgMin} mcg/kg/min`,
        availableText: `Dopamine ${bagMg} mg in ${bagMl} mL D5W (${concMcgMl} mcg/mL)`,
        patientWeightLb: pair.lb,
        patientWeightKg: pair.kg,
        prompt: `Calculate the required IV pump rate in mL/hr following all conversion steps.`,
        correctAnswer: rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to the nearest tenth.",
        hints: [
          `Step 1: Convert weight: ${pair.lb} lb ÷ 2.2 = ${pair.kg} kg.`,
          `Step 2: Calculate mcg/min: ${pair.kg} kg × ${doseMcgKgMin} mcg/kg/min = ${totalMcgMin} mcg/min.`,
          `Step 3: Convert to mcg/hr: ${totalMcgMin} × 60 = ${totalMcgHr} mcg/hr.`,
          `Step 4: Bag concentration: (400 mg × 1,000) ÷ 250 mL = 1,600 mcg/mL.`,
          `Step 5: Pump rate: ${totalMcgHr} ÷ 1,600 = ${rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Weight (lb to kg)",
            formula: "Weight (lb) ÷ 2.2",
            calculation: `${pair.lb} lb ÷ 2.2 = ${pair.kg} kg`,
            result: `${pair.kg} kg`,
          },
          {
            stepNumber: 2,
            title: "Calculate Ordered mcg/min",
            formula: "Weight (kg) × Dose (mcg/kg/min)",
            calculation: `${pair.kg} kg × ${doseMcgKgMin} mcg/kg/min = ${totalMcgMin} mcg/min`,
            result: `${totalMcgMin} mcg/min`,
          },
          {
            stepNumber: 3,
            title: "Convert to mcg/hr",
            formula: "mcg/min × 60 minutes",
            calculation: `${totalMcgMin} mcg/min × 60 = ${totalMcgHr} mcg/hr`,
            result: `${totalMcgHr} mcg/hr`,
          },
          {
            stepNumber: 4,
            title: "Determine Bag Concentration",
            formula: "(400 mg × 1,000) ÷ 250 mL",
            calculation: `400,000 mcg ÷ 250 mL = 1,600 mcg/mL`,
            result: `1,600 mcg/mL`,
          },
          {
            stepNumber: 5,
            title: "Calculate Final Pump Rate",
            formula: "Total mcg/hr ÷ Concentration (mcg/mL)",
            calculation: `${totalMcgHr} mcg/hr ÷ 1,600 mcg/mL = ${rateMlHr} mL/hr`,
            result: `${rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { lb: pair.lb, kg: pair.kg, doseMcgKgMin, bagMg, bagMl, concMcgMl, rateMlHr },
      };
    },
  },
  {
    id: "multi-norepi-double-strength-lb",
    category: "multi-step",
    subtype: "full-workflow-icu",
    difficulty: "critical-care",
    title: "Double-Strength Norepinephrine Infusion from Pounds",
    clinicalContext: "Adult ICU Fluid-Restricted Septic Shock Protocol",
    generate: (rng) => {
      const pair = pick(ADULT_WEIGHTS_LB, rng);
      const doseMcgKgMin = pick([0.1, 0.12, 0.15, 0.2], rng);
      // Double strength: 16 mg in 250 mL = 64 mcg/mL
      const bagMg = 16;
      const bagMl = 250;
      const concMcgMl = (bagMg * 1000) / bagMl; // 64 mcg/mL
      const totalMcgMin = pair.kg * doseMcgKgMin;
      const totalMcgHr = totalMcgMin * 60;
      const rateMlHr = Math.round((totalMcgHr / concMcgMl) * 10) / 10;

      return {
        scenario: `A fluid-overloaded adult patient in severe septic shock weighing ${pair.lb} lb is placed on a double-strength concentration of norepinephrine to limit fluid volume intake.`,
        orderText: `Norepinephrine IV at ${doseMcgKgMin} mcg/kg/min`,
        availableText: `Norepinephrine concentrated bag: ${bagMg} mg in ${bagMl} mL D5W (${concMcgMl} mcg/mL)`,
        patientWeightLb: pair.lb,
        patientWeightKg: pair.kg,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          `Step 1: Convert weight: ${pair.lb} lb ÷ 2.2 = ${pair.kg} kg.`,
          `Step 2: Calculate mcg/min: ${pair.kg} kg × ${doseMcgKgMin} mcg/kg/min = ${totalMcgMin} mcg/min.`,
          `Step 3: Convert to mcg/hr: ${totalMcgMin} × 60 = ${totalMcgHr} mcg/hr.`,
          `Step 4: Bag concentration: (16 mg × 1,000) ÷ 250 mL = 64 mcg/mL.`,
          `Step 5: Pump rate: ${totalMcgHr} ÷ 64 = ${rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Weight",
            formula: "Pounds ÷ 2.2",
            calculation: `${pair.lb} lb ÷ 2.2 = ${pair.kg} kg`,
            result: `${pair.kg} kg`,
          },
          {
            stepNumber: 2,
            title: "Calculate Minute Dose",
            formula: "Weight (kg) × Dose (mcg/kg/min)",
            calculation: `${pair.kg} kg × ${doseMcgKgMin} mcg/kg/min = ${totalMcgMin} mcg/min`,
            result: `${totalMcgMin} mcg/min`,
          },
          {
            stepNumber: 3,
            title: "Convert to Hourly Dose",
            formula: "mcg/min × 60",
            calculation: `${totalMcgMin} mcg/min × 60 = ${totalMcgHr} mcg/hr`,
            result: `${totalMcgHr} mcg/hr`,
          },
          {
            stepNumber: 4,
            title: "Determine High Concentration",
            formula: "16,000 mcg ÷ 250 mL",
            calculation: `16,000 mcg ÷ 250 mL = 64 mcg/mL`,
            result: `64 mcg/mL`,
          },
          {
            stepNumber: 5,
            title: "Calculate Flow Rate",
            formula: "mcg/hr ÷ 64 mcg/mL",
            calculation: `${totalMcgHr} mcg/hr ÷ 64 mcg/mL = ${rateMlHr} mL/hr`,
            result: `${rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { lb: pair.lb, kg: pair.kg, doseMcgKgMin, bagMg, bagMl, concMcgMl, rateMlHr },
      };
    },
  },
  {
    id: "multi-reverse-mcg-kg-min-delivered",
    category: "multi-step",
    subtype: "reverse-calculation",
    difficulty: "critical-care",
    title: "Reverse Multi-Step: Determine Delivered mcg/kg/min from Pump Rate and Pounds",
    clinicalContext: "Adult ICU Bedside Safety Audit",
    generate: (rng) => {
      const pair = pick(ADULT_WEIGHTS_LB, rng);
      const doseMcgKgMin = pick([0.08, 0.1, 0.15, 0.2], rng);
      const bagMg = 8;
      const bagMl = 250;
      const concMcgMl = (bagMg * 1000) / bagMl; // 32 mcg/mL
      const totalMcgMin = pair.kg * doseMcgKgMin;
      const totalMcgHr = totalMcgMin * 60;
      const rateMlHr = Math.round((totalMcgHr / concMcgMl) * 10) / 10;

      return {
        scenario: `During independent double-check at bedside, the oncoming ICU nurse audits an active norepinephrine infusion. The pump is running at ${rateMlHr} mL/hr. The patient's chart lists a weight of ${pair.lb} lb.`,
        orderText: `Current IV pump rate: ${rateMlHr} mL/hr | Patient weight: ${pair.lb} lb`,
        availableText: `Norepinephrine 8 mg in 250 mL D5W (32 mcg/mL)`,
        patientWeightLb: pair.lb,
        patientWeightKg: pair.kg,
        prompt: `Calculate the current dose delivered to the patient in mcg/kg/min.`,
        correctAnswer: doseMcgKgMin,
        answerUnit: "mcg/kg/min",
        answerPrecision: 2,
        roundingInstruction: "Round to nearest hundredth (e.g. 0.08 or 0.15).",
        hints: [
          `Step 1: Convert patient weight: ${pair.lb} lb ÷ 2.2 = ${pair.kg} kg.`,
          `Step 2: Calculate mcg/hr delivered: ${rateMlHr} mL/hr × 32 mcg/mL = ${Math.round(rateMlHr * 32)} mcg/hr.`,
          `Step 3: Convert to mcg/min: ${Math.round(rateMlHr * 32)} ÷ 60 = ${Math.round((rateMlHr * 32) / 60 * 100) / 100} mcg/min.`,
          `Step 4: Divide by weight in kg: (${Math.round((rateMlHr * 32) / 60 * 100) / 100}) ÷ ${pair.kg} kg = ${doseMcgKgMin} mcg/kg/min.`,
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
            title: "Calculate Hourly Micrograms Delivered",
            formula: "Pump Rate (mL/hr) × Concentration (32 mcg/mL)",
            calculation: `${rateMlHr} mL/hr × 32 mcg/mL = ${Math.round(rateMlHr * 32 * 10) / 10} mcg/hr`,
            result: `${Math.round(rateMlHr * 32 * 10) / 10} mcg/hr`,
          },
          {
            stepNumber: 3,
            title: "Convert to Minute Micrograms",
            formula: "Hourly mcg ÷ 60 minutes",
            calculation: `${Math.round(rateMlHr * 32 * 10) / 10} mcg/hr ÷ 60 = ${Math.round(totalMcgMin * 10) / 10} mcg/min`,
            result: `${Math.round(totalMcgMin * 10) / 10} mcg/min`,
          },
          {
            stepNumber: 4,
            title: "Calculate Weight-Based Rate",
            formula: "Minute mcg ÷ Weight (kg)",
            calculation: `${Math.round(totalMcgMin * 10) / 10} mcg/min ÷ ${pair.kg} kg = ${doseMcgKgMin} mcg/kg/min`,
            result: `${doseMcgKgMin} mcg/kg/min`,
          },
        ],
        rawVariables: { lb: pair.lb, kg: pair.kg, rateMlHr, doseMcgKgMin },
      };
    },
  },
  {
    id: "multi-dobutamine-lb-workflow",
    category: "multi-step",
    subtype: "full-workflow-icu",
    difficulty: "critical-care",
    title: "Dobutamine Inodilator Workflow from Pounds",
    clinicalContext: "Adult CCU Post-Infarction Cardiogenic Shock",
    generate: (rng) => {
      const pair = pick(ADULT_WEIGHTS_LB, rng);
      const doseMcgKgMin = pick([5, 7.5, 10], rng);
      const bagMg = 500;
      const bagMl = 250;
      const concMcgMl = 2000;
      const totalMcgMin = pair.kg * doseMcgKgMin;
      const totalMcgHr = totalMcgMin * 60;
      const rateMlHr = Math.round((totalMcgHr / concMcgMl) * 10) / 10;

      return {
        scenario: `An adult coronary care patient weighing ${pair.lb} lb is prescribed dobutamine for low cardiac index following an anterior STEMI.`,
        orderText: `Dobutamine IV infusion at ${doseMcgKgMin} mcg/kg/min`,
        availableText: `Dobutamine ${bagMg} mg in ${bagMl} mL D5W (2,000 mcg/mL)`,
        patientWeightLb: pair.lb,
        patientWeightKg: pair.kg,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          `Step 1: Convert ${pair.lb} lb to kg: ${pair.lb} ÷ 2.2 = ${pair.kg} kg.`,
          `Step 2: Calculate mcg/min: ${pair.kg} × ${doseMcgKgMin} = ${totalMcgMin} mcg/min.`,
          `Step 3: Convert to mcg/hr: ${totalMcgMin} × 60 = ${totalMcgHr} mcg/hr.`,
          `Step 4: Divide by 2,000 mcg/mL: ${totalMcgHr} ÷ 2,000 = ${rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Weight",
            formula: "Pounds ÷ 2.2",
            calculation: `${pair.lb} lb ÷ 2.2 = ${pair.kg} kg`,
            result: `${pair.kg} kg`,
          },
          {
            stepNumber: 2,
            title: "Calculate Hourly Dose",
            formula: "Weight (kg) × Dose (mcg/kg/min) × 60 min",
            calculation: `${pair.kg} kg × ${doseMcgKgMin} mcg/kg/min × 60 = ${totalMcgHr} mcg/hr`,
            result: `${totalMcgHr} mcg/hr`,
          },
          {
            stepNumber: 3,
            title: "Calculate Flow Rate",
            formula: "mcg/hr ÷ 2,000 mcg/mL",
            calculation: `${totalMcgHr} mcg/hr ÷ 2,000 mcg/mL = ${rateMlHr} mL/hr`,
            result: `${rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { lb: pair.lb, kg: pair.kg, doseMcgKgMin, rateMlHr },
      };
    },
  },
  {
    id: "multi-milrinone-lb-workflow",
    category: "multi-step",
    subtype: "full-workflow-icu",
    difficulty: "critical-care",
    title: "Milrinone Infusion Workflow from Pounds",
    clinicalContext: "Adult Cardiothoracic ICU Inodilator Protocol",
    generate: (rng) => {
      const pair = pick(ADULT_WEIGHTS_LB, rng);
      const doseMcgKgMin = pick([0.375, 0.5, 0.75], rng);
      const bagMg = 20;
      const bagMl = 100;
      const concMcgMl = 200; // 20,000 mcg / 100 mL
      const totalMcgMin = pair.kg * doseMcgKgMin;
      const totalMcgHr = totalMcgMin * 60;
      const rateMlHr = Math.round((totalMcgHr / concMcgMl) * 10) / 10;

      return {
        scenario: `A post-CABG adult patient weighing ${pair.lb} lb has an order for continuous milrinone.`,
        orderText: `Milrinone continuous IV infusion at ${doseMcgKgMin} mcg/kg/min`,
        availableText: `Milrinone ${bagMg} mg in ${bagMl} mL D5W (${concMcgMl} mcg/mL)`,
        patientWeightLb: pair.lb,
        patientWeightKg: pair.kg,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          `Step 1: Convert ${pair.lb} lb ÷ 2.2 = ${pair.kg} kg.`,
          `Step 2: Calculate mcg/min: ${pair.kg} × ${doseMcgKgMin} = ${totalMcgMin} mcg/min.`,
          `Step 3: Convert to mcg/hr: ${totalMcgMin} × 60 = ${totalMcgHr} mcg/hr.`,
          `Step 4: Divide by 200 mcg/mL: ${totalMcgHr} ÷ 200 = ${rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Weight",
            formula: "Pounds ÷ 2.2",
            calculation: `${pair.lb} lb ÷ 2.2 = ${pair.kg} kg`,
            result: `${pair.kg} kg`,
          },
          {
            stepNumber: 2,
            title: "Calculate Hourly Micrograms",
            formula: "Weight (kg) × Dose (mcg/kg/min) × 60",
            calculation: `${pair.kg} kg × ${doseMcgKgMin} mcg/kg/min × 60 = ${totalMcgHr} mcg/hr`,
            result: `${totalMcgHr} mcg/hr`,
          },
          {
            stepNumber: 3,
            title: "Calculate Pump Rate",
            formula: "mcg/hr ÷ 200 mcg/mL",
            calculation: `${totalMcgHr} mcg/hr ÷ 200 mcg/mL = ${rateMlHr} mL/hr`,
            result: `${rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { lb: pair.lb, kg: pair.kg, doseMcgKgMin, rateMlHr },
      };
    },
  },
  {
    id: "multi-propofol-lb-workflow",
    category: "multi-step",
    subtype: "full-workflow-icu",
    difficulty: "critical-care",
    title: "Propofol Sedation Workflow from Pounds",
    clinicalContext: "Adult Trauma ICU Ventilator Sedation",
    generate: (rng) => {
      const pair = pick(ADULT_WEIGHTS_LB, rng);
      const doseMcgKgMin = pick([25, 30, 40, 50], rng);
      const concMcgMl = 10000;
      const totalMcgMin = pair.kg * doseMcgKgMin;
      const totalMcgHr = totalMcgMin * 60;
      const rateMlHr = Math.round((totalMcgHr / concMcgMl) * 10) / 10;

      return {
        scenario: `An adult trauma patient weighing ${pair.lb} lb in the intensive care unit is intubated and requires continuous propofol sedation.`,
        orderText: `Propofol (Diprivan) IV infusion at ${doseMcgKgMin} mcg/kg/min`,
        availableText: `Propofol 10 mg/mL emulsion (10,000 mcg/mL)`,
        patientWeightLb: pair.lb,
        patientWeightKg: pair.kg,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          `Step 1: Convert ${pair.lb} lb ÷ 2.2 = ${pair.kg} kg.`,
          `Step 2: Calculate mcg/min: ${pair.kg} × ${doseMcgKgMin} = ${totalMcgMin} mcg/min.`,
          `Step 3: Convert to mcg/hr: ${totalMcgMin} × 60 = ${totalMcgHr} mcg/hr.`,
          `Step 4: Divide by 10,000 mcg/mL: ${totalMcgHr} ÷ 10,000 = ${rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Weight",
            formula: "Pounds ÷ 2.2",
            calculation: `${pair.lb} lb ÷ 2.2 = ${pair.kg} kg`,
            result: `${pair.kg} kg`,
          },
          {
            stepNumber: 2,
            title: "Calculate Hourly Micrograms",
            formula: "Weight (kg) × Dose (mcg/kg/min) × 60",
            calculation: `${pair.kg} kg × ${doseMcgKgMin} mcg/kg/min × 60 = ${totalMcgHr} mcg/hr`,
            result: `${totalMcgHr} mcg/hr`,
          },
          {
            stepNumber: 3,
            title: "Calculate Flow Rate",
            formula: "mcg/hr ÷ 10,000 mcg/mL",
            calculation: `${totalMcgHr} mcg/hr ÷ 10,000 mcg/mL = ${rateMlHr} mL/hr`,
            result: `${rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { lb: pair.lb, kg: pair.kg, doseMcgKgMin, rateMlHr },
      };
    },
  },
  {
    id: "multi-cisatracurium-lb-workflow",
    category: "multi-step",
    subtype: "full-workflow-icu",
    difficulty: "critical-care",
    title: "Cisatracurium Paralytic Workflow from Pounds",
    clinicalContext: "Adult Medical ICU Severe ARDS Protocol",
    generate: (rng) => {
      const pair = pick(ADULT_WEIGHTS_LB, rng);
      const doseMcgKgMin = pick([1.5, 2, 2.5], rng);
      const concMcgMl = 400; // 200 mg in 500 mL
      const totalMcgMin = pair.kg * doseMcgKgMin;
      const totalMcgHr = totalMcgMin * 60;
      const rateMlHr = Math.round((totalMcgHr / concMcgMl) * 10) / 10;

      return {
        scenario: `An adult ICU patient weighing ${pair.lb} lb is placed on a continuous cisatracurium paralytic infusion during prone positioning for severe ARDS.`,
        orderText: `Cisatracurium IV infusion at ${doseMcgKgMin} mcg/kg/min`,
        availableText: `Cisatracurium 200 mg in 500 mL 0.9% NS (400 mcg/mL)`,
        patientWeightLb: pair.lb,
        patientWeightKg: pair.kg,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          `Step 1: Convert weight: ${pair.lb} lb ÷ 2.2 = ${pair.kg} kg.`,
          `Step 2: Calculate mcg/min: ${pair.kg} × ${doseMcgKgMin} = ${totalMcgMin} mcg/min.`,
          `Step 3: Convert to mcg/hr: ${totalMcgMin} × 60 = ${totalMcgHr} mcg/hr.`,
          `Step 4: Divide by 400 mcg/mL: ${totalMcgHr} ÷ 400 = ${rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Weight",
            formula: "Pounds ÷ 2.2",
            calculation: `${pair.lb} lb ÷ 2.2 = ${pair.kg} kg`,
            result: `${pair.kg} kg`,
          },
          {
            stepNumber: 2,
            title: "Calculate Hourly Dose",
            formula: "Weight (kg) × Dose (mcg/kg/min) × 60",
            calculation: `${pair.kg} kg × ${doseMcgKgMin} mcg/kg/min × 60 = ${totalMcgHr} mcg/hr`,
            result: `${totalMcgHr} mcg/hr`,
          },
          {
            stepNumber: 3,
            title: "Calculate Pump Rate",
            formula: "mcg/hr ÷ 400 mcg/mL",
            calculation: `${totalMcgHr} mcg/hr ÷ 400 mcg/mL = ${rateMlHr} mL/hr`,
            result: `${rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { lb: pair.lb, kg: pair.kg, doseMcgKgMin, rateMlHr },
      };
    },
  },
  {
    id: "multi-vasopressor-titration-step",
    category: "multi-step",
    subtype: "full-workflow-icu",
    difficulty: "critical-care",
    title: "Norepinephrine Step Titration Adjustment from Pounds",
    clinicalContext: "Adult Critical Care Vasopressor Titration Order",
    generate: (rng) => {
      const pair = pick(ADULT_WEIGHTS_LB, rng);
      const currentDoseMcgKgMin = 0.08;
      const stepIncreaseMcgKgMin = 0.04;
      const newDoseMcgKgMin = 0.12;
      const concMcgMl = 32; // 8 mg in 250 mL
      const totalMcgMin = pair.kg * newDoseMcgKgMin;
      const totalMcgHr = totalMcgMin * 60;
      const newRateMlHr = Math.round((totalMcgHr / concMcgMl) * 10) / 10;

      return {
        scenario: `An adult patient weighing ${pair.lb} lb is on norepinephrine at 0.08 mcg/kg/min. Mean arterial pressure remains 58 mmHg (target ≥ 65 mmHg). The physician orders an upward titration of 0.04 mcg/kg/min.`,
        orderText: `Titrate norepinephrine by +0.04 mcg/kg/min to reach new rate of 0.12 mcg/kg/min`,
        availableText: `Norepinephrine 8 mg in 250 mL D5W (32 mcg/mL)`,
        patientWeightLb: pair.lb,
        patientWeightKg: pair.kg,
        prompt: `Calculate the new IV pump rate in mL/hr.`,
        correctAnswer: newRateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          `Step 1: Convert ${pair.lb} lb ÷ 2.2 = ${pair.kg} kg.`,
          `Step 2: New dose rate is 0.08 + 0.04 = 0.12 mcg/kg/min.`,
          `Step 3: Calculate mcg/min: ${pair.kg} × 0.12 = ${totalMcgMin} mcg/min.`,
          `Step 4: Convert to mcg/hr: ${totalMcgMin} × 60 = ${totalMcgHr} mcg/hr.`,
          `Step 5: Divide by 32 mcg/mL: ${totalMcgHr} ÷ 32 = ${newRateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Weight",
            formula: "Pounds ÷ 2.2",
            calculation: `${pair.lb} lb ÷ 2.2 = ${pair.kg} kg`,
            result: `${pair.kg} kg`,
          },
          {
            stepNumber: 2,
            title: "Calculate New Hourly Dose",
            formula: "Weight (kg) × 0.12 mcg/kg/min × 60 min",
            calculation: `${pair.kg} kg × 0.12 mcg/kg/min × 60 = ${totalMcgHr} mcg/hr`,
            result: `${totalMcgHr} mcg/hr`,
          },
          {
            stepNumber: 3,
            title: "Calculate New Pump Rate",
            formula: "mcg/hr ÷ 32 mcg/mL",
            calculation: `${totalMcgHr} mcg/hr ÷ 32 mcg/mL = ${newRateMlHr} mL/hr`,
            result: `${newRateMlHr} mL/hr`,
          },
        ],
        rawVariables: { lb: pair.lb, kg: pair.kg, newDoseMcgKgMin, newRateMlHr },
      };
    },
  },
  {
    id: "multi-dexmedetomidine-lb-workflow",
    category: "multi-step",
    subtype: "full-workflow-icu",
    difficulty: "critical-care",
    title: "Dexmedetomidine Workflow from Pounds (mcg/kg/hr)",
    clinicalContext: "Adult Step-Down / ICU Light Sedation Order",
    generate: (rng) => {
      const pair = pick(ADULT_WEIGHTS_LB, rng);
      const doseMcgKgHr = pick([0.5, 0.7, 1.0, 1.2], rng);
      const concMcgMl = 4; // 400 mcg in 100 mL
      const totalMcgHr = pair.kg * doseMcgKgHr;
      const rateMlHr = Math.round((totalMcgHr / concMcgMl) * 10) / 10;

      return {
        scenario: `An adult ICU patient weighing ${pair.lb} lb is prescribed dexmedetomidine for light procedural sedation. Note that dexmedetomidine dosing is in mcg/kg/HOUR.`,
        orderText: `Dexmedetomidine IV at ${doseMcgKgHr} mcg/kg/hr`,
        availableText: `Precedex 400 mcg in 100 mL 0.9% NS (4 mcg/mL)`,
        patientWeightLb: pair.lb,
        patientWeightKg: pair.kg,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          `Step 1: Convert ${pair.lb} lb ÷ 2.2 = ${pair.kg} kg.`,
          `Step 2: Calculate total mcg/hr: ${pair.kg} × ${doseMcgKgHr} = ${totalMcgHr} mcg/hr (no 60-min multiplication because order is per hour).`,
          `Step 3: Divide by 4 mcg/mL: ${totalMcgHr} ÷ 4 = ${rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Weight",
            formula: "Pounds ÷ 2.2",
            calculation: `${pair.lb} lb ÷ 2.2 = ${pair.kg} kg`,
            result: `${pair.kg} kg`,
          },
          {
            stepNumber: 2,
            title: "Calculate Hourly Micrograms",
            formula: "Weight (kg) × Dose (mcg/kg/hr)",
            calculation: `${pair.kg} kg × ${doseMcgKgHr} mcg/kg/hr = ${totalMcgHr} mcg/hr`,
            result: `${totalMcgHr} mcg/hr`,
          },
          {
            stepNumber: 3,
            title: "Calculate Flow Rate",
            formula: "mcg/hr ÷ 4 mcg/mL",
            calculation: `${totalMcgHr} mcg/hr ÷ 4 mcg/mL = ${rateMlHr} mL/hr`,
            result: `${rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { lb: pair.lb, kg: pair.kg, doseMcgKgHr, rateMlHr },
      };
    },
  },
  {
    id: "multi-epinephrine-shock-workflow",
    category: "multi-step",
    subtype: "full-workflow-icu",
    difficulty: "critical-care",
    title: "Epinephrine Anaphylactic Shock Infusion Workflow",
    clinicalContext: "Adult Emergency / ICU Severe Anaphylaxis Protocol",
    generate: (rng) => {
      const doseMcgMin = pick([2, 5, 8, 10, 15], rng);
      const bagMg = 4;
      const bagMl = 250;
      const concMcgMl = (bagMg * 1000) / bagMl; // 16 mcg/mL
      const totalMcgHr = doseMcgMin * 60;
      const rateMlHr = Math.round((totalMcgHr / concMcgMl) * 10) / 10;

      return {
        scenario: `An adult inpatient experiencing severe refractory anaphylactic shock is placed on a continuous epinephrine infusion following intramuscular epinephrine doses.`,
        orderText: `Epinephrine continuous IV infusion at ${doseMcgMin} mcg/min`,
        availableText: `Epinephrine ${bagMg} mg in ${bagMl} mL 0.9% NS (${concMcgMl} mcg/mL)`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          `Step 1: Convert ${doseMcgMin} mcg/min to mcg/hr: ${doseMcgMin} × 60 = ${totalMcgHr} mcg/hr.`,
          `Step 2: Determine concentration: (4 mg × 1,000) ÷ 250 mL = 16 mcg/mL.`,
          `Step 3: Calculate pump rate: ${totalMcgHr} ÷ 16 = ${rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert to Hourly Micrograms",
            formula: "mcg/min × 60",
            calculation: `${doseMcgMin} mcg/min × 60 = ${totalMcgHr} mcg/hr`,
            result: `${totalMcgHr} mcg/hr`,
          },
          {
            stepNumber: 2,
            title: "Determine Drug Concentration",
            formula: "4,000 mcg ÷ 250 mL",
            calculation: `4,000 mcg ÷ 250 mL = 16 mcg/mL`,
            result: `16 mcg/mL`,
          },
          {
            stepNumber: 3,
            title: "Calculate Flow Rate",
            formula: "mcg/hr ÷ 16 mcg/mL",
            calculation: `${totalMcgHr} mcg/hr ÷ 16 mcg/mL = ${rateMlHr} mL/hr`,
            result: `${rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { doseMcgMin, bagMg, bagMl, concMcgMl, rateMlHr },
      };
    },
  },
  {
    id: "multi-daptomycin-reconstitution-infusion",
    category: "multi-step",
    subtype: "full-workflow-icu",
    difficulty: "critical-care",
    title: "5-Step Daptomycin Workflow (lb → kg → mg → mL reconstituted → infusion rate)",
    clinicalContext: "Adult Inpatient MRSA Sepsis Reconstitution & Delivery",
    generate: (rng) => {
      const data = pick([
        { lb: 176, kg: 80, doseMgKg: 6, totalMg: 480, vialMg: 500, diluentMl: 10, concMgMl: 50, volDrawnMl: 9.6, bagMl: 100, totalInfusionMl: 109.6, infusionMinutes: 30, rateMlHr: 219.2 },
        { lb: 154, kg: 70, doseMgKg: 6, totalMg: 420, vialMg: 500, diluentMl: 10, concMgMl: 50, volDrawnMl: 8.4, bagMl: 100, totalInfusionMl: 108.4, infusionMinutes: 30, rateMlHr: 216.8 },
        { lb: 198, kg: 90, doseMgKg: 6, totalMg: 540, vialMg: 500, diluentMl: 10, concMgMl: 50, volDrawnMl: 10.8, bagMl: 100, totalInfusionMl: 110.8, infusionMinutes: 30, rateMlHr: 221.6 },
        { lb: 132, kg: 60, doseMgKg: 6, totalMg: 360, vialMg: 500, diluentMl: 10, concMgMl: 50, volDrawnMl: 7.2, bagMl: 100, totalInfusionMl: 107.2, infusionMinutes: 30, rateMlHr: 214.4 },
      ], rng);

      return {
        scenario: `An adult inpatient weighing ${data.lb} lb with MRSA bacteremia is prescribed IV daptomycin at ${data.doseMgKg} mg/kg once daily. The pharmacy supplies a 500 mg powder vial with instructions: "Reconstitute with 10 mL 0.9% NS (yielding 50 mg/mL). Add ordered dose to a 100 mL NS infusion bag and infuse over 30 minutes."`,
        orderText: `Daptomycin ${data.doseMgKg} mg/kg IV in 100 mL NS over 30 minutes (Weight: ${data.lb} lb)`,
        availableText: `Daptomycin 500 mg powder vial (yields 50 mg/mL with 10 mL diluent)`,
        patientWeightLb: data.lb,
        patientWeightKg: data.kg,
        prompt: `How many mL of reconstituted daptomycin should the nurse withdraw from the vial to add to the IV piggyback bag?`,
        correctAnswer: data.volDrawnMl,
        answerUnit: "mL",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          `Step 1: Convert weight: ${data.lb} lb ÷ 2.2 = ${data.kg} kg.`,
          `Step 2: Calculate total mg required: ${data.kg} kg × ${data.doseMgKg} mg/kg = ${data.totalMg} mg.`,
          `Step 3: Divide total mg by reconstituted concentration (${data.concMgMl} mg/mL): ${data.totalMg} ÷ 50 = ${data.volDrawnMl} mL.`,
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
            title: "Calculate Total Milligrams Ordered",
            formula: "Weight (kg) × Dose (mg/kg)",
            calculation: `${data.kg} kg × ${data.doseMgKg} mg/kg = ${data.totalMg} mg`,
            result: `${data.totalMg} mg`,
          },
          {
            stepNumber: 3,
            title: "Calculate Volume to Withdraw from Vial",
            formula: "Total Milligrams ÷ Reconstituted Concentration (50 mg/mL)",
            calculation: `${data.totalMg} mg ÷ 50 mg/mL = ${data.volDrawnMl} mL`,
            result: `${data.volDrawnMl} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "multi-vancomycin-peak-trough-infusion",
    category: "multi-step",
    subtype: "full-workflow-icu",
    difficulty: "critical-care",
    title: "4-Step Vancomycin Infusion (lb → kg → mg → mL/hr over 90 min)",
    clinicalContext: "Adult Inpatient MRSA Pharmacokinetics Protocol",
    generate: (rng) => {
      const data = pick([
        { lb: 176, kg: 80, doseMgKg: 15, totalMg: 1200, bagMl: 250, runMinutes: 90, rateMlHr: 166.7 },
        { lb: 154, kg: 70, doseMgKg: 15, totalMg: 1050, bagMl: 250, runMinutes: 90, rateMlHr: 166.7 },
        { lb: 198, kg: 90, doseMgKg: 15, totalMg: 1350, bagMl: 250, runMinutes: 90, rateMlHr: 166.7 },
        { lb: 132, kg: 60, doseMgKg: 15, totalMg: 900, bagMl: 200, runMinutes: 60, rateMlHr: 200.0 },
      ], rng);

      return {
        scenario: `An adult inpatient weighing ${data.lb} lb is prescribed weight-based IV vancomycin at ${data.doseMgKg} mg/kg. The pharmacy compounds the ${data.totalMg} mg dose into a ${data.bagMl} mL bag of 0.9% Normal Saline with orders to infuse over ${data.runMinutes} minutes to avoid Red Man syndrome.`,
        orderText: `Vancomycin ${data.totalMg} mg in ${data.bagMl} mL NS IVPB over ${data.runMinutes} minutes`,
        patientWeightLb: data.lb,
        patientWeightKg: data.kg,
        prompt: `Calculate the IV pump infusion rate in mL/hr.`,
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth (e.g. 166.7).",
        hints: [
          `Step 1: Note that the bag volume is ${data.bagMl} mL and run time is ${data.runMinutes} minutes.`,
          `Step 2: Apply IV pump formula: (Total Volume in mL ÷ Run Time in Minutes) × 60.`,
          `Calculate: (${data.bagMl} ÷ ${data.runMinutes}) × 60 = ${data.rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate IV Pump Flow Rate",
            formula: "(Volume in mL ÷ Minutes) × 60",
            calculation: `(${data.bagMl} mL ÷ ${data.runMinutes} min) × 60 = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "multi-octreotide-variceal-bleed",
    category: "multi-step",
    subtype: "full-workflow-icu",
    difficulty: "advanced",
    title: "Octreotide Variceal Bleed Workflow (Bolus + Continuous Drip)",
    clinicalContext: "Adult Emergency / ICU Acute Esophageal Variceal Hemorrhage",
    generate: (rng) => {
      const data = pick([
        { bolusMcg: 50, bolusVialConc: 100, bolusMl: 0.5, infusionMcgHr: 50, bagMcg: 500, bagMl: 250, concMcgMl: 2, rateMlHr: 25 },
        { bolusMcg: 100, bolusVialConc: 100, bolusMl: 1.0, infusionMcgHr: 50, bagMcg: 500, bagMl: 250, concMcgMl: 2, rateMlHr: 25 },
        { bolusMcg: 50, bolusVialConc: 100, bolusMl: 0.5, infusionMcgHr: 25, bagMcg: 500, bagMl: 250, concMcgMl: 2, rateMlHr: 12.5 },
      ], rng);

      return {
        scenario: `An adult patient with decompensated cirrhosis presenting with acute upper GI variceal hemorrhage is prescribed an immediate IV bolus of ${data.bolusMcg} mcg octreotide followed by a continuous infusion at ${data.infusionMcgHr} mcg/hr.`,
        orderText: `• Octreotide ${data.bolusMcg} mcg IV bolus stat
• Followed by Octreotide continuous IV infusion at ${data.infusionMcgHr} mcg/hr`,
        availableText: `• Octreotide 100 mcg/mL ampules for bolus
• Octreotide 500 mcg in 250 mL 0.9% NS bag (${data.concMcgMl} mcg/mL)`,
        prompt: `Calculate the IV pump rate in mL/hr for the continuous maintenance infusion.`,
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "State exact number or round to nearest tenth.",
        hints: [
          `Bag concentration is 500 mcg ÷ 250 mL = 2 mcg/mL.`,
          `Divide ordered hourly infusion rate (${data.infusionMcgHr} mcg/hr) by 2 mcg/mL.`,
          `Calculate: ${data.infusionMcgHr} ÷ 2 = ${data.rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Determine Infusion Bag Concentration",
            formula: "500 mcg ÷ 250 mL",
            calculation: `500 mcg ÷ 250 mL = 2 mcg/mL`,
            result: `2 mcg/mL`,
          },
          {
            stepNumber: 2,
            title: "Calculate Maintenance Flow Rate",
            formula: "Ordered mcg/hr ÷ Concentration (2 mcg/mL)",
            calculation: `${data.infusionMcgHr} mcg/hr ÷ 2 mcg/mL = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "multi-pantoprazole-gi-bleed-infusion",
    category: "multi-step",
    subtype: "full-workflow-icu",
    difficulty: "beginner",
    title: "Continuous High-Dose Proton Pump Inhibitor Infusion Workflow",
    clinicalContext: "Adult Inpatient Peptic Ulcer Hemorrhage Management",
    generate: (rng) => {
      const data = pick([
        { bolusMg: 80, dripMgHr: 8, bagMg: 80, bagMl: 100, concMgMl: 0.8, rateMlHr: 10 },
        { bolusMg: 80, dripMgHr: 8, bagMg: 160, bagMl: 200, concMgMl: 0.8, rateMlHr: 10 },
        { bolusMg: 80, dripMgHr: 4, bagMg: 80, bagMl: 100, concMgMl: 0.8, rateMlHr: 5 },
      ], rng);

      return {
        scenario: `An adult inpatient post-endoscopy with a bleeding peptic ulcer receives an 80 mg IV pantoprazole bolus followed by a continuous infusion at ${data.dripMgHr} mg/hr.`,
        orderText: `Pantoprazole continuous IV infusion at ${data.dripMgHr} mg/hr for 72 hours`,
        availableText: `Pantoprazole ${data.bagMg} mg in ${data.bagMl} mL 0.9% NS (${data.concMgMl} mg/mL)`,
        prompt: `Calculate the IV pump flow rate in mL/hr.`,
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 0,
        roundingInstruction: "State exact whole number.",
        hints: [
          `Concentration is ${data.bagMg} mg ÷ ${data.bagMl} mL = ${data.concMgMl} mg/mL.`,
          `Divide ordered mg/hr by concentration: ${data.dripMgHr} mg/hr ÷ ${data.concMgMl} mg/mL.`,
          `Calculate: ${data.dripMgHr} ÷ ${data.concMgMl} = ${data.rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Flow Rate",
            formula: "Ordered mg/hr ÷ Concentration (0.8 mg/mL)",
            calculation: `${data.dripMgHr} mg/hr ÷ 0.8 mg/mL = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "multi-bivalirudin-pci-protocol",
    category: "multi-step",
    subtype: "full-workflow-icu",
    difficulty: "critical-care",
    title: "Direct Thrombin Inhibitor (Bivalirudin) Cath Lab Workflow",
    clinicalContext: "Adult Interventional Cardiology HIT Protocol",
    generate: (rng) => {
      const data = pick([
        { lb: 176, kg: 80, bolusMgKg: 0.75, bolusMg: 60.0, dripMgKgHr: 1.75, hourlyMg: 140.0, bagMg: 250, bagMl: 500, concMgMl: 0.5, rateMlHr: 280.0 },
        { lb: 154, kg: 70, bolusMgKg: 0.75, bolusMg: 52.5, dripMgKgHr: 1.75, hourlyMg: 122.5, bagMg: 250, bagMl: 500, concMgMl: 0.5, rateMlHr: 245.0 },
        { lb: 198, kg: 90, bolusMgKg: 0.75, bolusMg: 67.5, dripMgKgHr: 1.75, hourlyMg: 157.5, bagMg: 250, bagMl: 500, concMgMl: 0.5, rateMlHr: 315.0 },
        { lb: 132, kg: 60, bolusMgKg: 0.75, bolusMg: 45.0, dripMgKgHr: 1.75, hourlyMg: 105.0, bagMg: 250, bagMl: 500, concMgMl: 0.5, rateMlHr: 210.0 },
      ], rng);

      return {
        scenario: `An adult cardiac catheterization patient weighing ${data.lb} lb with suspected Heparin-Induced Thrombocytopenia (HIT) is prescribed IV bivalirudin (Angiomax). The order specifies an initial IV bolus of ${data.bolusMgKg} mg/kg followed immediately by a continuous infusion of ${data.dripMgKgHr} mg/kg/hr.`,
        orderText: `Bivalirudin ${data.dripMgKgHr} mg/kg/hr continuous IV infusion (Weight: ${data.lb} lb)`,
        availableText: `Bivalirudin 250 mg in 500 mL D5W (${data.concMgMl} mg/mL)`,
        patientWeightLb: data.lb,
        patientWeightKg: data.kg,
        prompt: `Calculate the IV pump infusion rate in mL/hr.`,
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 0,
        roundingInstruction: "State whole number.",
        hints: [
          `Step 1: Convert pounds to kg: ${data.lb} lb ÷ 2.2 = ${data.kg} kg.`,
          `Step 2: Calculate hourly mg: ${data.kg} kg × ${data.dripMgKgHr} mg/kg/hr = ${data.hourlyMg} mg/hr.`,
          `Step 3: Concentration is 250 mg ÷ 500 mL = 0.5 mg/mL.`,
          `Step 4: Pump rate: ${data.hourlyMg} ÷ 0.5 = ${data.rateMlHr} mL/hr.`,
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
            title: "Calculate Hourly Milligrams",
            formula: "Weight (kg) × Dose (mg/kg/hr)",
            calculation: `${data.kg} kg × ${data.dripMgKgHr} mg/kg/hr = ${data.hourlyMg} mg/hr`,
            result: `${data.hourlyMg} mg/hr`,
          },
          {
            stepNumber: 3,
            title: "Calculate Pump Flow Rate",
            formula: "Hourly Milligrams ÷ Concentration (0.5 mg/mL)",
            calculation: `${data.hourlyMg} mg/hr ÷ 0.5 mg/mL = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "multi-potassium-replacement-protocol",
    category: "multi-step",
    subtype: "full-workflow-icu",
    difficulty: "intermediate",
    title: "Sequential Potassium Replacement Protocol Run Time",
    clinicalContext: "Adult Inpatient Hypokalemia Replacement Protocol",
    generate: (rng) => {
      const data = pick([
        { totalMeq: 40, numBags: 2, meqPerBag: 20, bagMl: 100, maxMeqHr: 10, pumpRateMlHr: 50, runTimeHours: 4 },
        { totalMeq: 20, numBags: 1, meqPerBag: 20, bagMl: 100, maxMeqHr: 10, pumpRateMlHr: 50, runTimeHours: 2 },
        { totalMeq: 60, numBags: 3, meqPerBag: 20, bagMl: 100, maxMeqHr: 10, pumpRateMlHr: 50, runTimeHours: 6 },
      ], rng);

      return {
        scenario: `An adult inpatient on a telemetry unit has a serum potassium level of 3.1 mEq/L. Per the hypokalemia replacement protocol, the patient is ordered ${data.totalMeq} mEq of IV potassium chloride to be infused peripherally at a maximum safe rate of ${data.maxMeqHr} mEq/hr. The pharmacy supplies ${data.numBags} piggyback bags, each containing ${data.meqPerBag} mEq KCl in ${data.bagMl} mL NS (infusing at ${data.pumpRateMlHr} mL/hr per bag).`,
        orderText: `Potassium chloride ${data.totalMeq} mEq IV peripheral infusion at max ${data.maxMeqHr} mEq/hr`,
        prompt: `How many total hours will it take to complete the entire ${data.totalMeq} mEq potassium replacement?`,
        correctAnswer: data.runTimeHours,
        answerUnit: "hours",
        answerPrecision: 0,
        roundingInstruction: "State whole number of hours.",
        hints: [
          `Divide total ordered mEq (${data.totalMeq} mEq) by the hourly infusion limit (${data.maxMeqHr} mEq/hr).`,
          `Calculate: ${data.totalMeq} mEq ÷ ${data.maxMeqHr} mEq/hr = ${data.runTimeHours} hours.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Total Infusion Duration",
            formula: "Total mEq Ordered ÷ Max Hourly mEq Rate",
            calculation: `${data.totalMeq} mEq ÷ ${data.maxMeqHr} mEq/hr = ${data.runTimeHours} hours`,
            result: `${data.runTimeHours} hours`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "multi-aminoglycoside-extended-interval",
    category: "multi-step",
    subtype: "full-workflow-icu",
    difficulty: "advanced",
    title: "High-Dose Extended-Interval Gentamicin Syringe Volume (Pounds)",
    clinicalContext: "Adult Inpatient Gram-Negative Pyelonephritis",
    generate: (rng) => {
      const data = pick([
        { lb: 154, kg: 70, doseMgKg: 7, totalMg: 490, vialConcMgMl: 40, syringeMl: 12.25 },
        { lb: 176, kg: 80, doseMgKg: 7, totalMg: 560, vialConcMgMl: 40, syringeMl: 14.0 },
        { lb: 132, kg: 60, doseMgKg: 7, totalMg: 420, vialConcMgMl: 40, syringeMl: 10.5 },
        { lb: 198, kg: 90, doseMgKg: 7, totalMg: 630, vialConcMgMl: 40, syringeMl: 15.75 },
      ], rng);

      return {
        scenario: `An adult inpatient weighing ${data.lb} lb with urosepsis is prescribed extended-interval once-daily gentamicin at ${data.doseMgKg} mg/kg IV.`,
        orderText: `Gentamicin ${data.doseMgKg} mg/kg IV once daily (Weight: ${data.lb} lb)`,
        availableText: `Gentamicin sulfate injection 40 mg/mL vials`,
        patientWeightLb: data.lb,
        patientWeightKg: data.kg,
        prompt: `How many mL should the nurse withdraw from the vial to compound the IV piggyback?`,
        correctAnswer: data.syringeMl,
        answerUnit: "mL",
        answerPrecision: 2,
        roundingInstruction: "Round to nearest hundredth or tenth (e.g. 12.25 or 14.0).",
        hints: [
          `Step 1: Convert weight: ${data.lb} lb ÷ 2.2 = ${data.kg} kg.`,
          `Step 2: Calculate total dose: ${data.kg} kg × ${data.doseMgKg} mg/kg = ${data.totalMg} mg.`,
          `Step 3: Divide total dose by vial concentration (${data.vialConcMgMl} mg/mL): ${data.totalMg} ÷ 40 = ${data.syringeMl} mL.`,
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
            title: "Calculate Total Dose",
            formula: "Weight (kg) × Dose (mg/kg)",
            calculation: `${data.kg} kg × ${data.doseMgKg} mg/kg = ${data.totalMg} mg`,
            result: `${data.totalMg} mg`,
          },
          {
            stepNumber: 3,
            title: "Calculate Syringe Volume",
            formula: "Total Milligrams ÷ Vial Concentration (40 mg/mL)",
            calculation: `${data.totalMg} mg ÷ 40 mg/mL = ${data.syringeMl} mL`,
            result: `${data.syringeMl} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "multi-phenobarbital-status-epilepticus",
    category: "multi-step",
    subtype: "full-workflow-icu",
    difficulty: "critical-care",
    title: "Weight-Based Phenobarbital Loading Run Time (Max 50 mg/min)",
    clinicalContext: "Adult Neuro-ICU Status Epilepticus Protocol",
    generate: (rng) => {
      const data = pick([
        { lb: 176, kg: 80, doseMgKg: 20, totalMg: 1600, maxMgMin: 50, durationMinutes: 32 },
        { lb: 154, kg: 70, doseMgKg: 20, totalMg: 1400, maxMgMin: 50, durationMinutes: 28 },
        { lb: 198, kg: 90, doseMgKg: 20, totalMg: 1800, maxMgMin: 50, durationMinutes: 36 },
        { lb: 132, kg: 60, doseMgKg: 20, totalMg: 1200, maxMgMin: 50, durationMinutes: 24 },
      ], rng);

      return {
        scenario: `An adult patient weighing ${data.lb} lb in refractory status epilepticus is ordered an IV loading dose of phenobarbital at ${data.doseMgKg} mg/kg. To avoid cardiovascular collapse, the institutional maximum IV rate is ${data.maxMgMin} mg/min.`,
        orderText: `Phenobarbital ${data.doseMgKg} mg/kg IV loading infusion at maximum ${data.maxMgMin} mg/min (Weight: ${data.lb} lb)`,
        patientWeightLb: data.lb,
        patientWeightKg: data.kg,
        prompt: `Calculate the minimum infusion duration in minutes required to safely administer this entire loading dose.`,
        correctAnswer: data.durationMinutes,
        answerUnit: "minutes",
        answerPrecision: 0,
        roundingInstruction: "State whole number of minutes.",
        hints: [
          `Step 1: Convert weight: ${data.lb} lb ÷ 2.2 = ${data.kg} kg.`,
          `Step 2: Calculate total loading dose: ${data.kg} kg × ${data.doseMgKg} mg/kg = ${data.totalMg} mg.`,
          `Step 3: Divide total dose by maximum delivery rate (${data.maxMgMin} mg/min): ${data.totalMg} ÷ 50 = ${data.durationMinutes} minutes.`,
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
            title: "Calculate Total Loading Dose",
            formula: "Weight (kg) × Dose (mg/kg)",
            calculation: `${data.kg} kg × ${data.doseMgKg} mg/kg = ${data.totalMg} mg`,
            result: `${data.totalMg} mg`,
          },
          {
            stepNumber: 3,
            title: "Calculate Minimum Safe Run Duration",
            formula: "Total Milligrams ÷ Maximum Rate (50 mg/min)",
            calculation: `${data.totalMg} mg ÷ 50 mg/min = ${data.durationMinutes} minutes`,
            result: `${data.durationMinutes} minutes`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "multi-intralipid-rescue-toxicity",
    category: "multi-step",
    subtype: "full-workflow-icu",
    difficulty: "advanced",
    title: "Lipid Emulsion Rescue Bolus for Local Anesthetic Systemic Toxicity (LAST)",
    clinicalContext: "Adult Emergency / OR LAST Resuscitation Protocol",
    generate: (rng) => {
      const data = pick([
        { lb: 176, kg: 80, bolusMlKg: 1.5, bolusMl: 120 },
        { lb: 154, kg: 70, bolusMlKg: 1.5, bolusMl: 105 },
        { lb: 198, kg: 90, bolusMlKg: 1.5, bolusMl: 135 },
        { lb: 132, kg: 60, bolusMlKg: 1.5, bolusMl: 90 },
      ], rng);

      return {
        scenario: `An adult surgical patient weighing ${data.lb} lb develops local anesthetic systemic toxicity (LAST) with cardiac arrest following a peripheral nerve block. The code team initiates 20% Intralipid therapy with an initial IV bolus of ${data.bolusMlKg} mL/kg over 2 minutes.`,
        orderText: `20% Lipid Emulsion ${data.bolusMlKg} mL/kg IV bolus over 2 minutes stat (Weight: ${data.lb} lb)`,
        patientWeightLb: data.lb,
        patientWeightKg: data.kg,
        prompt: `Calculate the initial bolus volume in mL.`,
        correctAnswer: data.bolusMl,
        answerUnit: "mL",
        answerPrecision: 0,
        roundingInstruction: "State whole number of mL.",
        hints: [
          `Step 1: Convert pounds to kilograms: ${data.lb} lb ÷ 2.2 = ${data.kg} kg.`,
          `Step 2: Multiply weight by ordered mL/kg: ${data.kg} kg × ${data.bolusMlKg} mL/kg.`,
          `Calculate: ${data.kg} × 1.5 = ${data.bolusMl} mL.`,
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
            title: "Calculate Bolus Volume",
            formula: "Weight (kg) × Bolus Dose (1.5 mL/kg)",
            calculation: `${data.kg} kg × 1.5 mL/kg = ${data.bolusMl} mL`,
            result: `${data.bolusMl} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "multi-argatroban-hit-titration",
    category: "multi-step",
    subtype: "full-workflow-icu",
    difficulty: "critical-care",
    title: "Argatroban Infusion for Heparin-Induced Thrombocytopenia (HIT)",
    clinicalContext: "Adult CCU Direct Thrombin Inhibitor Anticoagulation",
    generate: (rng) => {
      const data = pick([
        { weightKg: 80, doseMcgKgMin: 2.0, bagMg: 250, bagMl: 250, concMcgMl: 1000, minuteMcg: 160, hourlyMcg: 9600, rateMlHr: 9.6 },
        { weightKg: 70, doseMcgKgMin: 2.0, bagMg: 250, bagMl: 250, concMcgMl: 1000, minuteMcg: 140, hourlyMcg: 8400, rateMlHr: 8.4 },
        { weightKg: 90, doseMcgKgMin: 2.0, bagMg: 250, bagMl: 250, concMcgMl: 1000, minuteMcg: 180, hourlyMcg: 10800, rateMlHr: 10.8 },
        { weightKg: 65, doseMcgKgMin: 1.5, bagMg: 250, bagMl: 250, concMcgMl: 1000, minuteMcg: 97.5, hourlyMcg: 5850, rateMlHr: 5.9 },
      ], rng);

      return {
        scenario: `An adult coronary care patient weighing ${data.weightKg} kg diagnosed with Heparin-Induced Thrombocytopenia with thrombosis (HITT) is prescribed continuous IV argatroban at ${data.doseMcgKgMin} mcg/kg/min.`,
        orderText: `Argatroban continuous IV infusion at ${data.doseMcgKgMin} mcg/kg/min (Patient weight: ${data.weightKg} kg)`,
        availableText: `Argatroban 250 mg in 250 mL 0.9% NS (1 mg/mL = 1,000 mcg/mL)`,
        patientWeightKg: data.weightKg,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          `Step 1: Calculate minute mcg: ${data.weightKg} kg × ${data.doseMcgKgMin} mcg/kg/min = ${data.minuteMcg} mcg/min.`,
          `Step 2: Convert to hourly mcg: ${data.minuteMcg} × 60 = ${data.hourlyMcg} mcg/hr.`,
          `Step 3: Bag concentration: (250 mg × 1,000) ÷ 250 mL = 1,000 mcg/mL.`,
          `Step 4: Rate: ${data.hourlyMcg} ÷ 1,000 = ${data.rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Minute Micrograms",
            formula: "Weight (kg) × Dose (mcg/kg/min)",
            calculation: `${data.weightKg} kg × ${data.doseMcgKgMin} mcg/kg/min = ${data.minuteMcg} mcg/min`,
            result: `${data.minuteMcg} mcg/min`,
          },
          {
            stepNumber: 2,
            title: "Convert to Hourly Micrograms",
            formula: "mcg/min × 60",
            calculation: `${data.minuteMcg} mcg/min × 60 = ${data.hourlyMcg} mcg/hr`,
            result: `${data.hourlyMcg} mcg/hr`,
          },
          {
            stepNumber: 3,
            title: "Calculate Flow Rate",
            formula: "Hourly Micrograms ÷ Concentration (1,000 mcg/mL)",
            calculation: `${data.hourlyMcg} mcg/hr ÷ 1,000 mcg/mL = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "multi-magnesium-infusion-eclamp-rate",
    category: "multi-step",
    subtype: "full-workflow-icu",
    difficulty: "intermediate",
    title: "Magnesium Sulfate Continuous Maintenance Infusion (g/hr to mL/hr)",
    clinicalContext: "Adult Inpatient Magnesium Repletion & Neuroprotection",
    generate: (rng) => {
      const data = pick([
        { orderedGHr: 2.0, bagGrams: 20, bagMl: 500, concGMl: 0.04, rateMlHr: 50 },
        { orderedGHr: 1.0, bagGrams: 20, bagMl: 500, concGMl: 0.04, rateMlHr: 25 },
        { orderedGHr: 1.5, bagGrams: 20, bagMl: 500, concGMl: 0.04, rateMlHr: 37.5 },
        { orderedGHr: 2.0, bagGrams: 40, bagMl: 1000, concGMl: 0.04, rateMlHr: 50 },
      ], rng);

      return {
        scenario: `An adult ICU patient following a loading dose is ordered continuous intravenous magnesium sulfate at ${data.orderedGHr} g/hr.`,
        orderText: `Magnesium Sulfate continuous IV infusion at ${data.orderedGHr} g/hr`,
        availableText: `Magnesium Sulfate ${data.bagGrams} g in ${data.bagMl} mL D5W (${data.bagGrams * 1000 / data.bagMl} mg/mL = ${data.concGMl} g/mL)`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "State exact number or round to nearest tenth.",
        hints: [
          `Step 1: Bag concentration in g/mL is ${data.bagGrams} g ÷ ${data.bagMl} mL = ${data.concGMl} g/mL.`,
          `Step 2: Divide ordered g/hr by concentration: ${data.orderedGHr} g/hr ÷ ${data.concGMl} g/mL.`,
          `Calculate: ${data.orderedGHr} ÷ ${data.concGMl} = ${data.rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Flow Rate",
            formula: "Ordered g/hr ÷ Concentration (g/mL)",
            calculation: `${data.orderedGHr} g/hr ÷ ${data.concGMl} g/mL = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "multi-hydrocortisone-septic-shock",
    category: "multi-step",
    subtype: "full-workflow-icu",
    difficulty: "intermediate",
    title: "Continuous Hydrocortisone Infusion Rate and Shift Total",
    clinicalContext: "Adult ICU Refractory Septic Shock Protocol",
    generate: (rng) => {
      const data = pick([
        { dailyMg: 200, bagMg: 200, bagMl: 250, hourlyMg: 8.33, concMgMl: 0.8, rateMlHr: 10.4, shiftMg: 66.7 },
        { dailyMg: 200, bagMg: 200, bagMl: 500, hourlyMg: 8.33, concMgMl: 0.4, rateMlHr: 20.8, shiftMg: 66.7 },
        { dailyMg: 300, bagMg: 300, bagMl: 250, hourlyMg: 12.5, concMgMl: 1.2, rateMlHr: 10.4, shiftMg: 100.0 },
      ], rng);

      return {
        scenario: `An adult ICU patient with vasopressor-refractory septic shock is prescribed continuous IV hydrocortisone at ${data.dailyMg} mg per 24 hours. The pharmacy compounds ${data.bagMg} mg of hydrocortisone in ${data.bagMl} mL of 0.9% Normal Saline.`,
        orderText: `Hydrocortisone ${data.dailyMg} mg continuous IV infusion over 24 hours`,
        availableText: `Hydrocortisone ${data.bagMg} mg in ${data.bagMl} mL NS`,
        prompt: `Calculate the IV pump flow rate in mL/hr.`,
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth (e.g. 10.4).",
        hints: [
          `Divide total bag volume (${data.bagMl} mL) by 24 hours.`,
          `Calculate: ${data.bagMl} mL ÷ 24 hr = ${data.rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Hourly Infusion Rate",
            formula: "Total Volume (mL) ÷ 24 Hours",
            calculation: `${data.bagMl} mL ÷ 24 hr = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
];
