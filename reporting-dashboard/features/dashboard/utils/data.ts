import { MONTHS, QUARTER_MONTHS } from "@/features/dashboard/constants"
import type {
  ChannelItem,
  ModeType,
  PieItemWithPct,
  TrendItem,
} from "@/features/dashboard/types/dashboard"

const MONTH_INDEX_MAP = new Map<string, number>([
  ["jan", 0], ["feb", 1], ["mar", 2], ["apr", 3], ["may", 4], ["jun", 5],
  ["jul", 6], ["aug", 7], ["sep", 8], ["oct", 9], ["nov", 10], ["dec", 11],
  ["january", 0], ["february", 1], ["march", 2], ["april", 3], ["june", 5],
  ["july", 6], ["august", 7], ["september", 8], ["october", 9], ["november", 10], ["december", 11],
  ["januari", 0], ["februari", 1], ["maret", 2], ["mei", 4], ["juni", 5],
  ["juli", 6], ["agustus", 7], ["oktober", 9], ["desember", 11],
  ["1", 0], ["01", 0], ["2", 1], ["02", 1], ["3", 2], ["03", 2], ["4", 3], ["04", 3],
  ["5", 4], ["05", 4], ["6", 5], ["06", 5], ["7", 6], ["07", 6], ["8", 7], ["08", 7],
  ["9", 8], ["09", 8], ["10", 9], ["11", 10], ["12", 11]
])

function parseMonthIndex(raw: unknown): number | undefined {
  if (raw === undefined || raw === null) return undefined
  const str = String(raw).trim().toLowerCase()
  if (!str) return undefined

  const isoMatch = str.match(/^\d{4}-(\d{2})/)
  if (isoMatch) {
    const m = parseInt(isoMatch[1], 10)
    if (m >= 1 && m <= 12) return m - 1
  }

  return MONTH_INDEX_MAP.get(str)
}

function padDay(day: number) {
  return String(day).padStart(2, "0")
}

function getDaysInSelectedMonth(period: string, year: number) {
  const monthIndex = MONTHS.indexOf(period)
  if (monthIndex === -1) return 31
  return new Date(year, monthIndex + 1, 0).getDate()
}

function getMonthlyDayLabel(item: TrendItem) {
  const raw = item.date ?? item.day ?? item.month ?? item.label
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
      return { day: day, count: countByDay.get(day) ?? 0 }
    })
  }

  // Quarterly, Yearly, or default mode: Return ALL 12 MONTHS sorted chronologically (Jan -> Dec)
  const countByMonthIndex = new Map<number, number>()

  trend.forEach((item) => {
    const rawLabel = item.label ?? item.date ?? item.day ?? item.month
    const idx = parseMonthIndex(rawLabel)
    if (idx === undefined) return
    const count = Number(item.count ?? item.total ?? 0)
    countByMonthIndex.set(idx, (countByMonthIndex.get(idx) ?? 0) + count)
  })

  return MONTHS.map((month, index) => ({
    day: month,
    count: countByMonthIndex.get(index) ?? 0,
  }))
}

export function buildDashboardChannelPie(channel: ChannelItem[]): PieItemWithPct[] {
  const total = channel.reduce((sum, item) => sum + item.count, 0)
  return channel.map((item) => ({
    ...item,
    pct: total ? Math.round((item.count / total) * 100) : 0,
  }))
}
