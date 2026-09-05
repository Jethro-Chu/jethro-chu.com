import type { MetadataRoute } from "next";
import { site } from "@/content/content";

// Static routes kept in sync with the app router. The village is the primary
// entry, while the reading and chatbot experience lives at /website.
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
