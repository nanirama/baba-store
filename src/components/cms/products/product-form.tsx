"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useTransition } from "react";
import { createProductAction, updateProductAction } from "@/actions/products";
import type { ProductRecord } from "@/types/cms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProductImageField } from "@/components/cms/products/product-image-field";
import { ProductMainImageField } from "@/components/cms/products/product-main-image-field";
import { slugify } from "@/utils/slug";

const TipTapEditor = dynamic(
  () => import("@/components/cms/editor/tiptap-editor").then((mod) => mod.TipTapEditor),
  { ssr: false, loading: () => <div className="h-[220px] rounded-md border border-input bg-muted animate-pulse" /> }
);

type ProductFormProps = {
  product?: ProductRecord | null;
};

const defaultDescription = JSON.stringify({ type: "doc", content: [] });

function formDataForConsole(fd: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of fd.entries()) {
    const entry =
      value instanceof File
        ? { _type: "File" as const, name: value.name, size: value.size, type: value.type || undefined }
        : value;
    if (key in out) {
      const prev = out[key];
      out[key] = Array.isArray(prev) ? [...prev, entry] : [prev, entry];
    } else {
      out[key] = entry;
    }
  }
  return out;
}

/** Safe flag from DB/API — avoids `Boolean("false") === true` and handles 0/1. */
function coerceProductFlag(v: unknown): boolean {
  if (v === true || v === 1) return true;
  if (v === false || v === 0 || v == null) return false;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true" || s === "1" || s === "t" || s === "yes" || s === "on") return true;
    if (s === "false" || s === "0" || s === "f" || s === "no" || s === "") return false;
  }
  return false;
}

