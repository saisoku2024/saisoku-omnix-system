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
    const payload = await request.json()
    const response = await fetch(`${API_ORIGIN}/api/knowledge/storage-ingest`, {
      method: "POST",
      headers: {
        ...adminHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    })
    const data = await readProxyResponse(response, "Knowledge storage ingest request")
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Knowledge storage ingest proxy error" },
      { status: 503 }
    )
  }
}

