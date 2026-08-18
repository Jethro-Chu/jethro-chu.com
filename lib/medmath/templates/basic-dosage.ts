import type { QuestionTemplate } from "../types.ts";
import { pick } from "./helpers.ts";

export const basicDosageTemplates: QuestionTemplate[] = [
  {
    id: "dose-tabs-acetaminophen",
    category: "basic-dosage",
    subtype: "tablets",
    difficulty: "beginner",
    title: "Oral Tablet Dosage with Gram Conversion",
    clinicalContext: "Adult Med-Surg Post-Operative Pain Order",
    generate: (rng) => {
      const data = pick([
        { orderG: 1, orderMg: 1000, tabMg: 500, med: "Acetaminophen", ans: 2 },
        { orderG: 0.5, orderMg: 500, tabMg: 250, med: "Acetaminophen", ans: 2 },
        { orderG: 0.65, orderMg: 650, tabMg: 325, med: "Acetaminophen", ans: 2 },
        { orderG: 1.25, orderMg: 1250, tabMg: 500, med: "Acetaminophen", ans: 2.5 },
      ], rng);

      return {
        scenario: `An adult post-operative patient has a pain management order for ${data.med}.`,
        orderText: `${data.med} ${data.orderG} g PO every 6 hours PRN mild pain`,
        availableText: `${data.med} ${data.tabMg} mg scored tablets`,
        prompt: `How many tablets should the nurse administer for one dose?`,
        expectedAnswer: data.ans,
        expectedUnit: "tablets",
        roundingMode: "exact",
        roundingInstruction: "Express as an exact number or half tablet.",
        tolerance: 0.01,
        hints: [
          "First ensure the ordered dose and available dose are in the same unit (convert grams to milligrams).",
          "Use the formula: Desired (D) ÷ Have (H) × Quantity (Q).",
          `Calculate: (${data.orderMg} mg ÷ ${data.tabMg} mg) × 1 tablet.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Grams to Milligrams",
            formula: "Grams × 1,000 = Milligrams",
            calculation: `${data.orderG} g × 1,000 = ${data.orderMg} mg`,
            result: `${data.orderMg} mg`,
          },
          {
            stepNumber: 2,
            title: "Calculate Tablet Quantity",
            formula: "Desired ÷ Have × Quantity",
            calculation: `(${data.orderMg} mg ÷ ${data.tabMg} mg) × 1 tab = ${data.ans} tablets`,
            result: `${data.ans} tablets`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "dose-tabs-scored-half",
    category: "basic-dosage",
    subtype: "tablets",
    difficulty: "beginner",
    title: "Scored Tablet Oral Dosage",
    clinicalContext: "Adult Telemetry Cardiovascular Order",
    generate: (rng) => {
      const data = pick([
        { med: "Metoprolol tartrate", orderMg: 25, supplyMg: 50, ans: 0.5 },
        { med: "Metoprolol tartrate", orderMg: 12.5, supplyMg: 25, ans: 0.5 },
        { med: "Carvedilol", orderMg: 3.125, supplyMg: 6.25, ans: 0.5 },
        { med: "Lisinopril", orderMg: 5, supplyMg: 10, ans: 0.5 },
        { med: "Amlodipine", orderMg: 2.5, supplyMg: 5, ans: 0.5 },
      ], rng);

      return {
        scenario: `An adult telemetry patient is prescribed daily blood pressure management.`,
        orderText: `${data.med} ${data.orderMg} mg PO daily`,
        availableText: `${data.med} ${data.supplyMg} mg scored tablets`,
        prompt: `How many tablets should the nurse administer?`,
        expectedAnswer: data.ans,
        expectedUnit: "tablets",
        roundingMode: "exact",
        roundingInstruction: "State exact number (e.g., 0.5 for half tablet).",
        tolerance: 0.01,
        hints: [
          "Check that both the order and supply units match (both in mg).",
          "Apply Desired ÷ Have × 1 tablet.",
          `Calculate: ${data.orderMg} ÷ ${data.supplyMg}.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Dose",
            formula: "Desired ÷ Have × Quantity",
            calculation: `(${data.orderMg} mg ÷ ${data.supplyMg} mg) × 1 tablet = ${data.ans} tablet`,
            result: `${data.ans} tablet`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "dose-caps-antibiotic",
    category: "basic-dosage",
    subtype: "capsules",
    difficulty: "beginner",
    title: "Oral Capsule Dosage",
    clinicalContext: "Adult Inpatient Med-Surg Order",
    generate: (rng) => {
      const data = pick([
        { med: "Cephalexin", orderMg: 500, capMg: 250, ans: 2 },
        { med: "Cephalexin", orderMg: 750, capMg: 250, ans: 3 },
        { med: "Amoxicillin", orderMg: 500, capMg: 250, ans: 2 },
        { med: "Clindamycin", orderMg: 300, capMg: 150, ans: 2 },
        { med: "Gabapentin", orderMg: 600, capMg: 300, ans: 2 },
      ], rng);

      return {
        scenario: `The nurse is preparing oral antibiotic/medication therapy for an adult patient.`,
        orderText: `${data.med} ${data.orderMg} mg PO every 8 hours`,
        availableText: `${data.med} ${data.capMg} mg capsules`,
        prompt: `How many capsules should be administered?`,
        expectedAnswer: data.ans,
        expectedUnit: "capsules",
        roundingMode: "whole",
        roundingInstruction: "Capsules cannot be split; express as whole number.",
        tolerance: 0.01,
        hints: [
          "Capsules must be given whole.",
          "Use the formula: Desired ÷ Have × Quantity.",
          `Calculate: ${data.orderMg} ÷ ${data.capMg}.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Capsule Quantity",
            formula: "Desired ÷ Have × Quantity",
            calculation: `(${data.orderMg} mg ÷ ${data.capMg} mg) × 1 cap = ${data.ans} capsules`,
            result: `${data.ans} capsules`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "dose-liquid-amoxicillin",
    category: "basic-dosage",
    subtype: "oral-liquid",
    difficulty: "beginner",
    title: "Oral Liquid Suspension Dosage",
    clinicalContext: "Adult Inpatient Suspension Order",
    generate: (rng) => {
      const data = pick([
        { med: "Amoxicillin", orderMg: 375, concMg: 250, concMl: 5, ans: 7.5 },
        { med: "Amoxicillin", orderMg: 500, concMg: 250, concMl: 5, ans: 10 },
        { med: "Amoxicillin", orderMg: 250, concMg: 125, concMl: 5, ans: 10 },
        { med: "Augmentin", orderMg: 400, concMg: 200, concMl: 5, ans: 10 },
        { med: "Cefuroxime", orderMg: 250, concMg: 125, concMl: 5, ans: 10 },
      ], rng);

      return {
        scenario: `An adult patient with dysphagia has an order for an oral liquid suspension.`,
        orderText: `${data.med} ${data.orderMg} mg PO every 8 hours`,
        availableText: `${data.med} oral suspension ${data.concMg} mg per ${data.concMl} mL`,
        prompt: `How many mL should the nurse administer?`,
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "tenth",
        roundingInstruction: "Round to the nearest tenth if necessary.",
        tolerance: 0.05,
        hints: [
          "Identify Desired dose, Have dose, and Quantity volume.",
          "Use the formula: (Desired ÷ Have) × Quantity in mL.",
          `Calculate: (${data.orderMg} mg ÷ ${data.concMg} mg) × ${data.concMl} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Liquid Volume",
            formula: "(Desired ÷ Have) × Volume",
            calculation: `(${data.orderMg} mg ÷ ${data.concMg} mg) × ${data.concMl} mL = ${data.ans} mL`,
            result: `${data.ans} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "dose-liquid-lactulose",
    category: "basic-dosage",
    subtype: "oral-liquid",
    difficulty: "intermediate",
    title: "Oral Solution Dosage with Grams to Milligrams",
    clinicalContext: "Adult Med-Surg Hepatic Encephalopathy Protocol",
    generate: (rng) => {
      const data = pick([
        { med: "Lactulose", orderG: 20, supplyG: 10, supplyMl: 15, ans: 30 },
        { med: "Lactulose", orderG: 30, supplyG: 10, supplyMl: 15, ans: 45 },
        { med: "Lactulose", orderG: 15, supplyG: 10, supplyMl: 15, ans: 22.5 },
        { med: "Lactulose", orderG: 10, supplyG: 10, supplyMl: 15, ans: 15 },
      ], rng);

      return {
        scenario: `An adult patient on a medical floor has an order for oral lactulose solution.`,
        orderText: `${data.med} ${data.orderG} g PO TID`,
        availableText: `${data.med} syrup ${data.supplyG} g / ${data.supplyMl} mL`,
        prompt: `How many mL should the nurse administer per dose?`,
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "tenth",
        roundingInstruction: "Round to the nearest tenth.",
        tolerance: 0.05,
        hints: [
          "Check the units of the order and supply (both in grams).",
          "Apply the formula: (Desired ÷ Have) × Volume in mL.",
          `Calculate: (${data.orderG} g ÷ ${data.supplyG} g) × ${data.supplyMl} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Volume",
            formula: "(Desired ÷ Have) × Quantity",
            calculation: `(${data.orderG} g ÷ ${data.supplyG} g) × ${data.supplyMl} mL = ${data.ans} mL`,
            result: `${data.ans} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "dose-iv-push-furosemide",
    category: "basic-dosage",
    subtype: "iv-push",
    difficulty: "beginner",
    title: "IV Push Diuretic Dosage",
    clinicalContext: "Adult Step-Down Heart Failure Order",
    generate: (rng) => {
      const data = pick([
        { med: "Furosemide", orderMg: 40, vialMg: 10, vialMl: 1, ans: 4 },
        { med: "Furosemide", orderMg: 20, vialMg: 10, vialMl: 1, ans: 2 },
        { med: "Furosemide", orderMg: 60, vialMg: 10, vialMl: 1, ans: 6 },
        { med: "Furosemide", orderMg: 80, vialMg: 10, vialMl: 1, ans: 8 },
        { med: "Bumetanide", orderMg: 1, vialMg: 0.25, vialMl: 1, ans: 4 },
      ], rng);

      return {
        scenario: `An adult telemetry patient with acute heart failure exacerbation requires an IV push diuretic.`,
        orderText: `${data.med} ${data.orderMg} mg IV push stat`,
        availableText: `${data.med} injection ${data.vialMg} mg/mL`,
        prompt: `How many mL should the nurse draw up to administer the ordered dose?`,
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "tenth",
        roundingInstruction: "State exact or rounded to nearest tenth.",
        tolerance: 0.05,
        hints: [
          "Check the concentration: each 1 mL contains the stated mg.",
          "Use the formula: Desired ÷ Have × 1 mL.",
          `Calculate: ${data.orderMg} ÷ ${data.vialMg}.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate IV Push Volume",
            formula: "Desired ÷ Have × Volume",
            calculation: `(${data.orderMg} mg ÷ ${data.vialMg} mg) × ${data.vialMl} mL = ${data.ans} mL`,
            result: `${data.ans} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "dose-iv-push-morphine",
    category: "basic-dosage",
    subtype: "iv-push",
    difficulty: "intermediate",
    title: "IV Push Opioid Small Volume Calculation",
    clinicalContext: "Adult Post-Operative PACU Order",
    generate: (rng) => {
      const data = pick([
        { med: "Morphine sulfate", orderMg: 4, vialMg: 10, vialMl: 1, ans: 0.4 },
        { med: "Morphine sulfate", orderMg: 2, vialMg: 10, vialMl: 1, ans: 0.2 },
        { med: "Morphine sulfate", orderMg: 6, vialMg: 10, vialMl: 1, ans: 0.6 },
        { med: "Hydromorphone", orderMg: 0.5, vialMg: 2, vialMl: 1, ans: 0.25 },
        { med: "Hydromorphone", orderMg: 1, vialMg: 2, vialMl: 1, ans: 0.5 },
      ], rng);

      return {
        scenario: `An adult post-surgical patient reports acute severe pain.`,
        orderText: `${data.med} ${data.orderMg} mg IV push every 3 hours PRN severe pain`,
        availableText: `${data.med} ${data.vialMg} mg/mL vial`,
        prompt: `How many mL should the nurse draw into the syringe?`,
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "hundredth",
        roundingInstruction: "Round to the nearest hundredth if necessary for tuberculin/small syringe accuracy.",
        tolerance: 0.01,
        hints: [
          "Small volumes (< 1 mL) are measured using small calibrated syringes to the hundredth.",
          "Use the formula: Desired ÷ Have × 1 mL.",
          `Calculate: ${data.orderMg} ÷ ${data.vialMg}.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Syringe Volume",
            formula: "Desired ÷ Have × Volume",
            calculation: `(${data.orderMg} mg ÷ ${data.vialMg} mg) × ${data.vialMl} mL = ${data.ans} mL`,
            result: `${data.ans} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "dose-ampule-ondansetron",
    category: "basic-dosage",
    subtype: "ampule-iv",
    difficulty: "beginner",
    title: "IV Antiemetic Ampule Calculation",
    clinicalContext: "Adult Inpatient Surgical Floor Order",
    generate: (rng) => {
      const data = pick([
        { med: "Ondansetron", orderMg: 4, ampMg: 4, ampMl: 2, ans: 2 },
        { med: "Ondansetron", orderMg: 8, ampMg: 4, ampMl: 2, ans: 4 },
        { med: "Metoclopramide", orderMg: 10, ampMg: 10, ampMl: 2, ans: 2 },
        { med: "Metoclopramide", orderMg: 5, ampMg: 10, ampMl: 2, ans: 1 },
      ], rng);

      return {
        scenario: `An adult patient on the medical floor experiences postoperative nausea.`,
        orderText: `${data.med} ${data.orderMg} mg IV push over 2 minutes PRN nausea`,
        availableText: `${data.med} ${data.ampMg} mg / ${data.ampMl} mL ampule`,
        prompt: `How many mL should the nurse prepare?`,
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "tenth",
        roundingInstruction: "State exact whole number or round to tenth.",
        tolerance: 0.05,
        hints: [
          "Determine the concentration from the ampule label.",
          "Apply Desired ÷ Have × Volume.",
          `Calculate: (${data.orderMg} ÷ ${data.ampMg}) × ${data.ampMl} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Volume",
            formula: "(Desired ÷ Have) × Volume",
            calculation: `(${data.orderMg} mg ÷ ${data.ampMg} mg) × ${data.ampMl} mL = ${data.ans} mL`,
            result: `${data.ans} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "dose-multidose-haloperidol",
    category: "basic-dosage",
    subtype: "multidose-vial",
    difficulty: "intermediate",
    title: "Multidose Vial Intramuscular Calculation",
    clinicalContext: "Adult Inpatient Agitation Protocol",
    generate: (rng) => {
      const data = pick([
        { med: "Haloperidol", orderMg: 5, totalMg: 50, totalMl: 10, concMgPerMl: 5, ans: 1 },
        { med: "Haloperidol", orderMg: 2.5, totalMg: 50, totalMl: 10, concMgPerMl: 5, ans: 0.5 },
        { med: "Lorazepam", orderMg: 2, totalMg: 20, totalMl: 10, concMgPerMl: 2, ans: 1 },
        { med: "Lorazepam", orderMg: 1, totalMg: 20, totalMl: 10, concMgPerMl: 2, ans: 0.5 },
      ], rng);

      return {
        scenario: `An adult patient has an acute intramuscular order. The pharmacy supplies a multidose vial.`,
        orderText: `${data.med} ${data.orderMg} mg IM stat`,
        availableText: `${data.med} multidose vial containing ${data.totalMg} mg in ${data.totalMl} mL`,
        prompt: `How many mL should the nurse withdraw from the multidose vial?`,
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "tenth",
        roundingInstruction: "Round to the nearest tenth.",
        tolerance: 0.05,
        hints: [
          `First determine the concentration: ${data.totalMg} mg ÷ ${data.totalMl} mL = ${data.concMgPerMl} mg/mL.`,
          "Apply Desired ÷ Have × Volume.",
          `Calculate: ${data.orderMg} mg ÷ ${data.concMgPerMl} mg/mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Determine Concentration",
            formula: "Total mg ÷ Total mL",
            calculation: `${data.totalMg} mg ÷ ${data.totalMl} mL = ${data.concMgPerMl} mg/mL`,
            result: `${data.concMgPerMl} mg/mL`,
          },
          {
            stepNumber: 2,
            title: "Calculate Administration Volume",
            formula: "Desired ÷ Have Concentration",
            calculation: `${data.orderMg} mg ÷ ${data.concMgPerMl} mg/mL = ${data.ans} mL`,
            result: `${data.ans} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "dose-iv-push-digoxin",
    category: "basic-dosage",
    subtype: "iv-push",
    difficulty: "advanced",
    title: "IV Cardiac Glycoside Microgram to Milligram Calculation",
    clinicalContext: "Adult Telemetry Atrial Fibrillation Order",
    generate: (rng) => {
      const data = pick([
        { med: "Digoxin", orderMcg: 125, orderMg: 0.125, concMg: 0.25, concMl: 1, ans: 0.5 },
        { med: "Digoxin", orderMcg: 250, orderMg: 0.25, concMg: 0.25, concMl: 1, ans: 1 },
        { med: "Digoxin", orderMcg: 62.5, orderMg: 0.0625, concMg: 0.25, concMl: 1, ans: 0.25 },
      ], rng);

      return {
        scenario: `An adult telemetry patient with rapid atrial fibrillation requires IV digoxin.`,
        orderText: `${data.med} ${data.orderMcg} mcg IV push daily`,
        availableText: `${data.med} injection ${data.concMg} mg/mL`,
        prompt: `How many mL should the nurse administer?`,
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "hundredth",
        roundingInstruction: "Round to the nearest hundredth if necessary.",
        tolerance: 0.01,
        hints: [
          "Convert the ordered dose from micrograms (mcg) to milligrams (mg): divide by 1,000.",
          `Converted dose: ${data.orderMcg} mcg ÷ 1,000 = ${data.orderMg} mg.`,
          `Calculate: (${data.orderMg} mg ÷ ${data.concMg} mg) × ${data.concMl} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Micrograms to Milligrams",
            formula: "Micrograms ÷ 1,000",
            calculation: `${data.orderMcg} mcg ÷ 1,000 = ${data.orderMg} mg`,
            result: `${data.orderMg} mg`,
          },
          {
            stepNumber: 2,
            title: "Calculate Syringe Volume",
            formula: "Desired ÷ Have × Quantity",
            calculation: `(${data.orderMg} mg ÷ ${data.concMg} mg) × ${data.concMl} mL = ${data.ans} mL`,
            result: `${data.ans} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "dose-tabs-prednisone-taper",
    category: "basic-dosage",
    subtype: "tablets",
    difficulty: "beginner",
    title: "Steroid Taper Oral Tablet Calculation",
    clinicalContext: "Adult Med-Surg Respiratory Discharge Order",
    generate: (rng) => {
      const data = pick([
        { med: "Prednisone", orderMg: 40, tabMg: 20, ans: 2 },
        { med: "Prednisone", orderMg: 30, tabMg: 10, ans: 3 },
        { med: "Prednisone", orderMg: 15, tabMg: 5, ans: 3 },
        { med: "Methylprednisolone", orderMg: 16, tabMg: 4, ans: 4 },
      ], rng);

      return {
        scenario: `An adult patient recovering from COPD exacerbation has a daily steroid order.`,
        orderText: `${data.med} ${data.orderMg} mg PO daily with breakfast`,
        availableText: `${data.med} ${data.tabMg} mg tablets`,
        prompt: `How many tablets should the nurse instruct the patient to take?`,
        expectedAnswer: data.ans,
        expectedUnit: "tablets",
        roundingMode: "whole",
        roundingInstruction: "State exact whole number of tablets.",
        tolerance: 0.01,
        hints: [
          "Units are already matched in milligrams.",
          "Use the formula: Desired ÷ Have × Quantity.",
          `Calculate: ${data.orderMg} ÷ ${data.tabMg}.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Number of Tablets",
            formula: "Desired ÷ Have × 1 tablet",
            calculation: `(${data.orderMg} mg ÷ ${data.tabMg} mg) × 1 = ${data.ans} tablets`,
            result: `${data.ans} tablets`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "dose-liquid-potassium-oral",
    category: "basic-dosage",
    subtype: "oral-liquid",
    difficulty: "beginner",
    title: "Oral Electrolyte Solution Calculation",
    clinicalContext: "Adult Med-Surg Hypokalemia Order",
    generate: (rng) => {
      const data = pick([
        { med: "Potassium chloride (KCl) liquid", orderMeq: 40, concMeq: 20, concMl: 15, ans: 30 },
        { med: "Potassium chloride (KCl) liquid", orderMeq: 20, concMeq: 20, concMl: 15, ans: 15 },
        { med: "Potassium chloride (KCl) liquid", orderMeq: 30, concMeq: 20, concMl: 15, ans: 22.5 },
        { med: "Potassium chloride (KCl) liquid", orderMeq: 10, concMeq: 20, concMl: 15, ans: 7.5 },
      ], rng);

      return {
        scenario: `An adult medical floor patient with low serum potassium is ordered oral replacement liquid.`,
        orderText: `${data.med} ${data.orderMeq} mEq PO daily with meals`,
        availableText: `${data.med} ${data.concMeq} mEq / ${data.concMl} mL`,
        prompt: `How many mL should the nurse measure for administration?`,
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "tenth",
        roundingInstruction: "Round to the nearest tenth if necessary.",
        tolerance: 0.05,
        hints: [
          "Check that order and supply units match (both in mEq).",
          "Apply Desired ÷ Have × Volume.",
          `Calculate: (${data.orderMeq} mEq ÷ ${data.concMeq} mEq) × ${data.concMl} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Volume",
            formula: "(Desired ÷ Have) × Volume",
            calculation: `(${data.orderMeq} mEq ÷ ${data.concMeq} mEq) × ${data.concMl} mL = ${data.ans} mL`,
            result: `${data.ans} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
];
