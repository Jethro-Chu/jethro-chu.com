import Image from "next/image";
import { about, sections } from "@/content/content";

const summit = sections[3];

/**
 * About — the summit (8,839 ft). The payoff. The visitor arrives in full golden
 * hour and the Half Dome photo gets room to breathe. The granite warms to a faint
 * alpenglow. Let the photo and the warm light do the work.
 */
export function About() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="scroll-mt-6 px-6 py-24 sm:px-10 sm:py-28 lg:pl-16 lg:pr-32"
    >
      <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[minmax(0,440px)_1fr] lg:gap-14">
        {/* the photo */}
        <figure className="mx-auto w-full max-w-sm lg:max-w-none">
          <div className="overflow-hidden rounded-md border border-[var(--color-granite-line)] shadow-[0_8px_30px_-12px_rgba(60,64,73,0.35)]">
            <Image
              src={about.photo.src}
              alt={about.photo.alt}
              width={about.photo.width}
              height={about.photo.height}
              sizes="(min-width: 1024px) 440px, (min-width: 640px) 24rem, 90vw"
              className="h-auto w-full"
            />
          </div>
        </figure>

        {/* the story */}
        <div>
          <p className="label-mono tnum flex items-center gap-2">
            <span className="text-[var(--color-golden-deep)]">
              {summit.elevation.toLocaleString("en-US")} ft
            </span>
            <span aria-hidden className="h-3 w-px bg-[var(--color-granite-line)]" />
            <span>{summit.landmark}</span>
          </p>

          <h2
            id="about-heading"
            className="text-ridge mt-5 text-[var(--color-shadow)]"
          >
            {about.heading}
          </h2>

          <div className="mt-6 space-y-4 text-lg leading-relaxed text-[var(--color-shadow)]">
            {about.body.map((para, i) => (
              <p key={i} className="max-w-xl text-pretty">
                {para}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
