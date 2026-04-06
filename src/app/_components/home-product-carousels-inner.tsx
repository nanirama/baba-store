"use client";

import { ProductsSlider } from "@/components/store/home-products-slider";
import type { ProductRecord } from "@/types/cms";

/** All homepage product carousels in one module so `react-slick` loads in a single deferred chunk. */
export function HomeProductCarouselsInner({
  promotionProducts,
  bestSellerProducts,
  discountProducts,
}: {
  promotionProducts: ProductRecord[];
  bestSellerProducts: ProductRecord[];
  discountProducts: ProductRecord[];
}) {
  return (
    <>
      <ProductsSlider
        heading="აქციები  "
        ariaLabel="Promotions products"
        products={promotionProducts}
        prioritySlideCount={2}
      />
      <ProductsSlider
        heading="ბესტსელერები"
        ariaLabel="Bestsellers products"
        products={bestSellerProducts}
        prioritySlideCount={0}
      />
      <ProductsSlider
        heading="ფასდაკლებები"
        ariaLabel="Discounts products"
        products={discountProducts}
        prioritySlideCount={0}
      />
    </>
  );
}
