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

/** `products.category_id` / `subcategory_id` reference `categories.id` (uuid), not `categories.category_id` (int). */
type CategoryFilterMode = { kind: "none" } | { kind: "ids"; ids: string[] };

async function resolveCategoryFilter(categorySlug: string | undefined): Promise<CategoryFilterMode> {
  if (!categorySlug?.trim()) return { kind: "none" };

  const slug = categorySlug.trim().slice(0, 160);
  const supabase = createAdminClient();

  const { data: parent } = await supabase
    .from("categories")
    .select("id, category_id")
    .eq("slug", slug)
    .eq("parent_id", 0)
    .maybeSingle();

  if (parent?.id != null && parent.category_id != null) {
    const { data: children } = await supabase
      .from("categories")
      .select("id")
      .eq("parent_id", parent.category_id);
    const ids = [parent.id, ...(children ?? []).map((c) => c.id).filter(Boolean)] as string[];
    return { kind: "ids", ids };
  }

  const { data: child } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .gt("parent_id", 0)
    .maybeSingle();

  if (child?.id != null) return { kind: "ids", ids: [child.id] };

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
    q = q.ilike("name", `%${ilikeTerm}%`);
  }

  if (category.kind === "ids" && category.ids.length > 0) {
    const orParts = category.ids.flatMap((id) => [`category_id.eq.${id}`, `subcategory_id.eq.${id}`]);
    q = q.or(orParts.join(","));
  }

  return q;
}

export type ProductsListingResult = {
  products: ProductRecord[];
  total: number;
  page: number;
  perPage: 25 | 50 | 100 | 200 | 500;
};

export async function getProductsListing(args: {
  q?: string;
  categorySlug?: string;
  sort: ProductSortKey;
  page: number;
  perPage: 25 | 50 | 100 | 200 | 500;
}): Promise<ProductsListingResult> {
  noStore();
  const supabase = createAdminClient();
  const category = await resolveCategoryFilter(args.categorySlug);

  const termRaw = sanitizeSearchQuery(args.q);
  const ilikeTerm = termRaw ? sanitizeIlikeTerm(termRaw) : "";

  const countQuery = applyFiltersToQuery(
    supabase.from("products").select("id", { count: "exact", head: true }),
    category,
    ilikeTerm
  );

  const { count: totalCount, error: countError } = await countQuery;

  if (countError) {
    throw new Error(countError.message || `products count query failed: ${JSON.stringify(countError)}`);
  }

  const total = totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / args.perPage));
  const page = Math.min(Math.max(1, args.page), totalPages);

  let dataQuery = applyFiltersToQuery(supabase.from("products").select("*"), category, ilikeTerm);

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
