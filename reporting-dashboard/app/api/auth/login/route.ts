import { NextResponse } from "next/server"

import {
  AUTH_COOKIE_NAME,
  AUTH_MAX_AGE_SECONDS,
  createSessionToken,
} from "@/lib/auth-token"

const DEMO_GUEST_EMAIL = "guest@ssidmail.my.id"
const DEMO_GUEST_PASSWORD = "guestonly123"

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
    email === DEMO_GUEST_EMAIL && password === DEMO_GUEST_PASSWORD
  const isAdmin = password === expectedPassword && email !== DEMO_GUEST_EMAIL

  if (!isGuest && !isAdmin) {
    return NextResponse.json({ detail: "Invalid credentials" }, { status: 401 })
  }

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
