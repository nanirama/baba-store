import "server-only";

import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { slugify } from "@/utils/slug";

const PRODUCT_BUCKET = process.env.SUPABASE_PRODUCT_BUCKET || "products";
const FALLBACK_PRODUCT_BUCKET = "product-images";

function extFromType(type: string): string {
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  if (type.includes("gif")) return "gif";
  return "jpg";
}

export async function uploadProductImage(file: File, prefix = "products"): Promise<string> {
  const supabase = createAdminClient();
  const ext = extFromType(file.type);
  const filePath = `${prefix}/${Date.now()}-${slugify(file.name.replace(/\.[^/.]+$/, ""))}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  let { error: uploadError } = await supabase.storage
    .from(PRODUCT_BUCKET)
    .upload(filePath, arrayBuffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  let bucketName = PRODUCT_BUCKET;
  if (uploadError && uploadError.message.toLowerCase().includes("bucket not found")) {
    const fallback = await supabase.storage
      .from(FALLBACK_PRODUCT_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
    uploadError = fallback.error;
    bucketName = FALLBACK_PRODUCT_BUCKET;
  }

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
  return data.publicUrl;
}

const PUBLIC_OBJECT_REGEX = /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/;

/**
 * Removes an object given its public storage URL (same bucket layout as uploads).
 */
export async function deleteProductImageByPublicUrl(publicUrl: string): Promise<void> {
  const trimmed = publicUrl.trim();
  if (!trimmed) return;

  const match = trimmed.match(PUBLIC_OBJECT_REGEX);
  if (!match) {
    throw new Error("Not a Supabase public storage URL");
  }

  const bucketName = match[1];
  let objectPath = match[2];
  try {
    objectPath = decodeURIComponent(objectPath);
  } catch {
    // keep raw path
  }

  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(bucketName).remove([objectPath]);
  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Many CDNs / sites return 403 to bare server fetches. Browsers send Referer/Origin;
 * we mimic that and retry with a few variants (same as opening the image from the site).
 */
async function fetchRemoteImageBytes(url: string): Promise<Response> {
  let origin: string | null = null;
  try {
    origin = new URL(url).origin;
  } catch {
    /* ignore */
  }

  const ua =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

  const base: Record<string, string> = {
    Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.9",
    "Accept-Language": "ka,en-US;q=0.9,en;q=0.8",
    "User-Agent": ua,
  };

  const refererOverride = process.env.BULK_IMAGE_FETCH_REFERER?.trim();
  const cookieOverride = process.env.BULK_IMAGE_FETCH_COOKIE?.trim();

  const attempts: Record<string, string>[] = [];
  if (refererOverride) {
    attempts.push({
      ...base,
      Referer: refererOverride,
      ...(origin ? { Origin: origin } : {}),
      ...(cookieOverride ? { Cookie: cookieOverride } : {}),
    });
  }
  if (origin) {
    const withCookie: Record<string, string> = {};
    if (cookieOverride) withCookie.Cookie = cookieOverride;
    attempts.push({
      ...base,
      Referer: `${origin}/`,
      Origin: origin,
      ...withCookie,
    });
    attempts.push({
      ...base,
      Referer: url,
      Origin: origin,
      ...withCookie,
    });
    try {
      const u = new URL(url);
      const dir = u.origin + u.pathname.replace(/\/[^/]+\/?$/, "/");
      if (dir !== `${u.origin}/` && dir.length > u.origin.length + 1) {
        attempts.push({
          ...base,
          Referer: dir,
          Origin: origin,
          ...withCookie,
        });
      }
    } catch {
      /* ignore */
    }
  }
  attempts.push({ ...base });

  let lastStatus = 0;
  let lastStatusText = "";
  for (const headers of attempts) {
    const response = await fetch(url, { redirect: "follow", headers });
    if (response.ok) return response;
    lastStatus = response.status;
    lastStatusText = response.statusText;
    if (response.status !== 403) {
      break;
    }
  }

  throw new Error(
    `Failed to download image (${lastStatus} ${lastStatusText}): ${url}. ` +
      `If this URL works in a browser, set BULK_IMAGE_FETCH_REFERER in .env to that site’s origin (e.g. https://baba.ge/).`
  );
}

/**
 * baba.ge often serves files under `/image/catalog/...` while exports list `/catalog/...` — try both.
 */
function buildImageFetchCandidates(url: string): string[] {
  const out: string[] = [];
  const add = (u: string) => {
    const x = u.trim();
    if (x && !out.includes(x)) out.push(x);
  };
  add(url);
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./i, "");
    if (host !== "baba.ge" && !host.endsWith(".baba.ge")) return out;
    const p = u.pathname || "/";
    if (p.startsWith("/catalog/") && !p.startsWith("/image/")) {
      add(`${u.origin}/image${p}`);
    }
  } catch {
    /* ignore */
  }
  return out;
}

export async function uploadImageFromUrl(url: string, prefix = "products"): Promise<string> {
  const candidates = buildImageFetchCandidates(url);
  let lastError: Error | null = null;
  let response: Response | null = null;
  let usedUrl = url;

  for (const candidate of candidates) {
    try {
      response = await fetchRemoteImageBytes(candidate);
      usedUrl = candidate;
      break;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  if (!response) {
    throw lastError ?? new Error(`Failed to download image: ${url}`);
  }

  const contentType = response.headers.get("content-type") ?? "image/jpeg";
  if (contentType.includes("text/html")) {
    throw new Error(
      `URL returned a web page instead of an image. Use a direct image file URL (Content-Type was ${contentType}): ${usedUrl}`
    );
  }

  const ext = extFromType(contentType);
  const lastSegment = decodeURIComponent(usedUrl.split("/").pop()?.split("?")[0] ?? "image");
  const withoutExt = lastSegment.replace(/\.[^.]+$/, "");
  let safeBase = slugify(withoutExt);
  if (!safeBase) safeBase = `img-${Date.now()}`;
  const unique = `${randomUUID()}-${safeBase}`;
  const filePath = `${prefix}/${unique}.${ext}`;
  const bytes = await response.arrayBuffer();

  const supabase = createAdminClient();

  const tryBucket = async (bucket: string) =>
    supabase.storage.from(bucket).upload(filePath, bytes, { contentType, upsert: false });

  const { error: errPrimary } = await tryBucket(PRODUCT_BUCKET);
  if (!errPrimary) {
    const { data } = supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  }

  const { error: errFallback } = await tryBucket(FALLBACK_PRODUCT_BUCKET);
  if (!errFallback) {
    const { data } = supabase.storage.from(FALLBACK_PRODUCT_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  }

  throw new Error(
    `Supabase storage upload failed. Bucket "${PRODUCT_BUCKET}": ${errPrimary.message}. Bucket "${FALLBACK_PRODUCT_BUCKET}": ${errFallback.message}. Create a public bucket or set SUPABASE_PRODUCT_BUCKET.`
  );
}
