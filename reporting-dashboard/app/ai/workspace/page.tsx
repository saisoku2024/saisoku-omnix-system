"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import { useTheme } from "@/providers/theme-provider"
import {
  Bot,
  Sparkles,
  BookOpen,
  PieChart,
  ShieldCheck,
  Zap,
  RefreshCw,
  Copy,
  Check,
  Search,
  Database,
  Cpu,
  Activity,
  Layers,
  ArrowUpRight,
  FileText,
  Play,
  Clock,
  Terminal,
  CheckCircle2,
  Trash2,
  TrendingUp,
} from "lucide-react"

// Types
type ModelType = "omnix-rag-v2" | "omnix-qa-auditor" | "brand-sentiment-pro" | "gpt4o-hybrid"
type ContextScope = "all" | "knowledge-base" | "qa-audits" | "brand-data"

interface PromptTemplate {
  id: string
  title: string
  description: string
  category: "Support" | "Audit" | "Analytics" | "SOP"
  prompt: string
  icon: React.ReactNode
}

interface ActivityItem {
  id: string
  action: string
  module: string
  timestamp: string
  status: "success" | "processing" | "failed"
  user: string
}

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

const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: "tpl-1",
    title: "Analisis Keluhan Garansi Tineco",
    description: "Ekstrak pola masalah utama & durasi penanganan garansi dari data CS.",
    category: "Support",
    prompt: "Tolong rangkum 5 keluhan garansi terbanyak untuk produk Tineco dalam 30 hari terakhir beserta rekomendasi perbaikannya.",
    icon: <Bot className="w-4 h-4 text-sky-400" />,
  },
  {
    id: "tpl-2",
    title: "Verifikasi SOP Retur TikTok Shop",
    description: "Cek kepatuhan agen terhadap regulasi pengembalian barang.",
    category: "SOP",
    prompt: "Bandingkan percakapan agen dengan SOP Retur TikTok Shop 2026. Apakah ada langkah penolakan retur yang menyalahi aturan?",
    icon: <BookOpen className="w-4 h-4 text-emerald-400" />,
  },
  {
    id: "tpl-3",
    title: "Audit Compliance Percakapan CS",
    description: "Evaluasi greeting, empati, dan penjelasan solutif dari pesan agen.",
    category: "Audit",
    prompt: "Jalankan QA Audit otomatis untuk sampel 10 percakapan CSAT terendah hari ini dan berikan skor kepatuhan agen.",
    icon: <ShieldCheck className="w-4 h-4 text-amber-400" />,
  },
  {
    id: "tpl-4",
    title: "Sentimen Kompetitor (Ecovacs vs Tineco)",
    description: "Bandingkan respon konsumen terhadap vacuum cleaner flagship.",
    category: "Analytics",
    prompt: "Berikan perbandingan sentiment score antara Ecovacs Deebot T10 vs Tineco Floor One S5 berdasarkan ulasan pembeli.",
    icon: <PieChart className="w-4 h-4 text-purple-400" />,
  },
]

const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: "act-1",
    action: "Vector Index Ingestion (84 PDF Document Chunks)",
    module: "Knowledge Base",
    timestamp: "2 mins ago",
    status: "success",
    user: "System Automator",
  },
  {
    id: "act-2",
    action: "Batch QA Audit 120 CS Call Logs",
    module: "QA & Compliance",
    timestamp: "14 mins ago",
    status: "success",
    user: "Admin QA",
  },
  {
    id: "act-3",
    action: "Brand Sentiment Aggregation (Shopee & TikTok)",
    module: "Brand Analytics",
    timestamp: "45 mins ago",
    status: "success",
    user: "System Cron",
  },
  {
    id: "act-4",
    action: "Fine-Tuning RAG Embeddings Model",
    module: "AI Core Engine",
    timestamp: "1 hour ago",
    status: "success",
    user: "Super Admin",
  },
]

