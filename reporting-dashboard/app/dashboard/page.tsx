"use client"

import React, { useMemo, useState } from "react"

import { useTheme } from "@/contexts/theme-context"

import Card from "@/shared/ui/Card"

import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData"
import type {
  ModeType,
  StatsData,
} from "@/features/dashboard/types/dashboard"

import {
  MONTHS,
  QUARTERS,
  KPI_CONFIG,
} from "@/features/dashboard/constants"

import DashboardHeader from "@/features/dashboard/components/DashboardHeader"
import CustomerSummaryBar from "@/features/dashboard/components/CustomerSummaryBar"
import CardHeader from "@/features/dashboard/components/CardHeader"
import KpiCard from "@/features/dashboard/components/KpiCard"
import Spinner from "@/features/dashboard/components/Spinner"
import EmptyState from "@/features/dashboard/components/EmptyState"
import BarListSkeleton from "@/features/dashboard/components/BarListSkeleton"
import BarList from "@/features/dashboard/components/BarList"
import BrandList from "@/features/dashboard/components/BrandList"
import ChannelBreakdown from "@/features/dashboard/components/ChannelBreakdown"
import FooterBrand from "@/features/dashboard/components/FooterBrand"
import RealtimeClock from "@/features/dashboard/components/RealtimeClock"

import TrendChart from "@/features/dashboard/charts/TrendChart"

// ============================================================
// THEME VARS
// ============================================================

const DARK_VARS: React.CSSProperties = {
  "--c-bg": "#0d1117",
  "--c-surface": "#161b22",
  "--c-offset": "#1f2430",
  "--c-border": "rgba(255,255,255,0.07)",
  "--c-text": "#e2e4ea",
  "--c-muted": "#6b7485",
  "--c-skeleton": "#252a35",
  "--c-accent": "#0ea5e9",
} as React.CSSProperties

const LIGHT_VARS: React.CSSProperties = {
  "--c-bg": "#f0f2f5",
  "--c-surface": "#ffffff",
  "--c-offset": "#f6f8fa",
  "--c-border": "rgba(0,0,0,0.07)",
  "--c-text": "#1a1d27",
  "--c-muted": "#6b7280",
  "--c-skeleton": "#e5e7eb",
  "--c-accent": "#0ea5e9",
} as React.CSSProperties

export default function DashboardPage() {
  const { isDark, toggleTheme } = useTheme()

  const [mode, setMode] = useState<ModeType>("monthly")
  const [period, setPeriod] = useState("Jan")
  const [year, setYear] = useState(2026)

  const {
    loading,
    stats,
    trendData,
    channelPie,
    category,
    brand,
    customer,
    newCustomer,
  } = useDashboardData(mode, period, year)

  const cssVars = isDark ? DARK_VARS : LIGHT_VARS

  const periodOptions = useMemo(
    () => (mode === "monthly" ? MONTHS : QUARTERS),
    [mode]
  )

  const handleModeChange = (v: string) => {
    const m = v.toLowerCase() as ModeType
    setMode(m)
    setPeriod(m === "yearly" ? "all" : m === "quarterly" ? "Q1" : "Jan")
  }

  const periodLabel = mode !== "yearly" ? `${period} ${year}` : String(year)

  return (
    <div
      style={cssVars}
      className="flex min-h-screen flex-col overflow-hidden bg-(--c-bg) font-[Plus_Jakarta_Sans,Inter,sans-serif] text-(--c-text) transition-colors"
    >
      <DashboardHeader
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

      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-3 overflow-y-auto p-4 md:p-6 pb-12">
        {/* PREMIUM HEADER */}
        <div className="mb-1 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* LEFT */}
            <div>
              <div className="text-[18px] font-extrabold tracking-tighter text-(--c-text)">
                Good Afternoon, Admin 👋
              </div>
              <div className="mt-0.5 text-[10px] sm:text-[11px] text-(--c-muted)">
                Monitor Customer Support Analytics & Operational Performance
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/2 px-4 py-2.5 backdrop-blur-xl">
              {/* LIVE STATUS */}
              <div className="flex items-center gap-2.5">
                <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.9)] animate-pulse" />
                <div className="flex flex-col leading-none">
                  <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-(--c-muted)">
                    System Status
                  </span>
                  <span className="mt-1 text-[12px] font-bold text-emerald-400">
                    Operational
                  </span>
                </div>
              </div>

              {/* DIVIDER */}
              <div className="h-7 w-px bg-white/10" />

              {/* REALTIME CLOCK */}
              <RealtimeClock />
            </div>
          </div>

          {/* SEPARATOR */}
          <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-black/10 dark:via-white/10 to-transparent" />
        </div>

        {/* CUSTOMER SUMMARY */}
        <div className="shrink-0">
          <CustomerSummaryBar
            customer={customer}
            newCustomer={newCustomer}
            periodLabel={periodLabel}
          />
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 shrink-0">
          {KPI_CONFIG.map((kpi) => (
            <KpiCard
              key={kpi.key}
              label={kpi.label}
              value={stats[kpi.key as keyof StatsData]}
              Icon={kpi.icon}
              color={kpi.color}
              loading={loading}
            />
          ))}
        </div>

        {/* TREND CHART */}
        <Card className="shrink-0">
          <CardHeader title="Ticket Volume Trend" badge="DAILY" />
          <div className="h-[280px] p-4">
            {loading ? (
              <Spinner height={240} />
            ) : trendData.length === 0 ? (
              <EmptyState message="Tidak ada data" height={240} />
            ) : (
              <TrendChart data={trendData} mode={mode} isDark={isDark} />
            )}
          </div>
        </Card>

        {/* LOWER SECTION */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 shrink-0">
          {/* CHANNEL */}
          <Card>
            <CardHeader title="Channel" />
            <div className="p-4">
              {loading ? (
                <BarListSkeleton rows={5} />
              ) : channelPie.length === 0 ? (
                <EmptyState />
              ) : (
                <ChannelBreakdown data={channelPie} />
              )}
            </div>
          </Card>

          {/* CATEGORY */}
          <Card>
            <CardHeader title="Category" />
            <div className="p-4">
              {loading ? (
                <BarListSkeleton rows={6} />
              ) : category.length === 0 ? (
                <EmptyState />
              ) : (
                <BarList items={category} />
              )}
            </div>
          </Card>

          {/* BRAND */}
          <Card>
            <CardHeader title="Brand" />
            <div className="p-4">
              {loading ? (
                <BarListSkeleton rows={6} />
              ) : brand.length === 0 ? (
                <EmptyState />
              ) : (
                <BrandList items={brand} />
              )}
            </div>
          </Card>
        </div>
      </main>

      <FooterBrand isDark={isDark} />
    </div>
  )
}