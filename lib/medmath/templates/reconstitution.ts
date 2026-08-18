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
  {
    id: "recon-multiple-diluent-choices-im-iv",
    category: "reconstitution",
    subtype: "multi-strength-reconstitution",
    difficulty: "intermediate",
    title: "Reconstitution with Multiple Diluent Options (IM vs IV)",
    clinicalContext: "Adult Inpatient Antibiotic Floor Administration",
    generate: (rng) => {
      const data = pick([
        { orderMg: 500, route: "IM", addedMl: 1.8, concMgMl: 250, ans: 2.0 },
        { orderMg: 750, route: "IM", addedMl: 1.8, concMgMl: 250, ans: 3.0 },
        { orderMg: 500, route: "IV", addedMl: 4.8, concMgMl: 100, ans: 5.0 },
        { orderMg: 1000, route: "IV", addedMl: 4.8, concMgMl: 100, ans: 10.0 },
      ], rng);

      return {
        scenario: `A physician orders Cefamandole ${data.orderMg} mg ${data.route} every 6 hours for an adult patient with pneumonia. The package insert provides two reconstitution options:
• For IM injection: Add 1.8 mL Sterile Water to yield 250 mg/mL
• For IV injection: Add 4.8 mL Sterile Water to yield 100 mg/mL`,
        orderText: `Cefamandole ${data.orderMg} mg ${data.route} every 6 hours`,
        availableText: `Cefamandole 1 g vial powder with dual IM/IV package insert instructions`,
        prompt: `Based on the prescribed route (${data.route}), how many mL should the nurse draw up to deliver ${data.orderMg} mg?`,
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "tenth",
        roundingInstruction: "State exact number or round to nearest tenth.",
        tolerance: 0.05,
        hints: [
          `Identify the concentration for the ordered route (${data.route}): ${data.concMgMl} mg/mL.`,
          `Apply formula: Desired Dose (${data.orderMg} mg) ÷ ${data.concMgMl} mg/mL.`,
          `Calculate: ${data.orderMg} ÷ ${data.concMgMl} = ${data.ans} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Select Route-Specific Concentration",
            explanation: `For the ${data.route} route, the package insert specifies a concentration of ${data.concMgMl} mg/mL.`,
            calculation: `Concentration = ${data.concMgMl} mg/mL`,
            result: `${data.concMgMl} mg/mL`,
          },
          {
            stepNumber: 2,
            title: "Calculate Administration Volume",
            formula: "Desired Dose ÷ Route Concentration",
            calculation: `${data.orderMg} mg ÷ ${data.concMgMl} mg/mL = ${data.ans} mL`,
            result: `${data.ans} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "recon-powder-displacement-factor",
    category: "reconstitution",
    subtype: "powder-reconstitution",
    difficulty: "advanced",
    title: "Powder Displacement Volume Factor Calculation",
    clinicalContext: "Adult Inpatient Compounding Pharmacy Verification",
    generate: (rng) => {
      const data = pick([
        { vialG: 1, addedDiluentMl: 4.2, finalVolumeMl: 5.0, displacementMl: 0.8, concMgMl: 200, orderMg: 600, ansMl: 3.0 },
        { vialG: 2, addedDiluentMl: 6.8, finalVolumeMl: 8.0, displacementMl: 1.2, concMgMl: 250, orderMg: 1000, ansMl: 4.0 },
        { vialG: 1, addedDiluentMl: 3.5, finalVolumeMl: 4.0, displacementMl: 0.5, concMgMl: 250, orderMg: 500, ansMl: 2.0 },
      ], rng);

      return {
        scenario: `A nurse reconstitutes a ${data.vialG} g vial of powdered antibiotic by adding ${data.addedDiluentMl} mL of sterile water. Because the powder expands and displaces volume (${data.displacementMl} mL displacement), the resulting total liquid volume in the vial is ${data.finalVolumeMl} mL.`,
        orderText: `Administer ${data.orderMg} mg IV from the reconstituted ${data.vialG} g vial`,
        prompt: `How many mL should the nurse draw up to administer the ordered ${data.orderMg} mg dose?`,
        expectedAnswer: data.ansMl,
        expectedUnit: "mL",
        roundingMode: "tenth",
        roundingInstruction: "State exact number or round to nearest tenth.",
        tolerance: 0.05,
        hints: [
          `Step 1: Calculate concentration using total final volume (${data.finalVolumeMl} mL): ${data.vialG * 1000} mg ÷ ${data.finalVolumeMl} mL = ${data.concMgMl} mg/mL.`,
          `Step 2: Divide ordered dose by concentration: ${data.orderMg} mg ÷ ${data.concMgMl} mg/mL = ${data.ansMl} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate True Reconstituted Concentration",
            formula: "Total Milligrams ÷ Final Total Volume (mL)",
            calculation: `${data.vialG * 1000} mg ÷ ${data.finalVolumeMl} mL = ${data.concMgMl} mg/mL`,
            result: `${data.concMgMl} mg/mL`,
          },
          {
            stepNumber: 2,
            title: "Calculate Dose Volume",
            formula: "Prescribed Dose ÷ Concentration (mg/mL)",
            calculation: `${data.orderMg} mg ÷ ${data.concMgMl} mg/mL = ${data.ansMl} mL`,
            result: `${data.ansMl} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "recon-methylprednisolone-act-o-vial",
    category: "reconstitution",
    subtype: "powder-reconstitution",
    difficulty: "intermediate",
    title: "Methylprednisolone (Solu-Medrol) Act-O-Vial Reconstitution",
    clinicalContext: "Adult Inpatient Acute Asthma / COPD Exacerbation",
    generate: (rng) => {
      const data = pick([
        { vialMg: 125, diluentMl: 2.0, concMgMl: 62.5, orderMg: 100, ans: 1.6 },
        { vialMg: 125, diluentMl: 2.0, concMgMl: 62.5, orderMg: 62.5, ans: 1.0 },
        { vialMg: 125, diluentMl: 2.0, concMgMl: 62.5, orderMg: 125, ans: 2.0 },
        { vialMg: 40, diluentMl: 1.0, concMgMl: 40.0, orderMg: 60, ans: 1.5 },
      ], rng);

      return {
        scenario: `An adult inpatient experiencing severe bronchospasm is ordered IV methylprednisolone sodium succinate. The nurse activates a Solu-Medrol ${data.vialMg} mg Act-O-Vial containing ${data.diluentMl} mL of diluent in the upper compartment (yielding ${data.concMgMl} mg/mL when mixed).`,
        orderText: `Methylprednisolone ${data.orderMg} mg IV push over 3 minutes`,
        availableText: `Solu-Medrol ${data.vialMg} mg Act-O-Vial (${data.concMgMl} mg/mL mixed)`,
        prompt: `How many mL should the nurse draw up to administer the ordered ${data.orderMg} mg dose?`,
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.05,
        hints: [
          `Concentration of the mixed Act-O-Vial is ${data.concMgMl} mg/mL.`,
          `Apply formula: Desired Dose (${data.orderMg} mg) ÷ ${data.concMgMl} mg/mL.`,
          `Calculate: ${data.orderMg} ÷ ${data.concMgMl} = ${data.ans} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Injection Volume",
            formula: "Desired Dose ÷ Act-O-Vial Concentration",
            calculation: `${data.orderMg} mg ÷ ${data.concMgMl} mg/mL = ${data.ans} mL`,
            result: `${data.ans} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "recon-ceftriaxone-lidocaine-im",
    category: "reconstitution",
    subtype: "powder-reconstitution",
    difficulty: "intermediate",
    title: "Ceftriaxone (Rocephin) IM Reconstitution with 1% Lidocaine",
    clinicalContext: "Adult Emergency / Outpatient STI Treatment",
    generate: (rng) => {
      const data = pick([
        { vialG: 1, diluentMl: 2.1, concMgMl: 350, orderMg: 500, ans: 1.4 },
        { vialG: 1, diluentMl: 2.1, concMgMl: 350, orderMg: 250, ans: 0.7 },
        { vialG: 1, diluentMl: 2.1, concMgMl: 350, orderMg: 700, ans: 2.0 },
      ], rng);

      return {
        scenario: `An adult outpatient diagnosed with gonorrhea is prescribed IM ceftriaxone. To minimize injection discomfort, the package insert directs reconstituting the 1 g vial with ${data.diluentMl} mL of 1% Lidocaine without epinephrine, resulting in a concentration of ${data.concMgMl} mg/mL.`,
        orderText: `Ceftriaxone ${data.orderMg} mg IM stat`,
        availableText: `Rocephin 1 g vial powder. Reconstitute with 2.1 mL 1% Lidocaine to yield ${data.concMgMl} mg/mL.`,
        prompt: `How many mL of reconstituted ceftriaxone should the nurse inject intramuscularly?`,
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth (e.g. 1.4).",
        tolerance: 0.05,
        hints: [
          `Final concentration is ${data.concMgMl} mg/mL.`,
          `Divide desired dose by concentration: ${data.orderMg} mg ÷ ${data.concMgMl} mg/mL.`,
          `Calculate: ${data.orderMg} ÷ ${data.concMgMl} = ${data.ans} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Intramuscular Volume",
            formula: "Desired Dose ÷ Concentration (350 mg/mL)",
            calculation: `${data.orderMg} mg ÷ ${data.concMgMl} mg/mL = ${data.ans} mL`,
            result: `${data.ans} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "recon-piperacillin-tazobactam-bulk",
    category: "reconstitution",
    subtype: "powder-reconstitution",
    difficulty: "intermediate",
    title: "Piperacillin/Tazobactam (Zosyn) Reconstitution Volume",
    clinicalContext: "Adult Inpatient Sepsis / Intra-Abdominal Infection",
    generate: (rng) => {
      const data = pick([
        { vialG: 3.375, addedMl: 15, concMgMl: 200, orderG: 2.25, orderMg: 2250, ans: 11.3 },
        { vialG: 3.375, addedMl: 15, concMgMl: 200, orderG: 3.375, orderMg: 3375, ans: 16.9 },
        { vialG: 4.5, addedMl: 20, concMgMl: 200, orderG: 3.375, orderMg: 3375, ans: 16.9 },
        { vialG: 4.5, addedMl: 20, concMgMl: 200, orderG: 4.5, orderMg: 4500, ans: 22.5 },
      ], rng);

      return {
        scenario: `An adult inpatient with intra-abdominal infection is prescribed renal-adjusted IV Zosyn at ${data.orderG} g every 6 hours. The nurse reconstitutes a ${data.vialG} g single-dose vial with ${data.addedMl} mL of sterile water, resulting in an active concentration of ${data.concMgMl} mg/mL.`,
        orderText: `Piperacillin/Tazobactam ${data.orderG} g (${data.orderMg} mg) IVPB every 6 hours`,
        availableText: `Zosyn ${data.vialG} g vial powder (yielding ${data.concMgMl} mg/mL when reconstituted)`,
        prompt: `How many mL should the nurse draw up from the reconstituted vial to add to the IV piggyback bag?`,
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth.",
        tolerance: 0.1,
        hints: [
          `Convert ordered grams to mg: ${data.orderG} g = ${data.orderMg} mg.`,
          `Divide ordered mg by reconstituted concentration (${data.concMgMl} mg/mL).`,
          `Calculate: ${data.orderMg} ÷ ${data.concMgMl} = ${data.ans} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Convert Dose to Milligrams",
            formula: "Grams × 1,000",
            calculation: `${data.orderG} g × 1,000 = ${data.orderMg} mg`,
            result: `${data.orderMg} mg`,
          },
          {
            stepNumber: 2,
            title: "Calculate Syringe Volume",
            formula: "Dose (mg) ÷ Concentration (200 mg/mL)",
            calculation: `${data.orderMg} mg ÷ ${data.concMgMl} mg/mL = ${data.ans} mL`,
            result: `${data.ans} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "recon-hydrocortisone-actovial-100mg",
    category: "reconstitution",
    subtype: "powder-reconstitution",
    difficulty: "beginner",
    title: "Hydrocortisone (Solu-Cortef) Act-O-Vial Volume",
    clinicalContext: "Adult Med-Surg Adrenal Insufficiency Protocol",
    generate: (rng) => {
      const data = pick([
        { vialMg: 100, diluentMl: 2.0, concMgMl: 50, orderMg: 50, ans: 1.0 },
        { vialMg: 100, diluentMl: 2.0, concMgMl: 50, orderMg: 100, ans: 2.0 },
        { vialMg: 100, diluentMl: 2.0, concMgMl: 50, orderMg: 25, ans: 0.5 },
        { vialMg: 250, diluentMl: 2.0, concMgMl: 125, orderMg: 100, ans: 0.8 },
      ], rng);

      return {
        scenario: `An adult inpatient with secondary acute adrenal crisis is ordered IV hydrocortisone. The nurse activates a Solu-Cortef ${data.vialMg} mg Act-O-Vial containing ${data.diluentMl} mL diluent, yielding ${data.concMgMl} mg/mL.`,
        orderText: `Hydrocortisone ${data.orderMg} mg IV push stat`,
        availableText: `Solu-Cortef ${data.vialMg} mg Act-O-Vial (${data.concMgMl} mg/mL mixed)`,
        prompt: `How many mL should the nurse draw up to deliver the ${data.orderMg} mg dose?`,
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "tenth",
        roundingInstruction: "State exact number or round to nearest tenth.",
        tolerance: 0.05,
        hints: [
          `Concentration of the Act-O-Vial is ${data.concMgMl} mg/mL.`,
          `Calculate: ${data.orderMg} mg ÷ ${data.concMgMl} mg/mL = ${data.ans} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Dose Volume",
            formula: "Desired Dose ÷ Act-O-Vial Concentration",
            calculation: `${data.orderMg} mg ÷ ${data.concMgMl} mg/mL = ${data.ans} mL`,
            result: `${data.ans} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "recon-ertapenem-im-1g",
    category: "reconstitution",
    subtype: "powder-reconstitution",
    difficulty: "intermediate",
    title: "Ertapenem (Invanz) IM Reconstitution Volume",
    clinicalContext: "Adult Outpatient Parenteral Antimicrobial Therapy",
    generate: (rng) => {
      const data = pick([
        { vialG: 1, diluentMl: 3.2, concMgMl: 280, orderG: 1, orderMg: 1000, ans: 3.6 },
        { vialG: 1, diluentMl: 3.2, concMgMl: 280, orderG: 0.5, orderMg: 500, ans: 1.8 },
      ], rng);

      return {
        scenario: `An adult outpatient with complicated diabetic foot infection is prescribed daily IM ertapenem. The instructions state: "Reconstitute 1 g vial with 3.2 mL of 1.0% Lidocaine injection (without epinephrine) to yield a concentration of 280 mg/mL."`,
        orderText: `Ertapenem ${data.orderG} g (${data.orderMg} mg) IM daily`,
        availableText: `Invanz 1 g powder vial (reconstituted conc: 280 mg/mL)`,
        prompt: `How many mL should the nurse draw up for intramuscular injection?`,
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth (e.g. 3.6).",
        tolerance: 0.05,
        hints: [
          `Divide ordered dose (${data.orderMg} mg) by reconstituted concentration (${data.concMgMl} mg/mL).`,
          `Calculate: ${data.orderMg} ÷ ${data.concMgMl} = ${data.ans} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Intramuscular Syringe Volume",
            formula: "Dose (mg) ÷ Concentration (280 mg/mL)",
            calculation: `${data.orderMg} mg ÷ ${data.concMgMl} mg/mL = ${data.ans} mL`,
            result: `${data.ans} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "recon-vancomycin-vial-to-bag",
    category: "reconstitution",
    subtype: "powder-reconstitution",
    difficulty: "intermediate",
    title: "Vancomycin Powder Vial Reconstitution Volume",
    clinicalContext: "Adult Inpatient Compounding Preparation",
    generate: (rng) => {
      const data = pick([
        { vialG: 1, diluentMl: 20, concMgMl: 50, orderMg: 750, ans: 15.0 },
        { vialG: 1, diluentMl: 20, concMgMl: 50, orderMg: 500, ans: 10.0 },
        { vialG: 1, diluentMl: 20, concMgMl: 50, orderMg: 1000, ans: 20.0 },
        { vialG: 1, diluentMl: 20, concMgMl: 50, orderMg: 1250, ans: 25.0 },
      ], rng);

      return {
        scenario: `A nurse is preparing to compound an IV piggyback dose of vancomycin. The 1 g vial of powdered vancomycin is reconstituted by adding 20 mL of sterile water, yielding a concentration of 50 mg/mL.`,
        orderText: `Vancomycin ${data.orderMg} mg IVPB every 12 hours`,
        availableText: `Vancomycin 1 g vial powder (yielding 50 mg/mL when mixed with 20 mL)`,
        prompt: `How many mL of the reconstituted solution should be withdrawn to obtain ${data.orderMg} mg?`,
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "tenth",
        roundingInstruction: "State exact number or round to nearest tenth.",
        tolerance: 0.05,
        hints: [
          `Divide ordered dose (${data.orderMg} mg) by concentration (${data.concMgMl} mg/mL).`,
          `Calculate: ${data.orderMg} ÷ 50 = ${data.ans} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Withdrawn Volume",
            formula: "Prescribed Dose ÷ 50 mg/mL",
            calculation: `${data.orderMg} mg ÷ 50 mg/mL = ${data.ans} mL`,
            result: `${data.ans} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
  {
    id: "recon-aztreonam-2g-vial",
    category: "reconstitution",
    subtype: "powder-reconstitution",
    difficulty: "intermediate",
    title: "Aztreonam (Azactam) High-Dose Reconstitution",
    clinicalContext: "Adult Inpatient Multi-Drug Resistant Gram-Negative Infection",
    generate: (rng) => {
      const data = pick([
        { vialG: 2, addedMl: 6.0, concMgMl: 260, orderG: 1, orderMg: 1000, ans: 3.8 },
        { vialG: 2, addedMl: 6.0, concMgMl: 260, orderG: 2, orderMg: 2000, ans: 7.7 },
        { vialG: 2, addedMl: 6.0, concMgMl: 260, orderG: 0.5, orderMg: 500, ans: 1.9 },
      ], rng);

      return {
        scenario: `An adult inpatient allergic to penicillin requires IV aztreonam. The 2 g powder vial is reconstituted with 6 mL of sterile water for injection, giving a final concentration of ${data.concMgMl} mg/mL.`,
        orderText: `Aztreonam ${data.orderG} g (${data.orderMg} mg) IV every 8 hours`,
        availableText: `Azactam 2 g vial powder (${data.concMgMl} mg/mL after 6 mL diluent added)`,
        prompt: `How many mL of the reconstituted solution should be drawn up?`,
        expectedAnswer: data.ans,
        expectedUnit: "mL",
        roundingMode: "tenth",
        roundingInstruction: "Round to nearest tenth (e.g. 3.8).",
        tolerance: 0.05,
        hints: [
          `Divide ordered mg (${data.orderMg} mg) by concentration (${data.concMgMl} mg/mL).`,
          `Calculate: ${data.orderMg} ÷ ${data.concMgMl} = ${data.ans} mL.`,
        ],
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Calculate Reconstitution Volume",
            formula: "Dose (mg) ÷ Concentration (260 mg/mL)",
            calculation: `${data.orderMg} mg ÷ ${data.concMgMl} mg/mL = ${data.ans} mL`,
            result: `${data.ans} mL`,
          },
        ],
        rawVariables: { ...data },
      };
    },
  },
];
