"use client"

import React, { useState, useMemo, useCallback } from "react"
import { useTheme } from "@/providers/theme-provider"
import {
  Sparkles,
  BarChart3,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Tag,
  Building2,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react"
import Card from "@/components/ui/card"
import RealtimeClock from "@/features/dashboard/components/RealtimeClock"
import Spinner from "@/features/dashboard/components/Spinner"
import EmptyState from "@/features/dashboard/components/EmptyState"
import { MONTHS, QUARTERS } from "@/features/dashboard/constants"
import { getDefaultMonth, getDefaultYear, REPORT_YEARS } from "@/lib/period-defaults"
import type { ModeType } from "@/features/dashboard/types/dashboard"

const TARGET_BRANDS = ["Tineco", "Ecovacs", "Laifen", "Tymo", "Yoniev"]

const DARK_VARS: React.CSSProperties = {
  "--c-bg": "#0d1117",
  "--c-surface": "#161b22",
  "--c-offset": "#1f2430",
  "--c-border": "rgba(255,255,255,0.08)",
  "--c-text": "#e2e4ea",
  "--c-muted": "#6b7485",
  "--c-skeleton": "#252a35",
  "--c-accent": "#0ea5e9",
} as React.CSSProperties

const LIGHT_VARS: React.CSSProperties = {
  "--c-bg": "#f0f2f5",
  "--c-surface": "#ffffff",
  "--c-offset": "#f6f8fa",
  "--c-border": "rgba(0,0,0,0.08)",
  "--c-text": "#1a1d27",
  "--c-muted": "#6b7280",
  "--c-skeleton": "#e5e7eb",
  "--c-accent": "#0ea5e9",
} as React.CSSProperties

export default function BrandAnalyticsPage() {
  const { isDark, toggleTheme } = useTheme()
  const [mode, setMode] = useState<ModeType>("monthly")
  const [period, setPeriod] = useState(() => getDefaultMonth(MONTHS))
  const [year, setYear] = useState(() => getDefaultYear(REPORT_YEARS))
  const [selectedBrand, setSelectedBrand] = useState<string>("Tineco")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiReport, setAiReport] = useState<string | null>(null)
  const [totalRecords, setTotalRecords] = useState<number>(0)

  const periodOptions = useMemo(() => (mode === "monthly" ? MONTHS : QUARTERS), [mode])
  const cssVars = isDark ? DARK_VARS : LIGHT_VARS

  const handleModeChange = (v: string) => {
    const m = v.toLowerCase() as ModeType
    setMode(m)
    setPeriod(m === "yearly" ? "all" : m === "quarterly" ? "Q1" : getDefaultMonth(MONTHS))
  }

  const runBrandAnalysis = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Ingest sample data first if needed
      await fetch("/api/backend/chat/ingest-sample-local", { method: "POST" }).catch(() => {})

      const response = await fetch("/api/backend/chat/brand-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: selectedBrand,
          query: `Analisis performa dan kendala brand ${selectedBrand} untuk periode ${period} ${year}`,
        }),
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        throw new Error(errJson.detail || `Gagal memuat insight HTTP ${response.status}`)
      }

      const data = await response.json()
      if (data.report) {
        setAiReport(data.report)
        setTotalRecords(data.total_chat_records_analyzed || 0)
      } else {
        throw new Error(data.error || "Gagal menghasilkan laporan AI")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memproses data AI")
    } finally {
      setLoading(false)
    }
  }, [selectedBrand, period, year])

  return (
    <div style={cssVars} className="flex min-h-screen flex-col overflow-hidden bg-(--c-bg) font-[Plus_Jakarta_Sans,Inter,sans-serif] text-(--c-text) transition-colors">
      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6 pb-12">
        
        {/* HEADER — AI Workspace Visual Model */}
        <header className="relative overflow-hidden rounded-2xl border border-(--c-border) bg-(--c-surface) p-4 sm:p-5 shadow-sm shrink-0 mb-2">
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
                  <Sparkles className="h-3.5 w-3.5 text-[#4285F4]" />
                </span>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-sky-400 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-[#4285F4]" />
                    <span className="size-1.5 rounded-full bg-[#EA4335]" />
                    <span className="size-1.5 rounded-full bg-[#FBBC05]" />
                    <span className="size-1.5 rounded-full bg-[#34A853]" />
                  </span>
                  AI Workspace · Brand Engine
                </p>
              </div>
              <h1 className="mt-1.5 bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl">
                AI Brand Analytics
              </h1>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-(--c-muted) sm:text-sm">
                Intelligence sentiment, pain points, & partner performance per brand.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2 text-[11px] rounded-full border border-emerald-500/20 bg-emerald-500/8 px-3.5 py-1.5 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold">Gemini 3.5 Active</span>
              <span className="text-(--c-muted)">·</span>
              <span className="tabular-nums font-mono"><RealtimeClock /></span>
            </div>
          </div>
        </header>

          {/* FILTER CONTROLS */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-(--c-border) bg-(--c-surface) p-3 shadow-sm shrink-0">
            {/* BRAND SELECTOR BUTTONS */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              <span className="mr-1 text-[11px] font-semibold text-(--c-muted) uppercase tracking-wider">Brand:</span>
              {TARGET_BRANDS.map((b) => {
                const isSelected = selectedBrand === b
                return (
                  <button
                    key={b}
                    onClick={() => setSelectedBrand(b)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-md shadow-sky-500/20 border border-sky-400"
                        : "bg-(--c-overlay) border border-(--c-border) text-(--c-muted) hover:text-(--c-text) hover:bg-(--c-offset)"
                    }`}
                  >
                    <Tag className="h-3 w-3" />
                    {b}
                  </button>
                )
              })}
            </div>

            {/* PERIOD & MODE SELECTORS */}
            <div className="flex items-center gap-2">
              <div className="flex items-center overflow-hidden rounded-xl border border-(--c-border) bg-(--c-overlay) p-0.5">
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

              <button
                onClick={runBrandAnalysis}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-sky-500/20 transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                Analyze {selectedBrand}
              </button>

              <button onClick={toggleTheme} aria-label="Toggle theme" className="flex h-8 w-8 items-center justify-center rounded-xl border border-(--c-border) bg-(--c-overlay) text-(--c-muted) transition-all hover:border-sky-500/40 hover:text-sky-400">
                {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

        {/* ERROR STATE */}
        {error && (
          <div className="flex shrink-0 items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-[12px] text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <span className="min-w-0 break-words">{error}</span>
          </div>
        )}

        {/* SUMMARY STATS METRICS */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 shrink-0">
          <Card className="p-3.5">
            <div className="flex items-center justify-between text-(--c-muted) text-[11px] font-medium">
              <span>Target Brand</span>
              <Tag className="h-4 w-4 text-sky-400" />
            </div>
            <div className="mt-2 text-lg font-black text-(--c-text)">{selectedBrand}</div>
          </Card>

          <Card className="p-3.5">
            <div className="flex items-center justify-between text-(--c-muted) text-[11px] font-medium">
              <span>Data Records Analyzed</span>
              <BarChart3 className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="mt-2 text-lg font-black text-(--c-text)">{totalRecords.toLocaleString("id-ID")} items</div>
          </Card>

          <Card className="p-3.5">
            <div className="flex items-center justify-between text-(--c-muted) text-[11px] font-medium">
              <span>Primary Channel</span>
              <Building2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-lg font-black text-emerald-400">WhatsApp & IG</div>
          </Card>

          <Card className="p-3.5">
            <div className="flex items-center justify-between text-(--c-muted) text-[11px] font-medium">
              <span>AI Model Engine</span>
              <Sparkles className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-2 text-lg font-black text-amber-400">Gemini 3.5 Flash</div>
          </Card>
        </div>

        {/* MAIN AI INSIGHT REPORT CONTENT */}
        <Card className="shrink-0 w-full p-5 min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Spinner height={60} />
              <p className="text-sm font-semibold text-sky-400 animate-pulse">
                Gemini AI sedang menganalisis percakapan chat & data tiket brand {selectedBrand}...
              </p>
            </div>
          ) : aiReport ? (
            <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
              {aiReport}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <EmptyState message={`Klik tombol 'Analyze ${selectedBrand}' di atas untuk membuat laporan inteligensi AI.`} />
              <button
                onClick={runBrandAnalysis}
                className="mt-2 flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-sky-400 cursor-pointer transition-all"
              >
                <Sparkles className="h-4 w-4" />
                Mulai Analisis Brand {selectedBrand}
              </button>
            </div>
          )}
        </Card>

      </main>
    </div>
  )
}
