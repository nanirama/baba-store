import { ChevronRight, ChevronsRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { mergeListingParams, type ProductsListingLinkState, toHref } from "@/lib/utils/products-listing-url";

type ProductsPaginationProps = {
  state: ProductsListingLinkState;
  total: number;
  perPage: number;
  totalPages: number;
};

const WINDOW = 9;

function pageNumbers(current: number, total: number): number[] {
  if (total <= WINDOW) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const end = Math.min(Math.max(current + 4, WINDOW), total);
  const start = Math.max(1, end - WINDOW + 1);
  const adjustedEnd = Math.min(start + WINDOW - 1, total);
  const adjustedStart = Math.max(1, adjustedEnd - WINDOW + 1);
  return Array.from({ length: adjustedEnd - adjustedStart + 1 }, (_, i) => adjustedStart + i);
}

const numBase =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center border text-sm font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1";

export function ProductsPagination({ state, total, perPage, totalPages }: ProductsPaginationProps) {
  if (totalPages <= 1 || total === 0) return null;

  const page = state.page;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  const href = (p: number) => toHref(mergeListingParams(state, { page: p }));

  const pages = pageNumbers(page, totalPages);

  const iconCell =
    "inline-flex h-9 w-9 shrink-0 items-center justify-center border border-gray-200 bg-white text-blue-600 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white";

  return (
    <nav
      aria-label="გვერდების ნავიგაცია"
      className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-wrap items-center gap-1">
        {pages.map((p) =>
          p === page ? (
            <span
              key={p}
              className={cn(numBase, "cursor-default border-neutral-500 bg-neutral-500 text-white")}
              aria-current="page"
            >
              {p}
            </span>
          ) : (
            <Link
              key={p}
              href={href(p)}
              className={cn(numBase, "border-gray-200 bg-white text-blue-600 hover:bg-gray-50")}
            >
              {p}
            </Link>
          )
        )}
        {page < totalPages ? (
          <Link href={href(page + 1)} className={iconCell} aria-label="შემდეგი გვერდი">
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : (
          <span className={cn(iconCell, "pointer-events-none")} aria-disabled="true">
            <ChevronRight className="h-4 w-4" aria-hidden />
          </span>
        )}
        {page < totalPages ? (
          <Link href={href(totalPages)} className={iconCell} aria-label="ბოლო გვერდი">
            <ChevronsRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : (
          <span className={cn(iconCell, "pointer-events-none")} aria-disabled="true">
            <ChevronsRight className="h-4 w-4" aria-hidden />
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 tabular-nums sm:text-right">
        <span className="text-gray-700">
          {from} დან {to} მდე, სულ {total}
        </span>{" "}
        <span className="text-gray-500">({totalPages} გვერდი)</span>
      </p>
    </nav>
  );
}
