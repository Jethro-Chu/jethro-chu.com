# New Grad RN Tracker — automation contract

Version 1.0.0. Machine-readable companion: `automation-contract.json`.
Research input schema: `research-batch.schema.json`.

This is the shared interface between **Antigravity** (daily research) and
**Muse** (validation, ingestion, publication). The tracker itself is the
unlisted page at `https://jethrochu.com/newgrad` (direct URL only, noindex).

Priorities: website isolation > data accuracy > reliable updates >
simplicity > appearance.

## 1. Architecture

- Next.js 15 App Router site, deployed from git (`origin/master`) through the
  existing Vercel GitHub integration. No database, no cron, no new services.
- Tracker storage is validated JSON under `data/newgrad/`:
  `opportunities.json`, `hospitals.json`, `sources.json` (watchlist),
  `programs.json`, `cohorts.json`, `history.json`, `review.json`, `runs.json`,
  `meta.json`, `publication.json`.
- The `/newgrad` page renders committed data at build time. A data update
  reaches the public only through a data-only commit pushed to master
  (see section 7).
- No web admin route exists. Review is local-only via `newgrad:review`
  (section 8). There is deliberately no unauthenticated admin page.

## 2. Roles

**Antigravity** runs the schedule, visits official hospital and ATS pages,
collects facts with evidence, writes one research batch JSON file per run,
invokes Muse to implement it, then checks the published result.

**Muse** validates the batch, runs ingestion (dry run, then apply), runs
validation and tests, publishes when enabled, and reports. Muse never fills
missing research from model memory. Unsupported facts stay unknown or go to
review. Muse never rewrites application code during daily updates.

## 3. Research rules (Antigravity)

- Prefer official hospital pages and hospital-linked ATS listings (an ATS
  domain linked from the hospital counts as official even when the domain
  differs). Aggregators (Indeed, Glassdoor, LinkedIn, etc.) and search
  snippets are leads only and can never establish publication facts.
- An evergreen residency page does not prove applications are open. OPEN
  requires current evidence of acceptance.
- Do not assume RN I, Clinical Nurse I, residency, or fellowship means
  new-grad eligible. ELIGIBLE requires explicit language such as new
  graduates, newly licensed RNs, or no previous RN experience, quoted in the
  eligibility evidence excerpt. Distinguish required from preferred
  experience, and record when licensure is required (application, offer, or
  start).
- Record one `sources_checked` entry per attempted source, including
  failures, with `coverage_complete: false` for partial enumerations. A
  posting missing from a partial set is not closure evidence.
- Retrieval failures (timeout, rate limit, CAPTCHA, login, server error,
  empty response, parser failure, generic redirect) are reported as
  `FETCH_FAILED` findings or failed source checks. They never close records.
- Closure needs explicit closed/cancelled status, a confirmed deadline that
  passed, or a corroborated official removal with complete enumeration.
- Omitted records mean "not checked", never "delete".
- Dates: use `{kind: "date", value: "YYYY-MM-DD"}` for date-only facts,
  `{kind: "datetime", value: <ISO with offset>}` for exact times, and
  `{kind: "text", value: "Spring 2027"}` for seasons. Never invent a day
  from a season. Historical expectations never populate confirmed-date
  fields.
- Requisition identity: always capture `ats_provider`, tenant, and
  `requisition_id` when shown. Requisition ids are not globally unique, so
  all three parts travel together as the dedup key.
- Uncertainties and contradictions go in `uncertainties` (routes to review),
  never silently resolved.

Claim vocabulary for `evidence[].claim`: `status`,
`accepting_applications`, `closure`, `removal`, `opening_date`, `deadline`,
`start_date`, `eligibility`, `experience`, `license`, `license_timing`,
`education`, `title`, `unit`, `location`, `specialty`.

Specialty vocabulary: ICU, Critical Care, CVICU, MICU, SICU, Neuro ICU,
PICU, NICU, Emergency Department, Operating Room, PACU, Med-Surg,
Telemetry, Cardiology, Oncology, Pediatrics, L&D, Mother Baby,
Psychiatry, Rehabilitation, Float Pool, Multiple Specialties, Unknown.
The ICU quick filter matches ICU, Critical Care, CVICU, MICU, SICU,
Neuro ICU, PICU, and NICU. Telemetry and Cardiology are never ICU.

## 4. Deadline and timezone policy

- All observation timestamps (`retrieved_at`, run times, discovery times)
  are UTC ISO 8601.
- Date-only deadlines expire conservatively: only after the full UTC
  calendar day has elapsed. They never expire at the start of their day.
- Datetime deadlines with offsets expire at their exact instant.
- Text dates never drive expiry or closing-soon logic.
- Display shows dates as the source stated them, with observation
  timestamps in UTC.

## 5. Status model

Stored `application_status`: OPEN, OPENING_SOON, EXPECTED, CLOSED, UNKNOWN.
CLOSING_SOON is derived at render for OPEN records with a confirmed
deadline within 7 days; it is never stored. Stored
`verification_health` (VERIFIED, TEMPORARY_FAILURE, BLOCKED,
PARSER_FAILURE, NEEDS_REVERIFICATION, STALE) is independent of status.
Render also derives STALE (no successful verification for 14 days),
deadline-passed closure display, and New Today (first discovered within
24 hours, distinct from employer posting date).

## 6. Daily handoff procedure (exact)

Antigravity, after research:

1. Write the batch to the operator machine, e.g.
   `data/newgrad/inbox/batch-<run_id>.json` (gitignored; any path works).
