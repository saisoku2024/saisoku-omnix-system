import { NextResponse } from "next/server"

import {
  AUTH_COOKIE_NAME,
  AUTH_MAX_AGE_SECONDS,
  createSessionToken,
  UserRole,
} from "@/lib/auth-token"
import { insertAuditLog } from "@/lib/supabase-audit"

const DEMO_GUEST_EMAIL = (process.env.DEMO_GUEST_EMAIL || "guest@omnix.com")
  .trim()
  .toLowerCase()
const DEMO_GUEST_PASSWORD = process.env.DEMO_GUEST_PASSWORD
const ENABLE_DEMO_GUEST = process.env.ENABLE_DEMO_GUEST !== "false"

const SUPABASE_URL = (
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://lgptunvfnosnfejzrhml.supabase.co"
).replace(/\/+$/, "")

const SUPABASE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ""
)

interface SupabaseAuthUser {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
    role?: string
  }
}

interface SupabaseProfile {
  id: string
  email: string
  full_name?: string
  role?: UserRole
  brand_access?: string[]
}

async function authenticateWithSupabaseAuth(email: string, password: string) {
  if (!SUPABASE_URL || !SUPABASE_KEY || !email || !password) return null

  try {
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    })

    if (!authRes.ok) return null

    const authData = await authRes.json()
    const user: SupabaseAuthUser = authData.user
    if (!user || !user.id) return null

    // Fetch user profile from public.profiles
    let profile: SupabaseProfile | null = null
    try {
      const profileRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=*`,
        {
          method: "GET",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
          cache: "no-store",
        }
      )
      if (profileRes.ok) {
        const profiles = await profileRes.json()
        if (Array.isArray(profiles) && profiles.length > 0) {
          profile = profiles[0]
        }
      }
    } catch {
      // Profile lookup error ignored
    }

    const isSuperAdminEmail = email === "admin@omnix.com" || email === "admin"
    const role: UserRole = isSuperAdminEmail
      ? "super_admin"
      : (profile?.role || (user.user_metadata?.role as UserRole) || "guest")

    const fullName = profile?.full_name || user.user_metadata?.full_name || (isSuperAdminEmail ? "Super Admin" : "Omnix User")
    const brandAccess = profile?.brand_access || ["ALL"]

    return {
      userId: user.id,
      email: user.email,
      role,
      fullName,
      brandAccess,
    }
  } catch (err) {
    console.warn("Supabase Auth login error:", err)
    return null
  }
}

export async function POST(request: Request) {
  const expectedPassword = process.env.ADMIN_UI_PASSWORD || "admin123"
  const sessionSecret = process.env.AUTH_SESSION_SECRET || "saisoku-omnix-system-secret-key-2026"

  const body = (await request.json().catch(() => ({}))) as {
    email?: unknown
    password?: unknown
    useDemoGuest?: unknown
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const password = typeof body.password === "string" ? body.password : ""
  const isDemoGuestRequest = body.useDemoGuest === true
  const isGuestByPassword =
    ENABLE_DEMO_GUEST &&
    Boolean(DEMO_GUEST_PASSWORD) &&
    (email === DEMO_GUEST_EMAIL || email === "guest") &&
    password === DEMO_GUEST_PASSWORD

  let authenticatedUser: {
    userId: string
    email: string
    role: UserRole
    fullName?: string
    brandAccess?: string[]
  } | null = null

  // 1. Demo Guest Option
  if (ENABLE_DEMO_GUEST && (isDemoGuestRequest || isGuestByPassword)) {
    authenticatedUser = {
      userId: "demo-guest-id",
      email: DEMO_GUEST_EMAIL,
      role: "guest",
      fullName: "Demo Guest User",
      brandAccess: ["ALL"],
    }
  }

  // 2. Supabase Auth Multi-User Authentication
  if (!authenticatedUser && email && password) {
    authenticatedUser = await authenticateWithSupabaseAuth(email, password)
  }

  // 3. Fallback Legacy Single Admin Password
  if (!authenticatedUser && password && password === expectedPassword) {
    authenticatedUser = {
      userId: "00000000-0000-0000-0000-000000000001",
      email: email || "admin@omnix.com",
      role: "super_admin",
      fullName: "Super Admin",
      brandAccess: ["ALL"],
    }
  }

  if (!authenticatedUser) {
    return NextResponse.json({ detail: "Invalid email or password" }, { status: 401 })
  }

  // Insert Audit Log
  await insertAuditLog({
    action: "USER_LOGIN",
    resource: "auth",
    user_email: authenticatedUser.email,
    user_role: authenticatedUser.role,
    details: { login_method: "password" },
  })

  // Create JWT Session Token
  const token = await createSessionToken(sessionSecret, {
    sub: authenticatedUser.userId,
    email: authenticatedUser.email,
    role: authenticatedUser.role,
    fullName: authenticatedUser.fullName,
    brandAccess: authenticatedUser.brandAccess,
  })

  const response = NextResponse.json({
    ok: true,
    user: {
      email: authenticatedUser.email,
      role: authenticatedUser.role,
      fullName: authenticatedUser.fullName,
    },
  })

  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: AUTH_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })

  return response
}

