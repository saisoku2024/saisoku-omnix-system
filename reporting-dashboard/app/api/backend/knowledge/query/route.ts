import { NextResponse } from "next/server"

import { adminHeaders } from "@/lib/admin-api"
import { API_ORIGIN } from "@/lib/api"
import { getCurrentSession } from "@/lib/server-auth"

export async function POST(request: Request) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.text()
    const response = await fetch(`${API_ORIGIN}/api/knowledge/query`, {
      method: "POST",
      headers: {
        ...adminHeaders(),
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
    })
    const data = await response.json().catch(() => ({
      detail: `Knowledge query request failed with HTTP ${response.status}`,
    }))
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Knowledge query proxy error" },
      { status: 503 }
    )
  }
}
