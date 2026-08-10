import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This project lives inside a parent folder that also happens to have its
  // own (unrelated, older) package-lock.json one level up — Turbopack scans
  // upward for lockfiles to guess the monorepo root and, without this, picks
  // that parent by mistake instead of this actual project folder.
  turbopack: {
    root: path.join(__dirname),
  },
  // The certificate generator reads template.html/assets/logo.png via fs at
  // runtime (not import/require), so Next's production file tracing needs
  // an explicit hint to bundle them into a standalone/serverless output.
  //
  // sharp's actual native shared library (libvips-cpp.so, used by every
  // route that uploads to R2 via src/lib/storage.ts) has the same problem —
  // it's resolved by sharp's own runtime dlopen call, not a static
  // require/import, so file tracing misses it unless told explicitly.
  // Marking sharp external (below) fixes bundling; this fixes tracing.
  outputFileTracingIncludes: {
    // @sparticuz/chromium's packed Chromium binary (bin/*.br) is loaded via
    // its own runtime fs logic, not a static import/require, so — same as
    // sharp's native binary below — tracing misses it unless told
    // explicitly. serverExternalPackages (below) only stops the bundler
    // from relocating the require() call; it does nothing for non-code
    // files like this that tracing can't discover on its own, which is
    // exactly what produced production's "input directory .../chromium/bin
    // does not exist" error while working fine in local dev (dev doesn't
    // go through this file-tracing/standalone-output step at all).
    "/api/admin/certificates/generate": [
      "./src/lib/certificate/**",
      "./node_modules/@sparticuz/chromium/bin/**",
    ],
    "/api/**/*": [
      "./node_modules/@img/sharp-libvips-linux-x64/**",
      "./node_modules/@img/sharp-linux-x64/**",
    ],
  },
  // @sparticuz/chromium resolves its own bundled Chromium binary via a path
  // relative to its own package folder at runtime — if Next's bundler
  // (Turbopack) rewrites/relocates that folder like normal application code,
  // the binary ends up missing at that path in production ("input directory
  // .../@sparticuz/chromium/bin does not exist"). Marking both packages
  // external keeps them as plain node_modules requires instead, so their
  // non-JS assets stay put and get traced/copied as a whole dependency.
  // sharp has the exact same problem: its native .node binary lives in a
  // platform-specific subfolder that the bundler doesn't know to carry along,
  // which is fine on Vercel (sharp is special-cased there) but breaks on
  // other hosts like Netlify.
  // ffmpeg-static has the exact same "binary lives in a package-relative
  // path resolved at runtime, not import time" problem as chromium/sharp
  // above — same fix.
  serverExternalPackages: [
    "@sparticuz/chromium",
    "puppeteer-core",
    "sharp",
    "ffmpeg-static",
    "fluent-ffmpeg",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.adventureclubsmi.com",
      },
    ],
    // Every image already gets resized (max 2000px) and re-encoded to WebP
    // at upload time in src/lib/storage.ts, so Next's own optimizer
    // (/_next/image) was just redundantly re-processing already-optimized
    // files — on Netlify, that costs both bandwidth AND web-request credits
    // for every image on every page view. Disabling it lets browsers fetch
    // R2-hosted images directly from Cloudflare (free egress, same
    // treatment the hero/drone videos already got), matching how video was
    // already served. The one give-up: no more automatic per-device
    // srcset/responsive resizing — an acceptable trade given the credit-cap
    // risk this removes.
    unoptimized: true,
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