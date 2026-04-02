import Image from "next/image";
import Link from "next/link";

import { CatalogMegaMenu } from "@/components/Common/catalog-mega-menu";
import { HeaderSearchForm } from "@/components/Common/HeaderSearchForm";
import {
  headerMobileScrollLinks,
  headerTopCenterLink,
  headerTopLeftLinks,
  headerTopRightLinks,
} from "@/components/Common/header-links";
import { getCatalogMenuTree } from "@/lib/supabase/categories";
import type { CatalogCategoryParent } from "@/types/catalog-menu";

const TOP_BAR_CLASS =
  "bg-[#05141f] text-[12px] leading-tight text-white/95 sm:text-[13px]";

function TopBarLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="whitespace-nowrap underline-offset-2 transition-colors hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      {label}
    </Link>
  );
}

/** Desktop: three-column utility row. Mobile: single horizontal scroll (keyboard-accessible). */
function HeaderTopBar() {
  return (
    <>
      <div className={`${TOP_BAR_CLASS} hidden lg:block`}>
        <div className="mx-auto grid max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
          <nav aria-label="სერვისები" className="justify-self-start">
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {headerTopLeftLinks.map((item) => (
                <li key={item.href}>
                  <TopBarLink href={item.href} label={item.label} />
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex flex-row gap-2 items-center justify-end">
            <nav aria-label="კონფიდენციალურობა" className="justify-self-center px-2">
              <TopBarLink href={headerTopCenterLink.href} label={headerTopCenterLink.label} />

            </nav>
            <nav aria-label="განვადება და მიწოდება" className="justify-self-end">
              <ul className="flex flex-wrap justify-end gap-x-4 gap-y-1">
                {headerTopRightLinks.map((item) => (
                  <li key={item.href}>
                    <TopBarLink href={item.href} label={item.label} />
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <Link href="/contact" className="flex justify-end">
            <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21.0039 12C21.0039 16.9706 16.9745 21 12.0039 21C9.9675 21 3.00463 21 3.00463 21C3.00463 21 4.56382 17.2561 3.93982 16.0008C3.34076 14.7956 3.00391 13.4372 3.00391 12C3.00391 7.02944 7.03334 3 12.0039 3C16.9745 3 21.0039 7.02944 21.0039 12Z" stroke="#F15A24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>

      <div
        className={`${TOP_BAR_CLASS} lg:hidden`}
        role="region"
        aria-label="სწრაფი ბმულები"
      >
        <nav
          className="mx-auto flex max-w-[1440px] snap-x snap-mandatory gap-x-4 overflow-x-auto px-4 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden"
          aria-label="სწრაფი ნავიგაცია"
        >
          {headerMobileScrollLinks.map((item) => (
            <TopBarLink key={`${item.href}-${item.label}`} href={item.href} label={item.label} />
          ))}
        </nav>
      </div>
    </>
  );
}

async function loadCatalogParents(): Promise<CatalogCategoryParent[]> {
  try {
    return await getCatalogMenuTree();
  } catch {
    return [];
  }
}

export async function Header() {
  const catalogParents = await loadCatalogParents();

  return (
    <header className="sticky top-0 z-50 overflow-visible">
      <HeaderTopBar />

      <div className="overflow-visible border-b border-border/80 bg-white shadow-sm">
        <div className="mx-auto max-w-[1440px] overflow-visible px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 overflow-visible lg:flex-row lg:items-center lg:gap-6">
            <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-4 lg:justify-start lg:gap-5">
              <Link href="/" className="relative inline-flex shrink-0">
                <Image
                  src="/images/logo.webp"
                  alt="Baba.ge"
                  width={150}
                  height={66}
                  priority
                  sizes="(max-width: 640px) 126px, (max-width: 1024px) 126px"
                  className="h-[56px] w-auto "
                />
              </Link>
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <CatalogMegaMenu parents={catalogParents} />
                <Link
                  href="/auth/login"
                  className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
                >
                  შესვლა
                </Link>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row justify-end sm:items-center lg:gap-4">
              <HeaderSearchForm />
              {/* <Link
                href="/auth/login"
                className="hidden whitespace-nowrap rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-center text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:inline-flex"
              >
                შესვლა
              </Link> */}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
