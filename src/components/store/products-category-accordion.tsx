"use client";

import Link from "next/link";
import { ChevronRight, Minus, Package, Plus } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { cn } from "@/lib/utils";
import { isSafeImageUrlForAttr } from "@/lib/utils/safe-image-url";
import type { CatalogCategoryParent } from "@/types/catalog-menu";
import { childCategoryHref, parentCategoryHref } from "@/lib/utils/category-href";

function CategoryGlyph({ iconUrl }: { iconUrl: string | null }) {
  const t = iconUrl?.trim() ?? "";
  if (t && isSafeImageUrlForAttr(t)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={t}
        alt=""
        width={22}
        height={22}
        className="h-5 w-5 shrink-0 object-contain opacity-90"
        loading="lazy"
        decoding="async"
      />
    );
  }
  return <Package className="h-5 w-5 shrink-0 text-gray-600" aria-hidden />;
}

/** Parent section should expand when this parent matches categorySlug, optionally with a child. */
function parentRowIsOpen(
  parent: CatalogCategoryParent,
  categorySlug?: string,
  childSlug?: string
): boolean {
  if (!categorySlug) return false;
  if (parent.slug !== categorySlug) return false;
  if (childSlug) return parent.children.some((c) => c.slug === childSlug);
  return true;
}

export function ProductsCategoryAccordion({
  parents,
  categorySlug,
  childSlug,
  linkMode = "products",
}: {
  parents: CatalogCategoryParent[];
  /** Top-level category slug (`/{categorySlug}`). */
  categorySlug?: string;
  /** Subcategory slug (`/{categorySlug}/{childSlug}`). */
  childSlug?: string;
  /** `root` → `/{slug}` storefront URLs; `products` → `/products/{slug}`. */
  linkMode?: "products" | "root";
}) {
  return (
    <nav className="px-2 py-4 sm:px-3 lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
      {/* <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        კატეგორიები
      </p> */}
      <div className="flex flex-col">
        {parents.map((p) => (
          <SidebarParent
            key={p.id}
            parent={p}
            categorySlug={categorySlug}
            childSlug={childSlug}
            linkMode={linkMode}
          />
        ))}
      </div>
    </nav>
  );
}

function SidebarParent({
  parent,
  categorySlug,
  childSlug,
  linkMode,
}: {
  parent: CatalogCategoryParent;
  categorySlug?: string;
  childSlug?: string;
  linkMode: "products" | "root";
}) {
  const baseId = useId();
  const panelId = `${baseId}-subcategories`;
  const parentHref =
    linkMode === "root"
      ? parentCategoryHref(parent.slug)
      : `/${encodeURIComponent(parent.slug)}`;
  const isOpenTarget = parentRowIsOpen(parent, categorySlug, childSlug);

  const [open, setOpen] = useState(isOpenTarget);

  useEffect(() => {
    setOpen(parentRowIsOpen(parent, categorySlug, childSlug));
  }, [parent, categorySlug, childSlug]);

  const parentOnlyActive = categorySlug === parent.slug && !childSlug;
  const showParentActiveStyle = parentOnlyActive || (categorySlug === parent.slug && !!childSlug);

  if (parent.children.length === 0) {
    return (
      <div className="bg-transparent">
        <Link
          href={parentHref}
          className={`flex items-center gap-3 py-3.5 pr-1 transition-colors hover:bg-transparent ${parentOnlyActive ? "bg-transparent" : ""
            }`}
        >
          <CategoryGlyph iconUrl={parent.icon} />
          <span className="flex-1 text-left text-sm font-medium text-gray-900">{parent.name}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-transparent">
      <div className="group flex items-center gap-0 py-1 pr-1">

        <Link
          href={parentHref}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-3 py-2 transition-colors hover:opacity-90 ",
            showParentActiveStyle && "rounded-md bg-transparent px-1"
          )}
        >
          <CategoryGlyph iconUrl={parent.icon} />
          <span className="text-left text-sm font-normal text-[#333333] group-hover:text-[#ff5607]">{parent.name}</span>
        </Link>
        <button
          type="button"
          className={cn(
            "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border text-[#333] group-hover:text-[#ff5607] transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            open ? "border-primary bg-primary text-white group-hover:border-[#ff5607]" : "border-[#333] group-hover:border-[#ff5607]"
          )}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={
            open
              ? `${parent.name} — ქვეკატეგორიების დახურვა`
              : `${parent.name} — ქვეკატეგორიების გახსნა`
          }
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <Minus className="h-3 w-3" aria-hidden /> : <Plus className="h-3 w-3" aria-hidden />}
        </button>
      </div>

      <div
        id={panelId}
        role="region"
        aria-label={parent.name}
        hidden={!open}
        className="border-t border-gray-100 bg-gray-50/90 px-2 py-2"
      >
        {/* <Link
          href={parentHref}
          className={`mb-2 block rounded-md px-3 py-2 text-sm font-semibold text-primary hover:bg-orange-50 ${parentOnlyActive ? "bg-orange-50" : ""
            }`}
        >
          ყველა — {parent.name}
        </Link> */}
        <ul className="space-y-0.5 pl-3">
          {parent.children.map((c) => {
            const childHref =
              linkMode === "root"
                ? childCategoryHref(parent.slug, c.slug)
                : `/${encodeURIComponent(parent.slug)}/${encodeURIComponent(c.slug)}`;
            const childActive = categorySlug === parent.slug && childSlug === c.slug;
            return (
              <li key={c.id}>
                <Link
                  href={childHref}
                  className={`flex items-start gap-2 py-1.5 text-sm text-gray-700 transition-colors hover:text-primary ${childActive ? "font-semibold text-primary" : ""
                    }`}
                >
                  <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
                  <span>{c.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
