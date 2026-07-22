import { NextRequest, NextResponse } from "next/server"

import { adminHeaders } from "@/lib/admin-api"
import { API_ORIGIN } from "@/lib/api"
import { requireAdminSession } from "@/lib/auth-token"
import { getCurrentSession } from "@/lib/server-auth"

export async function GET() {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    const backendUrl = `${API_ORIGIN}/api/admin/users`
    const response = await fetch(backendUrl, {
      method: "GET",
      headers: adminHeaders(),
      cache: "no-store",
    })

    const data = await response.json().catch(() => ({
      error: `Backend users request failed with HTTP ${response.status}`,
    }))

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal memuat user" },
      { status: 503 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession()
  if (!session) {
    return NextResponse.json(
      { error: "Akses ditolak: Mode Guest tidak diizinkan membuat user baru." },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const backendUrl = `${API_ORIGIN}/api/admin/users`
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal membuat user" },
      { status: 500 }
    )
  }
}
