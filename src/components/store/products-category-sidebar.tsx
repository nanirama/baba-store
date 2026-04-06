import dynamic from "next/dynamic";
import Link from "next/link";

import { getCatalogMenuTree } from "@/lib/supabase/categories";
import type { ProductsListingLinkState } from "@/lib/utils/products-listing-url";

const ProductsCategoryAccordion = dynamic(
  () =>
    import("@/components/store/products-category-accordion").then((m) => ({
      default: m.ProductsCategoryAccordion,
    })),
  {
    ssr: true,
    loading: () => <CategoryAccordionSkeleton />,
  },
);

const ProductsPriceFilter = dynamic(
  () =>
    import("@/components/store/products-price-filter").then((m) => ({
      default: m.ProductsPriceFilter,
    })),
  {
    ssr: true,
    loading: () => <PriceFilterSkeleton />,
  },
);

/** Reserved layout while the accordion chunk hydrates (CLS guard on client navigations). */
function CategoryAccordionSkeleton() {
  return (
    <div
      className="min-h-[220px] w-full min-w-0 px-2 py-4 sm:px-3"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="იტვირთება კატეგორიები"
    >
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="h-8 rounded-md bg-neutral-200/75" />
        ))}
      </div>
    </div>
  );
}

function PriceFilterSkeleton() {
  return (
    <div
      className="min-h-[140px] w-full border-t border-gray-200 bg-gray-50 px-2 py-3 sm:px-3"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="იტვირთება ფასის ფილტრი"
    >
      <div className="h-4 w-28 max-w-[80%] rounded bg-neutral-200/80" />
      <div className="mt-5 h-9 w-full rounded-md bg-neutral-200/70" />
      <div className="mt-3 h-9 w-full rounded-md bg-neutral-200/60" />
    </div>
  );
}

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
      id="product-catalog-sidebar"
      className="flex w-full shrink-0 flex-col border-b border-gray-200 bg-gray-50 lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:w-64 lg:border-b-0 lg:border-r lg:border-gray-200 xl:w-72"
      aria-label="კატეგორიებით ფილტრი"
    >
      <nav
        aria-label="კატალოგი"
        className="shrink-0 border-b border-gray-200 px-2 py-3 sm:px-3"
      >
        <Link
          href="/products"
          className="block rounded-md px-2 py-2 text-sm font-semibold text-primary transition-colors hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          ყველა პროდუქტი
        </Link>
      </nav>
      <div className="min-h-0 min-w-0 flex-1 lg:overflow-y-auto lg:overscroll-contain">
        <ProductsCategoryAccordion
          parents={parents}
          categorySlug={categorySlug}
          childSlug={childSlug}
          linkMode={linkMode}
        />
      </div>
      <section
        aria-label="ფასის ფილტრი"
        className="relative z-0 shrink-0 border-t border-gray-200 bg-gray-50"
      >
        <ProductsPriceFilter linkState={linkState} priceBounds={priceBounds} />
      </section>
    </aside>
  );
}
