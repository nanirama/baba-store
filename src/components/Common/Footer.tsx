import Link from "next/link";
import { Facebook, Gem, Linkedin, MapPin, Settings, Sun } from "lucide-react";

import { getCatalogMenuTree } from "@/lib/supabase/categories";
import { childCategoryHref, parentCategoryHref } from "@/lib/utils/category-href";
import { cn } from "@/lib/utils";
import type { CatalogCategoryParent } from "@/types/catalog-menu";

/** Same targets as organization schema in `app/layout.tsx`; replace with env URLs when available. */
const SOCIAL = [
  { href: "https://www.facebook.com/www.baba.ge", label: "Facebook", Icon: Facebook },
  { href: "https://www.linkedin.com/company/babe-ge/", label: "LinkedIn", Icon: Linkedin },
] as const;

const legalLinks = [
  { href: "/cesebi-da-pirobebi-929323138", label: "წესები და პირობები" },
  { href: "/privacy-policy", label: "პირადი ინფორმაციის დაცვა" },
];

const linkFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 rounded-sm";

function StarRow() {
  return (
    <span className="flex justify-center gap-0.5 text-amber-400 sm:justify-start" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className="text-sm leading-none">
          ★
        </span>
      ))}
    </span>
  );
}

function FooterBottomStrip() {
  return (
    <div className="border-t border-slate-600/60 bg-[#374151]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid grid-cols-1 justify-items-center gap-10 text-center sm:grid-cols-2 sm:justify-items-stretch sm:text-left lg:grid-cols-4 lg:gap-8">
          {/* 1 — social, sitemap, legal, copyright */}
          <div className="flex w-full max-w-xs min-w-0 flex-col items-center gap-4 sm:max-w-none sm:items-start">
            <nav aria-label="სოციალური ქსელები">
              <ul className="flex flex-wrap justify-center gap-3 sm:justify-start">
                {SOCIAL.map(({ href, label, Icon }) => (
                  <li key={href}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-full bg-orange-500 text-white transition-transform hover:scale-105 hover:bg-orange-400",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#374151]",
                      )}
                      aria-label={label}
                    >
                      <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="სერვისები და იურიდიული ინფორმაცია" className="flex w-full min-w-0 flex-col items-center gap-3 sm:items-start">
              <Link
                href="/sitemap.xml"
                className={cn(
                  "text-sm text-slate-400 underline-offset-2 transition-colors hover:text-white hover:underline",
                  linkFocus,
                  "focus-visible:ring-offset-[#374151]",
                )}
              >
                საიტის რუკა
              </Link>
              <ul className="flex flex-col gap-2">
                {legalLinks.map((item) => (
                  <li key={item.href} className="min-w-0">
                    <Link
                      href={item.href}
                      className={cn(
                        "text-xs text-slate-400 transition-colors hover:text-white",
                        linkFocus,
                        "focus-visible:ring-offset-[#374151]",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <p
              className="mt-auto pt-2 text-xs leading-relaxed text-slate-500"
              suppressHydrationWarning
            >
              Copyright © {new Date().getFullYear()} Baba.ge. ყველა უფლება დაცულია.
            </p>
          </div>

          {/* 2 — chat + address */}
          <div className="flex w-full max-w-xs min-w-0 flex-col gap-4 sm:max-w-none">
            <Link
              href="/contact"
              className={cn(
                "text-xs font-bold text-white underline-offset-2 transition-colors hover:text-orange-100 hover:underline",
                linkFocus,
                "focus-visible:ring-offset-[#374151]",
              )}
            >
              ონლაინ ჩატი
            </Link>
            <div>
              <p className="text-xs font-bold text-white">მისამართი</p>
              <address className="mt-2 text-xs not-italic leading-relaxed text-slate-400">
                ი. ჭავჭავაძის გამზ. 55, თბილისი 0162
              </address>
            </div>
          </div>

          {/* 3 — trust + utility icons */}
          <div className="flex w-full max-w-xs min-w-0 flex-col gap-6 sm:max-w-none">
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-6 lg:flex-col">
              <div className="flex flex-col items-center gap-1 sm:items-start">
                <span className="text-sm font-semibold tracking-tight text-white">Google</span>
                <StarRow />
              </div>
              <div className="flex flex-col items-center gap-1 sm:items-start">
                <span className="text-sm font-semibold tracking-tight text-white">Facebook</span>
                <StarRow />
              </div>
            </div>
            <div
              className="flex flex-wrap justify-center gap-4 text-orange-500 sm:justify-start"
              aria-hidden
            >
              <Gem className="h-7 w-7" strokeWidth={1.75} />
              <MapPin className="h-7 w-7" strokeWidth={1.75} />
              <Sun className="h-7 w-7" strokeWidth={1.75} />
              <Settings className="h-7 w-7" strokeWidth={1.75} />
            </div>
          </div>

          {/* 4 — service highlights */}
          <nav
            aria-label="მიწოდება და სერვისები"
            className="flex w-full max-w-xs min-w-0 flex-col gap-4 sm:max-w-none"
          >
            <Link
              href="/miwodebis-pirobebi"
              className={cn(
                "text-xs font-bold text-white transition-colors hover:text-orange-100",
                linkFocus,
                "focus-visible:ring-offset-[#374151]",
              )}
            >
              უფასო მიწოდება
            </Link>
            <div className="flex flex-col gap-1">
              <Link
                href="/onlain-ganvadeba"
                className={cn(
                  "text-xs font-bold text-white transition-colors hover:text-orange-100",
                  linkFocus,
                  "focus-visible:ring-offset-[#374151]",
                )}
              >
                საბანკო განვადება
              </Link>
              <p className="mt-1 text-sm text-slate-400">0% განაკვეთი 3 თვემდე</p>
            </div>
            <div className="flex flex-col gap-1">
              <Link
                href="/sagarantio-pirobebi"
                className={cn(
                  "text-xs font-bold text-white transition-colors hover:text-orange-100",
                  linkFocus,
                  "focus-visible:ring-offset-[#374151]",
                )}
              >
                90 დღიანი დაბრუნება
              </Link>
              <p className="mt-1 text-sm text-slate-400">პრობლემურ პროდუქტებზე</p>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}

async function loadCategories(): Promise<CatalogCategoryParent[]> {
  try {
    return await getCatalogMenuTree();
  } catch {
    return [];
  }
}

function CategoryColumn({ parent }: { parent: CatalogCategoryParent }) {
  const parentHref = parentCategoryHref(parent.slug);
  const headingId = `footer-cat-${parent.id}`;
  const linkClass = cn(
    "transition-colors hover:text-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2d3748] rounded-sm",
  );
  const childClass = cn(
    "text-[13px] font-heading text-white transition-colors hover:text-white",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2d3748] rounded-sm",
  );

  return (
    <section className="flex min-w-0 flex-col gap-0 font-heading" aria-labelledby={headingId}>
      <h3
        id={headingId}
        className="mb-2 inline-block max-w-full self-start border-b-2 border-orange-500 pb-1.5 text-sm font-normal leading-tight text-white"
      >
        <Link href={parentHref} className={cn("min-w-0 max-w-full", linkClass)}>
          <span className="break-words">{parent.name}</span>
        </Link>
      </h3>

      {parent.children.length > 0 ? (
        <ul className="flex flex-col gap-0">
          {parent.children.slice(0, 4).map((c) => (
            <li key={c.id} className="min-w-0 py-0">
              <Link href={childCategoryHref(parent.slug, c.slug)} className={cn("block min-w-0 break-words", childClass)}>
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <Link href={parentHref} className={cn("mt-1 text-xs font-heading font-semibold text-white underline decoration-white underline-offset-4 transition-colors hover:text-orange-100", linkClass)}>
        ყველას ნახვა
      </Link>
    </section>
  );
}

export async function Footer() {
  const parents = (await loadCategories()).filter((p) => p.children.length > 0);

  return (
    <footer id="site-footer" className="mt-auto min-w-0 bg-[#2d3748] text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        {parents.length > 0 ? (
          <nav
            aria-label="კატეგორიები"
            className="grid min-w-0 grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-12"
          >
            {parents.map((p) => (
              <CategoryColumn key={p.id} parent={p} />
            ))}
          </nav>
        ) : null}
      </div>

      <FooterBottomStrip />
    </footer>
  );
}
