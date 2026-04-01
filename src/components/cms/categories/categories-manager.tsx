"use client";

import { useState, useTransition } from "react";
import { createCategoryAction, deleteCategoryAction, updateCategoryAction } from "@/actions/categories";
import type { CategoryRecord } from "@/types/cms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/utils/slug";

type CategoriesManagerProps = {
  categories: CategoryRecord[];
};

export function CategoriesManager({ categories }: CategoriesManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  return (
    <div className="space-y-8">
      <form
        className="space-y-3 p-4 border rounded-lg"
        action={(formData) => {
          startTransition(async () => {
            const result = await createCategoryAction(formData);
            setMessage(result.message);
          });
        }}
      >
        <h2 className="text-lg font-semibold">Add Category</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              required
              onChange={(event) => {
                const slug = document.getElementById("slug") as HTMLInputElement | null;
                if (slug && !slug.value) slug.value = slugify(event.target.value);
              }}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" required />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="description">Description</Label>
          <Input id="description" name="description" />
        </div>
        <Button type="submit" className="bg-[#ff5100] text-white hover:bg-[#ff5100]/90" disabled={isPending}>
          Create Category
        </Button>
      </form>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Existing Categories</h2>
        {categories.length === 0 && <p className="text-sm text-muted-foreground">No categories found.</p>}

        {categories.map((category) => (
          <div key={category.id} className="border rounded-lg p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {editingCategoryId === category.id ? (
                <Input
                  value={editingCategoryName}
                  onChange={(event) => setEditingCategoryName(event.target.value)}
                  className="max-w-sm"
                  required
                />
              ) : (
                <p className="font-medium">{category.name}</p>
              )}

              <div className="flex items-center gap-2">
                {editingCategoryId === category.id ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPending || !editingCategoryName.trim()}
                      onClick={() => {
                        const formData = new FormData();
                        formData.set("id", category.id);
                        formData.set("name", editingCategoryName.trim());
                        formData.set("slug", slugify(editingCategoryName.trim()));
                        formData.set(
                          "description",
                          category.description == null ? "" : JSON.stringify(category.description)
                        );
                        formData.set("parent_id", String(category.parent_id ?? 0));
                        formData.set("category_id", String(category.category_id ?? 0));
                        formData.set("meta_title", category.meta_title ?? "");
                        formData.set("meta_description", category.meta_description ?? "");
                        formData.set("meta_keywords", category.meta_keywords ?? "");
                        formData.set("sort_order", String(category.sort_order ?? 0));
                        formData.set("status", category.status ?? "active");
                        formData.set("icon", category.icon ?? "");

                        startTransition(async () => {
                          const result = await updateCategoryAction(formData);
                          setMessage(result.message);
                          setEditingCategoryId(null);
                          setEditingCategoryName("");
                        });
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => {
                        setEditingCategoryId(null);
                        setEditingCategoryName("");
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => {
                      setEditingCategoryId(category.id);
                      setEditingCategoryName(category.name);
                    }}
                  >
                    Edit
                  </Button>
                )}

                <Button
                  type="button"
                  variant="destructive"
                  disabled={isPending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await deleteCategoryAction(category.id);
                      setMessage(result.message);
                    });
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
