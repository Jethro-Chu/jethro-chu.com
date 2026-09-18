/**
 * New Grad RN Tracker — deterministic validators.
 *
 * Two validators, no dependencies:
 * - validateDataset: checks the committed JSON files before publish/render.
 * - validateBatch: structural check of an Antigravity research batch. It
 *   enforces the same rules as docs/newgrad/research-batch.schema.json
 *   (hand-written so the CLI needs no schema library).
 *
 * Research batches are untrusted input: every field is type-checked and
 * length-bounded before use.
 */

import {
  NEWGRAD_CONTRACT_VERSION,
  SPECIALTIES,
  type ApplicationStatus,
  type Dataset,
  type Eligibility,
  type FlexibleDate,
  type Opportunity,
  type VerificationHealth,
} from "./types.ts";

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

const APP_STATUSES: ReadonlySet<string> = new Set([
  "OPEN",
  "OPENING_SOON",
  "EXPECTED",
  "CLOSED",
  "UNKNOWN",
]);

const HEALTHS: ReadonlySet<string> = new Set([
  "VERIFIED",
  "TEMPORARY_FAILURE",
  "BLOCKED",
  "PARSER_FAILURE",
  "NEEDS_REVERIFICATION",
  "STALE",
]);

const ELIGIBILITIES: ReadonlySet<string> = new Set([
  "ELIGIBLE",
  "INELIGIBLE",
  "UNCERTAIN",
]);

const SPECIALTY_SET: ReadonlySet<string> = new Set(SPECIALTIES as readonly string[]);

const MAX_STRING = 2000;
const MAX_EXCERPT = 1200;
const MAX_URL = 2048;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isIsoDateTime(v: unknown): boolean {
  if (typeof v !== "string" || v.length > 64) return false;
  const t = Date.parse(v);
  return !Number.isNaN(t);
}

function push(
  issues: ValidationIssue[],
  path: string,
  message: string,
): void {
  issues.push({ path, message });
}

function checkUrl(
  issues: ValidationIssue[],
  path: string,
  v: unknown,
  allowNull: boolean,
): void {
  if (v === null && allowNull) return;
  if (typeof v !== "string" || v.length === 0 || v.length > MAX_URL) {
    push(issues, path, "must be a non-empty URL string");
    return;
  }
  let url: URL;
  try {
    url = new URL(v);
  } catch {
    push(issues, path, "must be a valid absolute URL");
    return;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    push(issues, path, "URL must use http or https");
  }
}

function checkFlexibleDate(
  issues: ValidationIssue[],
  path: string,
  v: unknown,
  allowNull: boolean,
): void {
  if (v === null && allowNull) return;
  if (!isRecord(v)) {
    push(issues, path, "must be a flexible-date object or null");
    return;
  }
  const kind = v["kind"];
  const value = v["value"];
  if (kind === "date") {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      push(issues, path, "date kind requires YYYY-MM-DD value");
    } else {
      const t = Date.parse(`${value}T00:00:00Z`);
      if (Number.isNaN(t)) push(issues, path, "invalid calendar date");
    }
  } else if (kind === "datetime") {
    if (typeof value !== "string" || !isIsoDateTime(value)) {
      push(issues, path, "datetime kind requires ISO 8601 value with timezone");
    }
  } else if (kind === "text") {
    if (
      typeof value !== "string" ||
      value.length === 0 ||
      value.length > 120
    ) {
      push(issues, path, "text kind requires a short descriptive value");
    }
  } else {
    push(issues, path, "kind must be date, datetime, or text");
  }
}

