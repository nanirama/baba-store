import { notFound } from "next/navigation";
import type { Metadata } from "next";

import Seo, { seoGenerateMetadata } from "@/components/Common/Seo";
import { ProductsCatalogPage } from "@/app/products/_components/products-catalog-page";
import { getStorefrontChildCategoryBySlugs } from "@/lib/supabase/categories";
import {
  emptyProductsListing,
  getStorefrontProductsListingByCategoryNumericId,
  getStorefrontProductsPriceBounds,
  parseListingSearchParams,
} from "@/lib/supabase/products-listing";
import {
  childCategoryHref,
  isReservedRootSlug,
  parentCategoryHref,
} from "@/lib/utils/category-href";
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
  const metaTitle = row.child.meta_title?.trim() || undefined;
  const metaDescription = row.child.meta_description?.trim() || undefined;
  const metaKeywords = row.child.meta_keywords?.trim() || undefined;

  const title = metaTitle ?? `${row.child.name} | Baba.ge`;
  const description = metaDescription ?? descriptionText ?? row.child.name;
  return seoGenerateMetadata({
    title,
    description,
    url: childCategoryHref(segment, child),
    imageUrl: row.child.icon ?? undefined,
    keywords: metaKeywords,
  });
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

  const { q, sort, per, page, minPrice, maxPrice } = parseListingSearchParams(sp);

  const numericCategoryId = Number(childCat.category_id);

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
    segmentChild: child,
    minPrice,
    maxPrice,
  };

  const descText = descriptionToText(childCat.description);
  const metaDescription = childCat.meta_description?.trim() || undefined;
  const metaTitle = childCat.meta_title?.trim() || undefined;
  const metaKeywords = childCat.meta_keywords?.trim() || undefined;

  const baseUrl = "https://baba.ge";
  const canonicalPath = childCategoryHref(segment, child);
  const canonicalUrl = new URL(canonicalPath, baseUrl).toString();
  const iconUrl = row.child.icon
    ? row.child.icon.startsWith("http://") || row.child.icon.startsWith("https://")
      ? row.child.icon
      : new URL(row.child.icon, baseUrl).toString()
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
        name: row.parent.name,
        item: new URL(parentCategoryHref(segment), baseUrl).toString(),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: childCat.name,
        item: canonicalUrl,
      },
    ],
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: metaTitle ?? `${childCat.name} | Baba.ge`,
    description: metaDescription ?? descText ?? childCat.name,
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
        title={childCat.name}
        listing={listing}
        linkState={linkState}
        priceBounds={priceBounds}
        categorySlug={segment}
        childSlug={child}
        sidebarLinkMode="root"
        description={metaDescription ?? descText ?? null}
      />
    </>
  );
}
