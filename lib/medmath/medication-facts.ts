/**
 * Reviewable educational facts used by the medication question bank.
 * Timing ranges follow the nursing course reference supplied for this feature.
 * Administration and safety statements are cross-checked against current U.S.
 * prescribing information. This is study content, not a dosing protocol.
 */

export const INSULIN_FACTS = {
  rapid: {
    genericNames: ["lispro", "aspart", "glulisine"],
    brands: ["Humalog", "Admelog", "Fiasp", "NovoLog", "Apidra"],
    onsetMinutes: [10, 15],
    peakMinutes: [30, 90],
    durationHours: [2, 4],
    mealTiming: "Administer with the meal available, generally within 15 minutes before eating or as product labeling directs.",
  },
  regular: {
    genericNames: ["regular insulin"],
    brands: ["Humulin R", "Novolin R"],
    onsetMinutes: [30, 30],
    peakHours: [2, 3],
    durationHours: [3, 6],
    ivCompatible: true,
    mixingSequence: "Draw clear regular insulin before cloudy NPH insulin.",
  },
  nph: {
    genericNames: ["NPH"],
    brands: ["Humulin N", "Novolin N", "ReliOn N"],
    onsetHours: [2, 4],
    peakHours: [4, 12],
    durationHours: [12, 18],
    appearance: "cloudy",
  },
  longActing: {
    genericNames: ["glargine", "detemir"],
    brands: ["Lantus", "Basaglar", "Levemir"],
    onsetHours: [2, 4],
    peak: "minimal or no pronounced peak",
    duration: "up to about 24 hours",
    glargineMixing: "Do not mix insulin glargine with another insulin or solution.",
  },
  ultraLong: {
    genericNames: ["degludec", "glargine U-300"],
    brands: ["Tresiba", "Toujeo"],
    peak: "minimal or no pronounced peak",
    duration: "very long duration",
  },
  concentration: {
    u100UnitsPerMl: 100,
  },
} as const;

export const ANTICOAGULANT_FACTS = {
  unfractionatedHeparin: {
    routes: ["IV", "subcutaneous"],
    commonMonitoring: "aPTT or an institution-specific anti-Xa protocol",
    reversal: "protamine sulfate",
    safety: ["bleeding", "heparin-induced thrombocytopenia", "platelet decline"],
  },
  enoxaparin: {
    class: "low-molecular-weight heparin",
    route: "subcutaneous",
    commonUses: ["VTE prophylaxis", "DVT or PE treatment"],
    safety: ["bleeding", "thrombocytopenia", "renal dose considerations"],
    reversal: "protamine sulfate provides partial reversal",
  },
  warfarin: {
    brand: "Coumadin",
    mechanism: "vitamin K antagonist",
    monitoring: "PT/INR",
    onset: "delayed",
    reversal: "vitamin K, with additional reversal products based on urgency and protocol",
  },
  factorXaInhibitors: {
    medicines: ["apixaban (Eliquis)", "rivaroxaban (Xarelto)"],
    class: "direct factor Xa inhibitors",
    safety: ["bleeding", "renal function considerations"],
  },
  dabigatran: {
    brand: "Pradaxa",
    class: "direct thrombin inhibitor",
    commonUse: "stroke and systemic embolism risk reduction in appropriate adults with non-valvular atrial fibrillation",
    safety: ["bleeding", "renal function considerations"],
    reversal: "idarucizumab",
  },
} as const;

export const MEDICATION_EDUCATION_DISCLAIMER =
  "For nursing education only. Use current medication labeling, your course materials, and facility policy for clinical decisions.";
