/**
 * Helper utilities for generating realistic clinical numbers and step calculations.
 */

// Choose a random item from an array using the provided RNG
export function pick<T>(items: T[], rng: () => number): T {
  const index = Math.floor(rng() * items.length);
  return items[Math.min(index, items.length - 1)];
}

// Random integer in [min, max] inclusive
export function randInt(min: number, max: number, rng: () => number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

// Random float with specified decimal places
export function randFloat(
  min: number,
  max: number,
  decimals: number,
  rng: () => number,
): number {
  const factor = Math.pow(10, decimals);
  const val = rng() * (max - min) + min;
  return Math.round(val * factor) / factor;
}

// Realistic adult weights in kg and lb
export const ADULT_WEIGHTS_KG = [50, 55, 60, 64, 68, 70, 72, 75, 80, 82, 85, 90, 94, 100, 105, 110, 115, 120];

// Realistic clean pound weights (divisible by 2.2 for exact kg, or realistic rounded)
export const ADULT_WEIGHTS_LB = [
  { lb: 110, kg: 50 },
  { lb: 132, kg: 60 },
  { lb: 143, kg: 65 },
  { lb: 154, kg: 70 },
  { lb: 165, kg: 75 },
  { lb: 176, kg: 80 },
  { lb: 187, kg: 85 },
  { lb: 198, kg: 90 },
  { lb: 209, kg: 95 },
  { lb: 220, kg: 100 },
  { lb: 231, kg: 105 },
  { lb: 242, kg: 110 },
  { lb: 264, kg: 120 },
];
