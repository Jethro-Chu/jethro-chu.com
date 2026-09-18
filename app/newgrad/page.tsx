import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NewgradTable } from "./NewgradTable";
import type {
  Cohort,
  DatasetMeta,
  Hospital,
  Opportunity,
  Program,
  ResearchRun,
} from "@/lib/newgrad/types";
import "./newgrad.css";

export const metadata: Metadata = {
  title: "New Grad RN Tracker · Jethro Chu",
  description:
    "Unlisted tracker of new graduate RN residency openings, verified against official hospital sources.",
  robots: { index: false, follow: false }, // unlisted page, reached directly
};

async function readJson<T>(name: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(join(process.cwd(), "data", "newgrad", name), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default async function Page() {
  const [meta, hospitals, opportunities, programs, cohorts, runs] = await Promise.all([
    readJson<DatasetMeta>("meta.json", {
      contract_version: "1.0.0",
      generated_at: new Date(0).toISOString(),
      last_research_attempt_at: null,
      last_successful_verification_at: null,
      last_published_at: null,
      counts: {
        opportunities: 0,
        open: 0,
        closing_soon: 0,
        pending_review: 0,
        sources_active: 0,
        sources_candidate: 0,
      },
      coverage_note: null,
    }),
    readJson<Hospital[]>("hospitals.json", []),
    readJson<Opportunity[]>("opportunities.json", []),
    readJson<Program[]>("programs.json", []),
    readJson<Cohort[]>("cohorts.json", []),
    readJson<ResearchRun[]>("runs.json", []),
  ]);
  const lastRun = runs.length > 0 ? runs[runs.length - 1]! : null;

  return (
    <main className="ng-root">
      <NewgradTable
        meta={meta}
        hospitals={hospitals}
        opportunities={opportunities}
        programs={programs}
        cohorts={cohorts}
        lastRun={lastRun}
      />
    </main>
  );
}
