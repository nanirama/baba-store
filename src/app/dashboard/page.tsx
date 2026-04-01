import Link from "next/link";
import { requireRole } from "@/lib/auth/helpers";
import { getProducts } from "@/lib/supabase/cms-queries";
import { ProductsCatalogSection } from "@/components/cms/products/products-grid";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Dashboard Products | Baba.ge",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireRole("user");
  const products = await getProducts();

  return (
    <ProductsCatalogSection
      products={products}
      toolbarExtras={
        <Link href="/dashboard/products/bulk-upload">
          <Button variant="outline">Bulk Upload</Button>
        </Link>
      }
    />
  );
}
