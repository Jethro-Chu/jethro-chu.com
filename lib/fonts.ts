import { Fraunces, Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";

/**
 * Three type roles for the Yosemite Ascent system.
 * - Fraunces: warm optically-sized serif for the name and section titles
 *   (field-guide character, not the cold Playfair every AI portfolio reaches for).
 * - Hanken Grotesk: clean, slightly warm body and UI.
 * - IBM Plex Mono: instrument readout for the altimeter and metadata.
 * Exposed as CSS variables and wired into Tailwind tokens in globals.css.
 */

export const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT"],
});

export const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-hanken",
});

export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});
