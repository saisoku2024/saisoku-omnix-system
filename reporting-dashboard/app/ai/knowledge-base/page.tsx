"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import type { Components } from "react-markdown"
import {
  AlertTriangleIcon,
  ArchiveIcon,
  BotIcon,
  BookOpenIcon,
  BrainIcon,
  CheckIcon,
  ClipboardIcon,
  DatabaseIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileTypeIcon,
  ImageIcon,
  LayersIcon,
  Loader2Icon,
  RefreshCwIcon,
  SearchIcon,
  SendIcon,
  SparklesIcon,
  Trash2Icon,
  XIcon,
  ZapIcon,
} from "lucide-react"

type SessionRole = "admin" | "super_admin" | "guest" | null

interface KnowledgeDocument {
  id: string
  title: string
  source_file?: string
  status: "processing" | "ready" | "failed"
  chunk_count: number
  created_by: string
  error_summary?: string
  created_at: string
}

interface KnowledgeInconsistency {
  id: string
  entity_name: string
  attribute_name: string
  conflict_type: string
  doc_a_title: string
  value_a: string
  doc_b_title: string
  value_b: string
  status: "unresolved" | "resolved" | "ignored"
  created_at: string
}

interface KnowledgeSource {
  chunk_id: string
  document_id: string
  title: string
  content: string
  chunk_index: number
  similarity: number
}

interface KnowledgeAnswer {
  answer: string
  sources: KnowledgeSource[]
}

const DOCUMENT_API = "/api/backend/knowledge/documents"
const INCONSISTENCY_API = "/api/backend/knowledge/inconsistencies"
const QUERY_API = "/api/backend/knowledge/query"
const BACKUP_EXPORT_API = "/api/backend/knowledge/backup/export"
const BACKUP_RESTORE_API = "/api/backend/knowledge/backup/restore"

const QUICK_SUGGESTIONS = [
  "Garansi Tineco berapa lama?",
  "Cara retur di TikTok Shop?",
  "Deebot tidak bisa kembali ke dock",
  "Perbedaan Ecovacs T90 vs T80",
  "SOP service center Mitracare",
]

function readError(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const data = payload as { detail?: unknown; error?: unknown; message?: unknown }
    const message = data.detail ?? data.error ?? data.message
    if (typeof message === "string" && message.trim()) return message
    if (Array.isArray(message)) {
      const firstMessage = message
        .map((item) => {
          if (typeof item === "string") return item
          if (item && typeof item === "object" && "msg" in item) {
            return String((item as { msg?: unknown }).msg ?? "")
          }
          return ""
        })
        .find(Boolean)
      if (firstMessage) return firstMessage
    }
    if (message && typeof message === "object") return JSON.stringify(message)
  }
  return fallback
}

function getFileIcon(title: string, sourceFile?: string) {
  const name = (sourceFile ?? title).toLowerCase()
  if (name.endsWith(".pdf")) return <FileTextIcon size={14} className="text-red-400 shrink-0" />
  if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv"))
    return <FileSpreadsheetIcon size={14} className="text-emerald-400 shrink-0" />
  if (name.endsWith(".docx") || name.endsWith(".doc"))
    return <FileTypeIcon size={14} className="text-blue-400 shrink-0" />
  if (name.match(/\.(jpg|jpeg|png|webp)$/))
    return <ImageIcon size={14} className="text-purple-400 shrink-0" />
  return <FileTextIcon size={14} className="text-[var(--c-accent)] shrink-0" />
}

