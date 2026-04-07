import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductsCatalogLayout } from "@/app/products/_components/products-catalog-layout";
import {
  getCategoryBySlug,
  isChildCategoryUnderParent,
} from "@/lib/supabase/cms-queries";
import {
  getProductsListing,
  getProductsPriceBoundsForListing,
  parseListingSearchParams,
} from "@/lib/supabase/products-listing";
import type { ProductsListingLinkState } from "@/lib/utils/products-listing-url";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  params: Promise<{ slug: string; childSlug: string }>;
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { childSlug } = await params;
  const category = await getCategoryBySlug(childSlug);
  const label = category?.name ?? childSlug;
  return {
    title: `${label} | პროდუქტები | Baba.ge`,
    description: `Baba.ge — ${label}. ონლაინ კატალოგი.`,
    robots: { index: true, follow: true },
  };
}

export default async function ProductsNestedCategoryPage({ params, searchParams }: PageProps) {
  const { slug: parentSlug, childSlug } = await params;

  const validPair = await isChildCategoryUnderParent(parentSlug, childSlug);
  if (!validPair) notFound();

  const sp = await searchParams;
  const { q, sort, per, page, minPrice, maxPrice } = parseListingSearchParams(sp);

  let priceBounds = { min: 0, max: 0 };
  try {
    priceBounds = await getProductsPriceBoundsForListing({ categorySlug: childSlug, q });
  } catch {
    /* ignore */
  }

  const listing = await getProductsListing({
    q,
    categorySlug: childSlug,
    sort,
    page,
    perPage: per,
    minPrice,
    maxPrice,
  });

  const child = await getCategoryBySlug(childSlug);
  const title = child?.name ?? childSlug;

  const linkState: ProductsListingLinkState = {
    q,
    category: childSlug,
    categoryParent: parentSlug,
    sort,
    per: String(listing.perPage),
    page: listing.page,
    minPrice,
    maxPrice,
  };

  const totalPages = Math.max(1, Math.ceil(listing.total / listing.perPage));

  return (
    <ProductsCatalogLayout
      title={title}
      listing={listing}
      linkState={linkState}
      priceBounds={priceBounds}
      totalPages={totalPages}
      categorySlug={parentSlug}
      childSlug={childSlug}
    />
  );
}
