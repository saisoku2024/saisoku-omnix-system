import { NextResponse } from "next/server"

import { adminHeaders } from "@/lib/admin-api"
import { apiUrl } from "@/lib/api"
import { requireManagerOrAdminSession } from "@/lib/server-auth"

export async function GET(request: Request) {
  const session = await requireManagerOrAdminSession()
  if (!session) {
    return NextResponse.json({ detail: "Forbidden: Manager or Admin privileges required" }, { status: 403 })
  }

  const { search } = new URL(request.url)
  const response = await fetch(apiUrl(`/api/principal-report/export${search}`), {
    headers: adminHeaders(session),
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
