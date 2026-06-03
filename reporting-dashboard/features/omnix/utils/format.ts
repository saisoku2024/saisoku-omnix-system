/**
 * Format angka ke locale id-ID.
 * Defensif: handle NaN, null, undefined, atau string yang tidak valid → "0".
 */
export const fmt = (n: unknown): string => {
  // Coerce ke number
  const num = typeof n === "number" ? n : Number(n)

  // Jaga-jaga: kalau hasil NaN, Infinity, atau null/undefined → "0"
  if (!Number.isFinite(num)) return "0"

  return new Intl.NumberFormat("id-ID").format(num)
}

/** Format ribuan dengan "k" suffix (untuk axis chart) */
export const fmtCompact = (v: unknown): string => {
  const num = typeof v === "number" ? v : Number(v)
  if (!Number.isFinite(num)) return "0"
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return String(num)
}