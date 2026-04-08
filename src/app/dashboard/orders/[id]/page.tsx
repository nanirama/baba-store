import Link from "next/link";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";

import { deleteOrderFormAction } from "@/actions/orders";
import { requireRole } from "@/lib/auth/helpers";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { getOrderById } from "@/lib/supabase/cms-queries";

export const dynamic = "force-dynamic";

export default async function OrderViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("user");
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Order Details"
        description="View submitted order details."
        backHref="/dashboard/orders"
        backLabel="Back to Orders"
      />

      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">First name</dt>
            <dd className="mt-1 text-sm text-slate-900">{order.first_name}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last name</dt>
            <dd className="mt-1 text-sm text-slate-900">{order.last_name}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</dt>
            <dd className="mt-1 text-sm text-slate-900">{order.phone}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</dt>
            <dd className="mt-1 text-sm text-slate-900">{order.email ?? "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Address</dt>
            <dd className="mt-1 text-sm text-slate-900">{order.address}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Product</dt>
            <dd className="mt-1 text-sm text-slate-900">{order.product_name ?? "—"}</dd>
            <dd className="text-xs text-slate-500">SKU: {order.product_sku ?? "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created</dt>
            <dd className="mt-1 text-sm text-slate-900">
              {order.created_at ? new Date(order.created_at).toLocaleString("ka-GE") : "—"}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex items-center gap-2">
          <form action={deleteOrderFormAction.bind(null, order.id)}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Delete
            </button>
          </form>
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back
          </Link>
        </div>
      </div>
    </div>
  );
}