export default function RAGQueryPage() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [inconsistencies, setInconsistencies] = useState<KnowledgeInconsistency[]>([])
  const [loadingDocuments, setLoadingDocuments] = useState(true)
  const [sessionRole, setSessionRole] = useState<SessionRole>(null)
  const [loadingSession, setLoadingSession] = useState(true)

  const [question, setQuestion] = useState("")
  const [querying, setQuerying] = useState(false)
  const [queryAnswer, setQueryAnswer] = useState<KnowledgeAnswer | null>(null)
  const [queryHistory, setQueryHistory] = useState<Array<{ question: string; answer: KnowledgeAnswer; time: string }>>([])
  const [copiedAnswer, setCopiedAnswer] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [exportingBackup, setExportingBackup] = useState(false)
  const [restoringBackup, setRestoringBackup] = useState(false)
  const [clearingAll, setClearingAll] = useState(false)

  const answerRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchSession = async () => {
    try {
      setLoadingSession(true)
      const res = await fetch("/api/auth/session")
      if (res.ok) {
        const data = await res.json()
        const role = data?.user?.role as SessionRole
        setSessionRole(role || "guest")
      } else {
        setSessionRole("guest")
      }
    } catch {
      setSessionRole("guest")
    } finally {
      setLoadingSession(false)
    }
  }

  const fetchDocuments = async () => {
    try {
      setLoadingDocuments(true)
      const res = await fetch(`${DOCUMENT_API}?limit=50`)
      const data = await res.json()
      if (!res.ok) throw new Error(readError(data, "Gagal mengambil dokumen"))
      setDocuments(data.documents || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat dokumen")
    } finally {
      setLoadingDocuments(false)
    }
  }

  const fetchInconsistencies = async () => {
    try {
      const res = await fetch(INCONSISTENCY_API)
      const data = await res.json()
      if (!res.ok) return
      setInconsistencies(data.inconsistencies || [])
    } catch {
      // Ignore
    }
  }

  useEffect(() => {
    fetchSession()
    fetchDocuments()
    fetchInconsistencies()
  }, [])

  // Auto-dismiss success banner setelah 4 detik
  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => setSuccess(null), 4000)
    return () => clearTimeout(t)
  }, [success])

  const isAdmin = sessionRole === "admin" || sessionRole === "super_admin"

  const readyDocuments = useMemo(() => documents.filter((d) => d.status === "ready"), [documents])
  const totalChunks = useMemo(() => readyDocuments.reduce((acc, d) => acc + (d.chunk_count || 0), 0), [readyDocuments])
  const unresolvedInconsistencies = useMemo(
    () => inconsistencies.filter((i) => i.status === "unresolved"),
    [inconsistencies]
  )

  const handleQuery = async (e?: React.FormEvent, customQ?: string) => {
    if (e) e.preventDefault()
    const q = (customQ ?? question).trim()
    if (!q || querying) return

    // Abort request sebelumnya agar tidak terjadi race condition
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    try {
      setQuerying(true)
      setQueryError(null)
      setQueryAnswer(null)

      const res = await fetch(QUERY_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, match_count: 6 }),
        signal: abortControllerRef.current.signal,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(readError(data, "Gagal memproses pertanyaan RAG"))

      const answerObj: KnowledgeAnswer = {
        answer: data.answer || "Tidak ada jawaban yang dihasilkan.",
        sources: data.sources || [],
      }
      setQueryAnswer(answerObj)
      setQueryHistory((prev) => [{ question: q, answer: answerObj, time: new Date().toLocaleTimeString("id-ID") }, ...prev])

      setTimeout(() => {
        answerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return
      setQueryError(err instanceof Error ? err.message : "Gagal bertanya ke RAG AI")
    } finally {
      setQuerying(false)
    }
  }

  const handleCopyAnswer = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedAnswer(true)
    setTimeout(() => setCopiedAnswer(false), 2000)
  }

  const handleExportBackup = async () => {
    try {
      setExportingBackup(true)
      setError(null)
      const res = await fetch(BACKUP_EXPORT_API)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(readError(data, "Gagal export backup"))
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `knowledge-base-backup-${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      setSuccess("Backup Knowledge Base berhasil didownload (.zip)!")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal export backup")
    } finally {
      setExportingBackup(false)
    }
  }

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setRestoringBackup(true)
      setError(null)
      setSuccess(null)

      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch(BACKUP_RESTORE_API, {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(readError(data, "Gagal restore backup"))

      setSuccess(`Backup berhasil di-restore! (${data.restored_documents} dokumen, ${data.restored_chunks} chunks).`)
      fetchDocuments()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal restore backup")
    } finally {
      setRestoringBackup(false)
      e.target.value = ""
    }
  }

  const handleClearAll = async () => {
    if (!confirm("⚠️ APAKAH ANDA YAKIN?\nSeluruh dokumen & vector chunk di Knowledge Base akan DIHAPUS PERMANEN!")) return

    try {
      setClearingAll(true)
      setError(null)
      const res = await fetch(DOCUMENT_API, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(readError(data, "Gagal mengosongkan database"))

      setSuccess("Database Knowledge Base telah dikosongkan!")
      fetchDocuments()
      setQueryAnswer(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mengosongkan database")
    } finally {
      setClearingAll(false)
    }
  }

  const markdownComponents: Components = {
    h1: ({ children }) => <h1 className="mt-4 mb-2 text-base font-bold text-(--c-text)">{children}</h1>,
    h2: ({ children }) => <h2 className="mt-3 mb-1.5 text-sm font-bold text-sky-400">{children}</h2>,
    h3: ({ children }) => <h3 className="mt-2 mb-1 text-xs font-semibold text-(--c-text)">{children}</h3>,
    p: ({ children }) => <p className="mb-2 text-xs leading-relaxed text-(--c-text)/90">{children}</p>,
    ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1 text-xs">{children}</ul>,
    ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1 text-xs">{children}</ol>,
    li: ({ children }) => <li className="text-xs text-(--c-text)/90">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="my-2 border-l-2 border-sky-500/50 bg-sky-500/5 py-1.5 pl-3 text-xs italic text-sky-300/90">
        {children}
      </blockquote>
    ),
    table: ({ children }) => (
      <div className="my-3 overflow-x-auto rounded-xl border border-(--c-border) bg-(--c-surface)">
        <table className="w-full text-left text-xs">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-(--c-overlay) border-b border-(--c-border) font-bold text-sky-400">{children}</thead>,
    tbody: ({ children }) => <tbody className="divide-y divide-(--c-border)/50">{children}</tbody>,
    tr: ({ children }) => <tr className="transition-colors hover:bg-(--c-overlay)/50">{children}</tr>,
    th: ({ children }) => <th className="px-3 py-2 text-[11px] font-bold tracking-wide uppercase">{children}</th>,
    td: ({ children }) => <td className="px-3 py-2 text-xs text-(--c-text)/90">{children}</td>,
    code: ({ children }) => (
      <code className="rounded bg-(--c-overlay) px-1.5 py-0.5 font-mono text-[11px] text-sky-300 border border-(--c-border)">
        {children}
      </code>
    ),
  }

  return (
    <div className="min-h-screen bg-(--c-bg) text-(--c-text) transition-colors duration-200">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">

        {/* ── HEADER BAR ── */}
        <header className="relative overflow-hidden rounded-2xl border border-(--c-border) bg-gradient-to-r from-(--c-surface) via-(--c-surface) to-sky-950/20 p-5 sm:p-6 shadow-sm">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 size-64 rounded-full bg-gradient-to-br from-sky-500/10 via-indigo-500/5 to-transparent blur-3xl pointer-events-none" />

          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30">
                  <BotIcon size={16} />
                </span>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-sky-400/80 flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-sky-400/70" />
                  RAG System · Ask AI
                </p>
              </div>
              <h1 className="mt-1.5 bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-[1.6rem] font-extrabold tracking-tight text-transparent sm:text-[2rem] leading-tight">
                Tanya AI Knowledge Base
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-(--c-muted)">
                Asisten AI cerdas untuk menjawab pertanyaan seputar SOP CS, spesifikasi produk, dan troubleshooting berdasarkan basis data terverifikasi.
              </p>

              {/* RAG Explanation Strip */}
              <div className="mt-3 flex flex-wrap items-center gap-0 rounded-xl border border-sky-500/15 bg-sky-500/5 px-4 py-2.5 text-[11px]">
                <span className="mr-2 font-semibold text-sky-400/70 uppercase tracking-widest text-[10px]">Cara kerja:</span>
                <span className="flex items-center gap-1.5">
                  <span className="flex size-5 items-center justify-center rounded-md bg-sky-500/15 text-sky-400 font-bold text-[10px]">1</span>
                  <span className="text-[var(--c-muted)]"><span className="font-semibold text-[var(--c-text)]">Retrieve</span> — mencari potongan dokumen paling relevan dari Knowledge Base</span>
                </span>
                <span className="mx-2.5 text-[var(--c-border)]">→</span>
                <span className="flex items-center gap-1.5">
                  <span className="flex size-5 items-center justify-center rounded-md bg-indigo-500/15 text-indigo-400 font-bold text-[10px]">2</span>
                  <span className="text-[var(--c-muted)]"><span className="font-semibold text-[var(--c-text)]">Augment</span> — menyertakan konteks dokumen ke dalam prompt AI</span>
                </span>
                <span className="mx-2.5 text-[var(--c-border)]">→</span>
                <span className="flex items-center gap-1.5">
                  <span className="flex size-5 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400 font-bold text-[10px]">3</span>
                  <span className="text-[var(--c-muted)]"><span className="font-semibold text-[var(--c-text)]">Generate</span> — AI merangkai jawaban akurat berbasis sumber terverifikasi</span>
                </span>
              </div>

              {/* KPI Stat Chips */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-500/8 px-3 py-1">
                  <DatabaseIcon size={11} className="text-sky-400" />
                  <span className="text-xs font-bold text-sky-300">{readyDocuments.length}</span>
                  <span className="text-[10px] text-sky-400/70">dokumen aktif</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/8 px-3 py-1">
                  <LayersIcon size={11} className="text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-300">{totalChunks}</span>
                  <span className="text-[10px] text-indigo-400/70">total chunks</span>
                </div>
                {unresolvedInconsistencies.length > 0 && (
                  <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1">
                    <AlertTriangleIcon size={11} className="text-amber-400" />
                    <span className="text-xs font-bold text-amber-300">{unresolvedInconsistencies.length}</span>
                    <span className="text-[10px] text-amber-400/70">inkonsistensi data</span>
                  </div>
                )}
              </div>

            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/dashboard/ai/knowledge-base"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 text-xs font-bold text-white shadow-md shadow-sky-500/20 transition-all hover:opacity-95 hover:shadow-sky-500/30"
              >
                <BrainIcon size={15} />
                Dokumentasi & Upload KB →
              </a>

              {isAdmin && (
                <button
                  type="button"
                  onClick={handleExportBackup}
                  disabled={exportingBackup}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-(--c-border) bg-(--c-overlay) px-3.5 text-xs font-semibold text-(--c-text) transition-all duration-150 hover:border-sky-500/50 hover:bg-sky-500/8 hover:text-sky-400 disabled:opacity-50"
                  title="Download backup lengkap Knowledge Base (.zip)"
                >
                  {exportingBackup ? <Loader2Icon size={14} className="animate-spin" /> : <ArchiveIcon size={14} className="text-sky-400" />}
                  Export Backup
                </button>
              )}

              {isAdmin && (
                <>
                  <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-(--c-border) bg-(--c-overlay) px-3.5 text-xs font-semibold text-(--c-text) transition-all duration-150 hover:border-emerald-500/50 hover:bg-emerald-500/8 hover:text-emerald-400">
                    {restoringBackup ? <Loader2Icon size={14} className="animate-spin" /> : <RefreshCwIcon size={14} className="text-emerald-400" />}
                    Restore
                    <input type="file" accept=".zip" disabled={restoringBackup} onChange={handleRestoreBackup} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    disabled={clearingAll}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 text-xs font-semibold text-red-400 transition-all duration-150 hover:border-red-500/60 hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50"
                    title="Kosongkan seluruh dokumen dan vector chunk di Knowledge Base"
                  >
                    {clearingAll ? <Loader2Icon size={14} className="animate-spin" /> : <Trash2Icon size={14} className="text-red-400" />}
                    Reset DB
                  </button>
                </>
              )}

              <div className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold ${
                loadingSession
                  ? "border-(--c-border) bg-(--c-overlay) text-(--c-muted)"
                  : isAdmin
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-(--c-border) bg-(--c-overlay) text-(--c-muted)"
              }`}>
                {loadingSession ? (
                  <><Loader2Icon size={11} className="animate-spin" /> Memeriksa Akses...</>
                ) : isAdmin ? (
                  <>⚡ Admin Mode</>
                ) : (
                  <>🔒 Guest Read-only</>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ── ALERTS ── */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-3 text-sm text-red-400 shadow-sm">
            <AlertTriangleIcon size={16} className="shrink-0" />
            <span className="flex-1 text-[13px]">{error}</span>
            <button onClick={() => setError(null)} className="shrink-0 text-red-400/60 hover:text-red-300"><XIcon size={14} /></button>
          </div>
        )}
        {queryError && (
          <div className="flex items-center gap-3 rounded-xl border border-orange-500/30 bg-orange-500/8 px-4 py-3 text-sm text-orange-400 shadow-sm">
            <AlertTriangleIcon size={16} className="shrink-0" />
            <span className="flex-1 text-[13px]">{queryError}</span>
            <button onClick={() => setQueryError(null)} className="shrink-0 text-orange-400/60 hover:text-orange-300"><XIcon size={14} /></button>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-400 shadow-sm">
            <CheckIcon size={16} className="shrink-0" />
            <span className="flex-1 text-[13px]">{success}</span>
          </div>
        )}

        {/* ── MAIN CONTENT GRID ── */}
        <div className="grid gap-6 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_340px]">

          {/* ── LEFT/MAIN AREA: RAG SEARCH & ANSWER GENERATOR ── */}
          <div className="space-y-6">

            {/* Query Input Card */}
            <section className="rounded-2xl border border-(--c-border) bg-(--c-surface) p-5 sm:p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30">
                    <SparklesIcon size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-(--c-text)">Pencarian & Tanya AI</h2>
                    <p className="text-xs text-(--c-muted)">Ketik pertanyaan atau pilih saran cepat di bawah</p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1 text-[11px] text-(--c-muted)">
                  <ZapIcon size={12} className="text-sky-400" />
                  Hybrid Vector Search
                </div>
              </div>

              <form onSubmit={(e) => handleQuery(e)} className="space-y-4">
                <div className="relative">
                  <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-(--c-muted)" />
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Contoh: Perbandingan Ecovacs T90 PRO OMNI dan T80 OMNI..."
                    className="h-12 w-full rounded-2xl border border-(--c-border) bg-(--c-overlay) pl-11 pr-28 text-sm text-(--c-text) outline-none transition-all duration-150 placeholder:text-(--c-muted)/60 focus:border-sky-500/60 focus:ring-4 focus:ring-sky-500/10"
                  />
                  <button
                    type="submit"
                    disabled={querying || !question.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-[34px] items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-3.5 text-xs font-bold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-40"
                  >
                    {querying ? <Loader2Icon size={14} className="animate-spin" /> : <SendIcon size={13} />}
                    Tanyakan
                  </button>
                </div>

                {/* Quick Suggestions Pills */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-(--c-muted)">Saran Pertanyaan Cepat:</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_SUGGESTIONS.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setQuestion(sug)
                          handleQuery(undefined, sug)
                        }}
                        disabled={querying}
                        className="rounded-xl border border-(--c-border) bg-(--c-overlay) px-3 py-1.5 text-xs font-medium text-(--c-text)/80 transition-all hover:border-sky-500/40 hover:bg-sky-500/8 hover:text-sky-400 disabled:opacity-50"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            </section>

            {/* Answer Display */}
            {queryAnswer && (
              <section ref={answerRef} className="rounded-2xl border border-sky-500/30 bg-gradient-to-b from-sky-950/20 via-(--c-surface) to-(--c-surface) p-5 sm:p-6 shadow-md space-y-5">
                <div className="flex items-center justify-between border-b border-(--c-border) pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
                      <BotIcon size={16} />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white">Jawaban AI RAG Engine</h3>
                      <p className="text-[11px] text-(--c-muted)">Berdasarkan {queryAnswer.sources.length} sumber referensi dokumen</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyAnswer(queryAnswer.answer)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-(--c-border) bg-(--c-overlay) px-3 py-1.5 text-xs font-semibold text-(--c-text) hover:border-sky-500/40 hover:text-sky-400"
                  >
                    {copiedAnswer ? <CheckIcon size={13} className="text-emerald-400" /> : <ClipboardIcon size={13} />}
                    {copiedAnswer ? "Tersalin!" : "Salin Jawaban"}
                  </button>
                </div>

                {/* Markdown Text */}
                <div className="prose prose-invert max-w-none text-xs leading-relaxed">
                  <ReactMarkdown components={markdownComponents}>{queryAnswer.answer}</ReactMarkdown>
                </div>

                {/* Sources / Citations */}
                {queryAnswer.sources.length > 0 && (
                  <div className="border-t border-(--c-border) pt-3 space-y-2">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-sky-400/70 flex items-center gap-1.5">
                      <BookOpenIcon size={12} />
                      Sumber ({queryAnswer.sources.length} dokumen)
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {queryAnswer.sources.map((src, idx) => (
                        <div
                          key={idx}
                          title={src.title}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-(--c-border) bg-(--c-overlay) px-2.5 py-1.5 text-xs"
                        >
                          {getFileIcon(src.title)}
                          <span className="max-w-[200px] truncate font-medium text-(--c-text)/75">
                            {src.title}
                          </span>
                          <span className="shrink-0 font-mono text-[10px] text-emerald-400/60">
                            {(src.similarity * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Recent History */}
            {queryHistory.length > 0 && (
              <section className="rounded-2xl border border-(--c-border) bg-(--c-surface) p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-(--c-muted)">Riwayat Pertanyaan Sesi Ini</h3>
                <div className="space-y-2">
                  {queryHistory.slice(1, 5).map((item, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setQuestion(item.question)
                        setQueryAnswer(item.answer)
                      }}
                      className="cursor-pointer rounded-xl border border-(--c-border) bg-(--c-overlay) p-3 transition-all hover:border-sky-500/40 hover:bg-sky-500/5"
                    >
                      <p className="text-xs font-semibold text-sky-400">{item.question}</p>
                      <p className="mt-1 line-clamp-1 text-[11px] text-(--c-muted)">{item.answer.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── RIGHT PANEL: KNOWLEDGE BASE STATUS & MANAGEMENT SHORTCUT ── */}
          <div className="space-y-5">



            {/* Active Knowledge Documents Summary */}
            <section className="rounded-2xl border border-(--c-border) bg-(--c-surface) p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-(--c-border) pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-(--c-muted)">Dokumen Terbaru ({documents.length})</h3>
                <a href="/dashboard/ai/knowledge-base" className="text-[11px] font-semibold text-sky-400 hover:underline">
                  Lihat Semua
                </a>
              </div>

              {loadingDocuments ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 animate-pulse rounded-xl bg-(--c-overlay)" />
                  ))}
                </div>
              ) : documents.length === 0 ? (
                <p className="text-xs text-(--c-muted) text-center py-4">Belum ada dokumen di Knowledge Base.</p>
              ) : (
                <div className="space-y-2">
                  {documents.slice(0, 5).map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between gap-2 rounded-xl border border-(--c-border) bg-(--c-overlay) p-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {getFileIcon(doc.title, doc.source_file)}
                        <span className="truncate text-xs font-medium text-(--c-text)" title={doc.title}>
                          {doc.title}
                        </span>
                      </div>
                      <span className="shrink-0 text-[10px] font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                        {doc.chunk_count || 0} chunks
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Inconsistency Alerts Card */}
            {unresolvedInconsistencies.length > 0 && (
              <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangleIcon size={16} />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Deteksi Inkonsistensi Data ({unresolvedInconsistencies.length})</h3>
                </div>

                <div className="space-y-2">
                  {unresolvedInconsistencies.slice(0, 3).map((inc) => (
                    <div key={inc.id} className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-200">
                      <p className="font-bold">{inc.entity_name} · {inc.attribute_name}</p>
                      <p className="text-[11px] opacity-80">{inc.doc_a_title}: {inc.value_a} vs {inc.doc_b_title}: {inc.value_b}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>

        </div>

      </div>
    </div>
  )
}
