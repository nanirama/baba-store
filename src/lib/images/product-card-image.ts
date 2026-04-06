/**
 * Card thumbnail tuning: caps what the origin serves before/while Next optimizes (smaller LCP payload).
 * ~2× typical 3-column card width at lg for crisp DPR 2 edges.
 */
export const PRODUCT_CARD_IMAGE_MAX_PX = 640;

/** PDP main gallery — cap long edge for LCP without downloading full-resolution originals. */
export const PRODUCT_DETAIL_MAIN_MAX_PX = 960;

/** Thumbnail strip — physical ~64–72px, 2× for DPR. */
export const PRODUCT_DETAIL_THUMB_MAX_PX = 160;

/**
 * Responsive width hint for product detail hero (`md:col-span-7` in ~`max-w-[1440px]` layout).
 */
export const PRODUCT_DETAIL_MAIN_SIZES =
  "(max-width: 1023px) min(100vw - 2rem, 640px), (max-width: 1439px) 58vw, min(840px, 52vw)";

/** Neutral gray 8×8 SVG — minimal inline blur when CMS has no LQIP (CLS guard). */
const FALLBACK_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI4IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4=";

export function productCardBlurDataUrl(cmsBlur: string | null | undefined): string {
  const t = cmsBlur?.trim();
  return t && t.startsWith("data:") ? t : FALLBACK_BLUR_DATA_URL;
}

/** Listing grid: matches `sm:grid-cols-2 lg:grid-cols-3` under `max-w-7xl`. */
export const PRODUCT_CARD_SIZES_GRID =
  "(max-width: 639px) 100vw, (max-width: 1023px) 50vw, (max-width: 1280px) 33vw, min(420px, 33vw)";

/** Home carousel: 1 / 2 / 3 / 5 slides by breakpoint. */
export const PRODUCT_CARD_SIZES_CAROUSEL =
  "(max-width: 639px) 92vw, (max-width: 767px) 46vw, (max-width: 1023px) 32vw, min(260px, 20vw)";

/**
 * Shrink remote assets at the CDN when supported (Sanity query params, Supabase render URL).
 * Other hosts return the original URL and rely on the Next image optimizer only.
 */
export function buildProductCardImageSrc(
  rawUrl: string,
  maxEdge: number = PRODUCT_CARD_IMAGE_MAX_PX
): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return trimmed;

  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();

    if (host === "cdn.sanity.io" || host.endsWith(".sanity.io")) {
      // Max width only — pinning equal w×h distorts portrait product shots.
      u.searchParams.set("w", String(maxEdge));
      u.searchParams.delete("h");
      u.searchParams.set("fit", "max");
      u.searchParams.set("auto", "format");
      if (!u.searchParams.has("q")) u.searchParams.set("q", "75");
      return u.toString();
    }

    const objectPublic = /\/storage\/v1\/object\/public\/(.+)$/i.exec(u.pathname);
    if (objectPublic && host.includes("supabase")) {
      const assetPath = objectPublic[1];
      const render = new URL(`${u.origin}/storage/v1/render/image/public/${assetPath}`);
      // Prefer long-edge cap only; paired width+height often maps to a square box and stretches assets.
      render.searchParams.set("width", String(maxEdge));
      render.searchParams.delete("height");
      render.searchParams.set("resize", "contain");
      render.searchParams.set("quality", "80");
      return render.toString();
    }
  } catch {
    /* keep original */
  }

  return trimmed;
}
