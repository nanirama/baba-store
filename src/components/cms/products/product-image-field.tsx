"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  deleteProductMainImageAction,
  uploadProductMainImageAction,
  type MainImageDeleteResult,
  type MainImageUploadResult,
} from "@/actions/products";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type ProductImageFieldProps = {
  label: string;
  previewCaption?: string;
  /** Current URL — parent owns state so the form submit can `fd.set` reliably. */
  value: string;
  onValueChange: (url: string) => void;
  /** DB value when editing — used to decide whether removing deletes storage. */
  initialUrl?: string | null;
  resetKey?: string;
  id: string;
  className?: string;
  /** Override for non-product uploads (e.g. category icons). */
  uploadAction?: (formData: FormData) => Promise<MainImageUploadResult>;
  deleteAction?: (publicUrl: string) => Promise<MainImageDeleteResult>;
};

/**
 * Single product image: upload to Supabase via server action, preview, remove.
 * URLs are controlled by the parent (e.g. product form) so server actions always receive them.
 */
export function ProductImageField({
  label,
  previewCaption = "Image preview",
  value,
  onValueChange,
  initialUrl = null,
  resetKey = "default",
  id,
  className,
  uploadAction = uploadProductMainImageAction,
  deleteAction = deleteProductMainImageAction,
}: ProductImageFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialFromServerRef = useRef(initialUrl ?? "");
  const sessionUploadedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    initialFromServerRef.current = initialUrl ?? "";
    sessionUploadedRef.current = new Set();
    setError(null);
  }, [resetKey, initialUrl]);

  const deleteFromStorage = useCallback(
    async (publicUrl: string) => {
      const result = await deleteAction(publicUrl);
      if (!result.ok) {
        throw new Error(result.error);
      }
    },
    [deleteAction]
  );

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const previous = value;
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadAction(formData);
      if (!result.ok) {
        throw new Error(result.error);
      }

      if (previous && sessionUploadedRef.current.has(previous)) {
        try {
          await deleteFromStorage(previous);
        } catch {
          // best-effort cleanup
        }
        sessionUploadedRef.current.delete(previous);
      }

      sessionUploadedRef.current.add(result.url);
      onValueChange(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!value) return;
    setError(null);

    const shouldDeleteFromBucket =
      sessionUploadedRef.current.has(value) && value !== initialFromServerRef.current;

    if (shouldDeleteFromBucket) {
      try {
        await deleteFromStorage(value);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete image");
        return;
      }
      sessionUploadedRef.current.delete(value);
    }

    onValueChange("");
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="file"
        accept="image/*"
        disabled={uploading}
        onChange={handleFileChange}
        className="cursor-pointer disabled:opacity-60"
      />
      {uploading && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          Uploading…
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}

      {value ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{previewCaption}</p>
          <div className="relative inline-block">
            <img src={value} alt={label} className="h-28 w-28 rounded-md border object-cover" />
            <button
              type="button"
              aria-label={`Remove ${label}`}
              className="absolute -right-2 -top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black text-white hover:bg-[#ff5100]"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