2. Invoke Muse (local CLI session on the operator machine, per the
   operator's existing setup) with: the batch file path, the `run_id`,
   and a pointer to this document.
3. After Muse reports completion, load the tracker URL, confirm the
   freshness line shows the new run, and record the outcome.

Muse, on invocation (from `/Users/jethrochu/dev/portfolio`):

```bash
npm run newgrad:ingest -- --batch data/newgrad/inbox/batch-<run_id>.json --dry-run
npm run newgrad:ingest -- --batch data/newgrad/inbox/batch-<run_id>.json --apply --report /tmp/newgrad-<run_id>.json
npm run newgrad:validate
npm run verify:newgrad
git status --short   # must show only data/newgrad/*.json changes
```

Then, only when publication is enabled (section 7):

```bash
npm run newgrad:publish -- --run <run_id> --push
```

Report back: counts from the JSON report (created/updated/closed/
pending/rejected), validation and test results, pending review items,
failed checks, and the publication result. Surface the pending review
reasons; do not silently approve them.

Safety properties Muse relies on (implemented in `lib/newgrad/ingest.ts`):
idempotent `run_id`, null-safe updates, manual-correction locks, fuzzy
matches flag but never merge, failures never close, invalid batches and
invalid result datasets abort before any write, atomic writes with `.bak`
backups.

## 7. Publication

- Mechanism: data-only commit on top of `origin/master` in an isolated
  temp worktree, fast-forward push to `origin/master`, Vercel auto-deploys.
- The publish script refuses when `data/newgrad/publication.json` has
  `enabled: false` (current state), when validation fails, when the tree
  has non-data changes, or when the push is not a fast-forward. Failures
  preserve public data and retain the local update for retry.
- Activation (operator only, after reviewing the feature branch):
  1. Merge the feature branch to master and confirm the deployed page.
  2. Set `enabled: true` in `data/newgrad/publication.json` via a normal
     commit.
  3. Confirm one dry run: `npm run newgrad:publish -- --run <run_id>`
     without `--push`, then allow daily `--push` runs.

## 8. Review workflow (local commands)

```bash
npm run newgrad:review -- list [--state PENDING|APPROVED|REJECTED|all]
npm run newgrad:review -- show <review_id>
npm run newgrad:review -- approve <review_id> --by <name> --note <text>
npm run newgrad:review -- reject <review_id> --by <name> --note <text>
npm run newgrad:review -- correct <opp_id> <field> <json_value> --by <name> --reason <text>
npm run newgrad:review -- unlock <opp_id> <field> --by <name> --reason <text>
npm run newgrad:review -- source-add <hospital_id> <label> [--url <u>]...
npm run newgrad:review -- source-activate <source_id> --by <name>
npm run newgrad:review -- source-disable <source_id> --by <name> --reason <text>
npm run newgrad:review -- failed [--run <run_id>]
npm run newgrad:review -- history <opp_id>
npm run newgrad:review -- runs
```

`correct` writes the value, locks the field against automated overwrite,
and appends a CORRECTED history event. Approve/reject record decisions
only; to publish a held finding, activate its source (the next batch
auto-publishes) or `correct` the record directly.

## 9. Watchlist

`data/newgrad/sources.json` seeds 47 candidate sources (21 California,
26 national) with no URLs. URLs are added only after verification, via
`source-add` (with `--url`) or by editing the file, then
`source-activate`. Shared career boards carry a `shared_board` tag so
Antigravity scans once and tags locations per requisition. Ambiguous
institutions carry a note and must be resolved before activation.

## 10. Minimal batch example

```json
{
  "schema_version": "1.0.0",
  "run_id": "2026-09-18-daily",
  "research_started_at": "2026-09-18T08:00:00.000Z",
  "research_completed_at": "2026-09-18T08:25:00.000Z",
  "sources_checked": [
    {
      "source_id": "src_example",
      "url": "https://careers.example.org/nurse-residency",
      "attempted_at": "2026-09-18T08:05:00.000Z",
      "retrieved_at": "2026-09-18T08:05:12.000Z",
      "outcome": "ok",
      "coverage_complete": true,
      "error": null
    }
  ],
  "findings": [
    {
      "employer": { "name": "Example Health", "hospital_id": null },
      "identifiers": {
        "program": "Nurse Residency",
        "cohort": "Spring 2027",
        "requisition_id": "REQ-123",
        "ats_provider": "workday",
        "ats_tenant": "example",
        "opportunity_id": null
      },
      "observed_state": "OPEN",
      "eligibility": { "assessment": "ELIGIBLE", "note": null },
      "facts": {
        "position_title": "New Grad RN, Medical-Surgical",
        "locations": [{ "city": "Los Angeles", "state": "CA" }],
        "specialties": ["Med-Surg"],
        "application_close": { "kind": "date", "value": "2026-10-15" },
        "source_url": "https://careers.example.org/jobs/REQ-123",
        "application_url": "https://careers.example.org/apply/REQ-123"
      },
      "evidence": [
        {
          "source_url": "https://careers.example.org/jobs/REQ-123",
          "excerpt": "Now accepting applications from new graduate RNs for our Spring cohort.",
          "retrieved_at": "2026-09-18T08:05:12.000Z",
          "claim": "eligibility"
        },
        {
          "source_url": "https://careers.example.org/jobs/REQ-123",
          "excerpt": "Apply now. Applications close October 15, 2026.",
          "retrieved_at": "2026-09-18T08:05:12.000Z",
          "claim": "status"
        }
      ],
      "uncertainties": null
    }
  ],
  "unresolved_items": []
}
```
