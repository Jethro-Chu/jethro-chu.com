"use client";

import React from "react";
import Link from "next/link";

/**
 * Pixel-art illustration of the MedMath Clinical Dosage Lab destination.
 * Incorporates:
 * - The Dosage Lab clinic hut with pine shingle roof and warm interior lantern light
 * - Prominent glowing [ Rx ] clinic sign
 * - IV pole with saline infusion bag, drip chamber, and fluid line
 * - Dosage prep desk with digital infusion pump calculator (125 mL/hr)
 * - Amber pill bottle and glass vial
 * - Clinician clipboard with telemetry ECG flowsheet
 * - Yosemite pine trees, stone pathway, and starry mountain twilight
 *
 * Strictly NO "Jethro Chu" text on the artwork or card face.
 */
function MedMathPixelArtwork() {
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border border-[var(--color-granite-line)] bg-[#18261e] shadow-inner select-none group-hover:border-[var(--color-pine)] transition-colors duration-300">
      <svg
        viewBox="0 0 380 214"
        className="h-full w-full object-cover"
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        <defs>
          {/* Subtle glow filter for the Rx sign and lantern */}
          <filter id="rxGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#38bdf8" floodOpacity="0.8" />
          </filter>
          <filter id="warmGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* ================= BACKGROUND SKY & MOUNTAIN ================= */}
        {/* Sky gradient background */}
        <rect x="0" y="0" width="380" height="214" fill="#14211a" />
        <rect x="0" y="0" width="380" height="120" fill="#1b2d24" />
        <rect x="0" y="0" width="380" height="70" fill="#223b2f" />

        {/* Stars / Pixel Lights in Twilight Sky */}
        <rect x="25" y="18" width="2" height="2" fill="#f6efe2" opacity="0.8" />
        <rect x="70" y="32" width="2" height="2" fill="#ffd899" opacity="0.6" />
        <rect x="120" y="14" width="3" height="3" fill="#f6efe2" opacity="0.9" />
        <rect x="180" y="24" width="2" height="2" fill="#ffd899" opacity="0.5" />
        <rect x="235" y="12" width="2" height="2" fill="#f6efe2" opacity="0.7" />
        <rect x="290" y="28" width="3" height="3" fill="#ffd899" opacity="0.8" />
        <rect x="345" y="16" width="2" height="2" fill="#f6efe2" opacity="0.6" />

        {/* Distant Mountain Silhouettes (Half Dome backdrop) */}
        <polygon points="0,110 50,75 110,95 180,60 250,88 320,55 380,85 380,140 0,140" fill="#22382c" />
        <polygon points="0,125 70,95 140,112 210,80 290,105 380,78 380,150 0,150" fill="#2a4537" />

        {/* Pine Tree Left */}
        <polygon points="30,40 18,70 42,70" fill="#182c20" />
        <polygon points="30,55 14,90 46,90" fill="#233f2e" />
        <polygon points="30,75 10,115 50,115" fill="#2c4d38" />
        <rect x="27" y="115" width="6" height="25" fill="#3a2717" />

        {/* Pine Tree Right */}
        <polygon points="350,35 338,65 362,65" fill="#182c20" />
        <polygon points="350,50 334,85 366,85" fill="#233f2e" />
        <polygon points="350,70 330,110 370,110" fill="#2c4d38" />
        <rect x="347" y="110" width="6" height="30" fill="#3a2717" />

        {/* Secondary Pine Trees */}
        <polygon points="62,65 52,90 72,90" fill="#1d3426" />
        <polygon points="62,80 48,110 76,110" fill="#274433" />
        <rect x="60" y="110" width="4" height="20" fill="#3a2717" />

        {/* Ground Terrain */}
        <rect x="0" y="130" width="380" height="84" fill="#334737" />
        <rect x="0" y="145" width="380" height="69" fill="#283a2d" />
        <rect x="0" y="165" width="380" height="49" fill="#213025" />

        {/* Cobblestone Path to Lab Door */}
        <path
          d="M170,140 L195,140 L225,214 L145,214 Z"
          fill="#5a5245"
        />
        {/* Paver Stones on Path */}
        <rect x="175" y="146" width="14" height="6" fill="#756c5c" />
        <rect x="168" y="156" width="16" height="7" fill="#6d6455" />
        <rect x="188" y="158" width="12" height="6" fill="#7d7363" />
        <rect x="162" y="168" width="18" height="8" fill="#756c5c" />
        <rect x="185" y="170" width="16" height="8" fill="#655d4e" />
        <rect x="156" y="182" width="22" height="9" fill="#7d7363" />
        <rect x="184" y="184" width="20" height="9" fill="#6d6455" />
        <rect x="150" y="197" width="26" height="11" fill="#756c5c" />
        <rect x="182" y="199" width="24" height="11" fill="#7d7363" />

        {/* Grass Tufts */}
        <rect x="85" y="150" width="2" height="6" fill="#4d7c57" />
        <rect x="88" y="148" width="2" height="8" fill="#5c9469" />
        <rect x="91" y="152" width="2" height="4" fill="#4d7c57" />
        <rect x="280" y="155" width="2" height="6" fill="#4d7c57" />
        <rect x="283" y="153" width="2" height="8" fill="#5c9469" />
        <rect x="286" y="157" width="2" height="4" fill="#4d7c57" />
        <rect x="110" y="180" width="3" height="8" fill="#5c9469" />
        <rect x="255" y="185" width="3" height="8" fill="#5c9469" />

        {/* ================= DOSAGE LAB / CLINIC BUILDING ================= */}
        {/* Foundation Granite Blocks */}
        <rect x="110" y="128" width="145" height="12" fill="#50565e" />
        <rect x="112" y="130" width="32" height="8" fill="#686e77" />
        <rect x="148" y="130" width="34" height="8" fill="#5c626b" />
        <rect x="186" y="130" width="32" height="8" fill="#686e77" />
        <rect x="222" y="130" width="30" height="8" fill="#5c626b" />

        {/* Timber Log Cabin Main Walls */}
        <rect x="115" y="74" width="135" height="56" fill="#6e4624" />
        {/* Horizontal plank lines */}
        <rect x="115" y="82" width="135" height="2" fill="#4a2e16" />
        <rect x="115" y="90" width="135" height="2" fill="#4a2e16" />
        <rect x="115" y="98" width="135" height="2" fill="#4a2e16" />
        <rect x="115" y="106" width="135" height="2" fill="#4a2e16" />
        <rect x="115" y="114" width="135" height="2" fill="#4a2e16" />
        <rect x="115" y="122" width="135" height="2" fill="#4a2e16" />

        {/* Corner Log Interlocks */}
        <rect x="113" y="76" width="6" height="52" fill="#543419" />
        <rect x="246" y="76" width="6" height="52" fill="#543419" />

        {/* Gabled Forest Pine Roof */}
        <polygon points="182.5,38 98,76 267,76" fill="#2d523b" />
        <polygon points="182.5,42 104,76 261,76" fill="#3b6b4e" />
        {/* Roof Shingle Texture Rows */}
        <line x1="120" y1="68" x2="245" y2="68" stroke="#254230" strokeWidth="2" />
        <line x1="135" y1="60" x2="230" y2="60" stroke="#254230" strokeWidth="2" />
        <line x1="150" y1="52" x2="215" y2="52" stroke="#254230" strokeWidth="2" />
        <line x1="165" y1="45" x2="200" y2="45" stroke="#254230" strokeWidth="2" />
        {/* Roof Eaves Trim */}
        <polygon points="182.5,36 94,76 100,78 182.5,40 265,78 271,76" fill="#1e3827" />

        {/* Lab Chimney with subtle smoke */}
        <rect x="220" y="36" width="14" height="26" fill="#756c5c" />
        <rect x="218" y="34" width="18" height="4" fill="#5c5446" />
        {/* Smoke puffs */}
        <circle cx="227" cy="26" r="3" fill="#e2ded4" opacity="0.6" />
        <circle cx="231" cy="18" r="4.5" fill="#e2ded4" opacity="0.4" />
        <circle cx="236" cy="10" r="6" fill="#e2ded4" opacity="0.25" />

        {/* Glowing Cabin Doorway */}
        <rect x="172" y="86" width="22" height="44" fill="#3a2211" />
        <rect x="174" y="88" width="18" height="42" fill="#ffa726" filter="url(#warmGlow)" />
        <rect x="176" y="90" width="14" height="40" fill="#ffe082" />
        {/* Door Frame */}
        <rect x="170" y="84" width="26" height="3" fill="#4d2f17" />
        <rect x="170" y="84" width="3" height="46" fill="#4d2f17" />
        <rect x="193" y="84" width="3" height="46" fill="#4d2f17" />

        {/* Left Window with Cross Mullion */}
        <rect x="128" y="88" width="24" height="22" fill="#2d1c0e" />
        <rect x="130" y="90" width="20" height="18" fill="#ffd54f" />
        <rect x="139" y="90" width="2" height="18" fill="#4d2f17" />
        <rect x="130" y="98" width="20" height="2" fill="#4d2f17" />
        <rect x="126" y="110" width="28" height="3" fill="#5a381c" />

        {/* Right Window with Cross Mullion */}
        <rect x="213" y="88" width="24" height="22" fill="#2d1c0e" />
        <rect x="215" y="90" width="20" height="18" fill="#ffd54f" />
        <rect x="224" y="90" width="2" height="18" fill="#4d2f17" />
        <rect x="215" y="98" width="20" height="2" fill="#4d2f17" />
        <rect x="211" y="110" width="28" height="3" fill="#5a381c" />

        {/* Wall Lantern on Entrance Post */}
        <rect x="164" y="94" width="4" height="2" fill="#1f2937" />
        <rect x="163" y="96" width="6" height="8" fill="#ffb74d" filter="url(#warmGlow)" />
        <rect x="162" y="95" width="8" height="2" fill="#111827" />
        <rect x="162" y="104" width="8" height="2" fill="#111827" />

        {/* ================= PROMINENT [ Rx ] DOSAGE LAB SIGN ================= */}
        {/* Sign Board */}
        <rect x="156" y="66" width="53" height="17" fill="#1e293b" stroke="#334155" strokeWidth="1.5" rx="2" />
        <rect x="158" y="68" width="49" height="13" fill="#0f172a" rx="1" />
        {/* Glowing Medical Cross */}
        <rect x="163" y="71" width="7" height="7" fill="#38bdf8" filter="url(#rxGlow)" />
        <rect x="165" y="69" width="3" height="11" fill="#38bdf8" filter="url(#rxGlow)" />
        <rect x="165" y="73" width="3" height="3" fill="#ffffff" />
        {/* Rx Pixel Text */}
        <text
          x="174"
          y="79"
          fontFamily="monospace"
          fontSize="11"
          fontWeight="bold"
          fill="#38bdf8"
          filter="url(#rxGlow)"
          letterSpacing="1"
        >
          Rx
        </text>
        <text
          x="174"
          y="79"
          fontFamily="monospace"
          fontSize="11"
          fontWeight="bold"
          fill="#ffffff"
          letterSpacing="1"
        >
          Rx
        </text>

        {/* ================= CLINICAL PROPS: IV POLE (LEFT FOREGROUND) ================= */}
        {/* Base with Wheels */}
        <polygon points="70,196 55,204 85,204" fill="#475569" />
        <circle cx="55" cy="204" r="2.5" fill="#1e293b" />
        <circle cx="85" cy="204" r="2.5" fill="#1e293b" />
        <circle cx="70" cy="204" r="2.5" fill="#1e293b" />

        {/* Stainless Steel Pole */}
        <rect x="69" y="112" width="2.5" height="88" fill="#cbd5e1" />
        <rect x="68.5" y="112" width="1" height="88" fill="#ffffff" />
        {/* Pole Dual Rams-Horn Hooks */}
        <path d="M62,114 Q70,110 70,114 Q70,110 78,114" stroke="#94a3b8" strokeWidth="2.5" fill="none" />

        {/* IV Infusion Bag (0.9% Normal Saline / D5W) */}
        <rect x="54" y="116" width="14" height="24" rx="2" fill="#e0f2fe" opacity="0.9" stroke="#7dd3fc" strokeWidth="1" />
        {/* Fluid level */}
        <rect x="55" y="122" width="12" height="16" fill="#38bdf8" opacity="0.35" />
        {/* Measurement graduations */}
        <line x1="56" y1="124" x2="60" y2="124" stroke="#0284c7" strokeWidth="1" />
        <line x1="56" y1="128" x2="62" y2="128" stroke="#0284c7" strokeWidth="1" />
        <line x1="56" y1="132" x2="60" y2="132" stroke="#0284c7" strokeWidth="1" />
        {/* Rx blue cross on bag */}
        <rect x="63" y="126" width="4" height="1.5" fill="#0284c7" />
        <rect x="64.25" y="124.75" width="1.5" height="4" fill="#0284c7" />

        {/* Drip Chamber & Tubing */}
        <rect x="59.5" y="140" width="3" height="7" rx="1" fill="#bae6fd" stroke="#0284c7" strokeWidth="0.75" />
        {/* Active Drip Drop in chamber */}
        <circle cx="61" cy="144" r="1" fill="#0284c7" />
        {/* IV Tubing line curving toward workstation */}
        <path
          d="M61,147 C61,162 76,170 82,175 C88,180 96,172 100,165"
          stroke="#e0f2fe"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="3,1"
        />

        {/* ================= CLINICAL PROPS: DOSAGE WORKSTATION TABLE (RIGHT) ================= */}
        {/* Wooden Prep Table */}
        <rect x="235" y="160" width="85" height="6" fill="#8c582d" />
        <rect x="235" y="166" width="85" height="4" fill="#5e3b1e" />
        {/* Table Legs */}
        <rect x="240" y="170" width="5" height="32" fill="#5e3b1e" />
        <rect x="310" y="170" width="5" height="32" fill="#5e3b1e" />
        <rect x="240" y="184" width="75" height="3" fill="#482d17" />

        {/* Prop 1: Digital Infusion Pump / Dosage Calculator */}
        <rect x="240" y="142" width="22" height="18" rx="2" fill="#334155" stroke="#1e293b" strokeWidth="1" />
        {/* Pump Green LED Rate Display: "125" */}
        <rect x="242" y="145" width="18" height="8" fill="#0f172a" />
        <text x="244" y="152" fontFamily="monospace" fontSize="6.5" fontWeight="bold" fill="#22c55e">
          125
        </text>
        {/* Keypad Buttons */}
        <rect x="243" y="155" width="3" height="3" fill="#64748b" />
        <rect x="248" y="155" width="3" height="3" fill="#64748b" />
        <rect x="253" y="155" width="3" height="3" fill="#22c55e" />
        <rect x="258" y="155" width="3" height="3" fill="#ef4444" />

        {/* Prop 2: Amber Prescription Pill Bottle */}
        <rect x="268" y="144" width="8" height="16" rx="1" fill="#d97706" />
        <rect x="267" y="142" width="10" height="3" rx="1" fill="#ffffff" />
        {/* White label on vial */}
        <rect x="269" y="147" width="6" height="10" fill="#fffbeb" />
        <line x1="270" y1="150" x2="274" y2="150" stroke="#b45309" strokeWidth="0.75" />
        <line x1="270" y1="153" x2="273" y2="153" stroke="#b45309" strokeWidth="0.75" />

        {/* Prop 3: Glass Injectable Vial with Teal Cap */}
        <rect x="280" y="148" width="7" height="12" rx="1" fill="#e0f2fe" opacity="0.85" stroke="#94a3b8" strokeWidth="0.5" />
        <rect x="279.5" y="146" width="8" height="2.5" fill="#0d9488" />
        {/* Liquid in vial */}
        <rect x="281" y="152" width="5" height="7" fill="#0d9488" opacity="0.4" />

        {/* Prop 4: Clinician Clipboard with ECG & Dosage Chart */}
        <polygon points="293,141 315,145 311,160 289,156" fill="#92400e" />
        <polygon points="294,142 314,146 310,159 290,155" fill="#fefce8" />
        <rect x="301" y="140" width="7" height="3" rx="1" fill="#64748b" />
        {/* Cyan ECG Wave on Chart */}
        <path
          d="M293,150 L297,150 L299,146 L301,154 L303,144 L305,151 L309,151"
          stroke="#0284c7"
          strokeWidth="0.8"
          fill="none"
        />

        {/* Trail Wooden Destination Marker (Left) */}
        <rect x="95" y="166" width="4" height="24" fill="#543419" />
        <polygon points="82,168 116,168 122,174 116,180 82,180" fill="#784824" stroke="#3e2410" strokeWidth="1" />
        <text x="86" y="176.5" fontFamily="monospace" fontSize="6.5" fontWeight="bold" fill="#ffd899">
          DOSAGE LAB
        </text>
      </svg>

      {/* World-Destination Badge Overlay (Bottom Right) */}
      <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 rounded-xs border border-[var(--color-granite-line)]/50 bg-[#0f172a]/80 px-2.5 py-1 backdrop-blur-xs">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#38bdf8] opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-[#38bdf8]" />
        </span>
        <span className="font-mono text-[0.68rem] font-bold tracking-wider text-[#e0f2fe] uppercase">
          World Destination
        </span>
      </div>
    </div>
  );
}

interface MedMathDestinationCardProps {
  className?: string;
}

/**
 * MedMathDestinationCard
 *
 * A custom pixel-art interactive world destination card for MedMath that
 * fits naturally into the Yosemite / game-map world of jethrochu.com.
 *
 * Strict requirement: NO "Jethro Chu" text anywhere on the card or artwork.
 * Primary branding: MedMath
 * Subtitle: Adult Clinical Dosage Lab
 * Description: Practice dosage, drips, insulin, and ICU med math
 */
export function MedMathDestinationCard({ className = "" }: MedMathDestinationCardProps) {
  return (
    <article
      className={`group relative overflow-hidden rounded-md border border-[var(--color-granite-line)] bg-[var(--color-card)] p-6 sm:p-8 shadow-[0_1px_2px_rgba(60,64,73,0.05),0_16px_40px_-20px_rgba(60,64,73,0.25)] transition-all duration-200 ease-[var(--ease-trail)] hover:-translate-y-1 hover:border-[var(--color-pine)] hover:shadow-[0_4px_8px_rgba(60,64,73,0.08),0_24px_52px_-22px_rgba(44,67,52,0.35)] ${className}`}
    >
      <Link href="/medmath" className="block focus:outline-hidden">
        {/* Main Grid: Responsive 2-Column layout on large screens */}
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-8 items-center">
          {/* Left: Rich Pixel-Art World Scene */}
          <div className="overflow-hidden">
            <MedMathPixelArtwork />
          </div>

          {/* Right: Card Identity, Clinical Competencies, and Call to Action */}
          <div className="flex flex-col justify-between space-y-4">
            <div>
              {/* Eyebrow / Destination Label */}
              <div className="flex items-center gap-2">
                <span className="flex size-1.5 rounded-full bg-[var(--color-pine)]" />
                <span className="font-mono text-[0.72rem] font-bold tracking-wider text-[var(--color-pine)] uppercase">
                  Clinical Destination · Interactive Lab
                </span>
              </div>

              {/* Main Title: MedMath */}
              <h3 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-shadow)] group-hover:text-[var(--color-pine)] transition-colors">
                MedMath
              </h3>

              {/* Subtitle */}
              <p className="mt-1 font-body text-base font-semibold text-[var(--color-pine)]">
                Adult Clinical Dosage Lab
              </p>

              {/* Description */}
              <p className="mt-3 font-body text-sm leading-relaxed text-[var(--color-shadow)]">
                Practice dosage, drips, insulin, and ICU med math across 270+ validated adult clinical templates. Features progressive hints, step-by-step solutions, and simulation exams.
              </p>

              {/* Competency Tags */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {[
                  "Adult Med-Surg",
                  "Critical Care & ICU",
                  "270+ Templates",
                  "Exam Simulator",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-xs border border-[var(--color-granite-line)] bg-[var(--color-sand)]/50 px-2 py-0.5 font-mono text-[0.68rem] text-[var(--color-shadow)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom CTA Action Button */}
            <div className="pt-2">
              <span className="inline-flex items-center gap-2 rounded-sm bg-[var(--color-pine)] px-4 py-2.5 font-body text-sm font-semibold text-[var(--color-on-dark)] shadow-xs transition-all duration-150 group-hover:bg-[var(--color-pine-deep)] group-hover:gap-3">
                <span>Enter Dosage Lab</span>
                <svg
                  aria-hidden="true"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
