import type { ReactNode } from "react";

import { BaseLayout } from "@/components/Common/BaseLayout";
import { ProductDetailPromoSidebar } from "@/components/store/product-detail-promo-sidebar";
import { ProductTipTapContent } from "@/components/store/product-tip-tap-content";
import { getSeeAlsoProducts } from "@/lib/supabase/cms-queries";
import type { ProductRecord } from "@/types/cms";
import { OrderForm } from "@/app/products/_components/order-form";
import { ProductDetailSeeAlsoClient } from "./product-detail-see-also-client";
import { ProductImages } from "./product-images";

function formatProductPrice(price: number | null | undefined): string | null {
  if (typeof price !== "number" || !Number.isFinite(price)) return null;
  return ` ₾ ${new Intl.NumberFormat("ka-GE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price)}`;
}

function SeeAlsoSectionShell({ children }: { children: ReactNode }) {
  return (
    <section
      className="mt-14 border-t border-neutral-200/80 bg-[#f4f4f4] py-10 sm:mt-16 sm:py-12 lg:mt-16"
      aria-label="იხილეთ ასევე"
    >
      {children}
    </section>
  );
}

function SeeAlsoSectionSkeleton() {
  return (
    <SeeAlsoSectionShell>
      <div className="mx-auto w-full min-h-[22rem] max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div
          className="h-5 w-32 rounded-sm bg-neutral-300/70 sm:h-6"
          role="status"
          aria-busy="true"
          aria-label="იტვირთება მსგავსი პროდუქტები"
        />
        <div className="mt-6 min-h-[16rem] rounded-lg border border-neutral-200/80 bg-white/60" />
      </div>
    </SeeAlsoSectionShell>
  );
}

export async function ProductDetailView({ product }: { product: ProductRecord }) {
  const seeAlso = await getSeeAlsoProducts({
    excludeId: product.id,
    categoryId: product.category_id,
    subcategoryId: product.parent_category_id,
    limit: 20,
  });

  const hasDescription =
    Array.isArray(product.description?.content) && product.description.content.length > 0;
  const priceLabel = formatProductPrice(product.price);

  return (
    <BaseLayout>
      <main
        id="product-detail-main"
        className="outline-none"
        tabIndex={-1}
      >
        <div className="mx-auto w-full max-w-[1440px] px-4 py-8 lg:py-10">
          <header className="flex w-full max-w-[1440px] flex-wrap items-end gap-0">
            <h1
              id="product-detail-title"
              className="mb-6 border-b-4 border-primary pb-2 font-[family-name:var(--font-heading)] text-2xl font-bold tracking-tight text-gray-900"
            >
              {product.name}
            </h1>
            <div className="h-px min-w-[4rem] flex-1 bg-gray-200" aria-hidden />
          </header>

          <section
            aria-labelledby="product-detail-title"
            className="my-4 grid grid-cols-1 gap-4 md:grid-cols-[3fr_1fr]"
          >
            <div className="min-w-0 p-0">
              <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="min-h-0 min-w-0">
                  <ProductImages
                    key={product.id}
                    productName={product.name}
                    mainImage={product.main_image}
                    image1={product.image1}
                    image2={product.image2}
                    image3={product.image3}
                    mainImageBlurDataUrl={product.main_image_blur_data_url}
                    priorityHero
                  />
                </div>
                <div className="min-w-0 p-4">
                  <div className="flex flex-col space-y-5">
                    <p className="text-xl font-bold leading-tight text-primary">
                      {priceLabel ?? "ფასი შეთანხმებით"}
                    </p>
                    {product.model || product.sku ? (
                      <ul className="mb-4 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-neutral-800 marker:text-neutral-800">
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
                  <OrderForm productName={product.name} productSku={product.sku} />
                  {hasDescription ? (
                    <div className="border-t border-neutral-200 pt-5">
                      <ProductTipTapContent description={product.description} />
                    </div>
                  ) : null}
                </div>
              </section>
            </div>
            <div className="min-w-0 p-4">
              <ProductDetailPromoSidebar className="shadow-md" />
            </div>
          </section>
        </div>

        {seeAlso.length > 0 ? (
          <SeeAlsoSectionShell>
            <ProductDetailSeeAlsoClient products={seeAlso} />
          </SeeAlsoSectionShell>
        ) : null}
      </main>
    </BaseLayout>
  );
}
