import { ImageResponse } from "next/og";

// Branded share card (also used for Twitter). Yosemite palette, generated at build.
export const alt = "Jethro Chu, a nursing student who builds software";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SAND = "#ede6d6";
const SHADOW = "#3c4049";
const MUTED = "#5e5749";
const PINE = "#3e5c46";
const GOLD = "#c98f45";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: SAND,
          padding: "76px 84px",
          fontFamily: "sans-serif",
        }}
      >
        {/* top row: site label + summit reading */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", color: MUTED, fontSize: 26, letterSpacing: 6 }}>JETHROCHU.COM</div>
          <div style={{ display: "flex", color: MUTED, fontSize: 24, letterSpacing: 2 }}>8,839 FT · SUMMIT</div>
        </div>

        {/* name + tagline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 132, fontWeight: 700, color: SHADOW, lineHeight: 1 }}>
            Jethro Chu
          </div>
          <div style={{ display: "flex", fontSize: 40, color: MUTED, marginTop: 28, maxWidth: 880 }}>
            Nursing student who builds software between clinical shifts.
          </div>
        </div>

        {/* bottom row: golden route line + role */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", width: 560, height: 5, background: GOLD, borderRadius: 3 }} />
          <div style={{ display: "flex", color: PINE, fontSize: 28, letterSpacing: 5 }}>NURSE · BUILDER</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
