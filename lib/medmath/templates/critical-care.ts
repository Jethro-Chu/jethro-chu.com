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
        correctAnswer: rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to the nearest tenth.",
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
        correctAnswer: rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
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
        correctAnswer: rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
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
        correctAnswer: rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
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
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
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
        correctAnswer: rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
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
        correctAnswer: rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
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
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
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
        correctAnswer: rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
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
        correctAnswer: rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
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
        correctAnswer: rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
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
        correctAnswer: rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
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
        correctAnswer: rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
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
        correctAnswer: rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
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
        correctAnswer: rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
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
  {
    id: "cc-reverse-norepi-mlhr-to-mcgkgmin",
    category: "critical-care",
    subtype: "vasoactive-drip",
    difficulty: "critical-care",
    title: "Reverse Norepinephrine: Calculate Delivered mcg/kg/min from Pump Rate",
    clinicalContext: "Adult ICU Septic Shock Drip Verification",
    generate: (rng) => {
      const data = pick([
        { rateMlHr: 15, bagMg: 8, bagMl: 250, concMcgMl: 32, weightKg: 75, mcgMin: 8.0, doseMcgKgMin: 0.11 },
        { rateMlHr: 20, bagMg: 8, bagMl: 250, concMcgMl: 32, weightKg: 80, mcgMin: 10.67, doseMcgKgMin: 0.13 },
        { rateMlHr: 12, bagMg: 8, bagMl: 250, concMcgMl: 32, weightKg: 80, mcgMin: 6.4, doseMcgKgMin: 0.08 },
        { rateMlHr: 10, bagMg: 4, bagMl: 250, concMcgMl: 16, weightKg: 70, mcgMin: 2.67, doseMcgKgMin: 0.04 },
      ], rng);

      return {
        scenario: `An adult ICU patient weighing ${data.weightKg} kg is receiving IV norepinephrine (8 mg in 250 mL D5W, 32 mcg/mL) with the infusion pump running at ${data.rateMlHr} mL/hr.`,
        orderText: `Norepinephrine drip running at ${data.rateMlHr} mL/hr (Patient weight: ${data.weightKg} kg)`,
        availableText: `Norepinephrine 8 mg / 250 mL (${data.concMcgMl} mcg/mL)`,
        patientWeightKg: data.weightKg,
        prompt: `Calculate the current dose delivered to the patient in mcg/kg/min.`,
        correctAnswer: data.doseMcgKgMin,
        answerUnit: "mcg/kg/min",
        answerPrecision: 2,
        roundingInstruction: "Round to nearest hundredth (e.g. 0.11).",
        hints: [
          `Step 1: Calculate hourly mcg delivered: ${data.rateMlHr} mL/hr × ${data.concMcgMl} mcg/mL = ${data.rateMlHr * data.concMcgMl} mcg/hr.`,
          `Step 2: Convert to mcg/min: (${data.rateMlHr * data.concMcgMl}) ÷ 60 min.`,
          `Step 3: Divide minute mcg by patient weight (${data.weightKg} kg): mcg/min ÷ ${data.weightKg}.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Total Hourly Micrograms",
            formula: "Rate (mL/hr) × Concentration (mcg/mL)",
            calculation: `${data.rateMlHr} mL/hr × ${data.concMcgMl} mcg/mL = ${data.rateMlHr * data.concMcgMl} mcg/hr`,
            result: `${data.rateMlHr * data.concMcgMl} mcg/hr`,
          },
          {
            stepNumber: 2,
            title: "Convert to Micrograms per Minute",
            formula: "mcg/hr ÷ 60",
            calculation: `${data.rateMlHr * data.concMcgMl} mcg/hr ÷ 60 = ${(data.rateMlHr * data.concMcgMl / 60).toFixed(2)} mcg/min`,
            result: `${(data.rateMlHr * data.concMcgMl / 60).toFixed(2)} mcg/min`,
          },
          {
            stepNumber: 3,
            title: "Normalize by Weight",
            formula: "mcg/min ÷ Weight (kg)",
            calculation: `${(data.rateMlHr * data.concMcgMl / 60).toFixed(2)} mcg/min ÷ ${data.weightKg} kg = ${data.doseMcgKgMin} mcg/kg/min`,
            result: `${data.doseMcgKgMin} mcg/kg/min`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-reverse-dopamine-mlhr-to-mcgkgmin",
    category: "critical-care",
    subtype: "vasoactive-drip",
    difficulty: "critical-care",
    title: "Reverse Dopamine: Calculate mcg/kg/min from Flow Rate",
    clinicalContext: "Adult Inpatient Cardiogenic Shock Audit",
    generate: (rng) => {
      const data = pick([
        { rateMlHr: 15, bagMg: 400, bagMl: 250, concMcgMl: 1600, weightKg: 80, doseMcgKgMin: 5.0 },
        { rateMlHr: 22.5, bagMg: 400, bagMl: 250, concMcgMl: 1600, weightKg: 80, doseMcgKgMin: 7.5 },
        { rateMlHr: 30, bagMg: 400, bagMl: 250, concMcgMl: 1600, weightKg: 80, doseMcgKgMin: 10.0 },
        { rateMlHr: 13.1, bagMg: 400, bagMl: 250, concMcgMl: 1600, weightKg: 70, doseMcgKgMin: 5.0 },
      ], rng);

      return {
        scenario: `A dopamine continuous infusion (400 mg in 250 mL D5W, 1,600 mcg/mL) is infusing at ${data.rateMlHr} mL/hr in an adult patient weighing ${data.weightKg} kg.`,
        orderText: `Dopamine infusion running at ${data.rateMlHr} mL/hr`,
        availableText: `Dopamine 400 mg / 250 mL (${data.concMcgMl} mcg/mL)`,
        patientWeightKg: data.weightKg,
        prompt: `Calculate the dosage rate in mcg/kg/min.`,
        correctAnswer: data.doseMcgKgMin,
        answerUnit: "mcg/kg/min",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          `Step 1: Calculate hourly mcg: ${data.rateMlHr} mL/hr × ${data.concMcgMl} mcg/mL.`,
          `Step 2: Convert to minute mcg by dividing by 60.`,
          `Step 3: Divide by patient weight (${data.weightKg} kg).`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Minute Micrograms Delivered",
            formula: "(Rate × Concentration) ÷ 60",
            calculation: `(${data.rateMlHr} mL/hr × ${data.concMcgMl} mcg/mL) ÷ 60 = ${(data.rateMlHr * data.concMcgMl / 60).toFixed(1)} mcg/min`,
            result: `${(data.rateMlHr * data.concMcgMl / 60).toFixed(1)} mcg/min`,
          },
          {
            stepNumber: 2,
            title: "Calculate mcg/kg/min",
            formula: "mcg/min ÷ Weight (kg)",
            calculation: `${(data.rateMlHr * data.concMcgMl / 60).toFixed(1)} mcg/min ÷ ${data.weightKg} kg = ${data.doseMcgKgMin} mcg/kg/min`,
            result: `${data.doseMcgKgMin} mcg/kg/min`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-reverse-nitro-mlhr-to-mcgmin",
    category: "critical-care",
    subtype: "vasoactive-drip",
    difficulty: "intermediate",
    title: "Reverse Nitroglycerin: Calculate mcg/min from Pump Rate",
    clinicalContext: "Adult CCU Unstable Angina Protocol",
    generate: (rng) => {
      const data = pick([
        { rateMlHr: 15, bagMg: 50, bagMl: 250, concMcgMl: 200, mcgMin: 50 },
        { rateMlHr: 9, bagMg: 50, bagMl: 250, concMcgMl: 200, mcgMin: 30 },
        { rateMlHr: 6, bagMg: 50, bagMl: 250, concMcgMl: 200, mcgMin: 20 },
        { rateMlHr: 22.5, bagMg: 50, bagMl: 250, concMcgMl: 200, mcgMin: 75 },
        { rateMlHr: 30, bagMg: 50, bagMl: 250, concMcgMl: 200, mcgMin: 100 },
      ], rng);

      return {
        scenario: `An adult coronary care patient is receiving an IV nitroglycerin drip (50 mg in 250 mL D5W, 200 mcg/mL). The electronic pump is running at ${data.rateMlHr} mL/hr.`,
        orderText: `Nitroglycerin continuous infusion running at ${data.rateMlHr} mL/hr`,
        availableText: `Nitroglycerin 50 mg in 250 mL (${data.concMcgMl} mcg/mL)`,
        prompt: `Calculate the dosage delivery rate in mcg/min.`,
        correctAnswer: data.mcgMin,
        answerUnit: "mcg/min",
        answerPrecision: 0,
        roundingInstruction: "State whole number.",
        hints: [
          `Step 1: Calculate hourly micrograms: ${data.rateMlHr} mL/hr × ${data.concMcgMl} mcg/mL = ${data.rateMlHr * data.concMcgMl} mcg/hr.`,
          `Step 2: Convert to minute rate: (${data.rateMlHr * data.concMcgMl}) ÷ 60 min.`,
          `Calculate: (${data.rateMlHr} × ${data.concMcgMl}) ÷ 60 = ${data.mcgMin} mcg/min.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Hourly Micrograms",
            formula: "Rate (mL/hr) × Concentration (mcg/mL)",
            calculation: `${data.rateMlHr} mL/hr × ${data.concMcgMl} mcg/mL = ${data.rateMlHr * data.concMcgMl} mcg/hr`,
            result: `${data.rateMlHr * data.concMcgMl} mcg/hr`,
          },
          {
            stepNumber: 2,
            title: "Convert to Micrograms per Minute",
            formula: "mcg/hr ÷ 60 min",
            calculation: `${data.rateMlHr * data.concMcgMl} mcg/hr ÷ 60 = ${data.mcgMin} mcg/min`,
            result: `${data.mcgMin} mcg/min`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-reverse-nicardipine-mlhr-to-mghr",
    category: "critical-care",
    subtype: "vasoactive-drip",
    difficulty: "beginner",
    title: "Reverse Nicardipine: Calculate Delivered mg/hr from Pump Rate",
    clinicalContext: "Adult Neuro-ICU Hypertensive Emergency",
    generate: (rng) => {
      const data = pick([
        { rateMlHr: 75, concMgMl: 0.1, mgHr: 7.5 },
        { rateMlHr: 50, concMgMl: 0.1, mgHr: 5.0 },
        { rateMlHr: 100, concMgMl: 0.1, mgHr: 10.0 },
        { rateMlHr: 125, concMgMl: 0.1, mgHr: 12.5 },
        { rateMlHr: 150, concMgMl: 0.1, mgHr: 15.0 },
      ], rng);

      return {
        scenario: `An adult stroke patient with acute hemorrhagic transformation is receiving IV nicardipine (25 mg in 250 mL NS, 0.1 mg/mL) running at ${data.rateMlHr} mL/hr.`,
        orderText: `Nicardipine infusion running at ${data.rateMlHr} mL/hr for SBP 140–160 mmHg`,
        availableText: `Nicardipine 25 mg in 250 mL NS (${data.concMgMl} mg/mL)`,
        prompt: `Calculate the current dose delivered to the patient in mg/hr.`,
        correctAnswer: data.mgHr,
        answerUnit: "mg/hr",
        answerPrecision: 1,
        roundingInstruction: "State exact number or round to nearest tenth.",
        hints: [
          "Multiply the infusion pump rate (mL/hr) by the bag concentration (mg/mL).",
          `Calculate: ${data.rateMlHr} mL/hr × ${data.concMgMl} mg/mL.`,
          `${data.rateMlHr} × 0.1 = ${data.mgHr} mg/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Hourly Milligrams Delivered",
            formula: "Pump Rate (mL/hr) × Bag Concentration (mg/mL)",
            calculation: `${data.rateMlHr} mL/hr × ${data.concMgMl} mg/mL = ${data.mgHr} mg/hr`,
            result: `${data.mgHr} mg/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-reverse-propofol-mlhr-to-mcgkgmin",
    category: "critical-care",
    subtype: "sedation-drip",
    difficulty: "critical-care",
    title: "Reverse Propofol: Calculate mcg/kg/min from Infusion Rate",
    clinicalContext: "Adult ICU Mechanical Ventilation Sedation Audit",
    generate: (rng) => {
      const data = pick([
        { rateMlHr: 12, concMgMl: 10, concMcgMl: 10000, weightKg: 80, mcgMin: 2000, doseMcgKgMin: 25 },
        { rateMlHr: 14.4, concMgMl: 10, concMcgMl: 10000, weightKg: 80, mcgMin: 2400, doseMcgKgMin: 30 },
        { rateMlHr: 10.5, concMgMl: 10, concMcgMl: 10000, weightKg: 70, mcgMin: 1750, doseMcgKgMin: 25 },
        { rateMlHr: 16.8, concMgMl: 10, concMcgMl: 10000, weightKg: 70, mcgMin: 2800, doseMcgKgMin: 40 },
      ], rng);

      return {
        scenario: `An intubated adult ICU patient weighing ${data.weightKg} kg is receiving a propofol sedation drip (10 mg/mL = 10,000 mcg/mL) running at ${data.rateMlHr} mL/hr.`,
        orderText: `Propofol infusion running at ${data.rateMlHr} mL/hr | Patient weight: ${data.weightKg} kg`,
        availableText: `Propofol 1% emulsion (10 mg/mL)`,
        patientWeightKg: data.weightKg,
        prompt: `Calculate the current dose delivered to the patient in mcg/kg/min.`,
        correctAnswer: data.doseMcgKgMin,
        answerUnit: "mcg/kg/min",
        answerPrecision: 0,
        roundingInstruction: "State whole number.",
        hints: [
          `Step 1: Convert concentration to mcg/mL: 10 mg/mL = 10,000 mcg/mL.`,
          `Step 2: Find total minute mcg: (${data.rateMlHr} mL/hr × 10,000 mcg/mL) ÷ 60 min.`,
          `Step 3: Divide minute mcg by patient weight (${data.weightKg} kg).`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Total Minute Micrograms",
            formula: "(Rate × 10,000 mcg/mL) ÷ 60",
            calculation: `(${data.rateMlHr} mL/hr × 10,000 mcg/mL) ÷ 60 = ${data.mcgMin} mcg/min`,
            result: `${data.mcgMin} mcg/min`,
          },
          {
            stepNumber: 2,
            title: "Calculate mcg/kg/min",
            formula: "mcg/min ÷ Weight (kg)",
            calculation: `${data.mcgMin} mcg/min ÷ ${data.weightKg} kg = ${data.doseMcgKgMin} mcg/kg/min`,
            result: `${data.doseMcgKgMin} mcg/kg/min`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-vasopressin-units-min-double-strength",
    category: "critical-care",
    subtype: "vasoactive-drip",
    difficulty: "advanced",
    title: "Double-Strength Vasopressin Infusion Rate (0.4 units/mL)",
    clinicalContext: "Adult ICU Fluid-Restricted Septic Shock Protocol",
    generate: (rng) => {
      const data = pick([
        { unitsMin: 0.04, bagUnits: 40, bagMl: 100, concUnitsMl: 0.4, hourlyUnits: 2.4, rateMlHr: 6.0 },
        { unitsMin: 0.03, bagUnits: 40, bagMl: 100, concUnitsMl: 0.4, hourlyUnits: 1.8, rateMlHr: 4.5 },
        { unitsMin: 0.02, bagUnits: 40, bagMl: 100, concUnitsMl: 0.4, hourlyUnits: 1.2, rateMlHr: 3.0 },
        { unitsMin: 0.06, bagUnits: 40, bagMl: 100, concUnitsMl: 0.4, hourlyUnits: 3.6, rateMlHr: 9.0 },
      ], rng);

      return {
        scenario: `An adult patient in septic shock with acute renal failure requires double-strength concentrated vasopressin for fluid restriction.`,
        orderText: `Vasopressin continuous IV infusion at ${data.unitsMin} units/min`,
        availableText: `Vasopressin ${data.bagUnits} units in ${data.bagMl} mL 0.9% NS (${data.concUnitsMl} units/mL)`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          `Step 1: Calculate hourly units: ${data.unitsMin} units/min × 60 = ${data.hourlyUnits} units/hr.`,
          `Step 2: Concentration is ${data.bagUnits} units ÷ ${data.bagMl} mL = ${data.concUnitsMl} units/mL.`,
          `Step 3: Calculate rate: ${data.hourlyUnits} units/hr ÷ ${data.concUnitsMl} units/mL = ${data.rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert to Hourly Units",
            formula: "units/min × 60",
            calculation: `${data.unitsMin} units/min × 60 min = ${data.hourlyUnits} units/hr`,
            result: `${data.hourlyUnits} units/hr`,
          },
          {
            stepNumber: 2,
            title: "Calculate Flow Rate",
            formula: "Units/hr ÷ Concentration (0.4 units/mL)",
            calculation: `${data.hourlyUnits} units/hr ÷ ${data.concUnitsMl} units/mL = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-norepinephrine-quad-strength-16mg",
    category: "critical-care",
    subtype: "vasoactive-drip",
    difficulty: "critical-care",
    title: "Quad-Strength Norepinephrine Infusion Rate (64 mcg/mL)",
    clinicalContext: "Adult ICU Severe ARDS Fluid Restriction Protocol",
    generate: (rng) => {
      const data = pick([
        { weightKg: 80, doseMcgKgMin: 0.15, bagMg: 16, bagMl: 250, concMcgMl: 64, totalMcgMin: 12, totalMcgHr: 720, rateMlHr: 11.3 },
        { weightKg: 70, doseMcgKgMin: 0.1, bagMg: 16, bagMl: 250, concMcgMl: 64, totalMcgMin: 7, totalMcgHr: 420, rateMlHr: 6.6 },
        { weightKg: 75, doseMcgKgMin: 0.2, bagMg: 16, bagMl: 250, concMcgMl: 64, totalMcgMin: 15, totalMcgHr: 900, rateMlHr: 14.1 },
        { weightKg: 90, doseMcgKgMin: 0.08, bagMg: 16, bagMl: 250, concMcgMl: 64, totalMcgMin: 7.2, totalMcgHr: 432, rateMlHr: 6.8 },
      ], rng);

      return {
        scenario: `A critically ill patient with severe ARDS on strict fluid restriction is prescribed quad-strength norepinephrine (16 mg in 250 mL D5W) at ${data.doseMcgKgMin} mcg/kg/min. Patient weight is ${data.weightKg} kg.`,
        orderText: `Norepinephrine IV continuous infusion at ${data.doseMcgKgMin} mcg/kg/min (Patient weight: ${data.weightKg} kg)`,
        availableText: `Norepinephrine 16 mg in 250 mL D5W (Quad Strength, ${data.concMcgMl} mcg/mL)`,
        patientWeightKg: data.weightKg,
        prompt: `Calculate the IV pump flow rate in mL/hr.`,
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          `Step 1: Calculate ordered mcg/min: ${data.weightKg} kg × ${data.doseMcgKgMin} mcg/kg/min = ${data.totalMcgMin} mcg/min.`,
          `Step 2: Convert to mcg/hr: ${data.totalMcgMin} × 60 = ${data.totalMcgHr} mcg/hr.`,
          `Step 3: Concentration: 16,000 mcg ÷ 250 mL = 64 mcg/mL.`,
          `Step 4: Divide hourly mcg by 64 mcg/mL: ${data.totalMcgHr} ÷ 64 = ${data.rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Minute Micrograms",
            formula: "Weight (kg) × Dose (mcg/kg/min)",
            calculation: `${data.weightKg} kg × ${data.doseMcgKgMin} mcg/kg/min = ${data.totalMcgMin} mcg/min`,
            result: `${data.totalMcgMin} mcg/min`,
          },
          {
            stepNumber: 2,
            title: "Convert to Hourly Micrograms",
            formula: "mcg/min × 60",
            calculation: `${data.totalMcgMin} mcg/min × 60 = ${data.totalMcgHr} mcg/hr`,
            result: `${data.totalMcgHr} mcg/hr`,
          },
          {
            stepNumber: 3,
            title: "Calculate Pump Rate",
            formula: "mcg/hr ÷ 64 mcg/mL",
            calculation: `${data.totalMcgHr} mcg/hr ÷ 64 mcg/mL = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-fentanyl-continuous-mcghr",
    category: "critical-care",
    subtype: "sedation-drip",
    difficulty: "beginner",
    title: "Continuous Fentanyl Infusion Rate in mL/hr",
    clinicalContext: "Adult ICU Mechanical Ventilation Analgesia",
    generate: (rng) => {
      const data = pick([
        { orderedMcgHr: 50, bagMcg: 2500, bagMl: 250, concMcgMl: 10, rateMlHr: 5.0 },
        { orderedMcgHr: 75, bagMcg: 2500, bagMl: 250, concMcgMl: 10, rateMlHr: 7.5 },
        { orderedMcgHr: 100, bagMcg: 2500, bagMl: 250, concMcgMl: 10, rateMlHr: 10.0 },
        { orderedMcgHr: 25, bagMcg: 2500, bagMl: 250, concMcgMl: 10, rateMlHr: 2.5 },
      ], rng);

      return {
        scenario: `An adult ICU patient on mechanical ventilation is ordered a continuous fentanyl analgesia infusion at ${data.orderedMcgHr} mcg/hr.`,
        orderText: `Fentanyl continuous IV infusion at ${data.orderedMcgHr} mcg/hr`,
        availableText: `Fentanyl ${data.bagMcg.toLocaleString()} mcg in ${data.bagMl} mL 0.9% NS (${data.concMcgMl} mcg/mL)`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "State exact number or round to nearest tenth.",
        hints: [
          `Divide ordered hourly dose by bag concentration (${data.concMcgMl} mcg/mL).`,
          `Calculate: ${data.orderedMcgHr} mcg/hr ÷ ${data.concMcgMl} mcg/mL = ${data.rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Flow Rate",
            formula: "Ordered Dose (mcg/hr) ÷ Concentration (mcg/mL)",
            calculation: `${data.orderedMcgHr} mcg/hr ÷ ${data.concMcgMl} mcg/mL = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-fentanyl-reverse-mlhr-to-mcghr",
    category: "critical-care",
    subtype: "sedation-drip",
    difficulty: "beginner",
    title: "Reverse Fentanyl: Calculate Delivered mcg/hr from Flow Rate",
    clinicalContext: "Adult ICU Analgesia Shift Reconciliation",
    generate: (rng) => {
      const data = pick([
        { rateMlHr: 8.0, concMcgMl: 10, doseMcgHr: 80 },
        { rateMlHr: 12.5, concMcgMl: 10, doseMcgHr: 125 },
        { rateMlHr: 5.0, concMcgMl: 10, doseMcgHr: 50 },
        { rateMlHr: 15.0, concMcgMl: 10, doseMcgHr: 150 },
      ], rng);

      return {
        scenario: `A continuous IV fentanyl infusion (10 mcg/mL) is running on an electronic infusion pump at ${data.rateMlHr} mL/hr.`,
        orderText: `Fentanyl infusion running at ${data.rateMlHr} mL/hr`,
        availableText: `Fentanyl 2,500 mcg / 250 mL (${data.concMcgMl} mcg/mL)`,
        prompt: `How many mcg/hr of fentanyl is the patient currently receiving?`,
        correctAnswer: data.doseMcgHr,
        answerUnit: "mcg/hr",
        answerPrecision: 0,
        roundingInstruction: "State whole number.",
        hints: [
          "Multiply rate in mL/hr by concentration in mcg/mL.",
          `Calculate: ${data.rateMlHr} mL/hr × ${data.concMcgMl} mcg/mL = ${data.doseMcgHr} mcg/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Micrograms per Hour",
            formula: "Rate (mL/hr) × Concentration (mcg/mL)",
            calculation: `${data.rateMlHr} mL/hr × ${data.concMcgMl} mcg/mL = ${data.doseMcgHr} mcg/hr`,
            result: `${data.doseMcgHr} mcg/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-esmolol-mcgkgmin-rate",
    category: "critical-care",
    subtype: "vasoactive-drip",
    difficulty: "advanced",
    title: "Esmolol (Brevibloc) Rapid Beta-Blocker Infusion Rate",
    clinicalContext: "Adult ICU Aortic Dissection / Tachycardia Protocol",
    generate: (rng) => {
      const data = pick([
        { weightKg: 70, doseMcgKgMin: 50, bagGrams: 2.5, bagMl: 250, concMcgMl: 10000, totalMcgMin: 3500, totalMcgHr: 210000, rateMlHr: 21.0 },
        { weightKg: 80, doseMcgKgMin: 100, bagGrams: 2.5, bagMl: 250, concMcgMl: 10000, totalMcgMin: 8000, totalMcgHr: 480000, rateMlHr: 48.0 },
        { weightKg: 65, doseMcgKgMin: 75, bagGrams: 2.5, bagMl: 250, concMcgMl: 10000, totalMcgMin: 4875, totalMcgHr: 292500, rateMlHr: 29.3 },
        { weightKg: 85, doseMcgKgMin: 50, bagGrams: 2.5, bagMl: 250, concMcgMl: 10000, totalMcgMin: 4250, totalMcgHr: 255000, rateMlHr: 25.5 },
      ], rng);

      return {
        scenario: `An adult patient in the ICU with an acute type B aortic dissection requires strict heart rate control (< 60 bpm) with an esmolol infusion at ${data.doseMcgKgMin} mcg/kg/min. Patient weight is ${data.weightKg} kg.`,
        orderText: `Esmolol IV infusion at ${data.doseMcgKgMin} mcg/kg/min (Patient weight: ${data.weightKg} kg)`,
        availableText: `Esmolol 2.5 g in 250 mL 0.9% NS (10,000 mcg/mL)`,
        patientWeightKg: data.weightKg,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          `Step 1: Calculate mcg/min: ${data.weightKg} kg × ${data.doseMcgKgMin} mcg/kg/min = ${data.totalMcgMin} mcg/min.`,
          `Step 2: Convert to mcg/hr: ${data.totalMcgMin} × 60 = ${data.totalMcgHr} mcg/hr.`,
          `Step 3: Divide by bag concentration (10,000 mcg/mL): ${data.totalMcgHr} ÷ 10,000 = ${data.rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Minute Micrograms",
            formula: "Weight (kg) × Dose (mcg/kg/min)",
            calculation: `${data.weightKg} kg × ${data.doseMcgKgMin} mcg/kg/min = ${data.totalMcgMin} mcg/min`,
            result: `${data.totalMcgMin} mcg/min`,
          },
          {
            stepNumber: 2,
            title: "Calculate Pump Flow Rate",
            formula: "(mcg/min × 60) ÷ 10,000 mcg/mL",
            calculation: `(${data.totalMcgMin} × 60) ÷ 10,000 = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-diltiazem-mghr-to-mlhr",
    category: "critical-care",
    subtype: "vasoactive-drip",
    difficulty: "beginner",
    title: "Continuous Diltiazem (Cardizem) Infusion Rate (mL/hr)",
    clinicalContext: "Adult Step-Down Atrial Fibrillation with RVR",
    generate: (rng) => {
      const data = pick([
        { orderedMgHr: 10, bagMg: 125, bagMl: 125, concMgMl: 1, rateMlHr: 10 },
        { orderedMgHr: 5, bagMg: 125, bagMl: 125, concMgMl: 1, rateMlHr: 5 },
        { orderedMgHr: 15, bagMg: 125, bagMl: 125, concMgMl: 1, rateMlHr: 15 },
        { orderedMgHr: 7.5, bagMg: 125, bagMl: 125, concMgMl: 1, rateMlHr: 7.5 },
      ], rng);

      return {
        scenario: `An adult inpatient presenting with atrial fibrillation with rapid ventricular response (heart rate 145 bpm) is ordered a continuous diltiazem infusion.`,
        orderText: `Diltiazem continuous IV infusion at ${data.orderedMgHr} mg/hr`,
        availableText: `Diltiazem 125 mg in 125 mL D5W (1 mg/mL)`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "State exact number or round to nearest tenth.",
        hints: [
          `Bag concentration is 125 mg ÷ 125 mL = 1 mg/mL.`,
          `Since concentration is 1 mg/mL, pump rate in mL/hr equals ordered mg/hr.`,
          `Calculate: ${data.orderedMgHr} mg/hr ÷ 1 mg/mL = ${data.rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Flow Rate",
            formula: "Ordered mg/hr ÷ Concentration (1 mg/mL)",
            calculation: `${data.orderedMgHr} mg/hr ÷ 1 mg/mL = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-amiodarone-maintenance-05mgmin",
    category: "critical-care",
    subtype: "antiarrhythmic-drip",
    difficulty: "intermediate",
    title: "Amiodarone Step-Down Maintenance Rate (0.5 mg/min)",
    clinicalContext: "Adult CCU Post-Cardiac Arrest Antiarrhythmic Infusion",
    generate: (rng) => {
      const data = pick([
        { mgMin: 0.5, mgHr: 30, bagMg: 900, bagMl: 500, concMgMl: 1.8, rateMlHr: 16.7 },
        { mgMin: 1.0, mgHr: 60, bagMg: 900, bagMl: 500, concMgMl: 1.8, rateMlHr: 33.3 },
        { mgMin: 0.5, mgHr: 30, bagMg: 450, bagMl: 250, concMgMl: 1.8, rateMlHr: 16.7 },
        { mgMin: 1.0, mgHr: 60, bagMg: 450, bagMl: 250, concMgMl: 1.8, rateMlHr: 33.3 },
      ], rng);

      return {
        scenario: `Following an initial 6-hour loading phase at 1 mg/min, an adult patient with recurrent ventricular tachycardia is transitioned to maintenance IV amiodarone at ${data.mgMin} mg/min for the remaining 18 hours.`,
        orderText: `Amiodarone continuous IV infusion at ${data.mgMin} mg/min`,
        availableText: `Amiodarone ${data.bagMg} mg in ${data.bagMl} mL D5W (${data.concMgMl} mg/mL)`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth (e.g. 16.7).",
        hints: [
          `Step 1: Calculate hourly mg: ${data.mgMin} mg/min × 60 = ${data.mgHr} mg/hr.`,
          `Step 2: Bag concentration is ${data.bagMg} mg ÷ ${data.bagMl} mL = ${data.concMgMl} mg/mL.`,
          `Step 3: Calculate rate: ${data.mgHr} mg/hr ÷ ${data.concMgMl} mg/mL = ${data.rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Minute Milligrams to Hourly Milligrams",
            formula: "mg/min × 60",
            calculation: `${data.mgMin} mg/min × 60 min = ${data.mgHr} mg/hr`,
            result: `${data.mgHr} mg/hr`,
          },
          {
            stepNumber: 2,
            title: "Calculate Pump Flow Rate",
            formula: "Hourly Milligrams ÷ Concentration (mg/mL)",
            calculation: `${data.mgHr} mg/hr ÷ ${data.concMgMl} mg/mL = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-phenylephrine-mcg-kg-min",
    category: "critical-care",
    subtype: "vasoactive-drip",
    difficulty: "advanced",
    title: "Weight-Based Phenylephrine (Neo-Synephrine) Infusion Rate",
    clinicalContext: "Adult Neuro-ICU Vasospasm Management Protocol",
    generate: (rng) => {
      const data = pick([
        { weightKg: 70, doseMcgKgMin: 0.5, bagMg: 20, bagMl: 250, concMcgMl: 80, minuteMcg: 35, hourlyMcg: 2100, rateMlHr: 26.3 },
        { weightKg: 80, doseMcgKgMin: 0.5, bagMg: 20, bagMl: 250, concMcgMl: 80, minuteMcg: 40, hourlyMcg: 2400, rateMlHr: 30.0 },
        { weightKg: 75, doseMcgKgMin: 0.75, bagMg: 20, bagMl: 250, concMcgMl: 80, minuteMcg: 56.25, hourlyMcg: 3375, rateMlHr: 42.2 },
        { weightKg: 60, doseMcgKgMin: 1.0, bagMg: 20, bagMl: 250, concMcgMl: 80, minuteMcg: 60, hourlyMcg: 3600, rateMlHr: 45.0 },
      ], rng);

      return {
        scenario: `An adult Neuro-ICU patient weighing ${data.weightKg} kg with cerebral vasospasm following subarachnoid hemorrhage is prescribed a weight-based phenylephrine infusion at ${data.doseMcgKgMin} mcg/kg/min for hypertensive hypervolemic therapy.`,
        orderText: `Phenylephrine continuous IV infusion at ${data.doseMcgKgMin} mcg/kg/min (Patient weight: ${data.weightKg} kg)`,
        availableText: `Phenylephrine 20 mg in 250 mL 0.9% NS (${data.concMcgMl} mcg/mL)`,
        patientWeightKg: data.weightKg,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          `Step 1: Calculate minute mcg: ${data.weightKg} kg × ${data.doseMcgKgMin} mcg/kg/min = ${data.minuteMcg} mcg/min.`,
          `Step 2: Convert to hourly mcg: ${data.minuteMcg} × 60 = ${data.hourlyMcg} mcg/hr.`,
          `Step 3: Concentration: 20,000 mcg ÷ 250 mL = ${data.concMcgMl} mcg/mL.`,
          `Step 4: Divide hourly mcg by concentration: ${data.hourlyMcg} ÷ ${data.concMcgMl} = ${data.rateMlHr} mL/hr.`,
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
            title: "Calculate Pump Flow Rate",
            formula: "Hourly Micrograms ÷ Concentration (80 mcg/mL)",
            calculation: `${data.hourlyMcg} mcg/hr ÷ 80 mcg/mL = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-phenylephrine-reverse-mlhr-to-mcgkgmin",
    category: "critical-care",
    subtype: "vasoactive-drip",
    difficulty: "critical-care",
    title: "Reverse Phenylephrine: Calculate mcg/kg/min from Pump Rate",
    clinicalContext: "Adult Neuro-ICU Hemodynamic Audit",
    generate: (rng) => {
      const data = pick([
        { rateMlHr: 15, concMcgMl: 80, weightKg: 80, minuteMcg: 20, doseMcgKgMin: 0.25 },
        { rateMlHr: 30, concMcgMl: 80, weightKg: 80, minuteMcg: 40, doseMcgKgMin: 0.50 },
        { rateMlHr: 24, concMcgMl: 80, weightKg: 70, minuteMcg: 32, doseMcgKgMin: 0.46 },
        { rateMlHr: 18, concMcgMl: 80, weightKg: 60, minuteMcg: 24, doseMcgKgMin: 0.40 },
      ], rng);

      return {
        scenario: `An adult patient weighing ${data.weightKg} kg is receiving a continuous phenylephrine drip (20 mg in 250 mL NS, ${data.concMcgMl} mcg/mL) running at ${data.rateMlHr} mL/hr.`,
        orderText: `Phenylephrine infusion running at ${data.rateMlHr} mL/hr | Patient weight: ${data.weightKg} kg`,
        availableText: `Phenylephrine 20 mg / 250 mL (${data.concMcgMl} mcg/mL)`,
        patientWeightKg: data.weightKg,
        prompt: `Calculate the current dose delivered to the patient in mcg/kg/min.`,
        correctAnswer: data.doseMcgKgMin,
        answerUnit: "mcg/kg/min",
        answerPrecision: 2,
        roundingInstruction: "Round to nearest hundredth.",
        hints: [
          `Step 1: Find minute mcg delivered: (${data.rateMlHr} mL/hr × ${data.concMcgMl} mcg/mL) ÷ 60 min = ${data.minuteMcg} mcg/min.`,
          `Step 2: Divide minute mcg by patient weight: ${data.minuteMcg} mcg/min ÷ ${data.weightKg} kg = ${data.doseMcgKgMin} mcg/kg/min.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Minute Micrograms",
            formula: "(Rate × Concentration) ÷ 60",
            calculation: `(${data.rateMlHr} mL/hr × ${data.concMcgMl} mcg/mL) ÷ 60 = ${data.minuteMcg} mcg/min`,
            result: `${data.minuteMcg} mcg/min`,
          },
          {
            stepNumber: 2,
            title: "Calculate mcg/kg/min",
            formula: "mcg/min ÷ Weight (kg)",
            calculation: `${data.minuteMcg} mcg/min ÷ ${data.weightKg} kg = ${data.doseMcgKgMin} mcg/kg/min`,
            result: `${data.doseMcgKgMin} mcg/kg/min`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-epinephrine-anaphylaxis-drip",
    category: "critical-care",
    subtype: "vasoactive-drip",
    difficulty: "intermediate",
    title: "Epinephrine Infusion Rate in mcg/min (Fixed Metric)",
    clinicalContext: "Adult ICU Refractory Anaphylaxis / Bradycardia",
    generate: (rng) => {
      const data = pick([
        { orderedMcgMin: 2, bagMg: 4, bagMl: 250, concMcgMl: 16, hourlyMcg: 120, rateMlHr: 7.5 },
        { orderedMcgMin: 4, bagMg: 4, bagMl: 250, concMcgMl: 16, hourlyMcg: 240, rateMlHr: 15.0 },
        { orderedMcgMin: 5, bagMg: 4, bagMl: 250, concMcgMl: 16, hourlyMcg: 300, rateMlHr: 18.8 },
        { orderedMcgMin: 8, bagMg: 4, bagMl: 250, concMcgMl: 16, hourlyMcg: 480, rateMlHr: 30.0 },
      ], rng);

      return {
        scenario: `An adult inpatient experiencing severe anaphylactic shock unresponsive to IM doses is started on a continuous epinephrine infusion at ${data.orderedMcgMin} mcg/min.`,
        orderText: `Epinephrine continuous IV infusion at ${data.orderedMcgMin} mcg/min`,
        availableText: `Epinephrine 4 mg in 250 mL 0.9% NS (${data.concMcgMl} mcg/mL)`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          `Step 1: Convert ordered mcg/min to mcg/hr: ${data.orderedMcgMin} mcg/min × 60 = ${data.hourlyMcg} mcg/hr.`,
          `Step 2: Bag concentration is 4,000 mcg ÷ 250 mL = ${data.concMcgMl} mcg/mL.`,
          `Step 3: Calculate rate: ${data.hourlyMcg} mcg/hr ÷ ${data.concMcgMl} mcg/mL = ${data.rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Minute Dose to Hourly Dose",
            formula: "mcg/min × 60",
            calculation: `${data.orderedMcgMin} mcg/min × 60 = ${data.hourlyMcg} mcg/hr`,
            result: `${data.hourlyMcg} mcg/hr`,
          },
          {
            stepNumber: 2,
            title: "Calculate Infusion Pump Rate",
            formula: "Hourly Micrograms ÷ Concentration (16 mcg/mL)",
            calculation: `${data.hourlyMcg} mcg/hr ÷ ${data.concMcgMl} mcg/mL = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-epinephrine-reverse-mcgmin",
    category: "critical-care",
    subtype: "vasoactive-drip",
    difficulty: "beginner",
    title: "Reverse Epinephrine: Calculate mcg/min from Pump Flow Rate",
    clinicalContext: "Adult Inpatient Resuscitation Audit",
    generate: (rng) => {
      const data = pick([
        { rateMlHr: 15.0, concMcgMl: 16, hourlyMcg: 240, doseMcgMin: 4.0 },
        { rateMlHr: 7.5, concMcgMl: 16, hourlyMcg: 120, doseMcgMin: 2.0 },
        { rateMlHr: 22.5, concMcgMl: 16, hourlyMcg: 360, doseMcgMin: 6.0 },
        { rateMlHr: 30.0, concMcgMl: 16, hourlyMcg: 480, doseMcgMin: 8.0 },
      ], rng);

      return {
        scenario: `A continuous epinephrine infusion (4 mg in 250 mL NS, 16 mcg/mL) is infusing at ${data.rateMlHr} mL/hr.`,
        orderText: `Epinephrine drip running at ${data.rateMlHr} mL/hr`,
        availableText: `Epinephrine 4 mg / 250 mL (16 mcg/mL)`,
        prompt: `How many mcg/min of epinephrine is the patient receiving?`,
        correctAnswer: data.doseMcgMin,
        answerUnit: "mcg/min",
        answerPrecision: 1,
        roundingInstruction: "State exact number or round to nearest tenth.",
        hints: [
          `Step 1: Calculate hourly mcg: ${data.rateMlHr} mL/hr × ${data.concMcgMl} mcg/mL = ${data.hourlyMcg} mcg/hr.`,
          `Step 2: Divide hourly mcg by 60 minutes: ${data.hourlyMcg} ÷ 60 = ${data.doseMcgMin} mcg/min.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Hourly Micrograms",
            formula: "Rate (mL/hr) × Concentration (mcg/mL)",
            calculation: `${data.rateMlHr} mL/hr × ${data.concMcgMl} mcg/mL = ${data.hourlyMcg} mcg/hr`,
            result: `${data.hourlyMcg} mcg/hr`,
          },
          {
            stepNumber: 2,
            title: "Convert to Micrograms per Minute",
            formula: "Hourly Micrograms ÷ 60",
            calculation: `${data.hourlyMcg} mcg/hr ÷ 60 = ${data.doseMcgMin} mcg/min`,
            result: `${data.doseMcgMin} mcg/min`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-cisatracurium-mcgkgmin-rate",
    category: "critical-care",
    subtype: "paralytic-drip",
    difficulty: "critical-care",
    title: "Continuous Cisatracurium (Nimbex) Infusion Rate",
    clinicalContext: "Adult ICU Severe ARDS Neuromuscular Blockade",
    generate: (rng) => {
      const data = pick([
        { weightKg: 70, doseMcgKgMin: 2.0, bagMg: 200, bagMl: 1000, concMcgMl: 200, minuteMcg: 140, hourlyMcg: 8400, rateMlHr: 42.0 },
        { weightKg: 80, doseMcgKgMin: 2.5, bagMg: 200, bagMl: 1000, concMcgMl: 200, minuteMcg: 200, hourlyMcg: 12000, rateMlHr: 60.0 },
        { weightKg: 75, doseMcgKgMin: 1.5, bagMg: 200, bagMl: 1000, concMcgMl: 200, minuteMcg: 112.5, hourlyMcg: 6750, rateMlHr: 33.8 },
        { weightKg: 90, doseMcgKgMin: 2.0, bagMg: 200, bagMl: 1000, concMcgMl: 200, minuteMcg: 180, hourlyMcg: 10800, rateMlHr: 54.0 },
      ], rng);

      return {
        scenario: `An adult ICU patient weighing ${data.weightKg} kg with refractory ARDS on prone ventilation is prescribed a continuous cisatracurium paralytic infusion at ${data.doseMcgKgMin} mcg/kg/min.`,
        orderText: `Cisatracurium IV continuous infusion at ${data.doseMcgKgMin} mcg/kg/min (Weight: ${data.weightKg} kg)`,
        availableText: `Cisatracurium 200 mg in 1,000 mL D5W (${data.concMcgMl} mcg/mL)`,
        patientWeightKg: data.weightKg,
        prompt: `Calculate the IV pump flow rate in mL/hr.`,
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          `Step 1: Calculate minute mcg: ${data.weightKg} kg × ${data.doseMcgKgMin} mcg/kg/min = ${data.minuteMcg} mcg/min.`,
          `Step 2: Convert to hourly mcg: ${data.minuteMcg} × 60 = ${data.hourlyMcg} mcg/hr.`,
          `Step 3: Concentration is 200,000 mcg ÷ 1,000 mL = ${data.concMcgMl} mcg/mL.`,
          `Step 4: Divide hourly mcg by 200 mcg/mL: ${data.hourlyMcg} ÷ 200 = ${data.rateMlHr} mL/hr.`,
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
            title: "Calculate Pump Rate",
            formula: "Hourly Micrograms ÷ Concentration (200 mcg/mL)",
            calculation: `${data.hourlyMcg} mcg/hr ÷ 200 mcg/mL = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-nitroprusside-mcgkgmin-rate",
    category: "critical-care",
    subtype: "vasoactive-drip",
    difficulty: "advanced",
    title: "Sodium Nitroprusside (Nipride) Infusion Rate",
    clinicalContext: "Adult ICU Acute Aortic Dissection Hypertensive Emergency",
    generate: (rng) => {
      const data = pick([
        { weightKg: 80, doseMcgKgMin: 0.5, bagMg: 50, bagMl: 250, concMcgMl: 200, minuteMcg: 40, hourlyMcg: 2400, rateMlHr: 12.0 },
        { weightKg: 70, doseMcgKgMin: 1.0, bagMg: 50, bagMl: 250, concMcgMl: 200, minuteMcg: 70, hourlyMcg: 4200, rateMlHr: 21.0 },
        { weightKg: 90, doseMcgKgMin: 0.75, bagMg: 50, bagMl: 250, concMcgMl: 200, minuteMcg: 67.5, hourlyMcg: 4050, rateMlHr: 20.3 },
        { weightKg: 75, doseMcgKgMin: 2.0, bagMg: 50, bagMl: 250, concMcgMl: 200, minuteMcg: 150, hourlyMcg: 9000, rateMlHr: 45.0 },
      ], rng);

      return {
        scenario: `An adult ICU patient weighing ${data.weightKg} kg experiencing acute hypertensive crisis is prescribed sodium nitroprusside at ${data.doseMcgKgMin} mcg/kg/min with arterial line monitoring.`,
        orderText: `Nitroprusside continuous IV infusion at ${data.doseMcgKgMin} mcg/kg/min (Patient weight: ${data.weightKg} kg)`,
        availableText: `Sodium Nitroprusside 50 mg in 250 mL D5W (wrapped in foil, ${data.concMcgMl} mcg/mL)`,
        patientWeightKg: data.weightKg,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          `Step 1: Minute mcg = ${data.weightKg} kg × ${data.doseMcgKgMin} mcg/kg/min = ${data.minuteMcg} mcg/min.`,
          `Step 2: Hourly mcg = ${data.minuteMcg} × 60 = ${data.hourlyMcg} mcg/hr.`,
          `Step 3: Concentration = 50,000 mcg ÷ 250 mL = ${data.concMcgMl} mcg/mL.`,
          `Step 4: Rate = ${data.hourlyMcg} ÷ 200 = ${data.rateMlHr} mL/hr.`,
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
            formula: "Hourly Micrograms ÷ Concentration (200 mcg/mL)",
            calculation: `${data.hourlyMcg} mcg/hr ÷ 200 mcg/mL = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-labetalol-continuous-mghr",
    category: "critical-care",
    subtype: "vasoactive-drip",
    difficulty: "beginner",
    title: "Continuous Labetalol Infusion Rate (mg/hr to mL/hr)",
    clinicalContext: "Adult Neuro-ICU Acute Stroke Blood Pressure Control",
    generate: (rng) => {
      const data = pick([
        { orderedMgHr: 60, bagMg: 200, bagMl: 200, concMgMl: 1.0, rateMlHr: 60 },
        { orderedMgHr: 120, bagMg: 200, bagMl: 200, concMgMl: 1.0, rateMlHr: 120 },
        { orderedMgHr: 30, bagMg: 200, bagMl: 200, concMgMl: 1.0, rateMlHr: 30 },
        { orderedMgHr: 90, bagMg: 200, bagMl: 200, concMgMl: 1.0, rateMlHr: 90 },
      ], rng);

      return {
        scenario: `An acute ischemic stroke patient eligible for thrombolysis requires blood pressure reduction to SBP < 185 mmHg via continuous labetalol infusion at ${data.orderedMgHr} mg/hr.`,
        orderText: `Labetalol continuous IV infusion at ${data.orderedMgHr} mg/hr`,
        availableText: `Labetalol ${data.bagMg} mg in ${data.bagMl} mL 0.9% NS (${data.concMgMl} mg/mL)`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 0,
        roundingInstruction: "State exact whole number.",
        hints: [
          `Bag concentration is ${data.bagMg} mg ÷ ${data.bagMl} mL = 1 mg/mL.`,
          `Divide ordered hourly dose by concentration: ${data.orderedMgHr} ÷ 1 = ${data.rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Pump Rate",
            formula: "Ordered mg/hr ÷ Concentration (1 mg/mL)",
            calculation: `${data.orderedMgHr} mg/hr ÷ 1 mg/mL = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-midazolam-continuous-mghr",
    category: "critical-care",
    subtype: "sedation-drip",
    difficulty: "beginner",
    title: "Continuous Midazolam (Versed) Sedation Rate (mL/hr)",
    clinicalContext: "Adult ICU Deep Sedation Protocol",
    generate: (rng) => {
      const data = pick([
        { orderedMgHr: 4, bagMg: 100, bagMl: 100, concMgMl: 1.0, rateMlHr: 4 },
        { orderedMgHr: 2, bagMg: 100, bagMl: 100, concMgMl: 1.0, rateMlHr: 2 },
        { orderedMgHr: 6, bagMg: 100, bagMl: 100, concMgMl: 1.0, rateMlHr: 6 },
        { orderedMgHr: 8, bagMg: 100, bagMl: 100, concMgMl: 1.0, rateMlHr: 8 },
      ], rng);

      return {
        scenario: `An adult ICU patient on mechanical ventilation requires continuous sedation with midazolam at ${data.orderedMgHr} mg/hr.`,
        orderText: `Midazolam continuous IV infusion at ${data.orderedMgHr} mg/hr`,
        availableText: `Midazolam ${data.bagMg} mg in ${data.bagMl} mL 0.9% NS (1 mg/mL)`,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 0,
        roundingInstruction: "State whole number.",
        hints: [
          "Concentration is 1 mg/mL.",
          `Calculate: ${data.orderedMgHr} mg/hr ÷ 1 mg/mL = ${data.rateMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Flow Rate",
            formula: "Ordered mg/hr ÷ Concentration (1 mg/mL)",
            calculation: `${data.orderedMgHr} mg/hr ÷ 1 mg/mL = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-norepinephrine-titration-map-step",
    category: "critical-care",
    subtype: "vasoactive-drip",
    difficulty: "critical-care",
    title: "Norepinephrine MAP-Driven Titration Rate Increment",
    clinicalContext: "Adult ICU Septic Shock Titration Protocol",
    generate: (rng) => {
      const data = pick([
        { weightKg: 75, titrationStep: 0.04, bagMg: 8, bagMl: 250, concMcgMl: 32, stepMcgMin: 3.0, stepMcgHr: 180, rateIncrementMlHr: 5.6 },
        { weightKg: 80, titrationStep: 0.02, bagMg: 8, bagMl: 250, concMcgMl: 32, stepMcgMin: 1.6, stepMcgHr: 96, rateIncrementMlHr: 3.0 },
        { weightKg: 70, titrationStep: 0.05, bagMg: 8, bagMl: 250, concMcgMl: 32, stepMcgMin: 3.5, stepMcgHr: 210, rateIncrementMlHr: 6.6 },
        { weightKg: 90, titrationStep: 0.03, bagMg: 8, bagMl: 250, concMcgMl: 32, stepMcgMin: 2.7, stepMcgHr: 162, rateIncrementMlHr: 5.1 },
      ], rng);

      return {
        scenario: `An adult septic shock patient weighing ${data.weightKg} kg has a Mean Arterial Pressure (MAP) of 58 mmHg (goal ≥ 65 mmHg). Per the ICU titration protocol, the nurse increases the norepinephrine infusion by ${data.titrationStep} mcg/kg/min. The bag contains 8 mg in 250 mL D5W (32 mcg/mL).`,
        orderText: `Titrate Norepinephrine by ${data.titrationStep} mcg/kg/min every 5 minutes for MAP < 65 mmHg`,
        availableText: `Norepinephrine 8 mg in 250 mL D5W (32 mcg/mL)`,
        patientWeightKg: data.weightKg,
        prompt: `Calculate the flow rate increment in mL/hr that the nurse must add to the current pump rate.`,
        correctAnswer: data.rateIncrementMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          `Step 1: Calculate minute step: ${data.weightKg} kg × ${data.titrationStep} mcg/kg/min = ${data.stepMcgMin} mcg/min.`,
          `Step 2: Convert to hourly step: ${data.stepMcgMin} × 60 = ${data.stepMcgHr} mcg/hr.`,
          `Step 3: Divide by 32 mcg/mL: ${data.stepMcgHr} ÷ 32 = ${data.rateIncrementMlHr} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Titration Increment Micrograms",
            formula: "Weight (kg) × Step Dose (mcg/kg/min) × 60 min",
            calculation: `${data.weightKg} kg × ${data.titrationStep} mcg/kg/min × 60 = ${data.stepMcgHr} mcg/hr`,
            result: `${data.stepMcgHr} mcg/hr`,
          },
          {
            stepNumber: 2,
            title: "Calculate Flow Rate Increment",
            formula: "Hourly Micrograms ÷ Concentration (32 mcg/mL)",
            calculation: `${data.stepMcgHr} mcg/hr ÷ 32 mcg/mL = ${data.rateIncrementMlHr} mL/hr`,
            result: `${data.rateIncrementMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-dopamine-renal-dose-lb",
    category: "critical-care",
    subtype: "vasoactive-drip",
    difficulty: "advanced",
    title: "Dopamine Inotropic Infusion (Pounds to Kilograms)",
    clinicalContext: "Adult ICU Oliguric Renal Perfusion Protocol",
    generate: (rng) => {
      const data = pick([
        { lb: 176, kg: 80, doseMcgKgMin: 3.0, bagMg: 400, bagMl: 250, concMcgMl: 1600, minuteMcg: 240, hourlyMcg: 14400, rateMlHr: 9.0 },
        { lb: 154, kg: 70, doseMcgKgMin: 3.0, bagMg: 400, bagMl: 250, concMcgMl: 1600, minuteMcg: 210, hourlyMcg: 12600, rateMlHr: 7.9 },
        { lb: 198, kg: 90, doseMcgKgMin: 2.5, bagMg: 400, bagMl: 250, concMcgMl: 1600, minuteMcg: 225, hourlyMcg: 13500, rateMlHr: 8.4 },
        { lb: 132, kg: 60, doseMcgKgMin: 3.0, bagMg: 400, bagMl: 250, concMcgMl: 1600, minuteMcg: 180, hourlyMcg: 10800, rateMlHr: 6.8 },
      ], rng);

      return {
        scenario: `An adult ICU patient weighing ${data.lb} lb is prescribed a low-dose dopamine infusion at ${data.doseMcgKgMin} mcg/kg/min for renal vascular support.`,
        orderText: `Dopamine IV continuous infusion at ${data.doseMcgKgMin} mcg/kg/min (Weight: ${data.lb} lb)`,
        availableText: `Dopamine 400 mg in 250 mL D5W (${data.concMcgMl} mcg/mL)`,
        patientWeightLb: data.lb,
        patientWeightKg: data.kg,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          `Step 1: Convert pounds to kg: ${data.lb} lb ÷ 2.2 = ${data.kg} kg.`,
          `Step 2: Calculate minute mcg: ${data.kg} kg × ${data.doseMcgKgMin} mcg/kg/min = ${data.minuteMcg} mcg/min.`,
          `Step 3: Convert to hourly mcg: ${data.minuteMcg} × 60 = ${data.hourlyMcg} mcg/hr.`,
          `Step 4: Divide by concentration: ${data.hourlyMcg} ÷ 1,600 = ${data.rateMlHr} mL/hr.`,
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
            title: "Calculate Hourly Micrograms",
            formula: "Weight (kg) × Dose (mcg/kg/min) × 60 min",
            calculation: `${data.kg} kg × ${data.doseMcgKgMin} mcg/kg/min × 60 = ${data.hourlyMcg} mcg/hr`,
            result: `${data.hourlyMcg} mcg/hr`,
          },
          {
            stepNumber: 3,
            title: "Calculate Flow Rate",
            formula: "Hourly Micrograms ÷ Concentration (1,600 mcg/mL)",
            calculation: `${data.hourlyMcg} mcg/hr ÷ 1,600 mcg/mL = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-dobutamine-lb-to-mlhr",
    category: "critical-care",
    subtype: "vasoactive-drip",
    difficulty: "advanced",
    title: "Dobutamine Inotrope Infusion (Pounds to Kilograms)",
    clinicalContext: "Adult CCU Acute Decompensated Heart Failure",
    generate: (rng) => {
      const data = pick([
        { lb: 198, kg: 90, doseMcgKgMin: 7.5, bagMg: 500, bagMl: 250, concMcgMl: 2000, minuteMcg: 675, hourlyMcg: 40500, rateMlHr: 20.3 },
        { lb: 176, kg: 80, doseMcgKgMin: 5.0, bagMg: 500, bagMl: 250, concMcgMl: 2000, minuteMcg: 400, hourlyMcg: 24000, rateMlHr: 12.0 },
        { lb: 154, kg: 70, doseMcgKgMin: 5.0, bagMg: 500, bagMl: 250, concMcgMl: 2000, minuteMcg: 350, hourlyMcg: 21000, rateMlHr: 10.5 },
        { lb: 176, kg: 80, doseMcgKgMin: 10.0, bagMg: 500, bagMl: 250, concMcgMl: 2000, minuteMcg: 800, hourlyMcg: 48000, rateMlHr: 24.0 },
      ], rng);

      return {
        scenario: `An adult coronary care patient weighing ${data.lb} lb with low cardiac output state is ordered dobutamine at ${data.doseMcgKgMin} mcg/kg/min.`,
        orderText: `Dobutamine IV infusion at ${data.doseMcgKgMin} mcg/kg/min (Weight: ${data.lb} lb)`,
        availableText: `Dobutamine 500 mg in 250 mL D5W (2,000 mcg/mL)`,
        patientWeightLb: data.lb,
        patientWeightKg: data.kg,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          `Step 1: Convert weight: ${data.lb} lb ÷ 2.2 = ${data.kg} kg.`,
          `Step 2: Hourly mcg: ${data.kg} kg × ${data.doseMcgKgMin} mcg/kg/min × 60 = ${data.hourlyMcg} mcg/hr.`,
          `Step 3: Concentration: 500,000 mcg ÷ 250 mL = 2,000 mcg/mL.`,
          `Step 4: Rate: ${data.hourlyMcg} ÷ 2,000 = ${data.rateMlHr} mL/hr.`,
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
            title: "Calculate Hourly Micrograms",
            formula: "Weight (kg) × Dose (mcg/kg/min) × 60 min",
            calculation: `${data.kg} kg × ${data.doseMcgKgMin} mcg/kg/min × 60 = ${data.hourlyMcg} mcg/hr`,
            result: `${data.hourlyMcg} mcg/hr`,
          },
          {
            stepNumber: 3,
            title: "Calculate Flow Rate",
            formula: "Hourly Micrograms ÷ 2,000 mcg/mL",
            calculation: `${data.hourlyMcg} mcg/hr ÷ 2,000 mcg/mL = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-reverse-dobutamine-mlhr-to-mcgkgmin",
    category: "critical-care",
    subtype: "vasoactive-drip",
    difficulty: "critical-care",
    title: "Reverse Dobutamine: Calculate Delivered mcg/kg/min from Pump Rate",
    clinicalContext: "Adult CCU Heart Failure Hemodynamics Audit",
    generate: (rng) => {
      const data = pick([
        { rateMlHr: 12, bagMg: 500, bagMl: 250, concMcgMl: 2000, weightKg: 80, doseMcgKgMin: 5.0 },
        { rateMlHr: 24, bagMg: 500, bagMl: 250, concMcgMl: 2000, weightKg: 80, doseMcgKgMin: 10.0 },
        { rateMlHr: 15, bagMg: 500, bagMl: 250, concMcgMl: 2000, weightKg: 100, doseMcgKgMin: 5.0 },
        { rateMlHr: 18, bagMg: 500, bagMl: 250, concMcgMl: 2000, weightKg: 75, doseMcgKgMin: 8.0 },
      ], rng);

      return {
        scenario: `A continuous dobutamine infusion (500 mg in 250 mL D5W, 2,000 mcg/mL) is running at ${data.rateMlHr} mL/hr in an adult patient weighing ${data.weightKg} kg.`,
        orderText: `Dobutamine infusion running at ${data.rateMlHr} mL/hr | Patient weight: ${data.weightKg} kg`,
        availableText: `Dobutamine 500 mg / 250 mL (2,000 mcg/mL)`,
        patientWeightKg: data.weightKg,
        prompt: `Calculate the current dose delivered to the patient in mcg/kg/min.`,
        correctAnswer: data.doseMcgKgMin,
        answerUnit: "mcg/kg/min",
        answerPrecision: 1,
        roundingInstruction: "State exact number or round to nearest tenth.",
        hints: [
          `Step 1: Calculate minute mcg: (${data.rateMlHr} mL/hr × 2,000 mcg/mL) ÷ 60 min = ${(data.rateMlHr * 2000 / 60).toFixed(1)} mcg/min.`,
          `Step 2: Divide minute mcg by weight (${data.weightKg} kg): ${(data.rateMlHr * 2000 / 60).toFixed(1)} ÷ ${data.weightKg}.`,
          `Calculate: ${data.doseMcgKgMin} mcg/kg/min.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Minute Micrograms",
            formula: "(Rate × Concentration) ÷ 60",
            calculation: `(${data.rateMlHr} mL/hr × 2,000 mcg/mL) ÷ 60 = ${(data.rateMlHr * 2000 / 60).toFixed(1)} mcg/min`,
            result: `${(data.rateMlHr * 2000 / 60).toFixed(1)} mcg/min`,
          },
          {
            stepNumber: 2,
            title: "Calculate mcg/kg/min",
            formula: "mcg/min ÷ Weight (kg)",
            calculation: `${(data.rateMlHr * 2000 / 60).toFixed(1)} mcg/min ÷ ${data.weightKg} kg = ${data.doseMcgKgMin} mcg/kg/min`,
            result: `${data.doseMcgKgMin} mcg/kg/min`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-reverse-precedex-mlhr-to-mcgkghr",
    category: "critical-care",
    subtype: "sedation-drip",
    difficulty: "advanced",
    title: "Reverse Dexmedetomidine: Calculate mcg/kg/hr from Infusion Rate",
    clinicalContext: "Adult ICU Procedural / Post-Extubation Sedation Audit",
    generate: (rng) => {
      const data = pick([
        { rateMlHr: 10, concMcgMl: 4, weightKg: 80, doseMcgKgHr: 0.5 },
        { rateMlHr: 14, concMcgMl: 4, weightKg: 80, doseMcgKgHr: 0.7 },
        { rateMlHr: 7, concMcgMl: 4, weightKg: 70, doseMcgKgHr: 0.4 },
        { rateMlHr: 17.5, concMcgMl: 4, weightKg: 70, doseMcgKgHr: 1.0 },
      ], rng);

      return {
        scenario: `An adult ICU patient weighing ${data.weightKg} kg is receiving a dexmedetomidine (Precedex) continuous infusion (400 mcg in 100 mL NS, 4 mcg/mL) running at ${data.rateMlHr} mL/hr.`,
        orderText: `Dexmedetomidine infusion running at ${data.rateMlHr} mL/hr | Patient weight: ${data.weightKg} kg`,
        availableText: `Dexmedetomidine 400 mcg in 100 mL NS (${data.concMcgMl} mcg/mL)`,
        patientWeightKg: data.weightKg,
        prompt: `Calculate the current dose delivered in mcg/kg/hr.`,
        correctAnswer: data.doseMcgKgHr,
        answerUnit: "mcg/kg/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          `Step 1: Calculate hourly mcg delivered: ${data.rateMlHr} mL/hr × ${data.concMcgMl} mcg/mL = ${data.rateMlHr * data.concMcgMl} mcg/hr.`,
          `Step 2: Note that Precedex is dosed per hour (mcg/kg/hr), not per minute.`,
          `Step 3: Divide hourly mcg by weight (${data.weightKg} kg): ${data.rateMlHr * data.concMcgMl} ÷ ${data.weightKg} = ${data.doseMcgKgHr} mcg/kg/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Hourly Micrograms",
            formula: "Rate (mL/hr) × Concentration (mcg/mL)",
            calculation: `${data.rateMlHr} mL/hr × ${data.concMcgMl} mcg/mL = ${data.rateMlHr * data.concMcgMl} mcg/hr`,
            result: `${data.rateMlHr * data.concMcgMl} mcg/hr`,
          },
          {
            stepNumber: 2,
            title: "Calculate mcg/kg/hr",
            formula: "Hourly Micrograms ÷ Weight (kg)",
            calculation: `${data.rateMlHr * data.concMcgMl} mcg/hr ÷ ${data.weightKg} kg = ${data.doseMcgKgHr} mcg/kg/hr`,
            result: `${data.doseMcgKgHr} mcg/kg/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-vasopressin-reverse-mlhr-to-unitsmin",
    category: "critical-care",
    subtype: "vasoactive-drip",
    difficulty: "intermediate",
    title: "Reverse Vasopressin: Calculate units/min from Flow Rate",
    clinicalContext: "Adult ICU Septic Shock Audit",
    generate: (rng) => {
      const data = pick([
        { rateMlHr: 12, bagUnits: 20, bagMl: 100, concUnitsMl: 0.2, unitsMin: 0.04 },
        { rateMlHr: 9, bagUnits: 20, bagMl: 100, concUnitsMl: 0.2, unitsMin: 0.03 },
        { rateMlHr: 6, bagUnits: 20, bagMl: 100, concUnitsMl: 0.2, unitsMin: 0.02 },
        { rateMlHr: 15, bagUnits: 20, bagMl: 100, concUnitsMl: 0.2, unitsMin: 0.05 },
      ], rng);

      return {
        scenario: `A continuous vasopressin infusion (20 units in 100 mL NS, 0.2 units/mL) is infusing on an electronic IV pump at ${data.rateMlHr} mL/hr.`,
        orderText: `Vasopressin infusion running at ${data.rateMlHr} mL/hr`,
        availableText: `Vasopressin 20 units / 100 mL NS (${data.concUnitsMl} units/mL)`,
        prompt: `How many units/min of vasopressin is the patient receiving?`,
        correctAnswer: data.unitsMin,
        answerUnit: "units/min",
        answerPrecision: 2,
        roundingInstruction: "Round to nearest hundredth (e.g. 0.04).",
        hints: [
          `Step 1: Calculate hourly units: ${data.rateMlHr} mL/hr × ${data.concUnitsMl} units/mL = ${data.rateMlHr * data.concUnitsMl} units/hr.`,
          `Step 2: Convert to units/min: (${data.rateMlHr * data.concUnitsMl}) ÷ 60 min.`,
          `Calculate: ${data.rateMlHr * data.concUnitsMl} ÷ 60 = ${data.unitsMin} units/min.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Hourly Units",
            formula: "Rate (mL/hr) × Concentration (units/mL)",
            calculation: `${data.rateMlHr} mL/hr × ${data.concUnitsMl} units/mL = ${data.rateMlHr * data.concUnitsMl} units/hr`,
            result: `${data.rateMlHr * data.concUnitsMl} units/hr`,
          },
          {
            stepNumber: 2,
            title: "Convert to Units per Minute",
            formula: "Hourly Units ÷ 60",
            calculation: `${data.rateMlHr * data.concUnitsMl} units/hr ÷ 60 = ${data.unitsMin} units/min`,
            result: `${data.unitsMin} units/min`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-amiodarone-reverse-mlhr-to-mgmin",
    category: "critical-care",
    subtype: "antiarrhythmic-drip",
    difficulty: "beginner",
    title: "Reverse Amiodarone: Calculate mg/min from Flow Rate",
    clinicalContext: "Adult CCU Post-Resuscitation Antiarrhythmic Audit",
    generate: (rng) => {
      const data = pick([
        { rateMlHr: 33.3, concMgMl: 1.8, hourlyMg: 60, doseMgMin: 1.0 },
        { rateMlHr: 16.7, concMgMl: 1.8, hourlyMg: 30, doseMgMin: 0.5 },
        { rateMlHr: 50.0, concMgMl: 1.8, hourlyMg: 90, doseMgMin: 1.5 },
      ], rng);

      return {
        scenario: `An adult inpatient is receiving an IV amiodarone infusion (450 mg in 250 mL D5W, 1.8 mg/mL) running at ${data.rateMlHr} mL/hr.`,
        orderText: `Amiodarone infusion running at ${data.rateMlHr} mL/hr`,
        availableText: `Amiodarone 450 mg in 250 mL D5W (1.8 mg/mL)`,
        prompt: `Calculate the dose delivered in mg/min.`,
        correctAnswer: data.doseMgMin,
        answerUnit: "mg/min",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth (e.g. 1.0 or 0.5).",
        hints: [
          `Step 1: Calculate hourly mg: ${data.rateMlHr} mL/hr × 1.8 mg/mL = ${data.hourlyMg} mg/hr.`,
          `Step 2: Divide hourly mg by 60 min: ${data.hourlyMg} ÷ 60 = ${data.doseMgMin} mg/min.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Hourly Milligrams",
            formula: "Rate (mL/hr) × Concentration (mg/mL)",
            calculation: `${data.rateMlHr} mL/hr × 1.8 mg/mL ≈ ${data.hourlyMg} mg/hr`,
            result: `${data.hourlyMg} mg/hr`,
          },
          {
            stepNumber: 2,
            title: "Convert to Milligrams per Minute",
            formula: "Hourly Milligrams ÷ 60",
            calculation: `${data.hourlyMg} mg/hr ÷ 60 = ${data.doseMgMin} mg/min`,
            result: `${data.doseMgMin} mg/min`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-remifentanil-mcgkgmin-rate",
    category: "critical-care",
    subtype: "sedation-drip",
    difficulty: "critical-care",
    title: "Ultra-Short Acting Opioid (Remifentanil) Infusion Rate",
    clinicalContext: "Adult Neuro-ICU Target Neurological Examination Protocol",
    generate: (rng) => {
      const data = pick([
        { weightKg: 70, doseMcgKgMin: 0.1, bagMg: 2, bagMl: 100, concMcgMl: 20, minuteMcg: 7.0, hourlyMcg: 420, rateMlHr: 21.0 },
        { weightKg: 80, doseMcgKgMin: 0.15, bagMg: 2, bagMl: 100, concMcgMl: 20, minuteMcg: 12.0, hourlyMcg: 720, rateMlHr: 36.0 },
        { weightKg: 75, doseMcgKgMin: 0.05, bagMg: 2, bagMl: 100, concMcgMl: 20, minuteMcg: 3.75, hourlyMcg: 225, rateMlHr: 11.3 },
        { weightKg: 60, doseMcgKgMin: 0.1, bagMg: 2, bagMl: 100, concMcgMl: 20, minuteMcg: 6.0, hourlyMcg: 360, rateMlHr: 18.0 },
      ], rng);

      return {
        scenario: `An intubated Neuro-ICU patient weighing ${data.weightKg} kg requiring rapid neurological wake-up tests is ordered remifentanil at ${data.doseMcgKgMin} mcg/kg/min.`,
        orderText: `Remifentanil continuous IV infusion at ${data.doseMcgKgMin} mcg/kg/min (Patient weight: ${data.weightKg} kg)`,
        availableText: `Remifentanil 2 mg in 100 mL 0.9% NS (${data.concMcgMl} mcg/mL)`,
        patientWeightKg: data.weightKg,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          `Step 1: Calculate minute mcg: ${data.weightKg} kg × ${data.doseMcgKgMin} mcg/kg/min = ${data.minuteMcg} mcg/min.`,
          `Step 2: Convert to hourly mcg: ${data.minuteMcg} × 60 = ${data.hourlyMcg} mcg/hr.`,
          `Step 3: Concentration: 2,000 mcg ÷ 100 mL = 20 mcg/mL.`,
          `Step 4: Rate: ${data.hourlyMcg} ÷ 20 = ${data.rateMlHr} mL/hr.`,
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
            title: "Calculate Pump Rate",
            formula: "Hourly Micrograms ÷ Concentration (20 mcg/mL)",
            calculation: `${data.hourlyMcg} mcg/hr ÷ 20 mcg/mL = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-precedex-mcg-kg-hr-lb",
    category: "critical-care",
    subtype: "sedation-drip",
    difficulty: "advanced",
    title: "Dexmedetomidine (Precedex) Infusion Rate (Pounds to Kilograms)",
    clinicalContext: "Adult ICU Light Sedation / Non-Intubated Protocol",
    generate: (rng) => {
      const data = pick([
        { lb: 154, kg: 70, doseMcgKgHr: 0.4, bagMcg: 400, bagMl: 100, concMcgMl: 4, hourlyMcg: 28, rateMlHr: 7.0 },
        { lb: 176, kg: 80, doseMcgKgHr: 0.5, bagMcg: 400, bagMl: 100, concMcgMl: 4, hourlyMcg: 40, rateMlHr: 10.0 },
        { lb: 198, kg: 90, doseMcgKgHr: 0.6, bagMcg: 400, bagMl: 100, concMcgMl: 4, hourlyMcg: 54, rateMlHr: 13.5 },
        { lb: 132, kg: 60, doseMcgKgHr: 0.7, bagMcg: 400, bagMl: 100, concMcgMl: 4, hourlyMcg: 42, rateMlHr: 10.5 },
      ], rng);

      return {
        scenario: `An adult ICU patient weighing ${data.lb} lb is prescribed a dexmedetomidine infusion at ${data.doseMcgKgHr} mcg/kg/hr for light, interactive sedation.`,
        orderText: `Dexmedetomidine continuous IV infusion at ${data.doseMcgKgHr} mcg/kg/hr (Weight: ${data.lb} lb)`,
        availableText: `Dexmedetomidine ${data.bagMcg} mcg in ${data.bagMl} mL 0.9% NS (${data.concMcgMl} mcg/mL)`,
        patientWeightLb: data.lb,
        patientWeightKg: data.kg,
        prompt: `Calculate the IV pump rate in mL/hr.`,
        correctAnswer: data.rateMlHr,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth.",
        hints: [
          `Step 1: Convert pounds to kilograms: ${data.lb} lb ÷ 2.2 = ${data.kg} kg.`,
          `Step 2: Calculate hourly mcg (note Precedex is mcg/kg/hr): ${data.kg} kg × ${data.doseMcgKgHr} mcg/kg/hr = ${data.hourlyMcg} mcg/hr.`,
          `Step 3: Divide by bag concentration (${data.concMcgMl} mcg/mL): ${data.hourlyMcg} ÷ 4 = ${data.rateMlHr} mL/hr.`,
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
            title: "Calculate Hourly Micrograms",
            formula: "Weight (kg) × Dose (mcg/kg/hr)",
            calculation: `${data.kg} kg × ${data.doseMcgKgHr} mcg/kg/hr = ${data.hourlyMcg} mcg/hr`,
            result: `${data.hourlyMcg} mcg/hr`,
          },
          {
            stepNumber: 3,
            title: "Calculate Pump Flow Rate",
            formula: "Hourly Micrograms ÷ Concentration (4 mcg/mL)",
            calculation: `${data.hourlyMcg} mcg/hr ÷ 4 mcg/mL = ${data.rateMlHr} mL/hr`,
            result: `${data.rateMlHr} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-esmolol-reverse-mlhr-to-dose",
    category: "critical-care",
    subtype: "vasoactive-drip",
    difficulty: "critical-care",
    title: "Reverse Esmolol: Calculate mcg/kg/min from Pump Flow Rate",
    clinicalContext: "Adult CCU Tachyarrhythmia Infusion Audit",
    generate: (rng) => {
      const data = pick([
        { rateMlHr: 42.0, concMcgMl: 10000, weightKg: 70, minuteMcg: 7000, doseMcgKgMin: 100 },
        { rateMlHr: 21.0, concMcgMl: 10000, weightKg: 70, minuteMcg: 3500, doseMcgKgMin: 50 },
        { rateMlHr: 48.0, concMcgMl: 10000, weightKg: 80, minuteMcg: 8000, doseMcgKgMin: 100 },
        { rateMlHr: 24.0, concMcgMl: 10000, weightKg: 80, minuteMcg: 4000, doseMcgKgMin: 50 },
      ], rng);

      return {
        scenario: `An adult patient weighing ${data.weightKg} kg is receiving an esmolol infusion (2,500 mg in 250 mL NS, 10,000 mcg/mL) running at ${data.rateMlHr} mL/hr.`,
        orderText: `Esmolol drip running at ${data.rateMlHr} mL/hr | Patient weight: ${data.weightKg} kg`,
        availableText: `Esmolol 2.5 g / 250 mL (10,000 mcg/mL)`,
        patientWeightKg: data.weightKg,
        prompt: `Calculate the current dose delivered to the patient in mcg/kg/min.`,
        correctAnswer: data.doseMcgKgMin,
        answerUnit: "mcg/kg/min",
        answerPrecision: 0,
        roundingInstruction: "State whole number.",
        hints: [
          `Step 1: Calculate minute mcg: (${data.rateMlHr} mL/hr × 10,000 mcg/mL) ÷ 60 min = ${data.minuteMcg} mcg/min.`,
          `Step 2: Divide minute mcg by weight (${data.weightKg} kg): ${data.minuteMcg} ÷ ${data.weightKg} = ${data.doseMcgKgMin} mcg/kg/min.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Minute Micrograms Delivered",
            formula: "(Rate × Concentration) ÷ 60",
            calculation: `(${data.rateMlHr} mL/hr × 10,000 mcg/mL) ÷ 60 = ${data.minuteMcg} mcg/min`,
            result: `${data.minuteMcg} mcg/min`,
          },
          {
            stepNumber: 2,
            title: "Calculate mcg/kg/min",
            formula: "mcg/min ÷ Weight (kg)",
            calculation: `${data.minuteMcg} mcg/min ÷ ${data.weightKg} kg = ${data.doseMcgKgMin} mcg/kg/min`,
            result: `${data.doseMcgKgMin} mcg/kg/min`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-nitroprusside-reverse-rate",
    category: "critical-care",
    subtype: "vasoactive-drip",
    difficulty: "critical-care",
    title: "Reverse Nitroprusside: Calculate mcg/kg/min from Pump Rate",
    clinicalContext: "Adult ICU Hypertensive Emergency Safety Audit",
    generate: (rng) => {
      const data = pick([
        { rateMlHr: 24.0, concMcgMl: 200, weightKg: 80, minuteMcg: 80, doseMcgKgMin: 1.0 },
        { rateMlHr: 12.0, concMcgMl: 200, weightKg: 80, minuteMcg: 40, doseMcgKgMin: 0.5 },
        { rateMlHr: 21.0, concMcgMl: 200, weightKg: 70, minuteMcg: 70, doseMcgKgMin: 1.0 },
        { rateMlHr: 31.5, concMcgMl: 200, weightKg: 70, minuteMcg: 105, doseMcgKgMin: 1.5 },
      ], rng);

      return {
        scenario: `An adult ICU patient weighing ${data.weightKg} kg is receiving a nitroprusside infusion (50 mg in 250 mL D5W, 200 mcg/mL) running at ${data.rateMlHr} mL/hr.`,
        orderText: `Nitroprusside infusion running at ${data.rateMlHr} mL/hr | Patient weight: ${data.weightKg} kg`,
        availableText: `Nitroprusside 50 mg in 250 mL (${data.concMcgMl} mcg/mL)`,
        patientWeightKg: data.weightKg,
        prompt: `Calculate the current dose delivered to the patient in mcg/kg/min.`,
        correctAnswer: data.doseMcgKgMin,
        answerUnit: "mcg/kg/min",
        answerPrecision: 1,
        roundingInstruction: "Round to nearest tenth (e.g. 1.0 or 0.5).",
        hints: [
          `Step 1: Calculate minute mcg: (${data.rateMlHr} mL/hr × 200 mcg/mL) ÷ 60 min = ${data.minuteMcg} mcg/min.`,
          `Step 2: Divide minute mcg by weight (${data.weightKg} kg): ${data.minuteMcg} ÷ ${data.weightKg} = ${data.doseMcgKgMin} mcg/kg/min.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Minute Micrograms",
            formula: "(Rate × Concentration) ÷ 60",
            calculation: `(${data.rateMlHr} mL/hr × 200 mcg/mL) ÷ 60 = ${data.minuteMcg} mcg/min`,
            result: `${data.minuteMcg} mcg/min`,
          },
          {
            stepNumber: 2,
            title: "Calculate mcg/kg/min",
            formula: "mcg/min ÷ Weight (kg)",
            calculation: `${data.minuteMcg} mcg/min ÷ ${data.weightKg} kg = ${data.doseMcgKgMin} mcg/kg/min`,
            result: `${data.doseMcgKgMin} mcg/kg/min`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "cc-diltiazem-titration-step",
    category: "critical-care",
    subtype: "vasoactive-drip",
    difficulty: "beginner",
    title: "Diltiazem Rate Adjustment for Persistent Tachycardia",
    clinicalContext: "Adult Step-Down AFib Titration Protocol",
    generate: (rng) => {
      const data = pick([
        { currentMgHr: 5.0, increaseMgHr: 2.5, newMgHr: 7.5, concMgMl: 1.0, currentRate: 5.0, newRate: 7.5 },
        { currentMgHr: 7.5, increaseMgHr: 2.5, newMgHr: 10.0, concMgMl: 1.0, currentRate: 7.5, newRate: 10.0 },
        { currentMgHr: 10.0, increaseMgHr: 5.0, newMgHr: 15.0, concMgMl: 1.0, currentRate: 10.0, newRate: 15.0 },
      ], rng);

      return {
        scenario: `An adult inpatient on a continuous diltiazem drip (125 mg in 125 mL D5W, 1 mg/mL) currently infusing at ${data.currentRate} mL/hr has a persistent ventricular rate of 128 bpm. The provider enters an order to increase the infusion by ${data.increaseMgHr} mg/hr.`,
        orderText: `Increase Diltiazem infusion by ${data.increaseMgHr} mg/hr (Current dose: ${data.currentMgHr} mg/hr)`,
        availableText: `Diltiazem 125 mg in 125 mL (1 mg/mL)`,
        prompt: `Calculate the new IV pump flow rate in mL/hr.`,
        correctAnswer: data.newRate,
        answerUnit: "mL/hr",
        answerPrecision: 1,
        roundingInstruction: "State exact number or round to nearest tenth.",
        hints: [
          `Step 1: Calculate new ordered mg/hr: ${data.currentMgHr} + ${data.increaseMgHr} = ${data.newMgHr} mg/hr.`,
          `Step 2: Bag concentration is 1 mg/mL.`,
          `Calculate: ${data.newMgHr} mg/hr ÷ 1 mg/mL = ${data.newRate} mL/hr.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate New Hourly Dose",
            formula: "Current Dose + Increase",
            calculation: `${data.currentMgHr} mg/hr + ${data.increaseMgHr} mg/hr = ${data.newMgHr} mg/hr`,
            result: `${data.newMgHr} mg/hr`,
          },
          {
            stepNumber: 2,
            title: "Calculate New Pump Rate",
            formula: "New Dose (mg/hr) ÷ Concentration (1 mg/mL)",
            calculation: `${data.newMgHr} mg/hr ÷ 1 mg/mL = ${data.newRate} mL/hr`,
            result: `${data.newRate} mL/hr`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
];
