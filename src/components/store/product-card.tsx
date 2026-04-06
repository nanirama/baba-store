import Image from "next/image";
import Link from "next/link";

import {
  buildProductCardImageSrc,
  productCardBlurDataUrl,
  PRODUCT_CARD_IMAGE_MAX_PX,
  PRODUCT_CARD_SIZES_CAROUSEL,
  PRODUCT_CARD_SIZES_GRID,
} from "@/lib/images/product-card-image";
import type { ProductRecord } from "@/types/cms";

function pickImageUrl(product: ProductRecord): string | null {
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
  const rawSrc = pickImageUrl(product);
  const href = `/products/${encodeURIComponent(product.slug)}`;
  const optimizedSrc = rawSrc ? buildProductCardImageSrc(rawSrc, PRODUCT_CARD_IMAGE_MAX_PX) : null;
  const blurDataURL = productCardBlurDataUrl(product.main_image_blur_data_url);
  const sizes = sizesOverride ?? (layout === "carousel" ? PRODUCT_CARD_SIZES_CAROUSEL : PRODUCT_CARD_SIZES_GRID);
  const title = product.name.trim() || "პროდუქტი";

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      <Link
        href={href}
        className="flex min-h-0 flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 pb-4"
      >
        <div className="relative aspect-square w-full bg-gray-50">
          {optimizedSrc ? (
            <Image
              src={optimizedSrc}
              alt={title}
              fill
              sizes={sizes}
              priority={priority}
              placeholder="blur"
              blurDataURL={blurDataURL}
              decoding="async"
              className="object-contain p-4"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-sm text-gray-400"
              aria-hidden
            >
              —
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
