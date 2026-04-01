import type { Metadata } from "next";

import { ProductDetailView } from "@/app/products/_components/product-detail-view";
import { ProductsCatalogLayout } from "@/app/products/_components/products-catalog-layout";
import {
  getCategoryBySlug,
  getProductBySlug,
} from "@/lib/supabase/cms-queries";
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
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (product) {
    return {
      title: product.name,
      description: product.meta?.description ?? product.name,
    };
  }
  const category = await getCategoryBySlug(slug);
  const label = category?.name ?? slug;
  return {
    title: `${label} | პროდუქტები | Baba.ge`,
    description: `Baba.ge — ${label}. ონლაინ კატალოგი.`,
    robots: { index: true, follow: true },
  };
}

export default async function ProductsSlugPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (product) {
    return <ProductDetailView product={product} />;
  }

  const sp = await searchParams;
  const qRaw = firstString(sp.q);
  const q = sanitizeSearchQuery(qRaw);
  const sort = parseProductSort(firstString(sp.sort));
  const per = parsePerPage(firstString(sp.per));
  const pageReq = parsePageIndex(firstString(sp.page));

  const listing = await getProductsListing({
    q,
    categorySlug: slug,
    sort,
    page: pageReq,
    perPage: per,
  });

  const category = await getCategoryBySlug(slug);
  const title = category?.name ?? slug;

  const linkState: ProductsListingLinkState = {
    q,
    category: slug,
    sort,
    per: String(listing.perPage),
    page: listing.page,
  };

  const totalPages = Math.max(1, Math.ceil(listing.total / listing.perPage));

  return (
    <ProductsCatalogLayout
      title={title}
      listing={listing}
      linkState={linkState}
      totalPages={totalPages}
      categorySlug={slug}
    />
  );
}
