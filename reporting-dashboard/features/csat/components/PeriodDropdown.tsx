import { SPACING } from "@/features/csat/constants"

export default function PeriodDropdown({
  options,
  value,
  onChange,
  isDark,
  width,
}: {
  options: string[]
  value: string
  onChange: (value: string) => void
  isDark: boolean
  width?: number | string
}) {
  const chevronColor = isDark ? "%23e2e4ea" : "%231a1d27"

  const chevronSvg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='${chevronColor}' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        height: SPACING.controlHeight,
        width,
        padding: "0 28px 0 12px",
        borderRadius: 8,
        border: "1px solid var(--c-border)",
        background: `var(--c-control) ${chevronSvg} no-repeat right 10px center`,
        color: "var(--c-text)",
        fontSize: 11,
        fontWeight: 600,
        appearance: "none",
        cursor: "pointer",
        outline: "none",
      }}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}