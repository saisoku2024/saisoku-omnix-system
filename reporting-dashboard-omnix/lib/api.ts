const BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8001/api"

async function fetchAPI(endpoint: string) {
  const res = await fetch(`${BASE_URL}${endpoint}`)

  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`)
  }

  return res.json()
}

// ✅ EXPORT YANG DIBUTUHKAN HOOK
export const getDashboardSummary = () =>
  fetchAPI("/dashboard/summary")

export const getDashboardTrend = () =>
  fetchAPI("/dashboard/trend")

export const getDashboardByChannel = () =>
  fetchAPI("/dashboard/by-channel")