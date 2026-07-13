"use client"

import React, { useMemo, useState } from "react"

import { useTheme } from "@/contexts/theme-context"
import {
  Phone,
  PhoneCall,
  PhoneMissed,
  Clock,
  TrendingUp,
  Star,
} from "lucide-react"

import Card from "@/shared/ui/Card"

import { MONTHS, QUARTERS } from "@/features/voice/constants"
import { fmt } from "@/features/voice/utils/format"
import { useVoiceData } from "@/features/voice/hooks/useVoiceData"
import type { ModeType } from "@/features/voice/types/voice"

import VoiceHeader from "@/features/voice/components/VoiceHeader"
import CardHeader from "@/features/voice/components/CardHeader"
import KpiCard from "@/features/voice/components/KpiCard"
import ChartSkeleton from "@/features/voice/components/ChartSkeleton"
import EmptyState from "@/features/voice/components/EmptyState"
import AgentLeaderboard from "@/features/voice/components/AgentLeaderboard"

import DailyChart from "@/features/voice/charts/DailyChart"
import HourlyChart from "@/features/voice/charts/HourlyChart"
import ByDayChart from "@/features/voice/charts/ByDayChart"
import { getDefaultMonth, getDefaultYear, REPORT_YEARS } from "@/lib/period-defaults"

// ============================================================
// THEME VARS
// ============================================================

const DARK_VARS: React.CSSProperties = {
  "--c-bg": "#0d1117",
  "--c-surface": "#161b22",
  "--c-control": "#1f242d",
  "--c-border": "rgba(255,255,255,0.08)",
  "--c-text": "#e2e4ea",
  "--c-muted": "#6b7485",
  "--c-skeleton": "#252a35",
  "--c-accent": "#8b5cf6",
} as React.CSSProperties

const LIGHT_VARS: React.CSSProperties = {
  "--c-bg": "#f0f2f5",
  "--c-surface": "#ffffff",
  "--c-control": "#f7f8fa",
  "--c-border": "rgba(0,0,0,0.08)",
  "--c-text": "#1a1d27",
  "--c-muted": "#6b7280",
  "--c-skeleton": "#e5e7eb",
  "--c-accent": "#8b5cf6",
} as React.CSSProperties

// ============================================================
// PAGE
// ============================================================

