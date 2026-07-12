import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The certificate generator reads template.html/assets/logo.png via fs at
  // runtime (not import/require), so Next's production file tracing needs
  // an explicit hint to bundle them into a standalone/serverless output.
  outputFileTracingIncludes: {
    "/api/admin/certificates/generate": ["./src/lib/certificate/**"],
  },
  // @sparticuz/chromium resolves its own bundled Chromium binary via a path
  // relative to its own package folder at runtime — if Next's bundler
  // (Turbopack) rewrites/relocates that folder like normal application code,
  // the binary ends up missing at that path in production ("input directory
  // .../@sparticuz/chromium/bin does not exist"). Marking both packages
  // external keeps them as plain node_modules requires instead, so their
  // non-JS assets stay put and get traced/copied as a whole dependency.
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "*.cloudfront.net",
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
  // Files under /public get no caching guidance by default (max-age=0,
  // must-revalidate), so a returning visitor's browser re-asks the server
  // on every single load instead of just using its own cached copy — cheap
  // per request (a 304), but needless for assets that never change in place.
  // If hero/drone ever need updating, ship them under a new filename rather
  // than overwriting these ones, since "immutable" tells browsers to never
  // even check back for a year.
  async headers() {
    return [
      {
        source: "/videos/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;