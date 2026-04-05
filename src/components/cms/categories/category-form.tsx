"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCategoryAction, updateCategoryAction } from "@/actions/categories";
import type { CategoryRecord } from "@/types/cms";
import { getDescendantIds } from "@/utils/category-tree";
import { slugify } from "@/utils/slug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductImageField } from "@/components/cms/products/product-image-field";
import { deleteCategoryIconAction, uploadCategoryIconAction } from "@/actions/categories";

const TipTapEditor = dynamic(
  () => import("@/components/cms/editor/tiptap-editor").then((mod) => mod.TipTapEditor),
  { ssr: false, loading: () => <div className="h-[220px] rounded-md border border-input bg-muted animate-pulse" /> }
);

const defaultDescription = JSON.stringify({ type: "doc", content: [] });

function toEditorDescription(value: unknown): string {
  if (value == null) return defaultDescription;
  if (typeof value === "string") {
    const t = value.trim();
    if (!t) return defaultDescription;
    try {
      JSON.parse(t);
      return t;
    } catch {
      return JSON.stringify({
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: t }] }],
      });
    }
  }
  if (typeof value === "object") return JSON.stringify(value);
  return defaultDescription;
}

type CategoryFormProps = {
  category?: CategoryRecord | null;
  allCategories: CategoryRecord[];
};

export function CategoryForm({ category, allCategories }: CategoryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  /** New category: stop auto-filling slug from name after user edits slug. */
  const [slugTouched, setSlugTouched] = useState(false);
  const [categoryId, setCategoryId] = useState(String(category?.category_id ?? 0));
  const [parentId, setParentId] = useState(String(category?.parent_id ?? 0));
  const [description, setDescription] = useState(toEditorDescription(category?.description));
  const [metaTitle, setMetaTitle] = useState(category?.meta_title ?? "");
  const [metaDescription, setMetaDescription] = useState(category?.meta_description ?? "");
  const [metaKeywords, setMetaKeywords] = useState(category?.meta_keywords ?? "");
  const [sortOrder, setSortOrder] = useState(String(category?.sort_order ?? 0));
  const [status, setStatus] = useState(category?.status ?? "active");
  const [icon, setIcon] = useState(category?.icon ?? "");
  const [message, setMessage] = useState("");

  const isEdit = Boolean(category?.id);

  const invalidParentIds = useMemo(() => {
    if (!category) return new Set<number>();
    const d = getDescendantIds(allCategories, category.category_id);
    d.add(category.category_id);
    return d;
  }, [allCategories, category]);

  const parentOptions = useMemo(
    () =>
      [...allCategories]
        .filter((c) => c.parent_id === 0 && !invalidParentIds.has(c.category_id))
        .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
    [allCategories, invalidParentIds]
  );

  useEffect(() => {
    setName(category?.name ?? "");
    setSlug(category?.slug ?? "");
    setCategoryId(String(category?.category_id ?? 0));
    const rawParent = category?.parent_id ?? 0;
    const parentNumeric = Number(rawParent);
    const parentExistsAsTopLevel =
      parentNumeric <= 0 ||
      allCategories.some((c) => c.category_id === parentNumeric && c.parent_id === 0);
    setParentId(String(parentExistsAsTopLevel ? parentNumeric : 0));
    setDescription(toEditorDescription(category?.description));
    setMetaTitle(category?.meta_title ?? "");
    setMetaDescription(category?.meta_description ?? "");
    setMetaKeywords(category?.meta_keywords ?? "");
    setSortOrder(String(category?.sort_order ?? 0));
    setStatus(category?.status ?? "active");
    setIcon(category?.icon ?? "");
    setSlugTouched(false);
  }, [category, allCategories]);

  function onNameChange(value: string) {
    setName(value);
    if (isEdit) {
      if (slug === category?.slug) setSlug(slugify(value));
    } else if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  function onSubmit() {
    const formData = new FormData();
    if (category?.id) formData.set("id", category.id);
    formData.set("name", name);
    formData.set("slug", slugify(slug || name));
    formData.set("category_id", categoryId.trim() || "0");
    formData.set("parent_id", parentId.trim() || "0");
    formData.set("description", description);
    formData.set("meta_title", metaTitle);
    formData.set("meta_description", metaDescription);
    formData.set("meta_keywords", metaKeywords);
    formData.set("sort_order", sortOrder.trim() || "0");
    formData.set("status", status.trim() || "active");
    formData.set("icon", icon.trim());

    startTransition(async () => {
      const result = isEdit ? await updateCategoryAction(formData) : await createCategoryAction(formData);
      setMessage(result.message);
      if (result.success) {
        router.push("/dashboard/categories");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="name">Category Name</Label>
          <Input id="name" name="name" value={name} onChange={(e) => onNameChange(e.target.value)} required />
        </div>

        <div className="space-y-1">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            required
          />
        </div>

        <input type="hidden" name="category_id" value={categoryId} />

        <div className="space-y-1">
          <Label htmlFor="parent_id">Parent category (optional)</Label>
          <select
            id="parent_id"
            name="parent_id"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="0">Top level (0)</option>
            {parentOptions.map((c) => (
              <option key={c.id} value={String(c.category_id)}>
                {c.name} ({c.category_id})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="sort_order">Sort Order</Label>
          <Input
            id="sort_order"
            name="sort_order"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="status">Status</Label>
          <Input id="status" name="status" value={status} onChange={(e) => setStatus(e.target.value)} />
        </div>

        <ProductImageField
          id="category_icon"
          label="Icon"
          previewCaption="Icon preview"
          value={icon}
          onValueChange={setIcon}
          initialUrl={category?.icon}
          resetKey={category?.id ?? "new"}
          className="md:col-span-2"
          uploadAction={uploadCategoryIconAction}
          deleteAction={deleteCategoryIconAction}
        />

        <div className="space-y-1 md:col-span-2">
          <Label>Description</Label>
          <TipTapEditor value={description} onChange={setDescription} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="meta_title">Meta Title</Label>
          <Input id="meta_title" name="meta_title" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="meta_keywords">Meta Keywords</Label>
          <Input
            id="meta_keywords"
            name="meta_keywords"
            value={metaKeywords}
            onChange={(e) => setMetaKeywords(e.target.value)}
          />
        </div>

        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="meta_description">Meta Description</Label>
          <Input
            id="meta_description"
            name="meta_description"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 md:col-span-2">
          <Button
            type="button"
            className="bg-[#ff5100] text-white hover:bg-[#ff5100]/90"
            disabled={isPending || !name.trim()}
            onClick={onSubmit}
          >
            {isEdit ? "Update Category" : "Create Category"}
          </Button>
          <Button type="button" variant="outline" disabled={isPending} onClick={() => router.push("/dashboard/categories")}>
            Cancel
          </Button>
        </div>

        {message ? <p className="text-sm text-muted-foreground md:col-span-2">{message}</p> : null}
      </div>
    </div>
  );
}
