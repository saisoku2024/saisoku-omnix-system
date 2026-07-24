import { NextRequest, NextResponse } from "next/server"

import { AUTH_COOKIE_NAME, getSessionPayload } from "@/lib/auth-token"

const PUBLIC_FILE = /\.(.*)$/
const DEFAULT_SECRET = "saisoku-omnix-system-secret-key-2026"

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico" ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next()
  }

  const sessionSecret = process.env.AUTH_SESSION_SECRET || DEFAULT_SECRET
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const session = await getSessionPayload(token, sessionSecret)
  const isAuthenticated = session !== null

  if (pathname === "/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    return NextResponse.next()
  }

  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  // RBAC Route Guard: Only super_admin / admin can access /management-system
  if (pathname.startsWith("/management-system")) {
    const role = session?.role || session?.sub
    if (role !== "super_admin" && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

