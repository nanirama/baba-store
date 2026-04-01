/**
 * Storefront category URLs:
 * - Parent: `/[slug]`
 * - Child: `/[parent-slug]/[child-slug]`
 */

/** Slugs that must not map to `app/[slug]` (static routes, APIs, marketing paths). */
const RESERVED_ROOT_SLUGS = new Set([
  "_next",
  "api",
  "auth",
  "dashboard",
  "products",
  "about",
  "contact",
  "terms",
  "privacy",
  "online",
  "delivery",
  "sitemap",
  "robots",
]);

export function isReservedRootSlug(slug: string): boolean {
  return RESERVED_ROOT_SLUGS.has(slug.trim().toLowerCase());
}

export function parentCategoryHref(slug: string): string {
  return `/${encodeURIComponent(slug)}`;
}

export function childCategoryHref(parentSlug: string, childSlug: string): string {
  return `/${encodeURIComponent(parentSlug)}/${encodeURIComponent(childSlug)}`;
}
