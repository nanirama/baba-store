import { getImageProps } from "next/image";
import Link from "next/link";

import { HomePageCarousels } from "@/app/_components/home-page-carousels";
import { BaseLayout } from "@/components/Common/BaseLayout";
import { pickProductRecordImageUrl } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";
import {
  buildProductCardImageSrc,
  PRODUCT_CARD_IMAGE_MAX_PX_CAROUSEL,
  PRODUCT_CARD_SIZES_CAROUSEL,
} from "@/lib/images/product-card-image";
import { getProducts } from "@/lib/supabase/cms-queries";
import { siteOrigin } from "@/lib/seo/site-origin";
import type { ProductRecord } from "@/types/cms";
import { parseTriStateBoolean } from "@/utils/tri-state-boolean";

/** Supabase server client uses `cache: "no-store"` fetches — static prerender would conflict at build time. */
export const dynamic = "force-dynamic";

const LIST_SCHEMA_LIMIT = 48;

function itemListSchemaBlock(name: string, products: ProductRecord[], origin: string) {
  const list = products.slice(0, LIST_SCHEMA_LIMIT);
  return {
    "@type": "ItemList" as const,
    name,
    itemListElement: list.map((p, i) => ({
      "@type": "ListItem" as const,
      position: i + 1,
      name: p.name,
      url: `${origin}/products/${encodeURIComponent(p.slug)}`,
    })),
  };
}

/** Early discovery for the first home carousel image (cuts mobile LCP “resource load delay”). */
function HomeCarouselLcpPreload({
  promotionProducts,
  bestSellerProducts,
  discountProducts,
}: {
  promotionProducts: ProductRecord[];
  bestSellerProducts: ProductRecord[];
  discountProducts: ProductRecord[];
}) {
  const product =
    promotionProducts[0] ?? bestSellerProducts[0] ?? discountProducts[0] ?? null;
  if (!product) return null;
  const raw = pickProductRecordImageUrl(product);
  if (!raw) return null;
  const src = buildProductCardImageSrc(raw, PRODUCT_CARD_IMAGE_MAX_PX_CAROUSEL);
  if (!src) return null;

  const { props } = getImageProps({
    src,
    alt: product.name.trim() || "პროდუქტი",
    width: PRODUCT_CARD_IMAGE_MAX_PX_CAROUSEL,
    height: PRODUCT_CARD_IMAGE_MAX_PX_CAROUSEL,
    sizes: PRODUCT_CARD_SIZES_CAROUSEL,
    quality: 78,
    priority: true,
  });

  const srcSet = "srcSet" in props && typeof props.srcSet === "string" ? props.srcSet : undefined;
  const sizesAttr = typeof props.sizes === "string" ? props.sizes : undefined;

  return (
    <link
      rel="preload"
      as="image"
      href={props.src}
      imageSrcSet={srcSet}
      imageSizes={sizesAttr}
      fetchPriority="high"
    />
  );
}

export default async function RootPage() {
  const products = await getProducts();
  const promotionProducts = products.filter((p) => parseTriStateBoolean(p.promotions));
  const bestSellerProducts = products.filter((p) => parseTriStateBoolean(p.bestsellers));
  const discountProducts = products.filter((p) => parseTriStateBoolean(p.discounts));

  const origin = siteOrigin();
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      itemListSchemaBlock("Promotions", promotionProducts, origin),
      itemListSchemaBlock("Bestsellers", bestSellerProducts, origin),
      itemListSchemaBlock("Discounts", discountProducts, origin),
    ],
  };

  return (
    <>
      <HomeCarouselLcpPreload
        promotionProducts={promotionProducts}
        bestSellerProducts={bestSellerProducts}
        discountProducts={discountProducts}
      />
      <BaseLayout>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <Button
            asChild
            className="group rounded-sm bg-[#F15A24] px-6 py-3 font-heading text-sm font-normal uppercase text-white transition-all duration-300 hover:bg-[#d94e1f]"
          >
            <Link href="/products" className="inline-flex items-center gap-2">
              ყველა პროექტი
              <svg
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 12h14M13 5l7 7-7 7"
                />
              </svg>
            </Link>
          </Button>
          <HomePageCarousels
            promotionProducts={promotionProducts}
            bestSellerProducts={bestSellerProducts}
            discountProducts={discountProducts}
          />
        </div>
      </BaseLayout>
    </>
  );
}
