"use client"

import React, { useEffect, useMemo, useState } from "react"

import { useTheme } from "@/providers/theme-provider"
import {
  TicketCheck,
  Clock,
  PhoneCall,
  TrendingUp,
} from "lucide-react"

import Card from "@/components/ui/card"

import { MONTHS, QUARTERS, QUARTER_MONTHS } from "@/features/omnix/constants"
import { fmt } from "@/features/omnix/utils/format"
import { useOmnixData } from "@/features/omnix/hooks/useOmnixData"
import type { ModeType } from "@/features/omnix/types/omnix"

import OmnixHeader from "@/features/omnix/components/OmnixHeader"
import CardHeader from "@/features/omnix/components/CardHeader"
import KpiCard from "@/features/omnix/components/KpiCard"
import ChartSkeleton from "@/features/omnix/components/ChartSkeleton"
import DonutSkeleton from "@/features/omnix/components/DonutSkeleton"
import BarListSkeleton from "@/features/omnix/components/BarListSkeleton"
import EmptyState from "@/features/omnix/components/EmptyState"
import BarList from "@/features/omnix/components/BarList"
import ChannelBreakdown from "@/features/omnix/components/ChannelBreakdown"

import TrendChart from "@/features/omnix/charts/TrendChart"
import CustomerBarChart from "@/features/omnix/charts/CustomerBarChart"
import NewCustomerBarChart from "@/features/omnix/charts/NewCustomerBarChart"
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
  "--c-accent": "#6366f1",
} as React.CSSProperties

const LIGHT_VARS: React.CSSProperties = {
  "--c-bg": "#f0f2f5",
  "--c-surface": "#ffffff",
  "--c-control": "#f7f8fa",
  "--c-border": "rgba(0,0,0,0.08)",
  "--c-text": "#1a1d27",
  "--c-muted": "#6b7280",
  "--c-skeleton": "#e5e7eb",
  "--c-accent": "#6366f1",
} as React.CSSProperties

// ============================================================
// HELPER FOR HIGHLIGHTING
// ============================================================
function getHighlightedMonths(mode: string, period: string): string[] {
  if (mode === "monthly") {
    return [period]
  }
  if (mode === "quarterly") {
    return QUARTER_MONTHS[period] ?? []
  }
  return []
}

// ============================================================
// PAGE
// ============================================================

export default function OmnixPage() {
  const { isDark, toggleTheme } = useTheme()

  const [mode, setMode] = useState<ModeType>("monthly")
  const [period, setPeriod] = useState(() => getDefaultMonth(MONTHS))
  const [year, setYear] = useState(() => getDefaultYear(REPORT_YEARS))

  const handleModeChange = (newMode: ModeType) => {
    setMode(newMode)
    if (newMode === "monthly") setPeriod(getDefaultMonth(MONTHS))
    else if (newMode === "quarterly") setPeriod("Q1")
    else setPeriod("all")
  }

  const {
    loading,
    error,
    summary,
    trend,
    channel,
    category,
    product,
    customer,
  } = useOmnixData(mode, period, year)

  const highlightedMonths = useMemo(
    () => getHighlightedMonths(mode, period),
    [mode, period]
  )

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
      {
        label: "Total Ticket",
        value:
          summary && typeof summary.total_ticket === "number"
            ? fmt(summary.total_ticket)
            : "0",
        rawValue: summary?.total_ticket ?? 0,
        color: "#0ea5e9",
        Icon: TicketCheck,
      },
      {
        label: "Avg Handle Time",
        value: summary?.aht ?? "0m 0s",
        color: "#8b5cf6",
        Icon: Clock,
      },
      {
        label: "Avg Response Time",
        value: summary?.art ?? "0m 0s",
        color: "#f59e0b",
        Icon: PhoneCall,
      },
      {
        label: "Avg Wait Time",
        value: summary?.awt ?? "0m 0s",
        color: "#10b981",
        Icon: TrendingUp,
      },
    ],
    [summary]
  )

  const isTrendEmpty = !loading && (!trend || trend.every((d) => d.count === 0))
  const isChannelEmpty = !loading && (!channel || channel.length === 0)
  const isCategoryEmpty = !loading && (!category || category.length === 0)
  const isProductEmpty = !loading && (!product || product.length === 0)
  const hasCustomer = !loading && customer && customer.length > 0

  return (
    <div
      style={cssVars}
      className="flex min-h-screen flex-col overflow-x-hidden bg-(--c-bg) font-[Plus_Jakarta_Sans,Inter,sans-serif] text-(--c-text) transition-colors"
    >
      <OmnixHeader
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

      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-3 p-5">
        {error && (
          <div className="rounded-[10px] border border-red-500/20 bg-red-500/10 p-3 text-[13px] font-semibold text-red-500">
            Failed to fetch data: {error}
          </div>
        )}

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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

        {/* INTERACTION TREND */}
        <Card>
          <CardHeader
            title="Interaction Trend"
            badge={loading ? undefined : "LIVE"}
            extra={
              !loading && (
                <span className="text-[10px] text-(--c-muted)">
                  Peak highlighted
                </span>
              )
            }
          />
          <div className="h-[280px] p-4.5">
            {loading ? (
              <ChartSkeleton bars={12} />
            ) : isTrendEmpty ? (
              <EmptyState message="No trend data for this period" />
            ) : (
              <TrendChart
                data={trend}
                gridColor={gridColor}
                tickColor={tickColor}
                isDark={isDark}
                highlightedMonths={mode === "monthly" ? [] : highlightedMonths}
              />
            )}
          </div>
        </Card>

        {/* CHANNEL | CATEGORY | PRODUCT */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader title="Channel" />
            <div className="p-4.5">
              {loading ? (
                <>
                  <DonutSkeleton />
                  <div className="mt-2">
                    <BarListSkeleton rows={5} />
                  </div>
                </>
              ) : isChannelEmpty ? (
                <EmptyState message="No channel data" />
              ) : (
                <ChannelBreakdown data={channel} />
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Category" />
            <div className="p-4.5">
              {loading ? (
                <BarListSkeleton rows={6} />
              ) : isCategoryEmpty ? (
                <EmptyState message="No category data" />
              ) : (
                <BarList items={category} />
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Product" />
            <div className="p-4.5">
              {loading ? (
                <BarListSkeleton rows={6} />
              ) : isProductEmpty ? (
                <EmptyState message="No product data" />
              ) : (
                <BarList items={product} />
              )}
            </div>
          </Card>
        </div>

        {/* CUSTOMER SECTION */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Card>
            <CardHeader title="Total Customer" />
            <div className="h-[240px] p-4.5">
              {loading ? (
                <ChartSkeleton bars={12} />
              ) : hasCustomer ? (
                <CustomerBarChart
                  data={customer}
                  gridColor={gridColor}
                  tickColor={tickColor}
                  isDark={isDark}
                  highlightedMonths={highlightedMonths}
                />
              ) : (
                <EmptyState message="No customer data" />
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="New Customer" />
            <div className="h-[240px] p-4.5">
              {loading ? (
                <ChartSkeleton bars={12} />
              ) : hasCustomer ? (
                <NewCustomerBarChart
                  data={customer}
                  gridColor={gridColor}
                  tickColor={tickColor}
                  isDark={isDark}
                  highlightedMonths={highlightedMonths}
                />
              ) : (
                <EmptyState message="No new customer data" />
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
