/**
 * New Grad RN Tracker — deterministic ingestion engine.
 *
 * Pure logic: ingestBatch() takes a validated research batch plus the current
 * store snapshot and returns a proposed report plus the new store snapshot.
 * The CLI decides whether to persist (apply) or discard (dry run).
 *
 * Safety rules enforced here:
 * - Reprocessing a run_id is a no-op (idempotent; no duplicate history).
 * - Retrieval failures never close records and never advance last_verified_at.
 * - Null/omitted facts never overwrite known values.
 * - Locked (manually corrected) fields are never overwritten; conflicts go to
 *   review with the stored value kept.
 * - Fuzzy matches flag possible duplicates; they never merge records.
 * - Status, eligibility, and closure each require supporting evidence.
 */

import { createHash } from "node:crypto";
import { isDeadlinePassed } from "./status.ts";
import type {
  ApplicationStatus,
  Cohort,
  DatasetMeta,
  Eligibility,
  Evidence,
  FlexibleDate,
  HistoryEvent,
  HistoryEventType,
  Hospital,
  Location,
  Opportunity,
  Program,
  ResearchRun,
  ReviewItem,
  Source,
  SourceCheckReceipt,
  Specialty,
  VerificationHealth,
} from "./types.ts";
import { SPECIALTIES } from "./types.ts";
import type { ResearchBatch } from "./validate.ts";

/** Claim vocabulary mapping to opportunity fields. */
const CLAIM_TO_FIELD: Record<string, string> = {
  status: "application_status",
  accepting_applications: "application_status",
  closure: "application_status",
  removal: "application_status",
  opening_date: "application_open",
  deadline: "application_close",
  start_date: "program_start",
  eligibility: "eligibility",
  experience: "experience_requirement",
  license: "rn_license_requirement",
  license_timing: "license_required_by",
  education: "bsn_required",
  title: "position_title",
  unit: "unit",
  location: "locations",
  specialty: "specialties",
};

const STATUS_CLAIMS: ReadonlySet<string> = new Set([
  "status",
  "accepting_applications",
  "closure",
  "removal",
  "opening_date",
  "deadline",
]);

/**
 * Phrases that count as explicit new-grad acceptance in an eligibility
 * excerpt. Deliberately narrow: titles like "RN I" or "resident" alone never
 * qualify. Case-insensitive substring match.
 */
export const NEWGRAD_ELIGIBILITY_PHRASES = [
  "new grad",
  "newly licensed",
  "new graduate",
  "new nursing graduate",
  "recent graduate",
  "no experience",
  "no previous experience",
  "no prior experience",
  "no rn experience",
  "0 years of experience",
  "0-1 year",
  "less than 1 year",
  "less than one year",
  "accepting new grads",
  "new grads welcome",
  "new grad rn",
];

/** Query params stripped during URL normalization (tracking only). */
const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "igshid",
];

/** Hosts that are never official evidence, even if linked somewhere. */
const AGGREGATOR_HOSTS = [
  "indeed.com",
  "glassdoor.com",
  "linkedin.com",
  "ziprecruiter.com",
  "monster.com",
  "simplyhired.com",
  "nurse.com",
  "nursely.com",
  "google.com",
  "bing.com",
  "duckduckgo.com",
];

/** Snapshot of every store file the engine reads or writes. */
export interface StoreSnapshot {
  hospitals: Hospital[];
  programs: Program[];
  cohorts: Cohort[];
  sources: Source[];
  opportunities: Opportunity[];
  history: HistoryEvent[];
  review: ReviewItem[];
  runs: ResearchRun[];
  meta: DatasetMeta;
}

export interface ReportChange {
  opportunity_id: string;
  changes: Array<{ field: string; before: unknown; after: unknown }>;
}

export interface ReportPending {
  review_id: string;
  reason: string;
  opportunity_id: string | null;
  finding_index: number;
}

export interface IngestReport {
  run_id: string;
  dry_run: boolean;
  duplicate_run: boolean;
  counts: {
    findings: number;
    created: number;
    updated: number;
    closed: number;
    reopened: number;
    unavailable_marked: number;
    pending_review: number;
    rejected: number;
  };
  created: string[];
  updated: ReportChange[];
  closed: string[];
  reopened: string[];
  pending_review: ReportPending[];
  rejected: Array<{ finding_index: number; reason: string }>;
  duplicate_flags: Array<{ opportunity_id: string; candidate_ids: string[] }>;
  deadline_sweep_closed: string[];
  failed_checks: SourceCheckReceipt[];
  notes: string[];
}

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------

