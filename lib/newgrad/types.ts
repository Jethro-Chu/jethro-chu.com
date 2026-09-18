/**
 * New Grad RN Tracker — shared types.
 *
 * Storage is validated JSON under data/newgrad/. These types are shared by
 * the /newgrad UI (render-time derived state) and the ingestion/validation
 * CLIs. No AI, network, or database dependencies.
 */

/** Contract version shared by dataset files, research batches, and docs. */
export const NEWGRAD_CONTRACT_VERSION = "1.0.0";

/** Stored application status. CLOSING_SOON is derived at render, never stored. */
export type ApplicationStatus =
  | "OPEN"
  | "OPENING_SOON"
  | "EXPECTED"
  | "CLOSED"
  | "UNKNOWN";

/** Display status adds the derived CLOSING_SOON state. */
export type DisplayStatus = ApplicationStatus | "CLOSING_SOON";

/** Verification health, stored separately from application status. */
export type VerificationHealth =
  | "VERIFIED"
  | "TEMPORARY_FAILURE"
  | "BLOCKED"
  | "PARSER_FAILURE"
  | "NEEDS_REVERIFICATION"
  | "STALE";

/** New-grad eligibility classification. */
export type Eligibility = "ELIGIBLE" | "INELIGIBLE" | "UNCERTAIN";

/** Publication lifecycle of an opportunity record. */
export type PublicationState = "PUBLISHED" | "SUPERSEDED";

/** Review queue item states (stored in review.json, never public). */
export type ReviewState = "PENDING" | "APPROVED" | "REJECTED";

/** Change history event kinds. */
export type HistoryEventType =
  | "NEW"
  | "UPDATED"
  | "CLOSED"
  | "REOPENED"
  | "SOURCE_UNAVAILABLE"
  | "VERIFIED_REMOVED"
  | "CORRECTED"
  | "REVIEWED";

/** Closed-form specialty vocabulary. */
export const SPECIALTIES = [
  "ICU",
  "Critical Care",
  "CVICU",
  "MICU",
  "SICU",
  "Neuro ICU",
  "PICU",
  "NICU",
  "Emergency Department",
  "Operating Room",
  "PACU",
  "Med-Surg",
  "Telemetry",
  "Cardiology",
  "Oncology",
  "Pediatrics",
  "L&D",
  "Mother Baby",
  "Psychiatry",
  "Rehabilitation",
  "Float Pool",
  "Multiple Specialties",
  "Unknown",
] as const;

export type Specialty = (typeof SPECIALTIES)[number];

/**
 * Specialties matched by the ICU quick filter. Telemetry and Cardiology are
 * deliberately excluded: they are not ICU-level care.
 */
export const ICU_FILTER_SPECIALTIES: ReadonlySet<string> = new Set([
  "ICU",
  "Critical Care",
  "CVICU",
  "MICU",
  "SICU",
  "Neuro ICU",
  "PICU",
  "NICU",
]);

/** Date value that preserves the precision the source actually gave. */
export type FlexibleDate =
  | { kind: "date"; value: string } // YYYY-MM-DD, no invented time
  | { kind: "datetime"; value: string } // ISO 8601 with timezone offset
  | { kind: "text"; value: string }; // e.g. "Spring 2027", never coerced

/** Field-level source evidence. Every published fact needs one of these. */
export interface Evidence {
  /** Official source URL the excerpt was read from. */
  source_url: string;
  /** Short exact excerpt or official structured-data field value. */
  excerpt: string;
  /** UTC timestamp of successful retrieval (ISO 8601). */
  retrieved_at: string;
  /** Machine-readable claim this evidence supports, e.g. "deadline". */
  claim: string;
}

export interface Location {
  city: string;
  state: string;
}

export interface Hospital {
  id: string;
  name: string;
  health_system: string | null;
  state: string;
  /** Alternate names Antigravity may use; matched case-insensitively. */
  aliases: string[];
}

export type SourceStatus = "active" | "candidate" | "disabled";

