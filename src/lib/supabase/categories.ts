import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { createAdminClient } from "@/lib/supabase/server";
import type { CatalogCategoryChild, CatalogCategoryParent } from "@/types/catalog-menu";
import type { CategoryRecord } from "@/types/cms";

export type { CatalogCategoryChild, CatalogCategoryParent } from "@/types/catalog-menu";

type CatalogRow = Pick<CategoryRecord, "id" | "name" | "slug" | "parent_id" | "category_id" | "sort_order">;

function sortCatalogRows(a: CatalogRow, b: CatalogRow): number {
  const o = (a.sort_order ?? 0) - (b.sort_order ?? 0);
  if (o !== 0) return o;
  return a.name.localeCompare(b.name);
}

/**
 * Top-level categories with nested children for storefront mega menu.
 * Parents: `parent_id = 0`. Children: `parent_id > 0`.
 */
export async function getCatalogMenuTree(): Promise<CatalogCategoryParent[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id, category_id, sort_order")
    .eq("status", "active")
    .neq("sort_order", 99);

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as CatalogRow[];

  const parents = rows.filter((r) => Number(r.parent_id) === 0).sort(sortCatalogRows);
  const childrenByParent = new Map<string, CatalogRow[]>();

  for (const row of rows) {
    if (Number(row.parent_id) > 0) {
      const list = childrenByParent.get(String(row.parent_id)) ?? [];
      list.push(row);
      childrenByParent.set(String(row.parent_id), list);
    }
  }

  for (const [pid, list] of childrenByParent) {
    list.sort(sortCatalogRows);
    childrenByParent.set(pid, list);
  }

  return parents.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    icon: null,
    children: (childrenByParent.get(String(p.category_id)) ?? []).map(
      (c): CatalogCategoryChild => ({ id: c.id, name: c.name, slug: c.slug })
    ),
  }));
}

/**
 * Top-level category by slug (storefront).
 */
export async function getStorefrontParentCategoryBySlug(
  slug: string
): Promise<CategoryRecord | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");
  cacheTag(`category-slug-${slug}`);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("parent_id", 0)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as CategoryRecord | null;
}

/**
 * Child category where `child.slug` belongs to parent with `parent_slug`.
 */
export async function getStorefrontChildCategoryBySlugs(
  parentSlug: string,
  childSlug: string
): Promise<{ child: CategoryRecord; parent: CategoryRecord } | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");
  cacheTag(`category-slug-${parentSlug}`);
  cacheTag(`category-slug-${childSlug}`);

  const supabase = createAdminClient();

  const { data: parentRow, error: parentErr } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", parentSlug)
    .eq("parent_id", 0)
    .maybeSingle();

  if (parentErr) throw new Error(parentErr.message);
  if (!parentRow) return null;

  const parent = parentRow as CategoryRecord;

  const { data: childRow, error: childErr } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", childSlug)
    .eq("parent_id", parent.category_id)
    .maybeSingle();

  if (childErr) throw new Error(childErr.message);
  if (!childRow) return null;

  return { child: childRow as CategoryRecord, parent };
}
