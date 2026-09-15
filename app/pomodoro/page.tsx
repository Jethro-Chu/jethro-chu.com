import type { Metadata } from "next";
import PomodoroApp from "./PomodoroApp";

export const metadata: Metadata = {
  title: "Quokka Pomodoro · Jethro Chu",
  description:
    "A calm pixel-art quokka Pomodoro timer. Twenty-five minute study sessions feed the quokka.",
  robots: { index: false, follow: false }, // unlisted page, reached directly
};

export default function Page() {
  return <PomodoroApp />;
}
