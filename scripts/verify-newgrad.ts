#!/usr/bin/env node
/**
 * New Grad RN Tracker — test suite (in-memory; never touches production data).
 *
 * Usage: npm run verify:newgrad
 *
 * Covers: eligibility gating, required-vs-preferred, date handling, conflicts,
 * multi location/specialty, cross-employer dedup, fetch failures, idempotent
 * reruns, invalid batches, manual locks, timezone/deadline policy, URL
 * normalization, aggregator rejection, fuzzy-duplicate holds, deadline sweep.
 */
import assert from "node:assert/strict";
import {
  ingestBatch,
  normalizeUrl,
  parseFactDate,
  type StoreSnapshot,
} from "../lib/newgrad/ingest.ts";
import {
  daysUntilDeadline,
  deriveState,
  isDeadlinePassed,
  matchesOpenFilter,
} from "../lib/newgrad/status.ts";
import { NEWGRAD_CONTRACT_VERSION } from "../lib/newgrad/types.ts";
import type { ResearchBatch } from "../lib/newgrad/validate.ts";
import { validateBatch, validateDataset } from "../lib/newgrad/validate.ts";

let passed = 0;
function test(name: string, fn: () => void): void {
  fn();
  passed += 1;
  console.log(`  ok: ${name}`);
}

const NOW = "2026-09-18T12:00:00.000Z";
const NOW_MS = Date.parse(NOW);

function makeStore(): StoreSnapshot {
  return {
    hospitals: [
      {
        id: "hosp_test",
        name: "Test Health",
        health_system: "Test Health",
        state: "CA",
        aliases: ["Test"],
      },
      {
        id: "hosp_other",
        name: "Other Health",
        health_system: "Other Health",
        state: "CA",
        aliases: [],
      },
    ],
    programs: [],
    cohorts: [],
    sources: [
      {
        id: "src_test",
        hospital_id: "hosp_test",
        label: "Test Health careers",
        urls: ["https://careers.testhealth.example/jobs"],
        status: "active",
        shared_board: null,
        notes: null,
      },
      {
        id: "src_other",
        hospital_id: "hosp_other",
        label: "Other Health careers",
        urls: ["https://jobs.otherhealth.example/search"],
        status: "active",
        shared_board: null,
        notes: null,
      },
    ],
    opportunities: [],
    history: [],
    review: [],
    runs: [],
    meta: {
      contract_version: NEWGRAD_CONTRACT_VERSION,
      generated_at: NOW,
      last_research_attempt_at: null,
      last_successful_verification_at: null,
      last_published_at: null,
      counts: {
        opportunities: 0,
        open: 0,
        closing_soon: 0,
        pending_review: 0,
        sources_active: 2,
        sources_candidate: 0,
      },
      coverage_note: null,
    },
  };
}

function ev(sourceUrl: string, excerpt: string, claim: string) {
  return {
    source_url: sourceUrl,
    excerpt,
    retrieved_at: NOW,
    claim,
  };
}

function openFinding(overrides: Record<string, unknown> = {}) {
  return {
    employer: { name: "Test Health", hospital_id: "hosp_test" },
    identifiers: {
      program: "Nurse Residency",
      cohort: "Spring 2027",
      requisition_id: "REQ-100",
      ats_provider: "workday",
      ats_tenant: "testhealth",
      opportunity_id: null,
      ...((overrides["identifiers"] as Record<string, unknown>) ?? {}),
    },
    observed_state: "OPEN",
    eligibility: { assessment: "ELIGIBLE", note: null },
    facts: {
      position_title: "New Grad RN, Medical-Surgical",
      unit: "4N Med-Surg",
      locations: [{ city: "Los Angeles", state: "CA" }],
      specialties: ["Med-Surg"],
      application_open: { kind: "date", value: "2026-09-01" },
      application_close: { kind: "date", value: "2026-10-15" },
      program_start: { kind: "text", value: "Spring 2027" },
      bsn_required: false,
      rn_license_requirement: "CA RN license required by start date.",
      license_required_by: "start",
      experience_requirement: "No experience required; new graduates welcome.",
      source_url: "https://careers.testhealth.example/jobs/REQ-100",
      application_url: "https://careers.testhealth.example/apply/REQ-100",
      ...((overrides["facts"] as Record<string, unknown>) ?? {}),
    },
    evidence: [
      ev(
        "https://careers.testhealth.example/jobs/REQ-100",
        "Now accepting applications from new graduate RNs with no experience required.",
        "eligibility",
      ),
      ev(
        "https://careers.testhealth.example/jobs/REQ-100",
        "Apply now. Applications close October 15, 2026.",
        "status",
      ),
      ev(
        "https://careers.testhealth.example/jobs/REQ-100",
        "Applications close October 15, 2026.",
        "deadline",
      ),
    ],
    uncertainties: null,
    ...Object.fromEntries(
      Object.entries(overrides).filter(([k]) => k !== "identifiers" && k !== "facts"),
    ),
  };
}

