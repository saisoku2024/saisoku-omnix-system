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

function InsightLogo({ size = 28 }: { size?: number }) {
  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 opacity-30 blur-xs" />
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className="relative">
        <rect width="28" height="28" rx="8" fill="url(#logo-grad)" />
        <rect x="7" y="16" width="3" height="6" rx="1.5" fill="white" opacity="0.65" />
        <rect x="12" y="11" width="3" height="11" rx="1.5" fill="white" opacity="0.85" />
        <rect x="17" y="6" width="3" height="16" rx="1.5" fill="white" />
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366f1" />
            <stop offset="1" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
    </div>
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
    <header className="sticky top-0 z-30 flex h-[58px] items-center justify-between gap-3 border-b border-white/8 bg-slate-950/80 px-5 backdrop-blur-xl transition-all duration-300">
      {/* Brand & Live Badge */}
      <div className="flex flex-shrink-0 items-center gap-3">
        <InsightLogo />
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-2">
            <span className="font-heading text-[14px] font-black tracking-widest text-white">
              INSIGHT
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold tracking-wider text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 live-pulse" />
              LIVE
            </span>
          </div>
          <span className="text-[10px] font-medium tracking-wider text-slate-400">
            Omnix System Dashboard
          </span>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/60 p-1.5 backdrop-blur-md shadow-inner">
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