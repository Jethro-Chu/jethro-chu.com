#!/usr/bin/env node
/**
 * New Grad RN Tracker — local review CLI.
 *
 * There is no web admin route (the site has no admin auth to reuse), so all
 * review happens here on the operator's machine. Every mutation writes an
 * audit trail to data/newgrad/history.json.
 *
 * Usage:
 *   newgrad-review.ts list [--state PENDING|APPROVED|REJECTED|all] [--json]
 *   newgrad-review.ts show <review_id>
 *   newgrad-review.ts approve <review_id> --by <name> --note <text>
 *   newgrad-review.ts reject <review_id> --by <name> --note <text>
 *   newgrad-review.ts correct <opp_id> <field> <json_value> --by <name> --reason <text>
 *   newgrad-review.ts unlock <opp_id> <field> --by <name> --reason <text>
 *   newgrad-review.ts source-add <hospital_id> <label> --url <u> [--url <u>...] [--shared <board>]
 *   newgrad-review.ts source-activate <source_id> --by <name>
 *   newgrad-review.ts source-disable <source_id> --by <name> --reason <text>
 *   newgrad-review.ts failed [--run <run_id>]
 *   newgrad-review.ts history <opp_id>
 *   newgrad-review.ts runs [--json]
 *
 * Notes:
 * - approve/reject record a human decision; they never auto-publish data.
 *   To fix a held finding, activate its source (next batch auto-publishes)
 *   or use `correct` to set verified values directly on the record.
 * - `correct` locks the field against future automated overwrite.
 */
import { createHash } from "node:crypto";
import { readDataFile, writeDataFileAtomic } from "../lib/newgrad/store.ts";
import type {
  HistoryEvent,
  Opportunity,
  ResearchRun,
  ReviewItem,
  Source,
} from "../lib/newgrad/types.ts";

function usage(): never {
  console.error("Usage: newgrad-review.ts <list|show|approve|reject|correct|unlock|source-add|source-activate|source-disable|failed|history|runs> [args]");
  process.exit(1);
}

function fail(message: string): never {
  console.error(`newgrad-review: ${message}`);
  process.exit(1);
}

function flag(argv: string[], name: string): string | null {
  const i = argv.indexOf(name);
  if (i === -1 || i + 1 >= argv.length) return null;
  return argv[i + 1]!;
}

function allFlags(argv: string[], name: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < argv.length - 1; i++) {
    if (argv[i] === name) out.push(argv[i + 1]!);
  }
  return out;
}

const CORRECTABLE_FIELDS = new Set([
  "position_title",
  "unit",
  "locations",
  "specialties",
  "application_open",
  "application_close",
  "program_start",
  "source_posted_at",
  "application_status",
  "verification_health",
  "eligibility",
  "bsn_required",
  "rn_license_requirement",
  "license_required_by",
  "experience_requirement",
  "source_url",
  "application_url",
]);

function validateCorrectedValue(field: string, value: unknown): string | null {
  switch (field) {
    case "application_status":
      return ["OPEN", "OPENING_SOON", "EXPECTED", "CLOSED", "UNKNOWN"].includes(value as string)
        ? null
        : "must be OPEN, OPENING_SOON, EXPECTED, CLOSED, or UNKNOWN";
    case "verification_health":
      return ["VERIFIED", "TEMPORARY_FAILURE", "BLOCKED", "PARSER_FAILURE", "NEEDS_REVERIFICATION", "STALE"].includes(value as string)
        ? null
        : "invalid verification health";
    case "eligibility":
      return ["ELIGIBLE", "INELIGIBLE", "UNCERTAIN"].includes(value as string)
        ? null
        : "must be ELIGIBLE, INELIGIBLE, or UNCERTAIN";
    case "bsn_required":
      return typeof value === "boolean" || value === null ? null : "must be true, false, or null";
    case "source_url":
    case "application_url":
      if (value === null && field === "application_url") return null;
      if (typeof value !== "string") return "must be a URL string";
      try {
        const u = new URL(value);
        return u.protocol === "https:" || u.protocol === "http:" ? null : "must use http or https";
      } catch {
        return "must be a valid absolute URL";
      }
    case "application_open":
    case "application_close":
    case "program_start":
      if (value === null) return null;
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return "must be null or a {kind,value} flexible date";
      }
      return null;
    case "locations":
    case "specialties":
      return Array.isArray(value) ? null : "must be a JSON array";
    default:
      return typeof value === "string" || value === null ? null : "must be a string or null";
  }
}

