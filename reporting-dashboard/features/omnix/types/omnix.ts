export type ModeType = "monthly" | "quarterly" | "yearly"

export interface SummaryData {
  total_ticket: number
  aht: string
  art: string
  awt: string
}

export interface TrendData {
  label: string
  count: number
}

export interface NamedCount {
  name: string
  count: number
}

export interface NamedCountWithPct extends NamedCount {
  pct: number
}

export interface TopCase {
  rank: number
  title: string
  count: number
  channel: string
}

export interface CustomerData {
  label: string
  total: number
  new: number
}

export interface OmnixResponse {
  summary?: SummaryData
  trend?: TrendData[]
  channel?: NamedCount[]
  category?: NamedCount[]
  product?: NamedCount[]
  top_cases?: TopCase[]
  customer?: CustomerData[]
}