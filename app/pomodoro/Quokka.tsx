import { useMemo } from "react";
import {
  QUOKKA_H,
  QUOKKA_W,
  bodyPixels,
  pawPixels,
  eyesOpenPixels,
  eyesClosedPixels,
  nibblePixels,
  sleepMouthPixels,
  sleepPixels,
  celebratePixels,
  type FullnessStage,
  type Pixel,
} from "./quokkaArt";
import { STAGE_LABELS } from "./pomodoroState";
import styles from "./pomodoro.module.css";

export type QuokkaActivity = "idle" | "study" | "break";

interface QuokkaProps {
  stage: FullnessStage;
  activity: QuokkaActivity;
  celebrating: boolean;
}

function Layer({ pixels }: { pixels: Pixel[] }) {
  return (
    <>
      {pixels.map((p, i) => (
        <rect
          key={i}
          x={p.x}
          y={p.y}
          width={p.w}
          height={p.h}
          fill={p.fill}
        />
      ))}
    </>
  );
}

const ACTIVITY_TEXT: Record<QuokkaActivity, string> = {
  idle: "resting",
  study: "quietly nibbling a leaf",
  break: "sleeping",
};

const POSE_CLASS: Record<QuokkaActivity, string> = {
  idle: styles.poseIdle,
  study: styles.poseStudy,
  break: styles.poseBreak,
};

/**
 * Pixel-art quokka. Belly size and face come only from `stage` (earned
 * progress), while `activity` picks the pose layers. Animation is pure CSS
 * so reduced-motion users get still poses for free.
 */
export function Quokka({ stage, activity, celebrating }: QuokkaProps) {
  const body = useMemo(() => bodyPixels(stage), [stage]);
  const paws = useMemo(() => pawPixels(stage), [stage]);
  const eyesOpen = useMemo(() => eyesOpenPixels(stage), [stage]);
  const eyesClosed = useMemo(() => eyesClosedPixels(), []);
  const nibble = useMemo(() => nibblePixels(), []);
  const sleepMouth = useMemo(() => sleepMouthPixels(), []);
  const sleepZ = useMemo(() => sleepPixels(), []);
  const celebrate = useMemo(() => celebratePixels(), []);

  return (
    <div
      className={`${styles.quokka} ${POSE_CLASS[activity]}${celebrating ? ` ${styles.celebrating}` : ""}`}
      role="img"
      aria-label={`${STAGE_LABELS[stage]} quokka, ${celebrating ? "happy after a meal" : ACTIVITY_TEXT[activity]}`}
    >
      <div className={styles.quokkaInner}>
        <svg
          className={styles.quokkaSvg}
          viewBox={`0 0 ${QUOKKA_W} ${QUOKKA_H}`}
          shapeRendering="crispEdges"
          aria-hidden="true"
          focusable="false"
        >
          <g>
            <Layer pixels={body} />
          </g>
          <g className={styles.paws}>
            <Layer pixels={paws} />
          </g>
          <g className={styles.eyesOpen}>
            <Layer pixels={eyesOpen} />
          </g>
          <g className={styles.eyesClosed}>
            <Layer pixels={eyesClosed} />
          </g>
          <g className={styles.nibble}>
            <Layer pixels={nibble.patch} />
            <g className={styles.chewA}>
              <Layer pixels={nibble.chewA} />
            </g>
            <g className={styles.chewB}>
              <Layer pixels={nibble.chewB} />
            </g>
            <g className={styles.leaf}>
              <Layer pixels={nibble.leaf} />
            </g>
          </g>
          <g className={styles.sleepMouth}>
            <Layer pixels={sleepMouth.patch} />
            <Layer pixels={sleepMouth.mouth} />
          </g>
          <g className={styles.sleepZ}>
            <Layer pixels={sleepZ} />
          </g>
          <g className={styles.celebrate}>
            <Layer pixels={celebrate} />
          </g>
        </svg>
      </div>
    </div>
  );
}
