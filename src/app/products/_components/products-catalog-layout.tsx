import { Suspense } from "react";

import { BaseLayout } from "@/components/Common/BaseLayout";
import { ProductCard } from "@/components/store/product-card";
import { ProductsCategorySidebar } from "@/components/store/products-category-sidebar";
import {
  ProductsListingMainColumn,
  ProductsListingNavProvider,
} from "@/components/store/products-listing-nav-context";
import { ProductsPagination } from "@/components/store/products-pagination";
import { ProductsToolbar } from "@/components/store/products-toolbar";
import type { ProductsListingResult } from "@/lib/supabase/products-listing";
import { siteOrigin } from "@/lib/seo/site-origin";
import type { ProductsListingLinkState } from "@/lib/utils/products-listing-url";

const LIST_SCHEMA_LIMIT = 48;

type ProductsCatalogLayoutProps = {
  title: string;
  listing: ProductsListingResult;
  linkState: ProductsListingLinkState;
  priceBounds: { min: number; max: number };
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

function CatalogSidebarFallback() {
  return (
    <aside
      className="flex w-full shrink-0 animate-pulse flex-col border-b border-gray-200 bg-gray-50 lg:w-64 lg:max-w-none lg:border-b-0 lg:border-r lg:border-gray-200 xl:w-72"
      aria-hidden
    >
      <div className="h-12 border-b border-gray-200 px-3" />
      <div className="flex flex-col gap-3 px-3 py-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-9 rounded-md bg-neutral-200/80" />
        ))}
      </div>
      <div className="mt-auto h-40 border-t border-gray-200 px-3 py-4">
        <div className="h-4 w-24 bg-neutral-200/80" />
        <div className="mt-4 h-10 w-full rounded-md bg-neutral-200/70" />
      </div>
    </aside>
  );
}

export function ProductsCatalogLayout({
  title,
  listing,
  linkState,
  priceBounds,
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
    Boolean(linkState.segmentChild) ||
    linkState.minPrice != null ||
    linkState.maxPrice != null;

  const origin = siteOrigin();
  const structuredData =
    listing.products.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: title,
          numberOfItems: listing.total,
          itemListElement: listing.products.slice(0, LIST_SCHEMA_LIMIT).map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: p.name,
            url: `${origin}/products/${encodeURIComponent(p.slug)}`,
          })),
        }
      : null;

  return (
    <BaseLayout>
      {structuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      ) : null}

      <main
        id="products-catalog-main"
        className="outline-none"
        tabIndex={-1}
      >
        <div className="product_width mx-auto !w-stretch !max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <header className="mb-8 lg:mb-10">
            <div className="flex flex-wrap items-end gap-0">
              <h1
                id="catalog-page-title"
                className="border-b-4 border-primary pb-2 font-[family-name:var(--font-heading)] text-2xl font-bold tracking-tight text-gray-900 lg:text-[39px]"
              >
                {title}
              </h1>
              <div className="h-px min-w-[4rem] flex-1 bg-gray-200" aria-hidden />
            </div>
          </header>

          <ProductsListingNavProvider>
            <section aria-labelledby="catalog-page-title">
              <div className="flex min-w-0 flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
                <Suspense fallback={<CatalogSidebarFallback />}>
                  <ProductsCategorySidebar
                    categorySlug={categorySlug}
                    childSlug={childSlug}
                    linkMode={sidebarLinkMode}
                    linkState={linkState}
                    priceBounds={priceBounds}
                  />
                </Suspense>
                <ProductsListingMainColumn>
                  {description ? (
                    <p className="mb-6 max-w-3xl text-lg text-gray-600">{description}</p>
                  ) : null}
                  <ProductsToolbar state={linkState} />
                  {listing.total === 0 ? (
                    <p
                      className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center text-gray-600"
                      role="status"
                    >
                      {scopedListing
                        ? "პროდუქტები ვერ მოიძებნა."
                        : "პროდუქტები ჯერ არ არის დამატებული."}
                    </p>
                  ) : (
                    <ul
                      className="grid justify-items-start gap-6 sm:grid-cols-2 lg:grid-cols-3"
                      aria-label={`პროდუქტების სია, ${listing.total} ჩანაწერი`}
                    >
                      {listing.products.map((p, index) => (
                        <li className="w-full min-w-0" key={p.id}>
                          <ProductCard product={p} priority={index < 6} layout="grid" />
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
                </ProductsListingMainColumn>
              </div>
            </section>
          </ProductsListingNavProvider>
        </div>
      </main>
    </BaseLayout>
  );
}
