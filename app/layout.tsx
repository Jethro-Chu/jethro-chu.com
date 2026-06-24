import type { Metadata, Viewport } from "next";
import { fraunces, hanken, plexMono } from "@/lib/fonts";
import { site } from "@/content/content";
import { cn } from "@/lib/utils";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { KonamiListener } from "@/components/games/KonamiListener";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: `${site.name} · ${site.tagline}`,
  description: site.description,
  openGraph: {
    title: site.name,
    description: site.description,
    url: site.url,
    siteName: site.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.description,
  },
};

/** Person structured data — honest fields only, no invented social links. */
const personLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  url: site.url,
  jobTitle: "Nursing student and software builder",
  description: site.description,
  image: `${site.url}/images/halfdome-summit.jpg`,
};

export const viewport: Viewport = {
  themeColor: "#ede6d6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(fraunces.variable, hanken.variable, plexMono.variable)}
    >
      {/* suppressHydrationWarning: browser extensions (Grammarly, etc.) inject
          attributes on <body> before hydration; ignore that one mismatch only. */}
      <body suppressHydrationWarning>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <MotionProvider>{children}</MotionProvider>
        <KonamiListener />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
        />
      </body>
    </html>
  );
}