function makeBatch(findings: unknown[], runId = "test-run-1"): ResearchBatch {
  const batch = {
    schema_version: "1.0.0",
    run_id: runId,
    research_started_at: "2026-09-18T08:00:00.000Z",
    research_completed_at: "2026-09-18T08:25:00.000Z",
    sources_checked: [
      {
        source_id: "src_test",
        url: "https://careers.testhealth.example/jobs",
        attempted_at: "2026-09-18T08:05:00.000Z",
        retrieved_at: "2026-09-18T08:05:12.000Z",
        outcome: "ok",
        coverage_complete: true,
        error: null,
      },
    ],
    findings,
    unresolved_items: [],
  };
  const checked = validateBatch(batch);
  assert.equal(checked.ok, true, `fixture batch invalid: ${JSON.stringify(checked.issues)}`);
  return checked.batch!;
}

// --- eligibility + publication gating ---------------------------------------

test("eligible finding with official evidence is published", () => {
  const { report, next } = ingestBatch(makeBatch([openFinding()]), makeStore(), { nowIso: NOW });
  assert.equal(report.counts.created, 1);
  assert.equal(next.opportunities.length, 1);
  const o = next.opportunities[0]!;
  assert.equal(o.application_status, "OPEN");
  assert.equal(o.eligibility, "ELIGIBLE");
  assert.equal(o.verification_health, "VERIFIED");
  assert.equal(o.dedup_key, "workday|testhealth|req-100");
  assert.deepEqual(o.program_start, { kind: "text", value: "Spring 2027" });
  assert.ok(o.program_id && o.cohort_id, "program/cohort linked");
  assert.equal(next.history.filter((h) => h.type === "NEW").length, 1);
});

test("experienced-only finding without a matching record is rejected", () => {
  const f = openFinding({ eligibility: { assessment: "INELIGIBLE", note: "2 years required" } });
  const { report, next } = ingestBatch(makeBatch([f]), makeStore(), { nowIso: NOW });
  assert.equal(report.counts.rejected, 1);
  assert.equal(next.opportunities.length, 0);
});

test("eligibility without explicit new-grad language goes to review", () => {
  const f = openFinding();
  f.evidence = [
    ev("https://careers.testhealth.example/jobs/REQ-100", "RN I position on 4N Med-Surg unit.", "eligibility"),
    ev("https://careers.testhealth.example/jobs/REQ-100", "Apply now.", "status"),
  ];
  const { report, next } = ingestBatch(makeBatch([f]), makeStore(), { nowIso: NOW });
  assert.equal(report.counts.created, 0);
  assert.equal(report.counts.pending_review, 1);
  assert.equal(next.opportunities.length, 0);
  assert.match(next.review[0]!.reason, /explicit new-grad/i);
});

test("uncertain eligibility goes to review, never auto-publishes", () => {
  const f = openFinding({ eligibility: { assessment: "UNCERTAIN", note: "preferred 1 year" } });
  const { report, next } = ingestBatch(makeBatch([f]), makeStore(), { nowIso: NOW });
  assert.equal(report.counts.pending_review, 1);
  assert.equal(next.opportunities.length, 0);
});

