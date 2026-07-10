const DEFAULT_API_ORIGIN = "https://saisoku-omnix-system.onrender.com"

function normalizeApiOrigin(value: string) {
  return value.replace(/\/+$/, "").replace(/\/api$/, "")
}

export const API_ORIGIN = normalizeApiOrigin(
  process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_ORIGIN
)

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${API_ORIGIN}${normalizedPath}`
}
