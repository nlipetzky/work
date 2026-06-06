// Display helpers shared across table cells and the drawer.

export function toCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return String(v);
  if (Array.isArray(v)) return v.length ? `[${v.length}] ${JSON.stringify(v).slice(0, 200)}` : "[]";
  if (typeof v === "object") {
    const keys = Object.keys(v as object);
    return keys.length ? JSON.stringify(v).slice(0, 400) : "{}";
  }
  return String(v);
}

export function shortDate(v: unknown): string {
  if (!v) return "";
  const s = typeof v === "string" ? v : String(v);
  // already ISO-ish; trim to minute
  return s.length >= 16 ? s.slice(0, 16).replace("T", " ") : s;
}

export function money(v: unknown): string {
  const n = typeof v === "number" ? v : v == null ? NaN : Number(v);
  if (Number.isNaN(n)) return "";
  return `$${n.toFixed(n < 1 ? 4 : 2)}`;
}
