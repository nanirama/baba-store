/** Form flags: "true"/"false", checkbox "on", legacy "1"/"0", or DB booleans/smallints. */
export function parseTriStateBoolean(val: unknown): boolean {
  if (val === true || val === 1) return true;
  if (val === false || val === 0 || val == null || val === "") return false;
  if (typeof val === "string") {
    const s = val.trim().toLowerCase();
    if (s === "false" || s === "0" || s === "no" || s === "f") return false;
    return s === "on" || s === "true" || s === "1" || s === "yes" || s === "t";
  }
  return false;
}
