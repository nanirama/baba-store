import { cn } from "@/lib/utils";

const BLOCKS = [
  {
    title: "უფასო მიწოდება",
    body: null as string | null,
  },
  {
    title: "საბანკო განვადება",
    body: "0% განაკვეთი 3 თვემდე",
  },
  {
    title: "90 დღიანი დაბრუნება",
    body: "პრობლემურ პროდუქტებზე",
  },
  {
    title: "ონლაინ ჩატი",
    body: "24/7 მხარდაჭერა",
  },
] as const;

type ProductDetailPromoSidebarProps = {
  className?: string;
};

export function ProductDetailPromoSidebar({ className }: ProductDetailPromoSidebarProps) {
  return (
    <aside
      className={cn(
        "w-full rounded-lg border border-neutral-200 bg-white px-5 py-2 shadow-sm",
        className
      )}
      aria-label="სერვისები"
    >
      <ul className="flex flex-col divide-y divide-dashed divide-neutral-200">
        {BLOCKS.map((block) => (
          <li key={block.title} className="flex gap-3 py-4 first:pt-3 last:pb-3">
            <span
              className="mt-2 h-0.5 w-6 shrink-0 rounded-sm bg-primary"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="font-[family-name:var(--font-heading)] text-base font-semibold tracking-tight text-primary">
                {block.title}
              </p>
              {block.body ? (
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">{block.body}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
