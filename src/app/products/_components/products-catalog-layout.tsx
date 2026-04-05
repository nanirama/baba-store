import { BaseLayout } from "@/components/Common/BaseLayout";
import { ProductCard } from "@/components/store/product-card";
import { ProductsCategorySidebar } from "@/components/store/products-category-sidebar";
import { ProductsPagination } from "@/components/store/products-pagination";
import { ProductsToolbar } from "@/components/store/products-toolbar";
import type { ProductsListingResult } from "@/lib/supabase/products-listing";
import type { ProductsListingLinkState } from "@/lib/utils/products-listing-url";

type ProductsCatalogLayoutProps = {
  title: string;
  listing: ProductsListingResult;
  linkState: ProductsListingLinkState;
  totalPages: number;
  /** Sidebar: `/products/{categorySlug}` */
  categorySlug?: string;
  /** Sidebar: `/products/{categorySlug}/{childSlug}` */
  childSlug?: string;
  /** Sidebar links: `root` for `/{slug}` storefront routes. */
  sidebarLinkMode?: "products" | "root";
  /** Optional intro under the title (e.g. category description). */
  description?: string | null;
};

export function ProductsCatalogLayout({
  title,
  listing,
  linkState,
  totalPages,
  categorySlug,
  childSlug,
  sidebarLinkMode = "products",
  description,
}: ProductsCatalogLayoutProps) {
  const scopedListing =
    Boolean(linkState.q) ||
    Boolean(linkState.category) ||
    Boolean(linkState.segmentBase) ||
    Boolean(linkState.segmentChild);
    

  return (
    <BaseLayout>
      <div className="mx-auto !max-w-7xl !w-stretch product_width px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <header className="mb-8 lg:mb-10">
          <div className="flex flex-wrap items-end gap-0">
            <h1 className="border-b-4 border-primary pb-2 font-[family-name:var(--font-heading)] font-bold tracking-tight text-gray-900 text-2xl lg:text-[39px]">
              {title}
            </h1>
            <div className="h-px min-w-[4rem] flex-1 bg-gray-200" aria-hidden />
          </div>
        </header>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
          <ProductsCategorySidebar
            categorySlug={categorySlug}
            childSlug={childSlug}
            linkMode={sidebarLinkMode}
          />
          <div className="min-w-0 flex-1">
            {description ? (
              <p className="mb-6 max-w-3xl text-lg text-gray-600">{description}</p>
            ) : null}
            <ProductsToolbar state={linkState} />
            {listing.total === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center text-gray-600">
                {scopedListing ? "პროდუქტები ვერ მოიძებნა." : "პროდუქტები ჯერ არ არის დამატებული."}
              </p>
            ) : (
             <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 justify-items-start">
                {listing.products.map((p) => (
                  <li className="w-full" key={p.id}>
                    <ProductCard product={p} />
                  </li>
                ))}
              </ul>
            )}
            <ProductsPagination
              state={linkState}
              total={listing.total}
              perPage={listing.perPage}
              totalPages={totalPages}
            />
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}
