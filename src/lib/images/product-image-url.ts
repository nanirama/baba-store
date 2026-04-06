// Remote image URL helpers for cards, PDP, and category icons (Sanity + Supabase).

/** Grid cards: up to ~420px CSS width; 2× DPR fits in ~840, cap URL at 640 for CDN budgets. */
export const PRODUCT_CARD_IMAGE_MAX_PX = 640;
/** Home/carousel cards: tighter than grid; ~600px covers many 2× slides without always fetching 640px. */
export const PRODUCT_CARD_IMAGE_MAX_PX_CAROUSEL = 600;
export const PRODUCT_DETAIL_MAIN_MAX_PX = 960;
export const PRODUCT_DETAIL_THUMB_MAX_PX = 160;
export const CATEGORY_ICON_MAX_PX = 64;
export const CATEGORY_ICON_IMAGE_SIZES = "20px";

export const PRODUCT_DETAIL_MAIN_SIZES =
  "(max-width: 1023px) min(100vw - 2rem, 640px), (max-width: 1439px) 58vw, min(840px, 52vw)";

/** Neutral LQIP for logos and small images when CMS has no blur. */
export const NEUTRAL_TILE_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI4IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4=";

export function productCardBlurDataUrl(cmsBlur: string | null | undefined): string {
  const t = cmsBlur?.trim();
  return t && t.startsWith("data:") ? t : NEUTRAL_TILE_BLUR_DATA_URL;
}

export const PRODUCT_CARD_SIZES_GRID =
  "(max-width: 639px) 100vw, (max-width: 1023px) 50vw, (max-width: 1280px) 33vw, min(420px, 33vw)";

/** Caps match slider track + padding so `sizes` does not over-select src widths vs painted size. */
export const PRODUCT_CARD_SIZES_CAROUSEL =
  "(max-width: 639px) min(88vw, 360px), (max-width: 767px) min(44vw, 340px), (max-width: 1023px) min(30vw, 300px), min(240px, 19vw)";

export function buildProductCardImageSrc(rawUrl: string, maxEdge?: number): string {
  const cap = maxEdge == null ? PRODUCT_CARD_IMAGE_MAX_PX : maxEdge;
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return trimmed;
  }

  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();

    if (host === "cdn.sanity.io" || host.endsWith(".sanity.io")) {
      u.searchParams.set("w", String(cap));
      u.searchParams.delete("h");
      u.searchParams.set("fit", "max");
      u.searchParams.set("auto", "format");
      if (!u.searchParams.has("q")) {
        u.searchParams.set("q", "72");
      }
      return u.toString();
    }

    const objectPublic = /\/storage\/v1\/object\/public\/(.+)$/i.exec(u.pathname);
    if (objectPublic && host.includes("supabase")) {
      const assetPath = objectPublic[1];
      const render = new URL(`${u.origin}/storage/v1/render/image/public/${assetPath}`);
      render.searchParams.set("width", String(cap));
      render.searchParams.delete("height");
      render.searchParams.set("resize", "contain");
      render.searchParams.set("quality", "72");
      return render.toString();
    }
  } catch {
    /* keep original URL */
  }

  return trimmed;
}
