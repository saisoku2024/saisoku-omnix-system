"use client"

import React from "react"

type Props = {
  options: string[]
  value: string
  onChange: (v: string) => void
  isDark: boolean
}

export default function PeriodDropdown({
  options,
  value,
  onChange,
  isDark,
}: Props) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer appearance-none rounded-[9px] border bg-transparent py-1 pl-3 pr-7 text-[11px] font-semibold tracking-wide outline-none transition-all"
        style={{
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
          background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
          color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.65)",
        }}
      >
        {options.map((p) => (
          <option
            key={p}
            value={p}
            style={{
              background: isDark ? "#161b22" : "#fff",
              color: isDark ? "#e2e4ea" : "#1a1d27",
            }}
          >
            {p}
          </option>
        ))}
      </select>

      <svg
        width="10"
        height="10"
        viewBox="0 0 12 12"
        fill="none"
        className="pointer-events-none absolute right-2"
        style={{
          color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
        }}
      >
        <path
          d="M2 4l4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}