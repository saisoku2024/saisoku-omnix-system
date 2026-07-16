export function normalizePeriod(mode: "monthly" | "quarterly" | "yearly", period: string) {
  if (mode === "yearly") {
    return "all"
  }

  if (mode === "quarterly") {
    return period.startsWith("Q") ? period : "Q1"
  }

  return period
}

export function buildPeriodQuery(
  mode: "monthly" | "quarterly" | "yearly",
  period: string,
  year: number
) {
  return new URLSearchParams({
    mode,
    period: normalizePeriod(mode, period),
    year: String(year),
  })
}
