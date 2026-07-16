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

function normalizeVoiceResponse(response: VoiceResponse): VoicePayload {
  return {
    summary: sanitizeSummary(response.summary),
    daily: fallbackArray(response.daily),
    hourly: fallbackArray(response.hourly),
    byDay: fallbackArray(response.byDay),
    agentHandling: fallbackArray(response.agentHandling),
    agentAht: fallbackArray(response.agentAht),
    agentAwt: fallbackArray(response.agentAwt),
  }
}

export async function fetchVoiceData(mode: ModeType, period: string, year: number) {
  const qs = buildPeriodQuery(mode, period, year)
  const response = await fetch(`${VOICE_API}/all?${qs.toString()}`, {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  return normalizeVoiceResponse((await response.json()) as VoiceResponse)
}