export function ProductForm({ product }: ProductFormProps) {
  const productData = product as (ProductRecord & {
    meta_title?: string | null;
    meta_description?: string | null;
    meta_keywords?: string | null;
    weight?: number | null;
    length?: number | null;
    width?: number | null;
    height?: number | null;
  }) | null;

  const [isPending, startTransition] = useTransition();
  const [resultMessage, setResultMessage] = useState<string>("");
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [metaTitle, setMetaTitle] = useState(
    product?.meta?.title ?? productData?.meta_title ?? ""
  );
  const [metaDescription, setMetaDescription] = useState(
    product?.meta?.description ?? productData?.meta_description ?? ""
  );
  const [metaKeywords, setMetaKeywords] = useState(
    product?.meta?.keywords?.join(", ") ?? productData?.meta_keywords ?? ""
  );
  const [description, setDescription] = useState(
    product?.description ? JSON.stringify(product.description) : defaultDescription
  );
  const isEdit = Boolean(product?.id);
  const autoSlug = slugify(name);
  const initialStockStatus =
    (product as unknown as { stock_status?: string | null } | null)?.stock_status ??
    "InStock";

  const [mainImageUrl, setMainImageUrl] = useState(() => product?.main_image ?? "");
  const [image1Url, setImage1Url] = useState(() => product?.image1 ?? "");
  const [image2Url, setImage2Url] = useState(() => product?.image2 ?? "");
  const [image3Url, setImage3Url] = useState(() => product?.image3 ?? "");

  const [promotions, setPromotions] = useState(() => coerceProductFlag(product?.promotions));
  const [bestsellers, setBestsellers] = useState(() => coerceProductFlag(product?.bestsellers));
  const [discounts, setDiscounts] = useState(() => coerceProductFlag(product?.discounts));

  useEffect(() => {
    setMainImageUrl(product?.main_image ?? "");
    setImage1Url(product?.image1 ?? "");
    setImage2Url(product?.image2 ?? "");
    setImage3Url(product?.image3 ?? "");
  }, [product?.id, product?.main_image, product?.image1, product?.image2, product?.image3]);

  useEffect(() => {
    setPromotions(coerceProductFlag(product?.promotions));
    setBestsellers(coerceProductFlag(product?.bestsellers));
    setDiscounts(coerceProductFlag(product?.discounts));
  }, [product?.id, product?.promotions, product?.bestsellers, product?.discounts]);

  return (
    <form
      className="space-y-6 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6 md:p-8"
      action={(formData) => {
        const fd = new FormData();
        formData.forEach((value, key) => {
          fd.append(key, value);
        });
        fd.set("name", name);
        fd.set("slug", isEdit ? slugify(slug || name) : autoSlug);
        fd.set("meta_title", metaTitle);
        fd.set("meta_description", metaDescription);
        fd.set("meta_keywords", metaKeywords);
        fd.set("description", description);
        fd.set("mainImage", mainImageUrl);
        fd.set("image1", image1Url);
        fd.set("image2", image2Url);
        fd.set("image3", image3Url);
        fd.set("promotions", promotions ? "true" : "false");
        fd.set("bestsellers", bestsellers ? "true" : "false");
        fd.set("discounts", discounts ? "true" : "false");
        console.log("[ProductForm] post submission", formDataForConsole(fd));
        startTransition(async () => {
          const action = product ? updateProductAction : createProductAction;
          const result = await action(fd);
          setResultMessage(result.message);
        });
      }}
    >
      {product?.id && <input type="hidden" name="id" value={product.id} />}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            name="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            value={isEdit ? slug : autoSlug}
            onChange={(event) => {
              if (isEdit) setSlug(event.target.value);
            }}
            readOnly={!isEdit}
            required
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input id="model" name="model" defaultValue={product?.model ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="manufacturer">Manufacturer</Label>
          <Input id="manufacturer" name="manufacturer" defaultValue={product?.manufacturer ?? ""} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description (TipTap JSON)</Label>
        <TipTapEditor value={description} onChange={setDescription} />
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input id="price" name="price" type="number" step="0.01" defaultValue={product?.price ?? 0} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input id="quantity" name="quantity" type="number" defaultValue={product?.quantity ?? 0} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock_status">Stock Status</Label>
          <select
            id="stock_status"
            name="stock_status"
            defaultValue={initialStockStatus}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="InStock">InStock</option>
            <option value="OutOfStock">OutOfStock</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={product?.status ?? "draft"}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="draft">draft</option>
            <option value="active">active</option>
            <option value="archived">archived</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <input type="hidden" name="promotions" value={promotions ? "true" : "false"} />
        <input type="hidden" name="bestsellers" value={bestsellers ? "true" : "false"} />
        <input type="hidden" name="discounts" value={discounts ? "true" : "false"} />
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            id="promotions"
            className="h-4 w-4 rounded border-input"
            checked={promotions}
            onChange={(e) => setPromotions(e.target.checked)}
          />
          Promotions
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            id="bestsellers"
            className="h-4 w-4 rounded border-input"
            checked={bestsellers}
            onChange={(e) => setBestsellers(e.target.checked)}
          />
          Bestsellers
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            id="discounts"
            className="h-4 w-4 rounded border-input"
            checked={discounts}
            onChange={(e) => setDiscounts(e.target.checked)}
          />
          Discounts
        </label>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" name="sku" defaultValue={product?.sku ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="upc">UPC</Label>
          <Input id="upc" name="upc" defaultValue={product?.upc ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mpn">MPN</Label>
          <Input id="mpn" name="mpn" defaultValue={product?.mpn ?? ""} />
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="weight">Weight</Label>
          <Input id="weight" name="weight" type="number" step="0.01" defaultValue={productData?.weight ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="length">Length</Label>
          <Input id="length" name="length" type="number" step="0.01" defaultValue={productData?.length ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="width">Width</Label>
          <Input id="width" name="width" type="number" step="0.01" defaultValue={productData?.width ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="height">Height</Label>
          <Input id="height" name="height" type="number" step="0.01" defaultValue={productData?.height ?? ""} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="meta_title">Meta Title</Label>
          <Input
            id="meta_title"
            name="meta_title"
            value={metaTitle}
            onChange={(event) => setMetaTitle(event.target.value)}
            placeholder="SEO meta title"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="meta_description">Meta Description</Label>
            <Textarea
              id="meta_description"
              name="meta_description"
              value={metaDescription}
              onChange={(event) => setMetaDescription(event.target.value)}
              placeholder="SEO meta description"
              rows={5}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meta_keywords">Meta Keywords</Label>
            <Textarea
              id="meta_keywords"
              name="meta_keywords"
              value={metaKeywords}
              onChange={(event) => setMetaKeywords(event.target.value)}
              placeholder="keyword1, keyword2"
              rows={5}
            />
          </div>
        </div>
      </div>

      <ProductMainImageField
        resetKey={product?.id ?? "new"}
        initialUrl={product?.main_image ?? null}
        value={mainImageUrl}
        onValueChange={setMainImageUrl}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <ProductImageField
          label="Image 1"
          id="productImage1"
          resetKey={product?.id ?? "new"}
          initialUrl={product?.image1 ?? null}
          value={image1Url}
          onValueChange={setImage1Url}
        />
        <ProductImageField
          label="Image 2"
          id="productImage2"
          resetKey={product?.id ?? "new"}
          initialUrl={product?.image2 ?? null}
          value={image2Url}
          onValueChange={setImage2Url}
        />
        <ProductImageField
          label="Image 3"
          id="productImage3"
          resetKey={product?.id ?? "new"}
          initialUrl={product?.image3 ?? null}
          value={image3Url}
          onValueChange={setImage3Url}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" className="bg-[#ff5100] text-white hover:bg-[#ff5100]/90" disabled={isPending}>
          {product ? "Update Product" : "Create Product"}
        </Button>
        {resultMessage && <p className="text-sm text-muted-foreground">{resultMessage}</p>}
      </div>
    </form>
  );
}
