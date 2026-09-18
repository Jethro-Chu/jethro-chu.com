"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  compareOpenView,
  daysUntilDeadline,
  deriveState,
  matchesOpenFilter,
  type DerivedState,
} from "@/lib/newgrad/status";
import { ICU_FILTER_SPECIALTIES, SPECIALTIES } from "@/lib/newgrad/types";
import type {
  Cohort,
  DatasetMeta,
  DisplayStatus,
  FlexibleDate,
  Hospital,
  Opportunity,
  Program,
  ResearchRun,
} from "@/lib/newgrad/types";

interface DatasetProps {
  meta: DatasetMeta;
  hospitals: Hospital[];
  opportunities: Opportunity[];
  programs: Program[];
  cohorts: Cohort[];
  lastRun: ResearchRun | null;
}

type StatusParam = "open" | "closing" | "opening_soon" | "expected" | "closed" | "unknown" | "all";

interface Filters {
  q: string;
  status: StatusParam;
  state: string;
  city: string;
  specialty: string;
  cohort: string;
  newOnly: boolean;
}

type SortKey =
  | "hospital"
  | "position"
  | "city"
  | "specialty"
  | "cohort"
  | "opens"
  | "closes"
  | "start"
  | "status"
  | "verified";

const PRIMARY_COLS = [
  "hospital",
  "position",
  "city",
  "state",
  "specialty",
  "cohort",
  "opens",
  "closes",
  "start",
  "status",
  "verified",
] as const;

const OPTIONAL_COLS = [
  "unit",
  "system",
  "bsn",
  "license",
  "experience",
  "source",
  "discovered",
] as const;

type ColId = (typeof PRIMARY_COLS)[number] | (typeof OPTIONAL_COLS)[number];

const COL_LABELS: Record<ColId, string> = {
  hospital: "Hospital",
  position: "Program / Position",
  city: "City",
  state: "State",
  specialty: "Specialty",
  cohort: "Cohort",
  opens: "Application Opens",
  closes: "Application Closes",
  start: "Start Date",
  status: "Status",
  verified: "Last Verified",
  unit: "Unit",
  system: "Health System",
  bsn: "BSN Required",
  license: "License Requirement",
  experience: "Experience Requirement",
  source: "Source",
  discovered: "First Discovered",
};

const SORTABLE: Partial<Record<ColId, SortKey>> = {
  hospital: "hospital",
  position: "position",
  city: "city",
  specialty: "specialty",
  cohort: "cohort",
  opens: "opens",
  closes: "closes",
  start: "start",
  status: "status",
  verified: "verified",
};

function formatFlexDate(d: FlexibleDate | null): string {
  if (!d) return "—";
  if (d.kind === "text") return d.value;
  if (d.kind === "date") {
    const t = Date.parse(`${d.value}T00:00:00Z`);
    if (Number.isNaN(t)) return d.value;
    return new Date(t).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  }
  const t = Date.parse(d.value);
  if (Number.isNaN(t)) return d.value;
  return new Date(t).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatStamp(iso: string | null): string {
  if (!iso) return "never";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "—";
  return (
    new Date(t).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }) + " UTC"
  );
}

function statusLabel(s: DisplayStatus): string {
  switch (s) {
    case "OPEN":
      return "Open";
    case "CLOSING_SOON":
      return "Closing soon";
    case "OPENING_SOON":
      return "Opening soon";
    case "EXPECTED":
      return "Expected";
    case "CLOSED":
      return "Closed";
    case "UNKNOWN":
      return "Unknown";
  }
}

function statusClass(s: DisplayStatus): string {
  switch (s) {
    case "OPEN":
      return "ng-pill ng-pill-open";
    case "CLOSING_SOON":
      return "ng-pill ng-pill-closing";
    case "OPENING_SOON":
      return "ng-pill ng-pill-soon";
    case "EXPECTED":
      return "ng-pill ng-pill-expected";
    case "CLOSED":
      return "ng-pill ng-pill-closed";
    case "UNKNOWN":
      return "ng-pill ng-pill-unknown";
  }
}

