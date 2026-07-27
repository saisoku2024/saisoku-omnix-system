import type {
  CustomerData,
  ModeType,
  NamedCount,
  OmnixResponse,
  SummaryData,
  TopCase,
  TrendData,
} from "@/features/omnix/types/omnix"
import { throwFetchError } from "@/services/http-error"
import { buildPeriodQuery } from "@/services/period"
import { MONTHS } from "@/features/omnix/constants"

const OMNIX_API = "/api/backend/omnix"
const EMPTY_SUMMARY: SummaryData = {
  total_ticket: 0,
  aht: "0m 0s",
  art: "0m 0s",
  awt: "0m 0s",
}

export type OmnixPayload = {
  summary: SummaryData
  trend: TrendData[]
  channel: NamedCount[]
  category: NamedCount[]
  product: NamedCount[]
  topCases: TopCase[]
  customer: CustomerData[]
}

function sanitizeSummary(raw: Partial<SummaryData> | undefined): SummaryData {
  if (!raw) return EMPTY_SUMMARY

  const safeNum = (value: unknown): number => {
    const parsed = typeof value === "number" ? value : Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const safeStr = (value: unknown, fallback: string): string => {
    if (value === null || value === undefined || value === "") return fallback
    return String(value)
  }

  return {
    total_ticket: safeNum(raw.total_ticket),
    aht: safeStr(raw.aht, "0m 0s"),
    art: safeStr(raw.art, "0m 0s"),
    awt: safeStr(raw.awt, "0m 0s"),
  }
}

function normalizeDayLabel(value: string | number | undefined): string {
  const str = String(value ?? "").trim()
  if (!str) return ""
  const isoDay = str.match(/^\d{4}[-/.]\d{1,2}[-/.](\d{1,2})/)
  if (isoDay) return String(Number(isoDay[1])).padStart(2, "0")
  const dmyDay = str.match(/^(\d{1,2})[-/.]\d{1,2}[-/.]\d{4}/)
  if (dmyDay) return String(Number(dmyDay[1])).padStart(2, "0")
  const day = Number(str)
  return Number.isFinite(day) && day > 0 && day <= 31 ? String(day).padStart(2, "0") : ""
}

function getMonthDays(period: string, year: number): string[] {
  const monthIndex = MONTHS.indexOf(period)
  const daysInMonth =
    monthIndex === -1 ? 31 : new Date(year, monthIndex + 1, 0).getDate()

  return Array.from({ length: daysInMonth }, (_, index) =>
    String(index + 1).padStart(2, "0")
  )
}

function getQuarterCutoffIndex(period: string): number {
  const quarterOrder = ["Q1", "Q2", "Q3", "Q4"]
  const quarterIndex = quarterOrder.indexOf(period)
  return quarterIndex === -1 ? MONTHS.length - 1 : (quarterIndex + 1) * 3 - 1
}

function sanitizeTrend(raw: unknown): TrendData[] {
  if (!Array.isArray(raw)) return []

  return raw
    .map((entry): TrendData => {
      if (!entry || typeof entry !== "object") return { label: "", count: 0 }

      const row = entry as Record<string, unknown>
      const rawLabel = row.label ?? row.date ?? row.hour ?? row.day ?? row.month ?? ""
      let label = String(rawLabel)

      if (label.includes("-")) {
        const parts = label.split("-")
        label = parts[parts.length - 1] || label
      }

      const count = Number(row.count ?? row.total ?? 0)
      return {
        label,
        count: Number.isFinite(count) ? count : 0,
      }
    })
    .filter((entry) => entry.label !== "")
}

const MONTH_MAP_INDEX: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, mei: 4, jun: 5,
  jul: 6, aug: 7, agu: 7, sep: 8, oct: 9, okt: 9, nov: 10, dec: 11, des: 11,
  january: 0, february: 1, march: 2, april: 3, june: 5, july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  januari: 0, februari: 1, maret: 2, juni: 5, juli: 6, agustus: 7, oktober: 9, desember: 11,
  "1": 0, "01": 0, "2": 1, "02": 1, "3": 2, "03": 2, "4": 3, "04": 3,
  "5": 4, "05": 4, "6": 5, "06": 5, "7": 6, "07": 6, "8": 7, "08": 7,
  "9": 8, "09": 8, "10": 9, "11": 10, "12": 11,
}

