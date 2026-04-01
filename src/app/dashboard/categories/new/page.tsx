import { requireRole } from "@/lib/auth/helpers";
import { getCategories } from "@/lib/supabase/cms-queries";
import { CategoryForm } from "@/components/cms/categories/category-form";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";

export default async function NewCategoryPage() {
  await requireRole("user");
  const allCategories = await getCategories();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="New Category"
        description="Add a top-level category or nest under an existing parent."
        backHref="/dashboard/categories"
        backLabel="Back to categories"
      />
      <CategoryForm allCategories={allCategories} />
    </div>
  );
}
