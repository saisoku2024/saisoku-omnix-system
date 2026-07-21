export function adminHeaders(): HeadersInit {
  const token = process.env.ADMIN_API_TOKEN || process.env.NEXT_PUBLIC_ADMIN_API_TOKEN
  return token ? { "X-Admin-Token": token } : {}
}
