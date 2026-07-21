const REPORT_YEARS = [2024, 2025, 2026] as const

export function getDefaultMonth(months: readonly string[]) {
  return months[new Date().getMonth()] ?? months[0] ?? "Jan"
}

export function getDefaultYear(years: readonly number[] = REPORT_YEARS) {
  const currentYear = new Date().getFullYear()
  return years.includes(currentYear) ? currentYear : Math.max(...years)
}

export { REPORT_YEARS }
