import { NextResponse } from "next/server"

import { apiUrl } from "@/lib/api"
import { requireAdminSession } from "@/lib/server-auth"

export async function POST(request: Request) {
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

  const response = await fetch(apiUrl("/api/cleanup/soft-delete"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Token": adminToken,
    },
    body: await request.text(),
  })

  return new Response(response.body, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("Content-Type") || "application/json",
    },
  })
}
