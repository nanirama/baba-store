"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PER_PAGE_OPTIONS = [25, 50, 100, 200] as const;

export type ProductsGridToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  perPage: number;
  onPerPageChange: (value: number) => void;
};

export function ProductsGridToolbar({ search, onSearchChange, perPage, onPerPageChange }: ProductsGridToolbarProps) {
  return (
    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end sm:justify-end sm:gap-3">
      <div className="min-w-0 flex-1 sm:max-w-xs">
        <Label htmlFor="products-grid-search" className="mb-1.5 block text-xs font-medium text-slate-600">
          Search
        </Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <Input
            id="products-grid-search"
            type="search"
            placeholder="Name, SKU, slug, status…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 border-slate-200 bg-white pl-9 shadow-sm placeholder:text-slate-400 focus-visible:ring-[#ff5100]/25"
            autoComplete="off"
          />
        </div>
      </div>
      <div className="w-full sm:w-[120px]">
        <Label htmlFor="products-grid-per-page" className="mb-1.5 block text-xs font-medium text-slate-600">
          Per page
        </Label>
        <select
          id="products-grid-per-page"
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-[#ff5100] focus:ring-2 focus:ring-[#ff5100]/20"
        >
          {PER_PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
