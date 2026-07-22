export function getAdminApiToken() {
  return process.env.ADMIN_API_TOKEN?.trim() || ""
}

export function adminHeaders(): HeadersInit {
  const token = getAdminApiToken()
  return token ? { "X-Admin-Token": token } : {}
}
