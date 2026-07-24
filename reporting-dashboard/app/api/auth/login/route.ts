import { NextResponse } from "next/server"

import {
  AUTH_COOKIE_NAME,
  AUTH_MAX_AGE_SECONDS,
  createSessionToken,
} from "@/lib/auth-token"
import { insertAuditLog } from "@/lib/supabase-audit"

const DEMO_GUEST_EMAIL = (process.env.DEMO_GUEST_EMAIL || "guest@omnix.com")
  .trim()
  .toLowerCase()
const DEMO_GUEST_PASSWORD = process.env.DEMO_GUEST_PASSWORD
// Enable Demo Guest by default unless explicitly disabled via ENABLE_DEMO_GUEST="false"
const ENABLE_DEMO_GUEST = process.env.ENABLE_DEMO_GUEST !== "false"

export async function POST(request: Request) {
  const expectedPassword = process.env.ADMIN_UI_PASSWORD || "admin123"
  const sessionSecret = process.env.AUTH_SESSION_SECRET || "saisoku-omnix-system-secret-key-2026"

  const body = (await request.json().catch(() => ({}))) as {
    email?: unknown
    password?: unknown
    useDemoGuest?: unknown
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const password = typeof body.password === "string" ? body.password : ""
  const isDemoGuestRequest = body.useDemoGuest === true
  const isGuestByPassword =
    ENABLE_DEMO_GUEST &&
    Boolean(DEMO_GUEST_PASSWORD) &&
    (email === DEMO_GUEST_EMAIL || email === "guest") &&
    password === DEMO_GUEST_PASSWORD
  const isGuest = ENABLE_DEMO_GUEST && (isDemoGuestRequest || isGuestByPassword)
  const isAdmin = Boolean(expectedPassword) && password === expectedPassword && email !== DEMO_GUEST_EMAIL

  if (!isGuest && !isAdmin) {
    return NextResponse.json({ detail: "Invalid credentials" }, { status: 401 })
  }

  const role = isGuest ? "guest" : "super_admin"
  const userEmail = isGuest ? DEMO_GUEST_EMAIL : (email || "admin@omnix.com")

  // Insert real-time USER_LOGIN audit log directly into Supabase
  await insertAuditLog({
    action: "USER_LOGIN",
    resource: "auth",
    user_email: userEmail,
    user_role: role,
    details: { login_method: "password" },
  })

  const token = await createSessionToken(sessionSecret, isGuest ? "guest" : "super_admin")
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
