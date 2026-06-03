export type ModeType = "monthly" | "quarterly" | "yearly"

export interface TrendItem {
  date?: string
  day?: string
  month?: string
  count?: number
  total?: number
}

export interface ChannelItem { 
  name: string
  count: number 
}

export interface CategoryItem { 
  name: string
  count: number 
}

export interface BrandItem { 
  name: string
  count: number
  pct: number 
}

export interface PieItemWithPct extends ChannelItem { 
  pct: number 
}

export interface StatsData {
  total_ticket: string
  aht: string
  art: string
  awt: string
  csat: string
}