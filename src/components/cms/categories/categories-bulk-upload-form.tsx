"use client";

import { useState, useTransition } from "react";

import { processCategoriesBulkUploadAction } from "@/actions/categories-bulk-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CategoriesBulkUploadForm() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(true);

  return (
    <form
      className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6"
      action={(formData) => {
        startTransition(async () => {
          const result = await processCategoriesBulkUploadAction(formData);
          setOk(result.success);
          setMessage(result.message);
        });
      }}
    >
      <h3 className="text-base font-semibold text-slate-900">Import Categories (Excel/CSV)</h3>
      <p className="text-sm text-slate-500">
        Mapping: Name → name, SEO url 0 → slug, Description → description (converted to TipTap JSON), Category id,
        Parent id, Meta title, Meta description, Meta keywords, Sort order, Status.
      </p>
      <p className="text-sm text-slate-500">Status mapping: 1 = active, 0 = inactive.</p>

      <div className="space-y-1">
        <Label htmlFor="file">File</Label>
        <Input id="file" name="file" type="file" accept=".xlsx,.xls,.csv" required />
      </div>

      <Button
        type="submit"
        className="bg-[#ff5100] font-medium text-white shadow-sm hover:bg-[#ff5100]/90"
        disabled={isPending}
      >
        {isPending ? "Uploading..." : "Upload Categories"}
      </Button>

      {message ? (
        <p className={`text-sm whitespace-pre-wrap ${ok ? "text-slate-600" : "text-destructive"}`}>{message}</p>
      ) : null}
    </form>
  );
}

