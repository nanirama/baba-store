"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { resetPasswordSchema, updatePasswordSchema } from "@/lib/utils/validation";
import type { ActionResult } from "@/lib/types";

// ============================================
// REQUEST PASSWORD RESET
// ============================================

export async function requestPasswordResetAction(
  formData: FormData
): Promise<ActionResult> {
  const rawData = { email: formData.get("email") };

  const parsed = resetPasswordSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const supabase = createAdminClient();

    const { error } = await supabase.auth.resetPasswordForEmail(
      parsed.data.email,
      {
        redirectTo: `${process.env.NEXTAUTH_URL}/auth/reset-password/update`,
      }
    );

    if (error) {
      console.error("[Reset] Supabase reset error:", error.message);
      // Return success regardless to prevent email enumeration attacks
    }

    return {
      success: true,
      message:
        "If an account exists with that email, you will receive a reset link shortly.",
    };
  } catch (error) {
    console.error("[Reset] Unexpected error:", error);
    return {
      success: false,
      message: "Something went wrong. Please try again.",
    };
  }
}

// ============================================
// UPDATE PASSWORD (after reset)
// ============================================

export async function updatePasswordAction(
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    token: formData.get("token"),
  };

  const parsed = updatePasswordSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const supabase = createAdminClient();

    // Exchange token for session first
    const { data: sessionData, error: sessionError } =
      await supabase.auth.exchangeCodeForSession(parsed.data.token);

    if (sessionError || !sessionData.user) {
      return {
        success: false,
        message: "Invalid or expired reset token. Please request a new one.",
      };
    }

    // Update the password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      sessionData.user.id,
      { password: parsed.data.password }
    );

    if (updateError) {
      console.error("[Reset] Update password error:", updateError.message);
      return { success: false, message: "Failed to update password. Please try again." };
    }

    return { success: true, message: "Password updated successfully. You can now log in." };
  } catch (error) {
    console.error("[Reset] Unexpected error:", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }
}