test("aggregator-only evidence is held for review", () => {
  const f = openFinding();
  f.facts.source_url = "https://www.indeed.com/viewjob?jk=abc123&from=search";
  f.evidence = [
    ev("https://www.indeed.com/viewjob?jk=abc123", "New graduate RNs are encouraged to apply for this residency role today.", "eligibility"),
    ev("https://www.indeed.com/viewjob?jk=abc123", "Apply now on Indeed for this open nursing position.", "status"),
  ];
  const { report, next } = ingestBatch(makeBatch([f]), makeStore(), { nowIso: NOW });
  assert.equal(report.counts.created, 0);
  assert.equal(report.counts.pending_review, 1);
  assert.match(next.review[0]!.reason, /aggregator/i);
});

test("unresolved employer goes to review", () => {
  const f = openFinding();
  f.employer.name = "Nonexistent Hospital";
  (f.employer as { hospital_id: string | null }).hospital_id = null;
  const { report, next } = ingestBatch(makeBatch([f]), makeStore(), { nowIso: NOW });
  assert.equal(report.counts.pending_review, 1);
  assert.equal(next.opportunities.length, 0);
});

// --- dedup + conflicts ---------------------------------------------------------

test("same requisition id at different employers creates distinct records", () => {
  const a = openFinding();
  const b = openFinding({
    employer: { name: "Other Health", hospital_id: "hosp_other" },
    identifiers: {
      program: null, cohort: null, requisition_id: "REQ-100",
      ats_provider: "workday", ats_tenant: "otherhealth", opportunity_id: null,
    },
    facts: {
      position_title: "New Grad RN, Telemetry",
      locations: [{ city: "San Diego", state: "CA" }],
      specialties: ["Telemetry"],
      source_url: "https://jobs.otherhealth.example/search/REQ-100",
    },
  });
  b.evidence = [
    ev("https://jobs.otherhealth.example/search/REQ-100", "New graduate RNs with no experience required may apply.", "eligibility"),
    ev("https://jobs.otherhealth.example/search/REQ-100", "Apply now, posting open.", "status"),
  ];
  const { report, next } = ingestBatch(makeBatch([a, b], "test-dedup"), makeStore(), { nowIso: NOW });
  assert.equal(report.counts.created, 2);
  assert.equal(next.opportunities.length, 2);
  assert.notEqual(next.opportunities[0]!.dedup_key, next.opportunities[1]!.dedup_key);
});

test("re-ingesting the same dedup key updates instead of duplicating", () => {
  const store = makeStore();
  const first = ingestBatch(makeBatch([openFinding()], "test-upd"), store, { nowIso: NOW });
  assert.equal(first.next.opportunities.length, 1);
  const f = openFinding({
    facts: {
      position_title: "New Grad RN, Medical-Surgical",
      unit: "5S Med-Surg",
      locations: [{ city: "Los Angeles", state: "CA" }],
      specialties: ["Med-Surg"],
      source_url: "https://careers.testhealth.example/jobs/REQ-100",
    },
  });
  const second = ingestBatch(makeBatch([f], "test-upd-2"), first.next, { nowIso: NOW });
  assert.equal(second.report.counts.created, 0);
  assert.equal(second.report.counts.updated, 1);
  assert.equal(second.next.opportunities.length, 1);
  assert.equal(second.next.opportunities[0]!.unit, "5S Med-Surg");
});

test("conflicting evidenced deadline keeps stored value and opens review", () => {
  const store = makeStore();
  const first = ingestBatch(makeBatch([openFinding()], "test-conf"), store, { nowIso: NOW });
  const f = openFinding({
    facts: {
      position_title: "New Grad RN, Medical-Surgical",
      locations: [{ city: "Los Angeles", state: "CA" }],
      specialties: ["Med-Surg"],
      application_close: { kind: "date", value: "2026-11-30" },
      source_url: "https://careers.testhealth.example/jobs/REQ-100",
    },
  });
  const second = ingestBatch(makeBatch([f], "test-conf-2"), first.next, { nowIso: NOW });
  const o = second.next.opportunities[0]!;
  assert.deepEqual(o.application_close, { kind: "date", value: "2026-10-15" });
  assert.equal(second.report.counts.pending_review, 1);
  assert.match(second.next.review[0]!.reason, /onflict/);
});

