"use server";

import "server-only";

import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/helpers";
import { parseCsv, parseXlsx, type BulkProductInput } from "@/utils/bulk-parser";
import { slugify } from "@/utils/slug";

/** Set to `true` to skip main_image + image1–3 fetch/upload (faster dry-run). */
const BULK_IMAGE_UPLOADS_DISABLED = false;

/**
 * Rows per `insert` request (DB only). Vercel serverless: ~500 keeps payloads modest
 * (memory/timeout); raise to 750–1000 on Pro if stable.
 */
const BULK_INSERT_BATCH_SIZE = Math.min(
  2000,
  Math.max(50, Number(process.env.BULK_INSERT_BATCH_SIZE ?? "500") || 500)
);

/**
 * Used only with `BULK_URL_ONLY_IMAGES=1`: at/above this row count (or `BULK_FORCE_INLINE_IMAGES=1`)
 * skips storage and stores resolved URLs. Default 500 — raise if you rarely use URL-only mode.
 */
const BULK_INLINE_IMAGES_MIN_ROWS = Math.max(
  1,
  Number(process.env.BULK_INLINE_IMAGES_MIN_ROWS ?? "500") || 500
);

const BULK_FORCE_INLINE_IMAGES = process.env.BULK_FORCE_INLINE_IMAGES === "1";

/**
 * When `1`, large imports store resolved image URLs only (no Supabase copy — faster, not storage-only).
 * Omit for strict Supabase storage uploads (recommended).
 */
const BULK_URL_ONLY_IMAGES = process.env.BULK_URL_ONLY_IMAGES === "1";

/**
 * Strict Supabase storage: on 403/401 fetch, do not store external URLs — only public URLs after upload.
 * Set `BULK_IMAGE_KEEP_ORIGINAL_ON_BLOCKED_FETCH=1` (or legacy `BULK_IMAGE_STRICT_SUPABASE=0`) to allow
 * keeping the original remote URL when the host blocks server-side download.
 */
const BULK_KEEP_ORIGINAL_ON_BLOCKED_FETCH =
  process.env.BULK_IMAGE_KEEP_ORIGINAL_ON_BLOCKED_FETCH === "1" ||
  process.env.BULK_IMAGE_STRICT_SUPABASE === "0";

export type BulkImageFailure = {
  productId: string;
  name: string;
  slug: string;
  errors: string[];
};

type BulkResult = {
  success: boolean;
  message: string;
  imported: number;
  imagesUploaded?: number;
  imagesKeptOriginal?: number;
  skippedDuplicateSlug?: number;
  imageFailures?: BulkImageFailure[];
};

function toPlainText(content: ArrayBuffer): string {
  return new TextDecoder("utf-8").decode(content);
}

function isUniqueViolation(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  return err.code === "23505" || /duplicate key|unique constraint/i.test(err.message ?? "");
}

function isSlugUniqueViolation(err: { code?: string; message?: string; details?: string } | null): boolean {
  if (!isUniqueViolation(err)) return false;
  const blob = `${err?.message ?? ""} ${err?.details ?? ""}`;
  return /products_slug|Key \(slug\)|\("slug"\)|\bslug\b.*already exists/i.test(blob);
}

const BULK_IMAGE_SITE_BASE = (process.env.BULK_IMAGE_SITE_BASE_URL ?? "https://baba.ge").replace(/\/$/, "");

/** Excel image1–3 cells: relative paths are loaded from this cache URL prefix, then uploaded to Supabase. */
const BULK_GALLERY_CACHE_BASE = (process.env.BULK_GALLERY_IMAGE_BASE_URL ?? "https://baba.ge/image/cache").replace(
  /\/+$/,
  ""
);

function resolveBulkImageUrl(raw: string | null | undefined): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("//")) return `https:${s}`;
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(s)) return `https://${s.replace(/^\/+/, "")}`;
  const path = s.replace(/^\/+/, "");
  if (!path) return null;
  if (path.startsWith("catalog/")) {
    return `${BULK_IMAGE_SITE_BASE}/image/${path}`;
  }
  return `${BULK_IMAGE_SITE_BASE}/${path}`;
}

