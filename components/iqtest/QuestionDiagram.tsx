import type { DiagramId } from "@/lib/iqtest/questions";
import styles from "./IQTest.module.css";

function GridTransform() {
  const marked = new Set([0, 3, 4]);
  return (
    <div className={styles.gridDiagram} aria-label="A three by three grid with the top-left, center-left, and center cells marked">
      {Array.from({ length: 9 }, (_, index) => (
        <span key={index} className={marked.has(index) ? styles.gridMarked : undefined} />
      ))}
    </div>
  );
}

function CubeNet() {
  const faces = [
    { label: "D", x: 60, y: 0 },
    { label: "A", x: 0, y: 60 },
    { label: "B", x: 60, y: 60 },
    { label: "C", x: 120, y: 60 },
    { label: "E", x: 60, y: 120 },
    { label: "F", x: 60, y: 180 },
  ];
  return (
    <svg className={styles.netDiagram} viewBox="0 0 180 240" role="img" aria-label="Cube net with B in the center, A left, C right, D above, E below, and F below E">
      {faces.map((face) => (
        <g key={face.label}>
          <rect x={face.x + 0.75} y={face.y + 0.75} width="58.5" height="58.5" />
          <text x={face.x + 30} y={face.y + 36}>{face.label}</text>
        </g>
      ))}
    </svg>
  );
}

function PaintedCube() {
  return (
    <svg className={styles.cubeDiagram} viewBox="0 0 240 210" role="img" aria-label="Cube with its top, front, and right faces painted">
      <polygon className={styles.cubeTop} points="120,12 218,63 120,114 22,63" />
      <polygon className={styles.cubeFront} points="22,63 120,114 120,198 22,147" />
      <polygon className={styles.cubeRight} points="120,114 218,63 218,147 120,198" />
      {[46.5, 71, 95.5].map((offset) => (
        <g key={offset}>
          <path d={`M ${22 + offset} ${63 - offset / 2} L ${120 + offset} ${114 - offset / 2}`} />
          <path d={`M ${22 + offset} ${63 + offset / 2} L ${120 + offset} ${114 + offset / 2}`} />
        </g>
      ))}
      <text x="120" y="71">4 × 4 × 4</text>
    </svg>
  );
}

function Decagon() {
  const points = Array.from({ length: 10 }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / 10;
    return {
      x: 110 + 84 * Math.cos(angle),
      y: 110 + 84 * Math.sin(angle),
    };
  });
  return (
    <svg className={styles.decagonDiagram} viewBox="0 0 220 220" role="img" aria-label="A regular decagon with ten vertices">
      <polygon points={points.map((point) => `${point.x},${point.y}`).join(" ")} />
      {points.map((point, index) => (
        <g key={index}>
          <circle cx={point.x} cy={point.y} r="5" />
          <text x={point.x} y={point.y - 11}>{index + 1}</text>
        </g>
      ))}
    </svg>
  );
}

export function QuestionDiagram({ diagram }: { diagram: DiagramId }) {
  return (
    <div className={styles.diagramWell}>
      {diagram === "grid-transform" && <GridTransform />}
      {diagram === "cube-net" && <CubeNet />}
      {diagram === "painted-cube" && <PaintedCube />}
      {diagram === "decagon" && <Decagon />}
    </div>
  );
}
