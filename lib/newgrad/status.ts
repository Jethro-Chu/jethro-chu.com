/**
 * New Grad RN Tracker — deterministic status rules.
 *
 * Stored status and render-time display state are separate:
 * - Ingestion stores `application_status` from supported facts only.
 * - This module derives what the UI shows (CLOSING_SOON, deadline-passed
 *   closure, stale health) from stored facts plus the current time, so the
 *   page stays accurate between research runs without rewriting data.
 */

import type {
  ApplicationStatus,
  DisplayStatus,
  FlexibleDate,
  Opportunity,
  VerificationHealth,
} from "./types.ts";

/** Days an OPEN opportunity with a confirmed deadline counts as CLOSING_SOON. */
export const CLOSING_SOON_DAYS = 7;

/** Days without successful verification before health reads STALE. */
export const STALE_AFTER_DAYS = 14;

/** Hours defining the New Today window (first discovered, not posted). */
export const NEW_TODAY_HOURS = 24;

/**
 * Conservative deadline policy for date-only deadlines (no stated time or
 * timezone): the deadline counts as passed only after the full UTC calendar
 * day has elapsed. A date-only deadline NEVER expires at the start of its day.
 * Datetime deadlines with offsets expire at their exact instant.
 */
export function deadlineInstant(close: FlexibleDate): number | null {
  if (close.kind === "datetime") {
    const t = Date.parse(close.value);
    return Number.isNaN(t) ? null : t;
  }
  if (close.kind === "date") {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(close.value);
    if (!m) return null;
    // End of the UTC calendar day, conservative (latest possible expiry).
    return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 59, 999);
  }
  return null; // text dates ("Spring 2027") never drive expiry
}

/** True when a confirmed deadline has passed under the conservative policy. */
export function isDeadlinePassed(
  close: FlexibleDate | null,
  nowMs: number,
): boolean {
  if (!close) return false;
  const instant = deadlineInstant(close);
  return instant !== null && nowMs > instant;
}

/** Days from now until the deadline; null when not a confirmed date/datetime. */
export function daysUntilDeadline(
  close: FlexibleDate | null,
  nowMs: number,
): number | null {
  if (!close) return null;
  const instant = deadlineInstant(close);
  if (instant === null) return null;
  return Math.ceil((instant - nowMs) / 86_400_000);
}

export interface DerivedState {
  display: DisplayStatus;
  stored: ApplicationStatus;
  health: VerificationHealth;
  closingSoon: boolean;
  newToday: boolean;
  deadlinePassed: boolean;
  openingPassedUnconfirmed: boolean;
}

/**
 * Derive display state. Pure and deterministic: same record + same now always
 * gives the same result.
 *
 * Rules:
 * - OPEN + confirmed deadline within 7 days -> CLOSING_SOON display.
 * - OPEN + confirmed deadline passed -> CLOSED display (deadline_passed).
 *   Stored status is untouched; research confirms and ingestion stores it.
 * - OPENING_SOON + opening date passed -> stays OPENING_SOON display but
 *   flagged openingPassedUnconfirmed: passing the date never proves opening.
 * - CLOSED/EXPECTED/UNKNOWN pass through.
 * - Health degrades to STALE when last verification is older than 14 days.
 *   Retrieval failures never change stored status; they surface as health.
 */
export function deriveState(opp: Opportunity, nowMs: number): DerivedState {
  const deadlinePassed = isDeadlinePassed(opp.application_close, nowMs);
  const daysLeft = daysUntilDeadline(opp.application_close, nowMs);

  let display: DisplayStatus = opp.application_status;
  let closingSoon = false;
  if (opp.application_status === "OPEN") {
    if (deadlinePassed) {
      display = "CLOSED";
    } else if (daysLeft !== null && daysLeft <= CLOSING_SOON_DAYS) {
      display = "CLOSING_SOON";
      closingSoon = true;
    }
  }

  let openingPassedUnconfirmed = false;
  if (opp.application_status === "OPENING_SOON" && opp.application_open) {
    const openInstant = deadlineInstant(opp.application_open);
    // Opening instant uses start-of-day for date-only (earliest possible).
    if (opp.application_open.kind === "date") {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(opp.application_open.value);
      if (m) {
        const startOfDay = Date.UTC(
          Number(m[1]),
          Number(m[2]) - 1,
          Number(m[3]),
        );
        openingPassedUnconfirmed = nowMs > startOfDay;
      }
    } else if (openInstant !== null) {
      openingPassedUnconfirmed = nowMs > openInstant;
    }
  }

  let health = opp.verification_health;
  if (opp.last_verified_at) {
    const ageMs = nowMs - Date.parse(opp.last_verified_at);
    if (!Number.isNaN(ageMs) && ageMs > STALE_AFTER_DAYS * 86_400_000) {
      health = "STALE";
    }
  }

  let newToday = false;
  const discoveredMs = Date.parse(opp.first_discovered_at);
  if (!Number.isNaN(discoveredMs)) {
    newToday = nowMs - discoveredMs <= NEW_TODAY_HOURS * 3_600_000;
  }

  return {
    display,
    stored: opp.application_status,
    health,
    closingSoon,
    newToday,
    deadlinePassed,
    openingPassedUnconfirmed,
  };
}

/** The Open filter includes both OPEN and derived CLOSING_SOON. */
export function matchesOpenFilter(display: DisplayStatus): boolean {
  return display === "OPEN" || display === "CLOSING_SOON";
}

/**
 * Default sort for the open view: closing soon (nearest deadline first),
 * then newly discovered open, then remaining open. Caller precomputes derived
 * state; this comparator is deterministic.
 */
export function compareOpenView(
  a: { opp: Opportunity; derived: DerivedState },
  b: { opp: Opportunity; derived: DerivedState },
  nowMs: number,
): number {
  const rank = (d: DerivedState): number =>
    d.closingSoon ? 0 : d.newToday ? 1 : 2;
  const rankDiff = rank(a.derived) - rank(b.derived);
  if (rankDiff !== 0) return rankDiff;
  if (a.derived.closingSoon && b.derived.closingSoon) {
    const da = daysUntilDeadline(a.opp.application_close, nowMs) ?? Infinity;
    const db = daysUntilDeadline(b.opp.application_close, nowMs) ?? Infinity;
    if (da !== db) return da - db;
  }
  // Newest discovery first, then stable id order.
  const ta = Date.parse(a.opp.first_discovered_at);
  const tb = Date.parse(b.opp.first_discovered_at);
  if (ta !== tb) return tb - ta;
  return a.opp.id < b.opp.id ? -1 : a.opp.id > b.opp.id ? 1 : 0;
}