function normStr(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

/** Conservative URL normalization; preserves job-identifying parameters. */
export function normalizeUrl(raw: string): string {
  const url = new URL(raw);
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();
  if (
    (url.protocol === "https:" && url.port === "443") ||
    (url.protocol === "http:" && url.port === "80")
  ) {
    url.port = "";
  }
  for (const p of TRACKING_PARAMS) url.searchParams.delete(p);
  let out = url.toString();
  if ((url.pathname === "/" || url.pathname === "") && !url.search && !url.hash) {
    out = `${url.protocol}//${url.host}/`;
  }
  return out;
}

function hostOf(raw: string): string | null {
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isAggregatorHost(host: string): boolean {
  return AGGREGATOR_HOSTS.some(
    (a) => host === a || host.endsWith(`.${a}`),
  );
}

/** Deterministic date parsing that preserves source precision. */
export function parseFactDate(v: unknown): FlexibleDate | null | "invalid" {
  if (v === null || v === undefined) return null;
  if (typeof v === "object" && !Array.isArray(v)) {
    const r = v as Record<string, unknown>;
    if (
      (r["kind"] === "date" || r["kind"] === "datetime" || r["kind"] === "text") &&
      typeof r["value"] === "string"
    ) {
      const kind = r["kind"] as FlexibleDate["kind"];
      const value = (r["value"] as string).trim();
      if (kind === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "invalid";
      if (kind === "date" && Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
        return "invalid";
      }
      if (kind === "datetime" && Number.isNaN(Date.parse(value))) return "invalid";
      if (kind === "text" && value.length === 0) return "invalid";
      return { kind, value };
    }
    return "invalid";
  }
  if (typeof v === "string") {
    const t = v.trim();
    if (!t) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
      return Number.isNaN(Date.parse(`${t}T00:00:00Z`))
        ? { kind: "text", value: t }
        : { kind: "date", value: t };
    }
    const ms = Date.parse(t);
    if (!Number.isNaN(ms) && /[T ]\d{2}:\d{2}/.test(t)) {
      return { kind: "datetime", value: new Date(ms).toISOString() };
    }
    return { kind: "text", value: t.length > 120 ? t.slice(0, 120) : t };
  }
  return "invalid";
}

function sameFlexibleDate(
  a: FlexibleDate | null,
  b: FlexibleDate | null,
): boolean {
  if (a === null || b === null) return a === b;
  return a.kind === b.kind && a.value === b.value;
}

function normalizeSpecialties(v: unknown, notes: string[]): Specialty[] | "invalid" {
  if (!Array.isArray(v)) return "invalid";
  const out: Specialty[] = [];
  const vocab = new Set<string>(SPECIALTIES as readonly string[]);
  for (const s of v) {
    if (typeof s !== "string") return "invalid";
    const t = s.trim();
    if (!t) continue;
    // Case-insensitive match against the closed vocabulary.
    const hit = (SPECIALTIES as readonly string[]).find(
      (c) => c.toLowerCase() === t.toLowerCase(),
    );
    if (hit) {
      if (!out.includes(hit as Specialty)) out.push(hit as Specialty);
    } else {
      notes.push(`Unlisted specialty "${t.slice(0, 80)}" mapped to Unknown.`);
      if (!out.includes("Unknown")) out.push("Unknown");
    }
  }
  return out;
}

function normalizeLocations(v: unknown): Location[] | "invalid" {
  if (!Array.isArray(v)) return "invalid";
  const out: Location[] = [];
  for (const l of v) {
    if (typeof l !== "object" || l === null || Array.isArray(l)) return "invalid";
    const r = l as Record<string, unknown>;
    const city = normStr(r["city"]);
    const state = normStr(r["state"]);
    if (!city || !state || state.length !== 2) return "invalid";
    out.push({ city, state: state.toUpperCase() });
  }
  return out;
}

function shortHash(input: string): string {
  return createHash("sha1").update(input).digest("hex").slice(0, 10);
}

function titleTokens(title: string): Set<string> {
  const stop = new Set([
    "rn", "r", "n", "i", "ii", "the", "a", "an", "and", "or", "for", "of", "at",
    "new", "grad", "graduate", "residency", "resident", "program", "nurse",
    "nursing", "registered", "full", "time", "part",
  ]);
  const toks = title
    .toLowerCase()
    .split(/[^a-z0-9&]+/)
    .filter((t) => t.length > 1 && !stop.has(t));
  return new Set(toks);
}

/** Jaccard similarity over significant title tokens. */
function titleSimilarity(a: string, b: string): number {
  const ta = titleTokens(a);
  const tb = titleTokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / (ta.size + tb.size - inter);
}

function excerptHasNewgradLanguage(excerpt: string): boolean {
  const low = excerpt.toLowerCase();
  return NEWGRAD_ELIGIBILITY_PHRASES.some((p) => low.includes(p));
}

// ---------------------------------------------------------------------------
// Store lookups
// ---------------------------------------------------------------------------

function findHospital(
  hospitals: Hospital[],
  hospitalId: string | null,
  employerName: string | null,
): Hospital | null {
  if (hospitalId) {
    const hit = hospitals.find((h) => h.id === hospitalId);
    if (hit) return hit;
  }
  if (employerName) {
    const low = employerName.toLowerCase();
    const hit = hospitals.find(
      (h) =>
        h.name.toLowerCase() === low ||
        h.aliases.some((a) => a.toLowerCase() === low),
    );
    if (hit) return hit;
  }
  return null;
}

/** Hosts of a hospital's ACTIVE official sources (incl. shared boards). */
function officialHostsFor(sources: Source[], hospitalId: string): Set<string> {
  const hosts = new Set<string>();
  for (const s of sources) {
    if (s.status !== "active") continue;
    if (s.hospital_id !== null && s.hospital_id !== hospitalId) continue;
    for (const u of s.urls) {
      const h = hostOf(u);
      if (h) hosts.add(h);
    }
  }
  return hosts;
}

function buildDedupKey(
  provider: string | null,
  tenant: string | null,
  reqId: string | null,
): string | null {
  if (!provider || !reqId) return null;
  const t = tenant ?? "";
  return `${provider.toLowerCase()}|${t.toLowerCase()}|${reqId.toLowerCase()}`;
}

// ---------------------------------------------------------------------------
// Main ingestion
// ---------------------------------------------------------------------------

let reviewCounter = 0;
let historyCounter = 0;

function nextReviewId(runId: string): string {
  reviewCounter += 1;
  return `rev_${runId}_${String(reviewCounter).padStart(3, "0")}`.slice(0, 120);
}

function nextHistoryId(runId: string): string {
  historyCounter += 1;
  return `hist_${runId}_${String(historyCounter).padStart(4, "0")}`.slice(0, 120);
}

export interface IngestOptions {
  nowIso: string;
}

/**
 * Run ingestion against a snapshot. Returns the report and the NEW snapshot;
 * the caller persists it only when applying (dry run discards it).
 */
export function ingestBatch(
  batch: ResearchBatch,
  store: StoreSnapshot,
  opts: IngestOptions,
): { report: IngestReport; next: StoreSnapshot } {
  reviewCounter = 0;
  historyCounter = 0;
  const nowMs = Date.parse(opts.nowIso);

  // Deep-clone the arrays we may mutate so dry runs cannot leak.
  const next: StoreSnapshot = {
    hospitals: store.hospitals,
    programs: [...store.programs],
    cohorts: [...store.cohorts],
    sources: store.sources,
    opportunities: store.opportunities.map((o) => ({
      ...o,
      locations: o.locations.map((l) => ({ ...l })),
      specialties: [...o.specialties],
      evidence: o.evidence.map((e) => ({ ...e })),
      manual_overrides: { ...o.manual_overrides },
    })),
    history: [...store.history],
    review: [...store.review],
    runs: [...store.runs],
    meta: { ...store.meta, counts: { ...store.meta.counts } },
  };

  const report: IngestReport = {
    run_id: batch.run_id,
    dry_run: false,
    duplicate_run: false,
    counts: {
      findings: batch.findings.length,
      created: 0,
      updated: 0,
      closed: 0,
      reopened: 0,
      unavailable_marked: 0,
      pending_review: 0,
      rejected: 0,
    },
    created: [],
    updated: [],
    closed: [],
    reopened: [],
    pending_review: [],
    rejected: [],
    duplicate_flags: [],
    deadline_sweep_closed: [],
    failed_checks: [],
    notes: [],
  };

  // Idempotency: a run_id that already ingested is a no-op.
  if (next.runs.some((r) => r.run_id === batch.run_id)) {
    report.duplicate_run = true;
    report.notes.push(`run_id ${batch.run_id} was already ingested; no changes made.`);
    return { report, next: store };
  }

  const runStartedAt = batch.research_started_at;
  const runCompletedAt = batch.research_completed_at;

  // Record failed source checks (informational; never closes anything).
  let sourcesOk = 0;
  for (const s of batch.sources_checked) {
    const outcome = s["outcome"] as string;
    if (outcome === "ok") {
      sourcesOk += 1;
    } else {
      report.failed_checks.push({
        source_id:
          typeof s["source_id"] === "string" ? (s["source_id"] as string) : null,
        url: String(s["url"] ?? ""),
        attempted_at: String(s["attempted_at"] ?? runCompletedAt),
        retrieved_at:
          typeof s["retrieved_at"] === "string"
            ? (s["retrieved_at"] as string)
            : null,
        outcome,
        coverage_complete: s["coverage_complete"] === true,
        error:
          typeof s["error"] === "string" ? (s["error"] as string) : null,
      });
    }
  }

  const pushHistory = (
    type: HistoryEventType,
    opportunityId: string,
    reason: string | null,
    changes: ReportChange["changes"] | null,
    evidence: Evidence[],
  ): void => {
    next.history.push({
      id: nextHistoryId(batch.run_id),
      run_id: batch.run_id,
      at: opts.nowIso,
      type,
      opportunity_id: opportunityId,
      changes,
      reason,
      evidence: evidence.slice(0, 10),
    });
  };

  const pushReview = (
    finding: unknown,
    findingIndex: number,
    reason: string,
    opportunityId: string | null,
  ): void => {
    const id = nextReviewId(batch.run_id);
    next.review.push({
      id,
      run_id: batch.run_id,
      created_at: opts.nowIso,
      state: "PENDING",
      reason,
      finding,
      decision: null,
    });
    report.pending_review.push({
      review_id: id,
      reason,
      opportunity_id: opportunityId,
      finding_index: findingIndex,
    });
    report.counts.pending_review += 1;
  };

  batch.findings.forEach((finding, findingIndex) => {
    processFinding(
      finding,
      findingIndex,
      batch,
      next,
      report,
      opts.nowIso,
      nowMs,
      pushHistory,
      pushReview,
    );
  });

  // Deadline sweep: OPEN records with a confirmed passed deadline are stored
  // CLOSED. This is deterministic from already-evidenced facts, not new claims.
  for (const opp of next.opportunities) {
    if (
      opp.application_status === "OPEN" &&
      opp.application_close !== null &&
      isDeadlinePassed(opp.application_close, nowMs)
    ) {
      opp.application_status = "CLOSED";
      opp.closed_at = opts.nowIso;
      opp.closure_reason = "deadline_passed";
      opp.updated_at = opts.nowIso;
      report.deadline_sweep_closed.push(opp.id);
      pushHistory("CLOSED", opp.id, "Confirmed deadline passed (ingest sweep).", [
        { field: "application_status", before: "OPEN", after: "CLOSED" },
      ], []);
    }
  }

  // Runs log + freshness meta.
  const lastVerified = latestTimestamp(
    next.opportunities.map((o) => o.last_verified_at),
  );
  next.runs.push({
    run_id: batch.run_id,
    research_started_at: runStartedAt,
    research_completed_at: runCompletedAt,
    ingested_at: opts.nowIso,
    sources_checked: batch.sources_checked.length,
    sources_ok: sourcesOk,
    findings_received: batch.findings.length,
    published: report.counts.created,
    updated: report.counts.updated,
    closed: report.counts.closed + report.deadline_sweep_closed.length,
    pending_review: report.counts.pending_review,
    rejected: report.counts.rejected,
    failed_checks: report.failed_checks,
  });

  next.meta = {
    contract_version: next.meta.contract_version,
    generated_at: opts.nowIso,
    last_research_attempt_at: runCompletedAt,
    last_successful_verification_at:
      lastVerified ?? next.meta.last_successful_verification_at,
    last_published_at: next.meta.last_published_at,
    counts: {
      opportunities: next.opportunities.length,
      open: next.opportunities.filter((o) => o.application_status === "OPEN").length,
      closing_soon: 0, // derived at render time; see status.ts
      pending_review: next.review.filter((r) => r.state === "PENDING").length,
      sources_active: next.sources.filter((s) => s.status === "active").length,
      sources_candidate: next.sources.filter((s) => s.status === "candidate").length,
    },
    coverage_note:
      batch.sources_checked.length === 0
        ? "No sources were checked in the latest run."
        : `${sourcesOk} of ${batch.sources_checked.length} checked sources verified successfully in run ${batch.run_id}.`,
  };

  return { report, next };
}

function latestTimestamp(values: Array<string | null>): string | null {
  let best: string | null = null;
  let bestMs = -1;
  for (const v of values) {
    if (!v) continue;
    const ms = Date.parse(v);
    if (!Number.isNaN(ms) && ms > bestMs) {
      bestMs = ms;
      best = v;
    }
  }
  return best;
}

type HistoryFn = (
  type: HistoryEventType,
  opportunityId: string,
  reason: string | null,
  changes: ReportChange["changes"] | null,
  evidence: Evidence[],
) => void;

type ReviewFn = (
  finding: unknown,
  findingIndex: number,
  reason: string,
  opportunityId: string | null,
) => void;

function asRecord(v: unknown): Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

function processFinding(
  finding: Record<string, unknown>,
  findingIndex: number,
  batch: ResearchBatch,
  next: StoreSnapshot,
  report: IngestReport,
  nowIso: string,
  nowMs: number,
  pushHistory: HistoryFn,
  pushReview: ReviewFn,
): void {
  void batch;
  void nowMs;
  const employer = asRecord(finding["employer"]);
  const identifiers = asRecord(finding["identifiers"]);
  const facts = asRecord(finding["facts"]);
  const eligibility = asRecord(finding["eligibility"]);
  const observedState = finding["observed_state"] as string;
  const evidence = (Array.isArray(finding["evidence"]) ? finding["evidence"] : []) as Evidence[];

  const employerName = normStr(employer["name"]);
  const employerHospitalId = normStr(employer["hospital_id"]);
  const hospital = findHospital(next.hospitals, employerHospitalId, employerName);

  if (!hospital) {
    pushReview(
      finding,
      findingIndex,
      `Unresolved employer "${(employerName ?? employerHospitalId ?? "unknown").slice(0, 120)}": no matching hospital record.`,
      null,
    );
    return;
  }

  // Official-source gate: at least one evidence URL must come from one of the
  // hospital's active official hosts. Aggregators can never qualify.
  const officialHosts = officialHostsFor(next.sources, hospital.id);
  let officialEvidence: Evidence[] = [];
  let aggregatorOnly = false;
  if (evidence.length > 0) {
    const nonAggregator = evidence.filter((e) => {
      const h = hostOf(e.source_url);
      return h !== null && !isAggregatorHost(h);
    });
    aggregatorOnly = nonAggregator.length === 0;
    officialEvidence =
      officialHosts.size === 0
        ? []
        : nonAggregator.filter((e) => {
            const h = hostOf(e.source_url);
            return h !== null && officialHosts.has(h);
          });
  }

  // Retrieval-failure states update health only, never status or verification.
  if (observedState === "FETCH_FAILED" || observedState === "NOT_FOUND") {
    const target = matchOpportunity(next, identifiers, facts, hospital.id);
    if (!target) {
      report.notes.push(
        `Finding ${findingIndex} (${observedState}) matched no record; recorded as note only.`,
      );
      return;
    }
    const health: VerificationHealth =
      observedState === "NOT_FOUND" ? "NEEDS_REVERIFICATION" : "TEMPORARY_FAILURE";
    target.last_attempted_at = nowIso;
    if (target.verification_health !== health) {
      const before = target.verification_health;
      target.verification_health = health;
      target.updated_at = nowIso;
      pushHistory(
        "SOURCE_UNAVAILABLE",
        target.id,
        `Retrieval ${observedState === "NOT_FOUND" ? "found no posting" : "failed"}; last-known facts preserved.`,
        [{ field: "verification_health", before, after: health }],
        [],
      );
    }
    report.counts.unavailable_marked += 1;
    return;
  }

  // Publication facts require official evidence (unless hospital has no active
  // sources yet, in which case everything waits for review, not auto-publish).
  if (officialEvidence.length === 0) {
    const reason = aggregatorOnly
      ? "Evidence comes only from third-party aggregators; official hospital or ATS evidence required."
      : officialHosts.size === 0
        ? `No active official sources on file for ${hospital.name}; finding held for review until sources are verified.`
        : "No evidence URL matches an active official source for this employer.";
    pushReview(finding, findingIndex, reason, matchOpportunity(next, identifiers, facts, hospital.id)?.id ?? null);
    return;
  }

  // Eligibility gate.
  const assessment = eligibility["assessment"] as Eligibility;
  if (assessment === "INELIGIBLE") {
    const target = matchOpportunity(next, identifiers, facts, hospital.id);
    if (target && target.eligibility !== "INELIGIBLE") {
      const before = target.eligibility;
      target.eligibility = "INELIGIBLE";
      target.last_verified_at = nowIso;
      target.last_seen_at = nowIso;
      target.verification_health = "VERIFIED";
      target.updated_at = nowIso;
      mergeEvidence(target, officialEvidence);
      pushHistory("UPDATED", target.id, "Source evidence shows experienced-only requirements.", [
        { field: "eligibility", before, after: "INELIGIBLE" },
      ], officialEvidence);
      report.counts.updated += 1;
      report.updated.push({
        opportunity_id: target.id,
        changes: [{ field: "eligibility", before, after: "INELIGIBLE" }],
      });
    } else {
      report.rejected.push({ finding_index: findingIndex, reason: "Assessed INELIGIBLE with no matching published record." });
      report.counts.rejected += 1;
    }
    return;
  }

  const eligibilityEvidence = officialEvidence.filter((e) => e.claim === "eligibility");
  const hasExplicitLanguage = eligibilityEvidence.some((e) =>
    excerptHasNewgradLanguage(e.excerpt),
  );
  if (assessment !== "ELIGIBLE" || !hasExplicitLanguage) {
    const why =
      assessment !== "ELIGIBLE"
        ? `Eligibility assessed ${assessment}; explicit new-grad evidence required for auto-publish.`
        : "Eligibility evidence lacks explicit new-grad acceptance language; held for human review.";
    pushReview(finding, findingIndex, why, matchOpportunity(next, identifiers, facts, hospital.id)?.id ?? null);
    return;
  }

  // Status evidence requirements per asserted state.
  const statusEvidence = officialEvidence.filter((e) => STATUS_CLAIMS.has(e.claim));
  const needStatusEvidence =
    observedState === "OPEN" ||
    observedState === "OPENING_SOON" ||
    observedState === "CLOSED";
  if (needStatusEvidence && statusEvidence.length === 0) {
    pushReview(
      finding,
      findingIndex,
      `Observed state ${observedState} has no status-claim evidence from an official source.`,
      matchOpportunity(next, identifiers, facts, hospital.id)?.id ?? null,
    );
    return;
  }

  // Normalize facts.
  const notes: string[] = [];
  const title = normStr(facts["position_title"]);
  const sourceUrlRaw = normStr(facts["source_url"]);
  if (!title || !sourceUrlRaw) {
    pushReview(finding, findingIndex, "Finding is missing a position title or source URL.", null);
    return;
  }
  let sourceUrl: string;
  try {
    sourceUrl = normalizeUrl(sourceUrlRaw);
  } catch {
    pushReview(finding, findingIndex, "Finding source URL is not a valid absolute URL.", null);
    return;
  }

  const locations = facts["locations"] === undefined ? null : normalizeLocations(facts["locations"]);
  if (locations === "invalid") {
    report.rejected.push({ finding_index: findingIndex, reason: "Invalid locations shape." });
    report.counts.rejected += 1;
    return;
  }
  const specialtiesRaw =
    facts["specialties"] === undefined ? null : normalizeSpecialties(facts["specialties"], notes);
  if (specialtiesRaw === "invalid") {
    report.rejected.push({ finding_index: findingIndex, reason: "Invalid specialties shape." });
    report.counts.rejected += 1;
    return;
  }
  const openDate = facts["application_open"] === undefined ? null : parseFactDate(facts["application_open"]);
  const closeDate = facts["application_close"] === undefined ? null : parseFactDate(facts["application_close"]);
  const startDate = facts["program_start"] === undefined ? null : parseFactDate(facts["program_start"]);
  if (openDate === "invalid" || closeDate === "invalid" || startDate === "invalid") {
    report.rejected.push({ finding_index: findingIndex, reason: "Unparseable date fact; supported dates must be {kind,value} or ISO/text." });
    report.counts.rejected += 1;
    return;
  }
  // An opening date in the past with OPENING_SOON asserted is a contradiction.
  if (observedState === "OPENING_SOON" && openDate && openDate.kind !== "text") {
    const instant =
      openDate.kind === "datetime"
        ? Date.parse(openDate.value)
        : Date.parse(`${openDate.value}T00:00:00Z`);
    if (!Number.isNaN(instant) && instant < nowMs) {
      pushReview(
        finding,
        findingIndex,
        "OPENING_SOON asserted but the opening date already passed; a current check is required before publishing.",
        matchOpportunity(next, identifiers, facts, hospital.id)?.id ?? null,
      );
      return;
    }
  }

  const provider = normStr(identifiers["ats_provider"]);
  const tenant = normStr(identifiers["ats_tenant"]) ?? normStr(identifiers["employer_tenant"]);
  const reqId = normStr(identifiers["requisition_id"]);
  const dedupKey = buildDedupKey(provider, tenant, reqId);
  const explicitOppId = normStr(identifiers["opportunity_id"]);

  let target: Opportunity | null = null;
  if (explicitOppId) {
    target = next.opportunities.find((o) => o.id === explicitOppId) ?? null;
  }
  if (!target && dedupKey) {
    target = next.opportunities.find((o) => o.dedup_key === dedupKey) ?? null;
  }
  if (!target && !dedupKey) {
    // Weak identity: exact normalized source URL match only; fuzzy never merges.
    target = next.opportunities.find((o) => {
      try {
        return normalizeUrl(o.source_url) === sourceUrl && o.hospital_id === hospital.id;
      } catch {
        return false;
      }
    }) ?? null;
  }

  // Fuzzy duplicate flagging (never merges).
  const fuzzyCandidates = next.opportunities.filter(
    (o) =>
      o.hospital_id === hospital.id &&
      (!target || o.id !== target.id) &&
      titleSimilarity(o.position_title, title) >= 0.6,
  );
  if (!target && fuzzyCandidates.length > 0) {
    pushReview(
      finding,
      findingIndex,
      "Possible duplicate of an existing record (closely matching title); held for human decision instead of auto-creating.",
      fuzzyCandidates[0]?.id ?? null,
    );
    report.duplicate_flags.push({
      opportunity_id: "(new)",
      candidate_ids: fuzzyCandidates.map((o) => o.id),
    });
    return;
  }
  if (target && fuzzyCandidates.length > 0) {
    report.duplicate_flags.push({
      opportunity_id: target.id,
      candidate_ids: fuzzyCandidates.map((o) => o.id),
    });
  }
  for (const n of notes) report.notes.push(`Finding ${findingIndex}: ${n}`);

  // Program/cohort linkage (shells created only from explicit identifiers).
  const programName = normStr(identifiers["program"]);
  const cohortLabel = normStr(identifiers["cohort"]);
  let programId: string | null = target?.program_id ?? null;
  let cohortId: string | null = target?.cohort_id ?? null;
  if (programName) {
    let program = next.programs.find(
      (p) => p.hospital_id === hospital.id && p.name.toLowerCase() === programName.toLowerCase(),
    );
    if (!program) {
      program = {
        id: `prog_${shortHash(`${hospital.id}|${programName.toLowerCase()}`)}`,
        hospital_id: hospital.id,
        name: programName,
        source_url: sourceUrl,
      };
      next.programs.push(program);
    }
    programId = program.id;
    if (cohortLabel) {
      let cohort = next.cohorts.find(
        (c) => c.program_id === program!.id && c.label.toLowerCase() === cohortLabel.toLowerCase(),
      );
      if (!cohort) {
        cohort = {
          id: `cohort_${shortHash(`${program!.id}|${cohortLabel.toLowerCase()}`)}`,
          program_id: program!.id,
          label: cohortLabel,
          program_start: startDate,
        };
        next.cohorts.push(cohort);
      }
      cohortId = cohort.id;
    }
  }

  const statusFor = (observed: string): ApplicationStatus =>
    observed === "OPEN" ||
    observed === "OPENING_SOON" ||
    observed === "EXPECTED" ||
    observed === "CLOSED" ||
    observed === "UNKNOWN"
      ? (observed as ApplicationStatus)
      : "UNKNOWN";

  if (!target) {
    // CREATE — but never auto-create a CLOSED record; closures apply to matches.
    if (observedState === "CLOSED") {
      report.notes.push(
        `Finding ${findingIndex} reports CLOSED for an unknown record; nothing to close.`,
      );
      return;
    }
    const idSeed = dedupKey ?? `${hospital.id}|${sourceUrl}|${title.toLowerCase()}`;
    let id = `opp_${shortHash(idSeed)}`;
    let suffix = 1;
    while (next.opportunities.some((o) => o.id === id)) {
      suffix += 1;
      id = `opp_${shortHash(`${idSeed}|${suffix}`)}`;
    }
    const appUrlRaw = normStr(facts["application_url"]);
    let applicationUrl: string | null = null;
    if (appUrlRaw) {
      try {
        applicationUrl = normalizeUrl(appUrlRaw);
      } catch {
        applicationUrl = null;
      }
    }
    const postedRaw = normStr(facts["source_posted_at"]);
    const newOpp: Opportunity = {
      id,
      hospital_id: hospital.id,
      program_id: programId,
      cohort_id: cohortId,
      position_title: title,
      unit: normStr(facts["unit"]),
      locations: locations ?? [{ city: "Unknown", state: hospital.state }],
      specialties: specialtiesRaw ?? ["Unknown"],
      application_open: openDate,
      application_close: closeDate,
      program_start: startDate,
      source_posted_at: postedRaw && !Number.isNaN(Date.parse(postedRaw)) ? postedRaw : null,
      application_status: statusFor(observedState),
      verification_health: "VERIFIED",
      eligibility: "ELIGIBLE",
      bsn_required:
        typeof facts["bsn_required"] === "boolean" ? (facts["bsn_required"] as boolean) : null,
      rn_license_requirement: normStr(facts["rn_license_requirement"]),
      license_required_by: normStr(facts["license_required_by"]),
      experience_requirement: normStr(facts["experience_requirement"]),
      source_url: sourceUrl,
      application_url: applicationUrl,
      dedup_key: dedupKey,
      source_external_id: reqId,
      first_discovered_at: nowIso,
      last_seen_at: nowIso,
      last_attempted_at: nowIso,
      last_verified_at: nowIso,
      closed_at: null,
      closure_reason: null,
      publication_state: "PUBLISHED",
      evidence: dedupeEvidence(officialEvidence).slice(0, 100),
      manual_overrides: {},
      created_at: nowIso,
      updated_at: nowIso,
    };
    next.opportunities.push(newOpp);
    pushHistory("NEW", id, `First published from run evidence (${observedState}).`, null, officialEvidence);
    report.counts.created += 1;
    report.created.push(id);
    return;
  }

  // UPDATE — field by field, null-safe, lock-aware, conflict-aware.
  const changes: ReportChange["changes"] = [];
  const conflicts: string[] = [];

  const consider = (
    field: keyof Opportunity,
    newValue: unknown,
    equals: (a: unknown, b: unknown) => boolean,
  ): void => {
    if (newValue === null || newValue === undefined) return; // never overwrite with null
    const current = target![field];
    if (equals(current, newValue)) return;
    const lock = target!.manual_overrides[field as string];
    if (lock) {
      conflicts.push(
        `Field "${field}" is manually locked; batch value differs and was not applied.`,
      );
      return;
    }
    // A stored value backed by evidence conflicts with a differing evidenced
    // batch value; keep stored and escalate.
    const storedHasEvidence = target!.evidence.some(
      (e) => CLAIM_TO_FIELD[e.claim] === field,
    );
    const batchHasEvidence = officialEvidence.some(
      (e) => CLAIM_TO_FIELD[e.claim] === field,
    );
    if (storedHasEvidence && batchHasEvidence && current !== null && current !== undefined) {
      conflicts.push(
        `Field "${field}" has conflicting evidence (stored vs batch); stored value kept.`,
      );
      return;
    }
    changes.push({ field: field as string, before: current ?? null, after: newValue });
    (target as unknown as Record<string, unknown>)[field as string] = newValue;
  };

  const eqStr = (a: unknown, b: unknown): boolean => a === b;
  const eqDate = (a: unknown, b: unknown): boolean =>
    sameFlexibleDate(a as FlexibleDate | null, b as FlexibleDate | null);
  const eqJson = (a: unknown, b: unknown): boolean =>
    JSON.stringify(a) === JSON.stringify(b);

  consider("position_title", title, eqStr);
  const unitVal = facts["unit"] === undefined ? undefined : normStr(facts["unit"]);
  if (unitVal !== undefined) consider("unit", unitVal, eqStr);
  if (locations) consider("locations", locations, eqJson);
  if (specialtiesRaw) consider("specialties", specialtiesRaw, eqJson);
  if (facts["application_open"] !== undefined) consider("application_open", openDate, eqDate);
  if (facts["application_close"] !== undefined) consider("application_close", closeDate, eqDate);
  if (facts["program_start"] !== undefined) consider("program_start", startDate, eqDate);
  if (programId) consider("program_id", programId, eqStr);
  if (cohortId) consider("cohort_id", cohortId, eqStr);
  if (typeof facts["bsn_required"] === "boolean") consider("bsn_required", facts["bsn_required"], eqStr);
  if (facts["rn_license_requirement"] !== undefined) {
    consider("rn_license_requirement", normStr(facts["rn_license_requirement"]), eqStr);
  }
  if (facts["license_required_by"] !== undefined) {
    consider("license_required_by", normStr(facts["license_required_by"]), eqStr);
  }
  if (facts["experience_requirement"] !== undefined) {
    consider("experience_requirement", normStr(facts["experience_requirement"]), eqStr);
  }
  if (facts["application_url"] !== undefined) {
    const raw = normStr(facts["application_url"]);
    if (raw) {
      try {
        consider("application_url", normalizeUrl(raw), eqStr);
      } catch {
        conflicts.push("Batch application_url is not a valid URL; stored value kept.");
      }
    }
  }
  if (dedupKey && !target.dedup_key) consider("dedup_key", dedupKey, eqStr);

  // Status transitions with evidence already verified above.
  const nextStatus = statusFor(observedState);
  if (nextStatus !== target.application_status) {
    if (target.manual_overrides["application_status"]) {
      conflicts.push('Field "application_status" is manually locked; stored value kept.');
    } else if (nextStatus === "CLOSED") {
      // Status transitions bypass the evidence-conflict hold: fresh official
      // status evidence supersedes the prior state (only manual locks block).
      changes.push({ field: "application_status", before: target.application_status, after: "CLOSED" });
      target.application_status = "CLOSED";
      const removalVerified = officialEvidence.some((e) => e.claim === "removal");
      if (!target.manual_overrides["closed_at"]) {
        target.closed_at = nowIso;
        target.closure_reason = removalVerified ? "verified_removed" : "verified_closed";
        changes.push({ field: "closed_at", before: null, after: nowIso });
      }
      pushHistory(
        removalVerified ? "VERIFIED_REMOVED" : "CLOSED",
        target.id,
        removalVerified
          ? "Official requisition removal verified with complete enumeration."
          : "Official evidence verified closure.",
        changes,
        officialEvidence,
      );
      report.counts.closed += 1;
      report.closed.push(target.id);
    } else {
      const was = target.application_status;
      changes.push({ field: "application_status", before: was, after: nextStatus });
      target.application_status = nextStatus;
      if (was === "CLOSED" && (nextStatus === "OPEN" || nextStatus === "OPENING_SOON")) {
        target.closed_at = null;
        target.closure_reason = null;
        pushHistory("REOPENED", target.id, `Re-verified as ${nextStatus}.`, changes, officialEvidence);
        report.counts.reopened += 1;
        report.reopened.push(target.id);
      }
    }
  }

  if (conflicts.length > 0) {
    pushReview(
      finding,
      findingIndex,
      `Conflicts on ${target.id}: ${conflicts.join(" ")}`.slice(0, 900),
      target.id,
    );
  }

  mergeEvidence(target, officialEvidence);
  target.last_seen_at = nowIso;
  target.last_attempted_at = nowIso;
  target.last_verified_at = nowIso;
  target.verification_health = "VERIFIED";
  target.updated_at = nowIso;

  if (changes.length > 0) {
    pushHistory("UPDATED", target.id, `Updated from run evidence (${observedState}).`, changes, officialEvidence);
    report.counts.updated += 1;
    report.updated.push({ opportunity_id: target.id, changes });
  } else {
    // Successful re-verification with no field changes is still worth one
    // lightweight receipt in the run log (via runs.json), not a history event.
    report.notes.push(`Finding ${findingIndex}: ${target.id} re-verified, no changes.`);
  }
}

/** Match a finding to an existing record without creating anything. */
function matchOpportunity(
  next: StoreSnapshot,
  identifiers: Record<string, unknown>,
  facts: Record<string, unknown>,
  hospitalId: string,
): Opportunity | null {
  const explicitId = normStr(identifiers["opportunity_id"]);
  if (explicitId) {
    const hit = next.opportunities.find((o) => o.id === explicitId);
    if (hit) return hit;
  }
  const dedupKey = buildDedupKey(
    normStr(identifiers["ats_provider"]),
    normStr(identifiers["ats_tenant"]) ?? normStr(identifiers["employer_tenant"]),
    normStr(identifiers["requisition_id"]),
  );
  if (dedupKey) {
    const hit = next.opportunities.find((o) => o.dedup_key === dedupKey);
    if (hit) return hit;
  }
  const sourceUrl = normStr(facts["source_url"]);
  if (sourceUrl) {
    try {
      const norm = normalizeUrl(sourceUrl);
      const hit = next.opportunities.find((o) => {
        try {
          return normalizeUrl(o.source_url) === norm && o.hospital_id === hospitalId;
        } catch {
          return false;
        }
      });
      if (hit) return hit;
    } catch {
      // fall through
    }
  }
  return null;
}

function dedupeEvidence(list: Evidence[]): Evidence[] {
  const seen = new Set<string>();
  const out: Evidence[] = [];
  for (const e of list) {
    const key = `${e.source_url}|${e.excerpt}|${e.retrieved_at}|${e.claim}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ ...e });
    }
  }
  return out;
}

function mergeEvidence(target: Opportunity, incoming: Evidence[]): void {
  target.evidence = dedupeEvidence([...target.evidence, ...incoming]).slice(0, 100);
}
