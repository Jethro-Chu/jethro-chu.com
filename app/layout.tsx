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
        {/* Front-page no-flash cover. On the homepage the village auto-opens over
            the scroll site for capable visitors; this pre-paint script drops a
            village-green cover BEFORE the scroll site paints (same capability
            checks as the auto-open), so there's no flash of the site first.
            ValleyDoor lifts it once the village is opaque; a 4s failsafe clears
            it regardless. Crawlers / no-JS / reduced-motion / tiny screens and
            anyone who closed the village this session skip it and get the site. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(location.pathname!=="/")return;if(sessionStorage.getItem("village-closed")==="1")return;if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;if(Math.min(innerWidth,innerHeight)<360)return;var c=document.createElement("canvas");if(!(c.getContext("webgl")||c.getContext("experimental-webgl")))return;var d=document.createElement("div");d.id="village-preload";d.setAttribute("aria-hidden","true");d.style.cssText="position:fixed;inset:0;z-index:59;background:#3f7a57";document.documentElement.appendChild(d);setTimeout(function(){var e=document.getElementById("village-preload");if(e)e.remove();},4000);}catch(e){}})();`,
          }}
        />
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
