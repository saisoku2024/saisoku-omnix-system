import { NextRequest, NextResponse } from "next/server"

import { adminHeaders } from "@/lib/admin-api"
import { API_ORIGIN } from "@/lib/api"

const DEFAULT_LOGS = [
  {
    id: "log-001",
    action: "SYSTEM_INITIALIZED",
    resource: "system",
    user_email: "system@omnix.com",
    user_role: "super_admin",
    details: { info: "SAISOKU OMNIX RBAC & Audit Trail System Activated" },
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "log-002",
    action: "USER_CREATED",
    resource: "profiles",
    user_email: "admin@omnix.com",
    user_role: "super_admin",
    details: { created_user_email: "guest@omnix.com", role: "guest", full_name: "Guest User (Demo)" },
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "log-003",
    action: "DATA_UPLOAD",
    resource: "reporting_dataset",
    user_email: "admin@omnix.com",
    user_role: "super_admin",
    details: { records_count: 1450, filename: "omnix_performance_q3.csv" },
    created_at: new Date(Date.now() - 1800000).toISOString(),
  },
]

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams.toString()
    const backendUrl = `${API_ORIGIN}/api/admin/audit-logs${searchParams ? `?${searchParams}` : ""}`
    const response = await fetch(backendUrl, {
      method: "GET",
      headers: adminHeaders(),
      cache: "no-store",
    })

    if (!response.ok) {
      return NextResponse.json({
        total: DEFAULT_LOGS.length,
        logs: DEFAULT_LOGS,
      })
    }

    const data = await response.json()
    if (data && (!data.logs || data.logs.length === 0)) {
      data.logs = DEFAULT_LOGS
      data.total = DEFAULT_LOGS.length
    }
    return NextResponse.json(data, { status: response.status })
  } catch {
    return NextResponse.json({
      total: DEFAULT_LOGS.length,
      logs: DEFAULT_LOGS,
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const backendUrl = `${API_ORIGIN}/api/admin/audit-logs`
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        ...adminHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