/** Gallery slots: non-HTTP values are prefixed with the OpenCart-style image/cache base. */
function resolveBulkGalleryImageUrl(raw: string | null | undefined): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return resolveBulkImageUrl(s);
  if (s.startsWith("//")) return resolveBulkImageUrl(`https:${s}`);
  const path = s.replace(/^\/+/, "");
  if (!path) return null;
  return `${BULK_GALLERY_CACHE_BASE}/${path}`;
}

/**
 * Excel Cat. 2 = parent name, Cat. 1 = child name. Legacy "categories" column: first = parent, second = child.
 */
function bulkCategoryLabels(row: BulkProductInput): { parent: string | null; child: string | null } {
  const c1 = row.category1?.trim() || null;
  const c2 = row.category2?.trim() || null;
  if (c1 || c2) {
    return { parent: c2, child: c1 };
  }
  const legacy = [...(row.categories ?? [])].map((x) => String(x).trim()).filter(Boolean);
  if (legacy.length === 0) return { parent: null, child: null };
  if (legacy.length === 1) return { parent: null, child: legacy[0] };
  return { parent: legacy[0], child: legacy[1] };
}

type CategoryLookupRow = {
  id: string;
  name: string;
  slug: string;
  parent_id: number;
  category_id: number;
};

function matchCategoryLabel(row: CategoryLookupRow, label: string): boolean {
  const t = label.trim();
  if (!t) return false;
  const lower = t.toLowerCase();
  const slugKey = slugify(t).toLowerCase();
  const name = row.name.trim().toLowerCase();
  const slug = row.slug.trim().toLowerCase();
  return name === lower || slug === lower || slug === slugKey;
}

function findTopLevelCategory(rows: CategoryLookupRow[], label: string): CategoryLookupRow | undefined {
  return rows.find((r) => Number(r.parent_id) === 0 && matchCategoryLabel(r, label));
}

function findChildUnderParent(
  rows: CategoryLookupRow[],
  parent: CategoryLookupRow,
  label: string
): CategoryLookupRow | undefined {
  return rows.find(
    (r) => Number(r.parent_id) === parent.category_id && matchCategoryLabel(r, label)
  );
}

/**
 * Maps Excel names to `products.category_id` (parent) and `products.subcategory_id` (child).
 * Only matches existing `public.categories` rows — no inserts.
 */
function resolveBulkCategoryFks(
  rows: CategoryLookupRow[],
  parentLabel: string | null,
  childLabel: string | null
): { category_id: string | null; subcategory_id: string | null } {
  if (!parentLabel && !childLabel) return { category_id: null, subcategory_id: null };

  if (parentLabel && !childLabel) {
    const p = findTopLevelCategory(rows, parentLabel);
    return { category_id: p?.id ?? null, subcategory_id: null };
  }

  if (!parentLabel && childLabel) {
    const candidates = rows.filter((r) => Number(r.parent_id) > 0 && matchCategoryLabel(r, childLabel));
    if (candidates.length === 0) return { category_id: null, subcategory_id: null };
    const child = candidates[0];
    const parent = rows.find(
      (r) => Number(r.parent_id) === 0 && Number(r.category_id) === Number(child.parent_id)
    );
    return { category_id: parent?.id ?? null, subcategory_id: child.id };
  }

  const parent = findTopLevelCategory(rows, parentLabel!);
  if (!parent) return { category_id: null, subcategory_id: null };
  const child = findChildUnderParent(rows, parent, childLabel!);
  return { category_id: parent.id, subcategory_id: child?.id ?? null };
}

