import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import type { CategoryRecord, ProductRecord } from "@/types/cms";

export async function getProducts(): Promise<ProductRecord[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as ProductRecord[];
}

export async function getProductById(id: string): Promise<ProductRecord | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as ProductRecord | null;
}

export async function getProductBySlug(slug: string): Promise<ProductRecord | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();

  if (error) throw new Error(error.message);
  return data as ProductRecord | null;
}

/** Same parent/sub category as the current product (excludes `excludeId`). */
export async function getSeeAlsoProducts(args: {
  excludeId: string;
  categoryId: string | null;
  subcategoryId: string | null;
  limit?: number;
}): Promise<ProductRecord[]> {
  const limit = args.limit ?? 20;
  const ids = [args.categoryId, args.subcategoryId].filter((x): x is string => Boolean(x));
  if (ids.length === 0) return [];

  const supabase = createAdminClient();
  const orParts = ids.flatMap((id) => [`category_id.eq.${id}`]);

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .neq("id", args.excludeId)
    .or(orParts.join(","))
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as ProductRecord[];
}

export async function getCategories(): Promise<CategoryRecord[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as CategoryRecord[];
}

export async function getCategoryById(id: string): Promise<CategoryRecord | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as CategoryRecord | null;
}

export async function getCategoryBySlug(slug: string): Promise<CategoryRecord | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as CategoryRecord | null;
}

/** True when `childSlug` is a direct child category of top-level `parentSlug`. */
export async function isChildCategoryUnderParent(
  parentSlug: string,
  childSlug: string
): Promise<boolean> {
  const supabase = createAdminClient();
  const { data: parent, error: pErr } = await supabase
    .from("categories")
    .select("category_id")
    .eq("slug", parentSlug.trim())
    .eq("parent_id", 0)
    .maybeSingle();

  if (pErr) throw new Error(pErr.message);
  if (parent?.category_id == null) return false;

  const { data: child, error: cErr } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", childSlug.trim())
    .eq("parent_id", parent.category_id)
    .maybeSingle();

  if (cErr) throw new Error(cErr.message);
  return !!child?.id;
}
