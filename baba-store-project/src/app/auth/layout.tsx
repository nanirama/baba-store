import { outfit } from "@/lib/fonts/outfit";

/**
 * TailAdmin-style auth shell: Outfit font + light gray canvas (matches dashboard).
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${outfit.className} min-h-screen bg-[#f9fafb] text-slate-800 antialiased`}>
      {children}
    </div>
  );
}
