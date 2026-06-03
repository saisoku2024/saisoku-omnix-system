export type ModeType = "monthly" | "quarterly" | "yearly"

export type SummaryData = {
  total_calls: number
  answered: number
  abandon: number
  aht: string
  awt: string
  scr: number
}

export type DailyData = { label: string; count: number }
export type HourlyData = { label: string; count: number }
export type ByDayData = { label: string; count: number }

export type AgentHandling = { agent: string; total: number }
export type AgentMetric = { agent: string; value: string }

export type VoiceResponse = {
  summary?: SummaryData
  daily?: DailyData[]
  hourly?: HourlyData[]
  byDay?: ByDayData[]
  agentHandling?: AgentHandling[]
  agentAht?: AgentMetric[]
  agentAwt?: AgentMetric[]
}