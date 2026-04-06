"use client";

import { ProductsSlider } from "@/components/store/home-products-slider";
import type { ProductRecord } from "@/types/cms";

/** Second + third homepage carousels — loaded in a separate chunk via `next/dynamic`. */
export default function HomeDeferredSliders({
  bestSellerProducts,
  discountProducts,
}: {
  bestSellerProducts: ProductRecord[];
  discountProducts: ProductRecord[];
}) {
  return (
    <>
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
