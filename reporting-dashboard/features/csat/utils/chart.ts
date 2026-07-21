import type { ModeType, TrendRaw, TrendRow } from "@/features/csat/types/csat"
import { MONTHS, QUARTER_MONTHS } from "@/features/csat/constants"

function getCutoffIndex(mode: ModeType, period: string): number {
  if (mode === "yearly") {
    return MONTHS.length - 1
  }

  if (mode === "quarterly") {
    const quarterOrder = ["Q1", "Q2", "Q3", "Q4"]
    const quarterIndex = quarterOrder.indexOf(period)
    return quarterIndex === -1 ? MONTHS.length - 1 : (quarterIndex + 1) * 3 - 1
  }

  const monthIndex = MONTHS.indexOf(period)
  return monthIndex === -1 ? MONTHS.length - 1 : monthIndex
}

export function getHighlightedMonths(
  mode: ModeType,
  period: string
): string[] {
  if (mode === "yearly") return [...MONTHS]
  if (mode === "quarterly") return QUARTER_MONTHS[period] ?? []
  return [period]
}

export function buildTrendData(
  raw: TrendRaw[],
  mode: ModeType,
  period: string
): TrendRow[] {
  const map: Record<string, { positive_pct: number }> = {}
  const cutoffIndex = getCutoffIndex(mode, period)

  for (const row of raw ?? []) {
    const rawMonth: string =
      row.month ?? row.label ?? row.name ?? row.period ?? ""

    const matched = MONTHS.find(
      (m) =>
        m.toLowerCase() === rawMonth.toLowerCase() ||
        rawMonth.toLowerCase().startsWith(m.toLowerCase())
    )

    if (!matched) continue

    const pct4 = Number(row.pct_4 ?? row.score_4 ?? row.pct4 ?? 0)
    const pct5 = Number(row.pct_5 ?? row.score_5 ?? row.pct5 ?? 0)

    map[matched] = {
      positive_pct: Number(Math.min(100, pct4 + pct5).toFixed(2)),
    }
  }

  return MONTHS.map((m, index) => ({
    month: m,
    positive_pct: index <= cutoffIndex ? map[m]?.positive_pct ?? 0 : 0,
  }))
}

export function barColor(rating: string) {
  const r = Number(rating)

  if (r >= 4) return "#22c55e"
  if (r === 3) return "#f59e0b"

  return "#ef4444"
}
