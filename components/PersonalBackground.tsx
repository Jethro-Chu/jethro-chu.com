import Image from "next/image";
import type { PersonalBackgroundContent } from "@/content/personal";

export function PersonalBackground({
  content,
  idPrefix,
  variant = "flat",
}: {
  content: PersonalBackgroundContent;
  idPrefix: string;
  variant?: "flat" | "room";
}) {
  return (
    <section
      aria-labelledby={`${idPrefix}-personal-heading`}
      className={`mt-8 max-w-3xl ${variant === "room" ? "rounded-md border border-[var(--color-granite-line)] bg-[var(--color-card)] p-5 sm:p-6" : ""}`}
    >
      <h3
        id={`${idPrefix}-personal-heading`}
        className="font-display text-[1.4rem] font-medium leading-snug text-[var(--color-shadow)]"
      >
        {content.heading}
      </h3>
      <dl className="mt-5 space-y-5">
        {content.items.map((item) => (
          <div key={item.title}>
            <dt className="font-display text-[1.05rem] font-medium leading-snug text-[var(--color-shadow)]">
              {item.title}
            </dt>
            <dd className="mt-2 max-w-prose text-[0.95rem] leading-relaxed text-[var(--color-shadow)]">
              {item.body}
            </dd>
          </div>
        ))}
      </dl>
      <figure className="mt-6">
        <Image
          src={content.photo.src}
          alt={content.photo.alt}
          width={content.photo.width}
          height={content.photo.height}
          sizes="(min-width: 1024px) 768px, 92vw"
          className="aspect-[16/10] w-full rounded-md border border-[var(--color-granite-line)] object-cover object-center"
        />
        <figcaption className="label-mono mt-2 text-[0.68rem] text-[var(--color-muted)]">
          {content.photo.caption}
        </figcaption>
      </figure>
    </section>
  );
}
