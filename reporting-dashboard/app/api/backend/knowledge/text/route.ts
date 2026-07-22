import { NextResponse } from "next/server"

import { adminHeaders } from "@/lib/admin-api"
import { API_ORIGIN } from "@/lib/api"
import { requireAdminSession } from "@/lib/auth-token"
import { readProxyResponse } from "@/lib/proxy-response"

export async function POST(request: Request) {
  const session = await requireAdminSession()
  if (!session) {
    return NextResponse.json(
      { detail: "Forbidden: Admin privileges required" },
      { status: 403 }
    )
  }

  try {
    const body = await request.text()
    const response = await fetch(`${API_ORIGIN}/api/knowledge/text`, {
      method: "POST",
      headers: {
        ...adminHeaders(),
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
    })
    const data = await readProxyResponse(response, "Knowledge text request")
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Knowledge text proxy error" },
      { status: 503 }
    )
  }
}
