import { cn } from "@/lib/utils";

/**
 * A faithful inline-SVG miniature of the self-hosted Market Pulse terminal
 * (the Emotion Stock Market game). Uses the terminal's own fixed palette
 * (true-black, amber #ffa028, up #26d07c, down #f6465d) so the poster reads
 * as the real thing. Flat, dense, monospace. The live, playable terminal is
 * one click away; this is its poster, not a fake screenshot.
 */

const C = {
  bg: "#000000",
  panel: "#0d0d0d",
  head: "#0a0a0a",
  line: "#262626",
  text: "#e8e8e8",
  muted: "#8a8a8a",
  amber: "#ffa028",
  up: "#26d07c",
  down: "#f6465d",
};

const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

// price → y within the chart plot (domain 180..276 → y 142..32)
const PLOT_TOP = 32;
const PLOT_BOT = 142;
const P_MIN = 180;
const P_MAX = 276;
const py = (p: number) =>
  +(PLOT_BOT - ((p - P_MIN) / (P_MAX - P_MIN)) * (PLOT_BOT - PLOT_TOP)).toFixed(1);

const CANDLES: [number, number, number, number][] = [
  [188, 193, 186, 191],
  [191, 197, 190, 195],
  [195, 201, 193, 199],
  [199, 205, 197, 203],
  [203, 210, 201, 208],
  [208, 214, 205, 206],
  [206, 219, 205, 217],
  [217, 231, 216, 229],
  [229, 242, 227, 239],
  [239, 255, 238, 252],
  [252, 266, 250, 263],
  [263, 272, 256, 259],
  [259, 264, 247, 250],
  [250, 255, 238, 241],
  [241, 245, 224, 227],
  [227, 231, 213, 217],
];
const MA = [189, 190, 192, 195, 198, 201, 204, 209, 215, 222, 230, 238, 244, 247, 246, 243];
const cx = (i: number) => +(12 + i * 14.4).toFixed(1);
const LAST = 216.53;

const WATCH: [string, string, string, boolean][] = [
  ["NVDA", "216.53", "+89.9%", true],
  ["AAPL", "232.18", "+1.4%", true],
  ["TSLA", "274.05", "-2.6%", false],
  ["AMZN", "201.77", "+0.8%", true],
];

