"use client";

import { cn } from "@/lib/utils";

type CircularLoadingIndicatorProps = {
  className?: string;
  /** Width in px; height follows viewBox aspect (100×104). */
  size?: number;
};

/**
 * Inlined SVG (same artwork as `public/images/circular_loading_indicator.svg`) inside a div
 * with `animate-spin`. CSS `animation` on `<img src="*.svg">` is unreliable; inlining fixes it.
 */
export function CircularLoadingIndicator({ className, size = 72 }: CircularLoadingIndicatorProps) {
  const h = (size * 104) / 100;
  return (
    <div
      className={cn("inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: h }}
      role="presentation"
      aria-hidden
    >
      <div
        className="h-full w-full origin-center animate-spin motion-reduce:animate-none"
        style={{
          animationDuration: "0.9s",
          animationTimingFunction: "linear",
          willChange: "transform",
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 104"
          xmlns="http://www.w3.org/2000/svg"
          className="block"
          fill="none"
        >
          <g strokeLinecap="round">
            <circle cx="50" cy="50" r="44" stroke="#E8704A" strokeWidth="5" strokeDasharray="180 96" />
            <circle
              cx="50"
              cy="50"
              r="33"
              stroke="#F0A58A"
              strokeWidth="5"
              strokeDasharray="130 77"
              strokeDashoffset="30"
            />
            <circle
              cx="50"
              cy="50"
              r="22"
              stroke="#F5C8B4"
              strokeWidth="4"
              strokeDasharray="80 58"
              strokeDashoffset="15"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
