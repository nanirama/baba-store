import Link from "next/link";
import { ChevronRight, ChevronsRight, Eye, Trash2 } from "lucide-react";

import { deleteOrderFormAction } from "@/actions/orders";
import { requireRole } from "@/lib/auth/helpers";
import { getOrdersPage } from "@/lib/supabase/cms-queries";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";

export const dynamic = "force-dynamic";

const PER_PAGE_OPTIONS = [25, 50, 100, 200] as const;

function pageNumbers(current: number, total: number): number[] {
  const windowSize = 9;
  if (total <= windowSize) return Array.from({ length: total }, (_, i) => i + 1);
  const end = Math.min(Math.max(current + 4, windowSize), total);
  const start = Math.max(1, end - windowSize + 1);
  const adjustedEnd = Math.min(start + windowSize - 1, total);
  const adjustedStart = Math.max(1, adjustedEnd - windowSize + 1);
  return Array.from({ length: adjustedEnd - adjustedStart + 1 }, (_, i) => adjustedStart + i);
}

export default async function OrdersDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; per_page?: string }>;
}) {
  await requireRole("user");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const perPage = PER_PAGE_OPTIONS.includes(Number(sp.per_page) as (typeof PER_PAGE_OPTIONS)[number])
    ? Number(sp.per_page)
    : 25;
  const { items: orders, total } = await getOrdersPage({ page, perPage });
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, total);
  const href = (p: number, pp = perPage) => `/dashboard/orders?page=${p}&per_page=${pp}`;
  const pages = pageNumbers(currentPage, totalPages);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Orders"
        description="View and manage submitted orders."
        actions={
          <form action="/dashboard/orders" method="get" className="w-[120px]">
            <label htmlFor="orders-per-page" className="mb-1.5 block text-xs font-medium text-slate-600">
              Per page
            </label>
            <select
              id="orders-per-page"
              name="per_page"
              defaultValue={String(perPage)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-[#ff5100] focus:ring-2 focus:ring-[#ff5100]/20"
            >
              {PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <input type="hidden" name="page" value="1" />
            <button type="submit" className="sr-only" aria-label="Apply per page">
              Apply
            </button>
          </form>
        }
      />

      <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90">
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 first:pl-5">
                Customer
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Phone
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Product
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Created
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 last:pr-5">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => (
              <tr key={order.id} className="transition-colors hover:bg-slate-50/80">
                <td className="px-4 py-3 align-middle first:pl-5">
                  <div className="font-medium text-slate-900">
                    {order.first_name} {order.last_name}
                  </div>
                  <div className="text-xs text-slate-500">{order.email ?? "—"}</div>
                </td>
                <td className="px-4 py-3 align-middle text-slate-700">{order.phone}</td>
                <td className="px-4 py-3 align-middle">
                  <div className="text-slate-900">{order.product_name ?? "—"}</div>
                  <div className="text-xs text-slate-500">{order.product_sku ?? "—"}</div>
                </td>
                <td className="px-4 py-3 align-middle text-slate-600">
                  {order.created_at ? new Date(order.created_at).toLocaleString("ka-GE") : "—"}
                </td>
                <td className="px-4 py-3 align-middle last:pr-5">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-white shadow-sm transition hover:bg-blue-700"
                      aria-label="View order"
                    >
                      <Eye className="h-4 w-4" aria-hidden />
                    </Link>
                    <form action={deleteOrderFormAction.bind(null, order.id)} className="inline">
                      <button
                        type="submit"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-red-500 text-white shadow-sm transition hover:bg-red-600"
                        aria-label="Delete order"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-500">
                  No orders found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {total > 0 && totalPages > 1 ? (
        <nav
          aria-label="Orders pagination"
          className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex flex-wrap items-center gap-1">
            {pages.map((p) =>
              p === currentPage ? (
                <span
                  key={p}
                  className="inline-flex h-9 w-9 items-center justify-center border border-neutral-500 bg-neutral-500 text-sm font-medium text-white"
                  aria-current="page"
                >
                  {p}
                </span>
              ) : (
                <Link
                  key={p}
                  href={href(p)}
                  className="inline-flex h-9 w-9 items-center justify-center border border-gray-200 bg-white text-sm font-medium text-blue-600 hover:bg-gray-50"
                >
                  {p}
                </Link>
              ),
            )}
            {currentPage < totalPages ? (
              <Link
                href={href(currentPage + 1)}
                className="inline-flex h-9 w-9 items-center justify-center border border-gray-200 bg-white text-blue-600 hover:bg-gray-50"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            ) : null}
            {currentPage < totalPages ? (
              <Link
                href={href(totalPages)}
                className="inline-flex h-9 w-9 items-center justify-center border border-gray-200 bg-white text-blue-600 hover:bg-gray-50"
                aria-label="Last page"
              >
                <ChevronsRight className="h-4 w-4" aria-hidden />
              </Link>
            ) : null}
          </div>
          <p className="text-sm text-gray-600 tabular-nums sm:text-right">
            <span className="text-gray-700">
              {from} დან {to} მდე, სულ {total}
            </span>{" "}
            <span className="text-gray-500">({totalPages} გვერდი)</span>
          </p>
        </nav>
      ) : null}
    </div>
  );
}
