/**
 * URL-safe slug from arbitrary text (Latin, Georgian, etc.).
 * JavaScript `\w` is ASCII-only; we use Unicode letter/number properties instead.
 */
export function slugify(value: string): string {
  const s = value.normalize("NFKC").trim();
  if (!s) return "";

  const base = s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!base || /^-+$/u.test(base)) return "";
  return base;
}
