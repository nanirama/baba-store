"use client";

import { useState } from "react";

type OrderFormProps = {
  productName: string;
  productSku: string | null;
};

type FormData = {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  product_name: string;
  product_sku: string;
};

export function OrderForm({ productName, productSku }: OrderFormProps) {
  const receiverEmail = process.env.NEXT_PUBLIC_RECEIVER_EMAIL?.trim();

  const initialValues: FormData = {
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    product_name: productName,
    product_sku: productSku ?? "",
  };

  const [formData, setFormData] = useState<FormData>(initialValues);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  //console.log('supabase', supabase);

  const convertToSnakeCase = (data: FormData, product_name: string, product_sku: string): Record<string, string> => ({
    first_name: data.firstName,
    last_name: data.lastName,
    phone: data.phone,
    address: data.address,
    product_name: product_name,
    product_sku: product_sku,
  });

  const validateForm = (data: FormData) => {
    const nextErrors: Record<string, string> = {};
    if (!data.firstName.trim()) nextErrors.firstName = "ეს ველი საჭიროა";
    if (!data.lastName.trim()) nextErrors.lastName = "ეს ველი საჭიროა";
    if (!data.phone.trim() || data.phone.trim().length < 5) {
      nextErrors.phone = "ეს ველი საჭიროა";
    }
    if (!data.address.trim()) nextErrors.address = "ეს ველი საჭიროა";
    return { valid: Object.keys(nextErrors).length === 0, errors: nextErrors };
  };

  const sendEmail = async (payload: FormData) => {
    if (!receiverEmail) {
      console.error("NEXT_PUBLIC_RECEIVER_EMAIL is not configured");
      return;
    }

    try {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: receiverEmail,
          params: {
            name: `${payload.firstName} ${payload.lastName}`.trim(),
            phone: payload.phone,
            address: payload.address,
            product_name: payload.product_name,
            product_sku: payload.product_sku,
          },
        }),
      });
    } catch (error) {
      console.error("Error sending email:", error);
    }
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async () => {
    console.log('handleSubmit');
    const payload = formData;
    const validation = validateForm(payload);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    console.log('payload', payload);

    setIsLoading(true);
    try {
      const snakeCaseData = convertToSnakeCase(payload, productName, productSku ?? "");
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snakeCaseData),
      });
      if (!orderRes.ok) {
        const body = await orderRes.json().catch(() => ({}));
        console.error("Error saving to database:", body);
        alert("დაფიქსირდა შეცდომა. გთხოვთ სცადოთ თავიდან.");
        return;
      }

      await sendEmail(payload);
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error:", error);
      alert("დაფიქსირდა შეცდომა. გთხოვთ სცადოთ თავიდან.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="my-5 rounded-lg border border-green-200 bg-green-50 p-4 text-center">
        <p className="text-sm font-medium text-green-800">
          შეკვეთა მიღებულია, მოკლე დროში დაგიკავშირდებით.
        </p>
      </div>
    );
  }

  return (
    <form
      className="my-5 rounded-lg border border-neutral-200 bg-white p-4"
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit();
      }}
      aria-label="Order form"
    >
      <h2 className="text-base font-semibold text-neutral-900">შეკვეთის ფორმა</h2>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => updateFormData("firstName", e.target.value)}
            className={`h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 ${
              errors.firstName ? "border-red-500" : "border-neutral-300"
            }`}
            placeholder="სახელი"
          />
          {errors.firstName ? <p className="mt-1 text-xs text-red-600">{errors.firstName}</p> : null}
        </div>

        <div>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => updateFormData("lastName", e.target.value)}
            className={`h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 ${
              errors.lastName ? "border-red-500" : "border-neutral-300"
            }`}
            placeholder="გვარი"
          />
          {errors.lastName ? <p className="mt-1 text-xs text-red-600">{errors.lastName}</p> : null}
        </div>

        <div className="sm:col-span-2">
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => updateFormData("phone", e.target.value)}
            className={`h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 ${
              errors.phone ? "border-red-500" : "border-neutral-300"
            }`}
            placeholder="ტელ. ნომერი"
          />
          {errors.phone ? <p className="mt-1 text-xs text-red-600">{errors.phone}</p> : null}
        </div>

        <div className="sm:col-span-2">
          <textarea
            value={formData.address}
            onChange={(e) => updateFormData("address", e.target.value)}
            rows={3}
            className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 ${
              errors.address ? "border-red-500" : "border-neutral-300"
            }`}
            placeholder="მისამართი"
          />
          {errors.address ? <p className="mt-1 text-xs text-red-600">{errors.address}</p> : null}
        </div>
      </div>

      <div className="mt-4 rounded-md bg-neutral-50 p-3 text-xs text-neutral-700">
        <p>
          <span className="font-medium">პროდუქტი:</span> {productName}
        </p>
        {productSku ? (
          <p className="mt-1">
            <span className="font-medium">SKU:</span> {productSku}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-4 rounded-md bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isLoading ? "იგზავნება..." : "შეკვეთის გაგზავნა"}
      </button>
    </form>
  );
}
