import type { SessionPayload } from "@/lib/auth-token"

export function getAdminApiToken() {
  return process.env.ADMIN_API_TOKEN?.trim() || ""
}

export function adminHeaders(session?: SessionPayload | null): Record<string, string> {
  const token = getAdminApiToken()
  const headers: Record<string, string> = token ? { "X-Admin-Token": token } : {}

  if (session) {
    if (session.sub) headers["X-User-Id"] = session.sub
    if (session.email) headers["X-User-Email"] = session.email
    if (session.role) headers["X-User-Role"] = String(session.role)
    if (session.fullName) headers["X-User-Name"] = session.fullName
  }

  return headers
}
