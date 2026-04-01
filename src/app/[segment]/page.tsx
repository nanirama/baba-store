import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { ProductsCatalogPage } from "@/app/products/_components/products-catalog-page";
import { getStorefrontParentCategoryBySlug } from "@/lib/supabase/categories";
import {
  emptyProductsListing,
  getStorefrontProductsListingByCategoryNumericId,
  parseListingSearchParams,
} from "@/lib/supabase/products-listing";
import { isReservedRootSlug, parentCategoryHref } from "@/lib/utils/category-href";
import type { ProductsListingLinkState } from "@/lib/utils/products-listing-url";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  params: Promise<{ segment: string }>;
  searchParams: Promise<SearchParams>;
};

function descriptionToText(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "text" in v) {
    const t = (v as { text?: unknown }).text;
    if (typeof t === "string") return t;
  }
  return undefined;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { segment } = await params;
  if (isReservedRootSlug(segment)) return {};
  const category = await getStorefrontParentCategoryBySlug(segment);
  if (!category) return { title: "კატეგორია" };
  const descriptionText = descriptionToText(category.description);
  return {
    title: `${category.name} | Baba.ge`,
    description: descriptionText,
    alternates: { canonical: parentCategoryHref(segment) },
  };
}

export default async function ParentCategoryPage({ params, searchParams }: PageProps) {
  const { segment } = await params;
  const sp = await searchParams;

  if (isReservedRootSlug(segment)) {
    notFound();
  }

  const category = await getStorefrontParentCategoryBySlug(segment);
  if (!category) {
    notFound();
  }

  const { q, sort, per, page } = parseListingSearchParams(sp);

  const numericCategoryId = Number(category.category_id);
  const listing =
    Number.isFinite(numericCategoryId) && numericCategoryId > 0
      ? await getStorefrontProductsListingByCategoryNumericId({
          categoryId: numericCategoryId,
          q,
          sort,
          page,
          perPage: per,
        })
      : emptyProductsListing(per);

  const linkState: ProductsListingLinkState = {
    q,
    sort,
    per: String(listing.perPage),
    page: listing.page,
    segmentBase: segment,
  };

  const descText = descriptionToText(category.description);

  return (
    <ProductsCatalogPage
      title={category.name}
      listing={listing}
      linkState={linkState}
      categorySlug={segment}
      sidebarLinkMode="root"
      description={descText ?? null}
    />
  );
}
