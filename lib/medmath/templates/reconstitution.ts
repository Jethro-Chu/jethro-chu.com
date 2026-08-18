import type { QuestionTemplate } from "../types.ts";
import { pick } from "./helpers.ts";

export const reconstitutionTemplates: QuestionTemplate[] = [
  {
    id: "recon-cefazolin-1g-330mg-ml",
    category: "reconstitution",
    subtype: "powder-reconstitution",
    difficulty: "intermediate",
    title: "Cefazolin Powder Reconstitution (1 g Vial)",
    clinicalContext: "Adult Inpatient Surgical Floor Order",
    generate: (rng) => {
      const data = pick([
        { vialG: 1, reconConcMgMl: 330, orderMg: 750, ans: 2.3 },
        { vialG: 1, reconConcMgMl: 330, orderMg: 500, ans: 1.5 },
        { vialG: 1, reconConcMgMl: 330, orderMg: 1000, ans: 3.0 },
        { vialG: 1, reconConcMgMl: 250, orderMg: 750, ans: 3.0 },
      ], rng);

      return {
        scenario: `A provider orders IV cefazolin for an adult inpatient. The pharmacy supplies a 1 g vial of powdered medication with reconstitution instructions.`,
        orderText: `Cefazolin ${data.orderMg} mg IV every 8 hours`,
        availableText: `Cefazolin 1 g vial powder. Reconstitution instructions: Add 2.5 mL Sterile Water for Injection to yield a final concentration of ${data.reconConcMgMl} mg/mL.`,
        prompt: `How many mL should the nurse draw up from the reconstituted vial?`,
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "tenth",
        roundingInstruction: "Round to the nearest tenth.",
        tolerance: 0.05,
        hints: [
          "Focus on the final reconstituted concentration provided on the vial label.",
          `Final concentration = ${data.reconConcMgMl} mg/mL.`,
          `Calculate: ${data.orderMg} ÷ ${data.reconConcMgMl} = ${data.ans} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Identify Resulting Concentration",
            explanation: `The instructions state the reconstituted solution concentration is ${data.reconConcMgMl} mg/mL.`,
            calculation: `Concentration = ${data.reconConcMgMl} mg/mL`,
            result: `${data.reconConcMgMl} mg/mL`,
          },
          {
            stepNumber: 2,
            title: "Calculate Volume to Administer",
            formula: "Desired Dose ÷ Reconstituted Concentration",
            calculation: `${data.orderMg} mg ÷ ${data.reconConcMgMl} mg/mL = ${data.ans} mL`,
            result: `${data.ans} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "recon-ampicillin-1g",
    category: "reconstitution",
    subtype: "powder-reconstitution",
    difficulty: "beginner",
    title: "Ampicillin Powder Reconstitution",
    clinicalContext: "Adult Med-Surg Antibiotic Administration",
    generate: (rng) => {
      const data = pick([
        { vialG: 1, reconConcMgMl: 250, orderMg: 500, ans: 2 },
        { vialG: 1, reconConcMgMl: 250, orderMg: 750, ans: 3 },
        { vialG: 1, reconConcMgMl: 250, orderMg: 1000, ans: 4 },
        { vialG: 2, reconConcMgMl: 250, orderMg: 1500, ans: 6 },
      ], rng);

      return {
        scenario: `An adult inpatient has an order for ampicillin IV. The nurse must reconstitute the vial from powder.`,
        orderText: `Ampicillin ${data.orderMg} mg IV every 6 hours`,
        availableText: `Ampicillin 1 g vial powder. Reconstitute with 3.5 mL Sterile Water to yield ${data.reconConcMgMl} mg/mL.`,
        prompt: `How many mL should the nurse withdraw for administration?`,
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "whole",
        roundingInstruction: "State whole number.",
        tolerance: 0.05,
        hints: [
          `Final concentration is ${data.reconConcMgMl} mg/mL.`,
          "Apply formula: Desired Dose (mg) ÷ Concentration (mg/mL).",
          `Calculate: ${data.orderMg} mg ÷ ${data.reconConcMgMl} mg/mL = ${data.ans} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Volume",
            formula: "Desired ÷ Reconstituted Concentration",
            calculation: `${data.orderMg} mg ÷ ${data.reconConcMgMl} mg/mL = ${data.ans} mL`,
            result: `${data.ans} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "recon-solumedrol-actovial",
    category: "reconstitution",
    subtype: "act-o-vial",
    difficulty: "intermediate",
    title: "Solu-Medrol (Methylprednisolone) Act-O-Vial Reconstitution",
    clinicalContext: "Adult Med-Surg Acute COPD Exacerbation",
    generate: (rng) => {
      const data = pick([
        { vialMg: 125, diluentMl: 2, concMgMl: 62.5, orderMg: 100, ans: 1.6 },
        { vialMg: 125, diluentMl: 2, concMgMl: 62.5, orderMg: 125, ans: 2.0 },
        { vialMg: 125, diluentMl: 2, concMgMl: 62.5, orderMg: 60, ans: 1.0 },
        { vialMg: 40, diluentMl: 1, concMgMl: 40, orderMg: 30, ans: 0.75 },
      ], rng);

      return {
        scenario: `An adult inpatient experiencing an acute asthma/COPD flare requires IV methylprednisolone. The pharmacy dispenses a Solu-Medrol Act-O-Vial.`,
        orderText: `Methylprednisolone ${data.orderMg} mg IV push stat`,
        availableText: `Solu-Medrol Act-O-Vial ${data.vialMg} mg powder with ${data.diluentMl} mL diluent chamber (yielding ${data.concMgMl} mg/mL)`,
        prompt: `How many mL should the nurse administer after activating and mixing the Act-O-Vial?`,
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "hundredth",
        roundingInstruction: "Round to nearest tenth or hundredth (e.g. 1.6 or 0.75).",
        tolerance: 0.05,
        hints: [
          `Concentration is ${data.concMgMl} mg/mL.`,
          "Apply formula: Desired Dose (mg) ÷ Concentration (mg/mL).",
          `Calculate: ${data.orderMg} mg ÷ ${data.concMgMl} mg/mL = ${data.ans} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Dose Volume",
            formula: "Desired Dose ÷ Concentration (mg/mL)",
            calculation: `${data.orderMg} mg ÷ ${data.concMgMl} mg/mL = ${data.ans} mL`,
            result: `${data.ans} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "recon-ceftriaxone-im-lidocaine",
    category: "reconstitution",
    subtype: "im-reconstitution",
    difficulty: "intermediate",
    title: "Ceftriaxone IM Reconstitution with 1% Lidocaine Diluent",
    clinicalContext: "Adult Outpatient / ED STI Treatment Protocol",
    generate: (rng) => {
      const data = pick([
        { vialG: 1, orderMg: 500, concMgMl: 350, ans: 1.4 },
        { vialG: 1, orderMg: 250, concMgMl: 350, ans: 0.7 },
        { vialG: 1, orderMg: 1000, concMgMl: 350, ans: 2.9 },
        { vialG: 1, orderMg: 500, concMgMl: 250, ans: 2.0 },
      ], rng);

      return {
        scenario: `To reduce injection discomfort, an adult patient receiving an intramuscular dose of ceftriaxone has the vial reconstituted with 1% Lidocaine (without epinephrine).`,
        orderText: `Ceftriaxone ${data.orderMg} mg IM once stat`,
        availableText: `Ceftriaxone 1 g vial. Package insert: Add 2.1 mL 1% Lidocaine diluent to yield a concentration of ${data.concMgMl} mg/mL.`,
        prompt: `How many mL of the reconstituted suspension should the nurse administer via deep IM injection?`,
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.05,
        hints: [
          `Concentration is ${data.concMgMl} mg/mL.`,
          "Apply formula: Desired Dose (mg) ÷ Concentration (mg/mL).",
          `Calculate: ${data.orderMg} mg ÷ ${data.concMgMl} mg/mL = ${data.ans} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Intramuscular Volume",
            formula: "Desired ÷ Reconstituted Concentration",
            calculation: `${data.orderMg} mg ÷ ${data.concMgMl} mg/mL = ${data.ans} mL`,
            result: `${data.ans} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "recon-penicillin-g-units",
    category: "reconstitution",
    subtype: "units-reconstitution",
    difficulty: "intermediate",
    title: "Penicillin G Potassium High-Unit Reconstitution",
    clinicalContext: "Adult Inpatient Endocarditis Protocol",
    generate: (rng) => {
      const data = pick([
        { totalUnits: 5000000, concUnitsMl: 500000, orderUnits: 1500000, ans: 3 },
        { totalUnits: 5000000, concUnitsMl: 500000, orderUnits: 2000000, ans: 4 },
        { totalUnits: 5000000, concUnitsMl: 1000000, orderUnits: 3000000, ans: 3 },
        { totalUnits: 10000000, concUnitsMl: 1000000, orderUnits: 4000000, ans: 4 },
      ], rng);

      return {
        scenario: `An adult inpatient with bacterial endocarditis has a high-dose IV Penicillin G order. The pharmacy supplies a 5 million unit vial of powdered Penicillin G Potassium.`,
        orderText: `Penicillin G Potassium ${(data.orderUnits / 1000000).toFixed(1)} million units (${data.orderUnits.toLocaleString()} units) IV every 4 hours`,
        availableText: `Penicillin G 5,000,000 units vial. Reconstitute with 8.2 mL Sterile Water to yield ${data.concUnitsMl.toLocaleString()} units/mL.`,
        prompt: `How many mL should the nurse withdraw to add to the IV piggyback bag?`,
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "whole",
        roundingInstruction: "State whole number of mL.",
        tolerance: 0.05,
        hints: [
          `Concentration is ${data.concUnitsMl.toLocaleString()} units/mL.`,
          "Apply formula: Desired Units ÷ Concentration (units/mL).",
          `Calculate: ${data.orderUnits} units ÷ ${data.concUnitsMl} units/mL = ${data.ans} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Volume from Reconstituted Units",
            formula: "Desired Units ÷ Concentration (units/mL)",
            calculation: `${data.orderUnits.toLocaleString()} units ÷ ${data.concUnitsMl.toLocaleString()} units/mL = ${data.ans} mL`,
            result: `${data.ans} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "recon-pantoprazole-iv-push",
    category: "reconstitution",
    subtype: "powder-reconstitution",
    difficulty: "beginner",
    title: "Pantoprazole (Protonix) IV Reconstitution",
    clinicalContext: "Adult Med-Surg GI Bleed Prophylaxis",
    generate: (rng) => {
      const data = pick([
        { vialMg: 40, diluentMl: 10, concMgMl: 4, orderMg: 40, ans: 10 },
        { vialMg: 40, diluentMl: 10, concMgMl: 4, orderMg: 20, ans: 5 },
        { vialMg: 40, diluentMl: 10, concMgMl: 4, orderMg: 80, ans: 20 },
      ], rng);

      return {
        scenario: `An adult medical patient is ordered IV pantoprazole for upper GI bleed prophylaxis.`,
        orderText: `Pantoprazole ${data.orderMg} mg IV push daily over 2 minutes`,
        availableText: `Pantoprazole 40 mg vial powder. Reconstitute with 10 mL 0.9% Normal Saline (yielding 4 mg/mL).`,
        prompt: `How many mL should the nurse draw up to deliver the ${data.orderMg} mg dose?`,
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "whole",
        roundingInstruction: "State whole number of mL.",
        tolerance: 0.05,
        hints: [
          "Concentration is 40 mg ÷ 10 mL = 4 mg/mL.",
          "Apply formula: Desired Dose (mg) ÷ 4 mg/mL.",
          `Calculate: ${data.orderMg} mg ÷ 4 mg/mL = ${data.ans} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Reconstitution Volume",
            formula: "Desired Dose ÷ 4 mg/mL",
            calculation: `${data.orderMg} mg ÷ 4 mg/mL = ${data.ans} mL`,
            result: `${data.ans} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
];
