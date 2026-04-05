import Link from "next/link";
import { Facebook, Gem, Linkedin, MapPin, Settings, Sun } from "lucide-react";

import { getCatalogMenuTree } from "@/lib/supabase/categories";
import { childCategoryHref, parentCategoryHref } from "@/lib/utils/category-href";
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
          <div className="flex w-full max-w-xs flex-col items-center gap- sm:max-w-none sm:items-start">
            <div className="flex gap-3" role="list">
              {SOCIAL.map(({ href, label, Icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-500 text-white transition-transform hover:scale-105 hover:bg-orange-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#374151]"
                  aria-label={label}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                </a>
              ))}
            </div>
            <Link
              href="/sitemap.xml"
              className="text-sm text-slate-400 underline-offset-2 hover:text-white hover:underline"
            >
              საიტის რუკა
            </Link>
            <ul className="flex flex-col gap-2">
              {legalLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-xs text-slate-400 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-auto pt-2 text-xs leading-relaxed text-slate-500">
              Copyright © {new Date().getFullYear()} Baba.ge. ყველა უფლება დაცულია.
            </p>
          </div>

          {/* 2 — chat + address */}
          <div className="flex w-full max-w-xs flex-col gap-4 sm:max-w-none">
            <Link
              href="/contact"
              className="text-xs font-bold  text-white underline-offset-2 transition-colors hover:text-orange-100 hover:underline"
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
          <div className="flex w-full max-w-xs flex-col gap-6 sm:max-w-none">
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
          <div className="flex w-full max-w-xs flex-col gap-4 sm:max-w-none">
            <Link href="/miwodebis-pirobebi" className="text-xs font-bold text-white">უფასო მიწოდება</Link>
            <div className="flex flex-col gap-1">
              <Link href="/onlain-ganvadeba" className="text-xs font-bold text-white">საბანკო განვადება</Link>
              <p className="mt-1 text-sm text-slate-400">0% განაკვეთი 3 თვემდე</p>
            </div>
            <div className="flex flex-col gap-1">
              <Link href="/sagarantio-pirobebi" className="text-xs font-bold text-white">90 დღიანი დაბრუნება</Link>
              <p className="mt-1 text-sm text-slate-400">პრობლემურ პროდუქტებზე</p>
            </div>
          </div>
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

  return (
    <section className="flex flex-col gap-0 font-heading" aria-labelledby={`footer-cat-${parent.id}`}>
      <h3
        id={`footer-cat-${parent.id}`}
        className="inline-block max-w-full self-start border-b-2 mb-2 border-orange-500 pb-1.5 text-sm font-normal leading-tight text-white"
      >
        <Link href={parentHref} className="transition-colors  hover:text-orange-50">
          {parent.name}
        </Link>
      </h3>

      {parent.children.length > 0 ? (
        <ul className="flex flex-col gap-0">
          {parent.children.slice(0, 4).map((c) => (
            <li key={c.id}>
              <Link
                href={childCategoryHref(parent.slug, c.slug)}
                className="text-[13px] font-heading text-white transition-colors hover:text-white"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <Link
        href={parentHref}
        className="mt-1 text-xs font-heading font-semibold text-white underline decoration-white underline-offset-4 transition-colors hover:text-orange-100"
      >
        ყველას ნახვა
      </Link>
    </section>
  );
}

export async function Footer() {
  const parents = (await loadCategories()).filter((p) => p.children.length > 0);

  return (
    <footer className="mt-auto bg-[#2d3748] text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        {parents.length > 0 ? (
          <nav aria-label="კატეგორიები" className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-12">
            {parents.map((parent) => (
              <CategoryColumn key={parent.id} parent={parent} />
            ))}
          </nav>
        ) : null}
      </div>

      <FooterBottomStrip />
    </footer>
  );
}
