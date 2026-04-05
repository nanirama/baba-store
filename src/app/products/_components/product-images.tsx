"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

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
};

export function ProductImages({
  productName,
  mainImage,
  image1,
  image2,
  image3,
}: ProductImagesProps) {
  const urls = useMemo(
    () => uniqueImageUrls(mainImage, image1, image2, image3),
    [mainImage, image1, image2, image3]
  );

  const [active, setActive] = useState(0);

  const safeIndex = urls.length > 0 ? Math.min(active, urls.length - 1) : 0;
  const currentSrc = urls[safeIndex] ?? null;
  const showThumbs = urls.length > 1;

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
          "relative mx-auto aspect-square w-full max-w-full overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm",
          "lg:mx-0"
        )}
      >
        <Image
          src={currentSrc!}
          alt={productName}
          fill
          className="max-w-full max-h-full p-3 sm:p-4"
          sizes="(min-width: 1280px) 480px, (min-width: 1024px) 28vw, min(448px, 100vw)"
          priority
        />
      </div>

      {showThumbs ? (
        <nav className="w-full min-w-0" aria-label="პროდუქტის სურათები">
          <ul className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2.5 [&::-webkit-scrollbar]:hidden">
            {urls.map((src, i) => {
              const selected = i === safeIndex;
              return (
                <li key={`${src}-${i}`} className="shrink-0 snap-start">
                  <button
                    type="button"
                    aria-current={selected ? "true" : undefined}
                    onClick={() => setActive(i)}
                    className={cn(
                      "relative h-16 w-16 overflow-hidden rounded-md border bg-white transition-[box-shadow,border-color] sm:h-[4.5rem] sm:w-[4.5rem]",
                      selected
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-neutral-200 hover:border-neutral-400"
                    )}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      className="object-contain p-1.5"
                      sizes="80px"
                    />
                    <span className="sr-only">
                      სურათი {i + 1} {urls.length}-დან
                    </span>
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
