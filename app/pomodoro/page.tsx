import type { Metadata } from "next";
import { site } from "@/content/content";
import PomodoroApp from "./PomodoroApp";

const TITLE = "Pomodoro Timer";
const DESCRIPTION = "Cute quokka Pomodoro timer for focused study sessions.";
const PREVIEW = `${site.url}/pomodoro/pomodoro-preview.png`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: false, follow: false }, // unlisted page, reached directly
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${site.url}/pomodoro`,
    type: "website",
    images: [{ url: PREVIEW, width: 1731, height: 909, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [PREVIEW],
  },
};

export default function Page() {
  return <PomodoroApp />;
}
