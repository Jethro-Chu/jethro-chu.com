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
        expectedAnswer: rateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to the nearest tenth.",
        tolerance: 0.1,
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
        expectedAnswer: rateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.1,
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
        expectedAnswer: doseMcgKgMin,
        expectedUnit: "mcg/kg/min",
        roundingMode: "hundredth",
        roundingInstruction: "Round to nearest hundredth (e.g. 0.08 or 0.15).",
        tolerance: 0.02,
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
        expectedAnswer: rateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.1,
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
        expectedAnswer: rateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.1,
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
        expectedAnswer: rateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.1,
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
        expectedAnswer: rateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.1,
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
        expectedAnswer: newRateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.1,
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
        expectedAnswer: rateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.1,
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
        expectedAnswer: rateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.1,
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
];
