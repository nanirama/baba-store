import Link from "next/link";

import { ProductsCategoryAccordion } from "@/components/store/products-category-accordion";
import { ProductsPriceFilter } from "@/components/store/products-price-filter";
import { getCatalogMenuTree } from "@/lib/supabase/categories";
import type { ProductsListingLinkState } from "@/lib/utils/products-listing-url";

async function loadParents() {
  try {
    return await getCatalogMenuTree();
  } catch {
    return [];
  }
}

export type ProductsCategorySidebarProps = {
  /** `/products/{categorySlug}` */
  categorySlug?: string;
  /** `/products/{categorySlug}/{childSlug}` */
  childSlug?: string;
  /** `root` matches storefront `/{slug}` URLs in the accordion. */
  linkMode?: "products" | "root";
  linkState: ProductsListingLinkState;
  priceBounds: { min: number; max: number };
};

export async function ProductsCategorySidebar({
  categorySlug,
  childSlug,
  linkMode = "products",
  linkState,
  priceBounds,
}: ProductsCategorySidebarProps) {
  const parents = await loadParents();

  if (parents.length === 0) return null;

  return (
    <aside
      className="flex w-full shrink-0 flex-col border-b border-gray-200 bg-gray-50 lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:w-64 lg:border-b-0 lg:border-r lg:border-gray-200 xl:w-72"
      aria-label="კატეგორიებით ფილტრი"
    >
      <div className="shrink-0 border-b border-gray-200 px-2 py-3 sm:px-3">
        <Link
          href="/products"
          className="block rounded-md px-2 py-2 text-sm font-semibold text-primary transition-colors hover:bg-orange-50"
        >
          ყველა პროდუქტი
        </Link>
      </div>
      <div className="min-h-0 min-w-0 flex-1 lg:overflow-y-auto lg:overscroll-contain">
        <ProductsCategoryAccordion
          parents={parents}
          categorySlug={categorySlug}
          childSlug={childSlug}
          linkMode={linkMode}
        />
      </div>
      <div className="relative z-0 shrink-0 border-t border-gray-200 bg-gray-50">
        <ProductsPriceFilter linkState={linkState} priceBounds={priceBounds} />
      </div>
    </aside>
  );
}
