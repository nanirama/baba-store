import Link from "next/link";

import { ProductsCategoryAccordion } from "@/components/store/products-category-accordion";
import { getCatalogMenuTree } from "@/lib/supabase/categories";

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
};

export async function ProductsCategorySidebar({
  categorySlug,
  childSlug,
  linkMode = "products",
}: ProductsCategorySidebarProps) {
  const parents = await loadParents();

  if (parents.length === 0) return null;

  return (
    <aside
      className="w-full shrink-0 border-b border-gray-200 bg-gray-50 lg:w-64 lg:border-b-0 lg:border-r lg:border-gray-200 xl:w-72"
      aria-label="კატეგორიებით ფილტრი"
    >
      <div className="border-b border-gray-200 px-2 py-3 sm:px-3">
        <Link
          href="/products"
          className="block rounded-md px-2 py-2 text-sm font-semibold text-primary transition-colors hover:bg-orange-50"
        >
          ყველა პროდუქტი
        </Link>
      </div>
      <ProductsCategoryAccordion
        parents={parents}
        categorySlug={categorySlug}
        childSlug={childSlug}
        linkMode={linkMode}
      />
    </aside>
  );
}
