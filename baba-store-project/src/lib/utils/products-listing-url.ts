export type ProductsListingLinkState = {
  q?: string;
  category?: string;
  /** With `category` (child slug), builds `/products/{parent}/{child}`. */
  categoryParent?: string;
  /**
   * When set (storefront parent at `/{slug}`), sort/per/page/q links use `/{segmentBase}?…`
   * instead of `/products?…` or `/products/{slug}?…`.
   */
  segmentBase?: string;
  /** With `segmentBase`, storefront child URLs use `/{segmentBase}/{segmentChild}?…`. */
  segmentChild?: string;
  sort: string;
  per: string;
  page: number;
  /** GEL — URL `min_price` / `max_price`. */
  minPrice?: number;
  maxPrice?: number;
};

const DEFAULT_SORT = "default";
const DEFAULT_PER = "25";

export function buildProductsListingHref(overrides: Partial<ProductsListingLinkState> & {
  q?: string;
  category?: string;
  categoryParent?: string;
  segmentBase?: string;
  segmentChild?: string;
  sort?: string;
  per?: string;
  page?: number;
  minPrice?: number;
  maxPrice?: number;
}): string {
  const p = new URLSearchParams();
  if (overrides.q) p.set("q", overrides.q);
  const sort = overrides.sort ?? DEFAULT_SORT;
  if (sort !== DEFAULT_SORT) p.set("sort", sort);
  const per = overrides.per ?? DEFAULT_PER;
  if (per !== DEFAULT_PER) p.set("per", per);
  const page = overrides.page ?? 1;
  if (page !== 1) p.set("page", String(page));
  if (overrides.minPrice != null) p.set("min_price", String(overrides.minPrice));
  if (overrides.maxPrice != null) p.set("max_price", String(overrides.maxPrice));
  const qs = p.toString();

  const segmentBase = overrides.segmentBase?.trim();
  if (segmentBase) {
    const segmentChild = overrides.segmentChild?.trim();
    const base = segmentChild
      ? `/${encodeURIComponent(segmentBase)}/${encodeURIComponent(segmentChild)}`
      : `/${encodeURIComponent(segmentBase)}`;
    return qs ? `${base}?${qs}` : base;
  }

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
    Pick<
      ProductsListingLinkState,
      | "sort"
      | "per"
      | "page"
      | "category"
      | "categoryParent"
      | "segmentBase"
      | "segmentChild"
      | "q"
      | "minPrice"
      | "maxPrice"
    >
  >
): ProductsListingLinkState {
  return {
    q: patch.q ?? base.q,
    category: patch.category ?? base.category,
    categoryParent: patch.categoryParent ?? base.categoryParent,
    segmentBase: patch.segmentBase ?? base.segmentBase,
    segmentChild: patch.segmentChild ?? base.segmentChild,
    sort: patch.sort ?? base.sort,
    per: patch.per ?? base.per,
    page: patch.page ?? base.page,
    minPrice: "minPrice" in patch ? patch.minPrice : base.minPrice,
    maxPrice: "maxPrice" in patch ? patch.maxPrice : base.maxPrice,
  };
}

export function toHref(state: ProductsListingLinkState): string {
  return buildProductsListingHref({
    q: state.q,
    category: state.category,
    categoryParent: state.categoryParent,
    segmentBase: state.segmentBase,
    segmentChild: state.segmentChild,
    sort: state.sort,
    per: state.per,
    page: state.page,
    minPrice: state.minPrice,
    maxPrice: state.maxPrice,
  });
}
