import { z } from "zod";

/** Form flags: "true"/"false", checkbox "on", legacy "1"/"0", or DB booleans/smallints. */
export function parseTriStateBoolean(val: unknown): boolean {
  if (val === true || val === 1) return true;
  if (val === false || val === 0 || val == null || val === "") return false;
  if (typeof val === "string") {
    const s = val.trim().toLowerCase();
    if (s === "false" || s === "0" || s === "no" || s === "f") return false;
    return s === "on" || s === "true" || s === "1" || s === "yes" || s === "t";
  }
  return false;
}

export const productStatusSchema = z.enum(["draft", "active", "archived"]);

export const productMetaSchema = z
  .object({
    title: z.string().max(120).optional(),
    description: z.string().max(320).optional(),
    keywords: z.array(z.string().min(1)).max(30).optional(),
  })
  .optional();

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  model: z.string().trim().max(120).optional().nullable(),
  name: z.string().trim().min(2, "Name is required").max(200),
  description: z
    .string()
    .min(2, "Description is required")
    .transform((value) => JSON.parse(value) as unknown),
  meta: z.string().optional().transform((value) => (value ? JSON.parse(value) : null)),
  slug: z.string().trim().min(2).max(200),
  tags: z.array(z.string()).optional(),
  sku: z.string().trim().max(64).optional().nullable(),
  upc: z.string().trim().max(64).optional().nullable(),
  mpn: z.string().trim().max(64).optional().nullable(),
  stock: z.coerce.number().int().nonnegative().optional().nullable(),
  weight: z.coerce.number().nonnegative().optional().nullable(),
  length: z.coerce.number().nonnegative().optional().nullable(),
  width: z.coerce.number().nonnegative().optional().nullable(),
  height: z.coerce.number().nonnegative().optional().nullable(),
  price: z.coerce.number().nonnegative(),
  quantity: z.coerce.number().int().nonnegative().optional().nullable(),
  mainImage: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.string().url().nullable().optional()
  ),
  image1: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.string().url().nullable().optional()
  ),
  image2: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.string().url().nullable().optional()
  ),
  image3: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.string().url().nullable().optional()
  ),
  manufacturer: z.string().trim().max(120).optional().nullable(),
  relatedProducts: z.array(z.string().uuid()).optional(),
  status: productStatusSchema.default("draft"),
  category_id: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.string().uuid().nullable().optional()
  ),
  subcategory_id: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.string().uuid().nullable().optional()
  ),
  promotions: z.preprocess(parseTriStateBoolean, z.boolean()),
  bestsellers: z.preprocess(parseTriStateBoolean, z.boolean()),
  discounts: z.preprocess(parseTriStateBoolean, z.boolean()),
});

export const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(140),
  category_id: z.preprocess(
    (val) => {
      const n = Number(val);
      return Number.isFinite(n) ? Math.trunc(n) : 0;
    },
    z.number().int().min(0).max(2147483647)
  ),
  parent_id: z.preprocess(
    (val) => {
      const n = Number(val);
      return Number.isFinite(n) ? Math.trunc(n) : 0;
    },
    z.number().int().min(0).max(2147483647)
  ),
  description: z.preprocess(
    (val) => {
      if (val === "" || val == null) return null;
      if (typeof val !== "string") return val;
      try {
        return JSON.parse(val);
      } catch {
        return { text: val };
      }
    },
    z.unknown().nullable().optional()
  ),
  meta_title: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.string().trim().max(255).nullable().optional()
  ),
  meta_description: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.string().trim().max(1000).nullable().optional()
  ),
  meta_keywords: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.string().trim().max(1000).nullable().optional()
  ),
  sort_order: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return 0;
      const n = Number(val);
      return Number.isFinite(n) ? Math.trunc(n) : 0;
    },
    z.number().int().min(-2147483648).max(2147483647)
  ),
  status: z.preprocess(
    (val) => {
      const s = String(val ?? "").trim();
      return s || "active";
    },
    z.string().min(1).max(50)
  ),
  icon: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.string().url().nullable().optional()
  ),
});

export const bulkUploadSchema = z.object({
  mode: z.enum(["csv", "xlsx"]),
});
