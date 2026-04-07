import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ProductSuggestion = {
  id: string;
  slug: string;
  name: string;
  sku: string | null;
  model: string | null;
};

function sanitizeTerm(termRaw: string): string {
  return termRaw
    .replace(/[,%()[\]]/g, " ")
    .replace(/[%_]/g, "")
    .trim()
    .slice(0, 120);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const qRaw = url.searchParams.get("q") ?? "";
  const q = sanitizeTerm(qRaw);

  if (q.length < 2) {
    return NextResponse.json({ results: [] as ProductSuggestion[] });
  }

  const pattern = `%${q}%`;
  const supabase = createAdminClient();

  // Search across the most common identifiers:
  // - name
  // - sku
  // - model
  const orFilter = `name.ilike.${pattern},sku.ilike.${pattern},model.ilike.${pattern}`;

  const { data, error } = await supabase
    .from("products")
    .select("id,slug,name,sku,model")
    .or(orFilter)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    // Autocomplete should never break the header; return no results on errors.
    return NextResponse.json({ results: [] as ProductSuggestion[] });
  }

  return NextResponse.json({ results: (data ?? []) as ProductSuggestion[] });
}

