import { describe, it, expect } from "vitest"
import { createSessionToken, verifySessionToken } from "../auth-token"

describe("Auth Token Web Crypto Utilities", () => {
  const secret = "test-session-secret-key-123456789"

  it("should generate and verify a valid session token", async () => {
    const token = await createSessionToken(secret, "admin")
    expect(token).toBeTruthy()
    expect(typeof token).toBe("string")

    const session = await verifySessionToken(token, secret)
    expect(session).not.toBeNull()
    expect(session?.sub).toBe("admin")
  })

  it("should fail verification with invalid secret", async () => {
    const token = await createSessionToken(secret, "guest")
    const session = await verifySessionToken(token, "wrong-secret-key")
    expect(session).toBeNull()
  })

  it("should fail verification with tampered token string", async () => {
    const session = await verifySessionToken("invalid.token.payload", secret)
    expect(session).toBeNull()
  })
})
