import { apiUrl } from "@/lib/api"
import type {
  BrandItem,
  CategoryItem,
  ChannelItem,
  ModeType,
  StatsData,
  TrendItem,
} from "@/features/dashboard/types/dashboard"

const DASHBOARD_API = apiUrl("/api/dashboard")
const CSAT_API = apiUrl("/api/csat")
const EMPTY_STATS: StatsData = {
  total_ticket: "-",
  aht: "-",
  art: "-",
  awt: "-",
  csat: "-",
}

export type DashboardAllResponse = {
  summary?: StatsData
  trend?: TrendItem[]
  channel?: ChannelItem[]
  category?: CategoryItem[]
  brand?: BrandItem[]
  customer?: { total?: number }
  new_customer?: { total?: number }
  data?: {
    trend?: TrendItem[]
  }
}

export type DashboardPayload = {
  stats: StatsData
  trend: TrendItem[]
  channel: ChannelItem[]
  category: CategoryItem[]
  brand: BrandItem[]
  customer: number
  newCustomer: number
}

function resolveDashboardTrend(response: DashboardAllResponse) {
  const legacyData = response as {
    data?: TrendItem[] | { trend?: TrendItem[] }
    trend?: TrendItem[] | { data?: TrendItem[] }
  }

  if (Array.isArray(response.trend)) {
    return response.trend
  }

  if (Array.isArray(legacyData.data)) {
    return legacyData.data
  }

  if (
    legacyData.data &&
    !Array.isArray(legacyData.data) &&
    Array.isArray(legacyData.data.trend)
  ) {
    return legacyData.data.trend
  }

  if (
    legacyData.trend &&
    !Array.isArray(legacyData.trend) &&
    Array.isArray(legacyData.trend.data)
  ) {
    return legacyData.trend.data
  }

  return []
}

function normalizeDashboardResponse(response: DashboardAllResponse): DashboardPayload {
  return {
    stats: response.summary || EMPTY_STATS,
    trend: resolveDashboardTrend(response),
    channel: response.channel || [],
    category: response.category || [],
    brand: response.brand || [],
    customer: response.customer?.total ?? 0,
    newCustomer: response.new_customer?.total ?? 0,
  }
}

async function fetchDashboardCsatScore(
  mode: ModeType,
  period: string,
  year: number
) {
  try {
    const normalizedPeriod = mode === "yearly" ? "all" : period
    const response = await fetch(
      `${CSAT_API}/summary?mode=${mode}&period=${normalizedPeriod}&year=${year}`,
      { cache: "no-store" }
    )

    if (!response.ok) return null

    const summary = (await response.json()) as { avg_csat?: unknown }
    const avgCsat = Number(summary.avg_csat ?? 0)

    return Number.isFinite(avgCsat) ? String(avgCsat) : null
  } catch {
    return null
  }
}

export async function fetchDashboardAll(mode: ModeType, period: string, year: number) {
  const normalizedPeriod = mode === "yearly" ? "all" : period
  const response = await fetch(
    `${DASHBOARD_API}/all?mode=${mode}&period=${normalizedPeriod}&year=${year}`,
    { cache: "no-store" }
  )

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const payload = normalizeDashboardResponse(
    (await response.json()) as DashboardAllResponse
  )
  const csatScore = await fetchDashboardCsatScore(mode, period, year)
  const payloadWithCsat = csatScore
    ? {
        ...payload,
        stats: {
          ...payload.stats,
          csat: csatScore,
        },
      }
    : payload

  if (mode !== "quarterly") {
    return payloadWithCsat
  }

  const trendResponse = await fetch(
    `${DASHBOARD_API}/all?mode=yearly&period=all&year=${year}`,
    { cache: "no-store" }
  )

  if (!trendResponse.ok) {
    return payloadWithCsat
  }

  return {
    ...payloadWithCsat,
    trend: resolveDashboardTrend((await trendResponse.json()) as DashboardAllResponse),
  }
}
