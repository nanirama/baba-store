"use client";

import { Minus } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { useProductsListingNav } from "@/components/store/products-listing-nav-context";
import {
  mergeListingParams,
  type ProductsListingLinkState,
  toHref,
} from "@/lib/utils/products-listing-url";

type ProductsPriceFilterProps = {
  linkState: ProductsListingLinkState;
  /** Min/max price (GEL) for current catalog scope — from server, no `min_price`/`max_price` applied. */
  priceBounds: { min: number; max: number };
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function parseInputInt(raw: string): number | null {
  const t = raw.replace(/\D/g, "");
  if (t === "") return null;
  const n = Math.round(Number(t));
  if (!Number.isFinite(n)) return null;
  return clamp(n, 0, 999_999_999);
}

export function ProductsPriceFilter({ linkState, priceBounds }: ProductsPriceFilterProps) {
  const { navigateListing, isPending } = useProductsListingNav();
  const panelId = useId();
  const [open, setOpen] = useState(true);

  const floor = priceBounds.min;
  const ceil = priceBounds.max;
  const span = Math.max(0, ceil - floor);

  const urlMin = linkState.minPrice;
  const urlMax = linkState.maxPrice;
  const effectiveMin = urlMin ?? floor;
  const effectiveMax = urlMax ?? ceil;

  const [localMin, setLocalMin] = useState(effectiveMin);
  const [localMax, setLocalMax] = useState(effectiveMax);
  const rMin = useRef(localMin);
  const rMax = useRef(localMax);
  rMin.current = localMin;
  rMax.current = localMax;

  /** Always merge against latest listing state (avoids stale closures during rapid slider input). */
  const linkStateRef = useRef(linkState);
  linkStateRef.current = linkState;

  /** Skip URL→local sync while dragging so RSC refresh does not snap thumbs mid-gesture. */
  const draggingSliderRef = useRef(false);

  useEffect(() => {
    if (draggingSliderRef.current) return;
    setLocalMin(effectiveMin);
    setLocalMax(effectiveMax);
  }, [effectiveMin, effectiveMax, floor, ceil]);

  const commitRange = useCallback(
    (minVal: number, maxVal: number) => {
      let a = minVal;
      let b = maxVal;
      if (a > b) [a, b] = [b, a];
      a = clamp(a, floor, ceil);
      b = clamp(b, floor, ceil);

      const fullRange = a <= floor && b >= ceil;
      navigateListing(
        toHref(
          mergeListingParams(linkStateRef.current, {
            minPrice: fullRange ? undefined : a,
            maxPrice: fullRange ? undefined : b,
            page: 1,
          })
        )
      );
    },
    [navigateListing, floor, ceil]
  );

  const textCommitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleTextCommit = useCallback(
    (minVal: number, maxVal: number) => {
      if (textCommitTimerRef.current) clearTimeout(textCommitTimerRef.current);
      textCommitTimerRef.current = setTimeout(() => {
        textCommitTimerRef.current = null;
        commitRange(minVal, maxVal);
      }, 120);
    },
    [commitRange]
  );

  /**
   * Tracks are non-interactive so clicks pass through to the slider underneath; only thumbs
   * capture events — required so min (top layer) and max (below) can both be dragged.
   */
  const rangeClass =
    "pointer-events-none cursor-pointer appearance-none bg-transparent " +
    "[&::-webkit-slider-runnable-track]:pointer-events-none [&::-moz-range-track]:pointer-events-none " +
    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 " +
    "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 " +
    "[&::-webkit-slider-thumb]:bg-[#16a34a] [&::-webkit-slider-thumb]:shadow-sm " +
    "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 " +
    "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 " +
    "[&::-moz-range-thumb]:bg-[#16a34a] [&::-moz-range-thumb]:shadow-sm";

  const inactive = span <= 0 || (floor === 0 && ceil === 0);

  const minPct = span > 0 ? ((localMin - floor) / span) * 100 : 0;
  const maxPct = span > 0 ? ((localMax - floor) / span) * 100 : 100;

  if (inactive) {
    return (
      <div className="px-2 py-3 sm:px-3">
        <p className="text-xs text-gray-500">ფასის ფილტრი მიუწვდომელია.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50/80 px-2 py-3 sm:px-3">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 text-left"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm font-medium text-gray-500">ფასი</span>
        <span className="flex h-5 w-5 shrink-0 items-center justify-center text-gray-400" aria-hidden>
          {open ? <Minus className="h-4 w-4" strokeWidth={2} /> : <span className="text-lg leading-none">+</span>}
        </span>
      </button>

      <div id={panelId} hidden={!open} className="mt-3 space-y-4">
        <div
          className={`isolate overflow-hidden pt-2 ${isPending ? "opacity-70" : ""}`}
          style={{ contain: "layout style paint" }}
        >
          <div className="relative mx-0.5 min-h-10 py-1">
            <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gray-200" />
            <div
              className="pointer-events-none absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#F15A24]"
              style={{
                left: `${minPct}%`,
                width: `${Math.max(0, maxPct - minPct)}%`,
              }}
            />
            {/*
              Max handle first in DOM (lower z); min handle on top so left thumb is reachable.
              Pass-through tracks let clicks reach the max thumb on the right.
            */}
            <div className="relative z-0 h-10 w-full">
              {/*
                Both inputs use the full [floor, ceil] domain. Changing min/max attrs per thumb
                makes browsers reposition handles ("auto slide"). Cross-clamp in onChange only.
              */}
              <input
                type="range"
                min={floor}
                max={ceil}
                step={1}
                value={localMax}
                className={`absolute inset-x-0 top-1/2 z-[1] h-10 w-full -translate-y-1/2 ${rangeClass}`}
                aria-label="მაქსიმალური ფასი"
                onPointerDown={() => {
                  draggingSliderRef.current = true;
                }}
                onPointerUp={() => {
                  draggingSliderRef.current = false;
                }}
                onPointerCancel={() => {
                  draggingSliderRef.current = false;
                }}
                onChange={(e) => {
                  const v = clamp(Number(e.target.value), rMin.current, ceil);
                  setLocalMax(v);
                  commitRange(rMin.current, v);
                }}
              />
              <input
                type="range"
                min={floor}
                max={ceil}
                step={1}
                value={localMin}
                className={`absolute inset-x-0 top-1/2 z-[2] h-10 w-full -translate-y-1/2 ${rangeClass}`}
                aria-label="მინიმალური ფასი"
                onPointerDown={() => {
                  draggingSliderRef.current = true;
                }}
                onPointerUp={() => {
                  draggingSliderRef.current = false;
                }}
                onPointerCancel={() => {
                  draggingSliderRef.current = false;
                }}
                onChange={(e) => {
                  const v = clamp(Number(e.target.value), floor, rMax.current);
                  setLocalMin(v);
                  commitRange(v, rMax.current);
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1 rounded border border-gray-200 bg-white px-2 py-1.5">
            <input
              type="text"
              inputMode="numeric"
              className="min-w-0 flex-1 border-0 bg-transparent text-sm text-gray-900 outline-none"
              value={String(localMin)}
              aria-label="მინიმალური ფასი ლარებში"
              onChange={(e) => {
                const n = parseInputInt(e.target.value);
                if (n == null) return;
                const next = clamp(n, floor, localMax);
                setLocalMin(next);
                scheduleTextCommit(next, localMax);
              }}
              onBlur={() => commitRange(rMin.current, rMax.current)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRange(rMin.current, rMax.current);
              }}
            />
            <span className="shrink-0 text-sm text-gray-600" aria-hidden>
              ₾
            </span>
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-1 rounded border border-gray-200 bg-white px-2 py-1.5">
            <input
              type="text"
              inputMode="numeric"
              className="min-w-0 flex-1 border-0 bg-transparent text-sm text-gray-900 outline-none"
              value={String(localMax)}
              aria-label="მაქსიმალური ფასი ლარებში"
              onChange={(e) => {
                const n = parseInputInt(e.target.value);
                if (n == null) return;
                const next = clamp(n, localMin, ceil);
                setLocalMax(next);
                scheduleTextCommit(localMin, next);
              }}
              onBlur={() => commitRange(rMin.current, rMax.current)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRange(rMin.current, rMax.current);
              }}
            />
            <span className="shrink-0 text-sm text-gray-600" aria-hidden>
              ₾
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
