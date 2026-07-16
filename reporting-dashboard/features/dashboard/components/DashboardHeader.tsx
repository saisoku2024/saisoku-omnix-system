"use client"

import React from "react"

import PeriodDropdown from "@/features/dashboard/components/PeriodDropdown"
import ThemeToggle from "@/features/dashboard/components/ThemeToggle"
import VDivider from "@/features/dashboard/components/VDivider"
import { modeLabel } from "@/features/dashboard/utils/format"
import type { ModeType } from "@/features/dashboard/types/dashboard"

type Props = {
  mode: ModeType
  period: string
  year: number
  periodOptions: string[]
  isDark: boolean
  onModeChange: (v: string) => void
  onPeriodChange: (v: string) => void
  onYearChange: (v: number) => void
  onToggleTheme: () => void
}

const MODE_OPTIONS = ["Monthly", "Quarterly", "Yearly"]
const YEAR_OPTIONS = ["2024", "2025", "2026"]

function InsightLogo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill="#0ea5e9" />
      <rect x="7"  y="16" width="3" height="6"  rx="1.5" fill="white" opacity="0.55" />
      <rect x="12" y="11" width="3" height="11" rx="1.5" fill="white" opacity="0.78" />
      <rect x="17" y="6"  width="3" height="16" rx="1.5" fill="white" />
    </svg>
  )
}

export default function DashboardHeader({
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
  return (
    <header className="sticky top-0 z-30 flex h-[54px] items-center justify-between gap-3 border-b border-(--c-border) bg-(--c-surface) px-5">
      <div className="flex flex-shrink-0 items-center gap-2.5">
        <InsightLogo />
        <div className="flex flex-col leading-none">
          <span className="text-[13px] font-extrabold tracking-widest text-(--c-text)">
            INSIGHT
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-(--c-muted)">
            Dashboard
          </span>
        </div>
      </div>

      <div
        className="flex flex-wrap items-center gap-1.5 rounded-xl border px-2.5 py-1.5"
        style={{
          background: isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.025)",
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
        }}
      >
        <PeriodDropdown
          options={MODE_OPTIONS}
          value={modeLabel(mode)}
          onChange={onModeChange}
          isDark={isDark}
        />

        {mode !== "yearly" && (
          <>
            <VDivider />
            <PeriodDropdown
              options={periodOptions}
              value={period}
              onChange={onPeriodChange}
              isDark={isDark}
            />
          </>
        )}

        <VDivider />

        <PeriodDropdown
          options={YEAR_OPTIONS}
          value={String(year)}
          onChange={(v) => onYearChange(Number(v))}
          isDark={isDark}
        />

        <VDivider />

        <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
      </div>
    </header>
  )
}