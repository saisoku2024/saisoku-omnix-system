/**
 * Format angka Indonesia.
 * Contoh:
 * 1434 -> 1.434
 */
export function formatCount(n: unknown): string {
  const num = typeof n === "number" ? n : Number(n)

  if (!Number.isFinite(num)) return "0"

  return num.toLocaleString("id-ID")
}

/**
 * Convert mode string → label dropdown.
 */
export function modeLabel(mode: string): string {
  return mode.charAt(0).toUpperCase() + mode.slice(1)
}