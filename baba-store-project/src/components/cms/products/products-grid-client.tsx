"use client";

import { useEffect, useMemo, useState } from "react";
import { Package } from "lucide-react";
import type { ProductRecord } from "@/types/cms";
import { ProductsGridPagination } from "@/components/cms/products/products-grid-pagination";
import { ProductsGridTable } from "@/components/cms/products/products-grid-table";
import { ProductsGridToolbar } from "@/components/cms/products/products-grid-toolbar";

const DEFAULT_PER_PAGE = 25;

function filterProducts(products: ProductRecord[], query: string): ProductRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return products;
  return products.filter((p) => {
    const hay = [
      p.name,
      p.sku ?? "",
      p.slug,
      p.status,
      String(p.price),
      String(p.quantity ?? ""),
      p.mpn ?? "",
      p.upc ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

type ProductsGridClientProps = {
  products: ProductRecord[];
};

export function ProductsGridClient({ products }: ProductsGridClientProps) {
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => filterProducts(products, search), [products, search]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  const pageSafe = Math.min(Math.max(1, page), totalPages);

  const pageSlice = useMemo(() => {
    const start = (pageSafe - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, pageSafe, perPage]);

  useEffect(() => {
    setPage(1);
  }, [search, perPage]);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const emptySearch = products.length > 0 && search.trim().length > 0 && totalItems === 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
        <div className="flex items-center gap-2.5">
          <Package className="h-5 w-5 text-slate-400" aria-hidden />
          <div>
            <h2 className="text-base font-semibold text-slate-900">Product list</h2>
            <p className="text-xs text-slate-500">Search, filter by page size, and manage rows below.</p>
          </div>
        </div>
        <ProductsGridToolbar
          search={search}
          onSearchChange={setSearch}
          perPage={perPage}
          onPerPageChange={setPerPage}
        />
      </div>
      <ProductsGridTable products={pageSlice} emptySearch={emptySearch} />
      <ProductsGridPagination
        page={pageSafe}
        totalPages={totalPages}
        totalItems={totalItems}
        perPage={perPage}
        onPageChange={setPage}
      />
    </div>
  );
}
