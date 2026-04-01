"use client";

import { ProductImageField } from "@/components/cms/products/product-image-field";

type ProductMainImageFieldProps = {
  value: string;
  onValueChange: (url: string) => void;
  initialUrl?: string | null;
  resetKey?: string;
  id?: string;
  className?: string;
};

/** Main product image — thin wrapper around {@link ProductImageField}. */
export function ProductMainImageField({
  value,
  onValueChange,
  initialUrl = null,
  resetKey = "default",
  id = "mainImageFile",
  className,
}: ProductMainImageFieldProps) {
  return (
    <ProductImageField
      label="Main Image"
      previewCaption="Main image preview"
      value={value}
      onValueChange={onValueChange}
      initialUrl={initialUrl}
      resetKey={resetKey}
      id={id}
      className={className}
    />
  );
}
