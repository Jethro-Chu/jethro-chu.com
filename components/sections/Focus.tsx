import { HeartPulse, ShieldCheck, ScanSearch } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";

const principles = [
  {
    icon: HeartPulse,
    title: "Calm under pressure",
    body: "Clinical tools are used by exhausted people in high-stakes moments. I design for legibility at a glance and forgiveness when it counts.",
    accent: "text-coral",
  },
  {
    icon: ShieldCheck,
    title: "Truth is non-negotiable",
    body: "In healthcare, a confident wrong answer is dangerous. Every AI feature I ship is grounded — if it can't be sourced, it doesn't publish.",
    accent: "text-aqua",
  },
  {
    icon: ScanSearch,
    title: "Evidence over vibes",
    body: "From research radar to lab trends, the work is about surfacing what actually changes practice — signal over volume, always.",
    accent: "text-iris-soft",
  },
];

export function Focus() {
  return (
    <section
      id="focus"
      className="relative scroll-mt-24 overflow-hidden px-5 py-24 sm:px-8 sm:py-32"
    >
      {/* band background */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-full bg-gradient-to-b from-ink-2/80 via-surface/30 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-80 w-[60%] -translate-x-1/2 rounded-full bg-aqua/10 blur-[130px]"
      />

      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="05 — Healthcare & research"
          align="center"
          className="mx-auto items-center text-center"
          title={
            <>
              Built from the{" "}
              <span className="font-display italic text-gradient">inside</span> of
              care.
            </>
          }
          description="My healthcare work isn't a vertical I chose on a whiteboard — it's the place I came from. That perspective is the through-line in everything I build."
        />

        <RevealGroup
          className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3"
          stagger={0.1}
        >
          {principles.map((p) => (
            <RevealItem
              key={p.title}
              className="group glass edge-light relative flex flex-col gap-4 rounded-2xl p-7"
            >
              <span className="grid size-12 place-items-center rounded-xl border border-line bg-ink/40">
                <p.icon className={`size-5 ${p.accent}`} strokeWidth={1.75} />
              </span>
              <h3 className="font-display text-xl tracking-tight">{p.title}</h3>
              <p className="text-pretty text-[15px] leading-relaxed text-bone-dim">
                {p.body}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal delay={0.15}>
          <p className="mx-auto mt-14 max-w-2xl text-center text-pretty text-lg leading-relaxed text-bone-dim">
            <span className="text-bone">NurseJet</span>,{" "}
            <span className="text-bone">Lab Logger</span>,{" "}
            <span className="text-bone">Research Radar</span> and{" "}
            <span className="text-bone">Cleo</span> are all the same bet:{" "}
            that healthcare software can be fast, honest, and genuinely kind to the
            people using it.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
