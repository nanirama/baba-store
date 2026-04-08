import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";
import type { SizeLimit } from "next";

/**
 * Set `ANALYZE=true` and run `npm run analyze` (uses Webpack; Turbopack builds skip the plugin).
 * Reports are written under `.next/analyze/` — open `client.html` for the browser bundle
 * (`nodejs.html` / `edge.html` for server/edge).
 */
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: true,
});

/**
 * Server Actions origin allowlist. Vercel preview/production use `VERCEL_URL`; add your
 * canonical site via `NEXTAUTH_URL` or `NEXT_PUBLIC_SITE_URL` in project env.
 */
function serverActionAllowedOrigins(): string[] {
  const hosts = new Set<string>(["localhost:3000", "127.0.0.1:3000"]);
  const vercel = process.env.VERCEL_URL?.replace(/^https?:\/\//, "");
  if (vercel) hosts.add(vercel);
  for (const key of ["NEXTAUTH_URL", "NEXT_PUBLIC_SITE_URL"] as const) {
    const raw = process.env[key];
    if (!raw) continue;
    try {
      hosts.add(new URL(raw).host);
    } catch {
      /* ignore */
    }
  }
  return [...hosts];
}

/** Vercel Functions cap request bodies at 4.5 MB; use 4 MB on Vercel, larger locally. */
function serverActionsBodySizeLimit(): SizeLimit {
  return process.env.VERCEL === "1" ? "4mb" : "50mb";
}

/** Allow product thumbnails from Supabase Storage + legacy CMS hosts (e.g. baba.ge). */
function supabaseStorageRemotePatterns(): {
  protocol: "https";
  hostname: string;
  pathname: string;
}[] {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  if (!raw) return [];
  try {
    const { hostname } = new URL(raw);
    return [
      { protocol: "https", hostname, pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname, pathname: "/storage/v1/render/image/public/**" },
    ];
  } catch {
    return [];
  }
}

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  /** Smaller client bundles; strip debug noise in production only. */
  compiler: {
    removeConsole: isProd ? { exclude: ["error", "warn"] } : false,
  },

  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [68, 72, 75, 78],
    remotePatterns: [
      { protocol: "https", hostname: "baba.ge", pathname: "/**" },
      { protocol: "https", hostname: "www.baba.ge", pathname: "/**" },
      ...supabaseStorageRemotePatterns(),
      { protocol: "https", hostname: "cdn.sanity.io" },
      { protocol: "https", hostname: "source.unsplash.com" },
      { protocol: "https", hostname: "via.placeholder.com" },
      { protocol: "https", hostname: "cdn.cms.steerhealth.io" },
    ],
    /** Prod: Next image optimizer (AVIF/WebP, responsive). Dev: raw URLs to avoid dev caching quirks. */
    unoptimized: !isProd,
    minimumCacheTTL: isProd ? 60 * 60 * 24 : 0,
  },
  experimental: {
    useCache: true,
    serverActions: {
      bodySizeLimit: serverActionsBodySizeLimit(),
      allowedOrigins: serverActionAllowedOrigins(),
    },
    optimizeCss: {
      // Production-only Critters options
      pruneSource: true,
      mergeStylesheets: true,
      preload: "swap",
    },
    /**
     * How long prefetched App Router segments stay reusable (seconds).
     * Slightly higher static reuse cuts redundant RSC fetches on navigation.
     */
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
    /**
     * Tree-shake barrel imports so only used modules ship (smaller JS, faster TTI).
     * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/optimizePackageImports
     */
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-label",
      "@radix-ui/react-slot",
      "zod",
    ],
  },

  // Enable compression for faster response
  compress: true,
  poweredByHeader: false,
  output: "standalone",
  
  // Optimize build output
  productionBrowserSourceMaps: false,

  async headers() {
    // Avoid aggressive browser chunk caching in dev; it can cause stale Turbopack module errors.
    if (!isProd) return [];

    return [
      // ✅ Production cache headers with compression
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=3600",
          },
        ],
      },
      {
        source: "/fonts/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/(.*)",
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

export default withBundleAnalyzer(nextConfig);
