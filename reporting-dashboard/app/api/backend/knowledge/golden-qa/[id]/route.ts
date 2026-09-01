import { NextResponse } from "next/server"

import { adminHeaders } from "@/lib/admin-api"
import { API_ORIGIN } from "@/lib/api"
import { readProxyResponse } from "@/lib/proxy-response"
import { getCurrentSession } from "@/lib/server-auth"

export const maxDuration = 30
export const dynamic = "force-dynamic"

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
  }

  const { id } = params
  if (!id) {
    return NextResponse.json({ detail: "Missing golden QA ID" }, { status: 400 })
  }

  try {
    const response = await fetch(`${API_ORIGIN}/api/knowledge/golden-qa/${id}`, {
      method: "DELETE",
      headers: adminHeaders(),
      cache: "no-store",
    })
    const data = await readProxyResponse(response, "Knowledge Golden QA delete")
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Knowledge Golden QA delete error" },
      { status: 503 }
    )
  }
}
