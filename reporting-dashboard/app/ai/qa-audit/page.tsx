"use client"

import React, { useState, useMemo, useCallback } from "react"
import { useTheme } from "@/providers/theme-provider"
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sun,
  Moon,
  AlertCircle,
  RefreshCw,
  Tag,
  Users,
  FileText,
  Eye,
  X,
  Star,
  Award,
  TrendingDown,
  MessageSquare,
} from "lucide-react"
import Card from "@/components/ui/card"
import RealtimeClock from "@/features/dashboard/components/RealtimeClock"
import Spinner from "@/features/dashboard/components/Spinner"
import EmptyState from "@/features/dashboard/components/EmptyState"
import { MONTHS, QUARTERS } from "@/features/dashboard/constants"
import { getDefaultMonth, getDefaultYear, REPORT_YEARS } from "@/lib/period-defaults"
import type { ModeType } from "@/features/dashboard/types/dashboard"

const TARGET_BRANDS = ["All", "Tineco", "Ecovacs", "Laifen", "Tymo", "Yoniev"]

interface AuditRecord {
  id: string
  sessionId: string
  date: string
  brand: string
  agentName: string
  customerName: string
  realCustomerIssue: string
  agentSystemInput: string
  status: "match" | "mismatch"
  qmScore: number
  csatScore: number
  verbatimChat: string
  qmRubric: {
    greeting: number // out of 15
    empathy: number // out of 20
    knowledge: number // out of 35
    categorization: number // out of 15
    closing: number // out of 15
  }
}

// Sample realistic audit dataset for instant interactive demonstration
const INITIAL_AUDIT_RECORDS: AuditRecord[] = [
  {
    id: "1",
    sessionId: "16-wGAyyG",
    date: "23 Jul 2026",
    brand: "Tineco",
    agentName: "Faizal",
    customerName: "Elsye Ng",
    realCustomerIssue: "Tanya prosedur & syarat Trade-In unit vacuum lama ke baru",
    agentSystemInput: "Informasi Produk & Program Trade-In",
    status: "match",
    qmScore: 95,
    csatScore: 5,
    verbatimChat: "Customer: 'Apakah ada promo trade-in vacuum Tineco lama saya ke Floor One S5?'\nAgent (Faizal): 'Ada kak, syaratnya cukup fotokan nomor seri unit lama & bukti pembelian...'",
    qmRubric: { greeting: 15, empathy: 20, knowledge: 35, categorization: 15, closing: 10 },
  },
  {
    id: "2",
    sessionId: "12-FAmI0y",
    date: "23 Jul 2026",
    brand: "Tineco",
    agentName: "Arif",
    customerName: "Elsye Ng",
    realCustomerIssue: "Komplain unit perbaikan di Service Center Pontianak 1.5 bulan belum selesai & tanpa info",
    agentSystemInput: "Informasi Lokasi Service Center",
    status: "mismatch",
    qmScore: 65,
    csatScore: 1,
    verbatimChat: "Customer: 'Mau bertanya mengenai service vacuum saya, sudah dari akhir Mei diantar ke tempat service Pontianak tapi prosesnya lama sekali.'\nAgent (Arif): 'Kami bantu cek terlebih dahulu ya kak.'",
    qmRubric: { greeting: 15, empathy: 0, knowledge: 20, categorization: 0, closing: 15 },
  },
  {
    id: "3",
    sessionId: "12-ywdVwK",
    date: "23 Jul 2026",
    brand: "Ecovacs",
    agentName: "Arman",
    customerName: "Ivana",
    realCustomerIssue: "Sensor navigasi robot Deebot mati & menanyakan jam operasional lokasi service center",
    agentSystemInput: "Kerusakan Sensor Navigasi & Info Jam Operasional",
    status: "match",
    qmScore: 92,
    csatScore: 5,
    verbatimChat: "Customer: 'Sensor navigasi robot Ecovacs saya mati. Kalau mau ke service center buka jam berapa?'\nAgent (Arman): 'Selamat pagi Kak Ivana, service center buka jam 09.00-17.00 WIB. Untuk sensor navigasi mati bisa dibawa langsung...'",
    qmRubric: { greeting: 15, empathy: 20, knowledge: 30, categorization: 15, closing: 12 },
  },
  {
    id: "4",
    sessionId: "12-bixJlm",
    date: "23 Jul 2026",
    brand: "Ecovacs",
    agentName: "Arif",
    customerName: "Budi",
    realCustomerIssue: "Garansi baterai Deebot T10 habis & keluhan biaya perbaikan penggantian cell baterai",
    agentSystemInput: "Informasi Umum Produk",
    status: "mismatch",
    qmScore: 70,
    csatScore: 2,
    verbatimChat: "Customer: 'Baterai Deebot T10 saya mati total. Garansi baru lewat 1 minggu, apakah bisa klaim ganti baterai?'\nAgent (Arif): 'Garansi hanya berlaku 12 bulan kak.'",
    qmRubric: { greeting: 15, empathy: 5, knowledge: 20, categorization: 0, closing: 15 },
  },
  {
    id: "5",
    sessionId: "10-kL98aP",
    date: "22 Jul 2026",
    brand: "Laifen",
    agentName: "Faizal",
    customerName: "Dewi",
    realCustomerIssue: "Hairdryer Laifen Swift tidak menyala & bunyi mendesis saat dicolok",
    agentSystemInput: "Kerusakan Fisik & Unit Not Powering On",
    status: "match",
    qmScore: 98,
    csatScore: 5,
    verbatimChat: "Customer: 'Mbak hairdryer Laifen saya mendesis dan tiba-tiba tidak mau hidup.'\nAgent (Faizal): 'Baik Kak Dewi, mohon hentikan penggunaan segera demi keamanan. Kami bantu buatkan tiket retur garansi...'",
    qmRubric: { greeting: 15, empathy: 20, knowledge: 35, categorization: 15, closing: 13 },
  },
]

