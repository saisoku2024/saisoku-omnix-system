const ADMIN_API_TOKEN = process.env.NEXT_PUBLIC_ADMIN_API_TOKEN

export function adminHeaders(): HeadersInit {
  return ADMIN_API_TOKEN ? { "X-Admin-Token": ADMIN_API_TOKEN } : {}
}
