import type { RoundingMode } from "./types.ts";

export function roundToMode(value: number, mode: RoundingMode): number {
  if (!Number.isFinite(value)) return 0;
  switch (mode) {
    case "whole":
    case "drop":
      return Math.round(value);
    case "tenth":
      return Math.round(value * 10) / 10;
    case "hundredth":
      return Math.round(value * 100) / 100;
    case "exact":
      return Math.round(value * 1000) / 1000;
    case "time-hours-mins":
      return Math.round(value * 10) / 10;
    default:
      return Math.round(value * 10) / 10;
  }
}

export function formatAnswer(value: number | string, mode: RoundingMode): string {
  if (typeof value === "string") return value.trim();
  if (!Number.isFinite(value)) return "0";

  switch (mode) {
    case "whole":
    case "drop":
      return String(Math.round(value));
    case "tenth": {
      const rounded = Math.round(value * 10) / 10;
      return String(rounded);
    }
    case "hundredth": {
      const rounded = Math.round(value * 100) / 100;
      return String(rounded);
    }
    case "exact": {
      // Avoid trailing zeros on exact numbers unless meaningful
      const rounded = Math.round(value * 10000) / 10000;
      return String(rounded);
    }
    case "time-hours-mins": {
      const rounded = Math.round(value * 10) / 10;
      return String(rounded);
    }
    default:
      return String(value);
  }
}

export function cleanNumericInput(input: string): number | null {
  if (!input) return null;
  const trimmed = input.trim().replace(/,/g, "");
  // If user typed fraction like "1 1/2" or "3/4"
  if (/^\d+\/\d+$/.test(trimmed)) {
    const [num, den] = trimmed.split("/").map(Number);
    if (den && den !== 0) return num / den;
  }
  const parsed = Number(trimmed);
  if (Number.isFinite(parsed)) return parsed;
  return null;
}

export function checkAnswerCorrectness({
  submitted,
  expected,
  mode,
  tolerance = 0.05,
}: {
  submitted: string;
  expected: number | string;
  mode: RoundingMode;
  tolerance?: number;
}): boolean {
  if (typeof expected === "string") {
    const subNorm = submitted.toLowerCase().trim().replace(/\s+/g, " ");
    const expNorm = expected.toLowerCase().trim().replace(/\s+/g, " ");
    if (subNorm === expNorm) return true;
    
    // Check if numeric equivalence exists
    const subNum = cleanNumericInput(subNorm);
    const expNum = cleanNumericInput(expNorm);
    if (subNum !== null && expNum !== null) {
      return Math.abs(subNum - expNum) <= tolerance;
    }
    return false;
  }

  const subNum = cleanNumericInput(submitted);
  if (subNum === null) return false;

  const expectedRounded = roundToMode(expected, mode);
  
  // If exact match with expected rounded value
  if (Math.abs(subNum - expectedRounded) < 0.0001) return true;

  // Also check if student rounded slightly differently or provided unrounded within tolerance
  const diffFromRaw = Math.abs(subNum - expected);
  if (diffFromRaw <= tolerance) return true;

  // Check tolerance against expected rounded
  const diffFromRounded = Math.abs(subNum - expectedRounded);
  if (diffFromRounded <= tolerance) return true;

  return false;
}
