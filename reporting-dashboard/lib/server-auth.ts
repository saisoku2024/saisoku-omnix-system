import { cookies } from "next/headers"

import {
  AUTH_COOKIE_NAME,
  getSessionPayload,
  isAdminSession,
  type SessionPayload,
} from "@/lib/auth-token"

const DEFAULT_SECRET = "saisoku-omnix-system-secret-key-2026"

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const sessionSecret = process.env.AUTH_SESSION_SECRET || DEFAULT_SECRET

  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  return getSessionPayload(token, sessionSecret)
}

export async function requireAdminSession(): Promise<SessionPayload | null> {
  const session = await getCurrentSession()
  return isAdminSession(session) ? session : null
}
