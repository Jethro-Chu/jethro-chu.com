import type { Metadata } from "next";
import Link from "next/link";
import { contact, site } from "@/content/content";
import { resume } from "@/content/resume";
import { BackgroundGradient } from "@/components/scenery/BackgroundGradient";
import { RouteLine } from "@/components/scenery/RouteLine";
import { ResumeReveal } from "@/components/resume/ResumeIntro";

export const metadata: Metadata = {
  title: "Resume — Jethro Chu",
  description:
    "Nursing student and AI-native builder with clinical experience across pediatric, mental health, oncology, cardiac, emergency, and med-surg settings.",
};

const email = contact.links.find((l) => l.label === "Email")?.href ?? "mailto:jethro.chu@gmail.com";

function Kicker({ n, label }: { n?: string; label: string }) {
  return (
    <p className="label-mono flex items-center gap-2.5">
      {n && <span className="text-[var(--color-pine)]">{n}</span>}
      {n && <span aria-hidden className="h-3 w-px bg-[var(--color-granite-line)]" />}
      <span>{label}</span>
    </p>
  );
}

function SkillCard({ title, tags }: { title: string; tags: readonly string[] }) {
  return (
    <div className="h-full rounded-md border border-[var(--color-granite-line)] bg-[var(--color-card)] p-5">
      <p className="label-mono text-[var(--color-pine)]">{title}</p>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <li
            key={t}
            className="rounded-xs border border-[var(--color-granite-line)] px-2 py-0.5 font-mono text-[0.7rem] text-[var(--color-shadow)]"
          >
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

const primaryBtn =
  "inline-flex items-center gap-2 rounded-sm bg-[var(--color-pine)] px-4 py-2.5 font-body text-sm font-medium text-[var(--color-on-dark)] transition-colors hover:bg-[var(--color-pine-deep)]";
const secondaryBtn =
  "inline-flex items-center gap-2 rounded-sm border border-[var(--color-granite-line)] px-4 py-2.5 font-body text-sm font-medium text-[var(--color-shadow)] transition-colors hover:border-[var(--color-pine)] hover:text-[var(--color-pine)]";

export default function ResumePage() {
  return (
    <div className="relative min-h-screen">
      <BackgroundGradient />
      <RouteLine />

      {/* top bar */}
      <header className="relative z-10 flex items-center justify-between border-b border-[var(--color-granite-line)] px-6 py-4 sm:px-10 lg:px-16">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 font-display text-[1.05rem] font-medium text-[var(--color-shadow)]"
        >
          <span aria-hidden className="text-[var(--color-pine)] transition-transform group-hover:-translate-x-0.5">
            ←
          </span>
          {site.name}
        </Link>
        <span className="label-mono">resume</span>
      </header>

      <ResumeReveal>
        <main id="main" className="px-6 sm:px-10 lg:pl-16 lg:pr-40">
          <div className="mx-auto max-w-4xl">
            {/* hero */}
            <section className="pb-14 pt-16 sm:pt-20">
              <Kicker label="resume · clinical route" />
              <h1 className="text-summit mt-4 text-[var(--color-shadow)]">Resume</h1>
              <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-[var(--color-muted)] sm:text-xl">
                {resume.subtitle}
              </p>

              <p className="label-mono mt-7 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                {resume.meta.map((m, i) => (
                  <span key={m} className="inline-flex items-center gap-2.5">
                    {i > 0 && (
                      <span aria-hidden className="text-[var(--color-granite-line)]">
                        ·
                      </span>
                    )}
                    {m}
                  </span>
                ))}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a href={resume.pdf} download="Jethro_Chu_Resume.pdf" className={primaryBtn}>
                  Download PDF
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M12 3v12M7 11l5 5 5-5M5 21h14" />
                  </svg>
                </a>
                <a href={email} className={secondaryBtn}>
                  Email Jethro
                </a>
              </div>
            </section>

            {/* education */}
            <section className="border-t border-[var(--color-granite-line)] py-12 sm:py-14">
              <Kicker n="01" label="education" />
              <div className="mt-7 rounded-md border border-[var(--color-granite-line)] bg-[var(--color-card)] p-6 sm:p-7">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <h2 className="font-display text-[1.4rem] font-medium text-[var(--color-shadow)]">
                    {resume.education.degree}
                  </h2>
                  <span className="label-mono tnum text-[var(--color-pine)]">
                    GPA {resume.education.gpa} · {resume.education.honors}
                  </span>
                </div>
                <p className="mt-1.5 text-[var(--color-muted)]">{resume.education.school}</p>
                <p className="label-mono mt-2.5">{resume.education.grad}</p>
              </div>
            </section>

            {/* clinical experience — a timeline / clinical route */}
            <section className="border-t border-[var(--color-granite-line)] py-12 sm:py-14">
              <Kicker n="02" label="clinical experience" />
              <h2 className="text-ridge mt-4 text-[var(--color-shadow)]">Clinical route</h2>
              <ol className="mt-8 space-y-7 border-l border-[var(--color-granite-line)] pl-6 sm:pl-8">
                {resume.clinical.map((c) => (
                  <li key={c.org} className="relative">
                    <span
                      aria-hidden
                      className="absolute top-2 size-2.5 -translate-x-1/2 rounded-full border-2 border-[var(--color-sand)] bg-[var(--color-pine)] -left-6 sm:-left-8"
                    />
                    <article className="rounded-md border border-[var(--color-granite-line)] bg-[var(--color-card)] p-5 sm:p-6">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                        <h3 className="font-display text-[1.15rem] font-medium text-[var(--color-shadow)]">{c.org}</h3>
                        <span className="label-mono tnum shrink-0 text-[var(--color-pine)]">{c.dates}</span>
                      </div>
                      <p className="label-mono mt-1.5">
                        {c.role} · {c.hours} · {c.location}
                      </p>
                      <ul className="mt-3.5 space-y-1.5">
                        {c.bullets.map((b) => (
                          <li key={b} className="flex gap-2.5 text-[0.93rem] leading-relaxed text-[var(--color-shadow)]">
                            <span aria-hidden className="mt-[0.5rem] size-1 shrink-0 rounded-full bg-[var(--color-pine)]" />
                            <span className="text-pretty">{b}</span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  </li>
                ))}
              </ol>
            </section>

            {/* skills */}
            <section className="border-t border-[var(--color-granite-line)] py-12 sm:py-14">
              <Kicker n="03" label="skills" />
              <h2 className="text-ridge mt-4 text-[var(--color-shadow)]">Skills &amp; systems</h2>
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <SkillCard title="Certifications &amp; systems" tags={resume.skills.certifications} />
                <SkillCard title="Professional" tags={resume.skills.professional} />
                <div className="sm:col-span-2">
                  <SkillCard title="Clinical skills" tags={resume.skills.clinical} />
                </div>
                <div className="h-full rounded-md border border-[var(--color-granite-line)] bg-[var(--color-card)] p-5">
                  <p className="label-mono text-[var(--color-pine)]">Mentorship</p>
                  <p className="mt-2.5 font-display text-[1.05rem] font-medium text-[var(--color-shadow)]">
                    {resume.skills.mentorship.title}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-muted)]">
                    {resume.skills.mentorship.desc}
                  </p>
                </div>
                <SkillCard title="Interests" tags={resume.skills.interests} />
              </div>
            </section>

            {/* builder context */}
            <section className="border-t border-[var(--color-granite-line)] py-12 sm:py-16">
              <Kicker n="04" label="builder context" />
              <h2 className="text-ridge mt-4 text-[var(--color-shadow)]">{resume.builderContext.title}</h2>
              <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-[var(--color-shadow)]">
                {resume.builderContext.body}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/#projects" className={secondaryBtn}>
                  See the projects
                </Link>
                <a href={email} className={primaryBtn}>
                  Email Jethro
                </a>
              </div>
            </section>
          </div>
        </main>
      </ResumeReveal>

      {/* minimal footer */}
      <footer className="border-t border-[var(--color-granite-line)] px-6 py-8 sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4">
          <p className="label-mono">
            © {new Date().getFullYear()} {site.name}
          </p>
          <Link
            href="/"
            className="label-mono inline-flex items-center gap-2 transition-colors hover:text-[var(--color-pine)]"
          >
            ← Back to portfolio
          </Link>
        </div>
      </footer>
    </div>
  );
}
