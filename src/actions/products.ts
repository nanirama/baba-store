"use server";

import "server-only";

import { after } from "next/server";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/helpers";
import { productSchema } from "@/utils/cms-schemas";
import { slugify } from "@/utils/slug";
import { deleteProductImageByPublicUrl, uploadProductImage } from "@/lib/supabase/storage";
import type { ProductWriteInput } from "@/types/cms";

type ActionResult = { success: true; message: string } | { success: false; message: string };

export type MainImageUploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export type MainImageDeleteResult = { ok: true } | { ok: false; error: string };

function toUploadableFile(entry: FormDataEntryValue | null): File | null {
  if (!entry) return null;
  if (entry instanceof File && entry.size > 0) return entry;
  if (entry instanceof Blob && entry.size > 0) {
    const type = entry.type || "image/jpeg";
    return new File([entry], "image", { type });
  }
  return null;
}

/** Client-side main image upload — uses the same auth + storage path as other product actions. */
export async function uploadProductMainImageAction(formData: FormData): Promise<MainImageUploadResult> {
  await requireRole("user");
  const file = toUploadableFile(formData.get("file"));
  if (!file) {
    return { ok: false, error: "Missing image file" };
  }
  try {
    const url = await uploadProductImage(file);
    return { ok: true, url };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Upload failed" };
  }
}

export async function deleteProductMainImageAction(publicUrl: string): Promise<MainImageDeleteResult> {
  await requireRole("user");
  try {
    await deleteProductImageByPublicUrl(publicUrl);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Delete failed" };
  }
}