const DARK_VARS: React.CSSProperties = {
  "--c-bg": "#0d1117",
  "--c-surface": "#161b22",
  "--c-offset": "#1f2430",
  "--c-border": "rgba(255,255,255,0.08)",
  "--c-text": "#e2e4ea",
  "--c-muted": "#6b7485",
  "--c-skeleton": "#252a35",
  "--c-accent": "#10b981",
} as React.CSSProperties

const LIGHT_VARS: React.CSSProperties = {
  "--c-bg": "#f0f2f5",
  "--c-surface": "#ffffff",
  "--c-offset": "#f6f8fa",
  "--c-border": "rgba(0,0,0,0.08)",
  "--c-text": "#1a1d27",
  "--c-muted": "#6b7280",
  "--c-skeleton": "#e5e7eb",
  "--c-accent": "#10b981",
} as React.CSSProperties

export default function QaAuditPage() {
  const { isDark, toggleTheme } = useTheme()
  const [mode, setMode] = useState<ModeType>("monthly")
  const [period, setPeriod] = useState(() => getDefaultMonth(MONTHS))
  const [year, setYear] = useState(() => getDefaultYear(REPORT_YEARS))
  const [selectedBrand, setSelectedBrand] = useState<string>("Tineco")

  // 3 Core Audit Tabs: 'leaderboard' | 'discrepancy' | 'low_csat'
  const [activeTab, setActiveTab] = useState<"leaderboard" | "discrepancy" | "low_csat">("discrepancy")
  
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiAuditReport, setAiAuditReport] = useState<string | null>(null)

  const periodOptions = useMemo(() => (mode === "monthly" ? MONTHS : QUARTERS), [mode])
  const cssVars = isDark ? DARK_VARS : LIGHT_VARS

  const handleModeChange = (v: string) => {
    const m = v.toLowerCase() as ModeType
    setMode(m)
    setPeriod(m === "yearly" ? "all" : m === "quarterly" ? "Q1" : getDefaultMonth(MONTHS))
  }

  const filteredRecords = useMemo(() => {
    return INITIAL_AUDIT_RECORDS.filter((r) => {
      const matchBrand = selectedBrand === "All" || r.brand.toLowerCase() === selectedBrand.toLowerCase()
      if (!matchBrand) return false

      if (activeTab === "discrepancy") return true
      if (activeTab === "low_csat") return r.csatScore <= 2
      return true
    })
  }, [selectedBrand, activeTab])

  const runQaAudit = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      await fetch("/api/backend/chat/ingest-sample-local", { method: "POST" }).catch(() => {})

      const response = await fetch("/api/backend/chat/brand-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: selectedBrand === "All" ? "Tineco" : selectedBrand,
          query: `Audit kepatuhan agen CS, QM score, dan periksa ketidaksesuaian (mismatch) antara percakapan pelanggan asli vs inputan tiket sistem Omnix untuk periode ${period} ${year}`,
        }),
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        throw new Error(errJson.detail || `Gagal memuat audit QA HTTP ${response.status}`)
      }

      const data = await response.json()
      if (data.report) {
        setAiAuditReport(data.report)
      } else {
        throw new Error(data.error || "Gagal menghasilkan audit QA AI")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat Audit QA AI")
    } finally {
      setLoading(false)
    }
  }, [selectedBrand, period, year])

  return (
    <div style={cssVars} className="flex min-h-screen flex-col overflow-hidden bg-(--c-bg) font-[Plus_Jakarta_Sans,Inter,sans-serif] text-(--c-text) transition-colors">
      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6 pb-12">
        
        {/* HEADER & FILTER BAR */}
        <div className="shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 shadow-md shadow-emerald-500/20">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-(--c-text)">AI QA & Compliance Audit</h1>
                <p className="text-[11px] text-(--c-muted)">100% Conversational Coverage · Discrepancy Detection · Low CSAT Deep-Dive</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 text-[11px]">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-emerald-400">Compliance Checker Active</span>
              <span className="text-(--c-muted)">·</span>
              <span className="tabular-nums text-(--c-muted)"><RealtimeClock /></span>
            </div>
          </div>

          <div className="my-3 h-px w-full bg-(--c-border)" />

          {/* FILTER CONTROLS */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* BRAND SELECTOR */}
            <div className="flex items-center gap-1 overflow-x-auto py-1">
              <span className="mr-1 text-[11px] font-semibold text-(--c-muted) uppercase tracking-wider">Brand:</span>
              {TARGET_BRANDS.map((b) => {
                const isSelected = selectedBrand === b
                return (
                  <button
                    key={b}
                    onClick={() => setSelectedBrand(b)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-semibold transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20 border border-emerald-400"
                        : "bg-(--c-surface) border border-(--c-border) text-(--c-muted) hover:text-(--c-text) hover:bg-(--c-offset)"
                    }`}
                  >
                    {b}
                  </button>
                )
              })}
            </div>

            {/* PERIOD & MODE SELECTORS */}
            <div className="flex items-center gap-2">
              <div className="flex items-center overflow-hidden rounded-lg border border-(--c-border) bg-(--c-surface)">
                <select value={mode} onChange={(e) => handleModeChange(e.target.value)} className="border-r border-(--c-border) bg-transparent px-2.5 py-1.5 text-[11px] font-semibold text-(--c-text) outline-none">
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
                {mode !== "yearly" && (
                  <select value={period} onChange={(e) => setPeriod(e.target.value)} className="border-r border-(--c-border) bg-transparent px-2.5 py-1.5 text-[11px] font-semibold text-(--c-text) outline-none">
                    {periodOptions.map((p) => (<option key={p} value={p}>{p}</option>))}
                  </select>
                )}
                <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-transparent px-2.5 py-1.5 text-[11px] font-semibold text-(--c-text) outline-none">
                  {REPORT_YEARS.map((y) => (<option key={y} value={y}>{y}</option>))}
                </select>
              </div>

              <button
                onClick={runQaAudit}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-bold text-white shadow-md transition-all hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                Run Full AI Audit
              </button>

              <button onClick={toggleTheme} aria-label="Toggle theme" className="flex h-8 w-8 items-center justify-center rounded-lg border border-(--c-border) bg-(--c-surface) text-(--c-muted)">
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION BAR (3 AUDIT FOCUS MODES) */}
        <div className="flex items-center gap-2 rounded-xl border border-(--c-border) bg-(--c-surface) p-1 shrink-0">
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[12px] font-bold transition-all cursor-pointer ${
              activeTab === "leaderboard"
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                : "text-(--c-muted) hover:text-(--c-text) hover:bg-(--c-offset)"
            }`}
          >
            <Award className="h-4 w-4" />
            100% QM Score Leaderboard
          </button>

          <button
            onClick={() => setActiveTab("discrepancy")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[12px] font-bold transition-all cursor-pointer ${
              activeTab === "discrepancy"
                ? "bg-red-500 text-white shadow-md shadow-red-500/20"
                : "text-(--c-muted) hover:text-(--c-text) hover:bg-(--c-offset)"
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            Discrepancy Audit (15.8% Mismatch ❌)
          </button>

          <button
            onClick={() => setActiveTab("low_csat")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[12px] font-bold transition-all cursor-pointer ${
              activeTab === "low_csat"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                : "text-(--c-muted) hover:text-(--c-text) hover:bg-(--c-offset)"
            }`}
          >
            <TrendingDown className="h-4 w-4" />
            Low CSAT Deep-Dive (1-2 Stars 🔻)
          </button>
        </div>

        {/* KPI METRICS CARDS */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 shrink-0">
          <Card className="p-3.5">
            <div className="flex items-center justify-between text-(--c-muted) text-[11px] font-medium">
              <span>Total Audited Sessions</span>
              <FileText className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-lg font-black text-(--c-text)">2,404 Sesi (100%)</div>
          </Card>

          <Card className="p-3.5">
            <div className="flex items-center justify-between text-(--c-muted) text-[11px] font-medium">
              <span>Average QM Score</span>
              <Award className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-lg font-black text-emerald-400">88.4 / 100</div>
          </Card>

          <Card className="p-3.5">
            <div className="flex items-center justify-between text-(--c-muted) text-[11px] font-medium">
              <span>Discrepancy / Mismatch Rate</span>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </div>
            <div className="mt-2 text-lg font-black text-red-400">15.8% Mismatch</div>
          </Card>

          <Card className="p-3.5">
            <div className="flex items-center justify-between text-(--c-muted) text-[11px] font-medium">
              <span>Low CSAT (1-2 Stars)</span>
              <Star className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-2 text-lg font-black text-amber-400">5.2% (125 Sesi)</div>
          </Card>
        </div>

        {/* AUDIT DATA TABLE */}
        <Card className="shrink-0 w-full overflow-hidden p-0">
          <div className="border-b border-(--c-border) bg-(--c-offset) px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <h2 className="text-xs font-bold text-(--c-text) uppercase tracking-wider">
                {activeTab === "leaderboard" && "Agent QM Score Leaderboard"}
                {activeTab === "discrepancy" && "Tabel Audit Ketidaksesuaian (Mismatch Check)"}
                {activeTab === "low_csat" && "Investigasi Rating CSAT Buruk (1-2 Bintang)"}
              </h2>
            </div>
            <span className="text-[11px] text-(--c-muted)">Menampilkan {filteredRecords.length} sesi terdaftar</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-(--c-surface) text-(--c-muted) border-b border-(--c-border) uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="px-4 py-3">Session ID</th>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Brand</th>
                  <th className="px-4 py-3">Nama Agen</th>
                  <th className="px-4 py-3">Masalah Asli Pelanggan (Chat/Voice)</th>
                  <th className="px-4 py-3">Inputan Kategori Agen (Omnix Tiket)</th>
                  <th className="px-4 py-3 text-center">QM Score</th>
                  <th className="px-4 py-3 text-center">Status Audit</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--c-border)">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-(--c-offset)/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-sky-400">#{r.sessionId}</td>
                    <td className="px-4 py-3 text-(--c-muted)">{r.date}</td>
                    <td className="px-4 py-3 font-semibold">{r.brand}</td>
                    <td className="px-4 py-3 font-semibold text-(--c-text)">{r.agentName}</td>
                    <td className="px-4 py-3 max-w-[280px] truncate text-(--c-text)" title={r.realCustomerIssue}>
                      {r.realCustomerIssue}
                    </td>
                    <td className="px-4 py-3 max-w-[240px] truncate text-(--c-muted)" title={r.agentSystemInput}>
                      {r.agentSystemInput}
                    </td>
                    <td className="px-4 py-3 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded text-[11px] ${r.qmScore >= 90 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                        {r.qmScore}/100
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.status === "match" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3" /> MATCH
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          <XCircle className="h-3 w-3" /> MISMATCH
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedRecord(r)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500 hover:text-white transition-all text-[11px] font-semibold cursor-pointer"
                      >
                        <Eye className="h-3 w-3" /> View Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* AI EXECUTIVE SUMMARY & COACHING RECOMMENDATION CARD */}
        <Card className="shrink-0 w-full p-5 min-h-[300px]">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-(--c-text)">AI Executive QA Audit & Coaching Recommendations</h3>
          </div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Spinner height={50} />
              <p className="text-xs font-semibold text-emerald-400 animate-pulse">Gemini AI sedang menyusun analisis audit kepatuhan & rekomendasi coaching...</p>
            </div>
          ) : aiAuditReport ? (
            <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
              {aiAuditReport}
            </div>
          ) : (
            <div className="space-y-3 text-xs leading-relaxed text-(--c-text)">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5">
                <p className="font-bold text-emerald-400 mb-1">📌 Ringkasan Kinerja CS Overall:</p>
                <p>- Akurasi Inputan Tiket Agen: <strong>84.2% Match</strong> | <strong>15.8% Mismatch</strong>.</p>
                <p>- Area Salah Input Terbanyak: Keluhan <em>Keterlambatan Service Partner</em> sering diinput agen sebagai <em>Informasi Lokasi Service Center</em>.</p>
              </div>

              <div className="rounded-xl border border-(--c-border) bg-(--c-offset) p-3.5">
                <p className="font-bold text-sky-400 mb-1">💡 3 Poin Rekomendasi QA Coaching untuk Supervisor CS:</p>
                <ol className="list-decimal list-inside space-y-1 text-(--c-muted)">
                  <li>Sosialisasikan pemisahan kategori &quot;Informasi Lokasi&quot; vs &quot;Komplain Service Center&quot; agar data dashboard tidak terdistorsi.</li>
                  <li>Berikan pelatihan pengungkapan empati (*empathy statement*) untuk Agen Arif saat penanganan komplain di atas 10 menit.</li>
                  <li>Tingkatkan koordinasi follow-up ke Service Partner Pontianak & Surabaya untuk menekan akumulasi komplain unit mengendap.</li>
                </ol>
              </div>
            </div>
          )}
        </Card>

      </main>

      {/* INSPECTION SIDE-DRAWER MODAL FOR ROW DETAIL */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-3xl rounded-2xl border border-(--c-border) bg-(--c-surface) p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-(--c-border) pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-(--c-text)">Detail Audit Percakapan — Sesi #{selectedRecord.sessionId}</h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg p-1.5 text-(--c-muted) hover:bg-(--c-offset) hover:text-(--c-text) cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* METADATA */}
              <div className="grid grid-cols-3 gap-3 rounded-xl bg-(--c-offset) p-3">
                <div>
                  <span className="text-(--c-muted) block text-[10px] uppercase font-bold">Nama Agen</span>
                  <span className="font-bold text-(--c-text)">{selectedRecord.agentName}</span>
                </div>
                <div>
                  <span className="text-(--c-muted) block text-[10px] uppercase font-bold">Brand & Pelanggan</span>
                  <span className="font-bold text-(--c-text)">{selectedRecord.brand} ({selectedRecord.customerName})</span>
                </div>
                <div>
                  <span className="text-(--c-muted) block text-[10px] uppercase font-bold">Rating CSAT</span>
                  <span className="font-bold text-amber-400">⭐ {selectedRecord.csatScore} / 5</span>
                </div>
              </div>

              {/* VERBATIM CHAT SNIPPET */}
              <div className="rounded-xl border border-(--c-border) bg-(--c-bg) p-3.5 font-mono text-[11px] leading-relaxed">
                <div className="flex items-center gap-2 text-sky-400 font-bold mb-2">
                  <MessageSquare className="h-4 w-4" /> Teks Percakapan Asli (Raw Verbatim):
                </div>
                <div className="whitespace-pre-wrap text-(--c-text)">{selectedRecord.verbatimChat}</div>
              </div>

              {/* DISCREPANCY COMPARISON */}
              <div className={`rounded-xl border p-3.5 ${selectedRecord.status === "mismatch" ? "border-red-500/30 bg-red-500/10" : "border-emerald-500/30 bg-emerald-500/10"}`}>
                <div className="font-bold mb-2 flex items-center gap-2">
                  {selectedRecord.status === "mismatch" ? (
                    <span className="text-red-400 font-bold flex items-center gap-1"><XCircle className="h-4 w-4" /> STATUS: MISMATCH (Indikasi Salah Input Kategori)</span>
                  ) : (
                    <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> STATUS: MATCH (Input Kategori Sesuai)</span>
                  )}
                </div>
                <div className="space-y-1 text-(--c-text)">
                  <p><strong>Masalah Asli di Chat:</strong> {selectedRecord.realCustomerIssue}</p>
                  <p><strong>Inputan Kategori Agen di Tiket:</strong> {selectedRecord.agentSystemInput}</p>
                </div>
              </div>

              {/* QM SCORE RUBRIC BREAKDOWN */}
              <div className="rounded-xl border border-(--c-border) bg-(--c-offset) p-3.5">
                <div className="flex items-center justify-between font-bold text-(--c-text) mb-2">
                  <span>Rincian QM Score (Rubrik 5 Parameter)</span>
                  <span className="text-emerald-400 text-sm font-black">{selectedRecord.qmScore} / 100</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-(--c-muted)">
                  <div>• Greeting SOP: <strong className="text-(--c-text)">{selectedRecord.qmRubric.greeting}/15</strong></div>
                  <div>• Empathy Statement: <strong className="text-(--c-text)">{selectedRecord.qmRubric.empathy}/20</strong></div>
                  <div>• Product Knowledge: <strong className="text-(--c-text)">{selectedRecord.qmRubric.knowledge}/35</strong></div>
                  <div>• Categorization: <strong className="text-(--c-text)">{selectedRecord.qmRubric.categorization}/15</strong></div>
                  <div>• Closing SOP: <strong className="text-(--c-text)">{selectedRecord.qmRubric.closing}/15</strong></div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500 cursor-pointer transition-all"
              >
                Tutup Inspeksi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
