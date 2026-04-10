"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/server";

export type ActionResult = {
  success: boolean;
  message: string;
};

export async function deleteOrderAction(orderId: string): Promise<ActionResult> {
  await requireRole("user");
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("orders").delete().eq("id", orderId);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/orders");
    return { success: true, message: "Order deleted." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete order",
    };
  }
}

export async function deleteOrderFormAction(
  orderId: string,
  _formData: FormData,
): Promise<void> {
  await deleteOrderAction(orderId);
}

export async function deleteOrderAndRedirectFormAction(
  orderId: string,
  _formData: FormData,
): Promise<void> {
  const result = await deleteOrderAction(orderId);
  if (!result.success) return;
  redirect("/dashboard/orders");
}
