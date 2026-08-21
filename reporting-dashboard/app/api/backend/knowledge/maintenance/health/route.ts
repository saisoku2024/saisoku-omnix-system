import { NextResponse } from "next/server"

import { adminHeaders } from "@/lib/admin-api"
import { API_ORIGIN } from "@/lib/api"
import { readProxyResponse } from "@/lib/proxy-response"
import { getCurrentSession } from "@/lib/server-auth"

export const maxDuration = 30
export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
  }

  try {
    const response = await fetch(`${API_ORIGIN}/api/knowledge/maintenance/health`, {
      method: "GET",
      headers: {
        ...adminHeaders(),
      },
      cache: "no-store",
    })
    const data = await readProxyResponse(response, "Knowledge maintenance health request")
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Knowledge health proxy error" },
      { status: 503 }
    )
  }
}
