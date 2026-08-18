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
  {
    id: "dose-tabs-multidose-schedule",
    category: "basic-dosage",
    subtype: "tablets",
    difficulty: "intermediate",
    title: "Daily Total Tablet Consumption Calculation",
    clinicalContext: "Adult Med-Surg Cardiology Order",
    generate: (rng) => {
      const data = pick([
        { med: "Metoprolol Tartrate", orderMg: 50, tabMg: 25, dosesPerDay: 2, schedule: "BID", tabsPerDose: 2, dailyTabs: 4 },
        { med: "Gabapentin", orderMg: 300, tabMg: 100, dosesPerDay: 3, schedule: "TID", tabsPerDose: 3, dailyTabs: 9 },
        { med: "Levetiracetam", orderMg: 500, tabMg: 250, dosesPerDay: 2, schedule: "BID", tabsPerDose: 2, dailyTabs: 4 },
        { med: "Carvedilol", orderMg: 12.5, tabMg: 6.25, dosesPerDay: 2, schedule: "BID", tabsPerDose: 2, dailyTabs: 4 },
      ], rng);

      return {
        scenario: `An adult inpatient is ordered ${data.med} ${data.orderMg} mg PO ${data.schedule}. The supply is ${data.tabMg} mg tablets.`,
        orderText: `${data.med} ${data.orderMg} mg PO ${data.schedule}`,
        availableText: `${data.med} ${data.tabMg} mg tablets`,
        prompt: `How many total tablets will the patient receive in a 24-hour period?`,
        expectedAnswer: data.dailyTabs,
        expectedUnit: "tablets",
        roundingMode: "whole",
        roundingInstruction: "State exact whole number of tablets.",
        tolerance: 0.01,
        hints: [
          `First calculate the number of tablets per dose: ${data.orderMg} mg ÷ ${data.tabMg} mg = ${data.tabsPerDose} tablets.`,
          `Then multiply tablets per dose by the number of doses per day (${data.dosesPerDay} doses for ${data.schedule}).`,
          `Calculate: ${data.tabsPerDose} tablets × ${data.dosesPerDay} doses = ${data.dailyTabs} tablets.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Tablets Per Dose",
            formula: "Desired Dose ÷ Available Strength",
            calculation: `${data.orderMg} mg ÷ ${data.tabMg} mg = ${data.tabsPerDose} tablets`,
            result: `${data.tabsPerDose} tablets/dose`,
          },
          {
            stepNumber: 2,
            title: "Calculate Total Daily Tablets",
            formula: "Tablets/Dose × Doses/Day",
            calculation: `${data.tabsPerDose} tablets × ${data.dosesPerDay} doses = ${data.dailyTabs} tablets`,
            result: `${data.dailyTabs} tablets/day`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "dose-caps-high-potency",
    category: "basic-dosage",
    subtype: "capsules",
    difficulty: "beginner",
    title: "Oral Capsule Administration Calculation",
    clinicalContext: "Adult Inpatient Infectious Disease Order",
    generate: (rng) => {
      const data = pick([
        { med: "Clindamycin", orderMg: 300, capMg: 150, ans: 2 },
        { med: "Cephalexin", orderMg: 500, capMg: 250, ans: 2 },
        { med: "Doxycycline", orderMg: 200, capMg: 100, ans: 2 },
        { med: "Gabapentin", orderMg: 600, capMg: 300, ans: 2 },
      ], rng);

      return {
        scenario: `An adult inpatient with a skin and soft tissue infection has an oral capsule prescription.`,
        orderText: `${data.med} ${data.orderMg} mg PO every 6 hours`,
        availableText: `${data.med} ${data.capMg} mg capsules`,
        prompt: `How many capsules should the nurse administer for each dose?`,
        expectedAnswer: data.ans,
        expectedUnit: "capsules",
        roundingMode: "whole",
        roundingInstruction: "State exact whole number.",
        tolerance: 0.01,
        hints: [
          "Units are already matched in milligrams.",
          "Apply Desired ÷ Have × 1 capsule.",
          `Calculate: ${data.orderMg} ÷ ${data.capMg}.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Capsule Quantity",
            formula: "Desired ÷ Have × 1 capsule",
            calculation: `(${data.orderMg} mg ÷ ${data.capMg} mg) × 1 = ${data.ans} capsules`,
            result: `${data.ans} capsules`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "dose-liquid-multidose-syrup",
    category: "basic-dosage",
    subtype: "oral-liquid",
    difficulty: "intermediate",
    title: "Oral Liquid Suspension with Gram to Milligram Conversion",
    clinicalContext: "Adult Medical Floor Oral Suspension Order",
    generate: (rng) => {
      const data = pick([
        { med: "Amoxicillin suspension", orderG: 0.5, orderMg: 500, concMg: 250, concMl: 5, ans: 10 },
        { med: "Cephalexin suspension", orderG: 0.75, orderMg: 750, concMg: 250, concMl: 5, ans: 15 },
        { med: "Cefuroxime suspension", orderG: 0.5, orderMg: 500, concMg: 125, concMl: 5, ans: 20 },
        { med: "Erythromycin suspension", orderG: 0.4, orderMg: 400, concMg: 200, concMl: 5, ans: 10 },
      ], rng);

      return {
        scenario: `An adult medical inpatient who cannot swallow tablets is ordered an oral antibiotic suspension.`,
        orderText: `${data.med} ${data.orderG} g PO every 8 hours`,
        availableText: `${data.med} ${data.concMg} mg per ${data.concMl} mL`,
        prompt: `How many mL should the nurse prepare for administration?`,
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "tenth",
        roundingInstruction: "State exact whole number or decimal.",
        tolerance: 0.05,
        hints: [
          `First convert the ordered dose from grams to milligrams: ${data.orderG} g × 1,000 = ${data.orderMg} mg.`,
          `Use the formula: (Desired mg ÷ Have mg) × Quantity mL.`,
          `Calculate: (${data.orderMg} ÷ ${data.concMg}) × ${data.concMl} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Grams to Milligrams",
            formula: "Grams × 1,000",
            calculation: `${data.orderG} g × 1,000 = ${data.orderMg} mg`,
            result: `${data.orderMg} mg`,
          },
          {
            stepNumber: 2,
            title: "Calculate Volume to Administer",
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
    id: "dose-inj-anticoag-syringe",
    category: "basic-dosage",
    subtype: "injectable",
    difficulty: "beginner",
    title: "Low Molecular Weight Heparin Syringe Volume",
    clinicalContext: "Adult Surgical VTE Prophylaxis Order",
    generate: (rng) => {
      const data = pick([
        { med: "Enoxaparin (Lovenox)", orderMg: 40, concMg: 40, concMl: 0.4, ans: 0.4 },
        { med: "Enoxaparin (Lovenox)", orderMg: 60, concMg: 60, concMl: 0.6, ans: 0.6 },
        { med: "Enoxaparin (Lovenox)", orderMg: 80, concMg: 100, concMl: 1.0, ans: 0.8 },
        { med: "Enoxaparin (Lovenox)", orderMg: 30, concMg: 100, concMl: 1.0, ans: 0.3 },
      ], rng);

      return {
        scenario: `A post-operative adult patient is ordered subcutaneous low molecular weight heparin for deep vein thrombosis prophylaxis.`,
        orderText: `${data.med} ${data.orderMg} mg SubQ every 12 hours`,
        availableText: `${data.med} prefilled syringe ${data.concMg} mg / ${data.concMl} mL`,
        prompt: `Calculate the volume in mL to administer for one dose.`,
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.05,
        hints: [
          "Units are already matched in milligrams.",
          "Apply Desired ÷ Have × Available Volume.",
          `Calculate: (${data.orderMg} mg ÷ ${data.concMg} mg) × ${data.concMl} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Syringe Volume",
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
    id: "dose-inj-opioid-vial",
    category: "basic-dosage",
    subtype: "injectable",
    difficulty: "beginner",
    title: "IV Push Opioid Analgesic Volume",
    clinicalContext: "Adult PACU Acute Post-Op Pain Order",
    generate: (rng) => {
      const data = pick([
        { med: "Morphine sulfate", orderMg: 4, concMg: 10, concMl: 1, ans: 0.4 },
        { med: "Morphine sulfate", orderMg: 2, concMg: 4, concMl: 1, ans: 0.5 },
        { med: "Hydromorphone (Dilaudid)", orderMg: 0.5, concMg: 2, concMl: 1, ans: 0.25 },
        { med: "Hydromorphone (Dilaudid)", orderMg: 1, concMg: 2, concMl: 1, ans: 0.5 },
      ], rng);

      return {
        scenario: `An adult patient in the post-anesthesia care unit requires IV push analgesia for acute breakthrough pain.`,
        orderText: `${data.med} ${data.orderMg} mg IV push every 3 hours PRN severe pain`,
        availableText: `${data.med} vial ${data.concMg} mg / ${data.concMl} mL`,
        prompt: `How many mL should the nurse draw into the syringe?`,
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "hundredth",
        roundingInstruction: "State exact decimal value or round to nearest hundredth.",
        tolerance: 0.01,
        hints: [
          "Units are in milligrams.",
          "Apply Desired ÷ Have × Quantity.",
          `Calculate: (${data.orderMg} mg ÷ ${data.concMg} mg) × ${data.concMl} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Injection Volume",
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
    id: "dose-inj-antiemetic-vial",
    category: "basic-dosage",
    subtype: "injectable",
    difficulty: "beginner",
    title: "IV Antiemetic Administration Volume",
    clinicalContext: "Adult Inpatient Oncology / Surgical Order",
    generate: (rng) => {
      const data = pick([
        { med: "Ondansetron (Zofran)", orderMg: 4, concMg: 4, concMl: 2, ans: 2 },
        { med: "Ondansetron (Zofran)", orderMg: 8, concMg: 4, concMl: 2, ans: 4 },
        { med: "Metoclopramide (Reglan)", orderMg: 10, concMg: 10, concMl: 2, ans: 2 },
        { med: "Prochlorperazine", orderMg: 5, concMg: 10, concMl: 2, ans: 1 },
      ], rng);

      return {
        scenario: `An adult surgical inpatient experiencing acute nausea is ordered an IV antiemetic.`,
        orderText: `${data.med} ${data.orderMg} mg IV push every 6 hours PRN nausea`,
        availableText: `${data.med} vial ${data.concMg} mg in ${data.concMl} mL`,
        prompt: `How many mL should the nurse administer?`,
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "tenth",
        roundingInstruction: "State exact whole number or decimal.",
        tolerance: 0.05,
        hints: [
          "Check that dose and supply units match.",
          "Apply Desired ÷ Have × Available Volume.",
          `Calculate: (${data.orderMg} ÷ ${data.concMg}) × ${data.concMl}.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Syringe Volume",
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
    id: "dose-reverse-tablet-potency",
    category: "basic-dosage",
    subtype: "tablets",
    difficulty: "intermediate",
    title: "Reverse Tablet Calculation: Total Dose Received",
    clinicalContext: "Adult Cardiology Medication Administration Audit",
    generate: (rng) => {
      const data = pick([
        { med: "Digoxin", tabs: 1.5, strengthMcg: 125, totalMcg: 187.5 },
        { med: "Metoprolol Succinate", tabs: 2, strengthMg: 25, totalMg: 50 },
        { med: "Warfarin", tabs: 1.5, strengthMg: 5, totalMg: 7.5 },
        { med: "Carvedilol", tabs: 2, strengthMg: 6.25, totalMg: 12.5 },
      ], rng);

      const isMcg = "strengthMcg" in data;
      const strength = isMcg ? (data as any).strengthMcg : (data as any).strengthMg;
      const unit = isMcg ? "mcg" : "mg";
      const total = isMcg ? (data as any).totalMcg : (data as any).totalMg;

      return {
        scenario: `A nursing chart audit indicates a patient took ${data.tabs} tablets of ${data.med}. Each tablet contains ${strength} ${unit}.`,
        orderText: `${data.tabs} tablets administered`,
        availableText: `${data.med} ${strength} ${unit} tablets`,
        prompt: `Calculate the total ${unit} dose the patient received.`,
        expectedAnswer: total,
        expectedUnit: unit,
        roundingMode: "tenth",
        roundingInstruction: "State exact number or round to nearest tenth.",
        tolerance: 0.05,
        hints: [
          `To find total dose from tablets, multiply number of tablets by the strength per tablet.`,
          `Calculate: ${data.tabs} tablets × ${strength} ${unit}/tablet.`,
          `${data.tabs} × ${strength} = ${total} ${unit}.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Total Dose Delivered",
            formula: "Number of Tablets × Strength per Tablet",
            calculation: `${data.tabs} tabs × ${strength} ${unit} = ${total} ${unit}`,
            result: `${total} ${unit}`,
          },
        ],
        rawVariables: { med: data.med, tabs: data.tabs, strength, unit, total },
      };
    },
  },
  {
    id: "dose-reverse-liquid-volume",
    category: "basic-dosage",
    subtype: "oral-liquid",
    difficulty: "intermediate",
    title: "Reverse Liquid Calculation: Total Dose Administered",
    clinicalContext: "Adult Inpatient Intake Charting Verification",
    generate: (rng) => {
      const data = pick([
        { med: "Acetaminophen oral liquid", volMl: 15, concMg: 160, concMl: 5, totalMg: 480 },
        { med: "Diphenhydramine elixir", volMl: 10, concMg: 12.5, concMl: 5, totalMg: 25 },
        { med: "Potassium chloride liquid", volMl: 30, concMeq: 20, concMl: 15, totalMeq: 40 },
        { med: "Lactulose syrup", volMl: 30, concG: 10, concMl: 15, totalG: 20 },
      ], rng);

      const isMeq = "concMeq" in data;
      const isG = "concG" in data;
      const unit = isMeq ? "mEq" : isG ? "g" : "mg";
      const concAmt = isMeq ? (data as any).concMeq : isG ? (data as any).concG : (data as any).concMg;
      const total = isMeq ? (data as any).totalMeq : isG ? (data as any).totalG : (data as any).totalMg;

      return {
        scenario: `A patient took ${data.volMl} mL of ${data.med}. The container is labeled ${concAmt} ${unit} per ${data.concMl} mL.`,
        orderText: `${data.volMl} mL administered PO`,
        availableText: `${data.med} ${concAmt} ${unit} / ${data.concMl} mL`,
        prompt: `How many ${unit} did the patient receive?`,
        expectedAnswer: total,
        expectedUnit: unit,
        roundingMode: "tenth",
        roundingInstruction: "State exact number.",
        tolerance: 0.1,
        hints: [
          `First find concentration per mL: ${concAmt} ${unit} ÷ ${data.concMl} mL = ${concAmt / data.concMl} ${unit}/mL.`,
          `Multiply volume taken by concentration per mL: ${data.volMl} mL × ${concAmt / data.concMl} ${unit}/mL.`,
          `Calculate: (${data.volMl} ÷ ${data.concMl}) × ${concAmt} = ${total} ${unit}.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Total Dose",
            formula: "(Administered Volume ÷ Supply Volume) × Supply Dose",
            calculation: `(${data.volMl} mL ÷ ${data.concMl} mL) × ${concAmt} ${unit} = ${total} ${unit}`,
            result: `${total} ${unit}`,
          },
        ],
        rawVariables: { med: data.med, volMl: data.volMl, concAmt, concMl: data.concMl, unit, total },
      };
    },
  },
  {
    id: "dose-inj-furosemide-ivp",
    category: "basic-dosage",
    subtype: "injectable",
    difficulty: "beginner",
    title: "Furosemide IV Push Injection Volume",
    clinicalContext: "Adult Med-Surg Acute Fluid Overload",
    generate: (rng) => {
      const data = pick([
        { orderMg: 20, concMg: 40, concMl: 4, ans: 2 },
        { orderMg: 40, concMg: 40, concMl: 4, ans: 4 },
        { orderMg: 60, concMg: 100, concMl: 10, ans: 6 },
        { orderMg: 80, concMg: 100, concMl: 10, ans: 8 },
      ], rng);

      return {
        scenario: `An adult heart failure patient with bilateral lower extremity edema is prescribed IV furosemide.`,
        orderText: `Furosemide ${data.orderMg} mg IV push stat over 2 minutes`,
        availableText: `Furosemide vial ${data.concMg} mg in ${data.concMl} mL (10 mg/mL)`,
        prompt: `How many mL should the nurse draw into the syringe?`,
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "tenth",
        roundingInstruction: "State exact number.",
        tolerance: 0.05,
        hints: [
          "Units are already matched in milligrams.",
          "Apply Desired ÷ Have × Available Volume.",
          `Calculate: (${data.orderMg} mg ÷ ${data.concMg} mg) × ${data.concMl} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Syringe Volume",
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
    id: "dose-inj-diphenhydramine-vial",
    category: "basic-dosage",
    subtype: "injectable",
    difficulty: "beginner",
    title: "Diphenhydramine IV Push Volume",
    clinicalContext: "Adult Inpatient Allergic Reaction Order",
    generate: (rng) => {
      const data = pick([
        { orderMg: 25, concMg: 50, concMl: 1, ans: 0.5 },
        { orderMg: 50, concMg: 50, concMl: 1, ans: 1.0 },
        { orderMg: 12.5, concMg: 50, concMl: 1, ans: 0.25 },
        { orderMg: 25, concMg: 25, concMl: 1, ans: 1.0 },
      ], rng);

      return {
        scenario: `An adult patient developing mild pruritus and urticaria following a blood transfusion is prescribed IV diphenhydramine.`,
        orderText: `Diphenhydramine ${data.orderMg} mg IV push stat`,
        availableText: `Diphenhydramine vial ${data.concMg} mg / ${data.concMl} mL`,
        prompt: `How many mL should the nurse administer?`,
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "hundredth",
        roundingInstruction: "State exact decimal value.",
        tolerance: 0.01,
        hints: [
          "Check that dose and supply units match.",
          "Apply Desired ÷ Have × Volume.",
          `Calculate: (${data.orderMg} mg ÷ ${data.concMg} mg) × ${data.concMl} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Syringe Volume",
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
    id: "dose-oral-lactulose-solution",
    category: "basic-dosage",
    subtype: "oral-liquid",
    difficulty: "beginner",
    title: "Lactulose Oral Solution Volume Calculation",
    clinicalContext: "Adult Inpatient Hepatic Encephalopathy Protocol",
    generate: (rng) => {
      const data = pick([
        { orderG: 20, concG: 10, concMl: 15, ans: 30 },
        { orderG: 30, concG: 10, concMl: 15, ans: 45 },
        { orderG: 15, concG: 10, concMl: 15, ans: 22.5 },
        { orderG: 10, concG: 10, concMl: 15, ans: 15 },
      ], rng);

      return {
        scenario: `An adult inpatient with chronic cirrhosis and elevated ammonia is prescribed oral lactulose.`,
        orderText: `Lactulose ${data.orderG} g PO TID`,
        availableText: `Lactulose oral solution ${data.concG} g per ${data.concMl} mL`,
        prompt: `How many mL should the nurse measure for one dose?`,
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "tenth",
        roundingInstruction: "State exact number or round to nearest tenth.",
        tolerance: 0.05,
        hints: [
          "Units are in grams for both order and supply.",
          "Apply Desired ÷ Have × Volume.",
          `Calculate: (${data.orderG} g ÷ ${data.concG} g) × ${data.concMl} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Dose Volume",
            formula: "(Desired ÷ Have) × Volume",
            calculation: `(${data.orderG} g ÷ ${data.concG} g) × ${data.concMl} mL = ${data.ans} mL`,
            result: `${data.ans} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "dose-tabs-warfarin-anticoag",
    category: "basic-dosage",
    subtype: "tablets",
    difficulty: "beginner",
    title: "Warfarin Oral Anticoagulant Dose Calculation",
    clinicalContext: "Adult Inpatient INR-Guided Anticoagulation",
    generate: (rng) => {
      const data = pick([
        { orderMg: 7.5, tabMg: 2.5, ans: 3 },
        { orderMg: 5, tabMg: 2.5, ans: 2 },
        { orderMg: 10, tabMg: 5, ans: 2 },
        { orderMg: 3.75, tabMg: 2.5, ans: 1.5 },
      ], rng);

      return {
        scenario: `An adult patient with atrial fibrillation has an INR of 2.2 and is prescribed evening warfarin.`,
        orderText: `Warfarin ${data.orderMg} mg PO daily at 1800`,
        availableText: `Warfarin ${data.tabMg} mg scored tablets`,
        prompt: `How many tablets should the nurse administer?`,
        expectedAnswer: data.ans,
        expectedUnit: "tablets",
        roundingMode: "exact",
        roundingInstruction: "State exact number or half tablet.",
        tolerance: 0.01,
        hints: [
          "Units are already matched in milligrams.",
          "Apply Desired ÷ Have × 1 tablet.",
          `Calculate: ${data.orderMg} ÷ ${data.tabMg}.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Number of Tablets",
            formula: "Desired ÷ Have × 1 tab",
            calculation: `(${data.orderMg} mg ÷ ${data.tabMg} mg) × 1 = ${data.ans} tablets`,
            result: `${data.ans} tablets`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "dose-inj-haloperidol-vial",
    category: "basic-dosage",
    subtype: "injectable",
    difficulty: "beginner",
    title: "Haloperidol Injection Volume Calculation",
    clinicalContext: "Adult Inpatient Acute Agitation Protocol",
    generate: (rng) => {
      const data = pick([
        { orderMg: 2.5, concMg: 5, concMl: 1, ans: 0.5 },
        { orderMg: 5, concMg: 5, concMl: 1, ans: 1.0 },
        { orderMg: 1, concMg: 5, concMl: 1, ans: 0.2 },
        { orderMg: 2, concMg: 5, concMl: 1, ans: 0.4 },
      ], rng);

      return {
        scenario: `An adult inpatient experiencing acute delirium with agitation is prescribed intramuscular haloperidol.`,
        orderText: `Haloperidol ${data.orderMg} mg IM stat PRN severe agitation`,
        availableText: `Haloperidol vial ${data.concMg} mg / ${data.concMl} mL`,
        prompt: `How many mL should the nurse draw into the syringe?`,
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.01,
        hints: [
          "Units are in milligrams.",
          "Apply Desired ÷ Have × Volume.",
          `Calculate: (${data.orderMg} mg ÷ ${data.concMg} mg) × ${data.concMl} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Injection Volume",
            formula: "(Desired ÷ Have) × Volume",
            calculation: `(${data.orderMg} mg ÷ ${data.concMg} mg) × ${data.concMl} mL = ${data.ans} mL`,
            result: `${data.ans} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
];
