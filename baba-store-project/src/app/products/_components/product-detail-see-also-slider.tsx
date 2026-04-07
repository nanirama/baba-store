"use client";

import { ProductsSlider } from "@/components/store/home-products-slider";
import type { ProductRecord } from "@/types/cms";

type ProductDetailSeeAlsoSliderProps = {
  products: ProductRecord[];
};

/** Below-the-fold carousel; `prioritySlideCount={0}` so it does not compete with PDP gallery LCP. */
export function ProductDetailSeeAlsoSlider({ products }: ProductDetailSeeAlsoSliderProps) {
  if (products.length === 0) return null;

  return (
    <ProductsSlider
      ariaLabel="See also products"
      heading={<span>SEE ALSO</span>}
      products={products}
      prioritySlideCount={0}
    />
  );
}
