import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/helpers";
import { getCategories, getProductById } from "@/lib/supabase/cms-queries";
import { ProductForm } from "@/components/cms/products/product-form";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  await requireRole("user");
  const paramsData = await params;
  const [product, categories] = await Promise.all([getProductById(paramsData.id), getCategories()]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Edit Product"
        description="Update details, images, SEO fields, and stock."
        backHref="/dashboard/products"
        backLabel="Back to products"
      />
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
