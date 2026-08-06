import { cookies } from "next/headers"

import {
  AUTH_COOKIE_NAME,
  getSessionPayload,
  getSessionSecret,
  isAdminSession,
  isManagerOrAdminSession,
  type SessionPayload,
} from "@/lib/auth-token"

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const sessionSecret = getSessionSecret()

  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  return getSessionPayload(token, sessionSecret)
}

export async function requireAdminSession(): Promise<SessionPayload | null> {
  const session = await getCurrentSession()
  return isAdminSession(session) ? session : null
}

export async function requireManagerOrAdminSession(): Promise<SessionPayload | null> {
  const session = await getCurrentSession()
  return isManagerOrAdminSession(session) ? session : null
}
