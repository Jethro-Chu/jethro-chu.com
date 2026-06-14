import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // pin the workspace root so a stray ~/package-lock.json isn't inferred
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
