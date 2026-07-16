import { apiUrl } from "@/lib/api"
import type {
  AgentAvg,
  AgentTotal,
  CsatResponse,
  ModeType,
  SummaryData,
  TrendRaw,
} from "@/features/csat/types/csat"
import { buildPeriodQuery } from "@/services/period"

const CSAT_API = apiUrl("/api/csat")
const EMPTY_SUMMARY: SummaryData = {
  total_response: 0,
  high_score: 0,
  low_score: 0,
  avg_csat: 0,
}

export type CsatPayload = {
  summary: SummaryData
  rawTrend: TrendRaw[]
  rawDistribution: Array<{ rating: number | string; count?: number; avg?: number }>
  topAgentTotal: AgentTotal[]
  topAgentAvg: AgentAvg[]
}

function normalizeCsatResponse(response: CsatResponse): CsatPayload {
  return {
    summary: response.summary ?? EMPTY_SUMMARY,
    rawTrend: Array.isArray(response.trend) ? response.trend : [],
    rawDistribution: Array.isArray(response.distribution) ? response.distribution : [],
    topAgentTotal: Array.isArray(response.top_agent_total) ? response.top_agent_total : [],
    topAgentAvg: Array.isArray(response.top_agent_avg) ? response.top_agent_avg : [],
  }
}

export async function fetchCsatData(mode: ModeType, period: string, year: number) {
  const qs = buildPeriodQuery(mode, period, year)
  const response = await fetch(`${CSAT_API}/all?${qs.toString()}`, {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  return normalizeCsatResponse((await response.json()) as CsatResponse)
}
