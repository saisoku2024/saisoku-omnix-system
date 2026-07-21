"use client"

import React from "react"

type Props = {
  options: string[]
  value: string
  onChange: (value: string) => void
  isDark: boolean
  width?: number
}

export default function PeriodDropdown({
  options,
  value,
  onChange,
  isDark,
  width,
}: Props) {
  const chevronColor = isDark ? "%23e2e4ea" : "%231a1d27"
  const chevronSvg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='${chevronColor}' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        backgroundImage: chevronSvg,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 10px center",
        width,
      }}
      className="h-8 cursor-pointer appearance-none rounded-lg border border-(--c-border) bg-(--c-control) py-0 pl-3 pr-7 text-[11px] font-semibold text-(--c-text) outline-none transition-colors focus:border-(--c-accent)"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}