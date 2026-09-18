#!/usr/bin/env node
/**
 * New Grad RN Tracker — data-only publication.
 *
 * Publishes validated tracker data through the existing deployment mechanism
 * (git push to master, which Vercel auto-deploys). Uses an isolated worktree
 * based on origin/master so unrelated uncommitted work is never published.
 *
 * Usage:
 *   newgrad-publish.ts --run <run_id> [--push] [--remote <name>] [--branch <name>]
 *
 * - Without --push: prepares the data commit in a temp worktree, validates,
 *   and reports what WOULD be published. The worktree is removed.
 * - With --push: also pushes the data-only commit to <branch> (default master).
 *   Push is refused unless data/newgrad/publication.json has enabled=true.
 *
 * Only files in ALLOWED_DATA_PATHS are copied into the worktree. If the push
 * is not a fast-forward (production moved), the push fails safely and the
 * validated update is retained locally for retry. Public data is never
 * deleted or force-pushed.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ALLOWED_DATA_PATHS } from "../lib/newgrad/store.ts";

function usage(): never {
  console.error("Usage: newgrad-publish.ts --run <run_id> [--push] [--remote <name>] [--branch <name>]");
  process.exit(1);
}

function fail(message: string): never {
  console.error(`newgrad-publish: ${message}`);
  process.exit(1);
}

function git(args: string[], cwd: string): string {
  try {
    // trimEnd only: leading whitespace is significant in porcelain status columns.
    return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trimEnd();
  } catch (err) {
    const e = err as { stderr?: unknown; message?: string };
    fail(`git ${args.join(" ")} failed: ${String(e.stderr ?? e.message).slice(0, 500)}`);
  }
}

function flag(argv: string[], name: string): string | null {
  const i = argv.indexOf(name);
  return i !== -1 && i + 1 < argv.length ? argv[i + 1]! : null;
}

const argv = process.argv.slice(2);
const runId = flag(argv, "--run");
const doPush = argv.includes("--push");
const remote = flag(argv, "--remote") ?? "origin";
const branch = flag(argv, "--branch") ?? "master";
if (!runId) usage();

const repoRoot = process.cwd();
const pubRaw = readFileSync(join(repoRoot, "data", "newgrad", "publication.json"), "utf8");
const publication = JSON.parse(pubRaw) as { enabled: boolean; runs?: unknown[] };
if (doPush && publication.enabled !== true) {
  fail("publication is disabled (data/newgrad/publication.json enabled=false); refusing to push");
}

// 1. Validate current data before doing anything.
try {
  execFileSync(
    "node",
    ["--no-warnings", "--experimental-strip-types", "scripts/newgrad-validate.ts"],
    { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
} catch {
  fail("dataset validation failed; nothing published");
}

// 2. Refuse if the working tree has non-allowed modifications (we only ever
//    copy allowed paths, but a dirty tree signals an unsafe state to inspect).
const dirty = git(["status", "--porcelain"], repoRoot);
if (dirty) {
  const lines = dirty.split("\n").filter((l) => l.trim().length > 0);
  const outside = lines.filter((l) => {
    const p = l.replace(/^[A-Z ?]{2}\s+/, "").trim().replace(/^"(.*)"$/, "$1");
    return !ALLOWED_DATA_PATHS.has(p) && !p.startsWith("data/newgrad/inbox/");
  });
  if (outside.length > 0) {
    fail(
      `working tree has changes outside the allowed data paths; commit or stash them first:\n  ${outside.slice(0, 10).join("\n  ")}`,
    );
  }
}

// 3. Isolated worktree on the production revision.
try {
  git(["fetch", remote, branch], repoRoot);
} catch {
  console.error("newgrad-publish: warning: fetch failed; using last-known remote state");
}
const base = git(["rev-parse", `${remote}/${branch}`], repoRoot);
const worktree = mkdtempSync(join(tmpdir(), "newgrad-pub-"));
const cleanup = (): void => {
  try {
    git(["worktree", "remove", "--force", worktree], repoRoot);
  } catch {
    rmSync(worktree, { recursive: true, force: true });
  }
};
try {
  git(["worktree", "add", "--detach", worktree, base], repoRoot);

  // 4. Copy ONLY allowed data files into the worktree.
  for (const rel of ALLOWED_DATA_PATHS) {
    copyFileSync(join(repoRoot, rel), join(worktree, rel));
  }

  // 5. Stamp publication metadata inside the worktree copy.
  const metaPath = join(worktree, "data", "newgrad", "meta.json");
  const meta = JSON.parse(readFileSync(metaPath, "utf8")) as Record<string, unknown>;
  meta["last_published_at"] = new Date().toISOString();
  writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`, "utf8");
  const pubPath = join(worktree, "data", "newgrad", "publication.json");
  const pub = JSON.parse(readFileSync(pubPath, "utf8")) as { enabled: boolean; runs?: Array<Record<string, unknown>> };
  pub.runs = pub.runs ?? [];
  pub.runs.push({
    at: new Date().toISOString(),
    run_id: runId,
    result: doPush ? "success" : "skipped_disabled",
    detail: doPush
      ? `Data-only commit on ${base.slice(0, 12)} pushed to ${remote}/${branch}.`
      : "Dry run: commit prepared but not pushed (no --push).",
  });
  writeFileSync(pubPath, `${JSON.stringify(pub, null, 2)}\n`, "utf8");

  git(["add", ...ALLOWED_DATA_PATHS], worktree);
  const staged = git(["diff", "--cached", "--name-only"], worktree);
  if (!staged) {
    console.log("newgrad-publish: no data changes relative to production; nothing to publish");
    cleanup();
    process.exit(0);
  }
  const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "");
  git(["checkout", "-b", `data/newgrad-${stamp}`], worktree);
  git(
    ["commit", "-m", `newgrad data: publish run ${runId}\n\nData-only update. Allowed paths: data/newgrad/*.json`],
    worktree,
  );
  const commit = git(["rev-parse", "HEAD"], worktree);
  console.log(`newgrad-publish: prepared ${commit} with:\n  ${staged.split("\n").join("\n  ")}`);

  if (!doPush) {
    console.log("newgrad-publish: dry run complete; worktree removed, nothing pushed");
    cleanup();
    process.exit(0);
  }
  // Fast-forward-only push: fails safely if production moved.
  git(["push", remote, `HEAD:${branch}`], worktree);
  console.log(`newgrad-publish: pushed ${commit} to ${remote}/${branch} (run ${runId})`);
  cleanup();
} catch (err) {
  cleanup();
  if ((err as Error).message.startsWith("newgrad-publish:") || (process.exitCode ?? 0) !== 0) throw err;
  fail(`publication failed; previous public data preserved, local update retained: ${(err as Error).message}`);
}
