import Image from "next/image";
import Link from "next/link";

import type { ProductRecord } from "@/types/cms";

function pickImageUrl(product: ProductRecord): string | null {
  return product.main_image ?? product.image1 ?? product.image2 ?? product.image3 ?? null;
}

export function ProductCard({ product }: { product: ProductRecord }) {
  const src = pickImageUrl(product);
  const href = `/products/${encodeURIComponent(product.slug)}`;

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      <Link
        href={href}
        className="flex min-h-0 flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 pb-4"
      >
        <div className="relative aspect-square bg-white">
          {src ? (
            <Image
              src={src}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-contain p-4"
            />
          ) : (
            <div
              className="flex h-full items-center justify-center bg-gray-50 text-sm text-gray-400"
              aria-hidden
            >
              —
            </div>
          )}
        </div>
        <h2 className="line-clamp-1 px-4 pb-4 pt-2 text-left text-xs font-medium leading-snug text-gray-900">
          {product.name}
        </h2>
      </Link>
    </article>
  );
}
