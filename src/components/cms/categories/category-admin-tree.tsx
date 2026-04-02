"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Minus, Plus, Edit2, Trash2 } from "lucide-react";
import type { CategoryRecord } from "@/types/cms";
import {
  buildCategoryTree,
  collectIdsWithChildren,
  type CategoryTreeNode,
} from "@/utils/category-tree";
import { deleteCategoryAction } from "@/actions/categories";
import { cn } from "@/lib/utils";

type CategoryAdminTreeProps = {
  categories: CategoryRecord[];
  productCounts?: Record<string, number>;
};

function isActiveStatus(status: CategoryRecord["status"]): boolean {
  return String(status ?? "").trim().toLowerCase() === "active";
}

function* walkTree(
  nodes: CategoryTreeNode[],
  depth: number,
  expanded: Set<string>
): Generator<{ node: CategoryTreeNode; depth: number }> {
  for (const node of nodes) {
    yield { node, depth };
    if (node.children.length > 0 && expanded.has(node.id)) {
      yield* walkTree(node.children, depth + 1, expanded);
    }
  }
}

export function CategoryAdminTree({ categories, productCounts = {} }: CategoryAdminTreeProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const activeCategories = useMemo(() => categories.filter((c) => isActiveStatus(c.status)), [categories]);
  const roots = useMemo(() => buildCategoryTree(activeCategories), [activeCategories]);

  const [expanded, setExpanded] = useState<Set<string>>(() =>
    collectIdsWithChildren(buildCategoryTree(categories.filter((c) => isActiveStatus(c.status))))
  );

  useEffect(() => {
    setExpanded(new Set(collectIdsWithChildren(roots)));
  }, [roots]);

  const rows = useMemo(() => Array.from(walkTree(roots, 0, expanded)), [roots, expanded]);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (categories.length === 0) {
    return (
      <p className="px-5 py-10 text-center text-sm text-slate-500">No categories found. Create one to get started.</p>
    );
  }

  if (activeCategories.length === 0) {
    return (
      <p className="px-5 py-10 text-center text-sm text-slate-500">
        No active categories. Only categories with status &quot;active&quot; are listed here.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/90">
            <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 first:pl-5">
              Category Name
            </th>
            <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
              Products
            </th>
            <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              Sort Order
            </th>
            <th className="w-[160px] px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 last:pr-5">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map(({ node, depth }) => {
            const hasChildren = node.children.length > 0;
            const isOpen = expanded.has(node.id);
            const isRoot = depth === 0;

            return (
              <tr key={node.id} className="transition-colors hover:bg-slate-50/80">
                <td className="px-4 py-3 align-middle first:pl-5">
                  <div
                    className="flex min-h-[2rem] w-full items-center gap-2"
                    style={{ paddingLeft: depth > 0 ? `${8 + (depth - 1) * 20}px` : undefined }}
                  >
                    {depth > 0 && (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                    )}
                    <span
                      className={cn(
                        "font-medium",
                        isRoot ? "text-slate-900" : "text-slate-600"
                      )}
                    >
                      {node.name}
                    </span>
                    {hasChildren && (
                      <button
                        type="button"
                        onClick={() => toggle(node.id)}
                        className="ml-auto inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:border-[#ff5100] hover:text-[#ff5100]"
                        aria-label={isOpen ? "Collapse" : "Expand"}
                        aria-expanded={isOpen}
                      >
                        {isOpen ? <Minus className="h-3.5 w-3.5" strokeWidth={2.5} /> : <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />}
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center align-middle">
                  <span className="inline-flex rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white">
                    {productCounts[node.id] ?? 0}
                  </span>
                </td>
                <td className="px-4 py-3 align-middle text-slate-500">{node.sort_order}</td>
                <td className="px-4 py-3 text-right align-middle last:pr-5">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/dashboard/categories/edit/${node.id}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-white shadow-sm transition hover:bg-blue-700"
                      aria-label="Edit category"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        startTransition(async () => {
                          const result = await deleteCategoryAction(node.id);
                          if (result.success) router.refresh();
                        });
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-red-500 text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50"
                      aria-label="Delete category"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
