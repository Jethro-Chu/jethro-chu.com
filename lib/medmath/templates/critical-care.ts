import type { QuestionTemplate } from "../types.ts";
import { pick, ADULT_WEIGHTS_KG, ADULT_WEIGHTS_LB } from "./helpers.ts";

export const criticalCareTemplates: QuestionTemplate[] = [
  {
    id: "cc-norepinephrine-mcg-kg-min",
    category: "critical-care",
    subtype: "vasoactive-drip",
    difficulty: "advanced",
    title: "Norepinephrine (Levophed) Infusion Rate (mcg/kg/min)",
    clinicalContext: "Adult Critical Care Septic Shock Protocol",
    generate: (rng) => {
      const weightKg = pick([60, 70, 75, 80, 85, 90, 100], rng);
      const doseMcgKgMin = pick([0.05, 0.08, 0.1, 0.15, 0.2], rng);
      const bagMg = 8;
      const bagMl = 250;
      const concMcgMl = (bagMg * 1000) / bagMl; // 32 mcg/mL
      const totalMcgMin = weightKg * doseMcgKgMin;
      const totalMcgHr = totalMcgMin * 60;
      const rateMlHr = Math.round((totalMcgHr / concMcgMl) * 10) / 10;

      return {
        scenario: `An adult patient in the ICU with septic shock refractory to fluid resuscitation requires a norepinephrine continuous infusion.`,
        orderText: `Norepinephrine IV at ${doseMcgKgMin} mcg/kg/min for MAP ≥ 65 mmHg`,
        availableText: `Norepinephrine ${bagMg} mg in ${bagMl} mL D5W (${concMcgMl} mcg/mL)`,
        patientWeightKg: weightKg,
        prompt: `Calculate the IV pump rate in mL/hr for a patient weighing ${weightKg} kg.`,
        expectedAnswer: rateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to the nearest tenth.",
        tolerance: 0.1,
        hints: [
          `Step 1: Calculate ordered mcg/min: ${weightKg} kg × ${doseMcgKgMin} mcg/kg/min = ${totalMcgMin} mcg/min.`,
          `Step 2: Convert to mcg/hr: ${totalMcgMin} mcg/min × 60 = ${totalMcgHr} mcg/hr.`,
          `Step 3: Determine bag concentration: (${bagMg} mg × 1,000) ÷ ${bagMl} mL = ${concMcgMl} mcg/mL.`,
          `Step 4: Calculate pump rate: ${totalMcgHr} mcg/hr ÷ ${concMcgMl} mcg/mL = ${rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Ordered mcg/min",
            formula: "Weight (kg) × Dose (mcg/kg/min)",
            calculation: `${weightKg} kg × ${doseMcgKgMin} mcg/kg/min = ${totalMcgMin} mcg/min`,
            result: `${totalMcgMin} mcg/min`,
          },
          {
            stepNumber: 2,
            title: "Convert to mcg/hr",
            formula: "mcg/min × 60 minutes",
            calculation: `${totalMcgMin} mcg/min × 60 min = ${totalMcgHr} mcg/hr`,
            result: `${totalMcgHr} mcg/hr`,
          },
          {
            stepNumber: 3,
            title: "Determine Drug Concentration",
            formula: "(Total mg × 1,000) ÷ Total mL",
            calculation: `(8 mg × 1,000) ÷ 250 mL = 32 mcg/mL`,
            result: `32 mcg/mL`,
          },
          {
            stepNumber: 4,
            title: "Calculate Pump Rate in mL/hr",
            formula: "Total mcg/hr ÷ Concentration (mcg/mL)",
            calculation: `${totalMcgHr} mcg/hr ÷ 32 mcg/mL = ${rateMlHr} mL/hr`,
            result: `${rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { weightKg, doseMcgKgMin, bagMg, bagMl, concMcgMl, rateMlHr },
      };
    },
  },
  {
    id: "cc-dopamine-mcg-kg-min",
    category: "critical-care",
    subtype: "vasoactive-drip",
    difficulty: "advanced",
    title: "Dopamine Inotropic Infusion Rate (mcg/kg/min)",
    clinicalContext: "Adult Cardiac Intensive Care Order",
    generate: (rng) => {
      const weightKg = pick([60, 70, 75, 80, 85, 90], rng);
      const doseMcgKgMin = pick([5, 7, 10, 12], rng);
      const bagMg = 400;
      const bagMl = 250;
      const concMcgMl = (bagMg * 1000) / bagMl; // 1600 mcg/mL
      const totalMcgMin = weightKg * doseMcgKgMin;
      const totalMcgHr = totalMcgMin * 60;
      const rateMlHr = Math.round((totalMcgHr / concMcgMl) * 10) / 10;

      return {
        scenario: `An adult ICU patient with cardiogenic shock has an order for inotropic dopamine support.`,
        orderText: `Dopamine ${doseMcgKgMin} mcg/kg/min IV infusion for patient weight ${weightKg} kg`,
        availableText: `Dopamine ${bagMg} mg in ${bagMl} mL D5W (${concMcgMl} mcg/mL)`,
        patientWeightKg: weightKg,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        expectedAnswer: rateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.1,
        hints: [
          `Step 1: Calculate mcg/min: ${weightKg} kg × ${doseMcgKgMin} mcg/kg/min = ${totalMcgMin} mcg/min.`,
          `Step 2: Convert to mcg/hr: ${totalMcgMin} × 60 = ${totalMcgHr} mcg/hr.`,
          `Step 3: Bag concentration: (400 mg × 1,000) ÷ 250 mL = 1,600 mcg/mL.`,
          `Step 4: Divide mcg/hr by 1,600 mcg/mL: ${totalMcgHr} ÷ 1,600 = ${rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Minute Dose (mcg/min)",
            formula: "Weight (kg) × Dose (mcg/kg/min)",
            calculation: `${weightKg} kg × ${doseMcgKgMin} mcg/kg/min = ${totalMcgMin} mcg/min`,
            result: `${totalMcgMin} mcg/min`,
          },
          {
            stepNumber: 2,
            title: "Convert to Hourly Dose (mcg/hr)",
            formula: "mcg/min × 60 min",
            calculation: `${totalMcgMin} mcg/min × 60 = ${totalMcgHr} mcg/hr`,
            result: `${totalMcgHr} mcg/hr`,
          },
          {
            stepNumber: 3,
            title: "Calculate Concentration",
            formula: "(400 mg × 1,000) ÷ 250 mL",
            calculation: `400,000 mcg ÷ 250 mL = 1,600 mcg/mL`,
            result: `1,600 mcg/mL`,
          },
          {
            stepNumber: 4,
            title: "Calculate Pump Rate",
            formula: "mcg/hr ÷ Concentration (mcg/mL)",
            calculation: `${totalMcgHr} mcg/hr ÷ 1,600 mcg/mL = ${rateMlHr} mL/hr`,
            result: `${rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { weightKg, doseMcgKgMin, bagMg, bagMl, concMcgMl, rateMlHr },
      };
    },
  },
  {
    id: "cc-epinephrine-mcg-min",
    category: "critical-care",
    subtype: "vasoactive-drip",
    difficulty: "intermediate",
    title: "Epinephrine Infusion Rate (mcg/min non-weight-based)",
    clinicalContext: "Adult Critical Care Vasopressor Protocol",
    generate: (rng) => {
      const doseMcgMin = pick([2, 4, 6, 8, 10], rng);
      const bagMg = 4;
      const bagMl = 250;
      const concMcgMl = (bagMg * 1000) / bagMl; // 16 mcg/mL
      const totalMcgHr = doseMcgMin * 60;
      const rateMlHr = Math.round((totalMcgHr / concMcgMl) * 10) / 10;

      return {
        scenario: `An adult post-cardiac arrest patient in the ICU is ordered an epinephrine infusion titrated in mcg/min.`,
        orderText: `Epinephrine continuous IV infusion at ${doseMcgMin} mcg/min`,
        availableText: `Epinephrine ${bagMg} mg in ${bagMl} mL 0.9% Normal Saline (${concMcgMl} mcg/mL)`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        expectedAnswer: rateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.1,
        hints: [
          `Step 1: Convert mcg/min to mcg/hr: ${doseMcgMin} mcg/min × 60 = ${totalMcgHr} mcg/hr.`,
          `Step 2: Determine concentration: (4 mg × 1,000) ÷ 250 mL = 16 mcg/mL.`,
          `Step 3: Calculate pump rate: ${totalMcgHr} mcg/hr ÷ 16 mcg/mL = ${rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Minute Dose to Hourly Dose",
            formula: "mcg/min × 60",
            calculation: `${doseMcgMin} mcg/min × 60 min = ${totalMcgHr} mcg/hr`,
            result: `${totalMcgHr} mcg/hr`,
          },
          {
            stepNumber: 2,
            title: "Determine Drug Concentration",
            formula: "(4 mg × 1,000) ÷ 250 mL",
            calculation: `4,000 mcg ÷ 250 mL = 16 mcg/mL`,
            result: `16 mcg/mL`,
          },
          {
            stepNumber: 3,
            title: "Calculate Flow Rate",
            formula: "mcg/hr ÷ Concentration (mcg/mL)",
            calculation: `${totalMcgHr} mcg/hr ÷ 16 mcg/mL = ${rateMlHr} mL/hr`,
            result: `${rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { doseMcgMin, bagMg, bagMl, concMcgMl, rateMlHr },
      };
    },
  },
  {
    id: "cc-phenylephrine-mcg-min",
    category: "critical-care",
    subtype: "vasoactive-drip",
    difficulty: "intermediate",
    title: "Phenylephrine (Neo-Synephrine) Rate (mcg/min)",
    clinicalContext: "Adult ICU / Anesthesia Protocol",
    generate: (rng) => {
      const doseMcgMin = pick([40, 60, 80, 100, 120, 150], rng);
      const bagMg = 20;
      const bagMl = 250;
      const concMcgMl = (bagMg * 1000) / bagMl; // 80 mcg/mL
      const totalMcgHr = doseMcgMin * 60;
      const rateMlHr = Math.round((totalMcgHr / concMcgMl) * 10) / 10;

      return {
        scenario: `An adult intensive care patient with pure vasodilatory hypotension is started on a pure alpha-agonist phenylephrine infusion.`,
        orderText: `Phenylephrine IV infusion at ${doseMcgMin} mcg/min`,
        availableText: `Phenylephrine ${bagMg} mg in ${bagMl} mL 0.9% NS (${concMcgMl} mcg/mL)`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        expectedAnswer: rateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.1,
        hints: [
          `Step 1: Convert mcg/min to mcg/hr: ${doseMcgMin} × 60 = ${totalMcgHr} mcg/hr.`,
          `Step 2: Concentration: (20 mg × 1,000) ÷ 250 mL = 80 mcg/mL.`,
          `Step 3: Pump rate = ${totalMcgHr} ÷ 80 = ${rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Hourly Microgram Dose",
            formula: "mcg/min × 60",
            calculation: `${doseMcgMin} mcg/min × 60 = ${totalMcgHr} mcg/hr`,
            result: `${totalMcgHr} mcg/hr`,
          },
          {
            stepNumber: 2,
            title: "Calculate Concentration",
            formula: "20,000 mcg ÷ 250 mL",
            calculation: `20,000 mcg ÷ 250 mL = 80 mcg/mL`,
            result: `80 mcg/mL`,
          },
          {
            stepNumber: 3,
            title: "Calculate Pump Rate",
            formula: "mcg/hr ÷ 80 mcg/mL",
            calculation: `${totalMcgHr} mcg/hr ÷ 80 mcg/mL = ${rateMlHr} mL/hr`,
            result: `${rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { doseMcgMin, bagMg, bagMl, concMcgMl, rateMlHr },
      };
    },
  },
  {
    id: "cc-vasopressin-units-min",
    category: "critical-care",
    subtype: "vasoactive-drip",
    difficulty: "intermediate",
    title: "Vasopressin Fixed Sepsis Infusion Rate",
    clinicalContext: "Adult Critical Care Vasopressin Protocol",
    generate: (rng) => {
      const data = pick([
        { unitsMin: 0.03, bagUnits: 20, bagMl: 100, concUnitsMl: 0.2, rateMlHr: 9 },
        { unitsMin: 0.04, bagUnits: 20, bagMl: 100, concUnitsMl: 0.2, rateMlHr: 12 },
        { unitsMin: 0.03, bagUnits: 40, bagMl: 100, concUnitsMl: 0.4, rateMlHr: 4.5 },
        { unitsMin: 0.04, bagUnits: 40, bagMl: 100, concUnitsMl: 0.4, rateMlHr: 6 },
      ], rng);

      return {
        scenario: `An adult ICU patient in septic shock is prescribed adjunctive fixed-dose vasopressin.`,
        orderText: `Vasopressin continuous IV infusion at ${data.unitsMin} units/min (do not titrate)`,
        availableText: `Vasopressin ${data.bagUnits} units in ${data.bagMl} mL 0.9% NS (${data.concUnitsMl} units/mL)`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        expectedAnswer: data.rateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.05,
        hints: [
          `Step 1: Calculate units per hour: ${data.unitsMin} units/min × 60 min = ${data.unitsMin * 60} units/hr.`,
          `Step 2: Bag concentration: ${data.bagUnits} units ÷ ${data.bagMl} mL = ${data.concUnitsMl} units/mL.`,
          `Step 3: Calculate rate: (${data.unitsMin * 60}) ÷ ${data.concUnitsMl} = ${data.rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Minute Units to Hourly Units",
            formula: "units/min × 60 min",
            calculation: `${data.unitsMin} units/min × 60 = ${data.unitsMin * 60} units/hr`,
            result: `${data.unitsMin * 60} units/hr`,
          },
          {
            stepNumber: 2,
            title: "Determine Concentration",
            formula: "Units in Bag ÷ Volume in Bag",
            calculation: `${data.bagUnits} units ÷ ${data.bagMl} mL = ${data.concUnitsMl} units/mL`,
            result: `${data.concUnitsMl} units/mL`,
          },
          {
            stepNumber: 3,
            title: "Calculate Flow Rate",
            formula: "Units/hr ÷ Concentration",
            calculation: `${data.unitsMin * 60} units/hr ÷ ${data.concUnitsMl} units/mL = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-nitroglycerin-mcg-min",
    category: "critical-care",
    subtype: "vasoactive-drip",
    difficulty: "intermediate",
    title: "Nitroglycerin Infusion Rate (mcg/min)",
    clinicalContext: "Adult CCU Acute Pulmonary Edema / Angina Protocol",
    generate: (rng) => {
      const doseMcgMin = pick([10, 20, 30, 40, 50, 75, 100], rng);
      const bagMg = 50;
      const bagMl = 250;
      const concMcgMl = (bagMg * 1000) / bagMl; // 200 mcg/mL
      const totalMcgHr = doseMcgMin * 60;
      const rateMlHr = Math.round((totalMcgHr / concMcgMl) * 10) / 10;

      return {
        scenario: `An adult coronary care unit patient with acute myocardial ischemia and hypertension is ordered IV nitroglycerin.`,
        orderText: `Nitroglycerin IV infusion at ${doseMcgMin} mcg/min`,
        availableText: `Nitroglycerin ${bagMg} mg in ${bagMl} mL D5W glass bottle (${concMcgMl} mcg/mL)`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        expectedAnswer: rateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.1,
        hints: [
          `Step 1: Convert mcg/min to mcg/hr: ${doseMcgMin} × 60 = ${totalMcgHr} mcg/hr.`,
          `Step 2: Concentration: 50,000 mcg ÷ 250 mL = 200 mcg/mL.`,
          `Step 3: Calculate rate: ${totalMcgHr} ÷ 200 = ${rateMlHr} mL/hr.`,
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
            formula: "50,000 mcg ÷ 250 mL",
            calculation: `50,000 mcg ÷ 250 mL = 200 mcg/mL`,
            result: `200 mcg/mL`,
          },
          {
            stepNumber: 3,
            title: "Calculate Flow Rate",
            formula: "mcg/hr ÷ 200 mcg/mL",
            calculation: `${totalMcgHr} mcg/hr ÷ 200 mcg/mL = ${rateMlHr} mL/hr`,
            result: `${rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { doseMcgMin, bagMg, bagMl, concMcgMl, rateMlHr },
      };
    },
  },
  {
    id: "cc-nicardipine-mg-hr",
    category: "critical-care",
    subtype: "vasoactive-drip",
    difficulty: "beginner",
    title: "Nicardipine (Cardene) Infusion Rate (mg/hr)",
    clinicalContext: "Adult Neuro ICU Acute Stroke Protocol",
    generate: (rng) => {
      const doseMgHr = pick([5, 7.5, 10, 12.5, 15], rng);
      const bagMg = 25;
      const bagMl = 250;
      const concMgMl = bagMg / bagMl; // 0.1 mg/mL
      const rateMlHr = Math.round((doseMgHr / concMgMl) * 10) / 10;

      return {
        scenario: `An adult Neuro-ICU patient with an acute intracerebral hemorrhage requires strict blood pressure control (SBP < 140 mmHg) with IV nicardipine.`,
        orderText: `Nicardipine continuous IV infusion at ${doseMgHr} mg/hr`,
        availableText: `Nicardipine ${bagMg} mg in ${bagMl} mL 0.9% Normal Saline (${concMgMl} mg/mL)`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        expectedAnswer: rateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.1,
        hints: [
          `Step 1: Determine concentration: 25 mg ÷ 250 mL = 0.1 mg/mL.`,
          `Step 2: Apply formula: Desired (mg/hr) ÷ Have (mg/mL) = mL/hr.`,
          `Calculate: ${doseMgHr} ÷ 0.1 (or ${doseMgHr} × 10) = ${rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Determine Bag Concentration",
            formula: "Total mg ÷ Total mL",
            calculation: `25 mg ÷ 250 mL = 0.1 mg/mL`,
            result: `0.1 mg/mL`,
          },
          {
            stepNumber: 2,
            title: "Calculate Flow Rate",
            formula: "Ordered mg/hr ÷ Concentration (mg/mL)",
            calculation: `${doseMgHr} mg/hr ÷ 0.1 mg/mL = ${rateMlHr} mL/hr`,
            result: `${rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { doseMgHr, bagMg, bagMl, concMgMl, rateMlHr },
      };
    },
  },
  {
    id: "cc-amiodarone-mg-min",
    category: "critical-care",
    subtype: "antiarrhythmic-drip",
    difficulty: "intermediate",
    title: "Amiodarone Continuous Infusion Rate (mg/min to mL/hr)",
    clinicalContext: "Adult Telemetry / Step-Down Ventricular Arrhythmia Order",
    generate: (rng) => {
      const data = pick([
        { doseMgMin: 1, bagMg: 450, bagMl: 250, concMgMl: 1.8, rateMlHr: 33.3 },
        { doseMgMin: 0.5, bagMg: 450, bagMl: 250, concMgMl: 1.8, rateMlHr: 16.7 },
        { doseMgMin: 1, bagMg: 900, bagMl: 500, concMgMl: 1.8, rateMlHr: 33.3 },
        { doseMgMin: 0.5, bagMg: 900, bagMl: 500, concMgMl: 1.8, rateMlHr: 16.7 },
      ], rng);

      return {
        scenario: `Following an initial IV loading dose for recurrent ventricular tachycardia, an adult telemetry patient is prescribed a maintenance amiodarone infusion at ${data.doseMgMin} mg/min.`,
        orderText: `Amiodarone IV infusion at ${data.doseMgMin} mg/min for 6 hours`,
        availableText: `Amiodarone ${data.bagMg} mg in ${data.bagMl} mL D5W (${data.concMgMl} mg/mL)`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        expectedAnswer: data.rateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.2,
        hints: [
          `Step 1: Convert mg/min to mg/hr: ${data.doseMgMin} mg/min × 60 min = ${data.doseMgMin * 60} mg/hr.`,
          `Step 2: Bag concentration: ${data.bagMg} mg ÷ ${data.bagMl} mL = ${data.concMgMl} mg/mL.`,
          `Step 3: Calculate rate: (${data.doseMgMin * 60}) ÷ ${data.concMgMl} = ${data.rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Minute Dose to Hourly Dose",
            formula: "mg/min × 60",
            calculation: `${data.doseMgMin} mg/min × 60 = ${data.doseMgMin * 60} mg/hr`,
            result: `${data.doseMgMin * 60} mg/hr`,
          },
          {
            stepNumber: 2,
            title: "Determine Drug Concentration",
            formula: "Total mg ÷ Total mL",
            calculation: `${data.bagMg} mg ÷ ${data.bagMl} mL = ${data.concMgMl} mg/mL`,
            result: `${data.concMgMl} mg/mL`,
          },
          {
            stepNumber: 3,
            title: "Calculate Pump Rate",
            formula: "mg/hr ÷ Concentration",
            calculation: `${data.doseMgMin * 60} mg/hr ÷ ${data.concMgMl} mg/mL = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-propofol-mcg-kg-min",
    category: "critical-care",
    subtype: "sedation-drip",
    difficulty: "advanced",
    title: "Propofol Sedation Rate (mcg/kg/min)",
    clinicalContext: "Adult ICU Mechanical Ventilation Sedation Protocol",
    generate: (rng) => {
      const weightKg = pick([60, 70, 75, 80, 85, 90, 100], rng);
      const doseMcgKgMin = pick([20, 25, 30, 35, 40, 50], rng);
      // Propofol standard 10 mg/mL = 10,000 mcg/mL
      const concMcgMl = 10000;
      const totalMcgMin = weightKg * doseMcgKgMin;
      const totalMcgHr = totalMcgMin * 60;
      const rateMlHr = Math.round((totalMcgHr / concMcgMl) * 10) / 10;

      return {
        scenario: `An adult intubated patient weighing ${weightKg} kg requires continuous sedation with propofol to maintain a target RASS score of -2.`,
        orderText: `Propofol (Diprivan) continuous IV infusion at ${doseMcgKgMin} mcg/kg/min`,
        availableText: `Propofol 1,000 mg in 100 mL emulsion vial (10 mg/mL = 10,000 mcg/mL)`,
        patientWeightKg: weightKg,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        expectedAnswer: rateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.1,
        hints: [
          `Step 1: Calculate mcg/min: ${weightKg} kg × ${doseMcgKgMin} mcg/kg/min = ${totalMcgMin} mcg/min.`,
          `Step 2: Convert to mcg/hr: ${totalMcgMin} × 60 = ${totalMcgHr} mcg/hr.`,
          `Step 3: Note concentration: 10 mg/mL = 10,000 mcg/mL.`,
          `Step 4: Divide mcg/hr by 10,000: ${totalMcgHr} ÷ 10,000 = ${rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Minute Dose",
            formula: "Weight (kg) × Dose (mcg/kg/min)",
            calculation: `${weightKg} kg × ${doseMcgKgMin} mcg/kg/min = ${totalMcgMin} mcg/min`,
            result: `${totalMcgMin} mcg/min`,
          },
          {
            stepNumber: 2,
            title: "Convert to Hourly Dose",
            formula: "mcg/min × 60",
            calculation: `${totalMcgMin} mcg/min × 60 = ${totalMcgHr} mcg/hr`,
            result: `${totalMcgHr} mcg/hr`,
          },
          {
            stepNumber: 3,
            title: "Calculate Infusion Rate",
            formula: "mcg/hr ÷ 10,000 mcg/mL",
            calculation: `${totalMcgHr} mcg/hr ÷ 10,000 mcg/mL = ${rateMlHr} mL/hr`,
            result: `${rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { weightKg, doseMcgKgMin, concMcgMl, rateMlHr },
      };
    },
  },
  {
    id: "cc-dexmedetomidine-mcg-kg-hr",
    category: "critical-care",
    subtype: "sedation-drip",
    difficulty: "advanced",
    title: "Dexmedetomidine (Precedex) Infusion Rate (mcg/kg/hr)",
    clinicalContext: "Adult Step-Down / ICU Light Sedation Order",
    generate: (rng) => {
      const weightKg = pick([60, 70, 75, 80, 85, 90, 100], rng);
      const doseMcgKgHr = pick([0.4, 0.6, 0.8, 1.0, 1.2], rng);
      const bagMcg = 400;
      const bagMl = 100;
      const concMcgMl = bagMcg / bagMl; // 4 mcg/mL
      const totalMcgHr = weightKg * doseMcgKgHr;
      const rateMlHr = Math.round((totalMcgHr / concMcgMl) * 10) / 10;

      return {
        scenario: `An adult ICU patient being weaned from mechanical ventilation is ordered dexmedetomidine. Note: Dexmedetomidine is ordered in mcg/kg/HOUR (not per minute).`,
        orderText: `Dexmedetomidine IV at ${doseMcgKgHr} mcg/kg/hr for patient weight ${weightKg} kg`,
        availableText: `Precedex ${bagMcg} mcg in ${bagMl} mL 0.9% NS (${concMcgMl} mcg/mL)`,
        patientWeightKg: weightKg,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        expectedAnswer: rateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.1,
        hints: [
          `Note: Order is in mcg/kg/hr, so DO NOT multiply by 60!`,
          `Step 1: Calculate total mcg/hr: ${weightKg} kg × ${doseMcgKgHr} mcg/kg/hr = ${totalMcgHr} mcg/hr.`,
          `Step 2: Concentration: 400 mcg ÷ 100 mL = 4 mcg/mL.`,
          `Step 3: Calculate rate: ${totalMcgHr} mcg/hr ÷ 4 mcg/mL = ${rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Hourly Micrograms",
            formula: "Weight (kg) × Dose (mcg/kg/hr)",
            explanation: "Because dose is already per hour, no 60-minute multiplication is necessary.",
            calculation: `${weightKg} kg × ${doseMcgKgHr} mcg/kg/hr = ${totalMcgHr} mcg/hr`,
            result: `${totalMcgHr} mcg/hr`,
          },
          {
            stepNumber: 2,
            title: "Determine Drug Concentration",
            formula: "400 mcg ÷ 100 mL",
            calculation: `400 mcg ÷ 100 mL = 4 mcg/mL`,
            result: `4 mcg/mL`,
          },
          {
            stepNumber: 3,
            title: "Calculate Flow Rate",
            formula: "mcg/hr ÷ 4 mcg/mL",
            calculation: `${totalMcgHr} mcg/hr ÷ 4 mcg/mL = ${rateMlHr} mL/hr`,
            result: `${rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { weightKg, doseMcgKgHr, bagMcg, bagMl, concMcgMl, rateMlHr },
      };
    },
  },
  {
    id: "cc-dobutamine-mcg-kg-min",
    category: "critical-care",
    subtype: "vasoactive-drip",
    difficulty: "advanced",
    title: "Dobutamine Inotropic Infusion Rate (mcg/kg/min)",
    clinicalContext: "Adult CCU Decompensated Heart Failure Protocol",
    generate: (rng) => {
      const weightKg = pick([60, 70, 75, 80, 85, 90, 100], rng);
      const doseMcgKgMin = pick([2.5, 5, 7.5, 10], rng);
      const bagMg = 500;
      const bagMl = 250;
      const concMcgMl = (bagMg * 1000) / bagMl; // 2000 mcg/mL
      const totalMcgMin = weightKg * doseMcgKgMin;
      const totalMcgHr = totalMcgMin * 60;
      const rateMlHr = Math.round((totalMcgHr / concMcgMl) * 10) / 10;

      return {
        scenario: `An adult coronary care unit patient with acute decompensated heart failure and low cardiac output is prescribed IV dobutamine.`,
        orderText: `Dobutamine continuous IV infusion at ${doseMcgKgMin} mcg/kg/min for patient weight ${weightKg} kg`,
        availableText: `Dobutamine ${bagMg} mg in ${bagMl} mL D5W (${concMcgMl} mcg/mL)`,
        patientWeightKg: weightKg,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        expectedAnswer: rateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.1,
        hints: [
          `Step 1: Calculate mcg/min: ${weightKg} kg × ${doseMcgKgMin} mcg/kg/min = ${totalMcgMin} mcg/min.`,
          `Step 2: Convert to mcg/hr: ${totalMcgMin} × 60 = ${totalMcgHr} mcg/hr.`,
          `Step 3: Bag concentration: (500 mg × 1,000) ÷ 250 mL = 2,000 mcg/mL.`,
          `Step 4: Calculate rate: ${totalMcgHr} ÷ 2,000 = ${rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Minute Dose",
            formula: "Weight (kg) × Dose (mcg/kg/min)",
            calculation: `${weightKg} kg × ${doseMcgKgMin} mcg/kg/min = ${totalMcgMin} mcg/min`,
            result: `${totalMcgMin} mcg/min`,
          },
          {
            stepNumber: 2,
            title: "Convert to Hourly Micrograms",
            formula: "mcg/min × 60",
            calculation: `${totalMcgMin} mcg/min × 60 = ${totalMcgHr} mcg/hr`,
            result: `${totalMcgHr} mcg/hr`,
          },
          {
            stepNumber: 3,
            title: "Calculate Concentration",
            formula: "(500 mg × 1,000) ÷ 250 mL",
            calculation: `500,000 mcg ÷ 250 mL = 2,000 mcg/mL`,
            result: `2,000 mcg/mL`,
          },
          {
            stepNumber: 4,
            title: "Calculate Pump Rate",
            formula: "mcg/hr ÷ 2,000 mcg/mL",
            calculation: `${totalMcgHr} mcg/hr ÷ 2,000 mcg/mL = ${rateMlHr} mL/hr`,
            result: `${rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { weightKg, doseMcgKgMin, bagMg, bagMl, concMcgMl, rateMlHr },
      };
    },
  },
  {
    id: "cc-cisatracurium-mcg-kg-min",
    category: "critical-care",
    subtype: "paralytic-drip",
    difficulty: "advanced",
    title: "Cisatracurium (Nimbex) Paralytic Infusion (mcg/kg/min)",
    clinicalContext: "Adult ARDS Neuromuscular Blockade Protocol",
    generate: (rng) => {
      const weightKg = pick([60, 70, 75, 80, 85, 90, 100], rng);
      const doseMcgKgMin = pick([1, 1.5, 2, 2.5, 3], rng);
      const bagMg = 200;
      const bagMl = 500;
      const concMcgMl = (bagMg * 1000) / bagMl; // 400 mcg/mL
      const totalMcgMin = weightKg * doseMcgKgMin;
      const totalMcgHr = totalMcgMin * 60;
      const rateMlHr = Math.round((totalMcgHr / concMcgMl) * 10) / 10;

      return {
        scenario: `An adult patient with severe ARDS requiring prone positioning and ventilator synchrony is prescribed a continuous cisatracurium paralytic drip.`,
        orderText: `Cisatracurium IV at ${doseMcgKgMin} mcg/kg/min for patient weight ${weightKg} kg`,
        availableText: `Cisatracurium ${bagMg} mg in ${bagMl} mL 0.9% NS (${concMcgMl} mcg/mL)`,
        patientWeightKg: weightKg,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        expectedAnswer: rateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.1,
        hints: [
          `Step 1: Calculate mcg/min: ${weightKg} kg × ${doseMcgKgMin} mcg/kg/min = ${totalMcgMin} mcg/min.`,
          `Step 2: Convert to mcg/hr: ${totalMcgMin} × 60 = ${totalMcgHr} mcg/hr.`,
          `Step 3: Concentration: 200,000 mcg ÷ 500 mL = 400 mcg/mL.`,
          `Step 4: Calculate rate: ${totalMcgHr} ÷ 400 = ${rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Minute Micrograms",
            formula: "Weight (kg) × Dose (mcg/kg/min)",
            calculation: `${weightKg} kg × ${doseMcgKgMin} mcg/kg/min = ${totalMcgMin} mcg/min`,
            result: `${totalMcgMin} mcg/min`,
          },
          {
            stepNumber: 2,
            title: "Convert to Hourly Dose",
            formula: "mcg/min × 60",
            calculation: `${totalMcgMin} mcg/min × 60 = ${totalMcgHr} mcg/hr`,
            result: `${totalMcgHr} mcg/hr`,
          },
          {
            stepNumber: 3,
            title: "Calculate Concentration",
            formula: "200,000 mcg ÷ 500 mL",
            calculation: `200,000 mcg ÷ 500 mL = 400 mcg/mL`,
            result: `400 mcg/mL`,
          },
          {
            stepNumber: 4,
            title: "Calculate Pump Rate",
            formula: "mcg/hr ÷ 400 mcg/mL",
            calculation: `${totalMcgHr} mcg/hr ÷ 400 mcg/mL = ${rateMlHr} mL/hr`,
            result: `${rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { weightKg, doseMcgKgMin, bagMg, bagMl, concMcgMl, rateMlHr },
      };
    },
  },
  {
    id: "cc-diltiazem-mg-hr",
    category: "critical-care",
    subtype: "antiarrhythmic-drip",
    difficulty: "beginner",
    title: "Diltiazem (Cardizem) Continuous Drip (mg/hr)",
    clinicalContext: "Adult Telemetry Atrial Fibrillation with RVR",
    generate: (rng) => {
      const doseMgHr = pick([5, 7.5, 10, 12.5, 15], rng);
      const bagMg = 125;
      const bagMl = 100;
      const concMgMl = bagMg / bagMl; // 1.25 mg/mL
      const rateMlHr = Math.round((doseMgHr / concMgMl) * 10) / 10;

      return {
        scenario: `An adult telemetry patient with atrial fibrillation with rapid ventricular response (RVR) receives an IV diltiazem maintenance drip following an initial bolus.`,
        orderText: `Diltiazem continuous IV infusion at ${doseMgHr} mg/hr for heart rate control`,
        availableText: `Diltiazem ${bagMg} mg in ${bagMl} mL D5W (${concMgMl} mg/mL)`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        expectedAnswer: rateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.1,
        hints: [
          `Step 1: Determine concentration: 125 mg ÷ 100 mL = 1.25 mg/mL.`,
          `Step 2: Apply formula: Desired mg/hr ÷ Have mg/mL.`,
          `Calculate: ${doseMgHr} ÷ 1.25 = ${rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Determine Drug Concentration",
            formula: "125 mg ÷ 100 mL",
            calculation: `125 mg ÷ 100 mL = 1.25 mg/mL`,
            result: `1.25 mg/mL`,
          },
          {
            stepNumber: 2,
            title: "Calculate Flow Rate",
            formula: "Ordered mg/hr ÷ Concentration (mg/mL)",
            calculation: `${doseMgHr} mg/hr ÷ 1.25 mg/mL = ${rateMlHr} mL/hr`,
            result: `${rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { doseMgHr, bagMg, bagMl, concMgMl, rateMlHr },
      };
    },
  },
  {
    id: "cc-esmolol-mcg-kg-min",
    category: "critical-care",
    subtype: "antiarrhythmic-drip",
    difficulty: "advanced",
    title: "Esmolol Ultra-Short Beta Blocker Rate (mcg/kg/min)",
    clinicalContext: "Adult CCU Acute Aortic Dissection Protocol",
    generate: (rng) => {
      const weightKg = pick([60, 70, 75, 80, 85, 90, 100], rng);
      const doseMcgKgMin = pick([50, 100, 150, 200], rng);
      const bagGrams = 2.5;
      const bagMl = 250;
      const concMcgMl = (bagGrams * 1000 * 1000) / bagMl; // 10,000 mcg/mL
      const totalMcgMin = weightKg * doseMcgKgMin;
      const totalMcgHr = totalMcgMin * 60;
      const rateMlHr = Math.round((totalMcgHr / concMcgMl) * 10) / 10;

      return {
        scenario: `An adult emergency department patient with suspected acute aortic dissection is started on an ultra-short-acting esmolol infusion to lower heart rate and shear stress.`,
        orderText: `Esmolol IV infusion at ${doseMcgKgMin} mcg/kg/min for patient weight ${weightKg} kg`,
        availableText: `Esmolol ${bagGrams} g in ${bagMl} mL 0.9% NS (10 mg/mL = 10,000 mcg/mL)`,
        patientWeightKg: weightKg,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        expectedAnswer: rateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.1,
        hints: [
          `Step 1: Calculate mcg/min: ${weightKg} kg × ${doseMcgKgMin} mcg/kg/min = ${totalMcgMin} mcg/min.`,
          `Step 2: Convert to mcg/hr: ${totalMcgMin} × 60 = ${totalMcgHr} mcg/hr.`,
          `Step 3: Concentration: 2.5 g = 2,500 mg = 2,500,000 mcg ÷ 250 mL = 10,000 mcg/mL.`,
          `Step 4: Calculate rate: ${totalMcgHr} ÷ 10,000 = ${rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Minute Dose",
            formula: "Weight (kg) × Dose (mcg/kg/min)",
            calculation: `${weightKg} kg × ${doseMcgKgMin} mcg/kg/min = ${totalMcgMin} mcg/min`,
            result: `${totalMcgMin} mcg/min`,
          },
          {
            stepNumber: 2,
            title: "Convert to Hourly Dose",
            formula: "mcg/min × 60",
            calculation: `${totalMcgMin} mcg/min × 60 = ${totalMcgHr} mcg/hr`,
            result: `${totalMcgHr} mcg/hr`,
          },
          {
            stepNumber: 3,
            title: "Determine Drug Concentration",
            formula: "2,500,000 mcg ÷ 250 mL",
            calculation: `2,500,000 mcg ÷ 250 mL = 10,000 mcg/mL`,
            result: `10,000 mcg/mL`,
          },
          {
            stepNumber: 4,
            title: "Calculate Pump Rate",
            formula: "mcg/hr ÷ 10,000 mcg/mL",
            calculation: `${totalMcgHr} mcg/hr ÷ 10,000 mcg/mL = ${rateMlHr} mL/hr`,
            result: `${rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { weightKg, doseMcgKgMin, bagGrams, bagMl, concMcgMl, rateMlHr },
      };
    },
  },
  {
    id: "cc-milrinone-mcg-kg-min",
    category: "critical-care",
    subtype: "vasoactive-drip",
    difficulty: "advanced",
    title: "Milrinone (Primacor) Inodilator Infusion Rate",
    clinicalContext: "Adult CCU Post-Cardiac Surgery Order",
    generate: (rng) => {
      const weightKg = pick([60, 70, 75, 80, 85, 90, 100], rng);
      const doseMcgKgMin = pick([0.25, 0.375, 0.5, 0.75], rng);
      const bagMg = 20;
      const bagMl = 100;
      const concMcgMl = (bagMg * 1000) / bagMl; // 200 mcg/mL
      const totalMcgMin = weightKg * doseMcgKgMin;
      const totalMcgHr = totalMcgMin * 60;
      const rateMlHr = Math.round((totalMcgHr / concMcgMl) * 10) / 10;

      return {
        scenario: `An adult patient in the cardiothoracic ICU is ordered milrinone for inotropic support and pulmonary vascular resistance reduction.`,
        orderText: `Milrinone continuous IV infusion at ${doseMcgKgMin} mcg/kg/min for patient weight ${weightKg} kg`,
        availableText: `Milrinone ${bagMg} mg in ${bagMl} mL D5W (${concMcgMl} mcg/mL)`,
        patientWeightKg: weightKg,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        expectedAnswer: rateMlHr,
        expectedUnit: "mL/hr",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.1,
        hints: [
          `Step 1: Calculate mcg/min: ${weightKg} kg × ${doseMcgKgMin} mcg/kg/min = ${totalMcgMin} mcg/min.`,
          `Step 2: Convert to mcg/hr: ${totalMcgMin} × 60 = ${totalMcgHr} mcg/hr.`,
          `Step 3: Concentration: 20,000 mcg ÷ 100 mL = 200 mcg/mL.`,
          `Step 4: Calculate rate: ${totalMcgHr} ÷ 200 = ${rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Minute Dose",
            formula: "Weight (kg) × Dose (mcg/kg/min)",
            calculation: `${weightKg} kg × ${doseMcgKgMin} mcg/kg/min = ${totalMcgMin} mcg/min`,
            result: `${totalMcgMin} mcg/min`,
          },
          {
            stepNumber: 2,
            title: "Convert to Hourly Dose",
            formula: "mcg/min × 60",
            calculation: `${totalMcgMin} mcg/min × 60 = ${totalMcgHr} mcg/hr`,
            result: `${totalMcgHr} mcg/hr`,
          },
          {
            stepNumber: 3,
            title: "Calculate Concentration",
            formula: "20,000 mcg ÷ 100 mL",
            calculation: `20,000 mcg ÷ 100 mL = 200 mcg/mL`,
            result: `200 mcg/mL`,
          },
          {
            stepNumber: 4,
            title: "Calculate Pump Rate",
            formula: "mcg/hr ÷ 200 mcg/mL",
            calculation: `${totalMcgHr} mcg/hr ÷ 200 mcg/mL = ${rateMlHr} mL/hr`,
            result: `${rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { weightKg, doseMcgKgMin, bagMg, bagMl, concMcgMl, rateMlHr },
      };
    },
  },
];