test("omitted facts never overwrite known values with null", () => {
  const store = makeStore();
  const first = ingestBatch(makeBatch([openFinding()], "test-null"), store, { nowIso: NOW });
  const f = openFinding({
    facts: {
      position_title: "New Grad RN, Medical-Surgical",
      locations: [{ city: "Los Angeles", state: "CA" }],
      specialties: ["Med-Surg"],
      source_url: "https://careers.testhealth.example/jobs/REQ-100",
    },
  });
  delete (f.facts as Record<string, unknown>)["unit"];
  delete (f.facts as Record<string, unknown>)["application_close"];
  const second = ingestBatch(makeBatch([f], "test-null-2"), first.next, { nowIso: NOW });
  const o = second.next.opportunities[0]!;
  assert.equal(o.unit, "4N Med-Surg");
  assert.deepEqual(o.application_close, { kind: "date", value: "2026-10-15" });
});

test("fuzzy near-duplicate without a dedup key is held, not auto-created", () => {
  const store = makeStore();
  const plain = openFinding();
  delete (plain.identifiers as Record<string, unknown>)["requisition_id"];
  delete (plain.identifiers as Record<string, unknown>)["ats_provider"];
  delete (plain.identifiers as Record<string, unknown>)["ats_tenant"];
  const first = ingestBatch(makeBatch([plain], "test-fz"), store, { nowIso: NOW });
  assert.equal(first.report.counts.created, 1);
  const f = openFinding({
    facts: {
      position_title: "New Grad Registered Nurse, Medical Surgical Unit",
      locations: [{ city: "Los Angeles", state: "CA" }],
      specialties: ["Med-Surg"],
      source_url: "https://careers.testhealth.example/jobs/REQ-999",
    },
  });
  delete (f.identifiers as Record<string, unknown>)["requisition_id"];
  delete (f.identifiers as Record<string, unknown>)["ats_provider"];
  delete (f.identifiers as Record<string, unknown>)["ats_tenant"];
  const second = ingestBatch(makeBatch([f], "test-fz-2"), first.next, { nowIso: NOW });
  assert.equal(second.report.counts.created, 0);
  assert.equal(second.report.counts.pending_review, 1);
  assert.match(second.next.review[0]!.reason, /uplicate/i);
});

test("multiple locations and specialties are stored", () => {
  const f = openFinding({
    facts: {
      position_title: "New Grad RN, Float Pool",
      locations: [
        { city: "Los Angeles", state: "CA" },
        { city: "Pasadena", state: "CA" },
      ],
      specialties: ["Med-Surg", "Telemetry"],
      source_url: "https://careers.testhealth.example/jobs/REQ-100",
    },
  });
  const { next } = ingestBatch(makeBatch([f]), makeStore(), { nowIso: NOW });
  assert.equal(next.opportunities[0]!.locations.length, 2);
  assert.deepEqual(next.opportunities[0]!.specialties, ["Med-Surg", "Telemetry"]);
});

// --- failure handling ----------------------------------------------------------

test("fetch failure marks health only: no closure, no verification advance", () => {
  const store = makeStore();
  const first = ingestBatch(makeBatch([openFinding()], "test-ff"), store, { nowIso: NOW });
  const before = first.next.opportunities[0]!;
  assert.equal(before.last_verified_at, NOW);
  const f = {
    employer: { name: "Test Health", hospital_id: "hosp_test" },
    identifiers: {
      requisition_id: "REQ-100", ats_provider: "workday",
      ats_tenant: "testhealth", opportunity_id: null, program: null, cohort: null,
    },
    observed_state: "FETCH_FAILED",
    eligibility: { assessment: "UNCERTAIN", note: null },
    facts: { source_url: "https://careers.testhealth.example/jobs/REQ-100" },
    evidence: [ev("https://careers.testhealth.example/jobs/REQ-100", "timeout after 30s waiting for page", "status")],
    uncertainties: ["timeout"],
  };
  const later = "2026-09-19T12:00:00.000Z";
  const second = ingestBatch(makeBatch([f], "test-ff-2"), first.next, { nowIso: later });
  const o = second.next.opportunities[0]!;
  assert.equal(o.application_status, "OPEN");
  assert.equal(o.verification_health, "TEMPORARY_FAILURE");
  assert.equal(o.last_verified_at, NOW, "verification timestamp must not advance");
  assert.equal(o.last_attempted_at, later);
  assert.ok(second.next.history.some((h) => h.type === "SOURCE_UNAVAILABLE"));
});

