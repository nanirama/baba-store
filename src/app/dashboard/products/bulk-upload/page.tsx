import Link from "next/link";
import { requireRole } from "@/lib/auth/helpers";
import { BulkUploadForm } from "@/components/cms/products/bulk-upload-form";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Bulk Upload | Baba.ge",
};

export const dynamic = "force-dynamic";

/**
 * Vercel Fluid / Node: Hobby max 300s; Pro default 300s, max 800s (set here or Dashboard → Functions).
 * Bulk + image fetch should stay within this budget or split uploads / use BULK_URL_ONLY_IMAGES=1.
 */
export const maxDuration = 300;

export default async function BulkUploadPage() {
  await requireRole("user");

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Bulk Upload"
        description="Import products from CSV or Excel (Cat.1 / Cat.2, HTML description, main and gallery images)."
        actions={
          <Link href="/dashboard/products">
            <Button variant="outline" className="border-slate-200 font-medium shadow-sm">
              Back to Products
            </Button>
          </Link>
        }
      />
      <BulkUploadForm />
    </div>
  );
}
