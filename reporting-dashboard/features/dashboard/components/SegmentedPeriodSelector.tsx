"use client"

import React, { useRef } from "react"
import { animate } from "animejs"
import { ChevronDown } from "lucide-react"
import type { ModeType } from "@/features/dashboard/types/dashboard"
import { REPORT_YEARS } from "@/lib/period-defaults"

interface Props {
  mode: ModeType
  period: string
  year: number
  periodOptions: string[]
  onModeChange: (v: string) => void
  onPeriodChange: (v: string) => void
  onYearChange: (v: number) => void
}

const MODES: { label: string; value: ModeType }[] = [
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
  { label: "Yearly", value: "yearly" },
]

export default function SegmentedPeriodSelector({
  mode,
  period,
  year,
  periodOptions,
  onModeChange,
  onPeriodChange,
  onYearChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleModeClick = (newMode: ModeType, e: React.MouseEvent<HTMLButtonElement>) => {
    if (newMode === mode) return

    // Quick Anime.js micro bounce on the clicked button
    animate(e.currentTarget, {
      scale: [0.94, 1],
      duration: 260,
      ease: "outBack(overshoot = 2.0)",
    })

    onModeChange(newMode)
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-white/10 bg-slate-900/80 p-1 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.3)] transition-all duration-300"
    >
      {/* UI.live Style Segmented Pill Buttons */}
      <div className="flex items-center rounded-xl bg-slate-950/60 p-0.5 ring-1 ring-white/5">
        {MODES.map((item) => {
          const isActive = mode === item.value
          return (
            <button
              key={item.value}
              type="button"
              onClick={(e) => handleModeClick(item.value, e)}
              className={`relative rounded-lg px-3 py-1 text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer select-none ${
                isActive
                  ? "bg-gradient-to-r from-sky-500/25 to-blue-500/25 text-sky-300 shadow-[0_0_12px_rgba(14,165,233,0.3)] ring-1 ring-sky-500/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {/* Period Dropdown (Month or Quarter) if not Yearly */}
      {mode !== "yearly" && (
        <div className="relative flex items-center">
          <select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value)}
            className="appearance-none rounded-xl border border-white/10 bg-slate-950/60 pl-3 pr-7 py-1 text-xs font-semibold text-sky-200 outline-none hover:border-sky-500/40 focus:border-sky-500 transition-colors cursor-pointer"
          >
            {periodOptions.map((p) => (
              <option key={p} value={p} className="bg-slate-900 text-white">
                {p}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-slate-400" />
        </div>
      )}

      {/* Year Selector */}
      <div className="relative flex items-center">
        <select
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="appearance-none rounded-xl border border-white/10 bg-slate-950/60 pl-3 pr-7 py-1 text-xs font-semibold text-slate-200 outline-none hover:border-sky-500/40 focus:border-sky-500 transition-colors cursor-pointer"
        >
          {REPORT_YEARS.map((y) => (
            <option key={y} value={y} className="bg-slate-900 text-white">
              {y}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-slate-400" />
      </div>
    </div>
  )
}
