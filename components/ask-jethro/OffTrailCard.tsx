"use client";

import { useState } from "react";
import { OffTrailRunnerCard } from "./OffTrailRunnerCard";
import { OffTrailDriveCard } from "./OffTrailDriveCard";

type OffTrailAction = "projects" | "resume" | "ask" | "about";

/**
 * Picks the off-trail Easter egg by device: a pseudo-3D trail-drive on desktop
 * (keyboard), the trail-runner on touch / small screens. Decided once on mount
 * so it never flips mid-session.
 */
export function OffTrailCard({ onAction }: { onAction: (a: OffTrailAction) => void }) {
  const [desktop] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(min-width: 640px) and (pointer: fine)").matches,
  );
  return desktop ? <OffTrailDriveCard onAction={onAction} /> : <OffTrailRunnerCard onAction={onAction} />;
}