function checkEvidence(
  issues: ValidationIssue[],
  path: string,
  v: unknown,
): void {
  if (!Array.isArray(v)) {
    push(issues, path, "evidence must be an array");
    return;
  }
  v.forEach((e, i) => {
    const p = `${path}[${i}]`;
    if (!isRecord(e)) {
      push(issues, p, "evidence entry must be an object");
      return;
    }
    checkUrl(issues, `${p}.source_url`, e["source_url"], false);
    if (
      typeof e["excerpt"] !== "string" ||
      e["excerpt"].length < 10 ||
      e["excerpt"].length > MAX_EXCERPT
    ) {
      push(issues, `${p}.excerpt`, "excerpt must be 10-1200 characters");
    }
    if (!isIsoDateTime(e["retrieved_at"])) {
      push(issues, `${p}.retrieved_at`, "must be an ISO 8601 timestamp");
    }
    if (
      typeof e["claim"] !== "string" ||
      e["claim"].length === 0 ||
      e["claim"].length > 120
    ) {
      push(issues, `${p}.claim`, "claim must name the supported fact");
    }
  });
}

function checkOpportunity(issues: ValidationIssue[], o: Opportunity, i: number): void {
  const p = `opportunities[${i}]`;
  if (typeof o.id !== "string" || o.id.length === 0 || o.id.length > 200) {
    push(issues, `${p}.id`, "must be a non-empty id");
  }
  if (typeof o.hospital_id !== "string" || o.hospital_id.length === 0) {
    push(issues, `${p}.hospital_id`, "must reference a hospital");
  }
  if (
    typeof o.position_title !== "string" ||
    o.position_title.length === 0 ||
    o.position_title.length > 300
  ) {
    push(issues, `${p}.position_title`, "must be a non-empty title");
  }
  if (!Array.isArray(o.locations) || o.locations.length === 0) {
    push(issues, `${p}.locations`, "must list at least one location");
  } else {
    o.locations.forEach((l, j) => {
      if (
        !isRecord(l) ||
        typeof l["city"] !== "string" ||
        typeof l["state"] !== "string" ||
        l["city"].length === 0 ||
        (l["state"] as string).length !== 2
      ) {
        push(issues, `${p}.locations[${j}]`, "needs city and 2-letter state");
      }
    });
  }
  if (!Array.isArray(o.specialties) || o.specialties.length === 0) {
    push(issues, `${p}.specialties`, "must list at least one specialty");
  } else {
    o.specialties.forEach((s) => {
      if (!SPECIALTY_SET.has(s as string)) {
        push(issues, `${p}.specialties`, `unknown specialty: ${String(s)}`);
      }
    });
  }
  checkFlexibleDate(issues, `${p}.application_open`, o.application_open, true);
  checkFlexibleDate(issues, `${p}.application_close`, o.application_close, true);
  checkFlexibleDate(issues, `${p}.program_start`, o.program_start, true);
  if (o.source_posted_at !== null && !isIsoDateTime(o.source_posted_at)) {
    push(issues, `${p}.source_posted_at`, "must be ISO 8601 or null");
  }
  if (!APP_STATUSES.has(o.application_status as string)) {
    push(issues, `${p}.application_status`, "invalid application status");
  }
  if ((o.application_status as string) === "CLOSING_SOON") {
    push(issues, `${p}.application_status`, "CLOSING_SOON must never be stored");
  }
  if (!HEALTHS.has(o.verification_health as string)) {
    push(issues, `${p}.verification_health`, "invalid verification health");
  }
  if (!ELIGIBILITIES.has(o.eligibility as string)) {
    push(issues, `${p}.eligibility`, "invalid eligibility");
  }
  checkUrl(issues, `${p}.source_url`, o.source_url, false);
  checkUrl(issues, `${p}.application_url`, o.application_url, true);
  if (!isIsoDateTime(o.first_discovered_at)) {
    push(issues, `${p}.first_discovered_at`, "must be an ISO 8601 timestamp");
  }
  for (const f of ["last_seen_at", "last_attempted_at", "last_verified_at"] as const) {
    const val = o[f];
    if (val !== null && !isIsoDateTime(val)) {
      push(issues, `${p}.${f}`, "must be ISO 8601 or null");
    }
  }
  if (o.application_status === "CLOSED" && !o.closed_at) {
    push(issues, `${p}.closed_at`, "CLOSED records need closed_at");
  }
  checkEvidence(issues, `${p}.evidence`, o.evidence);
  if (o.evidence.length === 0) {
    push(issues, `${p}.evidence`, "published records need at least one evidence entry");
  }
}

