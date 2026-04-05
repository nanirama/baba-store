"use client";

import { useState, useTransition, type FormEvent } from "react";
import { processBulkUploadAction, type BulkImageFailure } from "@/actions/bulk-upload";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BulkUploadForm() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [messageOk, setMessageOk] = useState(true);
  const [imageFailures, setImageFailures] = useState<BulkImageFailure[] | undefined>(undefined);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const result = await processBulkUploadAction(formData);
        setMessageOk(result.success);
        setMessage(result.message ?? "");
        setImageFailures(result.imageFailures);
      } catch (err) {
        setMessageOk(false);
        setMessage(err instanceof Error ? err.message : "Bulk upload failed. Try again or use a smaller file.");
        setImageFailures(undefined);
      }
    });
  }

  return (
    <form
      className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6"
      onSubmit={onSubmit}
    >
      <h3 className="text-base font-semibold text-slate-900">Import file</h3>
      <p className="text-sm text-slate-500">
        Maps <span className="font-medium">SEO url 0</span> (and Slug) to product slug and HTML description.{" "}
        <span className="font-medium">Cat. 2</span> must match a top-level category and fills{" "}
        <span className="font-medium">category_id</span>; <span className="font-medium">Cat. 1</span> must match a subcategory
        under that parent and fills <span className="font-medium">parent_category_id</span> (existing categories in Supabase
        only — names or slugs). Main image: full URLs or site paths. <span className="font-medium">Image 1–3</span> use{" "}
        <span className="font-mono text-xs">https://baba.ge/image/cache/</span> then upload to storage.
      </p>
      <div className="space-y-1">
        <Label htmlFor="file">CSV or XLSX</Label>
        <Input id="file" name="file" type="file" accept=".csv,.xlsx" required />
      </div>
      <Button
        type="submit"
        className="bg-[#ff5100] font-medium text-white shadow-sm hover:bg-[#ff5100]/90"
        disabled={isPending}
        aria-busy={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="animate-spin" aria-hidden />
            Uploading…
          </>
        ) : (
          "Upload File"
        )}
      </Button>
      {message && (
        <p className={`text-sm whitespace-pre-wrap ${messageOk ? "text-slate-600" : "text-destructive"}`}>
          {message}
        </p>
      )}
      {messageOk && imageFailures && imageFailures.length > 0 && (
        <div
          className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/40"
          role="status"
        >
          <p className="font-medium text-amber-950 dark:text-amber-100">Products with image errors</p>
          <ul className="mt-2 space-y-3">
            {imageFailures.map((f) => (
              <li
                key={`${f.productId}-${f.slug}`}
                className="border-t border-amber-200/80 pt-2 first:border-t-0 first:pt-0 dark:border-amber-800"
              >
                <div>
                  <span className="font-medium text-foreground">{f.name ?? "—"}</span>{" "}
                  <span className="text-muted-foreground">({f.slug ?? "—"})</span>
                </div>
                <ul className="mt-1.5 list-inside list-disc space-y-1 text-xs text-amber-900/90 dark:text-amber-200/90">
                  {(Array.isArray(f.errors) ? f.errors : []).map((line, i) => (
                    <li key={i} className="whitespace-pre-wrap">
                      {line}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