export async function processBulkUploadAction(formData: FormData): Promise<BulkResult> {
  await requireRole("user");

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, message: "Please upload a CSV or XLSX file.", imported: 0 };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const rows = file.name.endsWith(".xlsx")
      ? parseXlsx(arrayBuffer)
      : parseCsv(toPlainText(arrayBuffer));

    if (rows.length === 0) {
      return { success: false, message: "No valid rows found in upload file.", imported: 0 };
    }

    const useInlineResolvedUrls =
      !BULK_IMAGE_UPLOADS_DISABLED &&
      BULK_URL_ONLY_IMAGES &&
      (BULK_FORCE_INLINE_IMAGES || rows.length >= BULK_INLINE_IMAGES_MIN_ROWS);

    const supabase = createAdminClient();

    const { data: categoryData } = await supabase
      .from("categories")
      .select("id, name, slug, parent_id, category_id");

    const categoryRows: CategoryLookupRow[] = (categoryData ?? []).map((r) => {
      const row = r as {
        id: string;
        name: string;
        slug: string;
        parent_id: number | null;
        category_id: number;
      };
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        parent_id: row.parent_id == null ? 0 : Number(row.parent_id),
        category_id: Number(row.category_id),
      };
    });

    const categoryPairCache = new Map<string, { category_id: string | null; subcategory_id: string | null }>();

    function categoryPairForBulkRow(row: BulkProductInput): {
      category_id: string | null;
      subcategory_id: string | null;
    } {
      const { parent, child } = bulkCategoryLabels(row);
      const key = `${parent ?? ""}\x1e${child ?? ""}`;
      const cached = categoryPairCache.get(key);
      if (cached) return cached;
      const resolved = resolveBulkCategoryFks(categoryRows, parent, child);
      categoryPairCache.set(key, resolved);
      return resolved;
    }

    function buildPayload(row: BulkProductInput, inlineResolvedUrls: boolean): Record<string, unknown> {
      const { category_id, subcategory_id } = categoryPairForBulkRow(row);
      const uMain = resolveBulkImageUrl(row.mainImage ?? null);
      const u1 = resolveBulkGalleryImageUrl(row.image1 ?? null);
      const u2 = resolveBulkGalleryImageUrl(row.image2 ?? null);
      const u3 = resolveBulkGalleryImageUrl(row.image3 ?? null);

      const base = {
        name: row.name,
        model: row.model ?? null,
        slug: row.slug,
        description: row.description,
        price: row.price,
        quantity: row.quantity ?? 0,
        sku: row.sku ?? null,
        upc: row.upc ?? null,
        mpn: row.mpn ?? null,
        status: row.status,
        tags: row.tags,
        category_id,
        subcategory_id,
        manufacturer: row.manufacturer ?? null,
        weight: row.weight ?? null,
        length: row.length ?? null,
        width: row.width ?? null,
        height: row.height ?? null,
        meta_title: row.meta_title ?? null,
        meta_description: row.meta_description ?? null,
        meta_keywords: row.meta_keywords ?? null,
        promotions: false,
        bestsellers: false,
        discounts: false,
      };

      if (BULK_IMAGE_UPLOADS_DISABLED) {
        return { ...base, image1: null, image2: null, image3: null, main_image: null };
      }

      if (inlineResolvedUrls) {
        return {
          ...base,
          image1: u1,
          image2: u2,
          image3: u3,
          main_image: uMain ?? u1 ?? u2 ?? u3 ?? null,
        };
      }

      return {
        ...base,
        image1: null,
        image2: null,
        image3: null,
        main_image: null,
      };
    }

    type PendingInsert = { rowIndex: number; payload: Record<string, unknown> };
    const pending: PendingInsert[] = [];
    const seenSlugInFile = new Set<string>();
    let skippedDuplicateSlug = 0;

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      const slugKey = row.slug.trim().toLowerCase();
      if (seenSlugInFile.has(slugKey)) {
        skippedDuplicateSlug += 1;
        continue;
      }
      seenSlugInFile.add(slugKey);
      pending.push({ rowIndex, payload: buildPayload(row, useInlineResolvedUrls) });
    }

    const candidateSlugs = [...new Set(pending.map((p) => String((p.payload.slug as string) ?? "").trim()))];
    const existingSlugSet = new Set<string>();
    const SLUG_QUERY_CHUNK = 800;
    for (let i = 0; i < candidateSlugs.length; i += SLUG_QUERY_CHUNK) {
      const chunk = candidateSlugs.slice(i, i + SLUG_QUERY_CHUNK);
      const { data: existingRows } = await supabase.from("products").select("slug").in("slug", chunk);
      for (const r of existingRows ?? []) {
        if (r && typeof (r as { slug?: string }).slug === "string") {
          existingSlugSet.add((r as { slug: string }).slug.trim().toLowerCase());
        }
      }
    }

    const toInsert: PendingInsert[] = [];
    for (const p of pending) {
      const s = String(p.payload.slug ?? "").trim().toLowerCase();
      if (existingSlugSet.has(s)) {
        skippedDuplicateSlug += 1;
        continue;
      }
      toInsert.push(p);
    }

    type InsertedRow = { id: string; rowIndex: number };
    const insertedRows: InsertedRow[] = [];

    for (let i = 0; i < toInsert.length; i += BULK_INSERT_BATCH_SIZE) {
      const batch = toInsert.slice(i, i + BULK_INSERT_BATCH_SIZE);
      const payloads = batch.map((b) => b.payload);
      const { data, error } = await supabase.from("products").insert(payloads).select("id");

      if (error) {
        if (isSlugUniqueViolation(error)) {
          for (const one of batch) {
            const { data: single, error: e2 } = await supabase
              .from("products")
              .insert(one.payload)
              .select("id")
              .single();
            if (e2) {
              if (isSlugUniqueViolation(e2)) {
                skippedDuplicateSlug += 1;
                continue;
              }
              throw new Error(e2.message);
            }
            if (single?.id) insertedRows.push({ id: single.id, rowIndex: one.rowIndex });
          }
          continue;
        }
        throw new Error(error.message);
      }

      if (data && data.length !== batch.length) {
        throw new Error(`Bulk insert returned ${data?.length ?? 0} rows, expected ${batch.length}.`);
      }

      for (let j = 0; j < batch.length; j++) {
        const id = (data![j] as { id: string }).id;
        insertedRows.push({ id, rowIndex: batch[j].rowIndex });
      }
    }

    let imagesUploaded = 0;
    let imagesKeptOriginal = 0;
    const imageFailures: BulkImageFailure[] = [];

    if (!BULK_IMAGE_UPLOADS_DISABLED && !useInlineResolvedUrls) {
      const { uploadImageFromUrl } = await import("@/lib/supabase/storage");

      /** Lower delay helps finish within Vercel maxDuration (300s Hobby); raise 60–100 if origin returns 403. */
      const bulkFetchDelayMs = Math.max(0, Number(process.env.BULK_IMAGE_REQUEST_DELAY_MS ?? "50") || 0);
      let bulkFetchCount = 0;

      async function uploadOneSafe(
        raw: string | null,
        label: string,
        slotErrors: string[],
        resolveUrl: (r: string | null | undefined) => string | null
      ): Promise<string | null> {
        const trimmed = String(raw ?? "").trim();
        if (!trimmed) return null;
        if (bulkFetchCount > 0 && bulkFetchDelayMs > 0) {
          await new Promise((r) => setTimeout(r, bulkFetchDelayMs));
        }
        bulkFetchCount += 1;
        const normalized = resolveUrl(raw);
        if (!normalized) {
          slotErrors.push(`${label}: could not resolve URL`);
          return null;
        }
        try {
          return await uploadImageFromUrl(normalized, "products");
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          const blocked = /403|401/.test(msg);
          if (blocked && BULK_KEEP_ORIGINAL_ON_BLOCKED_FETCH) {
            imagesKeptOriginal += 1;
            return normalized;
          }
          slotErrors.push(`${label}: ${msg}`);
          return null;
        }
      }

      for (const { id, rowIndex } of insertedRows) {
        const src = rows[rowIndex];
        const mainSrc = src.mainImage ?? null;
        const slots = [src.image1 ?? null, src.image2 ?? null, src.image3 ?? null];

        if (!mainSrc && !slots.some(Boolean)) continue;

        const slotErrors: string[] = [];
        let uMain: string | null = null;
        if (mainSrc) uMain = await uploadOneSafe(mainSrc, "Main image", slotErrors, resolveBulkImageUrl);
        let u1: string | null = null;
        if (slots[0]) u1 = await uploadOneSafe(slots[0], "Image 1", slotErrors, resolveBulkGalleryImageUrl);
        let u2: string | null = null;
        if (slots[1]) u2 = await uploadOneSafe(slots[1], "Image 2", slotErrors, resolveBulkGalleryImageUrl);
        let u3: string | null = null;
        if (slots[2]) u3 = await uploadOneSafe(slots[2], "Image 3", slotErrors, resolveBulkGalleryImageUrl);

        if (slotErrors.length > 0) {
          imageFailures.push({
            productId: id,
            name: src.name,
            slug: src.slug,
            errors: slotErrors,
          });
        }

        const added = [uMain, u1, u2, u3].filter(Boolean).length;
        imagesUploaded += added;

        const { error: updateError } = await supabase
          .from("products")
          .update({
            image1: u1,
            image2: u2,
            image3: u3,
            main_image: uMain ?? u1 ?? u2 ?? u3 ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);
        if (updateError) throw new Error(updateError.message);
      }
    } else if (useInlineResolvedUrls) {
      imagesUploaded = insertedRows.filter(({ rowIndex }) => {
        const r = rows[rowIndex];
        return Boolean(r.mainImage ?? r.image1 ?? r.image2 ?? r.image3);
      }).length;
    }

    revalidateTag("products", "max");

    const imported = insertedRows.length;
    const toStorage = imagesUploaded - imagesKeptOriginal;
    const parts: string[] = [`Imported ${imported} product(s).`];
    if (skippedDuplicateSlug > 0) {
      parts.push(
        `Skipped ${skippedDuplicateSlug} row(s) with a duplicate slug (in the file or already in the database).`
      );
    }
    if (useInlineResolvedUrls) {
      parts.push(
        `URL-only import: images stored as resolved HTTPS URLs (BULK_URL_ONLY_IMAGES=1). Threshold: BULK_INLINE_IMAGES_MIN_ROWS=${BULK_INLINE_IMAGES_MIN_ROWS}; optional BULK_FORCE_INLINE_IMAGES=1 for small files.`
      );
    }
    if (BULK_IMAGE_UPLOADS_DISABLED) {
      parts.push("Image columns are disabled — no remote fetch or storage upload.");
    } else if (imported > 0 && !useInlineResolvedUrls) {
      if (imageFailures.length > 0) {
        parts.push(
          `Some image URLs failed for ${imageFailures.length} product(s) — see the list below. Successful images were still saved.`
        );
      }
      if (imagesUploaded === 0 && imageFailures.length === 0) {
        parts.push("No image URLs in file, or none could be fetched.");
      } else if (imagesUploaded > 0) {
        parts.push(`Images: ${imagesUploaded} set on products.`);
        if (toStorage > 0) parts.push(`${toStorage} copied to Supabase storage.`);
        if (imagesKeptOriginal > 0) {
          parts.push(
            `${imagesKeptOriginal} kept as original URLs (host blocked server fetch). Strict Supabase-only is default; this only happens with BULK_IMAGE_KEEP_ORIGINAL_ON_BLOCKED_FETCH=1 or BULK_IMAGE_STRICT_SUPABASE=0.`
          );
        }
      }
    }

    return {
      success: true,
      message: parts.join(" "),
      imported,
      imagesUploaded,
      imagesKeptOriginal,
      skippedDuplicateSlug,
      imageFailures: imageFailures.length > 0 ? imageFailures : undefined,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Bulk import failed",
      imported: 0,
    };
  }
}
