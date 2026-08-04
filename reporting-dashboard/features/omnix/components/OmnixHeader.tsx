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
    <header className="relative overflow-hidden rounded-2xl border border-(--c-border) bg-(--c-surface) p-4 sm:p-5 shadow-sm mb-3">
      {/* Google 4-Color Signature Top Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853]" />

      {/* Ambient Glow Orbs */}
      <div className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-[#4285F4]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-[#EA4335]/8 blur-3xl" />

      <div className="relative flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 via-blue-500/10 to-teal-500/20 ring-1 ring-white/10 text-indigo-400 shadow-inner">
              <LayoutGrid size={14} className="text-[#4285F4]" />
            </span>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-sky-400 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-[#4285F4]" />
                <span className="size-1.5 rounded-full bg-[#EA4335]" />
                <span className="size-1.5 rounded-full bg-[#FBBC05]" />
                <span className="size-1.5 rounded-full bg-[#34A853]" />
              </span>
              Monitoring Engine · OMNIX Channel
            </p>
          </div>
          <h1 className="mt-1.5 bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl">
            OMNIX Reporting
          </h1>
          <p className="mt-1 text-xs text-(--c-muted)">
            {subtitle}
          </p>
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
            className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl border border-(--c-border) bg-(--c-control) transition-all hover:border-sky-500/40 hover:text-sky-400"
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </div>
    </header>
  )
}