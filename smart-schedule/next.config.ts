import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for Vercel
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Ignore build errors for deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
