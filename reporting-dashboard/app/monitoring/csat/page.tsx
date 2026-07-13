"use client"

import type {
  ModeType,
  DistributionViewType,
} from "@/features/csat/types/csat"

import React, {
  useMemo,
  useState,
} from "react"

import { useTheme } from "@/contexts/theme-context"
import { Sun, Moon, Calendar, Star, Database } from "lucide-react"

import {
  MONTHS,
  QUARTERS,
} from "@/features/csat/constants"

import {
  getHighlightedMonths,
  buildTrendData,
} from "@/features/csat/utils/chart"

import { fmt } from "@/features/csat/utils/format"

import { useCsatData } from "@/features/csat/hooks/useCsatData"

import Card from "@/shared/ui/Card"
import Skeleton from "@/shared/ui/Skeleton"
import PeriodDropdown from "@/features/csat/components/PeriodDropdown"
import AgentRow from "@/features/csat/components/AgentRow"

import TrendChart from "@/features/csat/charts/TrendChart"
import DistributionChart from "@/features/csat/charts/DistributionChart"

import CardHeader from "@/features/csat/components/CardHeader"

// ============================================================
// LOCAL UI COMPONENTS
// ============================================================

function EmptyState({ message = "No data available" }: { message?: string }) {
  return (
    <div style={{ 
      height: "100%", 
      width: "100%", 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      gap: 12,
      color: "var(--c-muted)",
      padding: "40px 0"
    }}>
      <Database size={32} strokeWidth={1.5} opacity={0.5} />
      <span style={{ fontSize: 13, fontWeight: 500 }}>{message}</span>
    </div>
  )
}

function ChartSkeleton({
  bars = 12,
  showYAxis = true,
}: {
  bars?: number
  showYAxis?: boolean
}) {
  const heights = useMemo(
    () =>
      Array.from({ length: bars }, (_, i) => {
        const base = 50 + Math.sin(i * 0.5) * 25 + Math.cos(i * 0.3) * 15
        return Math.max(25, Math.min(95, Math.round(base + 25)))
      }),
    [bars]
  )

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: bars > 20 ? 3 : 6, paddingLeft: showYAxis ? 32 : 0, paddingRight: 8, paddingTop: 8, position: "relative" }}>
        {showYAxis && (
          <div style={{ position: "absolute", left: 0, top: 8, bottom: 0, width: 26, display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-end", paddingRight: 6 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ width: 18, height: 6, borderRadius: 3, background: "var(--c-skeleton)", opacity: 0.5 }} />
            ))}
          </div>
        )}
        {heights.map((h, i) => (
          <div key={i} className="shimmer-bar" style={{ flex: 1, height: `${h}%`, borderRadius: "4px 4px 0 0", animationDelay: `${i * 0.04}s, ${i * 0.06}s` }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: bars > 20 ? 3 : 6, paddingLeft: showYAxis ? 32 : 0, paddingRight: 8 }}>
        {heights.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--c-skeleton)", opacity: 0.4 }} />
        ))}
      </div>
    </div>
  )
}

function AgentRowSkeleton() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--c-border)" }}>
      <Skeleton w={22} h={14} />
      <div style={{ flex: 1 }}>
        <Skeleton w="60%" h={12} />
      </div>
      <Skeleton w={50} h={12} />
    </div>
  )
}

// ============================================================
// PAGE
// ============================================================

