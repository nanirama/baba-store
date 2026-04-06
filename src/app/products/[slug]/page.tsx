import type { Metadata } from "next";

import Seo, { seoGenerateMetadata } from "@/components/Common/Seo";
import { ProductDetailView } from "@/app/products/_components/product-detail-view";
import { ProductsCatalogLayout } from "@/app/products/_components/products-catalog-layout";
import {
  getCategoryBySlug,
  getProductBySlug,
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
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (product) {
    const metaTitleRaw = (product as any).meta_title as string | null | undefined;
    const metaDescriptionRaw = (product as any).meta_description as string | null | undefined;
    const metaKeywordsRaw = (product as any).meta_keywords as string | null | undefined;

    const seoTitle = metaTitleRaw?.trim() || product.name;
    const metaDescription = metaDescriptionRaw?.trim() || product.meta?.description?.trim() || undefined;
    const metaKeywords = metaKeywordsRaw?.trim() || product.meta?.keywords?.join(", ") || undefined;

    return seoGenerateMetadata({
      title: seoTitle,
      description: metaDescription ?? product.name,
      url: `/products/${slug}`,
      imageUrl: product.main_image ?? undefined,
      keywords: metaKeywords,
    });
  }
  const category = await getCategoryBySlug(slug);
  const label = category?.name ?? slug;
  return seoGenerateMetadata({
    title: `${label} | პროდუქტები | Baba.ge`,
    description: `Baba.ge — ${label}. ონლაინ კატალოგი.`,
    url: `/products/${slug}`,
    ogType: "website",
  });
}

export default async function ProductsSlugPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const baseUrl = "https://baba.ge";
  const toAbsUrl = (u?: string | null): string | undefined => {
    if (!u) return undefined;
    if (u.startsWith("http://") || u.startsWith("https://")) return u;
    return new URL(u, baseUrl).toString();
  };

  const product = await getProductBySlug(slug);
  if (product) {
    const metaTitleRaw = (product as any).meta_title as string | null | undefined;
    const metaDescriptionRaw = (product as any).meta_description as string | null | undefined;
    const metaKeywordsRaw = (product as any).meta_keywords as string | null | undefined;

    const metaDescription = metaDescriptionRaw?.trim() || product.meta?.description?.trim() || undefined;
    const metaKeywords = metaKeywordsRaw?.trim() || product.meta?.keywords?.join(", ") || undefined;

    const productUrl = `/products/${product.slug}`;
    const productAbsUrl = new URL(productUrl, baseUrl).toString();
    const stockValue = product.stock ?? product.quantity ?? 0;
    const availabilityUrl =
      stockValue > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Baba.ge",
          item: baseUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: product.name,
          item: productAbsUrl,
        },
      ],
    };

    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: metaDescription ?? product.name,
      sku: product.sku ?? undefined,
      model: product.model ?? undefined,
      brand: product.manufacturer ? { "@type": "Brand", name: product.manufacturer } : undefined,
      image: product.main_image ? [toAbsUrl(product.main_image)] : undefined,
      url: productAbsUrl,
      ...(metaKeywords ? { keywords: metaKeywords } : {}),
      offers: {
        "@type": "Offer",
        priceCurrency: "GEL",
        price: product.price,
        availability: availabilityUrl,
        url: productAbsUrl,
      },
    };

    const schema = {
      "@context": "https://schema.org",
      "@graph": [breadcrumbSchema, productSchema],
    };

    return (
      <>
        <Seo schema={schema} />
        <ProductDetailView product={product} />
      </>
    );
  }

  const sp = await searchParams;
  const { q, sort, per, page, minPrice, maxPrice } = parseListingSearchParams(sp);

  let priceBounds = { min: 0, max: 0 };
  try {
    priceBounds = await getProductsPriceBoundsForListing({ categorySlug: slug, q });
  } catch {
    /* ignore */
  }

  const listing = await getProductsListing({
    q,
    categorySlug: slug,
    sort,
    page,
    perPage: per,
    minPrice,
    maxPrice,
  });

  const category = await getCategoryBySlug(slug);
  const title = category?.name ?? slug;

  const linkState: ProductsListingLinkState = {
    q,
    category: slug,
    sort,
    per: String(listing.perPage),
    page: listing.page,
    minPrice,
    maxPrice,
  };

  const totalPages = Math.max(1, Math.ceil(listing.total / listing.perPage));

  return (
    <>
      {(() => {
        const categoryUrl = `/products/${slug}`;
        const canonicalAbsUrl = new URL(categoryUrl, baseUrl).toString();
        const breadcrumbSchema = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Baba.ge",
              item: baseUrl,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: title,
              item: canonicalAbsUrl,
            },
          ],
        };

        const webPageSchema = {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `${title} | პროდუქტები | Baba.ge`,
          description: `Baba.ge — ${title}. ონლაინ კატალოგი.`,
          url: canonicalAbsUrl,
          isPartOf: {
            "@type": "WebSite",
            name: "Baba.ge",
            url: baseUrl,
          },
          breadcrumb: breadcrumbSchema,
        };

        return <Seo schema={{ "@context": "https://schema.org", "@graph": [breadcrumbSchema, webPageSchema] }} />;
      })()}

      <ProductsCatalogLayout
        title={title}
        listing={listing}
        linkState={linkState}
        priceBounds={priceBounds}
        totalPages={totalPages}
        categorySlug={slug}
      />
    </>
  );
}
