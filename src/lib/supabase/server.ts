import "server-only";

import { createClient } from "@supabase/supabase-js";

// ============================================
// SUPABASE SERVER CLIENT
// These keys are NEVER exposed to the client.
// This file is server-only via the "server-only" import guard.
// ============================================

function getSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL;
  if (!url) throw new Error("SUPABASE_URL is not defined");
  return url;
}

function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not defined");
  return key;
}

/**
 * Admin Supabase client using the service role key.
 * Use ONLY in server-side code (Server Components, Server Actions, API routes).
 * Bypasses Row Level Security — use with extreme caution.
 */
export function createAdminClient() {
  return createClient(getSupabaseUrl(), getServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

/**
 * Standard Supabase client using the anon key.
 * Respects Row Level Security.
 */
export function createServerClient() {
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!anonKey) throw new Error("SUPABASE_ANON_KEY is not defined");

  return createClient(getSupabaseUrl(), anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
