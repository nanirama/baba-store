// Remote image URL helpers for cards, PDP, and category icons (Sanity + Supabase).

export const PRODUCT_CARD_IMAGE_MAX_PX = 640;
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

export const PRODUCT_CARD_SIZES_CAROUSEL =
  "(max-width: 639px) 88vw, (max-width: 767px) 44vw, (max-width: 1023px) 30vw, min(240px, 19vw)";

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
        u.searchParams.set("q", "75");
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
      render.searchParams.set("quality", "80");
      return render.toString();
    }
  } catch {
    /* keep original URL */
  }

  return trimmed;
}
