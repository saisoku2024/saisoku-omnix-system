import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { AUTH_COOKIE_NAME, getSessionPayload } from "@/lib/auth-token"
import { adminHeaders } from "@/lib/admin-api"
import { API_ORIGIN } from "@/lib/api"

async function recordAuditLog(payload: {
  action: string
  resource: string
  user_email: string
  user_role: string
  details?: Record<string, unknown>
}) {
  try {
    const backendUrl = `${API_ORIGIN}/api/admin/audit-logs`
    await fetch(backendUrl, {
      method: "POST",
      headers: {
        ...adminHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
  } catch {
    // Ignore error
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  const sessionSecret = process.env.AUTH_SESSION_SECRET
  const session = sessionSecret ? await getSessionPayload(token, sessionSecret) : null

  const isGuest = session?.sub === "guest"
  const userEmail = isGuest ? "guest@omnix.com" : "admin@omnix.com"
  const userRole = isGuest ? "guest" : "super_admin"

  const reason = request.nextUrl.searchParams.get("reason") || "user_initiated"

  await recordAuditLog({
    action: "USER_LOGOUT",
    resource: "auth",
    user_email: userEmail,
    user_role: userRole,
    details: { reason },
  })

  const response = NextResponse.json({ ok: true })

  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })

  return response
}
