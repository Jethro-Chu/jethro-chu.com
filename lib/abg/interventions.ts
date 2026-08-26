import type { ABGCompensation, ABGDisorder } from "./types";

export type ABGIntervention = {
  priority: string;
  nursingInterventions: string[];
  possibleTreatments: string[];
  monitor: string[];
  remember: string;
  safetyNote?: string;
};

const INTERVENTIONS: Record<ABGDisorder, ABGIntervention> = {
  "Respiratory Acidosis": {
    priority: "Improve ventilation and identify why the patient is retaining CO₂.",
    nursingInterventions: [
      "Assess airway, respiratory rate and depth, work of breathing, lung sounds, SpO₂, and level of consciousness.",
      "Position the patient to optimize ventilation when appropriate.",
      "Encourage coughing, deep breathing, and secretion clearance when clinically appropriate.",
      "Assess for respiratory depression, obstruction, COPD exacerbation, pneumonia, sedatives or opioids, neuromuscular weakness, or ventilator problems.",
      "Administer oxygen when indicated and ordered while continuing to address inadequate ventilation.",
    ],
    possibleTreatments: [
      "Bronchodilators",
      "Reversal of respiratory depressants when appropriate",
      "Airway clearance therapy",
      "Noninvasive ventilation such as BiPAP",
      "Ventilator adjustment",
      "Intubation and mechanical ventilation for severe respiratory failure",
    ],
    monitor: ["Respiratory rate", "Work of breathing", "SpO₂", "Mental status", "PaCO₂", "Repeat ABG"],
    remember: "Respiratory acidosis means inadequate ventilation is causing CO₂ retention.",
    safetyNote: "Ventilatory support depends on severity and the underlying cause. Respiratory acidosis does not automatically mean the patient needs intubation.",
  },
  "Respiratory Alkalosis": {
    priority: "Determine why the patient is hyperventilating.",
    nursingInterventions: [
      "Assess respiratory rate and depth, work of breathing, lung sounds, SpO₂, and mental status.",
      "Assess for pain, anxiety, fever, hypoxemia, sepsis, pulmonary embolism, pregnancy, CNS causes, or mechanical overventilation.",
      "Administer oxygen when the patient is hypoxemic and oxygen is indicated or ordered.",
      "Treat or help address the underlying trigger rather than the ABG value alone.",
      "For a mechanically ventilated patient, notify the provider or respiratory therapist because settings may need adjustment.",
    ],
    possibleTreatments: [
      "Oxygen for hypoxemia",
      "Analgesia",
      "Treatment of fever or sepsis",
      "Treatment of pulmonary embolism",
      "Ventilator adjustment",
    ],
    monitor: ["SpO₂", "Respiratory rate", "Mental status", "Neurologic symptoms", "Repeat ABG"],
    remember: "Respiratory alkalosis means excessive ventilation is blowing off too much CO₂.",
    safetyNote: "Do not use routine paper-bag rebreathing. Hyperventilation may be caused by hypoxemia or another serious condition.",
  },
  "Metabolic Acidosis": {
    priority: "Identify and treat the cause of the metabolic acidosis.",
    nursingInterventions: [
      "Assess hemodynamic status, mental status, respiratory pattern, and hydration.",
      "Look for causes such as DKA, lactic acidosis, shock, renal failure, diarrhea, or toxin exposure.",
      "Monitor electrolytes, especially potassium, and check glucose when DKA is possible.",
      "Administer IV fluids when clinically indicated and ordered.",
      "Observe for deep, rapid compensatory breathing such as Kussmaul respirations.",
    ],
    possibleTreatments: [
      "IV fluids",
      "Insulin for DKA",
      "Treatment of sepsis or shock",
      "Dialysis when indicated",
      "Treatment of toxin exposure",
      "Sodium bicarbonate in selected severe situations",
    ],
    monitor: ["Potassium", "Glucose", "Renal function", "Hemodynamics", "Respiratory pattern", "Anion gap when relevant", "Repeat ABG"],
    remember: "Kussmaul respirations may be the body’s attempt to compensate by lowering PaCO₂.",
    safetyNote: "Sodium bicarbonate is not automatically given for every metabolic acidosis. Treatment depends on the cause and severity.",
  },
  "Metabolic Alkalosis": {
    priority: "Identify the cause and correct fluid and electrolyte abnormalities.",
    nursingInterventions: [
      "Assess for vomiting, NG suction, diuretic use, volume depletion, or excessive alkali intake.",
      "Monitor potassium and chloride.",
      "Assess hydration, fluid balance, and hemodynamic status.",
      "Replace fluids and electrolytes as ordered and manage excessive gastric losses when appropriate.",
      "Review loop or thiazide diuretics and other possible causes with the healthcare team.",
    ],
    possibleTreatments: [
      "IV isotonic fluids",
      "Potassium or chloride replacement",
      "Antiemetics",
      "Adjustment of diuretic therapy",
      "Treatment of the underlying endocrine or renal cause",
    ],
    monitor: ["Potassium", "Chloride", "ECG", "Fluid balance", "Neurologic status", "Repeat ABG"],
    remember: "Vomiting and NG suction can cause metabolic alkalosis because the patient loses gastric acid.",
  },
  "Mixed Disorder": {
    priority: "Escalate assessment and identify each active process causing the mixed disturbance.",
    nursingInterventions: [
      "Assess airway, breathing, circulation, mental status, and signs of poor perfusion.",
      "Verify the sample and compare the ABG with the patient’s symptoms, history, and recent trends.",
      "Assess for overlapping causes such as sepsis, shock, DKA, renal failure, toxicity, or respiratory failure.",
      "Notify the provider and involve respiratory therapy when ventilation or oxygenation is a concern.",
      "Prepare to support the most immediate physiologic threat while the causes are clarified.",
    ],
    possibleTreatments: [
      "Oxygenation or ventilatory support",
      "Fluids or hemodynamic support",
      "Insulin, antimicrobials, antidotes, or dialysis when indicated",
      "Other cause-specific treatment based on the full clinical picture",
    ],
    monitor: ["Respiratory status", "SpO₂", "ECG", "Potassium", "Glucose", "Renal function", "Hemodynamics", "Repeat ABG"],
    remember: "A mixed disorder means more than one primary process is present. Do not force it into a simple compensation pattern.",
  },
  Normal: {
    priority: "Confirm the result fits the patient’s clinical picture and continue the indicated assessment.",
    nursingInterventions: [
      "Assess the patient rather than relying on the ABG alone.",
      "Confirm the sample and reference ranges are appropriate for the clinical setting.",
      "Compare with prior results and current respiratory or hemodynamic trends.",
      "Continue care based on symptoms, diagnoses, provider orders, and facility protocols.",
    ],
    possibleTreatments: ["A normal ABG does not require treatment by itself", "Treat the patient’s underlying condition when one is present"],
    monitor: ["Clinical status", "SpO₂ when indicated", "Relevant trends", "Repeat ABG if ordered"],
    remember: "A normal ABG does not rule out serious illness or replace a complete patient assessment.",
  },
};

const COMPENSATION_TEACHING: Partial<Record<ABGCompensation, string>> = {
  Uncompensated: "Compensation has not started yet because the opposing system remains within its normal range.",
  "Partially Compensated": "Compensation has started, but the pH is still outside the normal range.",
  "Fully Compensated": "The compensating system has brought the pH back into the normal range, but the underlying disorder is still present. A normal pH does not mean the patient is healthy or needs no assessment.",
};

export function getABGIntervention(disorder: ABGDisorder, compensation: ABGCompensation) {
  return {
    ...INTERVENTIONS[disorder],
    compensationTeaching: COMPENSATION_TEACHING[compensation],
  };
}

export { INTERVENTIONS, COMPENSATION_TEACHING };