export function TerminalPoster({ className }: { className?: string }) {
  return (
    <div
      className={cn("grid h-full w-full place-items-center overflow-hidden", className)}
      style={{ background: C.bg }}
    >
      <svg
        viewBox="0 0 400 250"
        preserveAspectRatio="xMidYMid meet"
        className="block h-full w-full"
        style={{ fontFamily: MONO }}
        role="img"
        aria-label="Market Pulse Terminal: a Bloomberg-style trading terminal"
      >
        <rect x="0" y="0" width="400" height="250" fill={C.bg} />

        {/* command bar */}
        <rect x="0" y="0" width="400" height="16" fill="#050300" />
        <text x="8" y="11" fill={C.amber} fontSize="7" fontWeight="700" letterSpacing="0.5">
          MARKET PULSE
        </text>
        <text x="74" y="11" fill={C.muted} fontSize="6">
          &gt; EQUITY US &lt;GO&gt;
        </text>
        {["F1 TRADE", "F2 POS", "F3 ALERTS", "F4 SND"].map((k, i) => (
          <g key={k}>
            <rect
              x={236 + i * 40}
              y="3.5"
              width="38"
              height="9"
              fill="none"
              stroke={C.line}
            />
            <text x={239 + i * 40} y="10" fontSize="5.2" letterSpacing="0.3">
              <tspan fill={C.amber}>{k.slice(0, 2)}</tspan>
              <tspan fill={C.muted}> {k.slice(3)}</tspan>
            </text>
          </g>
        ))}

        {/* ---- CHART panel ---- */}
        <rect x="1" y="18" width="248" height="128" fill={C.panel} stroke={C.line} />
        <rect x="1" y="18" width="248" height="12" fill={C.head} stroke={C.line} />
        <text x="6" y="27" fill={C.amber} fontSize="6" fontWeight="700" letterSpacing="0.8">
          CHART
        </text>
        <text x="40" y="27" fill={C.amber} fontSize="6" fontWeight="700">
          NVDA
        </text>
        <text x="66" y="27" fill={C.text} fontSize="6">
          ${LAST.toFixed(2)}
        </text>
        <text x="112" y="27" fill={C.up} fontSize="6">
          +89.98%
        </text>
        <text x="232" y="27" fill={C.amber} fontSize="5.2" stroke="none">
          MA(20)
        </text>

        {/* candlesticks */}
        {CANDLES.map(([o, h, l, c], i) => {
          const up = c >= o;
          const col = up ? C.up : C.down;
          const top = py(Math.max(o, c));
          const bot = py(Math.min(o, c));
          return (
            <g key={i} stroke={col} fill={col}>
              <line x1={cx(i)} y1={py(h)} x2={cx(i)} y2={py(l)} strokeWidth="0.8" />
              <rect
                x={cx(i) - 3.4}
                y={top}
                width="6.8"
                height={Math.max(0.8, bot - top)}
                stroke="none"
              />
            </g>
          );
        })}
        {/* MA line */}
        <polyline
          points={MA.map((m, i) => `${cx(i)},${py(m)}`).join(" ")}
          fill="none"
          stroke={C.amber}
          strokeWidth="1"
          opacity="0.9"
        />
        {/* last-price line + label */}
        <line
          x1="6"
          y1={py(LAST)}
          x2="243"
          y2={py(LAST)}
          stroke={C.amber}
          strokeWidth="0.6"
          strokeDasharray="2 2"
          opacity="0.7"
        />
        <rect x="226" y={py(LAST) - 5} width="20" height="9" fill={C.amber} />
        <text x="236" y={py(LAST) + 1.5} fill="#1a1206" fontSize="5.4" fontWeight="700" textAnchor="middle">
          {LAST.toFixed(2)}
        </text>

        {/* ---- SENTIMENT panel ---- */}
        <rect x="251" y="18" width="148" height="128" fill={C.panel} stroke={C.line} />
        <rect x="251" y="18" width="148" height="12" fill={C.head} stroke={C.line} />
        <text x="257" y="27" fill={C.amber} fontSize="6" fontWeight="700" letterSpacing="0.8">
          SENTIMENT
        </text>
        <text x="392" y="27" fill={C.muted} fontSize="5.4" textAnchor="end">
          OFFLINE
        </text>
        {/* camera well */}
        <rect x="257" y="35" width="136" height="58" fill="#000" stroke={C.line} />
        <text x="325" y="56" fill={C.muted} fontSize="5" textAnchor="middle">
          Reads facial expressions
        </text>
        <text x="325" y="63" fill={C.muted} fontSize="5" textAnchor="middle">
          on-device. Nothing uploaded.
        </text>
        <rect x="293" y="71" width="64" height="13" fill={C.amber} />
        <text x="325" y="80" fill="#000" fontSize="6" fontWeight="700" textAnchor="middle" letterSpacing="0.4">
          ▶ START CAMERA
        </text>
        {/* readout rows */}
        <text x="257" y="103" fill={C.muted} fontSize="5">
          EXPRESSION
        </text>
        <text x="392" y="103" fill={C.muted} fontSize="6" fontWeight="700" textAnchor="end">
          ··
        </text>
        <text x="257" y="114" fill={C.muted} fontSize="5">
          CONFIDENCE
        </text>
        <rect x="305" y="110" width="87" height="4" fill="#1a1a1a" stroke={C.line} strokeWidth="0.5" />
        <text x="257" y="126" fill={C.muted} fontSize="5">
          SENTIMENT
        </text>
        <text x="392" y="126" fill={C.text} fontSize="6" textAnchor="end">
          +0.00
        </text>
        <rect x="257" y="131" width="135" height="5" fill="#1a1a1a" stroke={C.line} strokeWidth="0.5" />
        <line x1="324.5" y1="131" x2="324.5" y2="136" stroke={C.muted} strokeWidth="0.5" />

        {/* ---- WATCHLIST panel ---- */}
        <rect x="1" y="148" width="248" height="84" fill={C.panel} stroke={C.line} />
        <rect x="1" y="148" width="248" height="12" fill={C.head} stroke={C.line} />
        <text x="6" y="157" fill={C.amber} fontSize="6" fontWeight="700" letterSpacing="0.8">
          WATCHLIST
        </text>
        <text x="243" y="157" fill={C.muted} fontSize="5" textAnchor="end">
          CLICK TO SELECT
        </text>
        {["SYM", "LAST", "CHG", "%CHG"].map((h, i) => (
          <text
            key={h}
            x={i === 0 ? 8 : 90 + i * 50}
            y="168"
            fill={C.muted}
            fontSize="5"
            textAnchor={i === 0 ? "start" : "end"}
          >
            {h}
          </text>
        ))}
        {WATCH.map(([sym, last, chg, up], i) => {
          const y = 180 + i * 12;
          const col = up ? C.up : C.down;
          return (
            <g key={sym}>
              {i === 0 && <rect x="2" y={y - 9} width="246" height="11" fill="#1c1505" />}
              {i === 0 && <rect x="2" y={y - 9} width="1.6" height="11" fill={C.amber} />}
              <text x="8" y={y} fill={C.text} fontSize="6" fontWeight="700">
                {sym}
              </text>
              <text x="140" y={y} fill={C.text} fontSize="6" textAnchor="end">
                {last}
              </text>
              <text x="190" y={y} fill={col} fontSize="6" textAnchor="end">
                {up ? "▲" : "▼"}
              </text>
              <text x="240" y={y} fill={col} fontSize="6" textAnchor="end">
                {chg}
              </text>
            </g>
          );
        })}

        {/* ---- PORTFOLIO panel ---- */}
        <rect x="251" y="148" width="148" height="84" fill={C.panel} stroke={C.line} />
        <rect x="251" y="148" width="148" height="12" fill={C.head} stroke={C.line} />
        <text x="257" y="157" fill={C.amber} fontSize="6" fontWeight="700" letterSpacing="0.8">
          PORTFOLIO
        </text>
        <text x="392" y="157" fill={C.muted} fontSize="5" textAnchor="end">
          HI $1.2M
        </text>
        {[
          ["CASH", "$42,180"],
          ["VALUE", "$118,540"],
          ["P&L", "+18,540"],
        ].map(([k, v], i) => (
          <g key={k}>
            <text x={258 + i * 47} y="170" fill={C.muted} fontSize="4.6">
              {k}
            </text>
            <text x={258 + i * 47} y="178" fill={i === 2 ? C.up : C.text} fontSize="6">
              {v}
            </text>
          </g>
        ))}
        <text x="257" y="191" fill={C.amber} fontSize="5">
          GOAL
        </text>
        <text x="392" y="191" fill={C.amber} fontSize="5" textAnchor="end">
          $118K / $1M
        </text>
        <rect x="257" y="194" width="135" height="5" fill="#1a1a1a" stroke={C.line} strokeWidth="0.5" />
        <rect x="257" y="194" width="16" height="5" fill={C.amber} />
        <rect x="257" y="205" width="65" height="13" fill="none" stroke={C.up} />
        <text x="289.5" y="214" fill={C.up} fontSize="6" fontWeight="700" textAnchor="middle">
          BUY
        </text>
        <rect x="327" y="205" width="65" height="13" fill="none" stroke={C.down} />
        <text x="359.5" y="214" fill={C.down} fontSize="6" fontWeight="700" textAnchor="middle">
          SELL
        </text>

        {/* ---- ALERTS ticker ---- */}
        <rect x="0" y="234" width="400" height="16" fill={C.head} />
        <rect x="0" y="234" width="44" height="16" fill={C.amber} />
        <text x="22" y="244.5" fill="#000" fontSize="5.4" fontWeight="700" textAnchor="middle" letterSpacing="0.5">
          ALERTS
        </text>
        <text x="52" y="244.5" fill={C.down} fontSize="6" fontWeight="700">
          ⚠ MARKET CRASH -3.1%
        </text>
        <text x="190" y="244.5" fill={C.amber} fontSize="6" fontWeight="700">
          ◆ WHALE ALERT
        </text>
        <text x="270" y="244.5" fill={C.text} fontSize="6">
          NVDA breaks 216
        </text>
      </svg>
    </div>
  );
}
