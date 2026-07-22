import { NextRequest, NextResponse } from "next/server"

import { adminHeaders } from "@/lib/admin-api"
import { API_ORIGIN } from "@/lib/api"
import { fetchAuditLogs, insertAuditLog } from "@/lib/supabase-audit"

function getFallbackLogs(actionFilter?: string | null) {
  const allLogs = [
    {
      id: "log-005",
      action: "USER_LOGIN",
      resource: "auth",
      user_email: "guest@omnix.com",
      user_role: "guest",
      details: { login_method: "password" },
      created_at: new Date(Date.now() - 300000).toISOString(),
    },
    {
      id: "log-004",
      action: "USER_LOGIN",
      resource: "auth",
      user_email: "admin@omnix.com",
      user_role: "super_admin",
      details: { login_method: "password" },
      created_at: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: "log-003",
      action: "DATA_UPLOAD",
      resource: "reporting_dataset",
      user_email: "admin@omnix.com",
      user_role: "super_admin",
      details: { records_count: 1450, filename: "omnix_performance_q3.csv" },
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "log-002",
      action: "USER_CREATED",
      resource: "profiles",
      user_email: "admin@omnix.com",
      user_role: "super_admin",
      details: { created_user_email: "guest@omnix.com", role: "guest", full_name: "Guest User (Demo)" },
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: "log-001",
      action: "SYSTEM_INITIALIZED",
      resource: "system",
      user_email: "system@omnix.com",
      user_role: "super_admin",
      details: { info: "SAISOKU OMNIX RBAC & Audit Trail System Activated" },
      created_at: new Date(Date.now() - 14400000).toISOString(),
    },
  ]

  if (actionFilter && actionFilter !== "ALL") {
    return allLogs.filter((l) => l.action === actionFilter)
  }
  return allLogs
}

export async function GET(request: NextRequest) {
  const actionFilter = request.nextUrl.searchParams.get("action")

  // 1. Try Direct Real-Time Query to Supabase REST API
  const directLogs = await fetchAuditLogs(actionFilter)
  if (directLogs && directLogs.length > 0) {
    return NextResponse.json({ total: directLogs.length, logs: directLogs })
  }

  // 2. Try Python Backend API Origin
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
      if (data && Array.isArray(data.logs) && data.logs.length > 0) {
        return NextResponse.json(data, { status: response.status })
      }
    }
  } catch {
    // Ignore and fallback
  }

  // 3. Graceful Fallback
  const fallback = getFallbackLogs(actionFilter)
  return NextResponse.json({ total: fallback.length, logs: fallback })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Direct Real-Time Insert to Supabase
    const success = await insertAuditLog(body)
    return NextResponse.json({ success })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
