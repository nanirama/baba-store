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

export function ProductsSlider({
  heading,
  products,
  ariaLabel = "Products",
  className,
  contentClassName,
}: ProductsSliderProps) {
  if (products.length === 0) return null;

  const desktopCols = Math.min(4, products.length);

  return (

    <div className={cn("mx-auto min-w-0 max-w-[1440px] px-4 sm:px-6 lg:px-8", contentClassName)}>
      <h2 className="my-6 inline-block font-[family-name:var(--font-heading)] text-lg font-semibold uppercase tracking-wide text-neutral-800 sm:mb-8 sm:text-xl">
        {heading}
      </h2>

      <div className="products-slider-root min-w-0">
        <Slider
          dots
          arrows
          prevArrow={<ProductsSliderPrev />}
          nextArrow={<ProductsSliderNext />}
          /* Default react-slick paints <button>{i + 1}</button> — hide via empty button + CSS dots. */
          customPaging={(i) => (
            <button type="button" aria-label={`სლაიდი ${i + 1}`} />
          )}
          infinite={products.length > desktopCols}
          speed={380}
          slidesToShow={desktopCols}
          slidesToScroll={1}
          swipe
          touchMove
          accessibility
          responsive={[
            {
              breakpoint: 1024,
              settings: { slidesToShow: Math.min(3, products.length), slidesToScroll: 1 },
            },
            {
              breakpoint: 640,
              settings: { slidesToShow: Math.min(2, products.length), slidesToScroll: 1 },
            },
            {
              breakpoint: 480,
              settings: { slidesToShow: 1, slidesToScroll: 1 },
            },
          ]}
        >
          {products.map((product) => (
            <div key={product.id} className="h-full px-2">
              <ProductCard product={product} />
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
}
