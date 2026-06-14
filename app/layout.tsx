import type { Metadata, Viewport } from "next";
import { fraunces, hanken, plexMono } from "@/lib/fonts";
import { site } from "@/content/content";
import { cn } from "@/lib/utils";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: `${site.name} · ${site.tagline}`,
  description: site.description,
  openGraph: {
    title: site.name,
    description: site.description,
    url: site.url,
    type: "website",
  },
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
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
