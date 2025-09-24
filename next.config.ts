import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "avatars.githubusercontent.com", // GitHub avatars
      "lh3.googleusercontent.com",    // Google avatars
    ],
  },

  // ⚡ Add headers properly
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
};

export default nextConfig;
