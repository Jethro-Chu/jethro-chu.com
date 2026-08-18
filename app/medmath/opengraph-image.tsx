import { ImageResponse } from "next/og";

export const alt = "MedMath · Adult Clinical Dosage Lab";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "edge";

export default function MedMathOpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#14211a",
          color: "#f4efe3",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
          padding: "48px 56px",
        }}
      >
        {/* ================= SVG PIXEL ART BACKGROUND SCENE ================= */}
        <svg
          viewBox="0 0 1200 630"
          width="1200"
          height="630"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
          shapeRendering="crispEdges"
        >
          {/* Sky & Mountain Background */}
          <rect x="0" y="0" width="1200" height="630" fill="#14211a" />
          <rect x="0" y="0" width="1200" height="360" fill="#1a2e23" />
          <rect x="0" y="0" width="1200" height="200" fill="#203a2c" />

          {/* Pixel Stars */}
          <rect x="80" y="50" width="4" height="4" fill="#f6efe2" opacity="0.8" />
          <rect x="220" y="90" width="4" height="4" fill="#ffd899" opacity="0.6" />
          <rect x="380" y="40" width="6" height="6" fill="#f6efe2" opacity="0.9" />
          <rect x="560" y="70" width="4" height="4" fill="#ffd899" opacity="0.7" />
          <rect x="740" y="35" width="4" height="4" fill="#f6efe2" opacity="0.8" />
          <rect x="920" y="80" width="6" height="6" fill="#ffd899" opacity="0.8" />
          <rect x="1100" y="45" width="4" height="4" fill="#f6efe2" opacity="0.7" />
          <rect x="150" y="140" width="4" height="4" fill="#ffd899" opacity="0.5" />
          <rect x="840" y="130" width="4" height="4" fill="#f6efe2" opacity="0.6" />

          {/* Distant Mountain Silhouettes */}
          <polygon points="0,320 180,220 380,280 600,170 820,250 1020,160 1200,240 1200,420 0,420" fill="#233a2d" />
          <polygon points="0,370 240,280 480,330 720,240 980,310 1200,230 1200,450 0,450" fill="#2b4737" />

          {/* Pine Trees Left */}
          <polygon points="100,120 60,210 140,210" fill="#182c20" />
          <polygon points="100,165 48,270 152,270" fill="#233f2e" />
          <polygon points="100,225 36,345 164,345" fill="#2c4d38" />
          <rect x="91" y="345" width="18" height="75" fill="#3a2717" />

          <polygon points="200,195 170,270 230,270" fill="#1d3426" />
          <polygon points="200,240 158,330 242,330" fill="#274433" />
          <rect x="194" y="330" width="12" height="60" fill="#3a2717" />

          {/* Pine Trees Right */}
          <polygon points="1100,105 1064,195 1136,195" fill="#182c20" />
          <polygon points="1100,150 1052,255 1148,255" fill="#233f2e" />
          <polygon points="1100,210 1040,330 1160,330" fill="#2c4d38" />
          <rect x="1091" y="330" width="18" height="90" fill="#3a2717" />

          {/* Ground Terrain */}
          <rect x="0" y="390" width="1200" height="240" fill="#334737" />
          <rect x="0" y="435" width="1200" height="195" fill="#283a2d" />
          <rect x="0" y="495" width="1200" height="135" fill="#213025" />

          {/* Cobblestone Path to Lab */}
          <polygon points="510,420 585,420 675,630 435,630" fill="#5a5245" />
          <rect x="525" y="438" width="42" height="18" fill="#756c5c" />
          <rect x="504" y="468" width="48" height="21" fill="#6d6455" />
          <rect x="564" y="474" width="36" height="18" fill="#7d7363" />
          <rect x="486" y="504" width="54" height="24" fill="#756c5c" />
          <rect x="555" y="510" width="48" height="24" fill="#655d4e" />
          <rect x="468" y="546" width="66" height="27" fill="#7d7363" />
          <rect x="552" y="552" width="60" height="27" fill="#6d6455" />

          {/* ================= THE DOSAGE LAB CLINIC CABIN ================= */}
          {/* Foundation Granite */}
          <rect x="330" y="384" width="435" height="36" fill="#50565e" />
          <rect x="336" y="390" width="96" height="24" fill="#686e77" />
          <rect x="444" y="390" width="102" height="24" fill="#5c626b" />
          <rect x="558" y="390" width="96" height="24" fill="#686e77" />
          <rect x="666" y="390" width="90" height="24" fill="#5c626b" />

          {/* Timber Cabin Log Walls */}
          <rect x="345" y="222" width="405" height="168" fill="#6e4624" />
          <rect x="345" y="246" width="405" height="6" fill="#4a2e16" />
          <rect x="345" y="270" width="405" height="6" fill="#4a2e16" />
          <rect x="345" y="294" width="405" height="6" fill="#4a2e16" />
          <rect x="345" y="318" width="405" height="6" fill="#4a2e16" />
          <rect x="345" y="342" width="405" height="6" fill="#4a2e16" />
          <rect x="345" y="366" width="405" height="6" fill="#4a2e16" />

          {/* Corner Interlocks */}
          <rect x="339" y="228" width="18" height="156" fill="#543419" />
          <rect x="738" y="228" width="18" height="156" fill="#543419" />

          {/* Gabled Pine Roof */}
          <polygon points="547.5,114 294,228 801,228" fill="#2d523b" />
          <polygon points="547.5,126 312,228 783,228" fill="#3b6b4e" />
          <line x1="360" y1="204" x2="735" y2="204" stroke="#254230" strokeWidth="6" />
          <line x1="405" y1="180" x2="690" y2="180" stroke="#254230" strokeWidth="6" />
          <line x1="450" y1="156" x2="645" y2="156" stroke="#254230" strokeWidth="6" />
          <polygon points="547.5,108 282,228 300,234 547.5,120 795,234 813,228" fill="#1e3827" />

          {/* Lab Chimney */}
          <rect x="660" y="108" width="42" height="78" fill="#756c5c" />
          <rect x="654" y="102" width="54" height="12" fill="#5c5446" />
          <circle cx="681" cy="78" r="9" fill="#e2ded4" opacity="0.6" />
          <circle cx="693" cy="54" r="14" fill="#e2ded4" opacity="0.4" />
          <circle cx="708" cy="30" r="18" fill="#e2ded4" opacity="0.25" />

          {/* Warm Glowing Doorway */}
          <rect x="516" y="258" width="66" height="132" fill="#3a2211" />
          <rect x="522" y="264" width="54" height="126" fill="#ffa726" />
          <rect x="528" y="270" width="42" height="120" fill="#ffe082" />
          <rect x="510" y="252" width="78" height="9" fill="#4d2f17" />
          <rect x="510" y="252" width="9" height="138" fill="#4d2f17" />
          <rect x="579" y="252" width="9" height="138" fill="#4d2f17" />

          {/* Windows with Warm Golden Glow */}
          <rect x="384" y="264" width="72" height="66" fill="#2d1c0e" />
          <rect x="390" y="270" width="60" height="54" fill="#ffd54f" />
          <rect x="417" y="270" width="6" height="54" fill="#4d2f17" />
          <rect x="390" y="294" width="60" height="6" fill="#4d2f17" />
          <rect x="378" y="330" width="84" height="9" fill="#5a381c" />

          <rect x="639" y="264" width="72" height="66" fill="#2d1c0e" />
          <rect x="645" y="270" width="60" height="54" fill="#ffd54f" />
          <rect x="672" y="270" width="6" height="54" fill="#4d2f17" />
          <rect x="645" y="294" width="60" height="6" fill="#4d2f17" />
          <rect x="633" y="330" width="84" height="9" fill="#5a381c" />

          {/* Glowing [ Rx ] Clinic Sign Board */}
          <rect x="468" y="198" width="159" height="51" fill="#0f172a" stroke="#38bdf8" strokeWidth="4" rx="6" />
          {/* Medical Cross Graphic */}
          <rect x="489" y="213" width="21" height="21" fill="#38bdf8" />
          <rect x="495" y="207" width="9" height="33" fill="#38bdf8" />
          <rect x="495" y="219" width="9" height="9" fill="#ffffff" />
          {/* Rx pixel shapes */}
          {/* R */}
          <rect x="525" y="208" width="6" height="30" fill="#38bdf8" />
          <rect x="531" y="208" width="14" height="6" fill="#38bdf8" />
          <rect x="545" y="214" width="6" height="8" fill="#38bdf8" />
          <rect x="531" y="222" width="14" height="6" fill="#38bdf8" />
          <rect x="539" y="228" width="6" height="10" fill="#38bdf8" />
          {/* x */}
          <rect x="560" y="218" width="6" height="6" fill="#38bdf8" />
          <rect x="572" y="218" width="6" height="6" fill="#38bdf8" />
          <rect x="566" y="224" width="6" height="6" fill="#38bdf8" />
          <rect x="560" y="230" width="6" height="8" fill="#38bdf8" />
          <rect x="572" y="230" width="6" height="8" fill="#38bdf8" />

          {/* ================= CLINICAL PROPS: IV POLE (LEFT) ================= */}
          <polygon points="210,588 165,612 255,612" fill="#475569" />
          <circle cx="165" cy="612" r="7.5" fill="#1e293b" />
          <circle cx="255" cy="612" r="7.5" fill="#1e293b" />
          <circle cx="210" cy="612" r="7.5" fill="#1e293b" />
          <rect x="207" y="336" width="7.5" height="264" fill="#cbd5e1" />
          <path d="M186,342 Q210,330 210,342 Q210,330 234,342" stroke="#94a3b8" strokeWidth="7.5" fill="none" />

          {/* Saline IV Bag */}
          <rect x="162" y="348" width="42" height="72" rx="6" fill="#e0f2fe" opacity="0.95" stroke="#38bdf8" strokeWidth="3" />
          <rect x="165" y="366" width="36" height="48" fill="#38bdf8" opacity="0.35" />
          <line x1="168" y1="372" x2="180" y2="372" stroke="#0284c7" strokeWidth="3" />
          <line x1="168" y1="384" x2="186" y2="384" stroke="#0284c7" strokeWidth="3" />
          <line x1="168" y1="396" x2="180" y2="396" stroke="#0284c7" strokeWidth="3" />
          <rect x="178.5" y="420" width="9" height="21" rx="3" fill="#bae6fd" stroke="#0284c7" strokeWidth="2" />
          <circle cx="183" cy="432" r="3" fill="#0284c7" />

          {/* ================= CLINICAL PROPS: WORKSTATION TABLE (RIGHT) ================= */}
          <rect x="705" y="480" width="255" height="18" fill="#8c582d" />
          <rect x="705" y="498" width="255" height="12" fill="#5e3b1e" />
          <rect x="720" y="510" width="15" height="96" fill="#5e3b1e" />
          <rect x="930" y="510" width="15" height="96" fill="#5e3b1e" />

          {/* Infusion Pump */}
          <rect x="720" y="426" width="66" height="54" rx="6" fill="#334155" stroke="#1e293b" strokeWidth="3" />
          <rect x="726" y="435" width="54" height="24" fill="#0f172a" />
          {/* LED pixels for "125" */}
          <rect x="734" y="439" width="3" height="16" fill="#22c55e" />
          <rect x="744" y="439" width="10" height="3" fill="#22c55e" />
          <rect x="751" y="442" width="3" height="6" fill="#22c55e" />
          <rect x="744" y="448" width="10" height="3" fill="#22c55e" />
          <rect x="744" y="451" width="3" height="4" fill="#22c55e" />
          <rect x="744" y="455" width="10" height="3" fill="#22c55e" />
          <rect x="760" y="439" width="10" height="3" fill="#22c55e" />
          <rect x="760" y="442" width="3" height="6" fill="#22c55e" />
          <rect x="760" y="448" width="10" height="3" fill="#22c55e" />
          <rect x="767" y="451" width="3" height="4" fill="#22c55e" />
          <rect x="760" y="455" width="10" height="3" fill="#22c55e" />

          {/* Amber Pill Bottle */}
          <rect x="804" y="432" width="24" height="48" rx="3" fill="#d97706" />
          <rect x="801" y="426" width="30" height="9" rx="3" fill="#ffffff" />
          <rect x="807" y="441" width="18" height="30" fill="#fffbeb" />

          {/* Glass Vial with Teal Cap */}
          <rect x="840" y="444" width="21" height="36" rx="3" fill="#e0f2fe" opacity="0.85" stroke="#94a3b8" strokeWidth="1.5" />
          <rect x="838.5" y="438" width="24" height="7.5" fill="#0d9488" />

          {/* Clipboard with ECG */}
          <polygon points="879,423 945,435 933,480 867,468" fill="#92400e" />
          <polygon points="882,426 942,438 930,477 870,465" fill="#fefce8" />
          <path d="M879,450 L891,450 L897,438 L903,462 L909,432 L915,453 L927,453" stroke="#0284c7" strokeWidth="2.4" fill="none" />
        </svg>

        {/* ================= CARD CONTENT OVERLAY (HTML / CSS) ================= */}
        {/* Top Header Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "rgba(62, 92, 70, 0.9)",
              border: "1px solid rgba(171, 159, 139, 0.6)",
              padding: "10px 20px",
              borderRadius: 6,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#38bdf8",
              }}
            />
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "#f4efe3",
              }}
            >
              WORLD DESTINATION · CLINICAL DOSAGE LAB
            </span>
          </div>

          <span
            style={{
              fontFamily: "monospace",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "#e2ddcc",
              background: "rgba(20, 33, 26, 0.75)",
              padding: "8px 16px",
              borderRadius: 4,
            }}
          >
            MEDMATH
          </span>
        </div>

        {/* Center Main Card Typography */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            zIndex: 10,
            marginTop: "auto",
            marginBottom: 24,
            background: "rgba(20, 33, 26, 0.75)",
            padding: "24px 32px",
            borderRadius: 8,
            border: "1px solid rgba(171, 159, 139, 0.3)",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 88,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "-0.035em",
              color: "#ffffff",
            }}
          >
            MedMath
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 14,
              fontSize: 36,
              fontWeight: 700,
              color: "#6ee7b7",
            }}
          >
            Adult Clinical Dosage Lab
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 12,
              fontSize: 24,
              lineHeight: 1.35,
              color: "#ede6d6",
              maxWidth: 950,
            }}
          >
            Practice dosage, drips, insulin, and ICU med math across 270+ validated adult clinical templates.
          </div>
        </div>

        {/* Bottom Competencies Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 16,
            borderTop: "1px solid rgba(171, 159, 139, 0.4)",
            fontSize: 18,
            fontFamily: "monospace",
            fontWeight: 600,
            letterSpacing: "0.04em",
            color: "#ffd899",
            zIndex: 10,
          }}
        >
          <span>ADULT MED-SURG · CRITICAL CARE & ICU</span>
          <span>270+ TEMPLATES · EXAM SIMULATOR</span>
        </div>
      </div>
    ),
    size,
  );
}
