import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type DashboardPageHeaderProps = {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  /** Extra buttons (e.g. primary action) */
  actions?: ReactNode;
};

/** TailAdmin-style page title row: optional back link, heading, description, actions. */
export function DashboardPageHeader({
  title,
  description,
  backHref,
  backLabel = "Back",
  actions,
}: DashboardPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        {backHref ? (
          <Link
            href={backHref}
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-slate-600 transition hover:text-[#ff5100]"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            {backLabel}
          </Link>
        ) : null}
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
        {description ? <p className="max-w-2xl text-sm leading-relaxed text-slate-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
