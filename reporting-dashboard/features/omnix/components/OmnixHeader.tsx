"use client"

import React from "react"
import { LayoutGrid, Sun, Moon } from "lucide-react"

import PeriodDropdown from "@/features/omnix/components/PeriodDropdown"
import type { ModeType } from "@/features/omnix/types/omnix"

type Props = {
  mode: ModeType
  period: string
  year: number
  periodOptions: string[]
  isDark: boolean
  onModeChange: (mode: ModeType) => void
  onPeriodChange: (period: string) => void
  onYearChange: (year: number) => void
  onToggleTheme: () => void
}

const MODE_OPTIONS = ["Monthly", "Quarterly", "Yearly"]
const YEAR_OPTIONS = ["2024", "2025", "2026"]

export default function OmnixHeader({
  mode,
  period,
  year,
  periodOptions,
  isDark,
  onModeChange,
  onPeriodChange,
  onYearChange,
  onToggleTheme,
}: Props) {
  const subtitle = mode === "yearly" ? `Full Year ${year}` : `${period} - ${year}`
  const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1)

  return (
    <header className="header-content sticky top-0 z-30 flex h-[60px] items-center justify-between gap-3 border-b border-(--c-border) bg-(--c-surface) px-5">
      <div className="flex flex-shrink-0 items-center gap-2.5">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px] bg-[rgba(99,102,241,0.12)]">
          <LayoutGrid size={15} color="#6366f1" />
        </span>

        <div className="flex flex-col leading-[1.2]">
          <span className="text-[13px] font-extrabold tracking-wide text-(--c-text)">
            OMNIX Reporting
          </span>
          <span className="mt-0.5 text-[10px] text-(--c-muted)">
            {subtitle}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <PeriodDropdown
          options={MODE_OPTIONS}
          value={modeLabel}
          onChange={(v) => onModeChange(v.toLowerCase() as ModeType)}
          isDark={isDark}
          width={110}
        />

        {mode !== "yearly" && (
          <PeriodDropdown
            options={periodOptions}
            value={period}
            onChange={onPeriodChange}
            isDark={isDark}
            width={90}
          />
        )}

        <PeriodDropdown
          options={YEAR_OPTIONS}
          value={String(year)}
          onChange={(v) => onYearChange(Number(v))}
          isDark={isDark}
          width={84}
        />

        <button
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          title="Toggle dark mode"
          className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border border-(--c-border) bg-(--c-control) transition-colors hover:border-(--c-accent)"
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </header>
  )
}