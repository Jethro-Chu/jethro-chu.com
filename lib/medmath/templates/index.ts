import type { QuestionTemplate } from "../types.ts";
import { conversionTemplates } from "./conversions.ts";
import { basicDosageTemplates } from "./basic-dosage.ts";
import { ivPumpTemplates } from "./iv-pump.ts";
import { gravityDripsTemplates } from "./gravity-drips.ts";
import { infusionTimeTemplates } from "./infusion-time.ts";
import { insulinTemplates } from "./insulin.ts";
import { weightBasedTemplates } from "./weight-based.ts";
import { heparinTemplates } from "./heparin.ts";
import { criticalCareTemplates } from "./critical-care.ts";
import { multiStepTemplates } from "./multi-step.ts";
import { concentrationTemplates } from "./concentrations.ts";
import { reconstitutionTemplates } from "./reconstitution.ts";
import { electrolyteTemplates } from "./electrolytes.ts";

export const ALL_QUESTION_TEMPLATES: QuestionTemplate[] = [
  ...conversionTemplates,
  ...basicDosageTemplates,
  ...ivPumpTemplates,
  ...gravityDripsTemplates,
  ...infusionTimeTemplates,
  ...insulinTemplates,
  ...weightBasedTemplates,
  ...heparinTemplates,
  ...criticalCareTemplates,
  ...multiStepTemplates,
  ...concentrationTemplates,
  ...reconstitutionTemplates,
  ...electrolyteTemplates,
];

export const TEMPLATE_MAP = new Map<string, QuestionTemplate>(
  ALL_QUESTION_TEMPLATES.map((t) => [t.id, t]),
);