function healthLabel(h: string): string {
  switch (h) {
    case "VERIFIED":
      return "Verified";
    case "TEMPORARY_FAILURE":
      return "Temporarily unavailable";
    case "BLOCKED":
      return "Blocked";
    case "PARSER_FAILURE":
      return "Parser failed";
    case "NEEDS_REVERIFICATION":
      return "Needs recheck";
    case "STALE":
      return "Stale";
    default:
      return h;
  }
}

function sortInstant(d: FlexibleDate | null): number {
  if (!d || d.kind === "text") return Number.POSITIVE_INFINITY;
  const t =
    d.kind === "datetime" ? Date.parse(d.value) : Date.parse(`${d.value}T00:00:00Z`);
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

function readFilters(params: URLSearchParams): Filters {
  const statusRaw = (params.get("status") ?? "open").toLowerCase();
  const status: StatusParam =
    statusRaw === "open" ||
    statusRaw === "closing" ||
    statusRaw === "opening_soon" ||
    statusRaw === "expected" ||
    statusRaw === "closed" ||
    statusRaw === "unknown" ||
    statusRaw === "all"
      ? statusRaw
      : "open";
  return {
    q: params.get("q") ?? "",
    status,
    state: params.get("state") ?? "",
    city: params.get("city") ?? "",
    specialty: params.get("specialty") ?? "",
    cohort: params.get("cohort") ?? "",
    newOnly: params.get("new") === "1",
  };
}

function filtersToQuery(f: Filters, sort: { key: SortKey; dir: 1 | -1 } | null): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.status !== "open") p.set("status", f.status);
  if (f.state) p.set("state", f.state);
  if (f.city) p.set("city", f.city);
  if (f.specialty) p.set("specialty", f.specialty);
  if (f.cohort) p.set("cohort", f.cohort);
  if (f.newOnly) p.set("new", "1");
  if (sort) {
    p.set("sort", sort.key);
    p.set("dir", sort.dir === 1 ? "asc" : "desc");
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

const DEFAULT_FILTERS: Filters = {
  q: "",
  status: "open",
  state: "",
  city: "",
  specialty: "",
  cohort: "",
  newOnly: false,
};

function Inner(props: DatasetProps) {
  const { meta, hospitals, opportunities, programs, cohorts } = props;
  const router = useRouter();
  const pathname = usePathname();
  const [nowMs] = useState(() => Date.now());

  // Render defaults during SSR so the static HTML carries the full table;
  // URL params are applied once on mount (see effect below).
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 } | null>(null);
  const persistArmed = useRef(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hiddenCols, setHiddenCols] = useState<Set<ColId>>(
    () => new Set<ColId>(["unit", "system", "bsn", "license", "experience", "source", "discovered"]),
  );

  // Load persisted column choices after mount (SSR-safe: no window on server).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("newgrad-cols");
      if (raw) setHiddenCols(new Set(JSON.parse(raw) as ColId[]));
    } catch {
      // ignore
    }
  }, []);
  const [showOptionalMobile, setShowOptionalMobile] = useState(false);

  // Apply URL params once after mount (SSR-safe: no window on server).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFilters(readFilters(params));
    const key = params.get("sort") as SortKey | null;
    setSort(key ? { key, dir: params.get("dir") === "desc" ? -1 : 1 } : null);
  }, []);

  // Persist filter + sort state to the URL. The first run is skipped so the
  // mount commit (defaults) never overwrites params the read above absorbed.
  useEffect(() => {
    if (!persistArmed.current) {
      persistArmed.current = true;
      return;
    }
    const query = filtersToQuery(filters, sort);
    router.replace(`${pathname}${query}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sort]);

  useEffect(() => {
    try {
      window.localStorage.setItem("newgrad-cols", JSON.stringify([...hiddenCols]));
    } catch {
      // ignore
    }
  }, [hiddenCols]);

  useEffect(() => {
    setPage(0);
    setExpandedId(null);
  }, [filters, sort, pageSize]);

  const hospitalById = useMemo(() => new Map(hospitals.map((h) => [h.id, h])), [hospitals]);
  const programById = useMemo(() => new Map(programs.map((p) => [p.id, p])), [programs]);
  const cohortById = useMemo(() => new Map(cohorts.map((c) => [c.id, c])), [cohorts]);

  const derived = useMemo(
    () =>
      opportunities.map((opp) => ({
        opp,
        derived: deriveState(opp, nowMs) as DerivedState,
      })),
    [opportunities, nowMs],
  );

  const stateOptions = useMemo(() => {
    const s = new Set<string>();
    for (const { opp } of derived) for (const l of opp.locations) s.add(l.state);
    return [...s].sort();
  }, [derived]);

  const cityOptions = useMemo(() => {
    const s = new Set<string>();
    for (const { opp } of derived) {
      for (const l of opp.locations) {
        if (!filters.state || l.state === filters.state) s.add(`${l.city}, ${l.state}`);
      }
    }
    return [...s].sort();
  }, [derived, filters.state]);

  const cohortOptions = useMemo(() => {
    const s = new Set<string>();
    for (const { opp } of derived) {
      const c = opp.cohort_id ? cohortById.get(opp.cohort_id) : undefined;
      if (c) s.add(c.label);
    }
    return [...s].sort();
  }, [derived, cohortById]);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const out = derived.filter(({ opp, derived: d }) => {
      if (filters.status === "open" && !matchesOpenFilter(d.display)) return false;
      if (filters.status === "closing" && d.display !== "CLOSING_SOON") return false;
      if (filters.status === "opening_soon" && d.display !== "OPENING_SOON") return false;
      if (filters.status === "expected" && d.display !== "EXPECTED") return false;
      if (filters.status === "closed" && d.display !== "CLOSED") return false;
      if (filters.status === "unknown" && d.display !== "UNKNOWN") return false;
      if (filters.newOnly && !d.newToday) return false;
      if (filters.state && !opp.locations.some((l) => l.state === filters.state)) return false;
      if (filters.city && !opp.locations.some((l) => `${l.city}, ${l.state}` === filters.city)) return false;
      if (filters.specialty) {
        if (filters.specialty === "ICU") {
          if (!opp.specialties.some((s) => ICU_FILTER_SPECIALTIES.has(s))) return false;
        } else if (!opp.specialties.includes(filters.specialty as (typeof opp.specialties)[number])) {
          return false;
        }
      }
      if (filters.cohort) {
        const c = opp.cohort_id ? cohortById.get(opp.cohort_id) : undefined;
        if (!c || c.label !== filters.cohort) return false;
      }
      if (q) {
        const h = hospitalById.get(opp.hospital_id);
        const hay = [
          h?.name ?? "",
          h?.health_system ?? "",
          opp.position_title,
          opp.unit ?? "",
          ...opp.locations.map((l) => `${l.city} ${l.state}`),
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    if (sort) {
      const dir = sort.dir;
      out.sort((a, b) => {
        let cmp = 0;
        switch (sort.key) {
          case "hospital":
            cmp = (hospitalById.get(a.opp.hospital_id)?.name ?? "").localeCompare(
              hospitalById.get(b.opp.hospital_id)?.name ?? "",
            );
            break;
          case "position":
            cmp = a.opp.position_title.localeCompare(b.opp.position_title);
            break;
          case "city":
            cmp = (a.opp.locations[0]?.city ?? "").localeCompare(b.opp.locations[0]?.city ?? "");
            break;
          case "specialty":
            cmp = (a.opp.specialties[0] ?? "").localeCompare(b.opp.specialties[0] ?? "");
            break;
          case "cohort":
            cmp = (a.opp.cohort_id ? (cohortById.get(a.opp.cohort_id)?.label ?? "") : "").localeCompare(
              b.opp.cohort_id ? (cohortById.get(b.opp.cohort_id)?.label ?? "") : "",
            );
            break;
          case "opens":
            cmp = sortInstant(a.opp.application_open) - sortInstant(b.opp.application_open);
            break;
          case "closes":
            cmp = sortInstant(a.opp.application_close) - sortInstant(b.opp.application_close);
            break;
          case "start":
            cmp = sortInstant(a.opp.program_start) - sortInstant(b.opp.program_start);
            break;
          case "status":
            cmp = a.derived.display.localeCompare(b.derived.display);
            break;
          case "verified": {
            const ta = a.opp.last_verified_at ? Date.parse(a.opp.last_verified_at) : Number.NaN;
            const tb = b.opp.last_verified_at ? Date.parse(b.opp.last_verified_at) : Number.NaN;
            cmp = (Number.isNaN(ta) ? -1 : ta) - (Number.isNaN(tb) ? -1 : tb);
            break;
          }
        }
        return cmp * dir;
      });
    } else {
      out.sort((a, b) => compareOpenView(a, b, nowMs));
    }
    return out;
  }, [derived, filters, sort, hospitalById, cohortById, nowMs]);

  const openCount = derived.filter(({ derived: d }) => matchesOpenFilter(d.display)).length;
  const closingCount = derived.filter(({ derived: d }) => d.closingSoon).length;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const visibleCols = useMemo(
    () => [...PRIMARY_COLS, ...OPTIONAL_COLS].filter((c) => !hiddenCols.has(c)),
    [hiddenCols],
  );

  const toggleSort = (key: SortKey) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 1 };
      if (prev.dir === 1) return { key, dir: -1 };
      return null;
    });
  };

  const setQuick = (preset: "open" | "new" | "closing" | "icu" | "or" | "ed") => {
    setFilters((f) => {
      switch (preset) {
        case "open":
          return { ...f, status: "open", newOnly: false, specialty: "" };
        case "new":
          return { ...f, status: "all", newOnly: true };
        case "closing":
          return { ...f, status: "closing", newOnly: false };
        case "icu":
          return { ...f, status: "open", newOnly: false, specialty: "ICU" };
        case "or":
          return { ...f, status: "open", newOnly: false, specialty: "Operating Room" };
        case "ed":
          return { ...f, status: "open", newOnly: false, specialty: "Emergency Department" };
      }
    });
  };

  const quickActive = (preset: string): boolean => {
    switch (preset) {
      case "open":
        return filters.status === "open" && !filters.newOnly && !filters.specialty;
      case "new":
        return filters.newOnly;
      case "closing":
        return filters.status === "closing";
      case "icu":
        return filters.specialty === "ICU";
      case "or":
        return filters.specialty === "Operating Room";
      case "ed":
        return filters.specialty === "Emergency Department";
      default:
        return false;
    }
  };

  const stale =
    !meta.last_successful_verification_at ||
    nowMs - Date.parse(meta.last_successful_verification_at) > 14 * 86_400_000;

  const renderCell = (col: ColId, opp: Opportunity, d: DerivedState) => {
    const h = hospitalById.get(opp.hospital_id);
    const cohort = opp.cohort_id ? cohortById.get(opp.cohort_id) : undefined;
    switch (col) {
      case "hospital":
        return (
          <button
            type="button"
            className="ng-rowbtn"
            aria-expanded={expandedId === opp.id}
            onClick={() => setExpandedId(expandedId === opp.id ? null : opp.id)}
          >
            {h?.name ?? "Unknown hospital"}
          </button>
        );
      case "position":
        return (
          <span className="ng-pos">
            {opp.position_title}
            {opp.unit && <span className="ng-muted"> · {opp.unit}</span>}
          </span>
        );
      case "city":
        return opp.locations.map((l) => l.city).join("; ");
      case "state":
        return [...new Set(opp.locations.map((l) => l.state))].join(", ");
      case "specialty":
        return opp.specialties.join("; ");
      case "cohort":
        return cohort?.label ?? "—";
      case "opens":
        return formatFlexDate(opp.application_open);
      case "closes": {
        const days = daysUntilDeadline(opp.application_close, nowMs);
        const label = formatFlexDate(opp.application_close);
        if (d.display === "OPEN" || d.display === "CLOSING_SOON") {
          if (opp.application_close && days !== null && days >= 0 && days <= 30) {
            return `${label} (${days}d)`;
          }
        }
        return label;
      }
      case "start":
        return formatFlexDate(opp.program_start);
      case "status":
        return (
          <span>
            <span className={statusClass(d.display)}>{statusLabel(d.display)}</span>
            {d.openingPassedUnconfirmed && (
              <span className="ng-muted"> · needs recheck</span>
            )}
          </span>
        );
      case "verified":
        return <span className="ng-mono">{formatStamp(opp.last_verified_at)}</span>;
      case "unit":
        return opp.unit ?? "—";
      case "system":
        return h?.health_system ?? "—";
      case "bsn":
        return opp.bsn_required === null ? "—" : opp.bsn_required ? "Yes" : "No";
      case "license":
        return opp.rn_license_requirement ?? "—";
      case "experience":
        return opp.experience_requirement ?? "—";
      case "source":
        return (
          <a href={opp.source_url} target="_blank" rel="noreferrer">
            {(() => {
              try {
                return new URL(opp.source_url).hostname.replace(/^www\./, "");
              } catch {
                return "Source";
              }
            })()}
          </a>
        );
      case "discovered":
        return <span className="ng-mono">{formatStamp(opp.first_discovered_at)}</span>;
    }
  };

  return (
    <div className="ng-shell">
      <p className="ng-kicker">New Grad RN Tracker</p>
      <h1 className="ng-title">New graduate RN openings</h1>
      <p className="ng-sub">
        Verified residency and new-grad openings from official hospital sources.
        Unlisted page: share the URL directly. Showing {filtered.length} of{" "}
        {opportunities.length} tracked opportunities · {openCount} open ·{" "}
        {closingCount} closing soon.
      </p>

      <dl className="ng-fresh">
        <div>
          <dt>Last research:</dt> <dd>{formatStamp(meta.last_research_attempt_at)}</dd>
        </div>
        <div>
          <dt>Last verified:</dt>{" "}
          <dd>
            {formatStamp(meta.last_successful_verification_at)}{" "}
            {stale && <span className="ng-stale-flag">(stale)</span>}
          </dd>
        </div>
        <div>
          <dt>Last published:</dt> <dd>{formatStamp(meta.last_published_at)}</dd>
        </div>
        {meta.coverage_note && <div className="ng-fresh-note">{meta.coverage_note}</div>}
      </dl>

      <div className="ng-controls">
        <div className="ng-quick" role="group" aria-label="Quick filters">
          {(
            [
              ["open", "Open"],
              ["new", "New Today"],
              ["closing", "Closing Soon"],
              ["icu", "ICU"],
              ["or", "OR"],
              ["ed", "ED"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className="ng-chip"
              aria-pressed={quickActive(key)}
              onClick={() => setQuick(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="ng-filters">
          <label className="ng-field">
            <span>Search</span>
            <input
              type="search"
              className="ng-search"
              placeholder="Hospital, position, unit, city…"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            />
          </label>
          <label className="ng-field">
            <span>Status</span>
            <select
              className="ng-select"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as StatusParam })}
            >
              <option value="open">Open (incl. closing soon)</option>
              <option value="closing">Closing soon</option>
              <option value="opening_soon">Opening soon</option>
              <option value="expected">Expected</option>
              <option value="closed">Closed</option>
              <option value="unknown">Unknown</option>
              <option value="all">All statuses</option>
            </select>
          </label>
          <label className="ng-field">
            <span>State</span>
            <select
              className="ng-select"
              value={filters.state}
              onChange={(e) => setFilters({ ...filters, state: e.target.value, city: "" })}
            >
              <option value="">All states</option>
              {stateOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="ng-field">
            <span>City</span>
            <select
              className="ng-select"
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            >
              <option value="">All cities</option>
              {cityOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="ng-field">
            <span>Specialty</span>
            <select
              className="ng-select"
              value={filters.specialty}
              onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
            >
              <option value="">All specialties</option>
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>
                  {s === "ICU" ? "ICU (all subtypes)" : s}
                </option>
              ))}
            </select>
          </label>
          <label className="ng-field">
            <span>Cohort</span>
            <select
              className="ng-select"
              value={filters.cohort}
              onChange={(e) => setFilters({ ...filters, cohort: e.target.value })}
            >
              <option value="">All cohorts</option>
              {cohortOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="ng-field">
            <span>New today</span>
            <select
              className="ng-select"
              value={filters.newOnly ? "1" : ""}
              onChange={(e) => setFilters({ ...filters, newOnly: e.target.value === "1" })}
            >
              <option value="">All</option>
              <option value="1">New today only</option>
            </select>
          </label>
        </div>
      </div>

      <p className="ng-counts" aria-live="polite">
        {filtered.length === 0
          ? "No opportunities match these filters."
          : `Showing ${safePage * pageSize + 1}-${Math.min(filtered.length, safePage * pageSize + pageSize)} of ${filtered.length} · page ${safePage + 1}/${totalPages}`}
      </p>

      {filtered.length === 0 ? (
        <div className="ng-empty">
          <p className="ng-empty-title">
            {opportunities.length === 0 ? "No verified openings yet." : "No matches."}
          </p>
          <p className="ng-empty-body">
            {opportunities.length === 0
              ? "The watchlist is seeded and research runs will populate this table. Nothing is published without official evidence."
              : "Try widening the status filter or clearing search."}
          </p>
        </div>
      ) : (
        <div className={`ng-tablewrap${showOptionalMobile ? " ng-cols-force" : ""}`}>
          <table className="ng-table">
            <thead>
              <tr>
                {visibleCols.map((col) => {
                  const sortKey = SORTABLE[col];
                  const isOpt = (OPTIONAL_COLS as readonly string[]).includes(col);
                  return (
                    <th
                      key={col}
                      scope="col"
                      className={isOpt ? "ng-col-opt" : undefined}
                      aria-sort={
                        sortKey && sort?.key === sortKey
                          ? sort.dir === 1
                            ? "ascending"
                            : "descending"
                          : undefined
                      }
                    >
                      {sortKey ? (
                        <button
                          type="button"
                          className="ng-thbtn"
                          onClick={() => toggleSort(sortKey)}
                          aria-label={`Sort by ${COL_LABELS[col]}`}
                        >
                          {COL_LABELS[col]}
                        </button>
                      ) : (
                        <span className="ng-thbtn">{COL_LABELS[col]}</span>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {pageRows.map(({ opp, derived: d }) => (
                <Fragment key={opp.id}>
                  <tr data-open="true">
                    {visibleCols.map((col) => {
                      const isOpt = (OPTIONAL_COLS as readonly string[]).includes(col);
                      return (
                        <td key={col} className={isOpt ? "ng-col-opt" : undefined}>
                          {renderCell(col, opp, d)}
                        </td>
                      );
                    })}
                  </tr>
                  {expandedId === opp.id && (
                    <tr key={`${opp.id}-detail`} className="ng-detail">
                      <td colSpan={visibleCols.length}>
                        <DetailPanel
                          opp={opp}
                          derived={d}
                          hospital={hospitalById.get(opp.hospital_id)}
                          program={opp.program_id ? programById.get(opp.program_id) : undefined}
                          cohort={opp.cohort_id ? cohortById.get(opp.cohort_id) : undefined}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="ng-pager">
          <button type="button" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
            Previous
          </button>
          <span>
            Page {safePage + 1} of {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage(safePage + 1)}
          >
            Next
          </button>
          <label className="ng-field">
            <span>Per page</span>
            <select
              className="ng-select"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </div>
      )}

      <details className="ng-cols">
        <summary>Column visibility ({visibleCols.length} shown)</summary>
        <div className="ng-cols-list">
          {[...PRIMARY_COLS, ...OPTIONAL_COLS].map((col) => {
            const locked = col === "hospital" || col === "position";
            return (
              <label key={col}>
                <input
                  type="checkbox"
                  checked={!hiddenCols.has(col)}
                  disabled={locked}
                  onChange={(e) => {
                    setHiddenCols((prev) => {
                      const nextSet = new Set(prev);
                      if (e.target.checked) nextSet.delete(col);
                      else nextSet.add(col);
                      return nextSet;
                    });
                  }}
                />
                {COL_LABELS[col]}
              </label>
            );
          })}
        </div>
        <div className="ng-cols-list">
          <label>
            <input
              type="checkbox"
              checked={showOptionalMobile}
              onChange={(e) => setShowOptionalMobile(e.target.checked)}
            />
            Show optional columns on small screens
          </label>
        </div>
      </details>
    </div>
  );
}

function DetailPanel({
  opp,
  derived,
  hospital,
  program,
  cohort,
}: {
  opp: Opportunity;
  derived: DerivedState;
  hospital: Hospital | undefined;
  program: Program | undefined;
  cohort: Cohort | undefined;
}) {
  const statusEvidence = opp.evidence.find((e) =>
    ["status", "accepting_applications", "closure", "removal"].includes(e.claim),
  );
  const shownExcerpt = statusEvidence ?? opp.evidence[0];
  const hasSeparateApply = !!opp.application_url && opp.application_url !== opp.source_url;
  return (
    <div>
      <dl className="ng-detail-grid">
        <div>
          <dt>Hospital</dt>
          <dd>{hospital?.name ?? "Unknown"}</dd>
        </div>
        <div>
          <dt>Health system</dt>
          <dd>{hospital?.health_system ?? "—"}</dd>
        </div>
        <div>
          <dt>Position</dt>
          <dd>{opp.position_title}</dd>
        </div>
        <div>
          <dt>Program</dt>
          <dd>{program?.name ?? "—"}</dd>
        </div>
        <div>
          <dt>Locations</dt>
          <dd>{opp.locations.map((l) => `${l.city}, ${l.state}`).join("; ")}</dd>
        </div>
        <div>
          <dt>Specialties / Unit</dt>
          <dd>
            {opp.specialties.join("; ")}
            {opp.unit ? ` · ${opp.unit}` : ""}
          </dd>
        </div>
        <div>
          <dt>Cohort</dt>
          <dd>{cohort?.label ?? "—"}</dd>
        </div>
        <div>
          <dt>Application opens</dt>
          <dd>{formatFlexDate(opp.application_open)}</dd>
        </div>
        <div>
          <dt>Application closes</dt>
          <dd>{formatFlexDate(opp.application_close)}</dd>
        </div>
        <div>
          <dt>Start date</dt>
          <dd>{formatFlexDate(opp.program_start)}</dd>
        </div>
        <div>
          <dt>Education</dt>
          <dd>{opp.bsn_required === null ? "—" : opp.bsn_required ? "BSN required" : "BSN not required"}</dd>
        </div>
        <div>
          <dt>License</dt>
          <dd>
            {opp.rn_license_requirement ?? "—"}
            {opp.license_required_by ? ` (required by: ${opp.license_required_by})` : ""}
          </dd>
        </div>
        <div>
          <dt>Experience</dt>
          <dd>{opp.experience_requirement ?? "—"}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <span className={statusClass(derived.display)}>{statusLabel(derived.display)}</span>
          </dd>
        </div>
        <div>
          <dt>Verification</dt>
          <dd>
            {healthLabel(derived.health)} · last verified {formatStamp(opp.last_verified_at)}
          </dd>
        </div>
        <div>
          <dt>First discovered</dt>
          <dd>{formatStamp(opp.first_discovered_at)}</dd>
        </div>
      </dl>
      {shownExcerpt && (
        <div>
          <p className="ng-muted" style={{ margin: "0 0 2px" }}>
            Supporting excerpt ({shownExcerpt.claim}, retrieved {formatStamp(shownExcerpt.retrieved_at)}):
          </p>
          <p className="ng-excerpt">“{shownExcerpt.excerpt}”</p>
        </div>
      )}
      <p className="ng-muted ng-mono" style={{ overflowWrap: "anywhere" }}>
        Source: {opp.source_url}
        {opp.application_url ? ` · Apply: ${opp.application_url}` : ""}
      </p>
      <div className="ng-actions">
        {hasSeparateApply && (
          <a className="ng-btn" href={opp.application_url!} target="_blank" rel="noreferrer">
            Apply
          </a>
        )}
        <a className="ng-btn ng-btn-secondary" href={opp.source_url} target="_blank" rel="noreferrer">
          {hasSeparateApply ? "View source" : "View program"}
        </a>
      </div>
    </div>
  );
}

export function NewgradTable(props: DatasetProps) {
  return <Inner {...props} />;
}
