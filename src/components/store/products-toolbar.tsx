"use client";

import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";

import {
  mergeListingParams,
  type ProductsListingLinkState,
  toHref,
} from "@/lib/utils/products-listing-url";

const SORT_OPTIONS = [
  { value: "default", label: "გულისხმობით" },
  { value: "name_asc", label: "სახელით ა - ჰ" },
  { value: "name_desc", label: "სახელით ჰ - ა" },
  { value: "price_asc", label: "ფასით დაბლიდან > მაღლისკენ" },
  { value: "price_desc", label: "ფასით მაღლიდან > დაბლისკენ" },
  { value: "rating_desc", label: "რეიტინგით მაღალი" },
  { value: "rating_asc", label: "რეიტინგით დაბალი" },
  { value: "model_asc", label: "მოდელი ა - ჰ" },
  { value: "model_desc", label: "მოდელი ჰ - ა" },
] as const;

const PER_OPTIONS = [25, 50, 100, 200, 500] as const;

export function ProductsToolbar({ state }: { state: ProductsListingLinkState }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const push = useCallback(
    (next: ProductsListingLinkState) => {
      startTransition(() => {
        router.push(toHref(next));
      });
    },
    [router]
  );

  return (
    <div
      className={`mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end ${
        pending ? "opacity-80" : ""
      }`}
    >
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-stretch">
        <label htmlFor="product-sort" className="sr-only">
          დალაგება
        </label>
        <div className="flex min-w-0 overflow-hidden rounded-md border border-gray-300 bg-white shadow-sm">
          <span className="flex shrink-0 items-center bg-gray-100 px-3 py-2 text-xs font-medium text-gray-800">
            დალაგება:
          </span>
          <select
            id="product-sort"
            className="min-h-[42px] min-w-0 flex-1 border-0 bg-transparent py-2 pl-3 pr-10 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            value={state.sort}
            onChange={(e) =>
              push(mergeListingParams(state, { sort: e.target.value, page: 1 }))
            }
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-stretch">
        <label htmlFor="product-per" className="sr-only">
          ერთ გვერდზე ჩვენება
        </label>
        <div className="flex overflow-hidden rounded-md border border-gray-300 bg-white shadow-sm">
          <span className="flex shrink-0 items-center bg-gray-100 px-3 py-2 text-xs font-medium text-gray-800">
            მაჩვენე:
          </span>
          <select
            id="product-per"
            className="min-h-[42px] w-full min-w-[5rem] border-0 bg-transparent py-2 pl-3 pr-10 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary sm:w-28"
            value={state.per}
            onChange={(e) =>
              push(mergeListingParams(state, { per: e.target.value, page: 1 }))
            }
          >
            {PER_OPTIONS.map((n) => (
              <option key={n} value={String(n)}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
