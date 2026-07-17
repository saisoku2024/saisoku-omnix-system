import { NextResponse } from "next/server"

import {
  AUTH_COOKIE_NAME,
  AUTH_MAX_AGE_SECONDS,
  createSessionToken,
} from "@/lib/auth-token"

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
    password?: unknown
  }

  if (body.password !== expectedPassword) {
    return NextResponse.json({ detail: "Invalid password" }, { status: 401 })
  }

  const token = await createSessionToken(sessionSecret)
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
