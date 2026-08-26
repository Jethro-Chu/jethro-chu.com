import type { CategoryMeta, MedMathCategory } from "./types.ts";

export const MEDMATH_CATEGORIES: CategoryMeta[] = [
  {
    id: "conversions",
    name: "Metric & Unit Conversions",
    shortName: "Conversions",
    description: "Convert weights, volumes, and time units commonly used in clinical calculation.",
    track: "med-surg",
    defaultUnit: "mg / mL / kg",
  },
  {
    id: "basic-dosage",
    name: "Basic Medication Dosage",
    shortName: "Basic Dosage",
    description: "Tablets, capsules, and liquid concentrations using Desired over Have arithmetic.",
    track: "med-surg",
    defaultUnit: "tabs / caps / mL",
  },
  {
    id: "iv-pump",
    name: "IV Pump Rates",
    shortName: "IV Pump Rates",
    description: "Continuous infusions, IV piggybacks, and partial-hour pump rate calculations in mL/hr.",
    track: "med-surg",
    defaultUnit: "mL/hr",
  },
  {
    id: "gravity-drips",
    name: "Gravity Drip Rates",
    shortName: "Gravity Drips",
    description: "Macrodrip and microdrip tubing calculations in drops per minute (gtt/min).",
    track: "med-surg",
    defaultUnit: "gtt/min",
  },
  {
    id: "infusion-time",
    name: "Infusion Time & Completion",
    shortName: "Infusion Time",
    description: "Calculate total run time and remaining infusion time from volume and rate.",
    track: "med-surg",
    defaultUnit: "hours / minutes",
  },
  {
    id: "insulin",
    name: "Insulin",
    shortName: "Insulin",
    description: "Insulin types, onset/peak/duration, administration safety, sliding scales, scheduled doses, and insulin calculations.",
    track: "med-surg",
    defaultUnit: "units • mL • timing",
  },
  {
    id: "weight-based",
    name: "Weight-Based Adult Medications",
    shortName: "Weight-Based",
    description: "Adult weight conversions (lb to kg) and weight-based doses in mg/kg, mcg/kg, or units/kg.",
    track: "med-surg",
    defaultUnit: "mg / mcg / units",
  },
  {
    id: "anticoagulants",
    name: "Anticoagulants",
    shortName: "Anticoagulants",
    description: "Heparin, LMWH, warfarin, DOACs, laboratory monitoring, reversal agents, safety, and anticoagulant calculations.",
    track: "critical-care",
    defaultUnit: "units • mg • mL/hr • labs",
  },
  {
    id: "critical-care",
    name: "Critical-Care Infusions",
    shortName: "Critical Care Drips",
    description: "Vasoactive infusions (norepinephrine, dopamine, epinephrine) in mcg/kg/min or mcg/min to mL/hr.",
    track: "critical-care",
    defaultUnit: "mL/hr",
  },
  {
    id: "multi-step",
    name: "Multi-Step Critical Care",
    shortName: "Multi-Step ICU",
    description: "Challenging ICU problems requiring pound conversion, microgram dosage, and pump programming.",
    track: "critical-care",
    defaultUnit: "mL/hr",
  },
  {
    id: "concentrations",
    name: "IV Medication Concentrations",
    shortName: "IV Concentrations",
    description: "Determine drug concentrations in mg/mL or mcg/mL and calculate titration delivery rates.",
    track: "critical-care",
    defaultUnit: "mg/mL / mcg/mL / mL/hr",
  },
  {
    id: "reconstitution",
    name: "Powder Reconstitution",
    shortName: "Reconstitution",
    description: "Diluent addition, displacement volume, resultant vial concentration, and volume to draw up.",
    track: "med-surg",
    defaultUnit: "mL",
  },
  {
    id: "electrolytes",
    name: "Electrolyte Replacement",
    shortName: "Electrolytes",
    description: "Potassium chloride, magnesium sulfate, and calcium replacement rates and dilutions.",
    track: "med-surg",
    defaultUnit: "mEq / mL/hr",
  },
];

export const CATEGORY_MAP = new Map<MedMathCategory, CategoryMeta>(
  MEDMATH_CATEGORIES.map((c) => [c.id, c]),
);

export const MED_SURG_CATEGORIES: MedMathCategory[] = MEDMATH_CATEGORIES.filter(
  (c) => c.track === "med-surg",
).map((c) => c.id);

export const CRITICAL_CARE_CATEGORIES: MedMathCategory[] = MEDMATH_CATEGORIES.filter(
  (c) => c.track === "critical-care",
).map((c) => c.id);
