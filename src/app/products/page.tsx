import type { Metadata } from "next";

import { ProductsCatalogPage } from "@/app/products/_components/products-catalog-page";
import {
  firstSearchParam,
  getProductsListing,
  parseListingSearchParams,
  sanitizeSearchQuery,
} from "@/lib/supabase/products-listing";
import type { ProductsListingLinkState } from "@/lib/utils/products-listing-url";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams;
  const q = sanitizeSearchQuery(firstSearchParam(sp.q));
  const title = q ? `ძებნა: ${q} | Baba.ge` : "ყველა პროდუქტი | Baba.ge";
  return {
    title,
    description:
      "Baba.ge პროდუქტების კატალოგი — ტექნიკა, ავეჯი და სხვა. ონლაინ შოპინგი საუკეთესო ფასად.",
    alternates: { canonical: "/products" },
    robots: { index: true, follow: true },
  };
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { q, sort, per, page, category } = parseListingSearchParams(sp);

  const listing = await getProductsListing({
    q,
    categorySlug: category,
    sort,
    page,
    perPage: per,
  });

  const linkState: ProductsListingLinkState = {
    q,
    category,
    sort,
    per: String(listing.perPage),
    page: listing.page,
  };

  return (
    <ProductsCatalogPage
      title="ყველა პროდუქტი"
      listing={listing}
      linkState={linkState}
      categorySlug={category}
    />
  );
}
