"use client";

import dynamic from "next/dynamic";

import type { ProductRecord } from "@/types/cms";

const SeeAlsoSlider = dynamic(
  () =>
    import("./product-detail-see-also-slider").then((m) => ({
      default: m.ProductDetailSeeAlsoSlider,
    })),
  {
    ssr: false,
    loading: () => <SeeAlsoSectionSkeletonInner />,
  },
);

function SeeAlsoSectionSkeletonInner() {
  return (
    <div className="mx-auto w-full min-h-[22rem] max-w-[1440px] px-4 sm:px-6 lg:px-8">
      <div
        className="h-5 w-32 rounded-sm bg-neutral-300/70 sm:h-6"
        role="status"
        aria-busy="true"
        aria-label="იტვირთება მსგავსი პროდუქტები"
      />
      <div className="mt-6 min-h-[16rem] rounded-lg border border-neutral-200/80 bg-white/60" />
    </div>
  );
}

export function ProductDetailSeeAlsoClient({ products }: { products: ProductRecord[] }) {
  return <SeeAlsoSlider products={products} />;
}
