"use server";

import "server-only";

import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/helpers";
import { parseCsv, parseXlsx, type BulkProductInput } from "@/utils/bulk-parser";

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

/** `path/to/file.jpg` → `path/to/file-1100x1000w.jpg` (OpenCart cache naming). */
function buildGalleryResizedCachePath(relativePath: string): string | null {
  const path = relativePath.replace(/^\/+/, "");
  if (!path) return null;
  const lastSlash = path.lastIndexOf("/");
  const file = lastSlash >= 0 ? path.slice(lastSlash + 1) : path;
  const dir = lastSlash >= 0 ? path.slice(0, lastSlash + 1) : "";
  const lastDot = file.lastIndexOf(".");
  if (lastDot <= 0) return null;
  const base = file.slice(0, lastDot);
  const ext = file.slice(lastDot + 1);
  if (!base || !ext) return null;
  return `${dir}${base}-1100x1000w.${ext}`;
}

const BABA_GALLERY_PROBE_HEADERS: Record<string, string> = {
  Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Referer: `${BULK_IMAGE_SITE_BASE}/`,
  Origin: BULK_IMAGE_SITE_BASE,
};

/**
 * For bulk gallery columns: first `https://baba.ge/image/cache/` + field value; if not reachable,
 * then `.../basename-1100x1000w.ext` (same dir, extension from the filename).
 * Returns the first URL that responds OK, or null.
 */
