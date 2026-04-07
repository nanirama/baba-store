import Image from "next/image";
import Link from "next/link";

import {
  buildProductCardImageSrc,
  productCardBlurDataUrl,
  PRODUCT_CARD_IMAGE_MAX_PX,
  PRODUCT_CARD_IMAGE_MAX_PX_CAROUSEL,
  PRODUCT_CARD_SIZES_CAROUSEL,
  PRODUCT_CARD_SIZES_GRID,
} from "@/lib/images/product-card-image";
import { homeCarouselPriorityStillImageFields } from "@/lib/images/home-carousel-priority-image";
import type { ProductRecord } from "@/types/cms";

export function pickProductRecordImageUrl(product: ProductRecord): string | null {
  return product.main_image ?? product.image1 ?? product.image2 ?? product.image3 ?? null;
}

export type ProductCardProps = {
  product: ProductRecord;
  /** Set true only for above-the-fold slots (few per page) to protect LCP / bandwidth. */
  priority?: boolean;
  /** Preset `sizes` for grid vs home carousel layouts. */
  layout?: "grid" | "carousel";
  /** Override responsive width hints when the card sits in a custom container. */
  sizes?: string;
};

export function ProductCard({
  product,
  priority = false,
  layout = "grid",
  sizes: sizesOverride,
}: ProductCardProps) {
  const rawSrc = pickProductRecordImageUrl(product);
  const href = `/products/${encodeURIComponent(product.slug)}`;
  const urlMaxPx = layout === "carousel" ? PRODUCT_CARD_IMAGE_MAX_PX_CAROUSEL : PRODUCT_CARD_IMAGE_MAX_PX;
  const optimizedSrc = rawSrc ? buildProductCardImageSrc(rawSrc, urlMaxPx) : null;
  const blurDataURL = productCardBlurDataUrl(product.main_image_blur_data_url);
  const sizes = sizesOverride ?? (layout === "carousel" ? PRODUCT_CARD_SIZES_CAROUSEL : PRODUCT_CARD_SIZES_GRID);
  const title = product.name.trim() || "პროდუქტი";

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      <Link
        href={href}
        className="flex min-h-0 flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 pb-4"
      >
        <div className="relative flex aspect-square w-full shrink-0 items-center justify-center bg-gray-50 [&_img]:!object-contain">
          {optimizedSrc ? (
            priority && layout === "carousel" ? (
              <Image
                {...homeCarouselPriorityStillImageFields(optimizedSrc, title)}
                placeholder="blur"
                blurDataURL={blurDataURL}
                decoding="async"
                className="box-border h-full w-full object-contain object-center p-4"
                style={{ objectFit: "contain" }}
              />
            ) : (
              <Image
                src={optimizedSrc}
                alt={title}
                fill
                sizes={sizes}
                quality={priority ? 78 : 68}
                priority={priority}
                fetchPriority={priority ? "high" : "low"}
                placeholder={layout === "carousel" && !priority ? "empty" : "blur"}
                blurDataURL={layout === "carousel" && !priority ? undefined : blurDataURL}
                decoding="async"
                className="box-border object-contain object-center p-4"
                style={{ objectFit: "contain" }}
              />
            )
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-sm text-gray-400"
              aria-hidden
            >
              -
            </div>
          )}
        </div>
        <h3 className="line-clamp-1 px-4 pb-4 pt-2 text-left text-xs font-medium leading-snug text-gray-900">
          {title}
        </h3>
      </Link>
    </article>
  );
}