function toStringArray(value: FormDataEntryValue | null): string[] {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function stockStatusCandidates(input: string): string[] {
  const raw = input.trim();
  if (!raw) return [];

  const normalized = raw.toLowerCase().replace(/[\s-]+/g, "_");
  const isIn = ["instock", "in_stock", "in stock"].includes(raw.toLowerCase()) || normalized === "in_stock";
  const isOut =
    ["outofstock", "out_of_stock", "out of stock", "ourofstock"].includes(raw.toLowerCase()) ||
    normalized === "out_of_stock";

  if (isIn) {
    return ["InStock", "in_stock", "instock", "in stock"];
  }

  if (isOut) {
    return ["OutOfStock", "out_of_stock", "outofstock", "out of stock"];
  }

  return [raw];
}

async function insertProductWithStockFallback(
  supabase: ReturnType<typeof createAdminClient>,
  dbPayload: Record<string, unknown>
) {
  let { error } = await supabase.from("products").insert(dbPayload);
  if (!error) return { error: null };

  const stockValue = typeof dbPayload.stock_status === "string" ? dbPayload.stock_status : "";
  const shouldRetry =
    Boolean(stockValue) && error.message.includes("products_stock_status_check");

  if (!shouldRetry) return { error };

  for (const candidate of stockStatusCandidates(stockValue)) {
    if (candidate === stockValue) continue;
    const retryPayload = { ...dbPayload, stock_status: candidate };
    const retry = await supabase.from("products").insert(retryPayload);
    if (!retry.error) return { error: null };
    error = retry.error;
  }

  return { error };
}

async function updateProductWithStockFallback(
  supabase: ReturnType<typeof createAdminClient>,
  dbPayload: Record<string, unknown>,
  productId: string
) {
  let { error } = await supabase.from("products").update(dbPayload).eq("id", productId);
  if (!error) return { error: null };

  const stockValue = typeof dbPayload.stock_status === "string" ? dbPayload.stock_status : "";
  const shouldRetry =
    Boolean(stockValue) && error.message.includes("products_stock_status_check");

  if (!shouldRetry) return { error };

  for (const candidate of stockStatusCandidates(stockValue)) {
    if (candidate === stockValue) continue;
    const retryPayload = { ...dbPayload, stock_status: candidate };
    const retry = await supabase.from("products").update(retryPayload).eq("id", productId);
    if (!retry.error) return { error: null };
    error = retry.error;
  }

  return { error };
}

async function parseProductFormData(formData: FormData): Promise<ProductWriteInput> {
  const idEntry = formData.get("id");
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? slugify(name)).trim();
  const description = String(formData.get("description") ?? '{"type":"doc","content":[]}');
  const metaTitle = String(formData.get("meta_title") ?? "").trim();
  const metaDescription = String(formData.get("meta_description") ?? "").trim();
  const metaKeywordsRaw = String(formData.get("meta_keywords") ?? "").trim();
  const metaFromColumns = {
    title: metaTitle || undefined,
    description: metaDescription || undefined,
    keywords: metaKeywordsRaw
      ? metaKeywordsRaw
          .split(",")
          .map((keyword) => keyword.trim())
          .filter(Boolean)
      : undefined,
  };
  const hasMetaFromColumns =
    Boolean(metaFromColumns.title) ||
    Boolean(metaFromColumns.description) ||
    Boolean(metaFromColumns.keywords?.length);
  const meta = hasMetaFromColumns ? JSON.stringify(metaFromColumns) : String(formData.get("meta") ?? "");

  const parsed = productSchema.safeParse({
    id: typeof idEntry === "string" && idEntry.length > 0 ? idEntry : undefined,
    model: formData.get("model"),
    name,
    description,
    meta,
    slug,
    tags: toStringArray(formData.get("tags")),
    sku: formData.get("sku"),
    upc: formData.get("upc"),
    mpn: formData.get("mpn"),
    stock: typeof formData.get("stock") === "string" ? formData.get("stock") : undefined,
    weight: typeof formData.get("weight") === "string" ? formData.get("weight") : undefined,
    length: typeof formData.get("length") === "string" ? formData.get("length") : undefined,
    width: typeof formData.get("width") === "string" ? formData.get("width") : undefined,
    height: typeof formData.get("height") === "string" ? formData.get("height") : undefined,
    price: formData.get("price"),
    quantity: formData.get("quantity"),
    mainImage: formData.get("mainImage"),
    image1: formData.get("image1"),
    image2: formData.get("image2"),
    image3: formData.get("image3"),
    manufacturer: formData.get("manufacturer"),
    relatedProducts: toStringArray(formData.get("relatedProducts")),
    status: formData.get("status"),
    category_id: formData.get("category_id"),
    subcategory_id: formData.get("subcategory_id"),
    promotions: formData.get("promotions"),
    bestsellers: formData.get("bestsellers"),
    discounts: formData.get("discounts"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid product payload");
  }

  /** Form: main → `category_id`, sub → `subcategory_id`. DB: sub chosen → leaf in `category_id`, main in `parent_category_id`. */
  const mainCategory = parsed.data.category_id ?? null;
  const subCategory = parsed.data.subcategory_id ?? null;
  const category_id = subCategory != null ? subCategory : mainCategory;
  const parent_category_id = subCategory != null ? mainCategory : null;

  return {
    model: parsed.data.model ?? null,
    name: parsed.data.name,
    description: parsed.data.description as ProductWriteInput["description"],
    meta: parsed.data.meta as ProductWriteInput["meta"],
    slug: slugify(parsed.data.slug),
    tags: parsed.data.tags ?? [],
    sku: parsed.data.sku ?? null,
    upc: parsed.data.upc ?? null,
    mpn: parsed.data.mpn ?? null,
    stock: parsed.data.stock ?? 0,
    weight: parsed.data.weight ?? null,
    length: parsed.data.length ?? null,
    width: parsed.data.width ?? null,
    height: parsed.data.height ?? null,
    price: parsed.data.price,
    quantity: parsed.data.quantity ?? 0,
    main_image: parsed.data.mainImage ?? null,
    image1: parsed.data.image1 ?? null,
    image2: parsed.data.image2 ?? null,
    image3: parsed.data.image3 ?? null,
    manufacturer: parsed.data.manufacturer ?? null,
    related_products: parsed.data.relatedProducts ?? [],
    status: parsed.data.status,
    category_id,
    parent_category_id,
    categories: null,
    promotions: parsed.data.promotions,
    bestsellers: parsed.data.bestsellers,
    discounts: parsed.data.discounts,
  };
}

export async function createProductAction(formData: FormData): Promise<ActionResult> {
  await requireRole("user");

  try {
    const payload = await parseProductFormData(formData);
    const supabase = createAdminClient();

    const dbPayload = { ...payload } as Record<string, unknown>;
    const meta = (payload.meta ?? null) as
      | { title?: string; description?: string; keywords?: string[] }
      | null;

    // Map metadata into column-based schema (meta_title/meta_description/meta_keywords).
    dbPayload.meta_title = meta?.title ?? null;
    dbPayload.meta_description = meta?.description ?? null;
    dbPayload.meta_keywords = meta?.keywords?.join(", ") ?? null;
    delete dbPayload.meta;
    delete dbPayload.categories;

    // When fields are hidden, omit those columns entirely so we don't overwrite
    // existing values or fail on missing columns.
    const tagsInput = formData.get("tags");
    if (!tagsInput) delete dbPayload.tags;

    const hasAnyImages =
      payload.main_image !== null ||
      payload.image1 != null ||
      payload.image2 != null ||
      payload.image3 != null;
    if (!hasAnyImages) {
      delete dbPayload.main_image;
      delete dbPayload.image1;
      delete dbPayload.image2;
      delete dbPayload.image3;
    }

    // Not present in the current minimal form.
    let stockStatus = String(formData.get("stock_status") ?? "").trim();
    if (stockStatus.toLowerCase() === "ourofstock" || stockStatus === "OurOfStock") {
      stockStatus = "OutOfStock";
    }
    if (stockStatus) {
      // Existing deployments may use `stock_status` rather than numeric `stock`.
      dbPayload.stock_status = stockStatus;
    }

    // Avoid writing to a `stock` column if it does not exist.
    delete (dbPayload as any).stock;

    delete dbPayload.related_products;

    dbPayload.category_id = payload.category_id ?? null;
    dbPayload.parent_category_id = payload.parent_category_id ?? null;
    delete (dbPayload as Record<string, unknown>).subcategory_id;

    dbPayload.promotions = Boolean(payload.promotions);
    dbPayload.bestsellers = Boolean(payload.bestsellers);
    dbPayload.discounts = Boolean(payload.discounts);

    const { error } = await insertProductWithStockFallback(supabase, dbPayload);
    if (error) throw new Error(error.message);

    revalidateTag("products", "max");
    revalidateTag("categories", "max");
    return { success: true, message: "Product created." };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to create product" };
  }
}

export async function updateProductAction(formData: FormData): Promise<ActionResult> {
  await requireRole("user");

  try {
    const productId = String(formData.get("id") ?? "");
    if (!productId) return { success: false, message: "Missing product id" };

    const payload = await parseProductFormData(formData);
    const supabase = createAdminClient();

    const dbPayload = { ...payload } as Record<string, unknown>;
    const meta = (payload.meta ?? null) as
      | { title?: string; description?: string; keywords?: string[] }
      | null;

    // Map metadata into column-based schema (meta_title/meta_description/meta_keywords).
    dbPayload.meta_title = meta?.title ?? null;
    dbPayload.meta_description = meta?.description ?? null;
    dbPayload.meta_keywords = meta?.keywords?.join(", ") ?? null;
    delete dbPayload.meta;
    delete dbPayload.categories;

    const tagsInput = formData.get("tags");
    if (!tagsInput) delete dbPayload.tags;

    // main_image is already on dbPayload from parseProductFormData (hidden `mainImage`, client-uploaded URL).

    let stockStatus = String(formData.get("stock_status") ?? "").trim();
    if (stockStatus.toLowerCase() === "ourofstock" || stockStatus === "OurOfStock") {
      stockStatus = "OutOfStock";
    }
    if (stockStatus) dbPayload.stock_status = stockStatus;

    delete (dbPayload as any).stock;

    delete dbPayload.related_products;

    dbPayload.category_id = payload.category_id ?? null;
    dbPayload.parent_category_id = payload.parent_category_id ?? null;
    delete (dbPayload as Record<string, unknown>).subcategory_id;

    dbPayload.promotions = Boolean(payload.promotions);
    dbPayload.bestsellers = Boolean(payload.bestsellers);
    dbPayload.discounts = Boolean(payload.discounts);

    const { error } = await updateProductWithStockFallback(supabase, dbPayload, productId);
    if (error) throw new Error(error.message);

    revalidateTag("products", "max");
    revalidateTag(`product-${productId}`, "max");
    revalidateTag(`product-slug-${payload.slug}`, "max");
    return { success: true, message: "Product updated." };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to update product" };
  }
}

export async function deleteProductAction(productId: string): Promise<ActionResult> {
  await requireRole("user");

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) throw new Error(error.message);

    revalidateTag("products", "max");
    revalidateTag(`product-${productId}`, "max");
    return { success: true, message: "Product deleted." };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to delete product" };
  }
}

/** Form `action` wrapper — React 19 expects `Promise<void>`, not `ActionResult`. */
export async function deleteProductFormAction(productId: string, _formData: FormData): Promise<void> {
  await deleteProductAction(productId);
}

export async function queueImageReprocessAction(productId: string, imageUrls: string[]) {
  await requireRole("user");
  after(async () => {
    const supabase = createAdminClient();
    const [a, b, c] = imageUrls;
    await supabase
      .from("products")
      .update({
        image1: a ?? null,
        image2: b ?? null,
        image3: c ?? null,
        main_image: a ?? b ?? c ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);
    revalidateTag("products", "max");
    revalidateTag(`product-${productId}`, "max");
  });
}
