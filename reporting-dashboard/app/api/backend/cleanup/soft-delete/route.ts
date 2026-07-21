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
    const bodyText = await request.text()
    const targetUrl = `${API_ORIGIN}/api/cleanup/soft-delete`

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...adminHeaders(),
      },
      body: bodyText,
    })

    const data = await response.json().catch(() => ({}))

    return NextResponse.json(data, {
      status: response.status,
    })
  } catch (err) {
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : "Soft delete proxy error" },
      { status: 500 }
    )
  }
}
