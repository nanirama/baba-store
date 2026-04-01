import type { Metadata } from "next";

import { ProductsCatalogLayout } from "@/app/products/_components/products-catalog-layout";
import {
  getProductsListing,
  parsePageIndex,
  parsePerPage,
  parseProductSort,
  sanitizeSearchQuery,
} from "@/lib/supabase/products-listing";
import type { ProductsListingLinkState } from "@/lib/utils/products-listing-url";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function firstString(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams;
  const q = sanitizeSearchQuery(firstString(sp.q));
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
  const qRaw = firstString(sp.q);
  const q = sanitizeSearchQuery(qRaw);
  const category = firstString(sp.category);
  const sort = parseProductSort(firstString(sp.sort));
  const per = parsePerPage(firstString(sp.per));
  const pageReq = parsePageIndex(firstString(sp.page));

  const listing = await getProductsListing({
    q,
    categorySlug: category,
    sort,
    page: pageReq,
    perPage: per,
  });

  const linkState: ProductsListingLinkState = {
    q,
    category,
    sort,
    per: String(listing.perPage),
    page: listing.page,
  };

  const totalPages = Math.max(1, Math.ceil(listing.total / listing.perPage));

  return (
    <ProductsCatalogLayout
      title="ყველა პროდუქტი"
      listing={listing}
      linkState={linkState}
      totalPages={totalPages}
      categorySlug={category}
    />
  );
}
