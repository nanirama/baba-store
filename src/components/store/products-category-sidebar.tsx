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
};

export async function ProductsCategorySidebar({
  categorySlug,
  childSlug,
}: ProductsCategorySidebarProps) {
  const parents = await loadParents();

  if (parents.length === 0) return null;

  return (
    <aside
      className="w-full shrink-0 border-b border-gray-200 bg-gray-50 lg:w-64 lg:border-b-0 lg:border-r lg:border-gray-200 xl:w-72"
      aria-label="კატეგორიებით ფილტრი"
    >
      <ProductsCategoryAccordion parents={parents} categorySlug={categorySlug} childSlug={childSlug} />
    </aside>
  );
}