function parseMonthIdx(raw: unknown): number | undefined {
  if (raw === undefined || raw === null) return undefined
  const str = String(raw).trim().toLowerCase()
  if (!str) return undefined
  const isoMatch = str.match(/^\d{4}-(\d{2})/)
  if (isoMatch) {
    const m = parseInt(isoMatch[1], 10)
    if (m >= 1 && m <= 12) return m - 1
  }
  return MONTH_MAP_INDEX[str]
}

function normalizeTrendData(
  raw: unknown,
  mode: ModeType,
  period: string,
  year: number
): TrendData[] {
  const trend = sanitizeTrend(raw)

  if (mode !== "monthly") {
    const monthCounts = new Map<number, number>()
    trend.forEach((row) => {
      const idx = parseMonthIdx(row.label)
      if (idx !== undefined) {
        monthCounts.set(idx, (monthCounts.get(idx) ?? 0) + row.count)
      }
    })
    const cutoffIndex =
      mode === "quarterly" ? getQuarterCutoffIndex(period) : MONTHS.length - 1

    return MONTHS.map((label, index) => ({
      label,
      count: index <= cutoffIndex ? monthCounts.get(index) ?? 0 : 0,
    }))
  }

  const dayMap = new Map(
    trend
      .map((row) => [normalizeDayLabel(row.label), row.count] as const)
      .filter(([label]) => label !== "")
  )

  return getMonthDays(period, year).map((label) => ({
    label,
    count: dayMap.get(label) ?? 0,
  }))
}

function sanitizeNamedCount(raw: unknown): NamedCount[] {
  if (!Array.isArray(raw)) return []

  return raw
    .map((entry): NamedCount => {
      const row = (entry ?? {}) as Record<string, unknown>
      const count = Number(row.count ?? row.total ?? 0)
      return {
        name: String(row.name ?? ""),
        count: Number.isFinite(count) ? count : 0,
      }
    })
    .filter((entry) => entry.name !== "")
}

function normalizeOmnixResponse(
  response: OmnixResponse,
  mode: ModeType,
  period: string,
  year: number
): OmnixPayload {
  const rawTrend =
    (response as Record<string, unknown>).trend ??
    (response as Record<string, unknown>).daily

  return {
    summary: sanitizeSummary(response.summary),
    trend: normalizeTrendData(rawTrend, mode, period, year),
    channel: sanitizeNamedCount(response.channel),
    category: sanitizeNamedCount(response.category),
    product: sanitizeNamedCount(response.product),
    topCases: Array.isArray(response.top_cases) ? response.top_cases : [],
    customer: Array.isArray(response.customer) ? response.customer : [],
  }
}

export async function fetchOmnixData(mode: ModeType, period: string, year: number) {
  const currentQs = buildPeriodQuery(mode, period, year)
  const currentResponse = await fetch(`${OMNIX_API}/all?${currentQs.toString()}`, {
    cache: "no-store",
  })

  if (!currentResponse.ok) {
    await throwFetchError(currentResponse, `HTTP ${currentResponse.status}`)
  }

  const currentPayload = normalizeOmnixResponse(
    (await currentResponse.json()) as OmnixResponse,
    mode,
    period,
    year
  )

  if (mode === "monthly" || mode === "yearly") {
    return currentPayload
  }

  const yearlyQs = buildPeriodQuery("yearly", "all", year)
  const yearlyResponse = await fetch(`${OMNIX_API}/all?${yearlyQs.toString()}`, {
    cache: "no-store",
  })

  if (!yearlyResponse.ok) {
    await throwFetchError(yearlyResponse, `HTTP ${yearlyResponse.status}`)
  }

  const yearlyPayload = normalizeOmnixResponse(
    (await yearlyResponse.json()) as OmnixResponse,
    mode,
    period,
    year
  )

  return {
    ...currentPayload,
    trend: yearlyPayload.trend,
  }
}
