import { NextResponse } from "next/server"

import {
  AUTH_COOKIE_NAME,
  AUTH_MAX_AGE_SECONDS,
  createSessionToken,
} from "@/lib/auth-token"
import { adminHeaders } from "@/lib/admin-api"
import { API_ORIGIN } from "@/lib/api"

const DEMO_GUEST_EMAIL = (process.env.DEMO_GUEST_EMAIL || "guest@ssidmail.my.id").trim().toLowerCase()
const DEMO_GUEST_PASSWORD = process.env.DEMO_GUEST_PASSWORD || "guestonly123"
const ENABLE_DEMO_GUEST = process.env.ENABLE_DEMO_GUEST !== "false"

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

export async function POST(request: Request) {
  const expectedPassword = process.env.ADMIN_UI_PASSWORD
  const sessionSecret = process.env.AUTH_SESSION_SECRET

  if (!expectedPassword || !sessionSecret) {
    return NextResponse.json(
      { detail: "Auth environment is not configured" },
      { status: 503 }
    )
  }

  const body = (await request.json().catch(() => ({}))) as {
    email?: unknown
    password?: unknown
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const password = typeof body.password === "string" ? body.password : ""
  const isGuest =
    ENABLE_DEMO_GUEST &&
    (email === DEMO_GUEST_EMAIL || email === "guest@omnix.com" || email === "guest") &&
    password === DEMO_GUEST_PASSWORD
  const isAdmin = password === expectedPassword && email !== DEMO_GUEST_EMAIL

  if (!isGuest && !isAdmin) {
    return NextResponse.json({ detail: "Invalid credentials" }, { status: 401 })
  }

  const role = isGuest ? "guest" : "super_admin"
  const userEmail = isGuest ? (email || "guest@omnix.com") : (email || "admin@omnix.com")

  // Must await so serverless function doesn't terminate early before logging
  await recordAuditLog({
    action: "USER_LOGIN",
    resource: "auth",
    user_email: userEmail,
    user_role: role,
    details: { login_method: "password" },
  })

  const token = await createSessionToken(sessionSecret, isGuest ? "guest" : "admin")
  const response = NextResponse.json({ ok: true })

  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: AUTH_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })

  return response
}
