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
  },
  // Disable server-side features for static export
  experimental: {
    esmExternals: false,
  }
};

export default nextConfig;
