import { skillClusters } from "@/lib/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";

export function Skills() {
  return (
    <section className="relative scroll-mt-24 px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="04 — Capabilities"
          title={
            <>
              A{" "}
              <span className="font-display italic text-gradient">full-stack</span>{" "}
              of skills, end to end.
            </>
          }
          description="I'm most useful where design, engineering, and domain knowledge overlap — taking an idea from problem to polished, shipped product."
        />

        <RevealGroup
          className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
          stagger={0.07}
        >
          {skillClusters.map((cluster, i) => (
            <RevealItem
              key={cluster.title}
              className="group glass edge-light relative flex flex-col overflow-hidden rounded-2xl p-6 transition-colors duration-300 hover:bg-surface/70"
            >
              <span className="font-mono text-xs text-bone-faint">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 font-display text-xl tracking-tight">
                {cluster.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-bone-dim">
                {cluster.blurb}
              </p>
              <ul className="mt-5 flex flex-col gap-2.5 border-t border-line/60 pt-5">
                {cluster.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2.5 text-sm text-bone-dim"
                  >
                    <span className="size-1 rounded-full bg-iris-soft/70 transition-colors group-hover:bg-iris-soft" />
                    {item}
                  </li>
                ))}
              </ul>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
