import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { BaseLayout } from "@/components/Common/BaseLayout";
import { getStorefrontChildCategoryBySlugs } from "@/lib/supabase/categories";
import { childCategoryHref, isReservedRootSlug, parentCategoryHref } from "@/lib/utils/category-href";

type PageProps = {
  params: Promise<{ segment: string; child: string }>;
};

function descriptionToText(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "text" in v) {
    const t = (v as { text?: unknown }).text;
    if (typeof t === "string") return t;
  }
  return undefined;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { segment, child } = await params;
  if (isReservedRootSlug(segment)) return {};
  const row = await getStorefrontChildCategoryBySlugs(segment, child);
  if (!row) return { title: "კატეგორია" };
  const descriptionText = descriptionToText(row.child.description);
  return {
    title: `${row.child.name} | Baba.ge`,
    description: descriptionText,
    alternates: {
      canonical: childCategoryHref(segment, child),
    },
  };
}

export default async function ChildCategoryPage({ params }: PageProps) {
  const { segment, child } = await params;

  if (isReservedRootSlug(segment)) {
    notFound();
  }

  const row = await getStorefrontChildCategoryBySlugs(segment, child);
  if (!row) {
    notFound();
  }

  const { parent, child: childCat } = row;

  return (
    <BaseLayout>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-muted-foreground" aria-label="ბრედკრამბი">
          <Link href="/" className="hover:text-primary">
            მთავარი
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <Link href={parentCategoryHref(parent.slug)} className="hover:text-primary">
            {parent.name}
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <span className="text-foreground">{childCat.name}</span>
        </nav>
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {childCat.name}
        </h1>
        {descriptionToText(childCat.description) ? (
          <p className="mt-4 text-lg text-muted-foreground">{descriptionToText(childCat.description)}</p>
        ) : null}
        <p className="mt-8 text-sm text-muted-foreground">
          პროდუქტების სია მალე გამოჩნდება ამ კატეგორიისთვის.
        </p>
      </div>
    </BaseLayout>
  );
}