export default function AIWorkspacePage() {
  const { isDark } = useTheme()
  const themeStyles = isDark ? DARK_VARS : LIGHT_VARS

  // Interactive State
  const [selectedModel, setSelectedModel] = useState<ModelType>("omnix-rag-v2")
  const [contextScope, setContextScope] = useState<ContextScope>("all")
  const [temperature, setTemperature] = useState<number>(0.3)
  const [userPrompt, setUserPrompt] = useState<string>("")
  const [isExecuting, setIsExecuting] = useState<boolean>(false)
  const [aiOutput, setAiOutput] = useState<string | null>(null)
  const [copied, setCopied] = useState<boolean>(false)
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null)
  const [tokenCount, setTokenCount] = useState<number | null>(null)
  const [searchFilter, setSearchFilter] = useState<string>("")

  // Quick Prompt Filler
  const handleSelectTemplate = (promptText: string) => {
    setUserPrompt(promptText)
  }

  // Clear Console
  const handleClearConsole = () => {
    setUserPrompt("")
    setAiOutput(null)
    setExecutionTimeMs(null)
    setTokenCount(null)
  }

  // Execute Prompt Simulation / API Call
  const handleRunCopilot = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!userPrompt.trim() || isExecuting) return

    setIsExecuting(true)
    setAiOutput("")
    const startTime = performance.now()

    // Simulated RAG / Copilot Streaming Response
    setTimeout(() => {
      let mockResponse = ""

      if (userPrompt.toLowerCase().includes("garansi") || userPrompt.toLowerCase().includes("tineco")) {
        mockResponse = `### 🤖 Analisis AI Workspace: Keluhan Garansi Tineco\n\nBased on **Knowledge Base Index (v2.4)** & **CS Data Ingestion**:\n\n1. **Penyebab Utama Keluhan (68%)**: Tangki air kotor tidak terdeteksi / sensor terbaca penuh (Error Code E2).\n2. **Durasi Penanganan Rata-rata**: 2.4 Hari Kerja (SOP standard max 3 hari).\n3. **Unit Terdampak Terbanyak**: Tineco Floor One S5 Smart & S3.\n\n> **Rekomendasi Operasional:**\n> Tambahkan auto-reply panduan pembersihan kontak sensor elektroda pada bot WhatsApp sebelum diproses ke Service Center Mitracare.`
      } else if (userPrompt.toLowerCase().includes("retur") || userPrompt.toLowerCase().includes("tiktok")) {
        mockResponse = `### 📋 Verifikasi Compliance SOP Retur TikTok Shop\n\n- **Status Kepatuhan**: \`96.5% Compliant\`\n- **Dokumen Referensi**: SOP-OMNIX-2026-RETUR-TT-V3.pdf\n\n**Temuan Penting:**\n- Retur karena "Berubah Pikiran" hanya berlaku jika segel dus belum dibuka.\n- Agen wajib meminta bukti unboxing video 360 derajat sebelum menerbitkan Kode Awb Retur Gratis.\n- **Catatan Minor**: 2 agen ditemukan belum melampirkan formulir konfirmasi kerusakan fisik dari kurir.`
      } else if (userPrompt.toLowerCase().includes("qa") || userPrompt.toLowerCase().includes("audit")) {
        mockResponse = `### 🛡️ Audit Compliance Sampling CSAT\n\n- **Total Sampel Diagnosa**: 10 Percakapan Terendah (CSAT 1-2 Stars)\n- **Rata-rata Skor CSAT**: 1.8 / 5.0\n\n| ID Chat | Agen | Pelanggaran Utama | Skor Compliance |\n| :--- | :--- | :--- | :--- |\n| #CH-9021 | Budi S. | Tidak melakukan salam pembuka resmi | 72% |\n| #CH-9044 | Siti A. | Menutup percakapan tanpa solusi final | 58% |\n| #CH-9089 | Rian K. | Waktu respon > 8 menit per balasan | 64% |\n\n**Rekomendasi Action Item**: Lakukan refresh training modul *Empathy & Active Listening* untuk shift malam.`
      } else {
        mockResponse = `### ✨ Hasil Copilot AI Workspace\n\n**Model Digunakan**: \`${selectedModel.toUpperCase()}\` | **Scope**: \`${contextScope.toUpperCase()}\` | **Temperature**: \`${temperature}\` \n\nInstruksi berhasil diproses menggunakan RAG Context Vector Store SAISOKU OMNIX.\n\n- **Dokumen Terhubung**: 12 Knowledge Chunks\n- **Akurasi Konteks**: 99.1%\n\n> Sistem telah mencatat aktivitas ini ke dalam Audit Log AI Workspace.`
      }

      setAiOutput(mockResponse)
      const endTime = performance.now()
      setExecutionTimeMs(Math.round(endTime - startTime + Math.random() * 200 + 150))
      setTokenCount(Math.floor(userPrompt.length * 1.8 + mockResponse.length * 0.7))
      setIsExecuting(false)
    }, 900)
  }

  // Copy Response Handler
  const handleCopyOutput = () => {
    if (!aiOutput) return
    navigator.clipboard.writeText(aiOutput)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Filter templates
  const filteredTemplates = useMemo(() => {
    if (!searchFilter.trim()) return PROMPT_TEMPLATES
    const q = searchFilter.toLowerCase()
    return PROMPT_TEMPLATES.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    )
  }, [searchFilter])

  return (
    <div
      style={themeStyles}
      className="min-h-screen bg-[var(--c-bg)] text-[var(--c-text)] transition-colors duration-200 p-4 sm:p-6 space-y-6"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--c-border)]">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-500/20 to-blue-600/20 border border-sky-500/30 text-sky-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                AI Workspace & Copilot Center
              </h1>
              <p className="text-xs sm:text-sm text-[var(--c-muted)]">
                Pusat kontrol kecerdasan buatan, Knowledge Base RAG, QA Compliance, dan Copilot Operasional SAISOKU OMNIX.
              </p>
            </div>
          </div>
        </div>

        {/* Engine Status Badge */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-emerald-400">AI Engine Online</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-muted)]">
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span>RAG Vector Store: <strong className="text-[var(--c-text)]">Active (1,284 Chunks)</strong></span>
          </div>
        </div>
      </div>

      {/* KPI Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-4 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--c-muted)] font-medium">Vector Knowledge Base</p>
            <h3 className="text-xl font-bold mt-1 text-sky-400">1,284 Chunks</h3>
            <p className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +42 minggu ini
            </p>
          </div>
          <div className="p-3 rounded-lg bg-sky-500/10 text-sky-400">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-4 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--c-muted)] font-medium">Akurasi QA Audit AI</p>
            <h3 className="text-xl font-bold mt-1 text-emerald-400">98.4%</h3>
            <p className="text-[11px] text-[var(--c-muted)] mt-0.5">Verified by Senior QA</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-4 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--c-muted)] font-medium">Brand Sentiment Index</p>
            <h3 className="text-xl font-bold mt-1 text-purple-400">87.2 / 100</h3>
            <p className="text-[11px] text-purple-400/90 mt-0.5">Positif (Tineco & Ecovacs)</p>
          </div>
          <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400">
            <PieChart className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-4 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--c-muted)] font-medium">Total Query Copilot</p>
            <h3 className="text-xl font-bold mt-1 text-amber-400">3,420</h3>
            <p className="text-[11px] text-[var(--c-muted)] mt-0.5">Avg Latency: 18ms</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: AI Navigation Modules */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--c-muted)] flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-400" /> Modul AI Utama
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Knowledge Base */}
          <Link
            href="/ai/knowledge-base"
            className="group relative p-5 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)] hover:border-sky-500/50 transition-all duration-200 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400 group-hover:scale-110 transition-transform duration-200">
                  <BookOpen className="w-6 h-6" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-[var(--c-muted)] group-hover:text-sky-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <h3 className="text-base font-semibold mt-3 group-hover:text-sky-400 transition-colors">
                Knowledge Base RAG
              </h3>
              <p className="text-xs text-[var(--c-muted)] mt-1.5 leading-relaxed">
                Kelola dokumen SOP, panduan garansi, spec sheet produk, dan jalankan pencarian vektor RAG berakurasi tinggi.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--c-border)] flex items-center justify-between text-[11px] text-[var(--c-muted)]">
              <span>PDF, DOCX, CSV, Text</span>
              <span className="font-semibold text-sky-400">Buka Engine &rarr;</span>
            </div>
          </Link>

          {/* Card 2: QA & Compliance Audit */}
          <Link
            href="/ai/qa-audit"
            className="group relative p-5 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)] hover:border-emerald-500/50 transition-all duration-200 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform duration-200">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-[var(--c-muted)] group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <h3 className="text-base font-semibold mt-3 group-hover:text-emerald-400 transition-colors">
                QA & Compliance Audit
              </h3>
              <p className="text-xs text-[var(--c-muted)] mt-1.5 leading-relaxed">
                Audit otomatis percakapan CS, evaluasi skor empati, identifikasi red-flag, dan kepatuhan standar layanan.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--c-border)] flex items-center justify-between text-[11px] text-[var(--c-muted)]">
              <span>Automated Scoring</span>
              <span className="font-semibold text-emerald-400">Buka Engine &rarr;</span>
            </div>
          </Link>

          {/* Card 3: Brand Analytics */}
          <Link
            href="/ai/brand-analytics"
            className="group relative p-5 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)] hover:border-purple-500/50 transition-all duration-200 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform duration-200">
                  <PieChart className="w-6 h-6" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-[var(--c-muted)] group-hover:text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <h3 className="text-base font-semibold mt-3 group-hover:text-purple-400 transition-colors">
                Brand Analytics & Sentiment
              </h3>
              <p className="text-xs text-[var(--c-muted)] mt-1.5 leading-relaxed">
                Monitor analisis sentiment brand utama (Tineco, Ecovacs, Laifen, Tymo), tren isu publik, dan benchmark kompetitor.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--c-border)] flex items-center justify-between text-[11px] text-[var(--c-muted)]">
              <span>Omnichannel Monitoring</span>
              <span className="font-semibold text-purple-400">Buka Engine &rarr;</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Main Interactive AI Playground & Copilot Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Copilot Interactive Form & Prompt Runner (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--c-border)] pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-sky-400" />
                <h2 className="text-base font-bold">Interactive AI Copilot Playground</h2>
              </div>
              {userPrompt || aiOutput ? (
                <button
                  onClick={handleClearConsole}
                  className="text-xs flex items-center gap-1 text-[var(--c-muted)] hover:text-red-400 transition-colors cursor-pointer"
                  title="Clear Console"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Reset Playground
                </button>
              ) : null}
            </div>

            {/* Model & Context Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Model Picker */}
              <div>
                <label className="block text-[11px] font-medium text-[var(--c-muted)] mb-1">
                  AI Model Engine
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as ModelType)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--c-offset)] border border-[var(--c-border)] text-[var(--c-text)] focus:outline-none focus:border-sky-500"
                >
                  <option value="omnix-rag-v2">Omnix RAG Engine v2.4</option>
                  <option value="omnix-qa-auditor">Omnix QA Compliance Evaluator</option>
                  <option value="brand-sentiment-pro">Brand Sentiment Classifier</option>
                  <option value="gpt4o-hybrid">GPT-4o Hybrid Copilot</option>
                </select>
              </div>

              {/* Context Scope */}
              <div>
                <label className="block text-[11px] font-medium text-[var(--c-muted)] mb-1">
                  Context RAG Scope
                </label>
                <select
                  value={contextScope}
                  onChange={(e) => setContextScope(e.target.value as ContextScope)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--c-offset)] border border-[var(--c-border)] text-[var(--c-text)] focus:outline-none focus:border-sky-500"
                >
                  <option value="all">Semua Konteks System</option>
                  <option value="knowledge-base">Dokumen Knowledge Base Only</option>
                  <option value="qa-audits">Transkrip QA Audit Only</option>
                  <option value="brand-data">Data Ulasan Brand Only</option>
                </select>
              </div>

              {/* Temperature */}
              <div>
                <div className="flex justify-between text-[11px] font-medium text-[var(--c-muted)] mb-1">
                  <span>Creativity (Temp)</span>
                  <span className="text-sky-400 font-bold">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-sky-500 mt-1 cursor-pointer"
                />
              </div>
            </div>

            {/* Prompt Input Box */}
            <form onSubmit={handleRunCopilot} className="space-y-3">
              <div className="relative">
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="Ketik instruksi atau pertanyaan Copilot (Contoh: Rangkum SOP garansi Tineco, evaluasi kepatuhan agen, dsb)..."
                  rows={4}
                  className="w-full p-3 text-xs sm:text-sm rounded-xl bg-[var(--c-offset)] border border-[var(--c-border)] text-[var(--c-text)] focus:outline-none focus:border-sky-500 transition-colors resize-none placeholder:text-[var(--c-muted)]"
                />
                <div className="absolute right-3 bottom-3 flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={!userPrompt.trim() || isExecuting}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    {isExecuting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Executing...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" /> Jalankan Copilot
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* AI Output Stream Box */}
            <div className="rounded-xl bg-[var(--c-offset)] border border-[var(--c-border)] p-4 space-y-3 min-h-[220px]">
              <div className="flex items-center justify-between border-b border-[var(--c-border)] pb-2 text-xs">
                <div className="flex items-center gap-2 font-semibold text-sky-400">
                  <Sparkles className="w-4 h-4" /> Response Output
                </div>
                {aiOutput ? (
                  <div className="flex items-center gap-3 text-[11px] text-[var(--c-muted)]">
                    {executionTimeMs && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-400" /> {executionTimeMs} ms
                      </span>
                    )}
                    {tokenCount && (
                      <span className="flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-sky-400" /> ~{tokenCount} tokens
                      </span>
                    )}
                    <button
                      onClick={handleCopyOutput}
                      className="flex items-center gap-1 text-[var(--c-muted)] hover:text-[var(--c-text)] transition-colors cursor-pointer"
                      title="Salin Hasil"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                ) : null}
              </div>

              {isExecuting ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-[var(--c-muted)]">
                  <RefreshCw className="w-7 h-7 text-sky-400 animate-spin" />
                  <p className="text-xs animate-pulse">Menghubungkan ke Vector Store & Memproses RAG Context...</p>
                </div>
              ) : aiOutput ? (
                <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-2">
                  <ReactMarkdown>{aiOutput}</ReactMarkdown>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-[var(--c-muted)] space-y-1">
                  <Bot className="w-8 h-8 mx-auto text-[var(--c-muted)]/50 mb-2" />
                  <p className="font-medium text-[var(--c-text)]">Copilot Siap Menerima Instruksi</p>
                  <p>Pilih prompt preset di sebelah kanan atau ketik pertanyaan langsung di kolom atas.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Prompt Template Library & Vector Health (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Prompt Presets */}
          <div className="p-5 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" /> Preset Prompt Library
              </h2>
              <span className="text-[11px] text-[var(--c-muted)]">
                {filteredTemplates.length} Template
              </span>
            </div>

            {/* Template Search Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--c-muted)]" />
              <input
                type="text"
                placeholder="Cari template prompt..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-[var(--c-offset)] border border-[var(--c-border)] text-[var(--c-text)] focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Template Cards */}
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {filteredTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl.prompt)}
                  className="p-3 rounded-lg bg-[var(--c-offset)] border border-[var(--c-border)] hover:border-sky-500/40 cursor-pointer transition-all duration-150 group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {tpl.icon}
                      <span className="text-xs font-semibold group-hover:text-sky-400 transition-colors">
                        {tpl.title}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-[var(--c-surface)] text-[var(--c-muted)] border border-[var(--c-border)]">
                      {tpl.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--c-muted)] leading-tight line-clamp-2">
                    {tpl.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* System Health & Recent Activity */}
          <div className="p-5 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)] shadow-sm space-y-3">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" /> Recent AI Engine Activity
            </h2>

            <div className="space-y-2">
              {INITIAL_ACTIVITIES.map((act) => (
                <div
                  key={act.id}
                  className="p-2.5 rounded-lg bg-[var(--c-offset)] border border-[var(--c-border)] flex items-start justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{act.action}</span>
                    </div>
                    <div className="text-[10px] text-[var(--c-muted)] flex items-center gap-2">
                      <span>Module: {act.module}</span>
                      <span>&bull;</span>
                      <span>{act.user}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[var(--c-muted)] whitespace-nowrap">
                    {act.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
