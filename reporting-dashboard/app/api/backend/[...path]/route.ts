import { NextRequest, NextResponse } from "next/server"

import { adminHeaders, getAdminApiToken } from "@/lib/admin-api"
import { API_ORIGIN } from "@/lib/api"
import { getCurrentSession } from "@/lib/server-auth"

const ALLOWED_READ_ROUTES = new Set([
  "GET dashboard/years",
  "GET dashboard/summary",
  "GET dashboard/trend",
  "GET dashboard/by-channel",
  "GET dashboard/by-category",
  "GET dashboard/by-brand",
  "GET dashboard/customer",
  "GET dashboard/new-customer",
  "GET dashboard/all",
  "GET omnix/summary",
  "GET omnix/daily",
  "GET omnix/hourly",
  "GET omnix/by-day",
  "GET omnix/by-channel",
  "GET omnix/by-category",
  "GET omnix/by-product",
  "GET omnix/all",
  "GET voice/summary",
  "GET voice/daily",
  "GET voice/hourly",
  "GET voice/by-day",
  "GET voice/status",
  "GET voice/agent",
  "GET voice/all",
  "GET csat/summary",
  "GET csat/top-agent-total",
  "GET csat/top-agent-avg",
  "GET csat/all",
  "GET reports/options",
  "POST reports/preview",
  "POST cleanup/preview",
  "POST cleanup/diagnostics/phone-format",
  "GET principal-report/summary",
])

const SENSITIVE_PROXY_ROUTES = new Set([
  "POST reports/preview",
  "POST cleanup/preview",
  "POST cleanup/diagnostics/phone-format",
])

function isAllowedBackendRead(method: string, path: string) {
  return ALLOWED_READ_ROUTES.has(`${method.toUpperCase()} ${path}`)
}

function responseHeadersFromBackend(response: Response) {
  const headers = new Headers()
  const contentType = response.headers.get("Content-Type")
  const contentDisposition = response.headers.get("Content-Disposition")

  if (contentType) headers.set("Content-Type", contentType)
  if (contentDisposition) headers.set("Content-Disposition", contentDisposition)

  return headers
}

async function proxyBackendRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
  }

  const { path: pathSegments } = await params
  const path = pathSegments.join("/")
  const routeKey = `${request.method.toUpperCase()} ${path}`

  if (!isAllowedBackendRead(request.method, path)) {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 })
  }

  // Restrict sensitive proxy routes for guest role
  const role = session.role || session.sub
  if (SENSITIVE_PROXY_ROUTES.has(routeKey) && role === "guest") {
    return NextResponse.json(
      { detail: "Forbidden: Guest role cannot execute sensitive management operations" },
      { status: 403 }
    )
  }

  if (!getAdminApiToken()) {
    return NextResponse.json(
      { detail: "ADMIN_API_TOKEN is not configured in Next.js server environment" },
      { status: 503 }
    )
  }

  const search = request.nextUrl.search
  const targetUrl = `${API_ORIGIN}/api/${path}${search}`
  const headers = new Headers(adminHeaders())
  const contentType = request.headers.get("Content-Type")
  const hasRequestBody = request.method !== "GET" && request.method !== "HEAD"

  if (contentType && hasRequestBody) {
    headers.set("Content-Type", contentType)
  }

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: hasRequestBody ? await request.arrayBuffer() : undefined,
    cache: "no-store",
  })

  if (!response.ok) {
    const contentType = response.headers.get("Content-Type") || ""
    if (contentType.includes("application/json")) {
      const errorPayload = await response.json().catch(() => null)
      return NextResponse.json(
        errorPayload || { detail: `Backend request failed with HTTP ${response.status}` },
        { status: response.status }
      )
    }

    return NextResponse.json(
      { detail: `Backend request failed with HTTP ${response.status}` },
      { status: response.status }
    )
  }

  return new Response(response.body, {
    status: response.status,
    headers: responseHeadersFromBackend(response),
  })
}

export const GET = proxyBackendRequest
export const POST = proxyBackendRequest

