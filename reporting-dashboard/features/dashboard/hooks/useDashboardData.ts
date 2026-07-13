import { useState, useCallback, useEffect, useMemo } from "react"
import type { 
  ModeType, 
  StatsData, 
  TrendItem, 
  ChannelItem, 
  CategoryItem, 
  BrandItem, 
  PieItemWithPct 
} from "../types/dashboard"
import { MONTHS } from "@/features/dashboard/constants"
import { apiUrl } from "@/lib/api"

const API_BASE = apiUrl("/api/dashboard")
const MONTH_INDEX = new Map(MONTHS.map((month, index) => [month, index]))

const EMPTY_STATS: StatsData = { total_ticket: "–", aht: "–", art: "–", awt: "–", csat: "–" }

// Helpers internal
function buildQS(mode: ModeType, period: string, year: number) {
  return `mode=${mode}&period=${mode === "yearly" ? "all" : period}&year=${year}`
}

function periodMatchesMode(mode: ModeType, period: string) {
  if (mode === "quarterly" && !period.startsWith("Q")) return false
  if (mode === "monthly" && (period.startsWith("Q") || period === "all")) return false
  return true
}

function padDay(day: number) {
  return String(day).padStart(2, "0")
}

function getDaysInSelectedMonth(period: string, year: number) {
  const monthIndex = MONTH_INDEX.get(period)
  if (monthIndex === undefined) return 31
  return new Date(year, monthIndex + 1, 0).getDate()
}

function getMonthlyDayLabel(item: TrendItem) {
  const raw = item.date ?? item.day ?? item.month
  if (raw === undefined || raw === null) return null

  const value = String(raw).trim()
  if (!value) return null

  const isoDay = value.match(/^\d{4}-\d{2}-(\d{2})/)
  if (isoDay) return isoDay[1]

  const numericDay = Number(value)
  if (Number.isFinite(numericDay) && numericDay >= 1 && numericDay <= 31) {
    return padDay(numericDay)
  }

  return null
}

export function useDashboardData(mode: ModeType, period: string, year: number) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<StatsData>(EMPTY_STATS)
  const [trend, setTrend] = useState<TrendItem[]>([])
  const [channel, setChannel] = useState<ChannelItem[]>([])
  const [category, setCategory] = useState<CategoryItem[]>([])
  const [brand, setBrand] = useState<BrandItem[]>([])
  const [customer, setCustomer] = useState(0)
  const [newCustomer, setNewCustomer] = useState(0)

  const fetchAll = useCallback(() => {
    if (!periodMatchesMode(mode, period)) return
    
    setLoading(true)
    setError(null)
    const qs = buildQS(mode, period, year)
    
    fetch(`${API_BASE}/all?${qs}`)
      .then(r => { 
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() 
      })
      .then(d => {
        setStats(d.summary || EMPTY_STATS)
        const rawTrend = Array.isArray(d) ? d
          : Array.isArray(d.trend) ? d.trend
          : Array.isArray(d.data) ? d.data
          : Array.isArray(d.data?.trend) ? d.data?.trend
          : Array.isArray(d.trend?.data) ? d.trend?.data
          : []
        setTrend(rawTrend)
        setChannel(d.channel || [])
        setCategory(d.category || [])
        setBrand(d.brand || [])
        setCustomer(d.customer?.total ?? 0)
        setNewCustomer(d.new_customer?.total ?? 0)
      })
      .catch(err => {
        console.error("[useDashboardData] ERROR:", err)
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [mode, period, year])

  useEffect(() => {
    const timer = setTimeout(() => fetchAll(), 0)
    return () => clearTimeout(timer)
  }, [fetchAll])

  // Data olahan
  const trendData = useMemo(() => {
    if (mode === "monthly") {
      const countByDay = new Map<string, number>()

      if (Array.isArray(trend)) {
        trend.forEach((item) => {
          const day = getMonthlyDayLabel(item)
          if (!day) return

          const count = Number(item.count ?? item.total ?? 0)
          countByDay.set(day, (countByDay.get(day) ?? 0) + count)
        })
      }

      return Array.from({ length: getDaysInSelectedMonth(period, year) }, (_, index) => {
        const day = padDay(index + 1)
        return { day, count: countByDay.get(day) ?? 0 }
      })
    }

    if (!Array.isArray(trend) || trend.length === 0) return []
    return trend
      .filter(t => t && (t.date || t.day || t.month))
      .map(t => ({ day: String(t.date ?? t.day ?? t.month), count: Number(t.count ?? t.total ?? 0) }))
  }, [mode, period, trend, year])

  const channelPie: PieItemWithPct[] = useMemo(() => {
    const total = channel.reduce((s, c) => s + c.count, 0)
    return channel.map(c => ({ ...c, pct: total ? Math.round((c.count / total) * 100) : 0 }))
  }, [channel])

  const trendMax = useMemo(() => trendData.reduce((m, d) => Math.max(m, d.count), 0), [trendData])
  const channelMax = useMemo(() => channelPie.reduce((m, c) => Math.max(m, c.count), 0), [channelPie])
  const categoryMax = useMemo(() => category.reduce((m, c) => Math.max(m, c.count), 0), [category])

  return {
    loading, error, stats, 
    trendData, channelPie, category, brand, customer, newCustomer,
    trendMax, channelMax, categoryMax
  }
}
