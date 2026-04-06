import Link from "next/link";

import { requireRole } from "@/lib/auth/helpers";
import { CategoriesBulkUploadForm } from "@/components/cms/categories/categories-bulk-upload-form";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Categories Bulk Upload | Baba.ge",
};

export const dynamic = "force-dynamic";

export default async function CategoriesBulkUploadPage() {
  await requireRole("user");

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Categories Bulk Upload"
        description="Import categories from Excel (.xlsx / .xls) based on your Supabase categories schema."
        actions={
          <Link href="/dashboard/categories">
            <Button variant="outline" className="border-slate-200 font-medium shadow-sm">
              Back to Categories
            </Button>
          </Link>
        }
      />
      <CategoriesBulkUploadForm />
    </div>
  );
}