function pushHistory(
  history: HistoryEvent[],
  type: HistoryEvent["type"],
  opportunityId: string,
  reason: string,
  changes: HistoryEvent["changes"],
): void {
  history.push({
    id: `hist_manual_${createHash("sha1").update(`${Date.now()}|${opportunityId}|${reason}`).digest("hex").slice(0, 12)}`,
    run_id: null,
    at: new Date().toISOString(),
    type,
    opportunity_id: opportunityId,
    changes,
    reason,
    evidence: [],
  });
}

const [cmd, ...rest] = process.argv.slice(2);
if (!cmd) usage();

if (cmd === "list") {
  const stateFlag = flag(rest, "--state") ?? "PENDING";
  const asJson = rest.includes("--json");
  const review = readDataFile<ReviewItem[]>("review");
  const items =
    stateFlag === "all"
      ? review
      : review.filter((r) => r.state === stateFlag);
  if (asJson) {
    console.log(JSON.stringify(items, null, 2));
  } else if (items.length === 0) {
    console.log(`No ${stateFlag} review items.`);
  } else {
    for (const r of items) {
      console.log(`${r.id} [${r.state}] run=${r.run_id} created=${r.created_at}`);
      console.log(`  ${r.reason.slice(0, 300)}`);
    }
    console.log(`\n${items.length} item(s).`);
  }
} else if (cmd === "show") {
  const id = rest[0];
  if (!id) fail("show requires a review id");
  const review = readDataFile<ReviewItem[]>("review");
  const item = review.find((r) => r.id === id);
  if (!item) fail(`no review item: ${id}`);
  console.log(JSON.stringify(item, null, 2));
} else if (cmd === "approve" || cmd === "reject") {
  const id = rest[0];
  const by = flag(rest, "--by");
  const note = flag(rest, "--note");
  if (!id) fail(`${cmd} requires a review id`);
  if (!by || !note) fail(`${cmd} requires --by <name> and --note <text>`);
  const review = readDataFile<ReviewItem[]>("review");
  const item = review.find((r) => r.id === id);
  if (!item) fail(`no review item: ${id}`);
  if (item.state !== "PENDING") fail(`item ${id} is already ${item.state}`);
  item.state = cmd === "approve" ? "APPROVED" : "REJECTED";
  item.decision = { by: by!, at: new Date().toISOString(), note: note! };
  writeDataFileAtomic("review", review);
  const history = readDataFile<HistoryEvent[]>("history");
  const oppId = (item.finding as { identifiers?: { opportunity_id?: unknown } } | null)
    ?.identifiers?.opportunity_id;
  if (typeof oppId === "string") {
    pushHistory(history, "REVIEWED", oppId, `${item.state} by ${by}: ${note}`, null);
    writeDataFileAtomic("history", history);
  }
  console.log(`${item.state} ${id}`);
} else if (cmd === "correct") {
  const [oppId, field, jsonValue] = rest;
  const by = flag(rest, "--by");
  const reason = flag(rest, "--reason");
  if (!oppId || !field || jsonValue === undefined) fail("correct requires <opp_id> <field> <json_value>");
  if (!by || !reason) fail("correct requires --by <name> and --reason <text>");
  if (!CORRECTABLE_FIELDS.has(field)) {
    fail(`field "${field}" is not manually correctable (allowed: ${[...CORRECTABLE_FIELDS].join(", ")})`);
  }
  let value: unknown;
  try {
    value = JSON.parse(jsonValue!);
  } catch {
    fail("json_value must be valid JSON (quote strings, e.g. '\"OPEN\"')");
  }
  const problem = validateCorrectedValue(field!, value);
  if (problem) fail(`invalid value for ${field}: ${problem}`);
  const opportunities = readDataFile<Opportunity[]>("opportunities");
  const opp = opportunities.find((o) => o.id === oppId);
  if (!opp) fail(`no opportunity: ${oppId}`);
  const before = (opp as unknown as Record<string, unknown>)[field!];
  (opp as unknown as Record<string, unknown>)[field!] = value;
  opp.manual_overrides[field!] = { value, reason: reason!, by: by!, at: new Date().toISOString() };
  opp.updated_at = new Date().toISOString();
  writeDataFileAtomic("opportunities", opportunities);
  const history = readDataFile<HistoryEvent[]>("history");
  pushHistory(history, "CORRECTED", opp.id, `Manual correction by ${by}: ${reason}`, [
    { field: field!, before: before ?? null, after: value ?? null },
  ]);
  writeDataFileAtomic("history", history);
  console.log(`Corrected ${oppId}.${field} (locked against automated overwrite).`);
} else if (cmd === "unlock") {
  const [oppId, field] = rest;
  const by = flag(rest, "--by");
  const reason = flag(rest, "--reason");
  if (!oppId || !field) fail("unlock requires <opp_id> <field>");
  if (!by || !reason) fail("unlock requires --by <name> and --reason <text>");
  const opportunities = readDataFile<Opportunity[]>("opportunities");
  const opp = opportunities.find((o) => o.id === oppId);
  if (!opp) fail(`no opportunity: ${oppId}`);
  if (!opp.manual_overrides[field!]) fail(`field ${field} is not locked on ${oppId}`);
  delete opp.manual_overrides[field!];
  opp.updated_at = new Date().toISOString();
  writeDataFileAtomic("opportunities", opportunities);
  const history = readDataFile<HistoryEvent[]>("history");
  pushHistory(history, "CORRECTED", opp.id, `Lock removed from ${field} by ${by}: ${reason}`, null);
  writeDataFileAtomic("history", history);
  console.log(`Unlocked ${oppId}.${field}.`);
} else if (cmd === "source-add") {
  const [hospitalId, ...labelParts] = rest.filter((t) => !t.startsWith("--") && rest[rest.indexOf(t) - 1] !== "--url" && rest[rest.indexOf(t) - 1] !== "--shared");
  const urls = allFlags(rest, "--url");
  const shared = flag(rest, "--shared");
  if (!hospitalId || labelParts.length === 0) fail("source-add requires <hospital_id> <label> [--url ...] [--shared <board>]");
  for (const u of urls) {
    try {
      const parsed = new URL(u);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") fail(`URL must use http/https: ${u}`);
    } catch {
      fail(`invalid URL: ${u}`);
    }
  }
  const sources = readDataFile<Source[]>("sources");
  const id = `src_${createHash("sha1").update(`${hospitalId}|${labelParts.join(" ")}`).digest("hex").slice(0, 10)}`;
  if (sources.some((s) => s.id === id)) fail(`source already exists: ${id}`);
  sources.push({
    id,
    hospital_id: hospitalId!,
    label: labelParts.join(" "),
    urls,
    status: urls.length > 0 ? "active" : "candidate",
    shared_board: shared,
    notes: null,
  });
  writeDataFileAtomic("sources", sources);
  console.log(`Added source ${id} (${urls.length > 0 ? "active" : "candidate"}).`);
} else if (cmd === "source-activate" || cmd === "source-disable") {
  const id = rest[0];
  const by = flag(rest, "--by");
  const reason = flag(rest, "--reason");
  if (!id) fail(`${cmd} requires a source id`);
  if (!by) fail(`${cmd} requires --by <name>`);
  if (cmd === "source-disable" && !reason) fail("source-disable requires --reason <text>");
  const sources = readDataFile<Source[]>("sources");
  const src = sources.find((s) => s.id === id);
  if (!src) fail(`no source: ${id}`);
  if (cmd === "source-activate") {
    if (src.urls.length === 0) fail("cannot activate a source with no verified URLs");
    src.status = "active";
    src.notes = `Activated by ${by}`;
  } else {
    src.status = "disabled";
    src.notes = `Disabled by ${by}: ${reason}`;
  }
  writeDataFileAtomic("sources", sources);
  console.log(`${cmd === "source-activate" ? "Activated" : "Disabled"} source ${id}.`);
} else if (cmd === "failed") {
  const runFilter = flag(rest, "--run");
  const runs = readDataFile<ResearchRun[]>("runs");
  const picked = runFilter ? runs.filter((r) => r.run_id === runFilter) : runs.slice(-5);
  if (picked.length === 0) {
    console.log("No runs recorded yet.");
  } else {
    for (const r of picked) {
      console.log(`run ${r.run_id}: ${r.sources_ok}/${r.sources_checked} sources ok, ingested ${r.ingested_at}`);
      for (const f of r.failed_checks) {
        console.log(`  [${f.outcome}] ${f.url}${f.error ? ` — ${f.error.slice(0, 200)}` : ""}`);
      }
    }
  }
} else if (cmd === "history") {
  const oppId = rest[0];
  if (!oppId) fail("history requires an opportunity id");
  const history = readDataFile<HistoryEvent[]>("history");
  const events = history.filter((h) => h.opportunity_id === oppId);
  if (events.length === 0) {
    console.log(`No history for ${oppId}.`);
  } else {
    console.log(JSON.stringify(events, null, 2));
  }
} else if (cmd === "runs") {
  const asJson = rest.includes("--json");
  const runs = readDataFile<ResearchRun[]>("runs");
  if (asJson) {
    console.log(JSON.stringify(runs, null, 2));
  } else if (runs.length === 0) {
    console.log("No research runs recorded yet.");
  } else {
    for (const r of runs.slice(-10)) {
      console.log(
        `${r.run_id} | checked=${r.sources_checked} ok=${r.sources_ok} ` +
          `+${r.published}/~${r.updated}/x${r.closed}/?${r.pending_review}/-${r.rejected}`,
      );
    }
  }
} else {
  usage();
}
