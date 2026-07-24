import { NextResponse } from "next/server"

import { getCurrentSession } from "@/lib/server-auth"

export async function GET() {
  const session = await getCurrentSession()

  return NextResponse.json({
    authenticated: Boolean(session),
    role: session?.role || session?.sub || null,
    email: session?.email || null,
    fullName: session?.fullName || null,
    sub: session?.sub || null,
  })
}

