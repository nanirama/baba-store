import Link from "next/link";
import { ProductsSliderClient } from "@/components/store/products-slider-client";
import { getProducts } from "@/lib/supabase/cms-queries";
import { BaseLayout } from "@/components/Common/BaseLayout";
import { Button } from "@/components/ui/button";
import { parseTriStateBoolean } from "@/utils/cms-schemas";

/** Supabase server client uses `cache: "no-store"` fetches — static prerender would conflict at build time. */
export const dynamic = "force-dynamic";

export default async function RootPage() {
  const products = await getProducts();
  const promotionProducts = products.filter((p) => parseTriStateBoolean(p.promotions));
  const bestSellerProducts = products.filter((p) => parseTriStateBoolean(p.bestsellers));
  const discountProducts = products.filter((p) => parseTriStateBoolean(p.discounts));
  return (
    <BaseLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10 flex flex-col items-center justify-center">
        <button className="group  bg-[#F15A24] hover:bg-[#d94e1f] text-white text-sm font-medium uppercase px-6 py-3 rounded-sm transition-all duration-300">
          <Link href="/products" className="inline-flex items-center gap-2"> ყველა პროექტი
            <svg
              className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 12h14M13 5l7 7-7 7"
              />
            </svg>
          </Link>
        </button>
        <ProductsSliderClient
          heading="აქციები  "
          ariaLabel="Promotions products"
          products={promotionProducts}
        />
        <ProductsSliderClient
          heading="ბესტსელერები"
          ariaLabel="Bestsellers products"
          products={bestSellerProducts}
        />
        <ProductsSliderClient
          heading="ფასდაკლებები"
          ariaLabel="Discounts products"
          products={discountProducts}
        />
      </div>

      {/* <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="mb-4 max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          ონლაინ მაღაზია საუკეთესო ფასად
        </h1>
        <p className="mb-10 max-w-xl text-lg text-muted-foreground">
          შეიძინეთ ტექნიკა, ავეჯი და სხვა პროდუქტები ონლაინ — სწრაფი მიწოდება საქართველოში.
        </p>
        <Button asChild size="lg" className="rounded-full px-8">
          <Link href="/auth/login">შესვლა</Link>
        </Button>
      </div> */}
    </BaseLayout>
  );
}
