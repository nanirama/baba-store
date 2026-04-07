import { requireAuth } from "@/lib/auth/helpers";
import { LogoutButton } from "@/components/auth/logout-button";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { outfit } from "@/lib/fonts/outfit";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <div className={`${outfit.className} min-h-screen bg-[#f9fafb] text-slate-800 antialiased`}>
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-4 lg:gap-8">
              <Link href="/dashboard" className="flex shrink-0 items-center">
                <Image
                  src="/images/logo.webp"
                  alt="Baba.ge logo"
                  width={140}
                  height={44}
                  priority
                  className="h-9 w-auto"
                />
              </Link>
              <div className="hidden min-w-0 md:block">
                <DashboardNav />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-slate-800">{user.name ?? user.email}</p>
                <span
                  className={`mt-0.5 inline-flex rounded-md px-1.5 py-0.5 text-xs font-medium ${
                    user.role === "admin"
                      ? "bg-[#ff5100]/15 text-[#ff5100]"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {user.role}
                </span>
              </div>
              <LogoutButton />
            </div>
          </div>
          <div className="border-t border-gray-100 pb-3 pt-2 md:hidden">
            <DashboardNav />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
    </div>
  );
}
