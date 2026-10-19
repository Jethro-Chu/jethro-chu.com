import type { MetadataRoute } from "next";
import { site } from "@/content/content";

// The scrolling portfolio is the primary entry; /website is the playable village.
// Both versions remain discoverable as separate canonical routes.
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/website",
    "/resume",
    "/iqtest/data",
    "/ABG",
    "/ABG/ranks",
    "/projects/nursejet",
    "/projects/emotion-stock-market-game",
  ];
  return routes.map((path) => ({
    url: `${site.url}${path}`,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : path === "/website" ? 0.9 : 0.7,
  }));
}
