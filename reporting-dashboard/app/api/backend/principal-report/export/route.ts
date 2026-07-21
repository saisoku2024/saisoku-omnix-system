import { NextResponse } from "next/server"

import { apiUrl } from "@/lib/api"
import { requireAdminSession } from "@/lib/server-auth"

export async function GET(request: Request) {
  const session = await requireAdminSession()
  if (!session) {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 })
  }

  const adminToken = process.env.ADMIN_API_TOKEN
  if (!adminToken) {
    return NextResponse.json(
      { detail: "Admin API token is not configured" },
      { status: 503 }
    )
  }

  const { search } = new URL(request.url)
  const response = await fetch(apiUrl(`/api/principal-report/export${search}`), {
    headers: {
      "X-Admin-Token": adminToken,
    },
  })

  const headers = new Headers()
  const contentType = response.headers.get("Content-Type")
  const contentDisposition = response.headers.get("Content-Disposition")
  if (contentType) headers.set("Content-Type", contentType)
  if (contentDisposition) {
    headers.set("Content-Disposition", contentDisposition)
  }

  return new Response(response.body, {
    status: response.status,
    headers,
  })
}
