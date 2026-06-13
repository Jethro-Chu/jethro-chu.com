/**
 * Site-wide ambient background. Fixed behind all content: a deep gradient
 * wash plus slow-drifting aurora blobs. Pure CSS animation — no JS cost.
 */
export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* base vertical wash */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-10%,#14121f_0%,transparent_55%),radial-gradient(ellipse_90%_70%_at_85%_110%,#0d1518_0%,transparent_50%)]" />

      {/* drifting aurora blobs */}
      <div
        className="aurora-blob animate-[aurora_22s_ease-in-out_infinite_alternate]"
        style={{
          top: "-10%",
          left: "-5%",
          width: "44vw",
          height: "44vw",
          background:
            "radial-gradient(circle at 30% 30%, var(--color-iris), transparent 65%)",
          opacity: 0.32,
        }}
      />
      <div
        className="aurora-blob animate-[aurora_26s_ease-in-out_infinite_alternate-reverse]"
        style={{
          top: "20%",
          right: "-10%",
          width: "40vw",
          height: "40vw",
          background:
            "radial-gradient(circle at 60% 40%, var(--color-aqua), transparent 65%)",
          opacity: 0.18,
        }}
      />
      <div
        className="aurora-blob animate-[aurora_30s_ease-in-out_infinite_alternate]"
        style={{
          bottom: "-15%",
          left: "25%",
          width: "38vw",
          height: "38vw",
          background:
            "radial-gradient(circle at 50% 50%, var(--color-coral), transparent 70%)",
          opacity: 0.12,
        }}
      />

      {/* vignette to keep edges grounded */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_100%_at_50%_50%,transparent_55%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
}
