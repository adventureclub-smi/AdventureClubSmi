import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The certificate generator reads template.html/assets/logo.png via fs at
  // runtime (not import/require), so Next's production file tracing needs
  // an explicit hint to bundle them into a standalone/serverless output.
  outputFileTracingIncludes: {
    "/api/admin/certificates/generate": ["./src/lib/certificate/**"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  experimental: {
    // Dynamic pages (registration status, payment state, etc.) must always
    // reflect the latest admin action — the client router cache's default
    // 30s staleTime was serving stale "Already Registered" screens after
    // an admin deleted the registration.
    staleTimes: {
      dynamic: 0,
    },
  },
};

export default nextConfig;