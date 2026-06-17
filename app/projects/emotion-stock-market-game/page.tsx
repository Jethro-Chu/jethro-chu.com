import type { Metadata } from "next";
import Link from "next/link";
import {
  ProjectPageShell,
  ProjectSection,
  CalloutNote,
} from "@/components/work/ProjectPageShell";

export const metadata: Metadata = {
  title: "Emotion Stock Market Game — Jethro Chu",
  description:
    "A browser experiment where facial expressions, read live through the camera, drive simulated stock trades. It runs entirely client-side, with nothing recorded or uploaded.",
};

const GAME_URL = "https://jethro-chu.github.io/JethroStockMarketGame.github.io/";
const SOURCE_URL = "https://github.com/Jethro-Chu/JethroStockMarketGame.github.io";

const primaryBtn =
  "inline-flex items-center gap-2 rounded-sm bg-[var(--color-pine)] px-4 py-2.5 font-body text-sm font-medium text-[var(--color-on-dark)] transition-colors hover:bg-[var(--color-pine-deep)]";
const secondaryBtn =
  "inline-flex items-center gap-2 rounded-sm border border-[var(--color-granite-line)] px-4 py-2.5 font-body text-sm font-medium text-[var(--color-shadow)] transition-colors hover:border-[var(--color-pine)] hover:text-[var(--color-pine)]";

const extLink = (
  <svg aria-hidden width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17 17 7M9 7h8v8" />
  </svg>
);

export default function EmotionStockMarketGamePage() {
  return (
    <ProjectPageShell
      kicker="project · browser experiment"
      title="Emotion Stock Market Game"
      subtitle="A browser experiment where facial expressions move the market."
    >
      <ProjectSection n="01" label="what it is" heading="Your face trades the market">
        <p>
          A playful browser game inspired by the advice everyone hears: don&apos;t trade with your emotions. I made the
          opposite. In this game, your facial expressions drive the market. Smile, panic, hesitate, or overreact, and
          your emotions become the trading strategy.
        </p>
        <p>
          It is not financial advice. It is just a weird, fun experiment about what happens when the market listens to
          your face.
        </p>
      </ProjectSection>

      <ProjectSection n="02" label="how it works" heading="Expression in, market chaos out">
        <p>
          A webcam feed runs through live facial-expression detection, built with face-api.js and TensorFlow.js, right
          in the browser. Your expressions become buy and sell pressure, while random crashes, recessions, and Warren
          Buffett whale pumps keep the market lurching.
        </p>
        <p>Everything happens client-side, so the camera feed never leaves your machine.</p>
      </ProjectSection>

      <ProjectSection n="03" label="why it belongs here" heading="The playful half of how I build">
        <p>
          It shows the playful side: take a strange idea and turn it into an interactive product. It is also proof I can
          wire real machine learning, live face tracking, into a tight, private, single-page experience.
        </p>
      </ProjectSection>

      <ProjectSection n="04" label="playable demo">
        <CalloutNote>
          <p>
            The game is live and playable in your browser. It asks for camera access when you start, and nothing is
            recorded or uploaded.
          </p>
        </CalloutNote>
        <div className="flex flex-wrap gap-3 pt-1">
          <a href={GAME_URL} target="_blank" rel="noreferrer noopener" className={primaryBtn}>
            Play the game
            {extLink}
          </a>
          <a href={SOURCE_URL} target="_blank" rel="noreferrer noopener" className={secondaryBtn}>
            View source
            {extLink}
          </a>
        </div>
      </ProjectSection>

      <ProjectSection n="05" label="more">
        <p>See the rest of the work, from clinical tools to research software.</p>
        <div className="pt-1">
          <Link href="/#projects" className={secondaryBtn}>
            Back to projects
          </Link>
        </div>
      </ProjectSection>
    </ProjectPageShell>
  );
}
