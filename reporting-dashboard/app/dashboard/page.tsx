"use client"

import React, { useMemo, useState } from "react"
import { useTheme } from "@/providers/theme-provider"
import { AlertCircle, BarChart3, Sun, Moon } from "lucide-react"
import Card from "@/components/ui/card"
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData"
import type { ModeType, StatsData } from "@/features/dashboard/types/dashboard"
import { MONTHS, QUARTERS, KPI_CONFIG, getHighlightedMonths } from "@/features/dashboard/constants"
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
import { getDefaultMonth, getDefaultYear, REPORT_YEARS } from "@/lib/period-defaults"

const DARK_VARS: React.CSSProperties = { "--c-bg": "#0d1117", "--c-surface": "#161b22", "--c-offset": "#1f2430", "--c-border": "rgba(255,255,255,0.07)", "--c-text": "#e2e4ea", "--c-muted": "#6b7485", "--c-skeleton": "#252a35", "--c-accent": "#0ea5e9" } as React.CSSProperties
const LIGHT_VARS: React.CSSProperties = { "--c-bg": "#f0f2f5", "--c-surface": "#ffffff", "--c-offset": "#f6f8fa", "--c-border": "rgba(0,0,0,0.07)", "--c-text": "#1a1d27", "--c-muted": "#6b7280", "--c-skeleton": "#e5e7eb", "--c-accent": "#0ea5e9" } as React.CSSProperties



export default function DashboardPage() {
  const { isDark, toggleTheme } = useTheme()
  const [mode, setMode] = useState<ModeType>("monthly")
  const [period, setPeriod] = useState(() => getDefaultMonth(MONTHS))
  const [year, setYear] = useState(() => getDefaultYear(REPORT_YEARS))
  const { loading, error, stats, trendData, channelPie, category, brand, customer, newCustomer } = useDashboardData(mode, period, year)
  const cssVars = isDark ? DARK_VARS : LIGHT_VARS
  
  const periodOptions = useMemo(() => (mode === "monthly" ? MONTHS : QUARTERS), [mode])
  const highlightedMonths = useMemo(() => getHighlightedMonths(mode, period), [mode, period])
  const handleModeChange = (v: string) => {
    const m = v.toLowerCase() as ModeType
    setMode(m)
    setPeriod(m === "yearly" ? "all" : m === "quarterly" ? "Q1" : getDefaultMonth(MONTHS))
  }
  const periodLabel = mode !== "yearly" ? `${period} ${year}` : String(year)

  return (
    <div style={cssVars} className="flex min-h-screen flex-col overflow-hidden bg-(--c-bg) font-[Plus_Jakarta_Sans,Inter,sans-serif] text-(--c-text) transition-colors">
      <main className="mx-auto flex w-full max-w-[1600] flex-1 flex-col gap-3 overflow-y-auto p-4 md:p-6 pb-12">
        
        {/* HEADER — AI Workspace Visual System */}
        <header className="relative overflow-hidden rounded-2xl border border-(--c-border) bg-(--c-surface) p-4 sm:p-5 shadow-sm shrink-0">
          {/* Google 4-Color Signature Top Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853]" />

          {/* Ambient Glow Orbs */}
          <div className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-[#4285F4]/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-[#EA4335]/8 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 -bottom-20 size-80 rounded-full bg-[#34A853]/8 blur-3xl" />

          <div className="relative flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 via-red-500/10 to-emerald-500/20 ring-1 ring-white/10 text-sky-400 shadow-inner">
                  <BarChart3 className="h-3.5 w-3.5 text-[#4285F4]" />
                </span>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-sky-400 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-[#4285F4]" />
                    <span className="size-1.5 rounded-full bg-[#EA4335]" />
                    <span className="size-1.5 rounded-full bg-[#FBBC05]" />
                    <span className="size-1.5 rounded-full bg-[#34A853]" />
                  </span>
                  Executive Insight Dashboard
                </p>
              </div>
              <h1 className="mt-1.5 bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl">
                Operational Analytics Overview
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 text-[11px] rounded-full border border-emerald-500/20 bg-emerald-500/8 px-3 py-1 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold">Operational</span>
                <span className="text-(--c-muted)">·</span>
                <span className="tabular-nums font-mono"><RealtimeClock /></span>
              </div>

              <div className="flex items-center overflow-hidden rounded-xl border border-(--c-border) bg-(--c-overlay) p-0.5 shadow-sm">
                <select value={mode} onChange={(e) => handleModeChange(e.target.value)} className="bg-transparent px-2.5 py-1 text-xs font-semibold text-(--c-text) outline-none cursor-pointer">
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
                {mode !== "yearly" && (
                  <select value={period} onChange={(e) => setPeriod(e.target.value)} className="border-l border-(--c-border) bg-transparent px-2.5 py-1 text-xs font-semibold text-(--c-text) outline-none cursor-pointer">
                    {periodOptions.map((p) => (<option key={p} value={p}>{p}</option>))}
                  </select>
                )}
                <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="border-l border-(--c-border) bg-transparent px-2.5 py-1 text-xs font-semibold text-(--c-text) outline-none cursor-pointer">
                  {REPORT_YEARS.map((y) => (<option key={y} value={y}>{y}</option>))}
                </select>
              </div>

              <button onClick={toggleTheme} aria-label="Toggle theme" className="flex h-8 w-8 items-center justify-center rounded-xl border border-(--c-border) bg-(--c-overlay) text-(--c-muted) transition-all hover:border-sky-500/40 hover:text-sky-400">
                {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="flex shrink-0 items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="min-w-0 break-words">
              Dashboard gagal memuat data: {error}
            </span>
          </div>
        )}

        <div className="shrink-0"><CustomerSummaryBar customer={customer} newCustomer={newCustomer} periodLabel={periodLabel} /></div>
        
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 shrink-0">
          {KPI_CONFIG.map((kpi) => (<KpiCard key={kpi.key} label={kpi.label} value={stats[kpi.key as keyof StatsData]} Icon={kpi.icon} color={kpi.color} loading={loading} />))}
        </div>
        
        <Card className="shrink-0 w-full">
          <CardHeader title="Ticket Volume Trend" badge="DAILY" />
          <div className="h-[240px] p-4">
            {loading ? (<Spinner height={240} />) : trendData.length === 0 ? (<EmptyState message="Tidak ada data" height={240} />) : (<TrendChart data={trendData} mode={mode} highlightedMonths={mode === "monthly" ? [] : highlightedMonths} isDark={isDark} />)}
          </div>
        </Card>
        
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 shrink-0">
          <Card><CardHeader title="Channel" /><div className="p-4">{loading ? (<BarListSkeleton rows={5} />) : channelPie.length === 0 ? (<EmptyState />) : (<ChannelBreakdown data={channelPie} />)}</div></Card>
          <Card><CardHeader title="Category" /><div className="p-4">{loading ? (<BarListSkeleton rows={6} />) : category.length === 0 ? (<EmptyState />) : (<BarList items={category} />)}</div></Card>
          <Card><CardHeader title="Product" /><div className="p-4">{loading ? (<BarListSkeleton rows={6} />) : brand.length === 0 ? (<EmptyState message="Tidak ada data produk" />) : (<BarList items={brand} />)}</div></Card>
        </div>

      </main>
      <FooterBrand isDark={isDark} />
    </div>
  )
}
