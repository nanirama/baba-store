import { requireRole } from "@/lib/auth/helpers";
import { getProducts } from "@/lib/supabase/cms-queries";
import { ProductsCatalogSection } from "@/components/cms/products/products-grid";

export const dynamic = "force-dynamic";

export default async function ProductsDashboardPage() {
  await requireRole("user");
  const products = await getProducts();

  return <ProductsCatalogSection products={products} />;
}
