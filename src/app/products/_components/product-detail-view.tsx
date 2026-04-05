import Image from "next/image";

import { BaseLayout } from "@/components/Common/BaseLayout";
import { ProductDetailPromoSidebar } from "@/components/store/product-detail-promo-sidebar";
import { ProductTipTapContent } from "@/components/store/product-tip-tap-content";
import { ProductsSliderClient } from "@/components/store/products-slider-client";
import { getSeeAlsoProducts } from "@/lib/supabase/cms-queries";
import type { ProductRecord } from "@/types/cms";
import { cn } from "@/lib/utils";

export async function ProductDetailView({ product }: { product: ProductRecord }) {
  const seeAlso = await getSeeAlsoProducts({
    excludeId: product.id,
    categoryId: product.category_id,
    subcategoryId: product.parent_category_id,
    limit: 20,
  });

  const hasDescription =
    Array.isArray(product.description?.content) && product.description.content.length > 0;

  return (
    <BaseLayout>
      <div className="mx-auto max-w-[1440px] px-4 py-8 lg:py-10">
        <div className="flex flex-wrap items-end gap-0">
          <h1 className="border-b-4 border-primary pb-2 font-[family-name:var(--font-heading)] font-bold tracking-tight text-gray-900 text-2xl mb-6">{product.name}</h1>
          <div className="h-px min-w-[4rem] flex-1 bg-gray-200" aria-hidden="true"></div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start lg:gap-y-10">
          <div className="lg:col-span-9 grid md:grid-cols-2 gap-8">
            <div className="mx-auto w-full rounded-lg border border-neutral-200 bg-white shadow-sm lg:mx-0">

              {product.main_image ? (
                <div className="relative aspect-square w-full">
                  <Image
                    src={product.main_image}
                    alt={product.name}
                    fill
                    className="object-contain p-4 sm:p-6"
                    sizes="(min-width: 1280px) 320px, (min-width: 1024px) 28vw, min(448px, 100vw)"
                    priority
                  />
                </div>
              ) : (
                <div className="flex aspect-square w-full items-center justify-center bg-neutral-50 text-sm text-neutral-500">
                  სურათი არ არის
                </div>
              )}
            </div>


            <div className="flex flex-col gap-8 lg:gap-x-8">
              <div className="space-y-5 flex flex-col">
                {(product.model || product.sku) ? (
                  <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-neutral-800 marker:text-neutral-800">
                    {product.model ? (
                      <li>
                        <span className="font-medium text-neutral-700">მოდელი: </span>
                        {product.model}
                      </li>
                    ) : null}
                    {product.sku ? (
                      <li>
                        <span className="font-medium text-neutral-700">SKU: </span>
                        <span className="break-all tabular-nums text-neutral-800">{product.sku}</span>
                      </li>
                    ) : null}
                  </ul>
                ) : null}
              </div>



              {hasDescription ? (
                <div className="border-t border-neutral-200 pt-5">
                  <ProductTipTapContent description={product.description} />
                </div>
              ) : null}
            </div>
          </div>

          <div className="min-w-0 w-full shrink-0 lg:col-span-3">
            <ProductDetailPromoSidebar className="shadow-md" />
          </div>




        </div>
      </div>
      {seeAlso.length > 0 ? (
        <section
          className={"mt-14 border-t border-neutral-200/80 bg-[#f4f4f4] py-10 sm:mt-16 sm:py-12 lg:mt-16"}
        >
          <ProductsSliderClient
            ariaLabel="See also"
            heading={<span className="">SEE ALSO</span>}
            products={seeAlso}
          />
        </section>
      ) : null}
    </BaseLayout>
  );
}
