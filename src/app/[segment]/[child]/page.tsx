import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { ProductsCatalogPage } from "@/app/products/_components/products-catalog-page";
import { getStorefrontChildCategoryBySlugs } from "@/lib/supabase/categories";
import {
  emptyProductsListing,
  getStorefrontProductsListingByCategoryNumericId,
  parseListingSearchParams,
} from "@/lib/supabase/products-listing";
import { childCategoryHref, isReservedRootSlug } from "@/lib/utils/category-href";
import type { ProductsListingLinkState } from "@/lib/utils/products-listing-url";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  params: Promise<{ segment: string; child: string }>;
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
  const { segment, child } = await params;
  if (isReservedRootSlug(segment)) return {};
  const row = await getStorefrontChildCategoryBySlugs(segment, child);
  if (!row) return { title: "კატეგორია" };
  const descriptionText = descriptionToText(row.child.description);
  return {
    title: `${row.child.name} | Baba.ge`,
    description: descriptionText,
    alternates: {
      canonical: childCategoryHref(segment, child),
    },
  };
}

export default async function ChildCategoryPage({ params, searchParams }: PageProps) {
  const { segment, child } = await params;
  const sp = await searchParams;

  if (isReservedRootSlug(segment)) {
    notFound();
  }

  const row = await getStorefrontChildCategoryBySlugs(segment, child);
  if (!row) {
    notFound();
  }

  const { child: childCat } = row;

  const { q, sort, per, page } = parseListingSearchParams(sp);

  const numericCategoryId = Number(childCat.category_id);
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
    segmentChild: child,
  };

  const descText = descriptionToText(childCat.description);

  return (
    <ProductsCatalogPage
      title={childCat.name}
      listing={listing}
      linkState={linkState}
      categorySlug={segment}
      childSlug={child}
      sidebarLinkMode="root"
      description={descText ?? null}
    />
  );
}
