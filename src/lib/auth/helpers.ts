import "server-only";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { UserRole, SessionUser } from "@/lib/types";

// ============================================
// AUTH UTILITIES (server-only)
// ============================================

/**
 * Get the current session. Returns null if unauthenticated.
 */
export async function getSession() {
  return await auth();
}

/**
 * Get the current authenticated user.
 * Redirects to login if unauthenticated.
 */
export async function requireAuth(): Promise<SessionUser> {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  return session.user as SessionUser;
}

/**
 * Require a specific role. Redirects to /dashboard if insufficient role.
 */
export async function requireRole(requiredRole: UserRole): Promise<SessionUser> {
  const user = await requireAuth();

  const roleHierarchy: Record<UserRole, number> = {
    user: 1,
    admin: 2,
  };

  if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
    redirect("/dashboard");
  }

  return user;
}

/**
 * Check if current user is authenticated (no redirect).
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await auth();
  return !!session?.user;
}
