import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Turbopack configuration (Next.js 16 default)
  turbopack: {
    // Turbopack handles native modules automatically
  },
  // Webpack configuration (for --webpack flag or fallback)
  webpack: (config, { isServer }) => {
    // Exclude better-sqlite3 from client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'better-sqlite3': false,
      };
    }
    return config;
  },
};

export default nextConfig;
