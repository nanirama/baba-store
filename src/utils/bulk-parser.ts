import Papa from "papaparse";
import * as XLSX from "xlsx";
import { slugify } from "./slug";
import { htmlToTipTapJson } from "./html-to-tiptap";

/**
 * Storefront URLs (e.g. https://baba.ge/product-slug) return 403 to scrapers — only treat
 * real file URLs or known image paths (e.g. /image/catalog/...) as bulk image sources.
 */
function looksLikeDirectImageUrl(raw: string): boolean {
  const s = raw.trim();
  if (!/^https?:\/\//i.test(s)) return false;
  try {
    const u = new URL(s);
    const path = u.pathname.toLowerCase();
    if (path.includes("/image/")) return true;
    if (/\/storage\/v1\/object\//i.test(s)) return true;
    return /\.(jpe?g|png|gif|webp|avif|svg|bmp)(\?|#|$)/i.test(path);
  } catch {
    return false;
  }
}

/** Path-only values from legacy sheets (e.g. `catalog/.../x.jpg`) — resolved to full URLs at bulk upload. */
function looksLikeRelativeSiteImagePath(raw: string): boolean {
  const s = raw.trim();
  if (!s || /^https?:\/\//i.test(s)) return false;
  if (!/\.(jpe?g|png|gif|webp|avif|svg|bmp)(\?|#|$)/i.test(s)) return false;
  return s.includes("/");
}

function looksLikeBulkImageSource(raw: string): boolean {
  return looksLikeDirectImageUrl(raw) || looksLikeRelativeSiteImagePath(raw);
}

/** Loose https check for explicit "Main image" columns (URLs without file extension, etc.). */
function looksLikeHttpUrl(raw: string): boolean {
  const s = raw.trim();
  return /^https?:\/\//i.test(s) || s.startsWith("//");
}

/**
 * Main image column: accept standard image paths/URLs, or any https URL in this column
 * (Excel often uses non-standard headers or full storefront URLs — upload step validates).
 */
function pickMainImageColumn(row: Record<string, unknown>): string | undefined {
  const raw = pick(
    row,
    "main image",
    "main_image",
    "main image url",
    "main_image_url",
    "primary image",
    "featured image",
    "hero image",
    "cover image",
    "product image",
    "image main",
    "image_main"
  );
  const v = String(raw ?? "").trim();
  if (!v) return undefined;
  if (looksLikeBulkImageSource(v)) return v;
  if (looksLikeHttpUrl(v)) return v.startsWith("//") ? `https:${v}` : v;
  return undefined;
}

/** Collect https URLs in the row that look like direct image files (not product pages). */
function discoverDirectImageUrlsInRow(row: Record<string, unknown>): string[] {
  const found: string[] = [];
  for (const val of Object.values(row)) {
    const s = String(val ?? "").trim();
    if (looksLikeDirectImageUrl(s)) found.push(s);
  }
  const unique = [...new Set(found)];
  unique.sort((a, b) => {
    const rank = (u: string) => (u.includes("/image/catalog/") ? 0 : u.includes("/image/") ? 1 : 2);
    return rank(a) - rank(b);
  });
  return unique;
}

/** Aliases so "Main image", "Main_image", and "main image" match the same column. */
function headerAliases(key: string): string[] {
  const t = key.replace(/^\uFEFF/, "").trim();
  const lower = t.toLowerCase();
  const underscored = lower.replace(/\s+/g, "_");
  const spaced = lower.replace(/_/g, " ");
  return [...new Set([lower, underscored, spaced])];
}

/** Case-insensitive lookup — Excel/CSV exports use "Name", "SEO url 0", "Main image", etc. */
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

/** First column in `variants` order whose value is non-empty after trim (used for slug: prefer "SEO url 0"). */
function pickFirstNonEmpty(row: Record<string, unknown>, ...variants: string[]): string {
  for (const v of variants) {
    const raw = pick(row, v);
    const s = String(raw ?? "").trim();
    if (s) return s;
  }
  return "";
}

/** Cat1 / Cat. 1 / Cat 1 style columns anywhere in the sheet */
function collectCategoryColumns(row: Record<string, unknown>): string[] {
  const out: string[] = [];
  for (const [key, value] of Object.entries(row)) {
    const keyNorm = key.trim().toLowerCase().replace(/\s+/g, "");
    if (/^cat\.?[123]$/.test(keyNorm) || /^cat[123]$/.test(keyNorm)) {
      const s = String(value ?? "").trim();
      if (s) out.push(s);
    }
  }
  const legacy = [pick(row, "categories"), pick(row, "cat1"), pick(row, "cat2"), pick(row, "cat3")];
  for (const v of legacy) {
    if (v == null || !String(v).trim()) continue;
    out.push(...String(v).split(",").map((x) => x.trim()).filter(Boolean));
  }
  return [...new Set(out)];
}

/**
 * Excel often stores the real URL in the cell hyperlink (`l.Target`), not in the displayed value.
 * Merge those targets into the same keys `sheet_to_json` uses so image columns get real https URLs.
 */
function applyExcelHyperlinkTargets(sheet: XLSX.WorkSheet, rows: Record<string, unknown>[]) {
  const ref = sheet["!ref"];
  if (!ref || rows.length === 0) return;
  const range = XLSX.utils.decode_range(ref);
  const headerRow = range.s.r;
  const headers: string[] = [];
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: headerRow, c });
    const cell = sheet[addr];
    headers.push(cell != null ? String(cell.v ?? "") : "");
  }
  for (let r = headerRow + 1; r <= range.e.r; r++) {
    const dataRowIdx = r - headerRow - 1;
    if (dataRowIdx < 0 || dataRowIdx >= rows.length) continue;
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[addr] as XLSX.CellObject & { l?: { Target?: string } };
      const target = cell?.l?.Target;
      if (!target || typeof target !== "string") continue;
      let t = target.trim();
      if (t.startsWith("#") || t.toLowerCase().startsWith("mailto:")) continue;
      if (!/^https?:\/\//i.test(t) && !t.startsWith("//")) {
        const SITE = "https://baba.ge";
        if (t.startsWith("/")) {
          t = `${SITE}${t}`;
        } else if (/\.(jpe?g|png|gif|webp|avif)(\?|#|$)/i.test(t) && (t.includes("/") || /^catalog\//i.test(t))) {
          t = `${SITE}/${t.replace(/^\/+/, "")}`;
        } else {
          continue;
        }
      }
      const header = headers[c - range.s.c];
      if (!header) continue;
      const row = rows[dataRowIdx];
      const key =
        Object.keys(row).find((k) => k.trim().toLowerCase() === header.trim().toLowerCase()) ?? header;
      row[key] = t.startsWith("//") ? `https:${t}` : t;
    }
  }
}

export type BulkProductInput = {
  name: string;
  model?: string;
  slug: string;
  description: unknown;
  price: number;
  quantity?: number;
  sku?: string;
  upc?: string;
  mpn?: string;
  status: "draft" | "active" | "archived";
  tags: string[];
  /** Legacy / extra category labels (Cat3, "categories" column, etc.). */
  categories: string[];
  /** "Cat. 1" / Cat 1 — maps to product `subcategory_id` (child) when matched in Supabase. */
  category1?: string;
  /** "Cat. 2" / Cat 2 — maps to product `category_id` (parent) when matched in Supabase. */
  category2?: string;
  /** Excel "Main image" / "Main_image" → DB `main_image` (not `image1`). */
  mainImage?: string;
  image1?: string;
  image2?: string;
  image3?: string;
  manufacturer?: string;
  weight?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
};

function numField(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Parse spreadsheet numeric cells; empty → null; 0 is valid. Handles comma decimals from locale exports. */
function optionalNumeric(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const s = String(value).trim();
  if (s === "") return null;
  const normalized = s.replace(/\s/g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function optionalStr(value: unknown): string | undefined {
  const s = String(value ?? "").trim();
  return s || undefined;
}

function normalizeRow(row: Record<string, unknown>): BulkProductInput {
  const name = String(
    pick(row, "name", "product name", "title", "product title") ?? ""
  ).trim();
  const htmlDescription = String(
    pick(row, "description", "html_description", "html description", "body") ?? ""
  ).trim();

  const skuStr = String(pick(row, "sku") ?? "").trim();

  /** Prefer "SEO url 0" over a blank "slug" column so the sheet drives `products.slug`. */
  const slugBase = pickFirstNonEmpty(
    row,
    "seo url 0",
    "seo_url_0",
    "slug",
    "seo url",
    "url",
    "seo_url"
  );
  let slug = (slugBase ? slugify(slugBase) : slugify(name)).trim();
  if (!slug) slug = skuStr ? slugify(skuStr) : `product-${Date.now()}`;

  const categories = collectCategoryColumns(row);

  const str = (v: unknown) => String(v ?? "").trim();

  const fromNamedColumns = [
    ...str(pick(row, "image_urls", "image url", "catalog image")).split(/[,;\n]/).map((s) => s.trim()).filter(Boolean),
    str(pick(row, "product link 0", "product_link_0", "product link", "product link 1", "product_link_1")),
  ].filter(Boolean);

  const legacyUrls = fromNamedColumns.filter(looksLikeDirectImageUrl);
  const discoveredAll = discoverDirectImageUrlsInRow(row);

  const pickExplicit = (...keys: string[]) => {
    const raw = pick(row, ...(keys as [string, ...string[]]));
    const v = str(raw);
    return v && looksLikeBulkImageSource(v) ? v : undefined;
  };

  const mainImage = pickMainImageColumn(row) || undefined;

  const discovered = discoveredAll.filter((u) => u !== mainImage);
  const legacyForGallery = legacyUrls.filter((u) => u !== mainImage);

  const image1 =
    pickExplicit("image1", "image 1", "thumbnail", "picture", "photo") ||
    legacyForGallery[0] ||
    discovered[0] ||
    undefined;
  const image2 = pickExplicit("image2", "image 2") || legacyForGallery[1] || discovered[1] || undefined;
  const image3 = pickExplicit("image3", "image 3") || legacyForGallery[2] || discovered[2] || undefined;

  const statusRaw = String(pick(row, "status") ?? "draft").trim().toLowerCase();
  const status: "draft" | "active" | "archived" =
    statusRaw === "1" || statusRaw === "active"
      ? "active"
      : statusRaw === "archived"
        ? "archived"
        : "draft";

  return {
    name,
    model: String(pick(row, "model") ?? "").trim() || undefined,
    slug,
    description: htmlToTipTapJson(htmlDescription),
    price: numField(pick(row, "price", "retail price", "amount", "cost"), 0),
    quantity: numField(pick(row, "quantity", "qty", "stock"), 0),
    sku: skuStr || undefined,
    upc: String(pick(row, "upc") ?? "").trim() || undefined,
    mpn: String(pick(row, "mpn") ?? "").trim() || undefined,
    status,
    tags: String(pick(row, "tags") ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    categories,
    category1: optionalStr(pick(row, "cat. 1", "cat._1", "cat 1", "cat1")),
    category2: optionalStr(pick(row, "cat. 2", "cat._2", "cat 2", "cat2")),
    mainImage,
    image1,
    image2,
    image3,
    manufacturer: String(pick(row, "manufacturer", "brand") ?? "").trim() || undefined,
    weight: optionalNumeric(pick(row, "weight")),
    length: optionalNumeric(pick(row, "length")),
    width: optionalNumeric(pick(row, "width")),
    height: optionalNumeric(pick(row, "height")),
    meta_title: optionalStr(pick(row, "meta title", "meta_title")),
    meta_description: optionalStr(pick(row, "meta description", "meta_description")),
    meta_keywords: optionalStr(pick(row, "meta keywords", "meta_keywords")),
  };
}

export function parseCsv(content: string): BulkProductInput[] {
  const parsed = Papa.parse<Record<string, unknown>>(content, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0].message);
  }

  return parsed.data.map(normalizeRow).filter((row) => row.name.length > 0);
}

export function parseXlsx(buffer: ArrayBuffer): BulkProductInput[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
    defval: "",
    raw: false,
    blankrows: true,
  });
  applyExcelHyperlinkTargets(firstSheet, rows);
  return rows.map(normalizeRow).filter((row) => row.name.length > 0);
}
