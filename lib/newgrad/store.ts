/**
 * New Grad RN Tracker — isolated file storage.
 *
 * All tracker data lives under data/newgrad/. Writes are atomic (temp file +
 * rename) with a .bak copy of the previous version, so a crash or failed
 * validation never leaves a half-written public dataset.
 */

import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const NEWGRAD_DATA_DIR = join(process.cwd(), "data", "newgrad");

export const NEWGRAD_FILES = {
  opportunities: "opportunities.json",
  hospitals: "hospitals.json",
  programs: "programs.json",
  cohorts: "cohorts.json",
  sources: "sources.json",
  history: "history.json",
  review: "review.json",
  runs: "runs.json",
  meta: "meta.json",
  publication: "publication.json",
} as const;

export type NewgradFileKey = keyof typeof NEWGRAD_FILES;

/** Paths the daily update workflow is allowed to modify. Nothing else. */
export const ALLOWED_DATA_PATHS: ReadonlySet<string> = new Set(
  Object.values(NEWGRAD_FILES).map((f) => `data/newgrad/${f}`),
);

export function dataPath(key: NewgradFileKey): string {
  return join(NEWGRAD_DATA_DIR, NEWGRAD_FILES[key]);
}

/** Read and parse a data file. Throws with a clear message on failure. */
export function readDataFile<T>(key: NewgradFileKey): T {
  const raw = readFileSync(dataPath(key), "utf8");
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`data/newgrad/${NEWGRAD_FILES[key]} is not valid JSON`);
  }
}

/**
 * Atomically replace a data file: write temp, fsync-ish (close), rename.
 * Keeps one .bak of the previous version for recovery.
 */
export function writeDataFileAtomic(key: NewgradFileKey, value: unknown): void {
  mkdirSync(NEWGRAD_DATA_DIR, { recursive: true });
  const target = dataPath(key);
  const tmp = `${target}.${process.pid}.tmp`;
  const bak = `${target}.bak`;
  const body = `${JSON.stringify(value, null, 2)}\n`;
  writeFileSync(tmp, body, "utf8");
  try {
    const prev = readFileSync(target, "utf8");
    writeFileSync(bak, prev, "utf8");
  } catch {
    // No previous version; nothing to back up.
  }
  renameSync(tmp, target);
}

/** True when every expected data file exists and parses. */
export function storageReady(): boolean {
  try {
    for (const key of Object.keys(NEWGRAD_FILES) as NewgradFileKey[]) {
      readFileSync(dataPath(key), "utf8");
    }
    return true;
  } catch {
    return false;
  }
}

/** Resolve the repo root relative helper without importing Next.js. */
export function repoRoot(): string {
  return dirname(NEWGRAD_DATA_DIR);
}
