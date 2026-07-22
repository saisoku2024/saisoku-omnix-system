import { NextRequest, NextResponse } from "next/server"
import { AUTH_COOKIE_NAME } from "@/lib/auth-token"
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
  const reason = request.nextUrl.searchParams.get("reason") || "user_initiated"

  recordAuditLog({
    action: "USER_LOGOUT",
    resource: "auth",
    user_email: "user@omnix.com",
    user_role: "authenticated",
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
