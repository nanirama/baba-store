"use server";

import "server-only";

import * as XLSX from "xlsx";
import { revalidateTag } from "next/cache";

import { requireRole } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/server";
import { htmlToTipTapJson } from "@/utils/html-to-tiptap";
import { slugify } from "@/utils/slug";

type BulkCategoriesResult = {
  success: boolean;
  message: string;
  imported: number;
  failed: number;
};

type CategoryUploadRow = {
  name: string;
  slug: string;
  category_id: number;
  parent_id: number;
  description: unknown | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  sort_order: number;
  status: string;
};

function headerAliases(key: string): string[] {
  const t = key.replace(/^\uFEFF/, "").trim();
  const lower = t.toLowerCase();
  const underscored = lower.replace(/\s+/g, "_");
  const spaced = lower.replace(/_/g, " ");
  return [...new Set([lower, underscored, spaced])];
}

function pick(row: Record<string, unknown>, ...variants: string[]): unknown {
  const aliasToOriginal = new Map<string, string>();
  for (const key of Object.keys(row)) {
    for (const a of headerAliases(key)) {
      if (!aliasToOriginal.has(a)) aliasToOriginal.set(a, key);
    }
  }
  for (const v of variants) {
    for (const va of headerAliases(v)) {
      const orig = aliasToOriginal.get(va);
      if (orig !== undefined) return row[orig];
    }
  }
  return undefined;
}

function asInt(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function asOptionalText(value: unknown): string | null {
  const s = String(value ?? "").trim();
  return s.length > 0 ? s : null;
}

function mapStatus(value: unknown): string {
  const s = String(value ?? "").trim().toLowerCase();
  if (s === "1") return "active";
  if (s === "0") return "inactive";
  if (s === "active" || s === "inactive") return s;
  return "active";
}

function normalizeRow(row: Record<string, unknown>): CategoryUploadRow {
  const name = String(pick(row, "name") ?? "").trim();
  const slugRaw = String(pick(row, "seo url 0", "seo_url_0", "slug") ?? "").trim();
  const slug = slugify(slugRaw || name);
  const descriptionRaw = String(pick(row, "description") ?? "").trim();

  return {
    name,
    slug,
    category_id: asInt(pick(row, "category id", "category_id"), 0),
    parent_id: asInt(pick(row, "parent id", "parent_id"), 0),
    description: descriptionRaw ? htmlToTipTapJson(descriptionRaw) : null,
    meta_title: asOptionalText(pick(row, "meta title", "meta_title")),
    meta_description: asOptionalText(pick(row, "meta description", "meta_description")),
    meta_keywords: asOptionalText(pick(row, "meta keywords", "meta_keywords")),
    sort_order: asInt(pick(row, "sort order", "sort_order"), 0),
    status: mapStatus(pick(row, "status")),
  };
}

function parseXlsx(buffer: ArrayBuffer): CategoryUploadRow[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
    defval: "",
    raw: false,
    blankrows: false,
  });

  return rows
    .map(normalizeRow)
    .filter((r) => r.name.length > 0 && r.slug.length > 0);
}

function dedupeBySlug(rows: CategoryUploadRow[]): { rows: CategoryUploadRow[]; duplicates: number } {
  // Keep last row for a slug (common in Excel edits).
  const bySlug = new Map<string, CategoryUploadRow>();
  let duplicates = 0;
  for (const row of rows) {
    const key = row.slug.trim().toLowerCase();
    if (bySlug.has(key)) duplicates += 1;
    bySlug.set(key, row);
  }
  return { rows: [...bySlug.values()], duplicates };
}

export async function processCategoriesBulkUploadAction(formData: FormData): Promise<BulkCategoriesResult> {
  await requireRole("user");

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, message: "Please upload an Excel file (.xlsx or .xls).", imported: 0, failed: 0 };
  }

  const lower = file.name.toLowerCase();
  if (!lower.endsWith(".xlsx") && !lower.endsWith(".xls")) {
    return {
      success: false,
      message: "Only Excel files (.xlsx, .xls) are supported.",
      imported: 0,
      failed: 0,
    };
  }

  try {
    const buffer = await file.arrayBuffer();
    const rows = parseXlsx(buffer);

    if (rows.length === 0) {
      return { success: false, message: "No valid rows found.", imported: 0, failed: 0 };
    }

    const deduped = dedupeBySlug(rows);

    const supabase = createAdminClient();
    const { error } = await supabase.from("categories").upsert(deduped.rows, { onConflict: "slug" });
    if (error) throw new Error(error.message);

    revalidateTag("categories", "max");
    revalidateTag("products", "max");

    return {
      success: true,
      message:
        deduped.duplicates > 0
          ? `Imported ${deduped.rows.length} categories. Skipped ${deduped.duplicates} duplicate slug row(s) from the file.`
          : `Imported ${deduped.rows.length} categories successfully.`,
      imported: deduped.rows.length,
      failed: 0,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Bulk upload failed",
      imported: 0,
      failed: 1,
    };
  }
}

