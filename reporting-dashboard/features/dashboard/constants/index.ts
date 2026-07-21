import {
  TicketCheck,
  Clock,
  PhoneCall,
  TrendingUp,
  Star,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import type { StatsData } from "@/features/dashboard/types/dashboard"

export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

export const QUARTERS = ["Q1", "Q2", "Q3", "Q4"]

export const QUARTER_MONTHS: Record<string, string[]> = {
  Q1: ["Jan", "Feb", "Mar"],
  Q2: ["Apr", "May", "Jun"],
  Q3: ["Jul", "Aug", "Sep"],
  Q4: ["Oct", "Nov", "Dec"],
}

export function getHighlightedMonths(mode: string, period: string): string[] {
  if (mode === "yearly" || period === "all") return MONTHS
  if (mode === "quarterly") return QUARTER_MONTHS[period] ?? []
  return [period]
}

export const PALETTE = [
  "#0ea5e9",
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#f43f5e",
  "#8b5cf6",
  "#06b6d4",
]

export type KpiConfigItem = {
  key: keyof StatsData
  label: string
  icon: LucideIcon
  color: string
}

export const KPI_CONFIG: KpiConfigItem[] = [
  { key: "total_ticket", label: "Total Ticket",    icon: TicketCheck, color: "#0ea5e9" },
  { key: "aht",          label: "Avg Handle Time", icon: Clock,       color: "#8b5cf6" },
  { key: "art",          label: "Avg Response",    icon: PhoneCall,   color: "#f59e0b" },
  { key: "awt",          label: "Avg Wait Time",   icon: TrendingUp,  color: "#10b981" },
  { key: "csat",         label: "CSAT Score",      icon: Star,        color: "#f43f5e" },
]