test("incomplete research touches nothing it did not check", () => {
  const store = makeStore();
  const first = ingestBatch(makeBatch([openFinding()], "test-inc"), store, { nowIso: NOW });
  const untouched = JSON.stringify(first.next.opportunities);
  const f = openFinding({
    employer: { name: "Other Health", hospital_id: "hosp_other" },
    identifiers: {
      program: null, cohort: null, requisition_id: "REQ-555",
      ats_provider: "workday", ats_tenant: "otherhealth", opportunity_id: null,
    },
    facts: {
      position_title: "New Grad RN, Oncology",
      locations: [{ city: "San Diego", state: "CA" }],
      specialties: ["Oncology"],
      source_url: "https://jobs.otherhealth.example/search/REQ-555",
    },
  });
  f.evidence = [
    ev("https://jobs.otherhealth.example/search/REQ-555", "New graduate RNs with no experience required may apply.", "eligibility"),
    ev("https://jobs.otherhealth.example/search/REQ-555", "Apply now, posting open.", "status"),
  ];
  const second = ingestBatch(makeBatch([f], "test-inc-2"), first.next, { nowIso: NOW });
  assert.equal(second.next.opportunities.length, 2);
  assert.equal(JSON.stringify(second.next.opportunities[0]), untouched.slice(1, -1));
});

test("reprocessing the same run_id is a no-op", () => {
  const store = makeStore();
  const batch = makeBatch([openFinding()], "test-idem");
  const first = ingestBatch(batch, store, { nowIso: NOW });
  assert.equal(first.next.opportunities.length, 1);
  const historyLen = first.next.history.length;
  const second = ingestBatch(batch, first.next, { nowIso: NOW });
  assert.equal(second.report.duplicate_run, true);
  assert.equal(second.next.opportunities.length, 1);
  assert.equal(second.next.history.length, historyLen);
  assert.equal(second.next.runs.length, 1);
});

test("manual correction lock survives later scans", () => {
  const store = makeStore();
  const first = ingestBatch(makeBatch([openFinding()], "test-lock"), store, { nowIso: NOW });
  const o = first.next.opportunities[0]!;
  o.unit = "4N Corrected";
  o.manual_overrides["unit"] = { value: "4N Corrected", reason: "verified by phone", by: "tester", at: NOW };
  const f = openFinding({
    facts: {
      position_title: "New Grad RN, Medical-Surgical",
      unit: "4N Med-Surg",
      locations: [{ city: "Los Angeles", state: "CA" }],
      specialties: ["Med-Surg"],
      source_url: "https://careers.testhealth.example/jobs/REQ-100",
    },
  });
  const second = ingestBatch(makeBatch([f], "test-lock-2"), first.next, { nowIso: NOW });
  assert.equal(second.next.opportunities[0]!.unit, "4N Corrected");
  assert.equal(second.report.counts.pending_review, 1);
  assert.match(second.next.review[0]!.reason, /locked/);
});

test("OPENING_SOON with a past opening date requires a current check", () => {
  const f = openFinding({
    observed_state: "OPENING_SOON",
    facts: {
      position_title: "New Grad RN, Med-Surg",
      locations: [{ city: "Los Angeles", state: "CA" }],
      specialties: ["Med-Surg"],
      application_open: { kind: "date", value: "2026-09-01" },
      source_url: "https://careers.testhealth.example/jobs/REQ-100",
    },
  });
  const { report, next } = ingestBatch(makeBatch([f], "test-os"), makeStore(), { nowIso: NOW });
  assert.equal(report.counts.created, 0);
  assert.equal(report.counts.pending_review, 1);
  assert.equal(next.opportunities.length, 0);
});

