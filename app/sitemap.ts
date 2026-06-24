import type { MetadataRoute } from "next";
import { site } from "@/content/content";

// Static routes (kept in sync with the app router). The emotion game lives at its
// own /projects route; the home page is the primary entry.
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/resume", "/projects/nursejet", "/projects/emotion-stock-market-game"];
  return routes.map((path) => ({
    url: `${site.url}${path}`,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
