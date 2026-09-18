#!/usr/bin/env node
/**
 * New Grad RN Tracker — ingestion CLI.
 *
 * Usage:
 *   node --no-warnings --experimental-strip-types scripts/newgrad-ingest.ts \
 *     --batch <path-to-batch.json> [--dry-run | --apply] [--report <out.json>] [--now <iso>]
 *
 * - --dry-run (default): validate and report proposed changes; write nothing.
 * - --apply: validate, apply atomically with .bak backups, write report.
 * - --report: where to write the machine-readable JSON report (default: stdout only).
 * - --now: override the observation timestamp (ISO 8601; default: current time).
 *
 * Exit codes: 0 success (or clean dry run), 1 batch invalid, 2 store error.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { ingestBatch, type StoreSnapshot } from "../lib/newgrad/ingest.ts";
import {
  dataPath,
  readDataFile,
  writeDataFileAtomic,
} from "../lib/newgrad/store.ts";
import { validateBatch, validateDataset } from "../lib/newgrad/validate.ts";
import type {
  Cohort,
  Dataset,
  DatasetMeta,
  HistoryEvent,
  Hospital,
  Opportunity,
  Program,
  ResearchRun,
  ReviewItem,
  Source,
} from "../lib/newgrad/types.ts";

interface Args {
  batch: string | null;
  apply: boolean;
  report: string | null;
  now: string | null;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { batch: null, apply: false, report: null, now: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--batch" && i + 1 < argv.length) args.batch = argv[++i]!;
    else if (a === "--apply") args.apply = true;
    else if (a === "--dry-run") args.apply = false;
    else if (a === "--report" && i + 1 < argv.length) args.report = argv[++i]!;
    else if (a === "--now" && i + 1 < argv.length) args.now = argv[++i]!;
    else if (a === "--help" || a === "-h") {
      console.log(
        "Usage: newgrad-ingest.ts --batch <file> [--dry-run|--apply] [--report <file>] [--now <iso>]",
      );
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${a}`);
      process.exit(1);
    }
  }
  return args;
}

function fail(message: string, code: number): never {
  console.error(`newgrad-ingest: ${message}`);
  process.exit(code);
}

const args = parseArgs(process.argv.slice(2));
if (!args.batch) fail("missing required --batch <file>", 1);

let raw: string;
try {
  raw = readFileSync(args.batch!, "utf8");
} catch {
  fail(`cannot read batch file: ${args.batch}`, 1);
}
let parsed: unknown;
try {
  parsed = JSON.parse(raw!);
} catch {
  fail("batch file is not valid JSON", 1);
}

const checked = validateBatch(parsed);
if (!checked.ok || !checked.batch) {
  console.error("newgrad-ingest: batch failed validation:");
  for (const issue of checked.issues.slice(0, 40)) {
    console.error(`  ${issue.path}: ${issue.message}`);
  }
  if (checked.issues.length > 40) {
    console.error(`  ... and ${checked.issues.length - 40} more`);
  }
  fail("refusing to ingest an invalid batch; public data untouched", 1);
}

let store: StoreSnapshot;
try {
  store = {
    hospitals: readDataFile<Hospital[]>("hospitals"),
    programs: readDataFile<Program[]>("programs"),
    cohorts: readDataFile<Cohort[]>("cohorts"),
    sources: readDataFile<Source[]>("sources"),
    opportunities: readDataFile<Opportunity[]>("opportunities"),
    history: readDataFile<HistoryEvent[]>("history"),
    review: readDataFile<ReviewItem[]>("review"),
    runs: readDataFile<ResearchRun[]>("runs"),
    meta: readDataFile<DatasetMeta>("meta"),
  };
} catch (err) {
  fail(`store read failed: ${(err as Error).message}`, 2);
}

const nowIso = args.now ?? new Date().toISOString();
if (Number.isNaN(Date.parse(nowIso))) fail("--now must be ISO 8601", 1);

const { report, next } = ingestBatch(checked.batch!, store!, { nowIso });
report.dry_run = !args.apply;

if (args.apply && !report.duplicate_run) {
  // Validate the resulting public dataset BEFORE touching any files.
  const dataset: Dataset = {
    meta: next.meta,
    hospitals: next.hospitals,
    opportunities: next.opportunities,
    programs: next.programs,
    cohorts: next.cohorts,
    last_run: next.runs[next.runs.length - 1] ?? null,
    last_publication: null,
  };
  const dsCheck = validateDataset(dataset);
  if (!dsCheck.ok) {
    console.error("newgrad-ingest: resulting dataset failed validation; nothing written:");
    for (const issue of dsCheck.issues.slice(0, 40)) {
      console.error(`  ${issue.path}: ${issue.message}`);
    }
    fail("last valid public dataset preserved", 2);
  }
  try {
    writeDataFileAtomic("opportunities", next.opportunities);
    writeDataFileAtomic("programs", next.programs);
    writeDataFileAtomic("cohorts", next.cohorts);
    writeDataFileAtomic("history", next.history);
    writeDataFileAtomic("review", next.review);
    writeDataFileAtomic("runs", next.runs);
    writeDataFileAtomic("meta", next.meta);
  } catch (err) {
    fail(`atomic write failed: ${(err as Error).message}`, 2);
  }
}

const output = JSON.stringify(report, null, 2);
if (args.report) {
  writeFileSync(args.report, `${output}\n`, "utf8");
}
console.log(output);
console.error(
  args.apply
    ? `newgrad-ingest: applied run ${report.run_id} ` +
      `(data dir: ${dataPath("meta").replace(/\/meta\.json$/, "")})`
    : `newgrad-ingest: dry run for ${report.run_id}; no files written`,
);
