import type { MetadataRoute } from "next";

import { getProductSitemapEntries } from "@/lib/supabase/cms-queries";
import { getCatalogMenuTree } from "@/lib/supabase/categories";
import { childCategoryHref, isReservedRootSlug, parentCategoryHref } from "@/lib/utils/category-href";

/** Regenerate periodically so large product lists do not rebuild on every request. */
export const revalidate = 3600;

function siteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL;
  if (raw) {
    try {
      return new URL(raw).origin;
    } catch {
      /* ignore */
    }
  }
  const vercel = process.env.VERCEL_URL?.replace(/^https?:\/\//, "");
  if (vercel) return `https://${vercel}`;
  return "https://baba.ge";
}

/** Public marketing and policy pages (exclude auth, dashboard, and API). */
const STATIC_PATHS: { path: string; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"]; priority: number }[] =
  [
    { path: "/", changeFrequency: "daily", priority: 1 },
    { path: "/products", changeFrequency: "daily", priority: 0.9 },
    { path: "/about-us", changeFrequency: "monthly", priority: 0.75 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.75 },
    { path: "/privacy-policy", changeFrequency: "monthly", priority: 0.5 },
    { path: "/cesebi-da-pirobebi-929323138", changeFrequency: "monthly", priority: 0.45 },
    { path: "/miwodebis-pirobebi", changeFrequency: "monthly", priority: 0.55 },
    { path: "/onlain-ganvadeba", changeFrequency: "monthly", priority: 0.55 },
  ];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteOrigin();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map(({ path, changeFrequency, priority }) => ({
    url: path === "/" ? `${base}/` : `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  let categoryEntries: MetadataRoute.Sitemap = [];
  try {
    const catalog = await getCatalogMenuTree();
    categoryEntries = catalog.flatMap((p) => {
      if (isReservedRootSlug(p.slug)) return [];
      const parentUrl = `${base}${parentCategoryHref(p.slug)}`;
      const parentEntry: MetadataRoute.Sitemap[0] = {
        url: parentUrl,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.75,
      };
      const childEntries: MetadataRoute.Sitemap = p.children
        .filter((c) => !isReservedRootSlug(c.slug))
        .map((c) => ({
          url: `${base}${childCategoryHref(p.slug, c.slug)}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.72,
        }));
      return [parentEntry, ...childEntries];
    });
  } catch {
    categoryEntries = [];
  }

  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const rows = await getProductSitemapEntries();
    productEntries = rows.map((row) => ({
      url: `${base}/products/${row.slug}`,
      lastModified: row.updated_at ? new Date(row.updated_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.65,
    }));
  } catch {
    productEntries = [];
  }

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
