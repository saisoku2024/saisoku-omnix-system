import { NextRequest, NextResponse } from "next/server"

import { adminHeaders } from "@/lib/admin-api"
import { API_ORIGIN } from "@/lib/api"
import { requireAdminSession } from "@/lib/auth-token"
import { fetchAuditLogs, insertAuditLog } from "@/lib/supabase-audit"

export async function GET(request: NextRequest) {
  const session = await requireAdminSession()
  if (!session) {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 })
  }

  const actionFilter = request.nextUrl.searchParams.get("action")

  const directLogs = await fetchAuditLogs(actionFilter)
  if (directLogs) {
    return NextResponse.json({ total: directLogs.length, logs: directLogs })
  }

  try {
    const searchParams = request.nextUrl.searchParams.toString()
    const backendUrl = `${API_ORIGIN}/api/admin/audit-logs${searchParams ? `?${searchParams}` : ""}`
    const response = await fetch(backendUrl, {
      method: "GET",
      headers: adminHeaders(),
      cache: "no-store",
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(
      { detail: "Audit logs unavailable" },
      { status: response.status }
    )
  } catch (error) {
    return NextResponse.json(
      { detail: "Audit logs unavailable", error: String(error) },
      { status: 503 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession()
  if (!session) {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const success = await insertAuditLog(body)
    return NextResponse.json({ success })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
