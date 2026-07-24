import { cookies } from "next/headers"

export const AUTH_COOKIE_NAME = "saisoku_session"
export const AUTH_MAX_AGE_SECONDS = 60 * 60 * 12
const DEFAULT_SECRET = "saisoku-omnix-system-secret-key-2026"

export type UserRole = "super_admin" | "manager" | "spv" | "agent" | "guest"

export type SessionPayload = {
  exp: number
  sub: string
  email?: string
  role?: UserRole | string
  fullName?: string
  brandAccess?: string[]
}

export function isAdminSession(session: SessionPayload | null | undefined) {
  if (!session) return false
  const role = session.role || session.sub
  return role === "admin" || role === "super_admin" || role === "manager"
}

function encodeBase64Url(value: string | Uint8Array) {
  const bytes =
    typeof value === "string" ? new TextEncoder().encode(value) : value

  let binary = ""
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")
}

function decodeBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    Math.ceil(value.length / 4) * 4,
    "="
  )
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  )

  return encodeBase64Url(new Uint8Array(signature))
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) return false

  let result = 0
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }

  return result === 0
}

export async function createSessionToken(
  secret: string,
  subjectOrPayload: string | Omit<SessionPayload, "exp"> = "admin"
) {
  const exp = Math.floor(Date.now() / 1000) + AUTH_MAX_AGE_SECONDS
  let payload: SessionPayload

  if (typeof subjectOrPayload === "string") {
    const role: UserRole =
      subjectOrPayload === "admin" || subjectOrPayload === "super_admin"
        ? "super_admin"
        : (subjectOrPayload as UserRole)
    payload = {
      exp,
      sub: subjectOrPayload,
      role,
    }
  } else {
    payload = {
      ...subjectOrPayload,
      exp,
    }
  }

  const encodedPayload = encodeBase64Url(JSON.stringify(payload))
  const signature = await sign(encodedPayload, secret)

  return `${encodedPayload}.${signature}`
}

export async function getSessionPayload(
  token: string | undefined,
  secret: string
): Promise<SessionPayload | null> {
  if (!token) return null

  const [encodedPayload, signature] = token.split(".")
  if (!encodedPayload || !signature) return null

  const expectedSignature = await sign(encodedPayload, secret)
  if (!timingSafeEqual(signature, expectedSignature)) return null

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as SessionPayload
    if (payload && payload.exp && payload.exp > Math.floor(Date.now() / 1000)) {
      return payload
    }
    return null
  } catch {
    return null
  }
}

export async function verifySessionToken(token: string | undefined, secret: string) {
  const payload = await getSessionPayload(token, secret)
  return payload !== null
}

export async function requireAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  const sessionSecret = process.env.AUTH_SESSION_SECRET || DEFAULT_SECRET

  const session = await getSessionPayload(token, sessionSecret)
  if (!isAdminSession(session)) return null
  return session
}

