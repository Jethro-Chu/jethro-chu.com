import type {
  ABGCompensation,
  ABGDisorder,
  ABGInterpretation,
  ABGValues,
} from "./types.ts";

export const ABG_NORMALS = {
  ph: { low: 7.35, midpoint: 7.4, high: 7.45 },
  paco2: { low: 35, midpoint: 40, high: 45 },
  hco3: { low: 22, midpoint: 24, high: 26 },
} as const;

type Direction = "low" | "normal" | "high";

function direction(value: number, low: number, high: number): Direction {
  if (value < low) return "low";
  if (value > high) return "high";
  return "normal";
}

function makeResult(
  disorder: ABGDisorder,
  compensation: ABGCompensation,
  values: ABGValues,
): ABGInterpretation {
  const phState =
    values.ph < ABG_NORMALS.ph.low
      ? "acidotic"
      : values.ph > ABG_NORMALS.ph.high
        ? "alkalotic"
        : "within the normal range";
  const co2State = direction(values.paco2, ABG_NORMALS.paco2.low, ABG_NORMALS.paco2.high);
  const hco3State = direction(values.hco3, ABG_NORMALS.hco3.low, ABG_NORMALS.hco3.high);
  const co2Meaning =
    co2State === "high"
      ? "elevated, pushing toward acidosis"
      : co2State === "low"
        ? "low, pushing toward alkalosis"
        : "within the normal range";
  const hco3Meaning =
    hco3State === "high"
      ? "elevated, pushing toward alkalosis"
      : hco3State === "low"
        ? "low, pushing toward acidosis"
        : "within the normal range";

  let closing: string;
  if (compensation === "Uncompensated") {
    closing = "The opposing system remains normal, so compensation has not started.";
  } else if (compensation === "Partially Compensated") {
    closing = "The opposing system is compensating, but the pH remains outside normal.";
  } else if (compensation === "Fully Compensated") {
    closing = "Both systems are abnormal and the pH has returned to the normal range.";
  } else if (disorder === "Normal") {
    closing = "All three values are within their nursing-school reference ranges.";
  } else {
    closing = "The pattern has more than one acid-base driver or is not safely classifiable.";
  }

  return {
    disorder,
    compensation,
    label: disorder === "Normal" || disorder === "Mixed Disorder"
      ? disorder
      : `${compensation} ${disorder}`,
    explanation: [
      `pH ${values.ph.toFixed(2)} is ${phState}.`,
      `PaCO₂ ${values.paco2} is ${co2Meaning}.`,
      `HCO₃⁻ ${values.hco3} is ${hco3Meaning}.`,
      closing,
    ],
  };
}

export function interpretABG(values: ABGValues): ABGInterpretation {
  if (
    !Number.isFinite(values.ph) ||
    !Number.isFinite(values.paco2) ||
    !Number.isFinite(values.hco3) ||
    values.ph < 6.8 || values.ph > 7.8 ||
    values.paco2 < 10 || values.paco2 > 100 ||
    values.hco3 < 5 || values.hco3 > 50
  ) {
    throw new Error("ABG values are outside the supported educational range");
  }

  const ph = direction(values.ph, ABG_NORMALS.ph.low, ABG_NORMALS.ph.high);
  const co2 = direction(values.paco2, ABG_NORMALS.paco2.low, ABG_NORMALS.paco2.high);
  const hco3 = direction(values.hco3, ABG_NORMALS.hco3.low, ABG_NORMALS.hco3.high);

  if (ph === "normal" && co2 === "normal" && hco3 === "normal") {
    return makeResult("Normal", "Mixed / Not Applicable", values);
  }

  if (ph === "low") {
    if (co2 === "high" && hco3 === "low") {
      return makeResult("Mixed Disorder", "Mixed / Not Applicable", values);
    }
    if (co2 === "high") {
      return makeResult(
        "Respiratory Acidosis",
        hco3 === "high" ? "Partially Compensated" : "Uncompensated",
        values,
      );
    }
    if (hco3 === "low") {
      return makeResult(
        "Metabolic Acidosis",
        co2 === "low" ? "Partially Compensated" : "Uncompensated",
        values,
      );
    }
    return makeResult("Mixed Disorder", "Mixed / Not Applicable", values);
  }

  if (ph === "high") {
    if (co2 === "low" && hco3 === "high") {
      return makeResult("Mixed Disorder", "Mixed / Not Applicable", values);
    }
    if (co2 === "low") {
      return makeResult(
        "Respiratory Alkalosis",
        hco3 === "low" ? "Partially Compensated" : "Uncompensated",
        values,
      );
    }
    if (hco3 === "high") {
      return makeResult(
        "Metabolic Alkalosis",
        co2 === "high" ? "Partially Compensated" : "Uncompensated",
        values,
      );
    }
    return makeResult("Mixed Disorder", "Mixed / Not Applicable", values);
  }

  if (values.ph === ABG_NORMALS.ph.midpoint) {
    return makeResult("Mixed Disorder", "Mixed / Not Applicable", values);
  }

  const acidSide = values.ph < ABG_NORMALS.ph.midpoint;
  if (co2 === "high" && hco3 === "high") {
    return makeResult(
      acidSide ? "Respiratory Acidosis" : "Metabolic Alkalosis",
      "Fully Compensated",
      values,
    );
  }
  if (co2 === "low" && hco3 === "low") {
    return makeResult(
      acidSide ? "Metabolic Acidosis" : "Respiratory Alkalosis",
      "Fully Compensated",
      values,
    );
  }

  return makeResult("Mixed Disorder", "Mixed / Not Applicable", values);
}
