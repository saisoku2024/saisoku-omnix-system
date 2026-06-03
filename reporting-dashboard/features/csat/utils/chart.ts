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
  const map: Record<string, { pct_4: number; pct_5: number }> = {}

  for (const row of raw ?? []) {
    const rawMonth: string =
      row.month ?? row.label ?? row.name ?? row.period ?? ""

    const matched = MONTHS.find(
      (m) =>
        m.toLowerCase() === rawMonth.toLowerCase() ||
        rawMonth.toLowerCase().startsWith(m.toLowerCase())
    )

    if (!matched) continue

    map[matched] = {
      pct_4: Number(row.pct_4 ?? row.score_4 ?? row.pct4 ?? 0),
      pct_5: Number(row.pct_5 ?? row.score_5 ?? row.pct5 ?? 0),
    }
  }

  return MONTHS.map((m) => ({
    month: m,
    pct_4: map[m]?.pct_4 ?? 0,
    pct_5: map[m]?.pct_5 ?? 0,
  }))
}

export function barColor(rating: string) {
  const r = Number(rating)

  if (r >= 4) return "#22c55e"
  if (r === 3) return "#f59e0b"

  return "#ef4444"
}