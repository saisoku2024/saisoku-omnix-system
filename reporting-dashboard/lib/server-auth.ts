import { cookies } from "next/headers"

import {
  AUTH_COOKIE_NAME,
  getSessionPayload,
  type SessionPayload,
} from "@/lib/auth-token"

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const sessionSecret = process.env.AUTH_SESSION_SECRET
  if (!sessionSecret) return null

  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  return getSessionPayload(token, sessionSecret)
}

export async function requireAdminSession(): Promise<SessionPayload | null> {
  const session = await getCurrentSession()
  return session?.sub === "admin" ? session : null
}
