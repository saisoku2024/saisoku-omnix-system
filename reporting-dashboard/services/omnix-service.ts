import { apiUrl } from "@/lib/api"
import type {
  CustomerData,
  ModeType,
  NamedCount,
  OmnixResponse,
  SummaryData,
  TopCase,
  TrendData,
} from "@/features/omnix/types/omnix"
import { buildPeriodQuery } from "@/services/period"
import { MONTHS } from "@/features/omnix/constants"

const OMNIX_API = apiUrl("/api/omnix")
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
  const day = Number(String(value ?? "").replace(/\D/g, ""))
  return Number.isFinite(day) && day > 0 ? String(day).padStart(2, "0") : ""
}

function getMonthDays(period: string, year: number): string[] {
  const monthIndex = MONTHS.indexOf(period)
  const daysInMonth =
    monthIndex === -1 ? 31 : new Date(year, monthIndex + 1, 0).getDate()

  return Array.from({ length: daysInMonth }, (_, index) =>
    String(index + 1).padStart(2, "0")
  )
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

function normalizeTrendData(
  raw: unknown,
  mode: ModeType,
  period: string,
  year: number
): TrendData[] {
  const trend = sanitizeTrend(raw)

  if (mode !== "monthly") {
    return trend
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
  const qs = buildPeriodQuery(mode, period, year)
  const response = await fetch(`${OMNIX_API}/all?${qs.toString()}`, {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  return normalizeOmnixResponse((await response.json()) as OmnixResponse, mode, period, year)
}
