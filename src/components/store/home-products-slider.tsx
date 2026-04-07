"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { memo, useEffect, useState } from "react";
import type { CustomArrowProps } from "react-slick";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";

import { ProductCard } from "@/components/store/product-card";
import { cn } from "@/lib/utils";
import type { ProductRecord } from "@/types/cms";

import "./products-slider.css";

function ProductsSliderPrev({ className, style, onClick }: CustomArrowProps) {
  return (
    <button
      type="button"
      style={style}
      className={cn(
        "products-slider-arrow products-slider-arrow--prev !flex items-center justify-center",
        className,
      )}
      onClick={onClick}
      aria-label="წინა სლაიდი"
    >
      <ChevronLeft className="h-4 w-4" strokeWidth={2.25} aria-hidden />
    </button>
  );
}

function ProductsSliderNext({ className, style, onClick }: CustomArrowProps) {
  return (
    <button
      type="button"
      style={style}
      className={cn(
        "products-slider-arrow products-slider-arrow--next !flex items-center justify-center",
        className,
      )}
      onClick={onClick}
      aria-label="შემდეგი სლაიდი"
    >
      <ChevronRight className="h-4 w-4" strokeWidth={2.25} aria-hidden />
    </button>
  );
}

const HomeProductSlide = memo(function HomeProductSlide({
  product,
  priority,
}: {
  product: ProductRecord;
  priority: boolean;
}) {
  return (
    <div className="h-full px-1.5 sm:px-2">
      <ProductCard product={product} layout="carousel" priority={priority} />
    </div>
  );
});

export type ProductsSliderProps = {
  heading: ReactNode;
  products: ProductRecord[];
  /** Accessible name for the `<section>` (e.g. "See also"). */
  ariaLabel?: string;
  /** Extra classes on the outer `<section>`. */
  className?: string;
  /** Extra classes on the inner max-width wrapper. */
  contentClassName?: string;
  /**
   * First N slides use `next/image` priority + blur LCP path. Keep small; use `0` for secondary carousels on the same page.
   * @default 0
   */
  prioritySlideCount?: number;
};

const DESKTOP_SLIDES = 5;

/**
 * react-slick builds (max-width) bands from sorted breakpoints:
 * - first band: 0 … breakpoint₀
 * - next: breakpoint₀+1 … breakpoint₁
 * - after last band, `minWidth: lastBreakpoint+1` clears to `breakpoint: null` (uses top-level props).
 * We keep `slidesToShow={1}` so SSR / `breakpoint: null` never paints 5-wide rows on phones,
 * and use a huge sentinel so normal desktop widths stay in the “5-up” band instead of null.
 */
const BP_MOBILE_MAX = 639;
const BP_SM = 767;
const BP_MD = 1023;
/** Wider than any real device; last tier stays `slidesToShow: 5` instead of falling through to null. */
const BP_DESKTOP_SENTINEL = 99999;

export function ProductsSlider({
  heading,
  products,
  ariaLabel = "Products",
  className,
  contentClassName,
  prioritySlideCount = 0,
}: ProductsSliderProps) {
  const canInfinite = products.length > 1;
  const [isMounted, setIsMounted] = useState(false);

  if (products.length === 0) return null;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const settings = {
    dots: true,
    arrows: true,
    prevArrow: <ProductsSliderPrev />,
    nextArrow: <ProductsSliderNext />,
    customPaging: (i: number) => (
      <button type="button" aria-label={`სლაიდი ${i + 1}`} />
    ),
    infinite: canInfinite,
    speed: 380,
    slidesToShow: 5,
    slidesToScroll: 5,
    swipe: true,
    touchMove: true,
    accessibility: true,
    responsive: [
      {
        breakpoint: 1920,
        settings: {
          slidesToShow: 5,
          slidesToScroll: 5,
        },
      },
      {
        breakpoint: BP_DESKTOP_SENTINEL,
        settings: {
          slidesToShow: 5,
          slidesToScroll: 5,
        },
      },
      {
        breakpoint: BP_MD,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
        },
      },
      {
        breakpoint: BP_SM,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
        },
      },
      {
        breakpoint: BP_MOBILE_MAX,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

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

        <div className="products-slider-root min-w-0 home_slider">
          {isMounted ? (
            <Slider {...settings}>
              {products.map((product, index) => (
                <HomeProductSlide
                  key={product.id}
                  product={product}
                  priority={index < prioritySlideCount}
                />
              ))}
            </Slider>
          ) : (
            <div className="px-1.5 sm:px-2">
              <ProductCard
                product={products[0]}
                layout="carousel"
                priority={prioritySlideCount > 0}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

