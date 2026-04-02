import { requireRole } from "@/lib/auth/helpers";
import { getCategories } from "@/lib/supabase/cms-queries";
import { ProductForm } from "@/components/cms/products/product-form";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";

export default async function NewProductPage() {
  await requireRole("user");
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Add Product"
        description="Create a new catalogue item with media, pricing, and stock."
        backHref="/dashboard/products"
        backLabel="Back to products"
      />
      <ProductForm categories={categories} />
    </div>
  );
}
