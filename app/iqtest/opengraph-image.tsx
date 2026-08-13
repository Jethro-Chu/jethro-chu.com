import { ImageResponse } from "next/og";

export const alt = "The Jethro IQ Test";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "edge";

export default function IQTestOpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "58px 68px 62px",
          background: "#EDE6D6",
          color: "#343943",
          border: "1px solid #B7AF9D",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: "24px",
            borderBottom: "1px solid #B7AF9D",
            fontSize: 20,
            letterSpacing: "0.08em",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span
              style={{
                display: "flex",
                width: 34,
                height: 2,
                background: "#B87322",
              }}
            />
            <span>REASONING ASSESSMENT</span>
          </div>
          <span style={{ color: "#5E5A52" }}>JETHROCHU.COM/IQTEST</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 88,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: "-0.045em",
            }}
          >
            The Jethro IQ Test
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 30,
              fontSize: 36,
              lineHeight: 1.2,
              color: "#3B5C49",
            }}
          >
            25 questions. How far can you get?
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "24px",
            borderTop: "1px solid #B7AF9D",
            fontSize: 20,
            letterSpacing: "0.035em",
            color: "#5E5A52",
          }}
        >
          <span>PROBABILITY · LOGIC · PATTERNS</span>
          <span>QUANTITATIVE · SPATIAL</span>
        </div>
      </div>
    ),
    size,
  );
}
