export type ModeType = "monthly" | "quarterly" | "yearly"

export type DistributionViewType = "total" | "average"

export interface SummaryData {
  total_response: number
  high_score: number
  low_score: number
  avg_csat: number
}

export interface TrendRaw {
  month?: string
  label?: string
  name?: string
  period?: string
  pct_4?: number
  pct_5?: number
  score_4?: number
  score_5?: number
  pct4?: number
  pct5?: number
}

export interface TrendRow {
  month: string
  positive_pct: number
}

export interface DistRow {
  rating: string
  value: number
}

export interface AgentTotal {
  agent: string
  total: number
}

export interface AgentAvg {
  agent: string
  avg_csat: number | string
}

export interface CsatResponse {
  summary?: SummaryData
  trend?: TrendRaw[]
  distribution?: Array<{
    rating: number | string
    count?: number
    avg?: number
  }>
  top_agent_total?: AgentTotal[]
  top_agent_avg?: AgentAvg[]
}
