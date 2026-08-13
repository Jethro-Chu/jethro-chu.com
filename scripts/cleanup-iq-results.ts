import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

interface Filters {
  attemptIds: Set<string>;
  from?: number;
  to?: number;
  minScore?: number;
  maxScore?: number;
  fasterThan?: number;
  slowerThan?: number;
}

const help = `
Safely inspect or delete stored IQ test attempts.

Usage:
  npm run iq:results:cleanup -- [filters] [--apply]

Filters are combined. At least one is required:
  --attempt <uuid>       Match one attempt ID. May be repeated.
  --from <ISO date>      Completed at or after this time.
  --to <ISO date>        Completed at or before this time.
  --min-score <number>   Minimum IQ score.
  --max-score <number>   Maximum IQ score.
  --faster-than <secs>   Completion time at or below this many seconds.
  --slower-than <secs>   Completion time at or above this many seconds.

Actions:
  --apply                Delete the previewed attempts and rebuild all stats.
  --help                 Show this help.

Examples:
  npm run iq:results:cleanup -- --from 2026-08-13T18:00:00Z --faster-than 60
  npm run iq:results:cleanup -- --attempt 00000000-0000-4000-8000-000000000000 --apply

The command is a dry run unless --apply is present. It reads production-style
.env files, including .env.production.local.
`.trim();

function requiredValue(args: string[], index: number, option: string) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${option} requires a value`);
  }
  return value;
}

function timestamp(value: string, option: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${option} must be an ISO date`);
  return parsed;
}

function integer(value: string, option: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${option} must be a non-negative integer`);
  }
  return parsed;
}

function parseArguments(args: string[]) {
  const filters: Filters = { attemptIds: new Set() };
  let apply = false;

  for (let index = 0; index < args.length; index += 1) {
    const option = args[index];
    if (option === "--help") return { filters, apply, showHelp: true };
    if (option === "--apply") {
      apply = true;
      continue;
    }

    const value = requiredValue(args, index, option);
    index += 1;
    if (option === "--attempt") filters.attemptIds.add(value);
    else if (option === "--from") filters.from = timestamp(value, option);
    else if (option === "--to") filters.to = timestamp(value, option);
    else if (option === "--min-score") filters.minScore = integer(value, option);
    else if (option === "--max-score") filters.maxScore = integer(value, option);
    else if (option === "--faster-than") {
      filters.fasterThan = integer(value, option);
    } else if (option === "--slower-than") {
      filters.slowerThan = integer(value, option);
    } else {
      throw new Error(`Unknown option: ${option}`);
    }
  }

  return { filters, apply, showHelp: false };
}

function hasFilter(filters: Filters) {
  return (
    filters.attemptIds.size > 0 ||
    filters.from !== undefined ||
    filters.to !== undefined ||
    filters.minScore !== undefined ||
    filters.maxScore !== undefined ||
    filters.fasterThan !== undefined ||
    filters.slowerThan !== undefined
  );
}

const parsed = parseArguments(process.argv.slice(2));
if (parsed.showHelp) {
  console.log(help);
  process.exit(0);
}
if (!hasFilter(parsed.filters)) {
  throw new Error(`At least one filter is required.\n\n${help}`);
}
if (
  parsed.filters.from !== undefined &&
  parsed.filters.to !== undefined &&
  parsed.filters.from > parsed.filters.to
) {
  throw new Error("--from must be earlier than --to");
}
if (
  parsed.filters.minScore !== undefined &&
  parsed.filters.maxScore !== undefined &&
  parsed.filters.minScore > parsed.filters.maxScore
) {
  throw new Error("--min-score must not exceed --max-score");
}

loadEnvConfig(process.cwd(), false);
const {
  deleteIQAttemptsAndRebuild,
  hasIQResultsStore,
  listIQAttemptsForAdmin,
} = await import("../lib/iqtest/store.ts");

if (!hasIQResultsStore()) {
  throw new Error(
    "Redis credentials are missing. Pull production variables with `vercel env pull .env.production.local`.",
  );
}

const attempts = await listIQAttemptsForAdmin();
const matches = attempts.filter((attempt) => {
  const completedAt = Date.parse(attempt.completedAt);
  const filters = parsed.filters;
  return (
    (filters.attemptIds.size === 0 || filters.attemptIds.has(attempt.attemptId)) &&
    (filters.from === undefined || completedAt >= filters.from) &&
    (filters.to === undefined || completedAt <= filters.to) &&
    (filters.minScore === undefined || attempt.iqScore >= filters.minScore) &&
    (filters.maxScore === undefined || attempt.iqScore <= filters.maxScore) &&
    (filters.fasterThan === undefined ||
      attempt.completionTimeSeconds <= filters.fasterThan) &&
    (filters.slowerThan === undefined ||
      attempt.completionTimeSeconds >= filters.slowerThan)
  );
});

console.table(
  matches.map((attempt) => ({
    attemptId: attempt.attemptId,
    completedAt: attempt.completedAt,
    iq: attempt.iqScore,
    correct: attempt.correctCount,
    seconds: attempt.completionTimeSeconds,
    version: attempt.testVersion,
  })),
);
console.log(`${matches.length} of ${attempts.length} attempts matched.`);

if (matches.length === 0) {
  console.log("Nothing to delete.");
} else if (!parsed.apply) {
  console.log("Dry run only. Add --apply to delete exactly these attempts.");
} else {
  const result = await deleteIQAttemptsAndRebuild(
    matches.map((attempt) => attempt.attemptId),
  );
  console.log(
    `Deleted ${result.deleted} attempts and rebuilt all aggregates. ${result.remaining} attempts remain.`,
  );
  if (result.notFound.length > 0) {
    console.warn(`Not found during apply: ${result.notFound.join(", ")}`);
  }
}
