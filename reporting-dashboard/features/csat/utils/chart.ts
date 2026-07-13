import type { ModeType, TrendRaw, TrendRow } from "@/features/csat/types/csat"
import { MONTHS, QUARTER_MONTHS } from "@/features/csat/constants"

export function getHighlightedMonths(
  mode: ModeType,
  period: string
): string[] {
  if (mode === "yearly") return [...MONTHS]
  if (mode === "quarterly") return QUARTER_MONTHS[period] ?? []
  return [period]
}

export function buildTrendData(raw: TrendRaw[]): TrendRow[] {
  const map: Record<string, { positive_pct: number }> = {}

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

  return MONTHS.map((m) => ({
    month: m,
    positive_pct: map[m]?.positive_pct ?? 0,
  }))
}

export function barColor(rating: string) {
  const r = Number(rating)

  if (r >= 4) return "#22c55e"
  if (r === 3) return "#f59e0b"

  return "#ef4444"
}
