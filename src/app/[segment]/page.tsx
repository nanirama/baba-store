import { notFound } from "next/navigation";
import type { Metadata } from "next";

import Seo, { seoGenerateMetadata } from "@/components/Common/Seo";
import { ProductsCatalogPage } from "@/app/products/_components/products-catalog-page";
import { getStorefrontParentCategoryBySlug } from "@/lib/supabase/categories";
import {
  emptyProductsListing,
  getStorefrontProductsListingByCategoryNumericId,
  getStorefrontProductsPriceBounds,
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
  const metaTitle = category.meta_title?.trim() || undefined;
  const metaDescription = category.meta_description?.trim() || undefined;
  const metaKeywords = category.meta_keywords?.trim() || undefined;

  const title = metaTitle ?? `${category.name} | Baba.ge`;
  const description = metaDescription ?? descriptionText ?? category.name;
  return seoGenerateMetadata({
    title,
    description,
    url: parentCategoryHref(segment),
    imageUrl: category.icon ?? undefined,
    keywords: metaKeywords,
  });
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

  const { q, sort, per, page, minPrice, maxPrice } = parseListingSearchParams(sp);

  const numericCategoryId = Number(category.category_id);

  let priceBounds = { min: 0, max: 0 };
  if (Number.isFinite(numericCategoryId) && numericCategoryId > 0) {
    try {
      priceBounds = await getStorefrontProductsPriceBounds({ categoryId: numericCategoryId, q });
    } catch {
      /* ignore */
    }
  }

  const listing =
    Number.isFinite(numericCategoryId) && numericCategoryId > 0
      ? await getStorefrontProductsListingByCategoryNumericId({
          categoryId: numericCategoryId,
          q,
          sort,
          page,
          perPage: per,
          minPrice,
          maxPrice,
        })
      : emptyProductsListing(per);

  const linkState: ProductsListingLinkState = {
    q,
    sort,
    per: String(listing.perPage),
    page: listing.page,
    segmentBase: segment,
    minPrice,
    maxPrice,
  };

  const descText = descriptionToText(category.description);
  const metaDescription = category.meta_description?.trim() || undefined;
  const metaTitle = category.meta_title?.trim() || undefined;
  const metaKeywords = category.meta_keywords?.trim() || undefined;
  const baseUrl = "https://baba.ge";
  const canonicalPath = parentCategoryHref(segment);
  const canonicalUrl = new URL(canonicalPath, baseUrl).toString();
  const iconUrl = category.icon
    ? category.icon.startsWith("http://") || category.icon.startsWith("https://")
      ? category.icon
      : new URL(category.icon, baseUrl).toString()
    : undefined;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Baba.ge",
        item: new URL("/", baseUrl).toString(),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: category.name,
        item: canonicalUrl,
      },
    ],
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: metaTitle ?? `${category.name} | Baba.ge`,
    description: metaDescription ?? descText ?? category.name,
    url: canonicalUrl,
    primaryImageOfPage: iconUrl,
    ...(metaKeywords ? { keywords: metaKeywords } : {}),
    isPartOf: {
      "@type": "WebSite",
      name: "Baba.ge",
      url: baseUrl,
    },
    breadcrumb: breadcrumbSchema,
  };

  const schema = {
    "@context": "https://schema.org",
    "@graph": [breadcrumbSchema, webPageSchema],
  };

  return (
    <>
      <Seo schema={schema} />
      <ProductsCatalogPage
        title={category.name}
        listing={listing}
        linkState={linkState}
        priceBounds={priceBounds}
        categorySlug={segment}
        sidebarLinkMode="root"
        description={metaDescription ?? descText ?? null}
      />
    </>
  );
}
