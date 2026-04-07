"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronRight, Grid3x3, Package, X } from "lucide-react";
import {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  buildProductCardImageSrc,
  CATEGORY_ICON_MAX_PX,
  productCardBlurDataUrl,
} from "@/lib/images/product-image-url";
import { cn } from "@/lib/utils";
import { childCategoryHref, parentCategoryHref } from "@/lib/utils/category-href";
import { isSafeImageUrlForAttr } from "@/lib/utils/safe-image-url";
import type { CatalogCategoryParent } from "@/types/catalog-menu";

const CategoryIconBlur = productCardBlurDataUrl(undefined);

const CategoryGlyph = memo(function CategoryGlyph({
  iconUrl,
  className,
}: {
  iconUrl: string | null;
  className?: string;
}) {
  const t = iconUrl?.trim() ?? "";
  const optimizedSrc = useMemo(
    () => (t && isSafeImageUrlForAttr(t) ? buildProductCardImageSrc(t, CATEGORY_ICON_MAX_PX) : null),
    [t],
  );

  if (optimizedSrc) {
    return (
      <span
        className={cn(
          "relative block h-6 w-6 shrink-0 [&_img]:!object-contain",
          className,
        )}
      >
        <Image
          src={optimizedSrc}
          alt=""
          width={24}
          height={24}
          sizes="24px"
          className="box-border object-contain object-center"
          style={{ objectFit: "contain" }}
          loading="lazy"
          fetchPriority="low"
          placeholder="blur"
          blurDataURL={CategoryIconBlur}
          decoding="async"
        />
      </span>
    );
  }
  return <Package className={cn("h-4 w-4 shrink-0 text-primary", className)} aria-hidden />;
});

type CatalogMegaMenuProps = {
  parents: CatalogCategoryParent[];
};

export function CatalogMegaMenu({ parents }: CatalogMegaMenuProps) {
  const menuId = useId();
  const menuTitleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mobileModal, setMobileModal] = useState(false);
  const [activeParentId, setActiveParentId] = useState<string | null>(() => parents[0]?.id ?? null);

  const closeMenu = useCallback(() => {
    setOpen(false);
    queueMicrotask(() => triggerRef.current?.focus());
  }, []);

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

  useEffect(() => {
    if (!open) {
      setMobileModal(false);
      return;
    }
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setMobileModal(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [open]);

  useEffect(() => {
    if (!open || !mobileModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, mobileModal]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeMenu();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeMenu]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent | PointerEvent) {
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) closeMenu();
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open, closeMenu]);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => dialogRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  const hasTree = parents.length > 0;

  return (
    <div ref={rootRef} className="relative z-40 min-w-0 shrink-0">
      <button
        ref={triggerRef}
        type="button"
        className="flex items-center gap-1.5 rounded-md py-2 text-primary outline-none ring-offset-2 transition-colors hover:text-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <Grid3x3 className="h-5 w-5 shrink-0" aria-hidden />
        <span className="text-[15px] font-medium uppercase tracking-tight">კატალოგი</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/25 transition-opacity duration-200 lg:hidden"
            aria-hidden
            onClick={closeMenu}
          />
          <div
            ref={dialogRef}
            id={menuId}
            role="dialog"
            aria-modal={mobileModal}
            aria-labelledby={menuTitleId}
            tabIndex={-1}
            className={cn(
              "fixed inset-x-0 bottom-0 top-24 z-[70] flex max-h-[min(85dvh,calc(100vh-6rem))] flex-col overflow-hidden rounded-t-2xl border border-orange-100 bg-white shadow-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 animate-mega-in lg:absolute lg:inset-auto lg:left-0 lg:top-full lg:mt-2 lg:h-[min(28rem,calc(100vh-8rem))] lg:max-h-none lg:w-[min(calc(100vw-2rem),26rem)] lg:rounded-xl lg:shadow-xl",
            )}
          >
            <h2 id={menuTitleId} className="sr-only">
              პროდუქტების კატალოგი
            </h2>

            <div className="flex items-center justify-between border-b border-orange-100 px-4 py-3 lg:hidden">
              <span className="text-sm font-semibold text-primary" aria-hidden>
                კატალოგი
              </span>
              <button
                type="button"
                className="rounded-md p-2 text-primary hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={closeMenu}
                aria-label="დახურვა"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            {!hasTree ? (
              <div className="flex flex-1 flex-col justify-center gap-3 p-6 text-center">
                <p className="text-sm text-muted-foreground" role="status">
                  კატეგორიები მალე დაემატება.
                </p>
                <Link
                  href="/products"
                  className="text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={closeMenu}
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
                    {parents.map((p) => {
                      const href = parentCategoryHref(p.slug);
                      return (
                        <div
                          key={p.id}
                          className={cn(
                            "flex w-full items-center justify-between gap-1 border-b border-[#ff5607] px-2 py-0 text-left text-[15px] text-primary transition-colors focus-within:bg-orange-50",
                            activeParentId === p.id && "bg-orange-50",
                          )}
                          onMouseEnter={() => setActiveParentId(p.id)}
                        >
                          <Link
                            href={href}
                            className={cn(
                              "flex min-w-0 flex-1 items-center gap-0 rounded-md px-0 py-0 text-left text-[15px] font-normal text-primary transition-colors hover:bg-transparent hover:font-semibold focus-visible:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                            )}
                            onFocus={() => setActiveParentId(p.id)}
                          >
                            <CategoryGlyph iconUrl={p.icon} />
                            <span className="truncate px-3 py-1.5">{p.name}</span>
                          </Link>
                          <ChevronRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                        </div>
                      );
                    })}
                  </nav>

                  <div
                    key={activeParent?.id ?? "none"}
                    className="hidden min-h-0 flex-col overflow-y-auto no-scrollbar bg-white p-1 animate-mega-panel lg:flex"
                  >
                    {activeParent ? (
                      <SubcategoryPanel parent={activeParent} onNavigate={closeMenu} />
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
                        <SubcategoryPanel parent={p} onNavigate={closeMenu} nested />
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
            !nested && "border border-orange-100",
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
      className={cn("flex flex-col divide-y divide-[#ff5607]", nested ? "py-1" : "py-2")}
      aria-label={`${parent.name} — ქვეკატეგორიები`}
    >
      {parent.children.map((c) => (
        <li key={c.id} className="min-w-0">
          <Link
            href={childCategoryHref(parent.slug, c.slug)}
            className="block min-w-0 px-3 py-1.5 text-sm font-normal text-primary transition-colors hover:bg-transparent hover:font-semibold focus-visible:bg-orange-50 focus-visible:outline-none"
            onClick={onNavigate}
          >
            {c.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}