/** Validate the full public dataset object. */
export function validateDataset(dataset: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (!isRecord(dataset)) return { ok: false, issues: [{ path: "", message: "dataset must be an object" }] };

  const meta = dataset["meta"] as Dataset["meta"] | undefined;
  if (!isRecord(meta) || meta["contract_version"] !== NEWGRAD_CONTRACT_VERSION) {
    push(issues, "meta.contract_version", `must equal ${NEWGRAD_CONTRACT_VERSION}`);
  }

  const hospitals = dataset["hospitals"];
  const hospitalIds = new Set<string>();
  if (!Array.isArray(hospitals)) {
    push(issues, "hospitals", "must be an array");
  } else {
    hospitals.forEach((h, i) => {
      if (!isRecord(h) || typeof h["id"] !== "string" || typeof h["name"] !== "string") {
        push(issues, `hospitals[${i}]`, "needs string id and name");
      } else {
        if (hospitalIds.has(h["id"])) push(issues, `hospitals[${i}].id`, "duplicate hospital id");
        hospitalIds.add(h["id"]);
      }
    });
  }

  const opps = dataset["opportunities"];
  if (!Array.isArray(opps)) {
    push(issues, "opportunities", "must be an array");
  } else {
    const ids = new Set<string>();
    const dedupKeys = new Map<string, string>();
    opps.forEach((o, i) => {
      if (!isRecord(o)) {
        push(issues, `opportunities[${i}]`, "must be an object");
        return;
      }
      checkOpportunity(issues, o as unknown as Opportunity, i);
      const id = o["id"];
      if (typeof id === "string") {
        if (ids.has(id)) push(issues, `opportunities[${i}].id`, "duplicate opportunity id");
        ids.add(id);
      }
      const hid = o["hospital_id"];
      if (typeof hid === "string" && !hospitalIds.has(hid)) {
        push(issues, `opportunities[${i}].hospital_id`, `unknown hospital: ${hid}`);
      }
      const dk = o["dedup_key"];
      if (typeof dk === "string" && dk.length > 0) {
        const prior = dedupKeys.get(dk);
        if (prior !== undefined) {
          push(issues, `opportunities[${i}].dedup_key`, `duplicate dedup key, also on ${prior}`);
        } else {
          dedupKeys.set(dk, String(id));
        }
      }
    });
  }
  return { ok: issues.length === 0, issues };
}

// ---------------------------------------------------------------------------
// Research batch validation (mirrors docs/newgrad/research-batch.schema.json)
// ---------------------------------------------------------------------------

export const BATCH_OBSERVED_STATES: ReadonlySet<string> = new Set([
  "OPEN",
  "OPENING_SOON",
  "EXPECTED",
  "CLOSED",
  "UNKNOWN",
  "NOT_FOUND",
  "FETCH_FAILED",
]);

export const BATCH_OUTCOMES: ReadonlySet<string> = new Set([
  "ok",
  "not_found",
  "temporarily_unavailable",
  "blocked",
  "parser_failure",
  "redirected_generic",
  "needs_reverification",
]);

/** Top-level shape of a research batch. Findings stay loosely typed on purpose:
 *  each field is validated individually and untrusted content is never executed. */
export interface ResearchBatch {
  schema_version: string;
  run_id: string;
  research_started_at: string;
  research_completed_at: string;
  sources_checked: Array<Record<string, unknown>>;
  findings: Array<Record<string, unknown>>;
  unresolved_items: Array<Record<string, unknown>>;
}

const RUN_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{1,127}$/;

