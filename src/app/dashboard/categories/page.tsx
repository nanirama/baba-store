import Link from "next/link";
import { requireRole } from "@/lib/auth/helpers";
import { getCategories } from "@/lib/supabase/cms-queries";
import { CategoryAdminTree } from "@/components/cms/categories/category-admin-tree";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function CategoriesDashboardPage() {
  await requireRole("user");
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Categories"
        description="Organize your catalogue with parent categories and subcategories. Expand rows to view children."
        actions={
          <>
            {/* <Link href="/dashboard/categories/bulk-upload">
              <Button variant="outline" className="border-slate-200 font-medium shadow-sm">
                Bulk Upload
              </Button>
            </Link> */}
            {/* <Link href="/dashboard/categories/new">
              <Button className="bg-[#ff5100] font-medium text-white shadow-sm hover:bg-[#ff5100]/90">
                New Category
              </Button>
            </Link> */}
          </>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        <CategoryAdminTree categories={categories} />
      </div>
    </div>
  );
}
