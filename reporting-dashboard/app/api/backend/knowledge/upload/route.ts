import { NextResponse } from "next/server"

import { adminHeaders } from "@/lib/admin-api"
import { API_ORIGIN } from "@/lib/api"
import { requireAdminSession } from "@/lib/auth-token"

export async function POST(request: Request) {
  const session = await requireAdminSession()
  if (!session) {
    return NextResponse.json(
      { detail: "Forbidden: Admin privileges required" },
      { status: 403 }
    )
  }

  try {
    const formData = await request.formData()
    const response = await fetch(`${API_ORIGIN}/api/knowledge/upload`, {
      method: "POST",
      headers: adminHeaders(),
      body: formData,
      cache: "no-store",
    })
    const data = await response.json().catch(() => ({
      detail: `Knowledge upload request failed with HTTP ${response.status}`,
    }))
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Knowledge upload proxy error" },
      { status: 503 }
    )
  }
}
