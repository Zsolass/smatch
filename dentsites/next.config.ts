import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// Static export: every page is prerendered and the forms run client-side. The
// Worker in worker/ serves the exported files from out/ and handles /api/*.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
  // This project lives inside the labsites repository; keep the build rooted here.
  turbopack: { root: path.dirname(fileURLToPath(import.meta.url)) },
};

export default nextConfig;
