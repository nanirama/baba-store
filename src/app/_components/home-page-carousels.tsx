import { HomeProductCarouselsInner } from "@/app/_components/home-product-carousels-inner";
import type { ProductRecord } from "@/types/cms";

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
    <HomeProductCarouselsInner
      promotionProducts={promotionProducts}
      bestSellerProducts={bestSellerProducts}
      discountProducts={discountProducts}
    />
  );
}
