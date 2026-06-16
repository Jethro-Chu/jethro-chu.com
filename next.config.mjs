import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // pin the workspace root so a stray ~/package-lock.json isn't inferred
  outputFileTracingRoot: __dirname,
  // bundle the knowledge doc into the /api/ask-jethro serverless function on Vercel
  outputFileTracingIncludes: {
    "/api/ask-jethro": ["./content/jethro-knowledge.md"],
  },
  // serve AVIF first, then WebP, for the Half Dome photo and any future imagery
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
