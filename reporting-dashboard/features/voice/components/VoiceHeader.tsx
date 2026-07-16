"use client"

import React from "react"
import { Phone, Sun, Moon } from "lucide-react"

import PeriodDropdown from "@/features/voice/components/PeriodDropdown"
import type { ModeType } from "@/features/voice/types/voice"

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

export default function VoiceHeader({
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
    <header className="header-content sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-(--c-border) bg-(--c-surface) px-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[rgba(139,92,246,0.12)]">
          <Phone size={15} color="#8b5cf6" />
        </span>
        <div className="leading-[1.2]">
          <div className="text-[13px] font-extrabold">Voice Monitoring</div>
          <div className="text-[10px] text-(--c-muted)">{subtitle}</div>
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
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-(--c-border) bg-(--c-control) transition-colors hover:border-(--c-accent)"
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </header>
  )
}