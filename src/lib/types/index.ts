// ============================================
// AUTH TYPES
// ============================================

export type UserRole = "admin" | "user";

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
}

export interface SessionUser extends AuthUser {
  accessToken?: string;
}

// ============================================
// ACTION RESPONSE TYPES
// ============================================

export interface ActionResult<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// ============================================
// FORM TYPES
// ============================================

export interface LoginFormData {
  email: string;
  password: string;
}

export interface ResetPasswordFormData {
  email: string;
}

export interface UpdatePasswordFormData {
  password: string;
  confirmPassword: string;
  token: string;
}
