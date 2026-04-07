import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely parse JSON without throwing.
 */
export function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * Redact sensitive fields from an object for logging.
 */
export function redactSensitive<T extends Record<string, unknown>>(
  obj: T,
  fields: string[] = ["password", "token", "secret", "key"]
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      fields.includes(k.toLowerCase()) ? "[REDACTED]" : v,
    ])
  );
}
