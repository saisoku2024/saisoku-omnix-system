import { NextRequest, NextResponse } from "next/server"

import { adminHeaders, getAdminApiToken } from "@/lib/admin-api"
import { API_ORIGIN } from "@/lib/api"
import { getCurrentSession } from "@/lib/server-auth"

export const dynamic = "force-dynamic"
export const revalidate = 0

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
  "GET upload-sessions",
  "GET principal-report/summary",
  "POST chat/upload",
  "POST chat/storage-ingest",
  "POST chat/ingest-sample-local",
  "POST chat/brand-insight",
  "GET knowledge/documents",
  "POST knowledge/upload-multiple",
  "POST knowledge/storage-ingest",
  "POST knowledge/text",
  "POST knowledge/url",
  "POST knowledge/query",
  "GET knowledge/inconsistencies",
  "GET knowledge/monitoring/summary",
  "GET knowledge/backup/export",
  "POST knowledge/backup/restore",
])

const SENSITIVE_PROXY_ROUTES = new Set([
  "POST cleanup/preview",
  "POST cleanup/diagnostics/phone-format",
  "POST knowledge/upload-multiple",
  "POST knowledge/storage-ingest",
  "POST knowledge/text",
  "POST knowledge/url",
  "GET knowledge/backup/export",
  "POST knowledge/backup/restore",
])

const ALLOWED_ROUTE_MATCHERS: Array<(method: string, path: string) => boolean> = [
  (method, path) =>
    method === "POST" &&
    path.startsWith("upload-sessions/") &&
    path.endsWith("/delete-preview"),
  (method, path) =>
    method === "POST" &&
    path.startsWith("upload-sessions/") &&
    path.endsWith("/delete"),
  (method, path) =>
    method === "DELETE" &&
    path.startsWith("knowledge/documents/"),
  (method, path) =>
    method === "PATCH" &&
    path.startsWith("knowledge/inconsistencies/"),
]

const SENSITIVE_ROUTE_MATCHERS: Array<(method: string, path: string) => boolean> = [
  (method, path) =>
    method === "POST" &&
    path.startsWith("upload-sessions/") &&
    path.endsWith("/delete"),
  (method, path) =>
    method === "DELETE" &&
    path.startsWith("knowledge/documents/"),
  (method, path) =>
    method === "PATCH" &&
    path.startsWith("knowledge/inconsistencies/"),
]

function isAllowedBackendRead(method: string, path: string) {
  const normalizedMethod = method.toUpperCase()
  return (
    ALLOWED_READ_ROUTES.has(`${normalizedMethod} ${path}`) ||
    ALLOWED_ROUTE_MATCHERS.some((matcher) => matcher(normalizedMethod, path))
  )
}

function isSensitiveBackendRoute(method: string, path: string) {
  const normalizedMethod = method.toUpperCase()
  const routeKey = `${normalizedMethod} ${path}`
  return (
    SENSITIVE_PROXY_ROUTES.has(routeKey) ||
    SENSITIVE_ROUTE_MATCHERS.some((matcher) => matcher(normalizedMethod, path))
  )
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

  if (!isAllowedBackendRead(request.method, path)) {
    return NextResponse.json({ detail: `Forbidden: Route ${request.method} ${path} is not allowed` }, { status: 403 })
  }

  // Restrict sensitive proxy routes for guest role
  const role = session.role || session.sub
  if (isSensitiveBackendRoute(request.method, path) && role === "guest") {
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
    const contentTypeHeader = response.headers.get("Content-Type") || ""
    if (contentTypeHeader.includes("application/json")) {
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
export const DELETE = proxyBackendRequest
