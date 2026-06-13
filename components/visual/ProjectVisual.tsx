import type { Project } from "@/lib/projects";
import { cn } from "@/lib/utils";

/**
 * Monochrome clinical preview standing in for a real product screenshot.
 * One teal accent reserved for data marks. Clearly labelled as a placeholder
 * so it reads as honest scaffolding, not a fake.
 */
export function ProjectVisual({
  project,
  className,
  bare = false,
}: {
  project: Project;
  className?: string;
  /** Poster mode for LiveWindow: motif only, no chrome / no marker. */
  bare?: boolean;
}) {
  if (bare) {
    return (
      <div
        className={cn(
          "grid h-full w-full place-items-center bg-surface px-6 py-5",
          className
        )}
      >
        <Motif category={project.category} />
      </div>
    );
  }

  return (
    <div className={cn("relative h-full w-full bg-surface", className)}>
      {/* app chrome bar */}
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="size-2 border border-line" />
          <span className="size-2 border border-line" />
          <span className="size-2 border border-line" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          {project.title} · interface
        </span>
      </div>

      <div className="relative p-5">
        <Motif category={project.category} />
      </div>

      {/* honest placeholder marker */}
      <span className="absolute bottom-3 right-3 border border-line bg-bg px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
        Placeholder
      </span>
    </div>
  );
}

const ink = "var(--color-ink)";
const line = "var(--color-line)";
const muted = "var(--color-muted)";
const accent = "var(--color-accent)";

function Motif({ category }: { category: Project["category"] }) {
  switch (category) {
    case "Healthcare":
      return <TrendMotif />;
    case "AI":
      return <ParseMotif />;
    case "Experiment":
      return <EmotionMotif />;
    default:
      return <MapMotif />;
  }
}

/** Experiment → facial expression mapped to a moving market. */
function EmotionMotif() {
  return (
    <svg viewBox="0 0 360 180" className="w-full" role="img" aria-label="Expression driving a market">
      {/* face panel */}
      <rect x="6" y="34" width="112" height="112" fill="none" stroke={line} />
      {/* face landmarks */}
      <circle cx="46" cy="74" r="3" fill={ink} />
      <circle cx="78" cy="74" r="3" fill={ink} />
      <path d="M40 104 Q62 124 84 104" fill="none" stroke={accent} strokeWidth="2.5" />
      {[34, 62, 90].map((x) => (
        <circle key={x} cx={x} cy="50" r="1.5" fill={muted} />
      ))}
      {/* mapping arrow */}
      <line x1="128" y1="90" x2="164" y2="90" stroke={muted} strokeWidth="1.5" />
      <path d="M164 90 l-7 -4 v8 z" fill={muted} />
      {/* market reacting */}
      <line x1="176" y1="146" x2="354" y2="146" stroke={line} />
      <polyline
        points="176,128 208,134 236,108 268,118 300,84 330,96 354,62"
        fill="none"
        stroke={accent}
        strokeWidth="2"
      />
      {[[236, 108], [300, 84], [354, 62]].map(([x, y], i) => (
        <rect key={i} x={x - 3} y={y - 3} width="6" height="6" fill={accent} />
      ))}
      {/* axis ticks */}
      {[190, 222, 254, 286, 318].map((x) => (
        <line key={x} x1={x} y1="40" x2={x} y2="48" stroke={muted} opacity="0.6" />
      ))}
    </svg>
  );
}

/** Healthcare → a lab value trending against its reference range. */
function TrendMotif() {
  return (
    <svg viewBox="0 0 360 180" className="w-full" role="img" aria-label="Lab value trend">
      {/* label rows */}
      <rect x="0" y="0" width="120" height="8" fill={line} />
      <rect x="0" y="16" width="70" height="6" fill={line} opacity="0.7" />
      {/* reference range band */}
      <rect x="0" y="74" width="360" height="40" fill={accent} opacity="0.08" />
      <line x1="0" y1="74" x2="360" y2="74" stroke={line} />
      <line x1="0" y1="114" x2="360" y2="114" stroke={line} />
      {/* trend line */}
      <polyline
        points="6,120 56,108 106,124 156,92 206,100 256,70 306,82 354,58"
        fill="none"
        stroke={accent}
        strokeWidth="2"
      />
      {[[56, 108], [156, 92], [256, 70], [354, 58]].map(([x, y], i) => (
        <rect key={i} x={x - 3} y={y - 3} width="6" height="6" fill={accent} />
      ))}
      {/* axis ticks */}
      {[6, 78, 150, 222, 294].map((x) => (
        <line key={x} x1={x} y1="150" x2={x} y2="156" stroke={muted} />
      ))}
    </svg>
  );
}

/** AI → unstructured input resolving into structured fields. */
function ParseMotif() {
  return (
    <svg viewBox="0 0 360 180" className="w-full" role="img" aria-label="Structured extraction">
      {/* input block */}
      <rect x="0" y="6" width="150" height="64" fill="none" stroke={line} />
      <rect x="12" y="20" width="110" height="6" fill={line} />
      <rect x="12" y="34" width="90" height="6" fill={line} opacity="0.7" />
      <rect x="12" y="48" width="70" height="6" fill={line} opacity="0.5" />
      {/* arrow */}
      <line x1="160" y1="38" x2="196" y2="38" stroke={muted} strokeWidth="1.5" />
      <path d="M196 38 l-7 -4 v8 z" fill={muted} />
      {/* structured fields */}
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(206 ${10 + i * 26})`}>
          <rect width="154" height="20" fill="none" stroke={line} />
          <rect x="8" y="7" width="6" height="6" fill={i === 0 ? accent : muted} />
          <rect x="22" y="7" width="70" height="6" fill={line} />
          <rect x="110" y="7" width="34" height="6" fill={line} opacity="0.6" />
        </g>
      ))}
      <rect x="0" y="92" width="360" height="0.5" fill={line} />
      {/* confidence marks */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={i * 14} y="112" width="9" height="12" fill={i < 4 ? accent : "none"} stroke={i < 4 ? accent : line} />
      ))}
    </svg>
  );
}

/** Product → facilities on a map. */
function MapMotif() {
  return (
    <svg viewBox="0 0 360 180" className="w-full" role="img" aria-label="Facilities map">
      <rect x="0" y="0" width="360" height="180" fill="none" stroke={line} />
      {/* grid roads */}
      {[60, 120, 180].map((y) => (
        <line key={`h${y}`} x1="0" y1={y} x2="360" y2={y} stroke={line} opacity="0.7" />
      ))}
      {[90, 180, 270].map((x) => (
        <line key={`v${x}`} x1={x} y1="0" x2={x} y2="180" stroke={line} opacity="0.7" />
      ))}
      {/* pins */}
      {[[70, 48], [200, 96], [280, 60], [140, 150]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <rect x="-4" y="-4" width="8" height="8" fill={accent} />
        </g>
      ))}
      {/* search field */}
      <rect x="16" y="16" width="150" height="22" fill="var(--color-bg)" stroke={line} />
      <rect x="28" y="24" width="6" height="6" fill="none" stroke={muted} />
    </svg>
  );
}
