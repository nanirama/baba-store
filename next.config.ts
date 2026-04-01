import type { NextConfig } from "next";
import type { SizeLimit } from "next";

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
    return [{ protocol: "https", hostname, pathname: "/storage/v1/object/public/**" }];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  experimental: {
    useCache: true,
    serverActions: {
      bodySizeLimit: serverActionsBodySizeLimit(),
      allowedOrigins: serverActionAllowedOrigins(),
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "baba.ge", pathname: "/**" },
      { protocol: "https", hostname: "www.baba.ge", pathname: "/**" },
      ...supabaseStorageRemotePatterns(),
    ],
  },
};

export default nextConfig;
