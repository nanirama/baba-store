"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import type { ProductRecord } from "@/types/cms";
import { deleteProductFormAction } from "@/actions/products";

type ProductsGridTableProps = {
  products: ProductRecord[];
  emptySearch?: boolean;
};

function productThumbnailUrl(p: ProductRecord): string | null {
  return p.main_image ?? p.image1 ?? p.image2 ?? p.image3 ?? null;
}

function statusBadgeStyles(status: string): string {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15";
    case "draft":
      return "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/15";
    case "archived":
      return "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/15";
    default:
      return "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/10";
  }
}

/** TailAdmin-style data table: soft header, row hover, status pills, icon actions. */
export function ProductsGridTable({ products, emptySearch }: ProductsGridTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/90">
            <th className="w-[84px] px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 first:pl-5">
              Image
            </th>
            <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              Product
            </th>
            <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              SKU
            </th>
            <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              Price
            </th>
            <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              Status
            </th>
            <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 last:pr-5">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.map((product) => {
            const thumb = productThumbnailUrl(product);
            const editHref = `/dashboard/products/edit/${product.id}`;
            return (
              <tr key={product.id} className="group transition-colors hover:bg-slate-50/80">
                <td className="px-4 py-3 align-middle first:pl-5">
                  <Link href={editHref} className="block" aria-label={`Edit ${product.name}`}>
                    <div className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-lg border border-slate-200/80 bg-slate-100 shadow-sm transition group-hover:border-slate-300">
                      {thumb ? (
                        <Image
                          src={thumb}
                          alt=""
                          width={52}
                          height={52}
                          sizes="52px"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-slate-400">
                          —
                        </div>
                      )}
                    </div>
                  </Link>
                </td>
                <td className="max-w-[220px] px-4 py-3 align-middle">
                  <Link
                    href={editHref}
                    className="font-medium text-slate-900 transition hover:text-[#ff5100]"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-0.5 truncate text-xs text-slate-500" title={product.slug}>
                    {product.slug}
                  </p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-middle font-mono text-xs text-slate-600">
                  {product.sku ?? "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-middle font-semibold tabular-nums text-slate-900">
                  ₾{product.price}
                </td>
                <td className="px-4 py-3 align-middle">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadgeStyles(product.status)}`}
                  >
                    {product.status}
                  </span>
                </td>
                <td className="px-4 py-3 align-middle last:pr-5">
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    <Link
                      href={editHref}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-[#ff5100]"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                      Edit
                    </Link>
                    <Link
                      href={`/products/${product.slug}`}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      View
                    </Link>
                    <form action={deleteProductFormAction.bind(null, product.id)} className="inline">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            );
          })}
          {products.length === 0 && emptySearch && (
            <tr>
              <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">
                No products match your search. Try a different term.
              </td>
            </tr>
          )}
          {products.length === 0 && !emptySearch && (
            <tr>
              <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">
                No products found. Use{" "}
                <Link
                  href="/dashboard/products/new"
                  className="font-medium text-[#ff5100] underline underline-offset-2"
                >
                  Add Product
                </Link>{" "}
                to create your first product.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