async function resolveGalleryBulkDownloadUrl(raw: string | null | undefined): Promise<string | null> {
  const s = String(raw ?? "").trim();
  if (!s) return null;

  let primary: string;
  let resized: string | null = null;

  if (/^https?:\/\//i.test(s)) {
    primary = s;
    try {
      const u = new URL(s);
      const host = u.hostname.replace(/^www\./i, "");
      if (host === "baba.ge" || host.endsWith(".baba.ge")) {
        const pathname = u.pathname.replace(/^\/+/, "");
        const cachePrefix = "image/cache/";
        const rel = pathname.startsWith(cachePrefix) ? pathname.slice(cachePrefix.length) : pathname;
        const alt = buildGalleryResizedCachePath(rel);
        if (alt) resized = `${u.origin}/${cachePrefix}${alt}`;
      }
    } catch {
      resized = null;
    }
  } else {
    const path = s.replace(/^\/+/, "");
    if (!path) return null;
    primary = `${BULK_GALLERY_CACHE_BASE}/${path}`;
    const alt = buildGalleryResizedCachePath(path);
    resized = alt ? `${BULK_GALLERY_CACHE_BASE}/${alt}` : null;
  }

  async function reachable(url: string): Promise<boolean> {
    try {
      let r = await fetch(url, { method: "HEAD", redirect: "follow", headers: BABA_GALLERY_PROBE_HEADERS });
      if (r.ok) return true;
      if (r.status === 403 || r.status === 401) {
        r = await fetch(url, {
          method: "GET",
          redirect: "follow",
          headers: { ...BABA_GALLERY_PROBE_HEADERS, Range: "bytes=0-0" },
        });
        return r.ok;
      }
      // Some hosts omit HEAD or return 404 while GET serves the file.
      if (r.status === 404 || r.status === 405) {
        r = await fetch(url, {
          method: "GET",
          redirect: "follow",
          headers: { ...BABA_GALLERY_PROBE_HEADERS, Range: "bytes=0-1023" },
        });
        return r.ok;
      }
      return false;
    } catch {
      return false;
    }
  }

  if (await reachable(primary)) return primary;
  if (resized && resized !== primary && (await reachable(resized))) return resized;
  return null;
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

function normalizeCategoryName(v: string | null | undefined): string {
  return String(v ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Maps Excel names to numeric product category fields.
 * Cat. 2 -> products.category_id from categories.category_id
 * Cat. 1 -> products.parent_category_id from categories.parent_id
 * Only matches existing `public.categories` rows — no inserts.
 */
function resolveBulkCategoryFks(
  rows: CategoryLookupRow[],
  parentLabel: string | null,
  childLabel: string | null
): { category_id: number | null; parent_category_id: number | null } {
  const parentKey = normalizeCategoryName(parentLabel);
  const childKey = normalizeCategoryName(childLabel);
  if (!parentKey && !childKey) return { category_id: null, parent_category_id: null };

  // Name-only lookup as requested, no UUID mapping.
  const parent = parentKey ? rows.find((r) => normalizeCategoryName(r.name) === parentKey) : undefined;
  const child = childKey ? rows.find((r) => normalizeCategoryName(r.name) === childKey) : undefined;

  return {
    category_id: parent?.category_id ?? null,
    parent_category_id: child?.category_id ?? 0,
  };
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

    const categoryPairCache = new Map<string, { category_id: number | null; parent_category_id: number | null }>();

    function categoryPairForBulkRow(row: BulkProductInput): {
      category_id: number | null;
      parent_category_id: number | null;
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
      const { category_id, parent_category_id } = categoryPairForBulkRow(row);
      const parentIdFromSheet =
        typeof row.parentId === "number" && Number.isFinite(row.parentId) ? Math.trunc(row.parentId) : null;
      const finalParentCategoryId = parentIdFromSheet ?? parent_category_id;
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
        parent_category_id: finalParentCategoryId,
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
    let cat2Provided = 0;
    let cat2Matched = 0;
    let cat2Missing = 0;
    let cat1Provided = 0;
    let cat1Matched = 0;
    let cat1Missing = 0;

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      const slugKey = row.slug.trim().toLowerCase();
      if (seenSlugInFile.has(slugKey)) {
        skippedDuplicateSlug += 1;
        continue;
      }
      seenSlugInFile.add(slugKey);

      const { parent, child } = bulkCategoryLabels(row);
      const { category_id, parent_category_id } = categoryPairForBulkRow(row);
      const parentIdFromSheet =
        typeof row.parentId === "number" && Number.isFinite(row.parentId) ? Math.trunc(row.parentId) : null;
      const finalParentCategoryId = parentIdFromSheet ?? parent_category_id;
      if (parent) {
        cat2Provided += 1;
        if (category_id != null) cat2Matched += 1;
        else cat2Missing += 1;
      }
      if (child || parentIdFromSheet != null) {
        cat1Provided += 1;
        if (finalParentCategoryId != null) cat1Matched += 1;
        else cat1Missing += 1;
      }

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

      /** Image 1–3: probe baba.ge/cache original then `-1100x1000w` variant, then upload to Supabase. */
      async function uploadGallerySlotSafe(
        raw: string | null,
        label: string,
        slotErrors: string[]
      ): Promise<string | null> {
        const trimmed = String(raw ?? "").trim();
        if (!trimmed) return null;
        if (bulkFetchCount > 0 && bulkFetchDelayMs > 0) {
          await new Promise((r) => setTimeout(r, bulkFetchDelayMs));
        }
        bulkFetchCount += 1;
        const normalized = await resolveGalleryBulkDownloadUrl(trimmed);
        if (!normalized) {
          slotErrors.push(`${label}: not found at cache path or -1100x1000w variant`);
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
        if (slots[0]) u1 = await uploadGallerySlotSafe(slots[0], "Image 1", slotErrors);
        let u2: string | null = null;
        if (slots[1]) u2 = await uploadGallerySlotSafe(slots[1], "Image 2", slotErrors);
        let u3: string | null = null;
        if (slots[2]) u3 = await uploadGallerySlotSafe(slots[2], "Image 3", slotErrors);

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
    if (cat2Provided > 0 || cat1Provided > 0) {
      parts.push(
        `Category mapping: Cat 2 matched ${cat2Matched}/${cat2Provided} (missing ${cat2Missing}); Cat 1 matched ${cat1Matched}/${cat1Provided} (missing ${cat1Missing}).`
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
