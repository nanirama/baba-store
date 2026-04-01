import Link from "next/link";
import type { ReactNode } from "react";
import { LayoutGrid } from "lucide-react";
import type { ProductRecord } from "@/types/cms";
import { ProductsGridClient } from "@/components/cms/products/products-grid-client";
import { Button } from "@/components/ui/button";

type ProductsCatalogSectionProps = {
  products: ProductRecord[];
  /** Inserted between &quot;Manage Categories&quot; and &quot;Add Product&quot; (e.g. Bulk Upload). */
  toolbarExtras?: ReactNode;
  title?: string;
  description?: string;
};

/** Header + TailAdmin-style listing card (search, table, pagination). */
export function ProductsCatalogSection({
  products,
  toolbarExtras,
  title = "Products",
  description = "Manage catalogue items with add, edit, and delete actions.",
}: ProductsCatalogSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <LayoutGrid className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-500">{description}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Link href="/dashboard/categories">
            <Button
              variant="outline"
              className="border-slate-200 bg-white font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Manage Categories
            </Button>
          </Link>
          {toolbarExtras}
          <Link href="/dashboard/products/new">
            <Button className="bg-[#ff5100] font-medium text-white shadow-sm hover:bg-[#ff5100]/90">Add Product</Button>
          </Link>
        </div>
      </div>

      <ProductsGridClient products={products} />
    </div>
  );
}