export default function CSATPage() {
  const { isDark, toggleTheme } = useTheme()
  const [mode, setMode] = useState<ModeType>("monthly")
  const [period, setPeriod] = useState("Jan")
  const [year, setYear] = useState(2026)
  const [distView, setDistView] = useState<DistributionViewType>("total")

  const { loading, error, summary, rawTrend, rawDistribution, topAgentTotal, topAgentAvg } = useCsatData(mode, period, year)

  // ✅ FUNGSI PENGGANTI useEffect
  const handleModeChange = (newMode: ModeType) => {
    setMode(newMode)
    if (newMode === "monthly") setPeriod("Jan")
    else if (newMode === "quarterly") setPeriod("Q1")
    else setPeriod("all")
  }

  const trendData = useMemo(() => buildTrendData(rawTrend), [rawTrend])
  
  const isTrendEmpty = useMemo(() => trendData.every(d => d.pct_4 === 0 && d.pct_5 === 0), [trendData])

  const distribution = useMemo(() => [5, 4, 3, 2, 1].map((r) => {
    const found = rawDistribution?.find((d) => Number(d.rating) === r)
    return { rating: String(r), value: found ? (distView === "total" ? (found.count ?? 0) : (found.avg ?? 0)) : 0 }
  }), [rawDistribution, distView])

  const isDistEmpty = useMemo(() => distribution.every(d => d.value === 0), [distribution])

  const highlightedMonths = useMemo(() => getHighlightedMonths(mode, period), [mode, period])
  const periodOptions = useMemo(() => (mode === "monthly" ? MONTHS : mode === "quarterly" ? QUARTERS : []), [mode])

  const cssVars: React.CSSProperties = isDark
    ? ({ "--c-bg": "#0d1117", "--c-surface": "#161b22", "--c-control": "#1f242d", "--c-border": "rgba(255,255,255,0.08)", "--c-text": "#e2e4ea", "--c-muted": "#6b7485", "--c-skeleton": "#252a35", "--c-accent": "#0ea5e9" } as React.CSSProperties)
    : ({ "--c-bg": "#f0f2f5", "--c-surface": "#ffffff", "--c-control": "#f7f8fa", "--c-border": "rgba(0,0,0,0.08)", "--c-text": "#1a1d27", "--c-muted": "#6b7280", "--c-skeleton": "#e5e7eb", "--c-accent": "#0ea5e9" } as React.CSSProperties)

  const KPI_CARDS = useMemo(() => [
    { label: "Total Response", value: fmt(summary.total_response || 0), color: "#0ea5e9" },
    { label: "High Score (4-5)", value: fmt(summary.high_score || 0), color: "#22c55e" },
    { label: "Low Score (1-2)", value: fmt(summary.low_score || 0), color: "#ef4444" },
    { label: "Avg CSAT Score", value: `${summary.avg_csat || 0} ⭐`, color: "#f59e0b" },
  ], [summary])

  return (
    <div style={{ 
        ...cssVars, 
        background: "var(--c-bg)", 
        minHeight: "100vh", 
        color: "var(--c-text)", 
        fontFamily: "'Plus Jakarta Sans','Inter','Segoe UI',sans-serif", 
        display: "flex", 
        flexDirection: "column",
        overflowX: "hidden" 
    }}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
        @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        .shimmer-bar { background: linear-gradient(90deg, var(--c-skeleton) 0%, rgba(255,255,255,0.06) 50%, var(--c-skeleton) 100%); background-size: 800px 100%; animation: shimmer 1.8s linear infinite; }
        
        .responsive-grid-kpi { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .responsive-grid-charts { display: grid; grid-template-columns: 7fr 5fr; gap: 14px; }
        .responsive-grid-agents { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

        @media (max-width: 1024px) {
          .responsive-grid-charts { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
          .responsive-grid-kpi { grid-template-columns: repeat(2, 1fr); }
          .responsive-grid-agents { grid-template-columns: 1fr; }
          .header-content { flex-direction: column; height: auto !important; padding: 15px 20px !important; gap: 15px; align-items: flex-start !important; }
        }

        @media (max-width: 480px) {
          .responsive-grid-kpi { grid-template-columns: 1fr; }
        }
      `}</style>

      <header className="header-content" style={{ position: "sticky", top: 0, zIndex: 30, background: "var(--c-surface)", borderBottom: "1px solid var(--c-border)", height: 60, padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 32, height: 32, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(14,165,233,0.12)" }}><Calendar size={15} color="#0ea5e9" /></span>
          <div style={{ lineHeight: 1.2 }}><div style={{ fontWeight: 800, fontSize: 13 }}>CSAT Monitoring</div><div style={{ fontSize: 10, color: "var(--c-muted)" }}>{mode === "yearly" ? `Full Year ${year}` : `${period} · ${year}`}</div></div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* ✅ MENGGUNAKAN handleModeChange DI SINI */}
          <PeriodDropdown options={["Monthly", "Quarterly", "Yearly"]} value={mode.charAt(0).toUpperCase() + mode.slice(1)} onChange={(v: string) => handleModeChange(v.toLowerCase() as ModeType)} isDark={isDark} width={110} />
          {mode !== "yearly" && <PeriodDropdown options={periodOptions} value={period} onChange={setPeriod} isDark={isDark} width={90} />}
          <PeriodDropdown options={["2024", "2025", "2026"]} value={String(year)} onChange={(v: string) => setYear(Number(v))} isDark={isDark} width={84} />
          <button 
            onClick={toggleTheme} 
            aria-label="Toggle theme" 
            title="Toggle dark mode"
            style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--c-border)", background: "var(--c-control)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </header>

      <main style={{ padding: 20, maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
        {error && <div style={{ padding: 12, background: "rgba(239,68,68,0.1)", color: "#ef4444", borderRadius: 10, fontSize: 13 }}>Error: {error}</div>}
        
        <div className="responsive-grid-kpi">
          {KPI_CARDS.map((kpi) => (
            <Card key={kpi.label}>
              <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 11 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 10, fontWeight: 700, color: "var(--c-muted)", textTransform: "uppercase" }}>{kpi.label}</span><Star size={13} color={kpi.color} /></div>
                {loading ? <Skeleton w="60%" h={24} /> : <span style={{ fontSize: 22, fontWeight: 700 }}>{kpi.value}</span>}
                <div style={{ height: 2, background: `${kpi.color}20`, borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ 
                      height: "100%", 
                      width: loading ? "0%" : (kpi.label === "Avg CSAT Score" ? `${(summary.avg_csat / 5) * 100}%` : "100%"), 
                      background: kpi.color, 
                      transition: "width 1s ease" 
                  }} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="responsive-grid-charts">
          <Card>
            <CardHeader title="CSAT Score Trend" badge={loading ? undefined : "LIVE"} extra={!loading && <div style={{ display: "flex", gap: 12 }}>{[{ color: "#22c55e", label: "5 ⭐" }, { color: "#f59e0b", label: "4 ⭐" }].map(l => <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 2, background: l.color }} /><span style={{ fontSize: 10, color: "var(--c-muted)" }}>{l.label}</span></div>)}</div>} />
            <div style={{ padding: 18, height: 280 }}>
              {loading ? <ChartSkeleton bars={12} /> : isTrendEmpty ? <EmptyState message="No trend data for this period" /> : (
                <TrendChart data={trendData} highlightedMonths={highlightedMonths} isDark={isDark} tickColor="#6b7485" gridColor="rgba(0,0,0,0.05)" />
              )}
            </div>
          </Card>
          
          <Card>
            <CardHeader title="Rating Distribution" extra={!loading && <div style={{ background: "var(--c-control)", borderRadius: 8, padding: 2 }}>{(["total", "average"] as DistributionViewType[]).map(v => <button key={v} onClick={() => setDistView(v)} style={{ padding: "3px 10px", fontSize: 10, borderRadius: 6, border: "none", cursor: "pointer", color: distView === v ? "var(--c-text)" : "var(--c-muted)", background: distView === v ? (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)") : "transparent" }}>{v}</button>)}</div>} />
            <div style={{ padding: 18, height: 280 }}>
              {loading ? <ChartSkeleton bars={5} /> : isDistEmpty ? <EmptyState message="No distribution data" /> : (
                <DistributionChart data={distribution} gridColor="rgba(0,0,0,0.05)" tickColor="#6b7485" isDark={isDark} />
              )}
            </div>
          </Card>
        </div>

        <div className="responsive-grid-agents">
          <Card>
            <CardHeader title="Top Response Agents" />
            <div style={{ padding: "4px 18px 14px" }}>
              {loading ? [1,2,3,4,5].map(i => <AgentRowSkeleton key={i} />) : (topAgentTotal?.length > 0) ? (
                topAgentTotal.slice(0,5).map((a, i) => <AgentRow key={i} rank={i+1} name={a.agent} value={fmt(a.total)} suffix=" resp" isLast={i===topAgentTotal.slice(0,5).length - 1} />)
              ) : <EmptyState message="No agent data" />}
            </div>
          </Card>
          
          <Card>
            <CardHeader title="Highest Rated Agents" />
            <div style={{ padding: "4px 18px 14px" }}>
              {loading ? [1,2,3,4,5].map(i => <AgentRowSkeleton key={i} />) : (topAgentAvg?.length > 0) ? (
                topAgentAvg.slice(0,5).map((a, i) => <AgentRow key={i} rank={i+1} name={a.agent} value={a.avg_csat} suffix=" ⭐" valueColor="#f59e0b" isLast={i===topAgentAvg.slice(0,5).length - 1} />)
              ) : <EmptyState message="No agent ratings" />}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
