import { MONTHS } from "@/features/dashboard/constants"
import type {
  ChannelItem,
  ModeType,
  PieItemWithPct,
  TrendItem,
} from "@/features/dashboard/types/dashboard"

const MONTH_INDEX = new Map(MONTHS.map((month, index) => [month, index]))

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

export function isValidDashboardPeriod(mode: ModeType, period: string) {
  if (mode === "quarterly" && !period.startsWith("Q")) return false
  if (mode === "monthly" && (period.startsWith("Q") || period === "all")) return false
  return true
}

export function buildDashboardTrendData(
  mode: ModeType,
  period: string,
  year: number,
  trend: TrendItem[]
) {
  if (mode === "monthly") {
    const countByDay = new Map<string, number>()

    trend.forEach((item) => {
      const day = getMonthlyDayLabel(item)
      if (!day) return

      const count = Number(item.count ?? item.total ?? 0)
      countByDay.set(day, (countByDay.get(day) ?? 0) + count)
    })

    return Array.from({ length: getDaysInSelectedMonth(period, year) }, (_, index) => {
      const day = padDay(index + 1)
      return { day, count: countByDay.get(day) ?? 0 }
    })
  }

  return trend
    .filter((item) => item && (item.date || item.day || item.month))
    .map((item) => ({
      day: String(item.date ?? item.day ?? item.month),
      count: Number(item.count ?? item.total ?? 0),
    }))
}

export function buildDashboardChannelPie(channel: ChannelItem[]): PieItemWithPct[] {
  const total = channel.reduce((sum, item) => sum + item.count, 0)
  return channel.map((item) => ({
    ...item,
    pct: total ? Math.round((item.count / total) * 100) : 0,
  }))
}
