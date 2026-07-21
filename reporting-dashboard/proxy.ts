import { NextRequest, NextResponse } from "next/server"

import { AUTH_COOKIE_NAME, getSessionPayload } from "@/lib/auth-token"

const PUBLIC_FILE = /\.(.*)$/
const ADMIN_ONLY_ROUTES = [
  "/upload",
  "/data-management/data-cleanup",
  "/reports/principal",
]

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico" ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next()
  }

  const sessionSecret = process.env.AUTH_SESSION_SECRET
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const session = sessionSecret
    ? await getSessionPayload(token, sessionSecret)
    : null
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

  // Proteksi khusus rute sensitif (hanya untuk role admin)
  if (
    ADMIN_ONLY_ROUTES.some((route) => pathname.startsWith(route)) &&
    session?.sub !== "admin"
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
