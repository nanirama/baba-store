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
        "w-full rounded-lg bg-transparent shadow-inherit py-2 px-5",
        className
      )}
      aria-label="სერვისები"
    >
      <ul className="flex flex-col divide-y divide-dashed divide-[#3A4754]/80">
        {BLOCKS.map((block) => (
          <li key={block.title} className="flex gap-2 py-1.5 first:pt-2 last:pb-2">
            <span
              className="mt-2 h-[1px] w-2 shrink-0 rounded-sm bg-primary"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="font-[family-name:var(--font-heading)] text-xs font-[600] leading-tight tracking-tight text-primary">
                {block.title}
              </p>
              {block.body ? (
                <p className="text-xs leading-snug text-neutral-600">{block.body}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
