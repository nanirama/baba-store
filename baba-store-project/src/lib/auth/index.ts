import "server-only";

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { createAdminClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/utils/validation";
import type { UserRole } from "@/lib/types";

// ============================================
// NEXTAUTH CONFIGURATION
// ============================================

export const { handlers, signIn, signOut, auth } = NextAuth({
  // ── Session Strategy ──────────────────────
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8, // 8 hours
    updateAge: 60 * 60,   // Re-issue token every 1 hour
  },

  // ── Secure Cookies ────────────────────────
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  // ── Pages ─────────────────────────────────
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },

  // ── Providers ─────────────────────────────
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // 1. Validate input shape with Zod
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          throw new Error("Invalid credentials format");
        }

        const { email, password } = parsed.data;

        try {
          const supabase = createAdminClient();

          // 2. Fetch user from Supabase Auth
          const { data: authData, error: authError } =
            await supabase.auth.admin.listUsers();

          if (authError) {
            console.error("[Auth] Supabase listUsers error:", authError.message);
            throw new Error("Authentication service unavailable");
          }

          const supabaseUser = authData.users.find(
            (u) => u.email?.toLowerCase() === email.toLowerCase()
          );

          if (!supabaseUser) {
            throw new Error("Invalid email or password");
          }

          // 3. Verify password via Supabase Auth sign-in
          //    (Supabase manages hashing; we delegate to it)
          const { error: signInError } =
            await supabase.auth.signInWithPassword({
              email,
              password,
            });

          if (signInError) {
            throw new Error("Invalid email or password");
          }

          // 4. Fetch role from user metadata or profiles table
          const role: UserRole =
            (supabaseUser.user_metadata?.role as UserRole) ?? "user";

          return {
            id: supabaseUser.id,
            email: supabaseUser.email ?? "",
            name: supabaseUser.user_metadata?.full_name ?? null,
            role,
          };
        } catch (error) {
          if (error instanceof Error) {
            throw new Error(error.message);
          }
          throw new Error("Authentication failed");
        }
      },
    }),
  ],

  // ── Callbacks ─────────────────────────────
  callbacks: {
    async jwt({ token, user }) {
      // On first sign-in, persist user fields to JWT
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = (user as { role?: UserRole }).role ?? "user";
      }
      return token;
    },

    async session({ session, token }) {
      // Expose safe fields to client session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.email = token.email as string;
        session.user.name = token.name as string | null;
      }
      return session;
    },
  },
});
