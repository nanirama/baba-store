/**
 * Allow only same-origin paths or http(s) URLs for user-controlled `src` attributes.
 */
export function isSafeImageUrlForAttr(url: string): boolean {
  const t = url.trim();
  if (!t) return false;
  if (t.startsWith("/") && !t.startsWith("//")) return true;
  try {
    const u = new URL(t);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}
