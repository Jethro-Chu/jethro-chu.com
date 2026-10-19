import type { Metadata } from "next";
import Link from "next/link";
import {
  ProjectPageShell,
  ProjectSection,
  FeatureList,
  CalloutNote,
} from "@/components/work/ProjectPageShell";

export const metadata: Metadata = {
  title: "NurseJet — Jethro Chu",
  description:
    "NurseJet is a nursing-focused clinical briefing platform. It turns nursing research, guideline changes, and safety alerts into short, source-cited briefs organized by unit or specialty.",
};

const primaryBtn =
  "inline-flex items-center gap-2 rounded-sm bg-[var(--color-pine)] px-4 py-2.5 font-body text-sm font-medium text-[var(--color-on-dark)] transition duration-150 ease-[var(--ease-fast)] hover:bg-[var(--color-pine-deep)] active:scale-[0.98]";
const secondaryBtn =
  "inline-flex items-center gap-2 rounded-sm border border-[var(--color-granite-line)] px-4 py-2.5 font-body text-sm font-medium text-[var(--color-shadow)] transition duration-150 ease-[var(--ease-fast)] hover:border-[var(--color-pine)] hover:text-[var(--color-pine)] active:scale-[0.98]";

export default function NurseJetPage() {
  return (
    <ProjectPageShell
      kicker="project · clinical briefing"
      title="NurseJet"
      subtitle="A clinical briefing platform for nurses who need the useful takeaway fast."
    >
      <ProjectSection n="01" label="what it is" heading="A briefing built for the bedside">
        <p>
          NurseJet is a nursing-focused clinical briefing platform. It turns new nursing research, guideline changes,
          and safety alerts into short, source-cited briefs, organized by unit or specialty from the ED to the NICU.
        </p>
      </ProjectSection>

      <ProjectSection n="02" label="why I built it" heading="The reading piles up; the takeaway gets buried">
        <p>
          Bedside nurses do not have time to chase every new study, guideline change, and safety alert across journals
          and bulletins. The reading piles up, and the part that actually changes practice gets lost in it.
        </p>
        <p>
          NurseJet does that reading for them and hands back the one thing that changed, why it matters at the bedside,
          and a source they can trust, with the citation right there.
        </p>
      </ProjectSection>

      <ProjectSection n="03" label="core features">
        <FeatureList
          items={[
            "Short daily briefs from new nursing research, guidelines, and safety alerts",
            "Organized by specialty, from the ED to the NICU",
            "An exact source citation on every brief",
            "A practical bedside takeaway on each one",
          ]}
        />
      </ProjectSection>

      <ProjectSection n="04" label="design principle" heading="Every item earns its place">
        <p>
          If a brief does not change what a nurse does on shift, it does not ship. Each one carries its source citation
          and a single bedside takeaway, written for the bedside, not for a journal.
        </p>
      </ProjectSection>

      <ProjectSection n="05" label="safety / positioning">
        <CalloutNote>
          <p>
            NurseJet is a briefing and education tool. It is not a substitute for hospital policy, physician judgment,
            clinical decision-making, or local protocols.
          </p>
          <p>Always follow your facility&apos;s official guidance and your own clinical judgment.</p>
        </CalloutNote>
      </ProjectSection>

      <ProjectSection n="06" label="see it">
        <p>NurseJet is live, with new editions published daily.</p>
        <div className="flex flex-wrap gap-3 pt-1">
          <a href="https://nursejet.org" target="_blank" rel="noreferrer noopener" className={primaryBtn}>
            Open NurseJet
            <svg aria-hidden width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
          </a>
          <Link href="/#projects" className={secondaryBtn}>
            Back to projects
          </Link>
        </div>
      </ProjectSection>
    </ProjectPageShell>
  );
}
