import { NextResponse } from "next/server"

import { adminHeaders } from "@/lib/admin-api"
import { API_ORIGIN } from "@/lib/api"
import { getCurrentSession } from "@/lib/server-auth"

export const maxDuration = 60
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.text()
    const response = await fetch(`${API_ORIGIN}/api/knowledge/query-stream`, {
      method: "POST",
      headers: {
        ...adminHeaders(),
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
    })

    if (!response.ok) {
      const errorText = await response.text()
      return new NextResponse(errorText, {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    })
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Knowledge query stream proxy error" },
      { status: 503 }
    )
  }
}
