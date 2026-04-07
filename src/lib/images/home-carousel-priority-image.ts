import {
  PRODUCT_CARD_IMAGE_MAX_PX_CAROUSEL,
  PRODUCT_CARD_SIZES_CAROUSEL,
} from "@/lib/images/product-card-image";

/** Matches `<Image quality={…}>` for priority carousel cards. */
export const HOME_CAROUSEL_PRIORITY_IMAGE_QUALITY = 78;

/**
 * Use the same width/height-based props for priority carousel cards and for
 * `getImageProps` preloads. `fill` chooses different `/_next/image` widths than
 * a fixed `width`/`height` pair, which invalidates `<link rel="preload">` and
 * inflates LCP “resource load delay”.
 */
export function homeCarouselPriorityStillImageFields(src: string, alt: string) {
  return {
    src,
    alt,
    width: PRODUCT_CARD_IMAGE_MAX_PX_CAROUSEL,
    height: PRODUCT_CARD_IMAGE_MAX_PX_CAROUSEL,
    sizes: PRODUCT_CARD_SIZES_CAROUSEL,
    quality: HOME_CAROUSEL_PRIORITY_IMAGE_QUALITY,
    priority: true as const,
    fetchPriority: "high" as const,
  };
}
