import { ProductsCatalogLayout } from "@/app/products/_components/products-catalog-layout";
import type { ProductsListingResult } from "@/lib/supabase/products-listing";
import type { ProductsListingLinkState } from "@/lib/utils/products-listing-url";

export type ProductsCatalogPageProps = {
  title: string;
  listing: ProductsListingResult;
  linkState: ProductsListingLinkState;
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
 */
export function ProductsCatalogPage({
  title,
  listing,
  linkState,
  categorySlug,
  childSlug,
  sidebarLinkMode = "products",
  description,
}: ProductsCatalogPageProps) {
  const totalPages = Math.max(1, Math.ceil(listing.total / listing.perPage));

  return (
    <ProductsCatalogLayout
      title={title}
      listing={listing}
      linkState={linkState}
      totalPages={totalPages}
      categorySlug={categorySlug}
      childSlug={childSlug}
      sidebarLinkMode={sidebarLinkMode}
      description={description}
    />
  );
}
