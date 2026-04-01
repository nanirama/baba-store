"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight, Grid3x3, Package, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";
import { childCategoryHref, parentCategoryHref } from "@/lib/utils/category-href";
import { isSafeImageUrlForAttr } from "@/lib/utils/safe-image-url";
import type { CatalogCategoryParent } from "@/types/catalog-menu";

type CatalogMegaMenuProps = {
  parents: CatalogCategoryParent[];
};

function CategoryGlyph({ iconUrl, className }: { iconUrl: string | null; className?: string }) {
  const t = iconUrl?.trim() ?? "";
  const safe = Boolean(t && isSafeImageUrlForAttr(t));
  if (safe) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- admin-supplied small icon URL; validated above
      <img
        src={t}
        alt=""
        width={24}
        height={24}
        className={cn("h-6 w-6 shrink-0 object-contain", className)}
        loading="lazy"
        decoding="async"
      />
    );
  }
  return (
    <Package className={cn("h-4 w-4 shrink-0 text-primary", className)} aria-hidden />
  );
}

export function CatalogMegaMenu({ parents }: CatalogMegaMenuProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeParentId, setActiveParentId] = useState<string | null>(() => parents[0]?.id ?? null);

  useEffect(() => {
    if (parents.length === 0) {
      setActiveParentId(null);
      return;
    }
    setActiveParentId((prev) => {
      if (prev && parents.some((p) => p.id === prev)) return prev;
      return parents[0].id;
    });
  }, [parents]);

  const activeParent = parents.find((p) => p.id === activeParentId) ?? parents[0] ?? null;

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent | PointerEvent) {
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) close();
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(max-width: 1023px)");
    if (!mq.matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const hasTree = parents.length > 0;

  return (
    <div ref={rootRef} className="relative z-40 min-w-0 shrink-0">
      <button
        type="button"
        className="flex items-center  gap-1.5 rounded-md py-2 text-primary outline-none ring-offset-2 transition-colors hover:text-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <Grid3x3 className="h-5 w-5 shrink-0" aria-hidden />
        <span className="text-[15px] font-medium tracking-tight ">კატალოგი</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/25 transition-opacity duration-200 lg:hidden"
            aria-hidden
            onClick={close}
          />
          <div
            id={menuId}
            role="dialog"
            aria-label="პროდუქტების კატალოგი"
            className={cn(
              "fixed inset-x-0 bottom-0 top-24 z-[70] flex max-h-[min(85dvh,calc(100vh-6rem))] flex-col overflow-hidden rounded-t-2xl border border-orange-100 bg-white shadow-2xl animate-mega-in lg:absolute lg:inset-auto lg:left-0 lg:top-full lg:mt-2 lg:h-[min(28rem,calc(100vh-8rem))] lg:max-h-none lg:w-[min(calc(100vw-2rem),26rem)] lg:rounded-xl lg:shadow-xl"
            )}
          >
            <div className="flex items-center justify-between border-b border-orange-100 px-4 py-3 lg:hidden">
              <span className="text-sm font-semibold text-primary">კატალოგი</span>
              <button
                type="button"
                className="rounded-md p-2 text-primary hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={close}
                aria-label="დახურვა"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            {!hasTree ? (
              <div className="flex flex-1 flex-col justify-center gap-3 p-6 text-center">
                <p className="text-sm text-muted-foreground">კატეგორიები მალე დაემატება.</p>
                <Link
                  href="/products"
                  className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
                  onClick={close}
                >
                  ყველა პროდუქტი
                </Link>
              </div>
            ) : (
              <>
                <div className="hidden min-h-0 flex-1 lg:grid lg:min-h-[18rem] lg:grid-cols-2 lg:divide-x lg:divide-orange-100">
                  <nav
                    className="flex min-h-0 flex-col overflow-y-auto no-scrollbar border-b border-orange-100 lg:border-b-0"
                    aria-label="ძირითადი კატეგორიები"
                  >
                    {/* <Link
                      href="/products"
                      className="flex items-center gap-3 border-b border-orange-100 px-4 py-3.5 text-sm font-semibold text-primary transition-colors hover:bg-orange-50/90 focus-visible:bg-orange-50 focus-visible:outline-none"
                      onClick={close}
                    >
                      <Grid3x3 className="h-6 w-6 shrink-0 text-primary" aria-hidden />
                      ყველა პროდუქტი
                      <ChevronRight className="ml-auto h-4 w-4 shrink-0 opacity-70" aria-hidden />
                    </Link> */}
                    {parents.map((p) => {
                      const href = parentCategoryHref(p.slug);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          className={cn(
                            "flex w-full items-center gap-1 border-b border-[#ff5607] px-2 py-0 text-left text-[15px] justify-between font-normal hover:font-semibold hover:bg-transparent text-primary transition-colors focus-visible:bg-orange-50 focus-visible:outline-none",
                            activeParentId === p.id && "bg-orange-50"
                          )}
                          onMouseEnter={() => setActiveParentId(p.id)}
                          onFocus={() => setActiveParentId(p.id)}
                        >
                          <div className="flex flex-row gap-0 items-center">
                            <CategoryGlyph iconUrl={p.icon} />
                            <Link
                              href={href ?? '#'}
                              className={cn(
                                "rounded-md px-3 py-1.5 text-[15px] font-normal hover:font-semibold text-primary transition-colors hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",

                              )}
                            >{p.name}</Link>
                          </div>
                          {/* <span className="min-w-0 flex-1 truncate">{p.name}222</span> */}
                          <ChevronRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                        </button>
                      )
                    })}
                  </nav>

                  <div
                    key={activeParent?.id ?? "none"}
                    className="hidden min-h-0 flex-col overflow-y-auto no-scrollbar bg-white p-1 animate-mega-panel lg:flex"
                  >
                    {activeParent ? (
                      <SubcategoryPanel parent={activeParent} onNavigate={close} />
                    ) : null}
                  </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:hidden">

                  {parents.map((p) => (
                    <details
                      key={p.id}
                      className="group border-b border-orange-100 last:border-b-0"
                    >
                      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 text-sm font-semibold text-primary marker:content-none [&::-webkit-details-marker]:hidden">
                        <CategoryGlyph iconUrl={p.icon} />
                        <span className="min-w-0 flex-1">{p.name}</span>
                        <ChevronRight
                          className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90"
                          aria-hidden
                        />
                      </summary>
                      <div className="border-t border-orange-50 bg-orange-50/30 px-2 pb-2 pt-1">
                        <SubcategoryPanel parent={p} onNavigate={close} nested />
                      </div>
                    </details>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SubcategoryPanel({
  parent,
  onNavigate,
  nested,
}: {
  parent: CatalogCategoryParent;
  onNavigate: () => void;
  nested?: boolean;
}) {
  const href = parentCategoryHref(parent.slug);

  if (parent.children.length === 0) {
    return (
      <div className={cn("flex flex-col", nested ? "gap-1" : "h-full justify-center p-4")}>
        <Link
          href={href}
          className={cn(
            "rounded-md px-3 py-2.5 text-[15px] font-normal text-primary transition-colors hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            !nested && "border border-orange-100"
          )}
          onClick={onNavigate}
        >
          {parent.name} — ყველა პროდუქტი
        </Link>
      </div>
    );
  }

  return (
    <ul
      className={cn(
        "flex flex-col divide-y divide-[#ff5607]",
        nested ? "py-1" : "py-2"
      )}
    >
      {/* <li>
        <Link
          href={href}
          className="flex items-center gap-2 px-3 py-3 text-sm font-semibold text-primary transition-colors hover:bg-orange-50 focus-visible:bg-orange-50 focus-visible:outline-none"
          onClick={onNavigate}
        >
          <ChevronRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
          ყველას ნახვა — {parent.name} 2563
        </Link>
      </li> */}
      {parent.children.map((c) => (
        <li key={c.id}>
          <Link
            href={childCategoryHref(parent.slug, c.slug)}
            className="block px-3 py-1.5 text-sm font-normal hover:font-semibold text-primary transition-colors hover:bg-transparent focus-visible:bg-orange-50 focus-visible:outline-none"
            onClick={onNavigate}
          >
            {c.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
