import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/helpers";
import { getCategories, getCategoryById } from "@/lib/supabase/cms-queries";
import { CategoryForm } from "@/components/cms/categories/category-form";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";

type EditCategoryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  await requireRole("user");
  const paramsData = await params;
  const [category, allCategories] = await Promise.all([getCategoryById(paramsData.id), getCategories()]);

  if (!category) notFound();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Edit Category"
        description="Update name, slug, parent, icon, or description."
        backHref="/dashboard/categories"
        backLabel="Back to categories"
      />
      <CategoryForm category={category} allCategories={allCategories} />
    </div>
  );
}
