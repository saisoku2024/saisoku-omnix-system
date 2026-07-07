"use client"

import React, { useMemo, useState } from "react"
import { useTheme } from "@/contexts/theme-context"
import { BarChart3, Sun, Moon } from "lucide-react"
import Card from "@/shared/ui/Card"
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData"
import type { ModeType, StatsData } from "@/features/dashboard/types/dashboard"
import { MONTHS, QUARTERS, KPI_CONFIG } from "@/features/dashboard/constants"
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

const DARK_VARS: React.CSSProperties = { "--c-bg": "#0d1117", "--c-surface": "#161b22", "--c-offset": "#1f2430", "--c-border": "rgba(255,255,255,0.07)", "--c-text": "#e2e4ea", "--c-muted": "#6b7485", "--c-skeleton": "#252a35", "--c-accent": "#0ea5e9" } as React.CSSProperties
const LIGHT_VARS: React.CSSProperties = { "--c-bg": "#f0f2f5", "--c-surface": "#ffffff", "--c-offset": "#f6f8fa", "--c-border": "rgba(0,0,0,0.07)", "--c-text": "#1a1d27", "--c-muted": "#6b7280", "--c-skeleton": "#e5e7eb", "--c-accent": "#0ea5e9" } as React.CSSProperties

export default function DashboardPage() {
  const { isDark, toggleTheme } = useTheme()
  const [mode, setMode] = useState<ModeType>("monthly")
  const [period, setPeriod] = useState("Jan")
  const [year, setYear] = useState(2026)
  const { loading, stats, trendData, channelPie, category, brand, customer, newCustomer } = useDashboardData(mode, period, year)
  const cssVars = isDark ? DARK_VARS : LIGHT_VARS
  const periodOptions = useMemo(() => (mode === "monthly" ? MONTHS : QUARTERS), [mode])
  const handleModeChange = (v: string) => {
    const m = v.toLowerCase() as ModeType
    setMode(m)
    setPeriod(m === "yearly" ? "all" : m === "quarterly" ? "Q1" : "Jan")
  }
  const periodLabel = mode !== "yearly" ? `${period} ${year}` : String(year)

  return (
    <div style={cssVars} className="flex min-h-screen flex-col overflow-hidden bg-(--c-bg) font-[Plus_Jakarta_Sans,Inter,sans-serif] text-(--c-text) transition-colors">
      <main className="mx-auto flex w-full max-w-[1600] flex-1 flex-col gap-3 overflow-y-auto p-4 md:p-6 pb-12">
        
        {/* HEADER — compact 2 rows */}
        <div className="shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sky-500"><BarChart3 className="h-4 w-4 text-white" /></div>
              <span className="truncate text-[14px] font-medium text-(--c-text)">Good Afternoon, Admin</span>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="font-medium text-emerald-400">Operational</span>
              <span className="text-(--c-muted)">·</span>
              <span className="tabular-nums text-(--c-muted)"><RealtimeClock /></span>
            </div>
          </div>
          <div className="my-2.5 h-px w-full bg-(--c-border)" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] font-medium tracking-[0.12em] text-(--c-muted)">INSIGHT DASHBOARD</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center overflow-hidden rounded-md border border-(--c-border) bg-(--c-surface)">
                <select value={mode} onChange={(e) => handleModeChange(e.target.value)} className="border-r border-(--c-border) bg-transparent px-2.5 py-1.5 text-[11px] font-medium text-(--c-text) outline-none">
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
                {mode !== "yearly" && (
                  <select value={period} onChange={(e) => setPeriod(e.target.value)} className="border-r border-(--c-border) bg-transparent px-2.5 py-1.5 text-[11px] font-medium text-(--c-text) outline-none">
                    {periodOptions.map((p) => (<option key={p} value={p}>{p}</option>))}
                  </select>
                )}
                <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-transparent px-2.5 py-1.5 text-[11px] font-medium text-(--c-text) outline-none">
                  {[2024, 2025, 2026].map((y) => (<option key={y} value={y}>{y}</option>))}
                </select>
              </div>
              <button onClick={toggleTheme} aria-label="Toggle theme" className="flex h-7 w-7 items-center justify-center rounded-md border border-(--c-border) bg-(--c-surface) text-(--c-muted)">
                {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="shrink-0"><CustomerSummaryBar customer={customer} newCustomer={newCustomer} periodLabel={periodLabel} /></div>
        
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 shrink-0">
          {KPI_CONFIG.map((kpi) => (<KpiCard key={kpi.key} label={kpi.label} value={stats[kpi.key as keyof StatsData]} Icon={kpi.icon} color={kpi.color} loading={loading} />))}
        </div>
        
        <Card className="shrink-0 w-full">
          <CardHeader title="Ticket Volume Trend" badge="DAILY" />
          <div className="h-[240px] p-4">
            {loading ? (<Spinner height={240} />) : trendData.length === 0 ? (<EmptyState message="Tidak ada data" height={240} />) : (<TrendChart data={trendData} mode={mode} isDark={isDark} />)}
          </div>
        </Card>
        
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 shrink-0">
          <Card><CardHeader title="Channel" /><div className="p-4">{loading ? (<BarListSkeleton rows={5} />) : channelPie.length === 0 ? (<EmptyState />) : (<ChannelBreakdown data={channelPie} />)}</div></Card>
          <Card><CardHeader title="Category" /><div className="p-4">{loading ? (<BarListSkeleton rows={6} />) : category.length === 0 ? (<EmptyState />) : (<BarList items={category} />)}</div></Card>
          <Card><CardHeader title="Brand" /><div className="p-4">{loading ? (<BarListSkeleton rows={6} />) : brand.length === 0 ? (<EmptyState />) : (<BrandList items={brand} />)}</div></Card>
        </div>

      </main>
      <FooterBrand isDark={isDark} />
    </div>
  )
}