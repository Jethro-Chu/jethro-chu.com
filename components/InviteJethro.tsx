import { invite } from "@/content/profile";
import { Reveal } from "@/components/motion/Reveal";
import { AskChip } from "@/components/ask-jethro/triggers";

/**
 * Invite Jethro — the "why bring him in" panel for hackathons, healthcare AI
 * teams, startups, design collaborations, and research tooling. The buttons hand
 * off to the assistant for the longer answer.
 */
export function InviteJethro() {
  return (
    <section
      id="invite"
      aria-labelledby="invite-heading"
      className="scroll-mt-6 px-6 py-24 sm:px-10 sm:py-28 lg:pl-16 lg:pr-40"
    >
      <div className="mx-auto max-w-4xl">
        <p className="label-mono">Invite Jethro</p>
        <h2 id="invite-heading" className="text-ridge mt-3 text-[var(--color-shadow)]">
          Why invite me
        </h2>
        <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-[var(--color-shadow)]">
          {invite.whyHackathon}
        </p>

        <div className="mt-9 grid gap-4 sm:grid-cols-2">
          {invite.goodFor.map((g, i) => (
            <Reveal key={g.who} delay={i * 0.05}>
              <div className="h-full rounded-md border border-[var(--color-granite-line)] bg-[var(--color-card)] p-5">
                <p className="font-display text-[1.1rem] font-medium text-[var(--color-shadow)]">{g.who}</p>
                <p className="mt-2 text-pretty text-sm leading-relaxed text-[var(--color-muted)]">{g.line}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-9 flex flex-wrap gap-2.5">
          <AskChip question="Summarize Jethro in 30 seconds" label="Pitch me in 30 seconds" primary />
          <AskChip question="Show me his healthcare AI projects" label="Healthcare AI work" />
          <AskChip question="What's his strongest project?" label="Most demo-worthy" />
          <AskChip question="What should he build next?" label="What should he build next?" />
        </div>
      </div>
    </section>
  );
}
