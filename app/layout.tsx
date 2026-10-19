import type { Metadata, Viewport } from "next";
import { fraunces, hanken, plexMono } from "@/lib/fonts";
import { site } from "@/content/content";
import { cn } from "@/lib/utils";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { KonamiListener } from "@/components/games/KonamiListener";
import { profileTitle, profileDescription, homeMetadata, profileStructuredData } from "@/lib/profileSeo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: profileTitle,
  description: profileDescription,
  openGraph: homeMetadata.openGraph,
  twitter: homeMetadata.twitter,
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(profileStructuredData).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  );
}
