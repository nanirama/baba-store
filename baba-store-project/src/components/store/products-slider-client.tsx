"use client";

import dynamic from "next/dynamic";
import type { ProductsSliderProps } from "@/components/store/home-products-slider";

const ProductsSliderLazy = dynamic(
  () =>
    import("@/components/store/home-products-slider").then((m) => ({
      default: m.ProductsSlider,
    })),
  { ssr: false, loading: () => null }
);

/** Use this from Server Components when the slider must skip SSR (react-slick). */
export function ProductsSliderClient(props: ProductsSliderProps) {
  return <ProductsSliderLazy {...props} />;
}
