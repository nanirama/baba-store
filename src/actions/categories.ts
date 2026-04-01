"use server";

import "server-only";

import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/helpers";
import type { CategoryRecord } from "@/types/cms";
import { categorySchema } from "@/utils/cms-schemas";
import { getDescendantIds } from "@/utils/category-tree";
import { slugify } from "@/utils/slug";
import { deleteProductImageByPublicUrl, uploadProductImage } from "@/lib/supabase/storage";
import type { MainImageDeleteResult, MainImageUploadResult } from "@/actions/products";

type ActionResult = { success: true; message: string } | { success: false; message: string };

/**
 * Parent is optional: if `category_id` does not match any row, store as top-level (0) instead of erroring.
 * Stale/orphan parent_id values often come from deleted parents or legacy imports.
 */
async function normalizeOptionalParentId(
  supabase: ReturnType<typeof createAdminClient>,
  requestedParentId: number
): Promise<{ parentId: number; error?: string }> {
  if (requestedParentId <= 0) return { parentId: 0 };
  const { data: parentRow } = await supabase
    .from("categories")
    .select("category_id, parent_id")
    .eq("category_id", requestedParentId)
    .maybeSingle();
  if (!parentRow) return { parentId: 0 };
  if (Number(parentRow.parent_id) !== 0) {
    return { parentId: requestedParentId, error: "Parent must be a top-level category." };
  }
  return { parentId: requestedParentId };
}

function toUploadableFile(entry: FormDataEntryValue | null): File | null {
  if (!entry) return null;
  if (entry instanceof File && entry.size > 0) return entry;
  if (entry instanceof Blob && entry.size > 0) {
    const type = entry.type || "image/jpeg";
    return new File([entry], "image", { type });
  }
  return null;
}

/** Upload category icon to the `products` storage bucket (path prefix `category-icons/`). */
export async function uploadCategoryIconAction(formData: FormData): Promise<MainImageUploadResult> {
  await requireRole("user");
  const file = toUploadableFile(formData.get("file"));
  if (!file) {
    return { ok: false, error: "Missing image file" };
  }
  try {
    const url = await uploadProductImage(file, "category-icons");
    return { ok: true, url };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Upload failed" };
  }
}

export async function deleteCategoryIconAction(publicUrl: string): Promise<MainImageDeleteResult> {
  await requireRole("user");
  try {
    await deleteProductImageByPublicUrl(publicUrl);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Delete failed" };
  }
}

export async function createCategoryAction(formData: FormData): Promise<ActionResult> {
  await requireRole("user");
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: String(formData.get("slug") || slugify(String(formData.get("name") ?? ""))),
    category_id: formData.get("category_id"),
    parent_id: formData.get("parent_id"),
    description: formData.get("description"),
    meta_title: formData.get("meta_title"),
    meta_description: formData.get("meta_description"),
    meta_keywords: formData.get("meta_keywords"),
    sort_order: formData.get("sort_order"),
    status: formData.get("status"),
    icon: formData.get("icon"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid payload" };
  }

  const supabase = createAdminClient();
  const { parentId: parent_id, error: parentErr } = await normalizeOptionalParentId(
    supabase,
    parsed.data.parent_id
  );
  if (parentErr) return { success: false, message: parentErr };
  if (parent_id > 0 && parent_id === parsed.data.category_id) {
    return { success: false, message: "Category cannot be its own parent." };
  }

  const { error } = await supabase.from("categories").insert({
    name: parsed.data.name,
    slug: slugify(parsed.data.slug),
    category_id: parsed.data.category_id,
    parent_id,
    description: parsed.data.description ?? null,
    meta_title: parsed.data.meta_title ?? null,
    meta_description: parsed.data.meta_description ?? null,
    meta_keywords: parsed.data.meta_keywords ?? null,
    sort_order: parsed.data.sort_order,
    status: parsed.data.status,
    icon: parsed.data.icon ?? null,
  });

  if (error) return { success: false, message: error.message };
  revalidateTag("categories", "max");
  return { success: true, message: "Category created" };
}

export async function updateCategoryAction(formData: FormData): Promise<ActionResult> {
  await requireRole("user");
  const id = String(formData.get("id") ?? "");
  if (!id) return { success: false, message: "Missing category id" };

  const parsed = categorySchema.safeParse({
    id,
    name: formData.get("name"),
    slug: String(formData.get("slug") || slugify(String(formData.get("name") ?? ""))),
    category_id: formData.get("category_id"),
    parent_id: formData.get("parent_id"),
    description: formData.get("description"),
    meta_title: formData.get("meta_title"),
    meta_description: formData.get("meta_description"),
    meta_keywords: formData.get("meta_keywords"),
    sort_order: formData.get("sort_order"),
    status: formData.get("status"),
    icon: formData.get("icon"),
  });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid payload" };
  }

  const supabase = createAdminClient();
  const { parentId: parent_id, error: parentErr } = await normalizeOptionalParentId(
    supabase,
    parsed.data.parent_id
  );
  if (parentErr) return { success: false, message: parentErr };

  if (parent_id > 0) {
    if (parent_id === parsed.data.category_id) {
      return { success: false, message: "Category cannot be its own parent." };
    }
    const { data: allRows } = await supabase.from("categories").select("*");
    const flat = (allRows ?? []) as CategoryRecord[];
    if (getDescendantIds(flat, parsed.data.category_id).has(parent_id)) {
      return { success: false, message: "Parent cannot be a subcategory of this category." };
    }
  }

  const { error } = await supabase
    .from("categories")
    .update({
      name: parsed.data.name,
      slug: slugify(parsed.data.slug),
      category_id: parsed.data.category_id,
      parent_id,
      description: parsed.data.description ?? null,
      meta_title: parsed.data.meta_title ?? null,
      meta_description: parsed.data.meta_description ?? null,
      meta_keywords: parsed.data.meta_keywords ?? null,
      sort_order: parsed.data.sort_order,
      status: parsed.data.status,
      icon: parsed.data.icon ?? null,
    })
    .eq("id", id);

  if (error) return { success: false, message: error.message };
  revalidateTag("categories", "max");
  revalidateTag("products", "max");
  return { success: true, message: "Category updated" };
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  await requireRole("user");
  const supabase = createAdminClient();
  const { data: cur } = await supabase.from("categories").select("category_id").eq("id", id).maybeSingle();
  if (!cur?.category_id) return { success: false, message: "Category not found." };
  const { data: child } = await supabase
    .from("categories")
    .select("id")
    .eq("parent_id", cur.category_id)
    .limit(1)
    .maybeSingle();
  if (child) {
    return { success: false, message: "Move or delete subcategories first." };
  }
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { success: false, message: error.message };

  revalidateTag("categories", "max");
  revalidateTag("products", "max");
  return { success: true, message: "Category deleted" };
}