function checkBoundedString(
  issues: ValidationIssue[],
  path: string,
  v: unknown,
  opts: { min?: number; max?: number; allowNull?: boolean; allowEmpty?: boolean } = {},
): boolean {
  const { min = 1, max = MAX_STRING, allowNull = false, allowEmpty = false } = opts;
  if (v === null || v === undefined) {
    if (allowNull) return true;
    push(issues, path, "is required");
    return false;
  }
  if (typeof v !== "string") {
    push(issues, path, "must be a string");
    return false;
  }
  if ((!allowEmpty && v.length === 0) || v.length < min || v.length > max) {
    push(issues, path, `must be ${min}-${max} characters`);
    return false;
  }
  return true;
}

function checkSourceCheck(issues: ValidationIssue[], s: unknown, i: number): void {
  const p = `sources_checked[${i}]`;
  if (!isRecord(s)) {
    push(issues, p, "must be an object");
    return;
  }
  checkBoundedString(issues, `${p}.url`, s["url"], { max: MAX_URL });
  checkUrl(issues, `${p}.url`, s["url"], false);
  if (s["source_id"] !== null && s["source_id"] !== undefined) {
    checkBoundedString(issues, `${p}.source_id`, s["source_id"], { max: 200 });
  }
  if (!isIsoDateTime(s["attempted_at"])) {
    push(issues, `${p}.attempted_at`, "must be an ISO 8601 timestamp");
  }
  if (s["retrieved_at"] !== null && s["retrieved_at"] !== undefined && !isIsoDateTime(s["retrieved_at"])) {
    push(issues, `${p}.retrieved_at`, "must be ISO 8601 or null");
  }
  if (typeof s["outcome"] !== "string" || !BATCH_OUTCOMES.has(s["outcome"])) {
    push(issues, `${p}.outcome`, `must be one of: ${[...BATCH_OUTCOMES].join(", ")}`);
  }
  if (typeof s["coverage_complete"] !== "boolean") {
    push(issues, `${p}.coverage_complete`, "must be a boolean");
  }
  if (s["error"] !== null && s["error"] !== undefined) {
    checkBoundedString(issues, `${p}.error`, s["error"], { max: 1000, allowEmpty: true });
  }
}

function checkFindingEvidence(issues: ValidationIssue[], p: string, v: unknown): void {
  if (!Array.isArray(v)) {
    push(issues, p, "finding evidence must be an array");
    return;
  }
  if (v.length > 40) push(issues, p, "at most 40 evidence entries per finding");
  checkEvidence(issues, p, v);
}

function checkFinding(issues: ValidationIssue[], f: unknown, i: number): void {
  const p = `findings[${i}]`;
  if (!isRecord(f)) {
    push(issues, p, "must be an object");
    return;
  }
  const employer = f["employer"];
  if (!isRecord(employer)) {
    push(issues, `${p}.employer`, "must be an object");
  } else {
    checkBoundedString(issues, `${p}.employer.name`, employer["name"], { max: 300 });
    if (employer["hospital_id"] !== null && employer["hospital_id"] !== undefined) {
      checkBoundedString(issues, `${p}.employer.hospital_id`, employer["hospital_id"], { max: 200 });
    }
  }
  const ids = f["identifiers"];
  if (ids !== null && ids !== undefined) {
    if (!isRecord(ids)) {
      push(issues, `${p}.identifiers`, "must be an object");
    } else {
      for (const k of ["program", "cohort", "requisition_id", "ats_provider", "ats_tenant", "opportunity_id"]) {
        if (ids[k] !== null && ids[k] !== undefined) {
          checkBoundedString(issues, `${p}.identifiers.${k}`, ids[k], { max: 300, allowEmpty: true });
        }
      }
    }
  }
  if (typeof f["observed_state"] !== "string" || !BATCH_OBSERVED_STATES.has(f["observed_state"])) {
    push(issues, `${p}.observed_state`, `must be one of: ${[...BATCH_OBSERVED_STATES].join(", ")}`);
  }
  const elig = f["eligibility"];
  if (!isRecord(elig)) {
    push(issues, `${p}.eligibility`, "must be an object");
  } else {
    if (!ELIGIBILITIES.has(elig["assessment"] as string)) {
      push(issues, `${p}.eligibility.assessment`, "must be ELIGIBLE, INELIGIBLE, or UNCERTAIN");
    }
    if (elig["note"] !== null && elig["note"] !== undefined) {
      checkBoundedString(issues, `${p}.eligibility.note`, elig["note"], { max: 1000, allowEmpty: true });
    }
  }
  if (!("facts" in f) || !isRecord(f["facts"])) {
    push(issues, `${p}.facts`, "must be an object");
  }
  if (!("evidence" in f)) {
    push(issues, `${p}.evidence`, "is required");
  } else {
    checkFindingEvidence(issues, `${p}.evidence`, f["evidence"]);
  }
  if (f["uncertainties"] !== null && f["uncertainties"] !== undefined) {
    if (!Array.isArray(f["uncertainties"])) {
      push(issues, `${p}.uncertainties`, "must be an array of strings");
    } else {
      (f["uncertainties"] as unknown[]).forEach((u, j) => {
        checkBoundedString(issues, `${p}.uncertainties[${j}]`, u, { max: 1000 });
      });
    }
  }
  // Forbid executable or filesystem-directing fields.
  for (const banned of ["command", "commands", "script", "exec", "path", "destination", "output_path", "file"]) {
    if (banned in f) push(issues, `${p}.${banned}`, "field is not allowed in research batches");
  }
}

