export const AUTH_COOKIE_NAME = "saisoku_session"
export const AUTH_MAX_AGE_SECONDS = 60 * 60 * 12

type SessionPayload = {
  exp: number
  sub: "admin" | "guest"
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
  subject: SessionPayload["sub"] = "admin"
) {
  const payload: SessionPayload = {
    exp: Math.floor(Date.now() / 1000) + AUTH_MAX_AGE_SECONDS,
    sub: subject,
  }
  const encodedPayload = encodeBase64Url(JSON.stringify(payload))
  const signature = await sign(encodedPayload, secret)

  return `${encodedPayload}.${signature}`
}

export async function verifySessionToken(token: string | undefined, secret: string) {
  if (!token) return false

  const [encodedPayload, signature] = token.split(".")
  if (!encodedPayload || !signature) return false

  const expectedSignature = await sign(encodedPayload, secret)
  if (!timingSafeEqual(signature, expectedSignature)) return false

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as SessionPayload
    return (
      (payload.sub === "admin" || payload.sub === "guest") &&
      payload.exp > Math.floor(Date.now() / 1000)
    )
  } catch {
    return false
  }
}
