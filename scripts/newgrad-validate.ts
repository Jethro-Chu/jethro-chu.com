#!/usr/bin/env node
/**
 * New Grad RN Tracker — dataset validation CLI.
 *
 * Usage:
 *   node --no-warnings --experimental-strip-types scripts/newgrad-validate.ts [--json]
 *
 * Reads every committed data file, validates the public dataset plus the
 * review/runs/meta companions, and reports issues. Exit 0 when valid.
 */
import { readDataFile } from "../lib/newgrad/store.ts";
import { validateDataset } from "../lib/newgrad/validate.ts";
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

const asJson = process.argv.includes("--json");

const errors: Array<{ path: string; message: string }> = [];
function read<T>(key: Parameters<typeof readDataFile>[0]): T | null {
  try {
    return readDataFile<T>(key);
  } catch (err) {
    errors.push({ path: `data/newgrad/${key}.json`, message: (err as Error).message });
    return null;
  }
}

const hospitals = read<Hospital[]>("hospitals");
const programs = read<Program[]>("programs");
const cohorts = read<Cohort[]>("cohorts");
const opportunities = read<Opportunity[]>("opportunities");
const sources = read<Source[]>("sources");
const history = read<HistoryEvent[]>("history");
const review = read<ReviewItem[]>("review");
const runs = read<ResearchRun[]>("runs");
const meta = read<DatasetMeta>("meta");
const publication = read<{ enabled: boolean }>("publication");

if (hospitals && programs && cohorts && opportunities && meta) {
  const dataset: Dataset = {
    meta,
    hospitals,
    opportunities,
    programs,
    cohorts,
    last_run: runs && runs.length > 0 ? runs[runs.length - 1]! : null,
    last_publication: null,
  };
  const result = validateDataset(dataset);
  errors.push(...result.issues);
}

// Cross-file checks the dataset validator does not cover.
if (sources && hospitals) {
  const ids = new Set(hospitals.map((h) => h.id));
  sources.forEach((s, i) => {
    if (s.hospital_id !== null && !ids.has(s.hospital_id)) {
      errors.push({ path: `sources[${i}].hospital_id`, message: `unknown hospital: ${s.hospital_id}` });
    }
    if (!["active", "candidate", "disabled"].includes(s.status)) {
      errors.push({ path: `sources[${i}].status`, message: "must be active, candidate, or disabled" });
    }
    if (s.status === "active" && s.urls.length === 0) {
      errors.push({ path: `sources[${i}].urls`, message: "active sources need at least one verified URL" });
    }
  });
}
if (review) {
  review.forEach((r, i) => {
    if (!["PENDING", "APPROVED", "REJECTED"].includes(r.state)) {
      errors.push({ path: `review[${i}].state`, message: "invalid review state" });
    }
    if (r.state !== "PENDING" && !r.decision) {
      errors.push({ path: `review[${i}].decision`, message: "decided items need a decision record" });
    }
  });
}
if (history && opportunities) {
  const ids = new Set(opportunities.map((o) => o.id));
  history.forEach((h, i) => {
    if (!ids.has(h.opportunity_id)) {
      errors.push({ path: `history[${i}].opportunity_id`, message: `unknown opportunity: ${h.opportunity_id}` });
    }
  });
}
if (runs) {
  const seen = new Set<string>();
  runs.forEach((r, i) => {
    if (seen.has(r.run_id)) {
      errors.push({ path: `runs[${i}].run_id`, message: `duplicate run_id: ${r.run_id}` });
    }
    seen.add(r.run_id);
  });
}
if (publication && typeof publication.enabled !== "boolean") {
  errors.push({ path: "publication.enabled", message: "must be a boolean" });
}

const ok = errors.length === 0;
if (asJson) {
  console.log(JSON.stringify({ ok, issues: errors }, null, 2));
} else if (ok) {
  console.log(
    `newgrad-validate: OK (${opportunities?.length ?? 0} opportunities, ` +
      `${review?.filter((r) => r.state === "PENDING").length ?? 0} pending review)`,
  );
} else {
  console.error("newgrad-validate: FAILED");
  for (const e of errors.slice(0, 60)) console.error(`  ${e.path}: ${e.message}`);
  if (errors.length > 60) console.error(`  ... and ${errors.length - 60} more`);
}
process.exit(ok ? 0 : 1);