/** Watchlist entry. Candidates carry no URLs until verified (never invented). */
export interface Source {
  id: string;
  hospital_id: string | null;
  label: string;
  /** Official program/careers/ATS URLs. Empty until verified. */
  urls: string[];
  status: SourceStatus;
  /** Shared board id when several hospitals use one career site. */
  shared_board: string | null;
  notes: string | null;
}

/** Recurring residency program (no dates, no status). */
export interface Program {
  id: string;
  hospital_id: string;
  name: string;
  source_url: string | null;
}

/** One application cycle of a program. */
export interface Cohort {
  id: string;
  program_id: string;
  label: string;
  program_start: FlexibleDate | null;
}

export interface ManualOverride {
  value: unknown;
  reason: string;
  by: string;
  at: string;
}

/**
 * One public application opportunity. A verified cohort with a general
 * application process is an opportunity even without a requisition; a
 * requisition with its own dates/evidence is its own opportunity.
 */
export interface Opportunity {
  id: string;
  hospital_id: string;
  program_id: string | null;
  cohort_id: string | null;
  position_title: string;
  unit: string | null;
  locations: Location[];
  specialties: Specialty[];
  application_open: FlexibleDate | null;
  application_close: FlexibleDate | null;
  program_start: FlexibleDate | null;
  /** Employer posting date, distinct from application window dates. */
  source_posted_at: string | null;
  application_status: ApplicationStatus;
  verification_health: VerificationHealth;
  eligibility: Eligibility;
  bsn_required: boolean | null;
  rn_license_requirement: string | null;
  license_required_by: string | null;
  experience_requirement: string | null;
  source_url: string;
  application_url: string | null;
  /** "provider|tenant|requisition_id" when known; null otherwise. */
  dedup_key: string | null;
  source_external_id: string | null;
  first_discovered_at: string;
  last_seen_at: string | null;
  last_attempted_at: string | null;
  last_verified_at: string | null;
  closed_at: string | null;
  closure_reason: string | null;
  publication_state: PublicationState;
  evidence: Evidence[];
  /** Fields protected from automated overwrite. */
  manual_overrides: Record<string, ManualOverride>;
  created_at: string;
  updated_at: string;
}

export interface HistoryEvent {
  id: string;
  run_id: string | null;
  at: string;
  type: HistoryEventType;
  opportunity_id: string;
  /** Field-level before/after for UPDATED/CORRECTED; null otherwise. */
  changes: Array<{ field: string; before: unknown; after: unknown }> | null;
  reason: string | null;
  evidence: Evidence[];
}

export interface ReviewItem {
  id: string;
  run_id: string;
  created_at: string;
  state: ReviewState;
  reason: string;
  /** Raw finding payload that needs a human decision. */
  finding: unknown;
  decision: { by: string; at: string; note: string } | null;
}

export interface SourceCheckReceipt {
  source_id: string | null;
  url: string;
  attempted_at: string;
  retrieved_at: string | null;
  outcome: string;
  coverage_complete: boolean;
  error: string | null;
}

export interface ResearchRun {
  run_id: string;
  research_started_at: string;
  research_completed_at: string;
  ingested_at: string;
  sources_checked: number;
  sources_ok: number;
  findings_received: number;
  published: number;
  updated: number;
  closed: number;
  pending_review: number;
  rejected: number;
  failed_checks: SourceCheckReceipt[];
}

export interface PublicationRun {
  at: string;
  run_id: string | null;
  result: "success" | "failed" | "skipped_disabled";
  detail: string;
}

/** Freshness snapshot the UI renders from actual values only. */
export interface DatasetMeta {
  contract_version: string;
  generated_at: string;
  last_research_attempt_at: string | null;
  last_successful_verification_at: string | null;
  last_published_at: string | null;
  counts: {
    opportunities: number;
    open: number;
    closing_soon: number;
    pending_review: number;
    sources_active: number;
    sources_candidate: number;
  };
  coverage_note: string | null;
}

export interface Dataset {
  meta: DatasetMeta;
  hospitals: Hospital[];
  opportunities: Opportunity[];
  programs: Program[];
  cohorts: Cohort[];
  last_run: ResearchRun | null;
  last_publication: PublicationRun | null;
}
