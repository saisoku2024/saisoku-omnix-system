import { NextRequest, NextResponse } from "next/server"

import { adminHeaders } from "@/lib/admin-api"
import { API_ORIGIN } from "@/lib/api"
import { requireAdminSession } from "@/lib/auth-token"

export async function GET(request: NextRequest) {
  const session = await requireAdminSession()
  if (!session) {
    return NextResponse.json(
      { error: "Akses ditolak: Diperlukan sesi Admin/Super Admin" },
      { status: 403 }
    )
  }

  try {
    const searchParams = request.nextUrl.searchParams.toString()
    const backendUrl = `${API_ORIGIN}/api/admin/audit-logs${searchParams ? `?${searchParams}` : ""}`
    const response = await fetch(backendUrl, {
      method: "GET",
      headers: adminHeaders(),
      cache: "no-store",
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mengambil audit logs" },
      { status: 500 }
    )
  }
}
