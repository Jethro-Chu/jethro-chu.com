/* ============================================================
   ResumeSheet  ·  the full resume, rendered inside the General Store
   modal as a compact, scrollable field-guide sheet. Reads the same
   content/resume.ts source of truth as the /resume page, so the two
   never drift. Flowsheet tokens only; no invented facts.
   ============================================================ */

import { resume } from "@/content/resume";

function SectionLabel({ n, label }: { n: string; label: string }) {
  return (
    <p className="label-mono flex items-center gap-2 text-[0.66rem]">
      <span className="text-[var(--color-pine)]">{n}</span>
      <span aria-hidden className="h-3 w-px bg-[var(--color-granite-line)]" />
      <span>{label}</span>
    </p>
  );
}

function Chips({ tags }: { tags: readonly string[] }) {
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <li
          key={t}
          className="rounded-xs border border-[var(--color-granite-line)] px-2 py-0.5 font-mono text-[0.66rem] text-[var(--color-shadow)]"
        >
          {t}
        </li>
      ))}
    </ul>
  );
}

function SkillList({ items }: { items: readonly string[] }) {
  return (
    <p className="mt-1 text-[0.82rem] leading-relaxed text-[var(--color-muted)]">
      {items.join(" · ")}
    </p>
  );
}

function SkillBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="label-mono text-[0.64rem] text-[var(--color-pine)]">{title}</p>
      {children}
    </div>
  );
}

export function ResumeSheet() {
  return (
    <div className="mt-5 space-y-6 border-t border-[var(--color-granite-line)] pt-5">
      {/* 01 · education */}
      <section>
        <SectionLabel n="01" label="education" />
        <div className="mt-2.5 rounded-sm border border-[var(--color-granite-line)] bg-[var(--color-sand)] p-3.5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <h3 className="font-display text-[1.02rem] font-medium leading-tight text-[var(--color-shadow)]">
              {resume.education.degree}
            </h3>
            <span className="label-mono tnum shrink-0 text-[0.64rem] text-[var(--color-pine)]">
              GPA {resume.education.gpa} · {resume.education.honors}
            </span>
          </div>
          <p className="mt-1 text-[0.85rem] text-[var(--color-muted)]">{resume.education.school}</p>
          <p className="label-mono mt-1.5 text-[0.64rem]">{resume.education.grad}</p>
        </div>
      </section>

      {/* 02 · clinical experience */}
      <section>
        <SectionLabel n="02" label="clinical experience" />
        <ol className="mt-3 space-y-4 border-l border-[var(--color-granite-line)] pl-4">
          {resume.clinical.map((c) => (
            <li key={c.org} className="relative">
              <span
                aria-hidden
                className="absolute -left-4 top-1.5 size-2 -translate-x-1/2 rounded-full border-2 border-[var(--color-card)] bg-[var(--color-pine)]"
              />
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <h4 className="font-display text-[0.98rem] font-medium leading-tight text-[var(--color-shadow)]">
                  {c.org}
                </h4>
                <span className="label-mono tnum shrink-0 text-[0.62rem] text-[var(--color-pine)]">
                  {c.dates}
                </span>
              </div>
              <p className="label-mono mt-1 text-[0.62rem]">
                {c.role} · {c.hours} · {c.location}
              </p>
              <ul className="mt-2 space-y-1">
                {c.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex gap-2 text-[0.82rem] leading-snug text-[var(--color-shadow)]"
                  >
                    <span
                      aria-hidden
                      className="mt-[0.42rem] size-1 shrink-0 rounded-full bg-[var(--color-pine)]"
                    />
                    <span className="text-pretty">{b}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      {/* 03 · skills & systems — long lists as compact text, not chip walls */}
      <section>
        <SectionLabel n="03" label="skills & systems" />
        <div className="mt-3 space-y-3">
          <SkillBlock title="Certifications & systems">
            <Chips tags={resume.skills.certifications} />
          </SkillBlock>
          <SkillBlock title="Clinical skills">
            <SkillList items={resume.skills.clinical} />
          </SkillBlock>
          <SkillBlock title="Professional">
            <SkillList items={resume.skills.professional} />
          </SkillBlock>
          <SkillBlock title="Mentorship">
            <p className="mt-1 text-[0.84rem] leading-snug text-[var(--color-shadow)]">
              <span className="font-medium">{resume.skills.mentorship.title}.</span>{" "}
              <span className="text-[var(--color-muted)]">{resume.skills.mentorship.desc}</span>
            </p>
          </SkillBlock>
          <SkillBlock title="Interests">
            <Chips tags={resume.skills.interests} />
          </SkillBlock>
        </div>
      </section>
    </div>
  );
}
