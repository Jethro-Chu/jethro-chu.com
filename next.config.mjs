import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Content-Security-Policy', value: "base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'" },
    ] }];
  },

  reactStrictMode: true,
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
  // Legacy aliases point to the matching version. Both canonical routes render directly.
  async redirects() {
    return [
      { source: "/timeundle", destination: "/margillion", permanent: true },
      { source: "/valley", destination: "/website", permanent: true },
      { source: "/village", destination: "/website", permanent: true },
      { source: "/portfolio", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
