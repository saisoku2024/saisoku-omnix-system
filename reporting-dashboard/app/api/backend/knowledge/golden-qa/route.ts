import { NextResponse } from "next/server"

import { adminHeaders } from "@/lib/admin-api"
import { API_ORIGIN } from "@/lib/api"
import { readProxyResponse } from "@/lib/proxy-response"
import { getCurrentSession } from "@/lib/server-auth"

export const maxDuration = 30
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const queryString = searchParams.toString()

  try {
    const url = `${API_ORIGIN}/api/knowledge/golden-qa${queryString ? `?${queryString}` : ""}`
    const response = await fetch(url, {
      method: "GET",
      headers: adminHeaders(),
      cache: "no-store",
    })
    const data = await readProxyResponse(response, "Knowledge Golden QA list")
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Knowledge Golden QA proxy error" },
      { status: 503 }
    )
  }
}
