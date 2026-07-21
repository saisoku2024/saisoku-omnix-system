import { apiUrl } from "@/lib/api"
import type {
  AgentHandling,
  AgentMetric,
  ByDayData,
  DailyData,
  HourlyData,
  ModeType,
  SummaryData,
  VoiceResponse,
} from "@/features/voice/types/voice"
import { buildPeriodQuery } from "@/services/period"
import { HOURS, MONTHS } from "@/features/voice/constants"

const VOICE_API = apiUrl("/api/voice")
const EMPTY_SUMMARY: SummaryData = {
  total_calls: 0,
  answered: 0,
  abandon: 0,
  aht: "0m 0s",
  awt: "0m 0s",
  scr: 0,
}

export type VoicePayload = {
  summary: SummaryData
  daily: DailyData[]
  hourly: HourlyData[]
  byDay: ByDayData[]
  agentHandling: AgentHandling[]
  agentAht: AgentMetric[]
  agentAwt: AgentMetric[]
}

function sanitizeSummary(raw: Partial<SummaryData> | undefined): SummaryData {
  if (!raw) return EMPTY_SUMMARY

  return {
    total_calls: raw.total_calls ?? 0,
    answered: raw.answered ?? 0,
    abandon: raw.abandon ?? 0,
    aht: raw.aht ?? "0m 0s",
    awt: raw.awt ?? "0m 0s",
    scr: raw.scr ?? 0,
  }
}

function fallbackArray<T>(value: T[] | undefined) {
  return Array.isArray(value) ? value : []
}

function normalizeDayLabel(value: string | number | undefined): string {
  const day = Number(String(value ?? "").replace(/\D/g, ""))
  return Number.isFinite(day) && day > 0 ? String(day).padStart(2, "0") : ""
}

function normalizeHourLabel(value: string | number | undefined): string {
  const rawValue = String(value ?? "").trim()
  const hour = Number(rawValue.includes(":") ? rawValue.split(":")[0] : rawValue)

  return Number.isFinite(hour) && hour >= 0 && hour <= 23
    ? `${String(hour).padStart(2, "0")}:00`
    : ""
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

function normalizeDailyData(
  rows: DailyData[] | undefined,
  mode: ModeType,
  period: string,
  year: number
): DailyData[] {
  const rowMap = new Map(
    fallbackArray(rows)
      .map((row) => [normalizeDayLabel(row.label), row.count] as const)
      .filter(([label]) => label !== "")
  )

  if (mode === "monthly") {
    return getMonthDays(period, year).map((label) => ({
      label,
      count: rowMap.get(label) ?? 0,
    }))
  }

  const monthMap = new Map(
    fallbackArray(rows).map((row) => [String(row.label ?? "").trim(), row.count] as const)
  )
  const cutoffIndex =
    mode === "quarterly" ? getQuarterCutoffIndex(period) : MONTHS.length - 1

  return MONTHS.map((label, index) => ({
    label,
    count: index <= cutoffIndex ? monthMap.get(label) ?? 0 : 0,
  }))
}

function normalizeHourlyData(rows: HourlyData[] | undefined): HourlyData[] {
  const rowMap = new Map(
    fallbackArray(rows)
      .map((row) => [normalizeHourLabel(row.label), row.count] as const)
      .filter(([label]) => label !== "")
  )

  return HOURS.map((label) => ({
    label,
    count: rowMap.get(label) ?? 0,
  }))
}

function normalizeVoiceResponse(
  response: VoiceResponse,
  mode: ModeType,
  period: string,
  year: number
): VoicePayload {
  return {
    summary: sanitizeSummary(response.summary),
    daily: normalizeDailyData(response.daily, mode, period, year),
    hourly: normalizeHourlyData(response.hourly),
    byDay: fallbackArray(response.byDay),
    agentHandling: fallbackArray(response.agentHandling),
    agentAht: fallbackArray(response.agentAht),
    agentAwt: fallbackArray(response.agentAwt),
  }
}

export async function fetchVoiceData(mode: ModeType, period: string, year: number) {
  const currentQs = buildPeriodQuery(mode, period, year)
  const currentResponse = await fetch(`${VOICE_API}/all?${currentQs.toString()}`, {
    cache: "no-store",
  })

  if (!currentResponse.ok) {
    throw new Error(`HTTP ${currentResponse.status}`)
  }

  const currentPayload = normalizeVoiceResponse(
    (await currentResponse.json()) as VoiceResponse,
    mode,
    period,
    year
  )

  if (mode === "monthly" || mode === "yearly") {
    return currentPayload
  }

  const yearlyQs = buildPeriodQuery("yearly", "all", year)
  const yearlyResponse = await fetch(`${VOICE_API}/all?${yearlyQs.toString()}`, {
    cache: "no-store",
  })

  if (!yearlyResponse.ok) {
    throw new Error(`HTTP ${yearlyResponse.status}`)
  }

  const yearlyPayload = normalizeVoiceResponse(
    (await yearlyResponse.json()) as VoiceResponse,
    mode,
    period,
    year
  )

  return {
    ...currentPayload,
    daily: yearlyPayload.daily,
  }
}
