import { adminHeaders } from "@/lib/admin-api"
import { API_ORIGIN } from "@/lib/api"

const SUPABASE_URL = (
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://lgptunvfnosnfejzrhml.supabase.co"
).replace(/\/+$/, "")

const SUPABASE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ""
)

export interface AuditLogItem {
  id?: string
  user_email: string
  user_role: string
  action: string
  resource: string
  details?: Record<string, unknown>
  created_at?: string
}

/**
 * Inserts a new Audit Log entry directly into Supabase REST API
 * (or via backend API origin if Supabase key is missing).
 */
export async function insertAuditLog(log: AuditLogItem): Promise<boolean> {
  const payload = {
    user_email: log.user_email,
    user_role: log.user_role,
    action: log.action,
    resource: log.resource,
    details: log.details || {},
    created_at: new Date().toISOString(),
  }

  // 1. Try Direct Supabase REST API first
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/audit_logs`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      })

      if (res.ok) {
        return true
      }
    } catch (err) {
      console.warn("Direct Supabase Audit Insert Warning:", err)
    }
  }

  // 2. Fallback to Python Backend API Origin
  try {
    const backendUrl = `${API_ORIGIN}/api/admin/audit-logs`
    const res = await fetch(backendUrl, {
      method: "POST",
      headers: {
        ...adminHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    })
    return res.ok
  } catch (err) {
    console.warn("Backend API Audit Insert Warning:", err)
    return false
  }
}

/**
 * Fetches Audit Logs directly from Supabase REST API
 * (or via backend API origin if Supabase key is missing).
 */
export async function fetchAuditLogs(actionFilter?: string | null): Promise<AuditLogItem[] | null> {
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      let restUrl = `${SUPABASE_URL}/rest/v1/audit_logs?select=*&order=created_at.desc&limit=100`
      if (actionFilter && actionFilter !== "ALL") {
        restUrl += `&action=eq.${encodeURIComponent(actionFilter)}`
      }

      const res = await fetch(restUrl, {
        method: "GET",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        cache: "no-store",
      })

      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          return data
        }
      }
    } catch (err) {
      console.warn("Direct Supabase Audit Fetch Warning:", err)
    }
  }

  return null
}
