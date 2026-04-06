"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
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
      className={cn("products-slider-arrow products-slider-arrow--prev !flex items-center justify-center", className)}
      onClick={onClick}
      aria-label="წინა სლაიდი"
    >
      <ChevronLeft className="h-5 w-5" strokeWidth={2.25} aria-hidden />
    </button>
  );
}

function ProductsSliderNext({ className, style, onClick }: CustomArrowProps) {
  return (
    <button
      type="button"
      style={style}
      className={cn("products-slider-arrow products-slider-arrow--next !flex items-center justify-center", className)}
      onClick={onClick}
      aria-label="შემდეგი სლაიდი"
    >
      <ChevronRight className="h-5 w-5" strokeWidth={2.25} aria-hidden />
    </button>
  );
}

export type ProductsSliderProps = {
  heading: ReactNode;
  products: ProductRecord[];
  /** Accessible name for the `<section>` (e.g. "See also"). */
  ariaLabel?: string;
  /** Extra classes on the outer `<section>`. */
  className?: string;
  /** Extra classes on the inner max-width wrapper. */
  contentClassName?: string;
};

/** Max widths per react-slick tier so ranges match Tailwind default / sm / md / lg. */
const SLIDER_BREAKPOINT_MAX = {
  /** <640px */
  mobile: 639,
  /** 640px–767px */
  sm: 767,
  /** 768px–1023px */
  md: 1023,
} as const;

const DESKTOP_SLIDES = 5;

export function ProductsSlider({
  heading,
  products,
  ariaLabel = "Products",
  className,
  contentClassName,
}: ProductsSliderProps) {
  if (products.length === 0) return null;

  const cap = (n: number) => Math.min(n, products.length);
  const canInfinite = products.length > Math.min(DESKTOP_SLIDES, products.length);

  return (
    <section aria-label={ariaLabel} className={cn("w-full min-w-0", className)}>
      <div
        className={cn(
          "mx-auto w-full min-w-0 max-w-[1440px] px-4 sm:px-6 lg:px-8",
          contentClassName,
        )}
      >
        <h2 className="relative my-5 inline-block font-[family-name:var(--font-heading)] text-sm font-[600] capitalize tracking-wide text-neutral-800 after:content-[''] after:absolute after:left-0 after:-bottom-2.5 after:h-[1px] after:w-[50px] after:bg-orange-500 sm:my-6 sm:mb-8">
          {heading}
        </h2>

        <div className="products-slider-root min-w-0 home_slider">
          <Slider
            dots
            arrows
            prevArrow={<ProductsSliderPrev />}
            nextArrow={<ProductsSliderNext />}
            /* Default react-slick paints <button>{i + 1}</button> — hide via empty button + CSS dots. */
            customPaging={(i) => (
              <button type="button" aria-label={`სლაიდი ${i + 1}`} />
            )}
            infinite={canInfinite}
            speed={380}
            slidesToShow={cap(DESKTOP_SLIDES)}
            slidesToScroll={1}
            swipe
            touchMove
            accessibility
            responsive={[
              {
                breakpoint: SLIDER_BREAKPOINT_MAX.mobile,
                settings: { slidesToShow: cap(1), slidesToScroll: 1 },
              },
              {
                breakpoint: SLIDER_BREAKPOINT_MAX.sm,
                settings: { slidesToShow: cap(2), slidesToScroll: 1 },
              },
              {
                breakpoint: SLIDER_BREAKPOINT_MAX.md,
                settings: { slidesToShow: cap(3), slidesToScroll: 1 },
              },
            ]}
          >
            {products.map((product, index) => (
              <div key={product.id} className="h-full px-1.5 sm:px-2">
                <ProductCard product={product} layout="carousel" priority={index < 2} />
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </section>
  );
}
