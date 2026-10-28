import type { NextConfig } from "next";

// Static export: the marketing site and the case submission demo are fully
// client-side. The Worker in worker/ serves the exported files from out/ and
// handles /api/* (the Inquire endpoint).
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
