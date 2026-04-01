"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderTree, LayoutDashboard, Package, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const items: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  isActive: (pathname: string) => boolean;
}[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    isActive: (p) => p === "/dashboard",
  },
  {
    href: "/dashboard/products",
    label: "Products",
    icon: Package,
    isActive: (p) => p.startsWith("/dashboard/products") && !p.startsWith("/dashboard/products/bulk-upload"),
  },
  {
    href: "/dashboard/products/bulk-upload",
    label: "Bulk Upload",
    icon: Upload,
    isActive: (p) => p.startsWith("/dashboard/products/bulk-upload"),
  },
  {
    href: "/dashboard/categories",
    label: "Categories",
    icon: FolderTree,
    isActive: (p) => p.startsWith("/dashboard/categories"),
  },
];

export function DashboardNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="flex flex-wrap items-center gap-1" aria-label="Dashboard">
      {items.map(({ href, label, icon: Icon, isActive }) => {
        const on = isActive(pathname);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              on
                ? "bg-[#ff5100]/10 text-[#ff5100]"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
