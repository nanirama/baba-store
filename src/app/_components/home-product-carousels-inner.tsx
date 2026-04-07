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
  /** Only the first non-empty carousel is above-the-fold LCP; avoid lazy-loading its first slides. */
  let assignedPriority = false;
  const prioritySlideCountFor = (products: ProductRecord[]) => {
    if (products.length === 0) return 0;
    if (assignedPriority) return 0;
    assignedPriority = true;
    return 2;
  };

  return (
    <>
      <ProductsSlider
        heading="აქციები  "
        ariaLabel="Promotions products"
        products={promotionProducts}
        prioritySlideCount={prioritySlideCountFor(promotionProducts)}
      />
      <ProductsSlider
        heading="ბესტსელერები"
        ariaLabel="Bestsellers products"
        products={bestSellerProducts}
        prioritySlideCount={prioritySlideCountFor(bestSellerProducts)}
      />
      <ProductsSlider
        heading="ფასდაკლებები"
        ariaLabel="Discounts products"
        products={discountProducts}
        prioritySlideCount={prioritySlideCountFor(discountProducts)}
      />
    </>
  );
}
