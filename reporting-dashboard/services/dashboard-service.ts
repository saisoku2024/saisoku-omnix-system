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

  if (mode !== "quarterly") {
    return payload
  }

  const trendResponse = await fetch(
    `${DASHBOARD_API}/all?mode=yearly&period=all&year=${year}`,
    { cache: "no-store" }
  )

  if (!trendResponse.ok) {
    return payload
  }

  return {
    ...payload,
    trend: resolveDashboardTrend((await trendResponse.json()) as DashboardAllResponse),
  }
}
