import { NextResponse } from "next/server"

import { apiUrl } from "@/lib/api"
import { requireAdminSession } from "@/lib/server-auth"

const EXPORT_PATHS = {
  digital: "/api/reports/export/digital",
  inbound: "/api/reports/export/inbound",
} as const

type ExportType = keyof typeof EXPORT_PATHS

function isExportType(value: string): value is ExportType {
  return value in EXPORT_PATHS
}

export async function POST(
  request: Request,
  context: { params: Promise<{ type: string }> }
) {
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

  const { type } = await context.params
  if (!isExportType(type)) {
    return NextResponse.json({ detail: "Unknown export type" }, { status: 404 })
  }

  const response = await fetch(apiUrl(EXPORT_PATHS[type]), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Token": adminToken,
    },
    body: await request.text(),
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
