export type ProductsListingLinkState = {
  q?: string;
  category?: string;
  /** With `category` (child slug), builds `/products/{parent}/{child}`. */
  categoryParent?: string;
  sort: string;
  per: string;
  page: number;
};

const DEFAULT_SORT = "default";
const DEFAULT_PER = "25";

export function buildProductsListingHref(overrides: Partial<ProductsListingLinkState> & {
  q?: string;
  category?: string;
  categoryParent?: string;
  sort?: string;
  per?: string;
  page?: number;
}): string {
  const p = new URLSearchParams();
  if (overrides.q) p.set("q", overrides.q);
  const sort = overrides.sort ?? DEFAULT_SORT;
  if (sort !== DEFAULT_SORT) p.set("sort", sort);
  const per = overrides.per ?? DEFAULT_PER;
  if (per !== DEFAULT_PER) p.set("per", per);
  const page = overrides.page ?? 1;
  if (page !== 1) p.set("page", String(page));
  const qs = p.toString();

  const parent = overrides.categoryParent?.trim();
  const cat = overrides.category?.trim();

  if (parent && cat) {
    const base = `/products/${encodeURIComponent(parent)}/${encodeURIComponent(cat)}`;
    return qs ? `${base}?${qs}` : base;
  }
  if (cat) {
    const base = `/products/${encodeURIComponent(cat)}`;
    return qs ? `${base}?${qs}` : base;
  }

  return qs ? `/products?${qs}` : "/products";
}

export function mergeListingParams(
  base: ProductsListingLinkState,
  patch: Partial<
    Pick<ProductsListingLinkState, "sort" | "per" | "page" | "category" | "categoryParent" | "q">
  >
): ProductsListingLinkState {
  return {
    q: patch.q ?? base.q,
    category: patch.category ?? base.category,
    categoryParent: patch.categoryParent ?? base.categoryParent,
    sort: patch.sort ?? base.sort,
    per: patch.per ?? base.per,
    page: patch.page ?? base.page,
  };
}

export function toHref(state: ProductsListingLinkState): string {
  return buildProductsListingHref({
    q: state.q,
    category: state.category,
    categoryParent: state.categoryParent,
    sort: state.sort,
    per: state.per,
    page: state.page,
  });
}
