import { NextRequest, NextResponse } from "next/server"

import { adminHeaders } from "@/lib/admin-api"
import { API_ORIGIN } from "@/lib/api"
import { requireAdminSession } from "@/lib/auth-token"

const DEFAULT_USERS = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    email: "admin@omnix.com",
    full_name: "Super Admin",
    role: "super_admin",
    brand_access: ["ALL"],
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    email: "guest@omnix.com",
    full_name: "Guest User (Demo)",
    role: "guest",
    brand_access: ["ALL"],
    created_at: "2024-01-01T00:00:00Z",
  },
]

export async function GET() {
  try {
    const backendUrl = `${API_ORIGIN}/api/admin/users`
    const response = await fetch(backendUrl, {
      method: "GET",
      headers: adminHeaders(),
      cache: "no-store",
    })

    if (!response.ok) {
      return NextResponse.json({
        total: DEFAULT_USERS.length,
        users: DEFAULT_USERS,
      })
    }

    const data = await response.json()
    if (data && (!data.users || data.users.length === 0)) {
      data.users = DEFAULT_USERS
      data.total = DEFAULT_USERS.length
    }
    return NextResponse.json(data, { status: response.status })
  } catch {
    return NextResponse.json({
      total: DEFAULT_USERS.length,
      users: DEFAULT_USERS,
    })
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