export default function VoicePage() {
  const { isDark, toggleTheme } = useTheme()

  const [mode, setMode] = useState<ModeType>("monthly")
  const [period, setPeriod] = useState(() => getDefaultMonth(MONTHS))
  const [year, setYear] = useState(() => getDefaultYear(REPORT_YEARS))

  // ✅ Hanya panggil satu kali saja
  const {
    loading,
    error,
    summary,
    daily,
    hourly,
    byDay,
    agentHandling,
    agentAht,
    agentAwt,
  } = useVoiceData(mode, period, year)

  // ✅ Fungsi perbaikan pengganti useEffect
  const handleModeChange = (newMode: ModeType) => {
    setMode(newMode)
    if (newMode === "monthly") setPeriod(getDefaultMonth(MONTHS))
    else if (newMode === "quarterly") setPeriod("Q1")
    else setPeriod("all")
  }

  // ✅ Variabel styling hanya dideklarasikan satu kali
  const cssVars = isDark ? DARK_VARS : LIGHT_VARS
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"
  const tickColor = isDark ? "#6b7485" : "#9ca3af"

  const periodOptions = useMemo(() => {
    if (mode === "monthly") return MONTHS
    if (mode === "quarterly") return QUARTERS
    return []
  }, [mode])

  const KPI_CARDS = useMemo(
    () => [
      { label: "Total Calls", value: fmt(summary?.total_calls || 0), rawValue: summary?.total_calls || 0, color: "#0ea5e9", Icon: Phone },
      { label: "Answered", value: fmt(summary?.answered || 0), rawValue: summary?.answered || 0, color: "#22c55e", Icon: PhoneCall },
      { label: "Abandon", value: fmt(summary?.abandon || 0), rawValue: summary?.abandon || 0, color: "#ef4444", Icon: PhoneMissed },
      { label: "Avg Handling", value: summary?.aht || "0m 0s", color: "#8b5cf6", Icon: Clock },
      { label: "Avg Waiting", value: summary?.awt || "0m 0s", color: "#f59e0b", Icon: TrendingUp },
      { label: "SCR", value: `${summary?.scr || 0}%`, rawValue: summary?.scr || 0, color: "#10b981", Icon: Star },
    ],
    [summary]
  )

  const isDailyEmpty = !loading && (!daily || daily.every((d) => d.count === 0))
  const isHourlyEmpty = !loading && (!hourly || hourly.every((d) => d.count === 0))
  const isByDayEmpty = !loading && (!byDay || byDay.every((d) => d.count === 0))

  return (
    <div
      style={cssVars}
      className="flex min-h-screen flex-col overflow-x-hidden bg-(--c-bg)] font-[Plus_Jakarta_Sans,Inter,sans-serif] text-(--c-text)]"
    >
      <VoiceHeader
        mode={mode}
        period={period}
        year={year}
        periodOptions={periodOptions}
        isDark={isDark}
        onModeChange={handleModeChange}
        onPeriodChange={setPeriod}
        onYearChange={setYear}
        onToggleTheme={toggleTheme}
      />

      <main className="mx-auto flex w-full max-w-350 flex-col gap-3.5 p-5">
        {error && (
          <div className="rounded-[10px] border border-red-500/20 bg-red-500/10 p-3 text-[13px] text-red-500">
            Error: {error}
          </div>
        )}

        {/* KPI: 6 kartu, responsif */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {KPI_CARDS.map((kpi) => (
            <KpiCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              rawValue={kpi.rawValue}
              color={kpi.color}
              Icon={kpi.Icon}
              loading={loading}
            />
          ))}
        </div>

        {/* Daily Chart - full width */}
        <Card>
          <CardHeader
            title="Daily Calls"
            badge={loading ? undefined : "LIVE"}
            extra={
              !loading && (
                <span className="text-[10px] text-(--c-muted)]">
                  Peak day highlighted
                </span>
              )
            }
          />
          <div className="h-75 p-4,5">
            {loading ? (
              <ChartSkeleton bars={31} />
            ) : isDailyEmpty ? (
              <EmptyState message="No daily data for this period" />
            ) : (
              <DailyChart
                data={daily}
                gridColor={gridColor}
                tickColor={tickColor}
                isDark={isDark}
              />
            )}
          </div>
        </Card>

        {/* Hourly + By Day - 2 kolom di lg, stack di mobile */}
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
          <Card>
            <CardHeader title="Calls by Hour" />
            <div className="h-65 p-4,5
          ">
              {loading ? (
                <ChartSkeleton bars={24} />
              ) : isHourlyEmpty ? (
                <EmptyState message="No hourly data" />
              ) : (
                <HourlyChart
                  data={hourly}
                  gridColor={gridColor}
                  tickColor={tickColor}
                  isDark={isDark}
                />
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Calls by Day of Week" />
            <div className="h-65 p-4,5">
              {loading ? (
                <ChartSkeleton bars={7} />
              ) : isByDayEmpty ? (
                <EmptyState message="No weekday data" />
              ) : (
                <ByDayChart
                  data={byDay}
                  gridColor={gridColor}
                  tickColor={tickColor}
                  isDark={isDark}
                />
              )}
            </div>
          </Card>
        </div>

        {/* Agent Leaderboard - DRY, 3x dengan 1 komponen */}
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
          <AgentLeaderboard
            title="Top Call Handling"
            data={agentHandling?.map((a) => ({ agent: a.agent, value: a.total })) || []}
            loading={loading}
            suffix=" calls"
            formatValue={fmt}
            emptyMessage="No handling data"
          />

          <AgentLeaderboard
            title="Avg Handling Time"
            data={agentAht || []}
            loading={loading}
            valueColor="#8b5cf6"
            emptyMessage="No AHT data"
          />

          <AgentLeaderboard
            title="Avg Waiting Time"
            data={agentAwt || []}
            loading={loading}
            valueColor="#f59e0b"
            emptyMessage="No AWT data"
          />
        </div>
      </main>
    </div>
  )
}
