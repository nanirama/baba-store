"use server";

import { signIn, signOut } from "@/lib/auth";
import { loginSchema } from "@/lib/utils/validation";
import { AuthError } from "next-auth";
import type { ActionResult } from "@/lib/types";

// ============================================
// LOGIN ACTION
// ============================================

export async function loginAction(
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  // Server-side Zod validation
  const parsed = loginSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    return { success: true, message: "Login successful" };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, message: "Invalid email or password" };
        default:
          return { success: false, message: "Authentication failed. Please try again." };
      }
    }
    // Re-throw redirect errors from Next.js
    throw error;
  }
}

// ============================================
// LOGOUT ACTION
// ============================================

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/auth/login" });
}
