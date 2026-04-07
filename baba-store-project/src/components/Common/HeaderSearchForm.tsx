"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type ProductSuggestion = {
  id: string;
  slug: string;
  name: string;
  sku: string | null;
  model: string | null;
};

function formatSuggestion(s: ProductSuggestion): string {
  const parts = [s.sku, s.model].filter((x): x is string => Boolean(x && x.trim().length > 0));
  if (parts.length === 0) return s.name;
  return `${s.name} — ${parts.slice(0, 2).join(" / ")}`;
}

export function HeaderSearchForm() {
  const router = useRouter();
  const rootRef = useRef<HTMLFormElement | null>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ProductSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const apiQ = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    function onDocumentMouseDown(e: MouseEvent) {
      const el = rootRef.current;
      if (!el) return;
      const target = e.target as Node | null;
      if (target && el.contains(target)) return;
      setOpen(false);
      setActiveIndex(-1);
    }

    document.addEventListener("mousedown", onDocumentMouseDown);
    return () => document.removeEventListener("mousedown", onDocumentMouseDown);
  }, []);

  useEffect(() => {
    const q = apiQ;

    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    const controller = new AbortController();
    const handle = window.setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/autocomplete?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const json = (await res.json()) as { results?: ProductSuggestion[] };
        setResults(json.results ?? []);
        setOpen(true);
        setActiveIndex((prev) => (json.results && json.results.length > 0 ? Math.min(Math.max(prev, 0), json.results.length - 1) : -1));
      } catch {
        if (controller.signal.aborted) return;
        setResults([]);
        setOpen(false);
        setActiveIndex(-1);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(handle);
    };
  }, [apiQ]);

  function selectSuggestion(s: ProductSuggestion) {
    setOpen(false);
    setActiveIndex(-1);
    setResults([]);
    setQuery(s.name);
    router.push(`/products/${s.slug}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        selectSuggestion(results[activeIndex]);
      }
    }
  }

  const listboxId = "header-search-autocomplete-listbox";
  const activeDescendantId = activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined;

  return (
    <form
      ref={rootRef}
      action="/products"
      method="get"
      role="search"
      className="relative flex w-full min-w-0 flex-1 lg:max-w-sm justify-end"
      autoComplete="off"
    >
      <label htmlFor="site-search" className="sr-only">
        ძებნა საიტზე
      </label>

      <input
        id="site-search"
        name="q"
        type="search"
        maxLength={120}
        placeholder="ძებნა..."
        autoComplete="off"
        enterKeyHint="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(-1);
        }}
        onFocus={() => {
          if (apiQ.length >= 2 && results.length > 0) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-controls={open ? listboxId : undefined}
        aria-expanded={open}
        aria-activedescendant={open ? activeDescendantId : undefined}
        className="h-11 w-full min-w-0 px-4 rounded-lg border border-foreground/90 bg-white pr-12 text-base text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      />

      <button
        type="submit"
        className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="ძებნის გაშვება"
      >
        <Search className="h-5 w-5" aria-hidden />
      </button>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label="პროდუქტის ძებნის შედეგები"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-border/80 bg-white shadow-lg"
        >
          {loading ? (
            <div className="px-4 py-3 text-sm text-foreground/70">იტვირთება...</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-foreground/70">შედეგი ვერ მოიძებნა</div>
          ) : (
            <ul className="max-h-72 overflow-auto py-1">
              {results.map((s, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      id={`${listboxId}-option-${idx}`}
                      role="option"
                      aria-selected={isActive}
                      onClick={() => selectSuggestion(s)}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
                      }`}
                    >
                      <div className="truncate font-medium">{s.name}</div>
                      <div className="truncate text-xs text-foreground/65">
                        {s.sku ? `SKU: ${s.sku}` : s.model ? `Model: ${s.model}` : formatSuggestion(s)}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {apiQ.length >= 2 && results.length > 0 ? (
            <div className="border-t border-border/80 px-3 py-2">
              <button
                type="submit"
                className="w-full rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="ყველა შედეგის ნახვა"
              >
                ყველა შედეგის ნახვა
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}

