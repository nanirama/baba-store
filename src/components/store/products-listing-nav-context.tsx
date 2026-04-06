"use client";

import { CircularLoadingIndicator } from "@/components/store/circular-loading-indicator";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useTransition, type ReactNode } from "react";

type ProductsListingNavContextValue = {
  /** Client navigation with transition — drives full-area loading overlay. */
  navigateListing: (href: string) => void;
  isPending: boolean;
};

const ProductsListingNavContext = createContext<ProductsListingNavContextValue | null>(null);

export function useProductsListingNav(): ProductsListingNavContextValue {
  const v = useContext(ProductsListingNavContext);
  if (!v) {
    throw new Error("useProductsListingNav must be used within ProductsListingNavProvider");
  }
  return v;
}

function ListingLoadingOverlay() {
  return (
    <div
      className="absolute inset-0 z-20 flex animate-listing-overlay-in items-center justify-center rounded-lg bg-gradient-to-b from-white/80 via-white/85 to-white/80 backdrop-blur-md motion-reduce:animate-none motion-reduce:backdrop-blur-sm"
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <div className="animate-listing-card-in motion-reduce:animate-none">
        <div className="relative flex flex-col items-center gap-5 rounded-2xl border border-orange-100/80 bg-white/95 px-10 py-9 shadow-[0_25px_50px_-12px_rgba(241,90,36,0.18),0_0_0_1px_rgba(0,0,0,0.03)] ring-1 ring-orange-500/5">
          {/* Pulsing glow — separate from spin so transform stacks don’t cancel */}
          <div
            className="pointer-events-none absolute left-1/2 top-[38%] h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-[#F15A24]/30 via-orange-400/25 to-amber-300/20 blur-2xl animate-listing-glow motion-reduce:animate-none"
            aria-hidden
          />

          <div
            className="relative z-[1] flex h-[72px] w-[72px] items-center justify-center motion-reduce:animate-pulse"
            aria-hidden
          >
            <CircularLoadingIndicator size={72} />
          </div>

          <div className="flex flex-col items-center gap-2">
            <p className="text-[15px] font-semibold tracking-tight text-gray-800">იტვირთება</p>
            <div className="flex h-5 items-end justify-center gap-1.5" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="inline-block h-2.5 w-2.5 rounded-full bg-gradient-to-t from-[#e04a1a] to-[#F15A24] shadow-sm will-change-transform motion-reduce:animate-none animate-listing-dot"
                  style={{
                    animationDelay: `${i * 130}ms`,
                    animationDuration: "0.75s",
                    animationIterationCount: "infinite",
                    animationTimingFunction: "ease-in-out",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Provides listing navigation + pending state for the price filter (sidebar) and overlay (main column).
 * Place `ProductsListingMainColumn` around the **products grid column only** so the overlay does not cover the sidebar.
 */
export function ProductsListingNavProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigateListing = useCallback(
    (href: string) => {
      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    },
    [router]
  );

  const value = useMemo(
    () => ({ navigateListing, isPending }),
    [navigateListing, isPending]
  );

  return <ProductsListingNavContext.Provider value={value}>{children}</ProductsListingNavContext.Provider>;
}

/** Right-hand listing column: `relative` host for `absolute` loading overlay (sidebar stays interactive). */
export function ProductsListingMainColumn({ children }: { children: ReactNode }) {
  const { isPending } = useProductsListingNav();
  return (
    <div className="relative min-w-0 flex-1">
      {isPending ? <ListingLoadingOverlay /> : null}
      <div className={isPending ? "pointer-events-none select-none" : undefined}>{children}</div>
    </div>
  );
}
