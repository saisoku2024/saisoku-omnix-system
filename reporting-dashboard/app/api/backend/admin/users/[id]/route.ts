import { NextRequest, NextResponse } from "next/server"

import { adminHeaders } from "@/lib/admin-api"
import { API_ORIGIN } from "@/lib/api"
import { requireAdminSession } from "@/lib/auth-token"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await requireAdminSession()
  if (!session) {
    return NextResponse.json(
      { error: "Akses ditolak: Diperlukan sesi Admin/Super Admin" },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const backendUrl = `${API_ORIGIN}/api/admin/users/${id}`
    const response = await fetch(backendUrl, {
      method: "PATCH",
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
      { error: error instanceof Error ? error.message : "Gagal meng-update user" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await requireAdminSession()
  if (!session) {
    return NextResponse.json(
      { error: "Akses ditolak: Diperlukan sesi Admin/Super Admin" },
      { status: 403 }
    )
  }

  try {
    const backendUrl = `${API_ORIGIN}/api/admin/users/${id}`
    const response = await fetch(backendUrl, {
      method: "DELETE",
      headers: adminHeaders(),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal menghapus user" },
      { status: 500 }
    )
  }
}
