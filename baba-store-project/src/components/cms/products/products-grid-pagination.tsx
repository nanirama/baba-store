"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ProductsGridPaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  onPageChange: (page: number) => void;
};

export function ProductsGridPagination({
  page,
  totalPages,
  totalItems,
  perPage,
  onPageChange,
}: ProductsGridPaginationProps) {
  if (totalItems === 0) return null;

  const start = totalItems === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/40 px-4 py-3.5 sm:px-5">
      <p className="text-sm text-slate-600">
        Showing{" "}
        <span className="font-semibold tabular-nums text-slate-900">
          {start}–{end}
        </span>{" "}
        of <span className="font-semibold tabular-nums text-slate-900">{totalItems}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-9 border-slate-200 bg-white pl-2 pr-3 font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Previous
        </Button>
        <span className="min-w-[7rem] px-2 text-center text-sm tabular-nums text-slate-600">
          Page <span className="font-semibold text-slate-900">{page}</span> of{" "}
          <span className="font-semibold text-slate-900">{totalPages}</span>
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="h-9 border-slate-200 bg-white pl-3 pr-2 font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
