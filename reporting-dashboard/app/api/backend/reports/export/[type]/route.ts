import { NextRequest, NextResponse } from "next/server"

import { adminHeaders } from "@/lib/admin-api"
import { API_ORIGIN } from "@/lib/api"
import { requireAdminSession } from "@/lib/auth-token"

async function handleProxyExport(
  request: NextRequest,
  params: Promise<{ type: string }>
) {
  const session = await requireAdminSession()
  if (!session) {
    return NextResponse.json(
      { detail: "Forbidden: Admin privileges required" },
      { status: 403 }
    )
  }

  const resolvedParams = await params
  const type = resolvedParams.type
  const searchParams = request.nextUrl.searchParams.toString()

  let endpoint = `/api/reports/export/${type}`
  if (type === "principal") {
    endpoint = "/api/principal-report/export"
  }

  const targetUrl = `${API_ORIGIN}${endpoint}${searchParams ? `?${searchParams}` : ""}`

  try {
    const isPost = request.method === "POST"
    const bodyText = isPost ? await request.text() : undefined

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        ...(isPost ? { "Content-Type": "application/json" } : {}),
        ...adminHeaders(),
      },
      ...(isPost ? { body: bodyText } : {}),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return new NextResponse(errorText, {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      })
    }

    const blob = await response.blob()
    const responseHeaders = new Headers()
    const contentType = response.headers.get("Content-Type")
    const contentDisposition = response.headers.get("Content-Disposition")

    if (contentType) responseHeaders.set("Content-Type", contentType)
    if (contentDisposition) responseHeaders.set("Content-Disposition", contentDisposition)

    return new NextResponse(blob, {
      status: 200,
      headers: responseHeaders,
    })
  } catch (err) {
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : "Export proxy error" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  return handleProxyExport(request, params)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  return handleProxyExport(request, params)
}
