"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import {
  buildProductCardImageSrc,
  PRODUCT_DETAIL_MAIN_MAX_PX,
  PRODUCT_DETAIL_MAIN_SIZES,
  PRODUCT_DETAIL_THUMB_MAX_PX,
  productCardBlurDataUrl,
} from "@/lib/images/product-card-image";
import { cn } from "@/lib/utils";

function uniqueImageUrls(
  main: string | null,
  image1: string | null,
  image2: string | null,
  image3: string | null
): string[] {
  const raw = [main, image1, image2, image3].map((u) => String(u ?? "").trim()).filter(Boolean);
  const seen = new Set<string>();
  return raw.filter((u) => {
    if (seen.has(u)) return false;
    seen.add(u);
    return true;
  });
}

export type ProductImagesProps = {
  productName: string;
  mainImage: string | null;
  image1: string | null;
  image2: string | null;
  image3: string | null;
  /** Optional CMS LQIP (`data:...`) for hero placeholder blur (e.g. Sanity). */
  mainImageBlurDataUrl?: string | null;
  /**
   * LCP: set false if the gallery is not above the fold.
   * @default true
   */
  priorityHero?: boolean;
};

export function ProductImages({
  productName,
  mainImage,
  image1,
  image2,
  image3,
  mainImageBlurDataUrl,
  priorityHero = true,
}: ProductImagesProps) {
  const urls = useMemo(
    () => uniqueImageUrls(mainImage, image1, image2, image3),
    [mainImage, image1, image2, image3]
  );

  const { optimizedMain, optimizedThumb } = useMemo(() => {
    const main = urls.map((u) => buildProductCardImageSrc(u, PRODUCT_DETAIL_MAIN_MAX_PX));
    const thumb = urls.map((u) => buildProductCardImageSrc(u, PRODUCT_DETAIL_THUMB_MAX_PX));
    return { optimizedMain: main, optimizedThumb: thumb };
  }, [urls]);

  const [active, setActive] = useState(0);

  const safeIndex = urls.length > 0 ? Math.min(active, urls.length - 1) : 0;
  const currentSrc = optimizedMain[safeIndex] ?? null;
  const showThumbs = urls.length > 1;
  const title = productName.trim() || "პროდუქტი";
  const mainUrlTrim = (mainImage ?? "").trim();
  const heroBlurDataUrl = productCardBlurDataUrl(mainImageBlurDataUrl);
  const heroPriority = priorityHero && safeIndex === 0;
  const heroAlt =
    urls.length > 1 ? `${title} — სურათი ${safeIndex + 1} ${urls.length}-დან` : title;

  if (urls.length === 0) {
    return (
      <div className="flex aspect-square w-full max-w-full items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-sm text-neutral-500">
        სურათი არ არის
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-full flex-col gap-3 sm:gap-4">
      <div
        className={cn(
          "relative mx-auto aspect-square w-full max-w-full shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm",
          "lg:mx-0",
          "[&_img]:!object-contain"
        )}
      >
        <Image
          key={currentSrc}
          src={currentSrc!}
          alt={heroAlt}
          fill
          sizes={PRODUCT_DETAIL_MAIN_SIZES}
          priority={heroPriority}
          fetchPriority={heroPriority ? "high" : "low"}
          placeholder={safeIndex === 0 ? "blur" : "empty"}
          blurDataURL={safeIndex === 0 ? heroBlurDataUrl : undefined}
          decoding="async"
          className="box-border object-contain object-center p-3 sm:p-4"
          style={{ objectFit: "contain" }}
        />
      </div>

      {showThumbs ? (
        <nav className="w-full min-w-0" aria-label="პროდუქტის სურათები">
          <ul className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2.5 [&::-webkit-scrollbar]:hidden">
            {urls.map((src, i) => {
              const selected = i === safeIndex;
              const thumbSrc = optimizedThumb[i] ?? src;
              const thumbBlur = productCardBlurDataUrl(
                mainUrlTrim.length > 0 && src === mainUrlTrim ? mainImageBlurDataUrl : undefined
              );
              return (
                <li key={`${src}-${i}`} className="shrink-0 snap-start">
                  <button
                    type="button"
                    aria-current={selected ? "true" : undefined}
                    aria-label={`სურათი ${i + 1} ${urls.length}-დან`}
                    onClick={() => setActive(i)}
                    className={cn(
                      "relative h-16 w-16 overflow-hidden rounded-md border bg-white transition-[box-shadow,border-color] sm:h-[4.5rem] sm:w-[4.5rem]",
                      selected
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-neutral-200 hover:border-neutral-400"
                    )}
                  >
                    <Image
                      src={thumbSrc}
                      alt=""
                      fill
                      loading="lazy"
                      fetchPriority="low"
                      placeholder="blur"
                      blurDataURL={thumbBlur}
                      decoding="async"
                      className="box-border object-contain object-center p-1.5"
                      style={{ objectFit: "contain" }}
                      sizes="(max-width: 640px) 64px, 72px"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
