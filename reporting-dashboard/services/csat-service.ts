import type {
  AgentAvg,
  AgentTotal,
  CsatResponse,
  ModeType,
  SummaryData,
  TrendRaw,
} from "@/features/csat/types/csat"
import { buildPeriodQuery } from "@/services/period"

const CSAT_API = "/api/backend/csat"
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
  const currentQs = buildPeriodQuery(mode, period, year)
  const trendQs = buildPeriodQuery("yearly", "all", year)

  const [currentResponse, trendResponse] = await Promise.all([
    fetch(`${CSAT_API}/all?${currentQs.toString()}`, {
      cache: "no-store",
    }),
    fetch(`${CSAT_API}/all?${trendQs.toString()}`, {
      cache: "no-store",
    }),
  ])

  if (!currentResponse.ok) {
    throw new Error(`HTTP ${currentResponse.status}`)
  }

  if (!trendResponse.ok) {
    throw new Error(`HTTP ${trendResponse.status}`)
  }

  const currentPayload = normalizeCsatResponse(
    (await currentResponse.json()) as CsatResponse
  )
  const trendPayload = normalizeCsatResponse(
    (await trendResponse.json()) as CsatResponse
  )

  return {
    ...currentPayload,
    rawTrend: trendPayload.rawTrend,
  }
}
