import { ProductsCatalogLayout } from "@/app/products/_components/products-catalog-layout";
import { siteOrigin } from "@/lib/seo/site-origin";
import type { ProductsListingResult } from "@/lib/supabase/products-listing";
import { toHref, type ProductsListingLinkState } from "@/lib/utils/products-listing-url";

export type ProductsCatalogPageProps = {
  title: string;
  listing: ProductsListingResult;
  linkState: ProductsListingLinkState;
  priceBounds: { min: number; max: number };
  /** Sidebar: active parent (`/products/{slug}` or `/{slug}`). */
  categorySlug?: string;
  /** Sidebar: active child slug. */
  childSlug?: string;
  /** `products` → `/products/…` links; `root` → `/{slug}` storefront links. */
  sidebarLinkMode?: "products" | "root";
  description?: string | null;
};

/**
 * Shared catalog chrome: header, category sidebar, toolbar, grid, pagination.
 * Computes `totalPages` from `listing` so route pages stay thin.
 * Emits CollectionPage JSON-LD for the current listing URL (filters, pagination).
 */
export function ProductsCatalogPage({
  title,
  listing,
  linkState,
  priceBounds,
  categorySlug,
  childSlug,
  sidebarLinkMode = "products",
  description,
}: ProductsCatalogPageProps) {
  const totalPages = Math.max(1, Math.ceil(listing.total / listing.perPage));
  const origin = siteOrigin();
  const listingUrl = `${origin}${toHref(linkState)}`;
  const desc = description?.trim();

  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    url: listingUrl,
    numberOfItems: listing.total,
    ...(desc ? { description: desc } : {}),
    isPartOf: {
      "@type": "WebSite",
      name: "Baba.ge",
      url: origin,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageSchema) }}
      />
      <ProductsCatalogLayout
        title={title}
        listing={listing}
        linkState={linkState}
        priceBounds={priceBounds}
        totalPages={totalPages}
        categorySlug={categorySlug}
        childSlug={childSlug}
        sidebarLinkMode={sidebarLinkMode}
        description={description}
      />
    </>
  );
}
