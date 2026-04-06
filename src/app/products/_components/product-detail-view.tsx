import { BaseLayout } from "@/components/Common/BaseLayout";
import { ProductDetailPromoSidebar } from "@/components/store/product-detail-promo-sidebar";
import { ProductTipTapContent } from "@/components/store/product-tip-tap-content";
import { ProductsSliderClient } from "@/components/store/products-slider-client";
import { getSeeAlsoProducts } from "@/lib/supabase/cms-queries";
import type { ProductRecord } from "@/types/cms";
import { ProductImages } from "./product-images";

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

      <div className="mx-auto max-w-[1440px] w-full px-4 py-8 lg:py-10">
        <div className="flex flex-wrap items-end gap-0 w-full max-w-[1440px] ">
          <h1 className="border-b-4 border-primary pb-2 font-[family-name:var(--font-heading)] font-bold tracking-tight text-gray-900 text-2xl mb-6">{product.name}</h1>
          <div className="h-px min-w-[4rem] flex-1 bg-gray-200" aria-hidden="true"></div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-[3fr_1fr] gap-4 my-4">
          <div className="p-0">
            <section className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-7 w-full">
                <ProductImages
                  key={product.id}
                  productName={product.name}
                  mainImage={product.main_image}
                  image1={product.image1}
                  image2={product.image2}
                  image3={product.image3}
                />
              </div>
              <div className="md:col-span-5 w-full p-4">
                <div className="space-y-5 flex flex-col">
                  {(product.model || product.sku) ? (
                    <ul className="list-disc mb-4 space-y-1.5 pl-5 text-sm leading-relaxed text-neutral-800 marker:text-neutral-800">
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
            </section>
          </div>
          <div className="p-4">
            <ProductDetailPromoSidebar className="shadow-md" />
          </div>
        </section>

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
