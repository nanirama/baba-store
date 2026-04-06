"use client";

import dynamic from "next/dynamic";
import { ProductsSlider } from "@/components/store/home-products-slider";
import type { ProductRecord } from "@/types/cms";

const HomeDeferredSliders = dynamic(() => import("./home-deferred-sliders"), {
  loading: () => (
    <>
      <ProductCarouselSkeleton statusLabel="იტვირთება ბესტსელერების ბლოკი" />
      <ProductCarouselSkeleton statusLabel="იტვირთება ფასდაკლებების ბლოკი" />
    </>
  ),
  ssr: false,
});

/** Reserved vertical space to match `ProductsSlider` heading + track (CLS). */
function ProductCarouselSkeleton({ statusLabel }: { statusLabel: string }) {
  return (
    <div
      className="w-full min-w-0"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={statusLabel}
    >
      <div className="mx-auto w-full min-w-0 max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="relative my-5 h-5 w-44 max-w-[50%] rounded-sm bg-neutral-200/90 sm:my-6 sm:mb-8" />
        <div className="products-slider-root min-h-[268px] rounded-lg border border-neutral-100 bg-neutral-50/90 sm:min-h-[292px] lg:min-h-[308px]" />
      </div>
    </div>
  );
}

export function HomePageCarousels({
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
      <HomeDeferredSliders
        bestSellerProducts={bestSellerProducts}
        discountProducts={discountProducts}
      />
    </>
  );
}