test("verified removal records VERIFIED_REMOVED history", () => {
  const store = makeStore();
  const first = ingestBatch(makeBatch([openFinding()], "test-rm"), store, { nowIso: NOW });
  const f = openFinding({ observed_state: "CLOSED" });
  f.evidence = [
    ev("https://careers.testhealth.example/jobs/REQ-100", "New graduate RNs with no experience required may apply.", "eligibility"),
    ev("https://careers.testhealth.example/jobs/REQ-100", "This requisition is no longer listed in the complete posting index.", "removal"),
  ];
  const second = ingestBatch(makeBatch([f], "test-rm-2"), first.next, { nowIso: NOW });
  const o = second.next.opportunities[0]!;
  assert.equal(o.application_status, "CLOSED");
  assert.equal(o.closure_reason, "verified_removed");
  assert.ok(second.next.history.some((h) => h.type === "VERIFIED_REMOVED"));
});

test("confirmed passed deadline is swept to CLOSED", () => {
  const f = openFinding({
    facts: {
      position_title: "New Grad RN, Med-Surg",
      locations: [{ city: "Los Angeles", state: "CA" }],
      specialties: ["Med-Surg"],
      application_close: { kind: "date", value: "2026-09-01" },
      source_url: "https://careers.testhealth.example/jobs/REQ-100",
    },
  });
  const { report, next } = ingestBatch(makeBatch([f], "test-sweep"), makeStore(), {
    nowIso: "2026-09-18T12:00:00.000Z",
  });
  assert.equal(next.opportunities[0]!.application_status, "CLOSED");
  assert.equal(report.deadline_sweep_closed.length, 1);
});

// --- dates, deadlines, display rules --------------------------------------------

test("date-only deadline expires at end of day, never at start", () => {
  const close = { kind: "date", value: "2026-09-18" } as const;
  assert.equal(isDeadlinePassed(close, Date.parse("2026-09-18T00:00:01Z")), false);
  assert.equal(isDeadlinePassed(close, Date.parse("2026-09-18T23:59:59Z")), false);
  assert.equal(isDeadlinePassed(close, Date.parse("2026-09-19T00:00:00Z")), true);
});

test("datetime deadline expires at its exact instant; text never expires", () => {
  const dt = { kind: "datetime", value: "2026-09-18T17:00:00-07:00" } as const;
  assert.equal(isDeadlinePassed(dt, Date.parse("2026-09-19T00:00:00Z") - 1), false);
  assert.equal(isDeadlinePassed(dt, Date.parse("2026-09-19T00:00:00Z") + 1), true);
  assert.equal(isDeadlinePassed({ kind: "text", value: "Fall 2026" }, Date.parse("2030-01-01T00:00:00Z")), false);
});

test("CLOSING_SOON derives within 7 days; Open filter includes it", () => {
  const store = makeStore();
  const f = openFinding({
    facts: {
      position_title: "New Grad RN, Med-Surg",
      locations: [{ city: "Los Angeles", state: "CA" }],
      specialties: ["Med-Surg"],
      application_close: { kind: "date", value: "2026-09-22" },
      source_url: "https://careers.testhealth.example/jobs/REQ-100",
    },
  });
  const { next } = ingestBatch(makeBatch([f], "test-cs"), store, { nowIso: NOW });
  const d = deriveState(next.opportunities[0]!, NOW_MS);
  assert.equal(d.display, "CLOSING_SOON");
  assert.equal(d.closingSoon, true);
  assert.equal(matchesOpenFilter(d.display), true);
  assert.equal(daysUntilDeadline(next.opportunities[0]!.application_close, NOW_MS), 5);
});

