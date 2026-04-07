"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ProductCard } from "@/components/store/product-card";
import { cn } from "@/lib/utils";
import type { ProductRecord } from "@/types/cms";

// ─── Constants ───────────────────────────────────────────────────────────────

const GAP = 12; // px — matches gap-3

function getColsForWidth(w: number): number {
  if (w < 640) return 1;
  if (w < 768) return 2;
  if (w < 1024) return 3;
  return 5;
}

// ─── Arrow buttons ───────────────────────────────────────────────────────────

function ArrowBtn({
  direction,
  onClick,
  disabled,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  disabled: boolean;
}) {
  if (disabled) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "წინა სლაიდი" : "შემდეგი სლაიდი"}
      className={cn(
        "absolute top-1/2 z-10 -translate-y-1/2",
        "flex h-8 w-8 items-center justify-center rounded-full",
        "border border-gray-200 bg-white shadow-sm",
        "transition-colors duration-150 hover:bg-gray-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500",
        direction === "prev" ? "-left-4" : "-right-4",
      )}
    >
      {direction === "prev" ? (
        <ChevronLeft className="h-4 w-4 text-gray-700" strokeWidth={2.25} aria-hidden />
      ) : (
        <ChevronRight className="h-4 w-4 text-gray-700" strokeWidth={2.25} aria-hidden />
      )}
    </button>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export type ProductsSliderProps = {
  heading: ReactNode;
  products: ProductRecord[];
  ariaLabel?: string;
  className?: string;
  contentClassName?: string;
  /**
   * First N slides use next/image priority (high-fetch). Keep ≤2 for LCP.
   * @default 0
   */
  prioritySlideCount?: number;
};

export function ProductsSlider({
  heading,
  products,
  ariaLabel = "Products",
  className,
  contentClassName,
  prioritySlideCount = 0,
}: ProductsSliderProps) {
  if (products.length === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      className={cn("w-full min-w-0", className)}
    >
      <div
        className={cn(
          "mx-auto w-full min-w-0 max-w-[1440px] px-4 sm:px-6 lg:px-8",
          contentClassName,
        )}
      >
        <h2 className="relative my-5 inline-block font-[family-name:var(--font-heading)] text-sm font-[600] capitalize tracking-wide text-neutral-800 after:absolute after:left-0 after:-bottom-2.5 after:h-[1px] after:w-[50px] after:bg-orange-500 after:content-[''] sm:my-6 sm:mb-8">
          {heading}
        </h2>

        <SliderTrack
          products={products}
          prioritySlideCount={prioritySlideCount}
        />
      </div>
    </section>
  );
}

// ─── SliderTrack — all interaction lives here ─────────────────────────────────

function SliderTrack({
  products,
  prioritySlideCount,
}: {
  products: ProductRecord[];
  prioritySlideCount: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(5); // ← matches SSR desktop default
  const [currentPage, setCurrentPage] = useState(0);
  const [isMeasured, setIsMeasured] = useState(false);

  // Update cols on resize — no layout shift, just re-calc
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const ro = new ResizeObserver(([entry]) => {
      setCols(getColsForWidth(entry.contentRect.width));
      setIsMeasured(true);
    });

    ro.observe(track);
    return () => ro.disconnect();
  }, []);

  const totalPages = Math.ceil(products.length / cols);
  const canPrev = currentPage > 0;
  const canNext = currentPage < totalPages - 1;

  const goToPage = useCallback(
    (page: number) => {
      const track = trackRef.current;
      if (!track) return;

      const clampedPage = Math.max(0, Math.min(page, totalPages - 1));
      const cardWidth =
        (track.clientWidth - GAP * (cols - 1)) / cols;
      const scrollLeft = clampedPage * (cardWidth + GAP) * cols;

      track.scrollTo({ left: scrollLeft, behavior: "smooth" });
      setCurrentPage(clampedPage);
    },
    [cols, totalPages],
  );

  // Sync page indicator on native touch-swipe
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onScroll = () => {
      const cardWidth =
        (track.clientWidth - GAP * (cols - 1)) / cols;
      const page = Math.round(track.scrollLeft / ((cardWidth + GAP) * cols));
      setCurrentPage(Math.min(page, totalPages - 1));
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [cols, totalPages]);

  return (
    <div className="relative">
      <ArrowBtn
        direction="prev"
        onClick={() => goToPage(currentPage - 1)}
        disabled={!canPrev}
      />

      {/*
        display:grid with fixed column template = space is reserved at parse time.
        overflow-x:auto + scroll-snap = native touch swipe, zero JS for layout.
        No opacity trick, no isMounted — this renders identically on server and client.
      */}
      <div
        ref={trackRef}
        role="list"
        className={cn(
          "flex overflow-x-auto",
          "snap-x snap-mandatory scroll-smooth",
          // hide scrollbar cross-browser
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
        style={{
          gap: GAP,
        }}
      >
        {products.map((product, index) => (
          <div
            key={product.id}
            role="listitem"
            className={cn(
              "snap-start min-w-0",
              // Keep widths deterministic with CSS breakpoints to avoid SSR->hydration reflow.
              "basis-full sm:basis-[calc((100%-12px)/2)] md:basis-[calc((100%-24px)/3)] lg:basis-[calc((100%-48px)/5)]",
            )}
            style={{ flexShrink: 0 }}
          >
            <ProductCard
              product={product}
              layout="carousel"
              priority={index < prioritySlideCount}
            />
          </div>
        ))}
      </div>

      <ArrowBtn
        direction="next"
        onClick={() => goToPage(currentPage + 1)}
        disabled={!canNext}
      />

      {/* Dot indicators */}
      <div className="mt-4 min-h-2">
        {isMeasured && totalPages > 1 && (
          <div
            className="flex justify-center gap-1.5"
            role="tablist"
            aria-label="Slide pages"
          >
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-label={`გვერდი ${i + 1}`}
                aria-selected={i === currentPage}
                onClick={() => goToPage(i)}
                className={cn(
                  "rounded-full transition-all duration-200",
                  i === currentPage
                    ? "h-1.5 w-4 bg-orange-500"
                    : "h-1.5 w-1.5 bg-gray-300 hover:bg-gray-400",
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}