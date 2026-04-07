import "server-only";

import { unstable_noStore as noStore } from "next/cache";

import { createAdminClient } from "@/lib/supabase/server";
import type { ProductRecord } from "@/types/cms";

export type ProductSortKey =
  | "default"
  | "name_asc"
  | "name_desc"
  | "price_asc"
  | "price_desc"
  | "rating_desc"
  | "rating_asc"
  | "model_asc"
  | "model_desc";

const SORT_KEYS = new Set<string>([
  "default",
  "name_asc",
  "name_desc",
  "price_asc",
  "price_desc",
  "rating_desc",
  "rating_asc",
  "model_asc",
  "model_desc",
]);

const PER_ALLOWED = new Set<number>([25, 50, 100, 200, 500]);

export function parseProductSort(raw: string | undefined): ProductSortKey {
  if (raw && SORT_KEYS.has(raw)) return raw as ProductSortKey;
  return "default";
}

export function parsePerPage(raw: string | undefined): 25 | 50 | 100 | 200 | 500 {
  const n = Number(raw);
  if (PER_ALLOWED.has(n)) return n as 25 | 50 | 100 | 200 | 500;
  return 25;
}

export function parsePageIndex(raw: string | undefined): number {
  const n = parseInt(raw ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

export function sanitizeSearchQuery(q: string | undefined): string | undefined {
  if (q == null) return undefined;
  const t = String(q).trim().slice(0, 120);
  return t.length > 0 ? t : undefined;
}

/** Next.js `searchParams` raw shape (string or string[]). */
export type ProductsListingRawSearchParams = Record<string, string | string[] | undefined>;

export function firstSearchParam(value: string | string[] | undefined): string | undefined {
  if (value == null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

/** Shared `q` / `sort` / `per` / `page` / `category` parsing for all catalog routes. */
function parsePriceParam(raw: string | undefined): number | undefined {
  if (raw == null || raw === "") return undefined;
  const n = Math.round(Number(raw));
  if (!Number.isFinite(n) || n < 0) return undefined;
  if (n > 999_999_999) return 999_999_999;
  return n;
}

/** Parses `min_price` / `max_price` query params (GEL, integers). */
export function parseListingSearchParams(sp: ProductsListingRawSearchParams) {
  let minPrice = parsePriceParam(firstSearchParam(sp.min_price));
  let maxPrice = parsePriceParam(firstSearchParam(sp.max_price));
  if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
    const t = minPrice;
    minPrice = maxPrice;
    maxPrice = t;
  }
  return {
    q: sanitizeSearchQuery(firstSearchParam(sp.q)),
    sort: parseProductSort(firstSearchParam(sp.sort)),
    per: parsePerPage(firstSearchParam(sp.per)),
    page: parsePageIndex(firstSearchParam(sp.page)),
    /** `/products?category=` — pass to `getProductsListing` and `linkState.category`. */
    category: firstSearchParam(sp.category),
    minPrice,
    maxPrice,
  };
}

/**
 * `/products?category=` filter: matches `products.category_id` / `parent_category_id` (and legacy uuid paths where present).
 * Bulk import and parent segment pages use numeric `categories.category_id` on `products.category_id` instead;
 * see `getStorefrontProductsListingByCategoryNumericId`.
 */
type CategoryFilterMode = { kind: "none" } | { kind: "ids"; ids: string[] };

/**
 * Resolves slug → numeric ids for `products.category_id` / `products.parent_category_id`.
 * Must use `categories.category_id` (OpenCart-style int), not `categories.id` (uuid) — the product
 * columns are integers; filtering with uuids makes PostgREST fail (often `message: ""`).
 */
async function resolveCategoryFilter(categorySlug: string | undefined): Promise<CategoryFilterMode> {
  if (!categorySlug?.trim()) return { kind: "none" };

  const slug = categorySlug.trim().slice(0, 160);
  const supabase = createAdminClient();

  const { data: parent } = await supabase
    .from("categories")
    .select("category_id")
    .eq("slug", slug)
    .eq("parent_id", 0)
    .maybeSingle();

  const parentNid = parent?.category_id != null ? Number(parent.category_id) : NaN;
  if (Number.isFinite(parentNid) && parentNid > 0) {
    const { data: children } = await supabase
      .from("categories")
      .select("category_id")
      .eq("parent_id", parentNid);

    const numericIds = new Set<number>();
    numericIds.add(parentNid);
    for (const c of children ?? []) {
      const n = c?.category_id != null ? Number(c.category_id) : NaN;
      if (Number.isFinite(n) && n > 0) numericIds.add(n);
    }
    const ids = [...numericIds].map((n) => String(n));
    return { kind: "ids", ids };
  }

  const { data: child } = await supabase
    .from("categories")
    .select("category_id")
    .eq("slug", slug)
    .gt("parent_id", 0)
    .maybeSingle();

  const childNid = child?.category_id != null ? Number(child.category_id) : NaN;
  if (Number.isFinite(childNid) && childNid > 0) {
    return { kind: "ids", ids: [String(childNid)] };
  }

  /** Unknown category slug: show full catalogue (no filter). */
  return { kind: "none" };
}

function sanitizeIlikeTerm(term: string): string {
  return term.replace(/[,%()[\]]/g, " ").replace(/[%_]/g, "").trim().slice(0, 120);
}

function applyFiltersToQuery(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  category: CategoryFilterMode,
  ilikeTerm: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  let q = query;

  if (ilikeTerm.length > 0) {
    const pattern = `%${ilikeTerm}%`;
    q = q.or(`name.ilike.${pattern},sku.ilike.${pattern},model.ilike.${pattern}`);
  }

  if (category.kind === "ids" && category.ids.length > 0) {
    const orParts = category.ids.flatMap((id) => [
      `category_id.eq.${id}`,
      `parent_category_id.eq.${id}`,
    ]);
    q = q.or(orParts.join(","));
  }

  return q;
}

function applyPriceRangeToQuery(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  minPrice: number | undefined,
  maxPrice: number | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  let q = query;
  if (minPrice != null) q = q.gte("price", minPrice);
  if (maxPrice != null) q = q.lte("price", maxPrice);
  return q;
}

/**
 * Min/max `price` for the same scope as `getProductsListing` (no price filter), for slider bounds.
 */
export async function getProductsPriceBoundsForListing(args: {
  categorySlug?: string;
  q?: string;
}): Promise<{ min: number; max: number }> {
  noStore();
  const supabase = createAdminClient();
  const category = await resolveCategoryFilter(args.categorySlug);
  const termRaw = sanitizeSearchQuery(args.q);
  const ilikeTerm = termRaw ? sanitizeIlikeTerm(termRaw) : "";

  const base = () => applyFiltersToQuery(supabase.from("products").select("price"), category, ilikeTerm);

  const [{ data: minRow, error: errMin }, { data: maxRow, error: errMax }] = await Promise.all([
    base().order("price", { ascending: true }).limit(1).maybeSingle(),
    base().order("price", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (errMin) throw new Error(errMin.message);
  if (errMax) throw new Error(errMax.message);

  const min = minRow?.price != null ? Number(minRow.price) : 0;
  const max = maxRow?.price != null ? Number(maxRow.price) : 0;
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 0 };
  return min <= max ? { min, max } : { min: max, max: min };
}

/**
 * Min/max `price` for storefront category listing (active products), same scope as
 * `getStorefrontProductsListingByCategoryNumericId` without price filter.
 */
export async function getStorefrontProductsPriceBounds(args: {
  categoryId: number;
  q?: string;
}): Promise<{ min: number; max: number }> {
  noStore();
  const categoryId = Number(args.categoryId);
  if (!Number.isFinite(categoryId) || categoryId <= 0) return { min: 0, max: 0 };

  const supabase = createAdminClient();
  const termRaw = sanitizeSearchQuery(args.q);
  const ilikeTerm = termRaw ? sanitizeIlikeTerm(termRaw) : "";

  function base() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase
      .from("products")
      .select("price")
      .or(`category_id.eq.${categoryId},parent_category_id.eq.${categoryId}`)
      .eq("status", "active");
    if (ilikeTerm.length > 0) {
      const pattern = `%${ilikeTerm}%`;
      q = q.or(`name.ilike.${pattern},sku.ilike.${pattern},model.ilike.${pattern}`);
    }
    return q;
  }

  const [{ data: minRow, error: errMin }, { data: maxRow, error: errMax }] = await Promise.all([
    base().order("price", { ascending: true }).limit(1).maybeSingle(),
    base().order("price", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (errMin) throw new Error(errMin.message);
  if (errMax) throw new Error(errMax.message);

  const min = minRow?.price != null ? Number(minRow.price) : 0;
  const max = maxRow?.price != null ? Number(maxRow.price) : 0;
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 0 };
  return min <= max ? { min, max } : { min: max, max: min };
}

export type ProductsListingResult = {
  products: ProductRecord[];
  total: number;
  page: number;
  perPage: 25 | 50 | 100 | 200 | 500;
};

export function emptyProductsListing(perPage: 25 | 50 | 100 | 200 | 500): ProductsListingResult {
  return { products: [], total: 0, page: 1, perPage };
}

export async function getProductsListing(args: {
  q?: string;
  categorySlug?: string;
  sort: ProductSortKey;
  page: number;
  perPage: 25 | 50 | 100 | 200 | 500;
  minPrice?: number;
  maxPrice?: number;
}): Promise<ProductsListingResult> {
  noStore();
  const supabase = createAdminClient();
  const category = await resolveCategoryFilter(args.categorySlug);

  const termRaw = sanitizeSearchQuery(args.q);
  const ilikeTerm = termRaw ? sanitizeIlikeTerm(termRaw) : "";

  const countQuery = applyPriceRangeToQuery(
    applyFiltersToQuery(
      supabase.from("products").select("id", { count: "exact", head: true }),
      category,
      ilikeTerm
    ),
    args.minPrice,
    args.maxPrice
  );

  const { count: totalCount, error: countError } = await countQuery;

  if (countError) {
    const e = countError as { message?: string; details?: string; hint?: string; code?: string };
    const parts = [e.message, e.details, e.hint, e.code].filter((x): x is string => Boolean(x && String(x).trim()));
    throw new Error(parts.length ? parts.join(" — ") : `products count query failed: ${JSON.stringify(countError)}`);
  }

  const total = totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / args.perPage));
  const page = Math.min(Math.max(1, args.page), totalPages);

  let dataQuery = applyPriceRangeToQuery(
    applyFiltersToQuery(supabase.from("products").select("*"), category, ilikeTerm),
    args.minPrice,
    args.maxPrice
  );

  /* Secondary `id` order guarantees stable pages (no gaps/duplicates when sort keys tie or are null). */
  switch (args.sort) {
    case "name_asc":
      dataQuery = dataQuery.order("name", { ascending: true }).order("id", { ascending: true });
      break;
    case "name_desc":
      dataQuery = dataQuery.order("name", { ascending: false }).order("id", { ascending: true });
      break;
    case "price_asc":
      dataQuery = dataQuery.order("price", { ascending: true }).order("id", { ascending: true });
      break;
    case "price_desc":
      dataQuery = dataQuery.order("price", { ascending: false }).order("id", { ascending: true });
      break;
    case "model_asc":
      dataQuery = dataQuery
        .order("model", { ascending: true })
        .order("name", { ascending: true })
        .order("id", { ascending: true });
      break;
    case "model_desc":
      dataQuery = dataQuery
        .order("model", { ascending: false })
        .order("name", { ascending: true })
        .order("id", { ascending: true });
      break;
    case "rating_asc":
      dataQuery = dataQuery.order("created_at", { ascending: true }).order("id", { ascending: true });
      break;
    case "rating_desc":
      dataQuery = dataQuery.order("created_at", { ascending: false }).order("id", { ascending: true });
      break;
    default:
      dataQuery = dataQuery.order("created_at", { ascending: false }).order("id", { ascending: true });
  }

  const from = (page - 1) * args.perPage;
  const to = from + args.perPage - 1;
  dataQuery = dataQuery.range(from, to);

  const { data, error } = await dataQuery;

  if (error) {
    throw new Error(error.message || `products listing query failed: ${JSON.stringify(error)}`);
  }

  return {
    products: (data ?? []) as ProductRecord[],
    total,
    page,
    perPage: args.perPage,
  };
}

/**
 * Storefront parent category page (`/{parentSlug}`): matches numeric `categories.category_id` on
 * `products.category_id` OR `products.parent_category_id` (subcategory rows store leaf in `category_id`).
 */
export async function getStorefrontProductsListingByCategoryNumericId(args: {
  categoryId: number;
  q?: string;
  sort: ProductSortKey;
  page: number;
  perPage: 25 | 50 | 100 | 200 | 500;
  minPrice?: number;
  maxPrice?: number;
}): Promise<ProductsListingResult> {
  noStore();
  const categoryId = Number(args.categoryId);
  if (!Number.isFinite(categoryId) || categoryId <= 0) {
    return { products: [], total: 0, page: 1, perPage: args.perPage };
  }

  const supabase = createAdminClient();
  const termRaw = sanitizeSearchQuery(args.q);
  const ilikeTerm = termRaw ? sanitizeIlikeTerm(termRaw) : "";

  function applyListingFilters(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    let q = query
      .or(`category_id.eq.${categoryId},parent_category_id.eq.${categoryId}`)
      .eq("status", "active");
    if (ilikeTerm.length > 0) {
      const pattern = `%${ilikeTerm}%`;
      q = q.or(`name.ilike.${pattern},sku.ilike.${pattern},model.ilike.${pattern}`);
    }
    q = applyPriceRangeToQuery(q, args.minPrice, args.maxPrice);
    return q;
  }

  const countQuery = applyListingFilters(
    supabase.from("products").select("id", { count: "exact", head: true })
  );

  const { count: totalCount, error: countError } = await countQuery;

  if (countError) {
    const e = countError as { message?: string; details?: string; hint?: string; code?: string };
    const parts = [e.message, e.details, e.hint, e.code].filter((x): x is string => Boolean(x && String(x).trim()));
    throw new Error(parts.length ? parts.join(" — ") : `products count query failed: ${JSON.stringify(countError)}`);
  }

  const total = totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / args.perPage));
  const page = Math.min(Math.max(1, args.page), totalPages);

  let dataQuery = applyListingFilters(supabase.from("products").select("*"));

  switch (args.sort) {
    case "name_asc":
      dataQuery = dataQuery.order("name", { ascending: true }).order("id", { ascending: true });
      break;
    case "name_desc":
      dataQuery = dataQuery.order("name", { ascending: false }).order("id", { ascending: true });
      break;
    case "price_asc":
      dataQuery = dataQuery.order("price", { ascending: true }).order("id", { ascending: true });
      break;
    case "price_desc":
      dataQuery = dataQuery.order("price", { ascending: false }).order("id", { ascending: true });
      break;
    case "model_asc":
      dataQuery = dataQuery
        .order("model", { ascending: true })
        .order("name", { ascending: true })
        .order("id", { ascending: true });
      break;
    case "model_desc":
      dataQuery = dataQuery
        .order("model", { ascending: false })
        .order("name", { ascending: true })
        .order("id", { ascending: true });
      break;
    case "rating_asc":
      dataQuery = dataQuery.order("created_at", { ascending: true }).order("id", { ascending: true });
      break;
    case "rating_desc":
      dataQuery = dataQuery.order("created_at", { ascending: false }).order("id", { ascending: true });
      break;
    default:
      dataQuery = dataQuery.order("created_at", { ascending: false }).order("id", { ascending: true });
  }

  const from = (page - 1) * args.perPage;
  const to = from + args.perPage - 1;
  dataQuery = dataQuery.range(from, to);

  const { data, error } = await dataQuery;

  if (error) {
    throw new Error(error.message || `products listing query failed: ${JSON.stringify(error)}`);
  }

  return {
    products: (data ?? []) as ProductRecord[],
    total,
    page,
    perPage: args.perPage,
  };
}
