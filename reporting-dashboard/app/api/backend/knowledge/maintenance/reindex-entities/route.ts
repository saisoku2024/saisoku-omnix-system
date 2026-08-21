import { NextResponse } from "next/server"

import { adminHeaders } from "@/lib/admin-api"
import { API_ORIGIN } from "@/lib/api"
import { readProxyResponse } from "@/lib/proxy-response"
import { getCurrentSession } from "@/lib/server-auth"

export const maxDuration = 120
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit") || "200"

    const response = await fetch(`${API_ORIGIN}/api/knowledge/maintenance/reindex-entities?limit=${limit}`, {
      method: "POST",
      headers: {
        ...adminHeaders(),
      },
      cache: "no-store",
    })
    const data = await readProxyResponse(response, "Knowledge reindex entities request")
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Knowledge reindex entities proxy error" },
      { status: 503 }
    )
  }
}
