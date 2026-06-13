import { ACCENT_HEX, type Project } from "@/lib/projects";
import { cn } from "@/lib/utils";

/**
 * Generative project preview. No screenshots required — each category gets a
 * tasteful, abstract "mock UI" motif tinted by the project's accent color.
 * Designed to read as a premium product preview behind glass.
 */
export function ProjectVisual({
  project,
  className,
}: {
  project: Project;
  className?: string;
}) {
  const accent = ACCENT_HEX[project.accent];

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden",
        className
      )}
      style={{ background: "var(--color-ink-2)" }}
    >
      {/* accent wash */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background: `radial-gradient(120% 90% at 18% 8%, ${accent}33 0%, transparent 55%), radial-gradient(90% 80% at 100% 100%, ${accent}1f 0%, transparent 50%)`,
        }}
      />
      {/* subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <Motif category={project.category} accent={accent} />

      {/* sheen */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.07]" />
    </div>
  );
}

function Motif({
  category,
  accent,
}: {
  category: Project["category"];
  accent: string;
}) {
  switch (category) {
    case "Healthcare":
      return <VitalsMotif accent={accent} />;
    case "AI":
      return <AiMotif accent={accent} />;
    case "Research":
      return <ResearchMotif accent={accent} />;
    case "Product":
      return <ProductMotif accent={accent} />;
    default:
      return <ExperimentMotif accent={accent} />;
  }
}

const panel = "rgba(255,255,255,0.05)";
const stroke = "rgba(255,255,255,0.12)";
const faint = "rgba(255,255,255,0.18)";

/** Healthcare → trending vitals chart behind a glass card */
function VitalsMotif({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 400 260" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice">
      <g transform="translate(40 36)">
        <rect width="320" height="190" rx="16" fill={panel} stroke={stroke} />
        <rect x="22" y="22" width="120" height="9" rx="4.5" fill={faint} />
        <rect x="22" y="40" width="70" height="7" rx="3.5" fill="rgba(255,255,255,0.1)" />
        {/* range band */}
        <rect x="22" y="86" width="276" height="44" rx="6" fill={accent} opacity="0.1" />
        {/* trend line */}
        <polyline
          points="22,120 62,108 102,124 142,96 182,104 222,72 262,84 298,58"
          fill="none"
          stroke={accent}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {[ [62,108],[142,96],[222,72],[298,58] ].map(([x,y],i)=>(
          <circle key={i} cx={x} cy={y} r="3.5" fill="var(--color-ink)" stroke={accent} strokeWidth="2" />
        ))}
        {/* footer chips */}
        <rect x="22" y="150" width="58" height="22" rx="11" fill={accent} opacity="0.18" />
        <rect x="88" y="150" width="48" height="22" rx="11" fill={panel} stroke={stroke} />
      </g>
    </svg>
  );
}

/** AI → conversation + structured extraction */
function AiMotif({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 400 260" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice">
      <g transform="translate(40 34)">
        {/* incoming bubble */}
        <rect x="0" y="6" width="170" height="46" rx="14" fill={panel} stroke={stroke} />
        <rect x="16" y="20" width="120" height="7" rx="3.5" fill={faint} />
        <rect x="16" y="33" width="84" height="7" rx="3.5" fill="rgba(255,255,255,0.1)" />
        {/* response bubble (accent) */}
        <rect x="150" y="64" width="170" height="58" rx="14" fill={accent} opacity="0.16" stroke={accent} strokeOpacity="0.4" />
        <rect x="166" y="80" width="138" height="7" rx="3.5" fill={accent} opacity="0.7" />
        <rect x="166" y="94" width="110" height="7" rx="3.5" fill={accent} opacity="0.45" />
        <rect x="166" y="108" width="60" height="7" rx="3.5" fill={accent} opacity="0.3" />
        {/* structured fields */}
        <rect x="0" y="138" width="320" height="56" rx="14" fill={panel} stroke={stroke} />
        {[0,1,2].map((i)=>(
          <g key={i} transform={`translate(${20 + i*104} 150)`}>
            <circle cx="6" cy="14" r="5" fill={accent} opacity={0.8 - i*0.2} />
            <rect x="18" y="6" width="64" height="6" rx="3" fill={faint} />
            <rect x="18" y="18" width="44" height="6" rx="3" fill="rgba(255,255,255,0.1)" />
          </g>
        ))}
      </g>
    </svg>
  );
}

/** Research → ranked list / radar */
function ResearchMotif({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 400 260" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice">
      <g transform="translate(40 30)">
        {[0,1,2,3].map((i)=>(
          <g key={i} transform={`translate(0 ${i*44})`}>
            <rect width="320" height="34" rx="10" fill={panel} stroke={stroke} />
            <circle cx="20" cy="17" r="7" fill={accent} opacity={0.85 - i*0.18} />
            <rect x="40" y="9" width={180 - i*26} height="7" rx="3.5" fill={faint} />
            <rect x="40" y="21" width={120 - i*18} height="6" rx="3" fill="rgba(255,255,255,0.1)" />
            <rect x="270" y="11" width="34" height="12" rx="6" fill={accent} opacity="0.2" />
          </g>
        ))}
      </g>
    </svg>
  );
}

/** Product → map pins / grid of cards */
function ProductMotif({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 400 260" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice">
      <g transform="translate(36 30)">
        <rect width="328" height="200" rx="16" fill={panel} stroke={stroke} />
        {/* faux roads */}
        <path d="M0 70 H328 M0 140 H328 M110 0 V200 M220 0 V200" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
        {[[70,52],[180,96],[260,60],[140,160],[280,150]].map(([x,y],i)=>(
          <g key={i} transform={`translate(${x} ${y})`}>
            <circle r="13" fill={accent} opacity="0.16" />
            <circle r="6" fill={accent} opacity={0.9 - i*0.12} />
          </g>
        ))}
        {/* search bar */}
        <rect x="20" y="18" width="160" height="26" rx="13" fill="var(--color-ink)" stroke={stroke} />
        <circle cx="36" cy="31" r="5" fill="none" stroke={accent} strokeWidth="2" />
      </g>
    </svg>
  );
}

/** Experiment → orbiting particles */
function ExperimentMotif({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 400 260" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice">
      <g transform="translate(200 130)">
        {[44, 78, 112].map((r, i) => (
          <ellipse
            key={i}
            rx={r}
            ry={r * 0.42}
            fill="none"
            stroke={stroke}
            transform={`rotate(${i * 36})`}
          />
        ))}
        <circle r="16" fill={accent} opacity="0.22" />
        <circle r="7" fill={accent} />
        {[[100,0,0.9],[ -64,28,0.6],[40,-50,0.45]].map(([x,y,o],i)=>(
          <circle key={i} cx={x} cy={y} r="5" fill={accent} opacity={o as number} />
        ))}
      </g>
    </svg>
  );
}
