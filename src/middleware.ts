import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// ============================================
// ROUTE PROTECTION MIDDLEWARE
// ============================================

const PROTECTED_PREFIXES = ["/dashboard"];
const AUTH_PREFIXES = ["/auth/login", "/auth/reset-password"];

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth?.user;

  const isProtected = PROTECTED_PREFIXES.some((p) =>
    nextUrl.pathname.startsWith(p)
  );
  const isAuthPage = AUTH_PREFIXES.some((p) =>
    nextUrl.pathname.startsWith(p)
  );

  // Unauthenticated user trying to access protected route → redirect to login
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/auth/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Already authenticated user visiting auth pages → send to dashboard
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico
     * - static assets (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
