import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  experimental: {
    staleTimes: {
      dynamic: 60,  // client reuses dynamic pages for 60s before re-fetching
      static: 300,  // static pages kept for 5 min
    },
  },
};

export default nextConfig;