test("STALE derives after 14 days without verification; New Today is 24h from discovery", () => {
  const store = makeStore();
  const { next } = ingestBatch(makeBatch([openFinding()], "test-stale"), store, {
    nowIso: "2026-09-01T12:00:00.000Z",
  });
  const o = next.opportunities[0]!;
  const d = deriveState(o, NOW_MS);
  assert.equal(d.health, "STALE");
  assert.equal(d.newToday, false);
  const fresh = deriveState(o, Date.parse("2026-09-01T18:00:00.000Z"));
  assert.equal(fresh.newToday, true);
});

test("parseFactDate preserves precision and rejects garbage", () => {
  assert.deepEqual(parseFactDate({ kind: "date", value: "2026-10-15" }), {
    kind: "date",
    value: "2026-10-15",
  });
  assert.deepEqual(parseFactDate("2026-10-15"), { kind: "date", value: "2026-10-15" });
  assert.deepEqual(parseFactDate("Spring 2027"), { kind: "text", value: "Spring 2027" });
  assert.equal(parseFactDate({ kind: "date", value: "October" }), "invalid");
  assert.equal(parseFactDate(null), null);
});

// --- URLs -------------------------------------------------------------------------

test("URL normalization strips tracking but keeps job params", () => {
  assert.equal(
    normalizeUrl("HTTPS://Careers.TestHealth.EXAMPLE/jobs/REQ-100?utm_source=x&jobId=REQ-100"),
    "https://careers.testhealth.example/jobs/REQ-100?jobId=REQ-100",
  );
  assert.equal(normalizeUrl("https://example.org:443/a"), "https://example.org/a");
});

// --- batch + dataset validators -----------------------------------------------------

test("invalid batches are rejected with reasons", () => {
  const bad = validateBatch({ schema_version: "9.9.9", run_id: "x" });
  assert.equal(bad.ok, false);
  assert.ok(bad.issues.length > 0);
  const evil = validateBatch({
    schema_version: "1.0.0",
    run_id: "evil-1",
    research_started_at: NOW,
    research_completed_at: NOW,
    sources_checked: [],
    findings: [],
    unresolved_items: [],
    command: "rm -rf /",
  });
  assert.equal(evil.ok, false);
  assert.ok(evil.issues.some((i) => i.path === "command"));
});

test("dataset validator rejects stored CLOSING_SOON and unknown specialties", () => {
  const store = makeStore();
  const { next } = ingestBatch(makeBatch([openFinding()], "test-val"), store, { nowIso: NOW });
  const good = validateDataset({
    meta: next.meta,
    hospitals: next.hospitals,
    opportunities: next.opportunities,
    programs: next.programs,
    cohorts: next.cohorts,
    last_run: null,
    last_publication: null,
  });
  assert.equal(good.ok, true);
  const mutated = JSON.parse(JSON.stringify(next.opportunities)) as typeof next.opportunities;
  (mutated[0] as unknown as Record<string, unknown>)["application_status"] = "CLOSING_SOON";
  (mutated[0] as unknown as Record<string, unknown>)["specialties"] = ["Stepdown"];
  const bad = validateDataset({
    meta: next.meta,
    hospitals: next.hospitals,
    opportunities: mutated,
    programs: next.programs,
    cohorts: next.cohorts,
    last_run: null,
    last_publication: null,
  });
  assert.equal(bad.ok, false);
  assert.ok(bad.issues.length >= 2);
});

test("meta freshness and coverage update after a run", () => {
  const { next } = ingestBatch(makeBatch([openFinding()], "test-meta"), makeStore(), { nowIso: NOW });
  assert.equal(next.meta.last_research_attempt_at, "2026-09-18T08:25:00.000Z");
  assert.equal(next.meta.last_successful_verification_at, NOW);
  assert.equal(next.meta.counts.opportunities, 1);
  assert.equal(next.meta.counts.open, 1);
  assert.match(next.meta.coverage_note ?? "", /1 of 1/);
  assert.equal(next.runs.length, 1);
  assert.equal(next.runs[0]!.published, 1);
});

console.log(`\nverify:newgrad: ${passed} tests passed`);
