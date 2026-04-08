import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { createAdminClient } from "@/lib/supabase/server";
import type { CategoryRecord, OrderRecord, ProductRecord } from "@/types/cms";

/** PostgREST default `max-rows` is 1000; fetch in pages to load the full table. */
const PRODUCTS_PAGE_SIZE = 1000;
const HOME_PRODUCTS_WINDOW = 240;
const HOME_BUCKET_LIMIT = 24;

export async function getProducts(): Promise<ProductRecord[]> {
  const supabase = createAdminClient();
  const all: ProductRecord[] = [];
  let offset = 0;

  for (;;) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + PRODUCTS_PAGE_SIZE - 1);

    if (error) throw new Error(error.message);
    const batch = (data ?? []) as ProductRecord[];
    all.push(...batch);
    if (batch.length < PRODUCTS_PAGE_SIZE) break;
    offset += PRODUCTS_PAGE_SIZE;
  }

  return all;
}

/**
 * Homepage-only fast path: fetch a bounded recent window instead of full table scan.
 * Keeps request latency predictable even when product table grows large.
 */
export async function getProductsForHome(limit = HOME_PRODUCTS_WINDOW): Promise<ProductRecord[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");
  cacheTag("products-home");

  const supabase = createAdminClient();
  const safeLimit = Math.max(1, Math.min(limit, HOME_PRODUCTS_WINDOW));
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(safeLimit);

  if (error) throw new Error(error.message);
  return (data ?? []) as ProductRecord[];
}

/**
 * Homepage buckets queried directly by flags.
 * Avoids empty sections when the recent-window strategy doesn't contain flagged items.
 */
export async function getHomeProductBuckets(limit = HOME_BUCKET_LIMIT): Promise<{
  promotionProducts: ProductRecord[];
  bestSellerProducts: ProductRecord[];
  discountProducts: ProductRecord[];
}> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");
  cacheTag("products-home");

  const supabase = createAdminClient();
  const safeLimit = Math.max(1, Math.min(limit, 60));

  const base = () =>
    supabase
      .from("products")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(safeLimit);

  const [promotionsRes, bestsellersRes, discountsRes] = await Promise.all([
    base().eq("promotions", true),
    base().eq("bestsellers", true),
    base().eq("discounts", true),
  ]);

  if (promotionsRes.error) throw new Error(promotionsRes.error.message);
  if (bestsellersRes.error) throw new Error(bestsellersRes.error.message);
  if (discountsRes.error) throw new Error(discountsRes.error.message);

  return {
    promotionProducts: (promotionsRes.data ?? []) as ProductRecord[],
    bestSellerProducts: (bestsellersRes.data ?? []) as ProductRecord[],
    discountProducts: (discountsRes.data ?? []) as ProductRecord[],
  };
}

/** Slugs for `/products/[slug]` — indexed, lightweight, paginated (same row cap as `getProducts`). */
export async function getProductSitemapEntries(): Promise<{ slug: string; updated_at: string }[]> {
  const supabase = createAdminClient();
  const all: { slug: string; updated_at: string }[] = [];
  let offset = 0;

  for (;;) {
    const { data, error } = await supabase
      .from("products")
      .select("slug, updated_at")
      .eq("status", "active")
      .not("slug", "is", null)
      .neq("slug", "")
      .order("id", { ascending: true })
      .range(offset, offset + PRODUCTS_PAGE_SIZE - 1);

    if (error) throw new Error(error.message);
    const batch = (data ?? []) as { slug: string; updated_at: string }[];
    all.push(...batch);
    if (batch.length < PRODUCTS_PAGE_SIZE) break;
    offset += PRODUCTS_PAGE_SIZE;
  }

  return all;
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
  categoryId: string | number | null;
  subcategoryId: string | number | null;
  limit?: number;
}): Promise<ProductRecord[]> {
  const limit = args.limit ?? 20;
  const ids = [args.categoryId, args.subcategoryId].filter((x): x is string | number => {
    if (x === null || x === undefined || x === "") return false;
    if (typeof x === "number") return x > 0;
    return true;
  });
  if (ids.length === 0) return [];

  const supabase = createAdminClient();
  const orParts = ids.flatMap((id) => [`category_id.eq.${id}`, `parent_category_id.eq.${id}`]);

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

export async function getOrders(): Promise<OrderRecord[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as OrderRecord[];
}

export async function getOrdersPage(args: {
  page: number;
  perPage: number;
}): Promise<{ items: OrderRecord[]; total: number }> {
  const page = Math.max(1, Math.floor(args.page || 1));
  const perPage = Math.max(1, Math.min(200, Math.floor(args.perPage || 25)));
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const supabase = createAdminClient();
  const { data, error, count } = await supabase
    .from("orders")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);
  if (error) throw new Error(error.message);

  return {
    items: (data ?? []) as OrderRecord[],
    total: count ?? 0,
  };
}

export async function getOrderById(id: string): Promise<OrderRecord | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as OrderRecord | null;
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