/** Validate a parsed research batch. Returns typed batch plus issues. */
export function validateBatch(batch: unknown): {
  ok: boolean;
  issues: ValidationIssue[];
  batch: ResearchBatch | null;
} {
  const issues: ValidationIssue[] = [];
  if (!isRecord(batch)) {
    return { ok: false, issues: [{ path: "", message: "batch must be a JSON object" }], batch: null };
  }
  // No command execution or filesystem destinations, at any level we define.
  for (const banned of ["command", "commands", "script", "exec", "destination", "output_path"]) {
    if (banned in batch) push(issues, banned, "field is not allowed in research batches");
  }
  if (batch["schema_version"] !== "1.0.0") {
    push(issues, "schema_version", "must equal 1.0.0");
  }
  if (typeof batch["run_id"] !== "string" || !RUN_ID_RE.test(batch["run_id"])) {
    push(issues, "run_id", "must be 2-128 chars: letters, digits, . _ -");
  }
  if (!isIsoDateTime(batch["research_started_at"])) {
    push(issues, "research_started_at", "must be an ISO 8601 timestamp");
  }
  if (!isIsoDateTime(batch["research_completed_at"])) {
    push(issues, "research_completed_at", "must be an ISO 8601 timestamp");
  }
  if (!Array.isArray(batch["sources_checked"])) {
    push(issues, "sources_checked", "must be an array");
  } else {
    if (batch["sources_checked"].length > 500) push(issues, "sources_checked", "at most 500 source checks per batch");
    batch["sources_checked"].forEach((s, i) => checkSourceCheck(issues, s, i));
  }
  if (!Array.isArray(batch["findings"])) {
    push(issues, "findings", "must be an array");
  } else {
    if (batch["findings"].length > 500) push(issues, "findings", "at most 500 findings per batch");
    batch["findings"].forEach((f, i) => checkFinding(issues, f, i));
  }
  if (!Array.isArray(batch["unresolved_items"])) {
    push(issues, "unresolved_items", "must be an array");
  } else {
    batch["unresolved_items"].forEach((u, j) => {
      if (!isRecord(u)) {
        push(issues, `unresolved_items[${j}]`, "must be an object");
        return;
      }
      checkBoundedString(issues, `unresolved_items[${j}].description`, u["description"], { max: 1000 });
      if (u["url"] !== null && u["url"] !== undefined) {
        checkUrl(issues, `unresolved_items[${j}].url`, u["url"], true);
      }
    });
  }
  if (issues.length > 0) return { ok: false, issues, batch: null };
  return { ok: true, issues, batch: batch as unknown as ResearchBatch };
}

export type { ApplicationStatus, Eligibility, FlexibleDate, VerificationHealth };
