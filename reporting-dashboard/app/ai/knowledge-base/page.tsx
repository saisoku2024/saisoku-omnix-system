"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import {
  AlertTriangleIcon,
  ArchiveIcon,
  BotIcon,
  BookOpenIcon,
  CheckIcon,
  ClipboardIcon,
  DatabaseIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileTypeIcon,
  ImageIcon,
  LayersIcon,
  LinkIcon,
  Loader2Icon,
  RefreshCwIcon,
  SearchIcon,
  SendIcon,
  SparklesIcon,
  TypeIcon,
  UploadIcon,
  ZapIcon,
} from "lucide-react"

import { uploadFileToStorage } from "@/lib/storage-upload"

type SessionRole = "admin" | "super_admin" | "guest" | null
type KnowledgeInputMode = "file" | "text" | "url"
type UploadStage = "idle" | "uploading" | "processing"

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
const STORAGE_INGEST_API = "/api/backend/knowledge/storage-ingest"
const TEXT_API = "/api/backend/knowledge/text"
const URL_API = "/api/backend/knowledge/url"
const QUERY_API = "/api/backend/knowledge/query"
const BACKUP_EXPORT_API = "/api/backend/knowledge/backup/export"
const BACKUP_RESTORE_API = "/api/backend/knowledge/backup/restore"
const MAX_UPLOAD_FILE_SIZE_BYTES = 50 * 1024 * 1024

const QUICK_SUGGESTIONS = [
  "Garansi Tineco berapa lama?",
  "Cara retur di TikTok Shop?",
  "Deebot tidak bisa kembali ke dock",
  "Perbedaan Ecovacs T10 vs X1",
  "SOP service center Mitracare",
]

const PROCESSING_STAGE_MESSAGES = [
  "Mengirim ke AI pipeline...",
  "Memproses dokumen...",
  "Membagi ke chunks...",
  "Membuat embeddings...",
  "Menyimpan ke knowledge base...",
]

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function formatDate(value?: string) {
  if (!value) return "-"
  return new Date(value).toLocaleString("id-ID")
}

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
  return <FileTextIcon size={14} className="text-(--c-accent) shrink-0" />
}

function StatusBadge({ status }: { status: KnowledgeDocument["status"] }) {
  if (status === "ready")
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
        <span className="size-1.5 rounded-full bg-emerald-400" />
        Ready
      </span>
    )
  if (status === "processing")
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-blue-500/30 bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-400">
        <Loader2Icon size={9} className="animate-spin" />
        Processing
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-400">
      <span className="size-1.5 rounded-full bg-red-400" />
      Failed
    </span>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-(--c-border) bg-(--c-overlay) px-2.5 py-1.5 text-[11px] font-semibold text-(--c-muted) transition hover:border-(--c-accent) hover:text-(--c-accent)"
      title="Salin jawaban"
    >
      {copied ? <CheckIcon size={12} className="text-emerald-400" /> : <ClipboardIcon size={12} />}
      {copied ? "Tersalin!" : "Salin"}
    </button>
  )
}

function isValidWebUrl(urlStr: string): { valid: boolean; error?: string } {
  if (!/^https?:\/\/.+/i.test(urlStr)) {
    return { valid: false, error: "URL web harus diawali http:// atau https://" }
  }
  try {
    const parsed = new URL(urlStr)
    const hostname = parsed.hostname.toLowerCase()
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "0.0.0.0" ||
      hostname.startsWith("169.254.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    ) {
      return { valid: false, error: "URL internal/private network (localhost/IP private) tidak diizinkan untuk keamanan." }
    }
    return { valid: true }
  } catch {
    return { valid: false, error: "Format URL tidak valid." }
  }
}

export default function KnowledgeBasePage() {
  const [sessionRole, setSessionRole] = useState<SessionRole>(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [inconsistencies, setInconsistencies] = useState<KnowledgeInconsistency[]>([])
  const [loadingDocuments, setLoadingDocuments] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [addingText, setAddingText] = useState(false)
  const [addingUrl, setAddingUrl] = useState(false)
  const [asking, setAsking] = useState(false)
  const [title, setTitle] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [manualTitle, setManualTitle] = useState("")
  const [manualText, setManualText] = useState("")
  const [webTitle, setWebTitle] = useState("")
  const [webUrl, setWebUrl] = useState("")
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState<KnowledgeAnswer | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [inputMode, setInputMode] = useState<KnowledgeInputMode>("file")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStage, setUploadStage] = useState<UploadStage>("idle")
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const [processingStageIndex, setProcessingStageIndex] = useState(0)
  const [exportingBackup, setExportingBackup] = useState(false)
  const [restoringBackup, setRestoringBackup] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isAdmin = sessionRole === "admin" || sessionRole === "super_admin"
  const readyDocuments = useMemo(
    () => documents.filter((document) => document.status === "ready"),
    [documents]
  )
  const processingDocuments = useMemo(
    () => documents.filter((document) => document.status === "processing"),
    [documents]
  )
  const failedDocuments = useMemo(
    () => documents.filter((document) => document.status === "failed"),
    [documents]
  )
  const totalChunks = useMemo(
    () => readyDocuments.reduce((sum, doc) => sum + doc.chunk_count, 0),
    [readyDocuments]
  )

  const handleExportBackup = async () => {
    setExportingBackup(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch(BACKUP_EXPORT_API, { cache: "no-store" })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(readError(data, "Gagal mengunduh backup knowledge base"))
      }
      const blob = await response.blob()
      const contentDisposition = response.headers.get("Content-Disposition")
      let filename = `knowledge_backup_${new Date().toISOString().replace(/[:.]/g, "-")}.zip`
      if (contentDisposition && contentDisposition.includes("filename=")) {
        filename = contentDisposition.split("filename=")[1].replace(/"/g, "").trim()
      }
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      setSuccess(`Backup berhasil diunduh: ${filename}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunduh backup")
    } finally {
      setExportingBackup(false)
    }
  }

  const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile || !isAdmin) return

    setRestoringBackup(true)
    setError(null)
    setSuccess(null)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      const response = await fetch(BACKUP_RESTORE_API, { method: "POST", body: formData })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(readError(data, "Gagal memulihkan backup knowledge base"))
      setSuccess(
        `Backup berhasil dipulihkan! (${data.restored_documents || 0} dokumen & ${data.restored_chunks || 0} chunk restored)`
      )
      await loadDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memulihkan backup knowledge base")
    } finally {
      setRestoringBackup(false)
      event.target.value = ""
    }
  }

  const loadDocuments = async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoadingDocuments(true)
    setError(null)
    try {
      const [response, incResponse] = await Promise.all([
        fetch(DOCUMENT_API, { cache: "no-store" }),
        fetch(`${INCONSISTENCY_API}?limit=5`, { cache: "no-store" }),
      ])
      const data = await response.json().catch(() => ({}))
      const incData = await incResponse.json().catch(() => ({}))
      if (!response.ok) throw new Error(readError(data, "Gagal memuat dokumen knowledge base"))
      setDocuments(Array.isArray(data.documents) ? data.documents : [])
      if (Array.isArray(incData.inconsistencies)) setInconsistencies(incData.inconsistencies)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat dokumen knowledge base")
    } finally {
      if (!options?.silent) setLoadingDocuments(false)
    }
  }

  useEffect(() => {
    let active = true
    async function loadInitialData() {
      try {
        const [sessionResponse, documentsResponse, incResponse] = await Promise.all([
          fetch("/api/auth/session", { cache: "no-store" }),
          fetch(DOCUMENT_API, { cache: "no-store" }),
          fetch(`${INCONSISTENCY_API}?limit=5`, { cache: "no-store" }),
        ])
        const sessionData = (await sessionResponse.json().catch(() => ({}))) as { role?: SessionRole }
        const documentsData = await documentsResponse.json().catch(() => ({}))
        const incData = await incResponse.json().catch(() => ({}))
        if (!documentsResponse.ok) throw new Error(readError(documentsData, "Gagal memuat dokumen knowledge base"))
        if (active) {
          setSessionRole(sessionData.role ?? null)
          setDocuments(Array.isArray(documentsData.documents) ? documentsData.documents : [])
          if (Array.isArray(incData.inconsistencies)) setInconsistencies(incData.inconsistencies)
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Gagal memuat dokumen knowledge base")
      } finally {
        if (active) {
          setLoadingDocuments(false)
          setLoadingSession(false)
        }
      }
    }
    void loadInitialData()
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (processingDocuments.length === 0) return
    let pollCount = 0
    const MAX_POLL_RETRIES = 20 // Maksimal 20x polling (5 menit)
    const pollId = window.setInterval(() => {
      pollCount++
      if (pollCount > MAX_POLL_RETRIES) {
        window.clearInterval(pollId)
        return
      }
      void loadDocuments({ silent: true })
    }, 15000)
    return () => window.clearInterval(pollId)
  }, [processingDocuments.length])

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!isAdmin || files.length === 0) return
    setUploading(true)
    setError(null)
    setSuccess(null)
    let successCount = 0
    try {
      for (let i = 0; i < files.length; i++) {
        const selectedFile = files[i]
        if (selectedFile.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
          throw new Error(`File ${selectedFile.name} (${formatFileSize(selectedFile.size)}) terlalu besar. Batas maksimum ${formatFileSize(MAX_UPLOAD_FILE_SIZE_BYTES)}.`)
        }
        const storageFile = await uploadFileToStorage("knowledge", selectedFile, (progress) => {
          const overallProgress = Math.round(((i / files.length) * 100) + (progress / files.length))
          setUploadProgress(overallProgress)
        })
        const fileTitle = files.length === 1 && title.trim() ? title.trim() : selectedFile.name
        const response = await fetch(STORAGE_INGEST_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...storageFile, title: fileTitle }),
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(readError(data, `Gagal upload ${selectedFile.name}`))
        successCount++
      }
      setSuccess(`Berhasil memproses ${successCount} file knowledge document!`)
      setTitle("")
      setFiles([])
      setUploadProgress(0)
      // Reset native file input DOM element so picker visually clears
      if (fileInputRef.current) fileInputRef.current.value = ""
      await loadDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal upload batch knowledge document")
    } finally {
      setUploading(false)
    }
  }

  const handleAddText = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!isAdmin) return
    const cleanTitle = manualTitle.trim()
    const cleanText = manualText.trim()
    if (cleanTitle.length < 3) { setError("Judul manual knowledge minimal 3 karakter."); setSuccess(null); return }
    if (cleanText.length < 20) { setError("Isi manual knowledge minimal 20 karakter."); setSuccess(null); return }
    setAddingText(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch(TEXT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: cleanTitle, text: cleanText }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(readError(data, "Gagal menambahkan manual knowledge"))
      setSuccess(`Manual knowledge diproses: ${data.title || cleanTitle}`)
      setManualTitle("")
      setManualText("")
      await loadDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambahkan manual knowledge")
    } finally {
      setAddingText(false)
    }
  }

  const handleAddUrl = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!isAdmin) return
    const cleanTitle = webTitle.trim()
    const cleanUrl = webUrl.trim()
    const urlValidation = isValidWebUrl(cleanUrl)
    if (!urlValidation.valid) {
      setError(urlValidation.error || "URL web tidak valid.")
      setSuccess(null)
      return
    }
    setAddingUrl(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch(URL_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: cleanTitle || undefined, url: cleanUrl }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(readError(data, "Gagal menambahkan web URL knowledge"))
      setSuccess(`Web URL knowledge diproses: ${data.title || cleanUrl}`)
      setWebTitle("")
      setWebUrl("")
      await loadDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambahkan web URL knowledge")
    } finally {
      setAddingUrl(false)
    }
  }

  const handleAsk = async (event: React.FormEvent) => {
    event.preventDefault()
    const cleanQuestion = question.trim()
    if (!cleanQuestion || readyDocuments.length === 0) return
    setAsking(true)
    setError(null)
    setAnswer(null)
    try {
      const response = await fetch(QUERY_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: cleanQuestion, match_count: 6 }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(readError(data, "Gagal menjalankan query knowledge base"))
      setAnswer({
        answer: typeof data.answer === "string" ? data.answer : "",
        sources: Array.isArray(data.sources) ? data.sources : [],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menjalankan query knowledge base")
    } finally {
      setAsking(false)
    }
  }

  return (
    <main className="min-h-screen bg-(--c-bg) px-4 py-6 text-(--c-text) sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px] space-y-5">

        {/* ── HEADER ── */}
        <header className="relative overflow-hidden rounded-2xl border border-(--c-border) bg-(--c-surface) p-6 sm:p-8">
          {/* Google 4-Color Signature Top Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853]" />

          {/* Google Ambient glow orbs (Blue, Red, Yellow, Green) */}
          <div className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-[#4285F4]/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-[#EA4335]/8 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 size-72 rounded-full bg-[#FBBC05]/6 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 -bottom-20 size-80 rounded-full bg-[#34A853]/8 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-emerald-500/5" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 via-red-500/10 to-emerald-500/20 ring-1 ring-white/10 text-sky-400 shadow-inner">
                  <SparklesIcon size={17} className="text-[#4285F4]" />
                </span>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-sky-400 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-[#4285F4]" />
                    <span className="size-1.5 rounded-full bg-[#EA4335]" />
                    <span className="size-1.5 rounded-full bg-[#FBBC05]" />
                    <span className="size-1.5 rounded-full bg-[#34A853]" />
                  </span>
                  AI Workspace · Knowledge Engine
                </p>
              </div>
              <h1 className="mt-3 bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
                AI Knowledge Base
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-(--c-muted)">
                Upload SOP, FAQ, product guide, dan policy CS. PDF scan kecil akan diproses dengan <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#4285F4] via-[#EA4335] to-[#34A853]">OCR Gemini RAG</span>.
              </p>

              {/* KPI Stat Chips */}
              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/8 px-3.5 py-1.5">
                  <DatabaseIcon size={12} className="text-sky-400" />
                  <span className="text-xs font-bold text-sky-300">{readyDocuments.length}</span>
                  <span className="text-[11px] text-sky-400/70">dokumen ready</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/8 px-3.5 py-1.5">
                  <LayersIcon size={12} className="text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-300">{totalChunks}</span>
                  <span className="text-[11px] text-indigo-400/70">total chunks</span>
                </div>
                {processingDocuments.length > 0 && (
                  <div className="flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3.5 py-1.5">
                    <Loader2Icon size={12} className="animate-spin text-blue-400" />
                    <span className="text-xs font-bold text-blue-300">{processingDocuments.length}</span>
                    <span className="text-[11px] text-blue-400/70">diproses</span>
                  </div>
                )}
                {failedDocuments.length > 0 && (
                  <div className="flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3.5 py-1.5">
                    <AlertTriangleIcon size={12} className="text-red-400" />
                    <span className="text-xs font-bold text-red-300">{failedDocuments.length}</span>
                    <span className="text-[11px] text-red-400/70">gagal</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-start gap-2 sm:items-center">
              <button
                type="button"
                onClick={handleExportBackup}
                disabled={exportingBackup}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-(--c-border) bg-(--c-overlay) px-3.5 text-xs font-semibold text-(--c-text) transition-all duration-150 hover:border-sky-500/50 hover:bg-sky-500/8 hover:text-sky-400 disabled:opacity-50"
                title="Download backup lengkap Knowledge Base (.zip)"
              >
                {exportingBackup ? <Loader2Icon size={13} className="animate-spin" /> : <ArchiveIcon size={13} className="text-sky-400" />}
                Export Backup
              </button>

              {isAdmin && (
                <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-xl border border-(--c-border) bg-(--c-overlay) px-3.5 text-xs font-semibold text-(--c-text) transition-all duration-150 hover:border-emerald-500/50 hover:bg-emerald-500/8 hover:text-emerald-400">
                  {restoringBackup ? <Loader2Icon size={13} className="animate-spin" /> : <RefreshCwIcon size={13} className="text-emerald-400" />}
                  Restore Backup
                  <input type="file" accept=".zip" disabled={restoringBackup} onChange={handleRestoreBackup} className="hidden" />
                </label>
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
          <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-3 text-sm text-red-400 shadow-sm shadow-red-500/5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-red-500/15">
              <AlertTriangleIcon size={14} className="shrink-0" />
            </span>
            <span className="flex-1 text-[13px]">{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-400 shadow-sm shadow-emerald-500/5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
              <CheckIcon size={14} className="shrink-0" />
            </span>
            <span className="flex-1 text-[13px]">{success}</span>
          </div>
        )}

        {/* ── MAIN GRID ── */}
        <div className="grid gap-5 lg:grid-cols-[460px_1fr]">

          {/* ── LEFT PANEL ── */}
          <div className="space-y-4">

            {/* Add Knowledge Card */}
            <section className="rounded-2xl border border-(--c-border) bg-(--c-surface) p-5 shadow-sm">
              {/* Card Header */}
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/15 ring-1 ring-sky-500/25">
                  <BookOpenIcon size={15} className="text-sky-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold">Tambah Knowledge</h2>
                  <p className="text-[11px] text-(--c-muted)">Pilih sumber dokumen</p>
                </div>
              </div>

              {/* Premium Tab Pills */}
              <div className="flex gap-1.5 rounded-xl border border-(--c-border) bg-(--c-offset,--c-overlay) p-1">
                {[
                  { mode: "file" as const, label: "File", icon: UploadIcon, color: "text-sky-400", activeBg: "bg-sky-500/15 border-sky-500/30 text-sky-400" },
                  { mode: "text" as const, label: "Teks", icon: TypeIcon, color: "text-violet-400", activeBg: "bg-violet-500/15 border-violet-500/30 text-violet-400" },
                  { mode: "url" as const, label: "URL", icon: LinkIcon, color: "text-emerald-400", activeBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" },
                ].map((item) => {
                  const Icon = item.icon
                  const active = inputMode === item.mode
                  return (
                    <button
                      key={item.mode}
                      type="button"
                      onClick={() => setInputMode(item.mode)}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-bold transition-all duration-200 ${
                        active
                          ? item.activeBg + " shadow-sm"
                          : "border-transparent bg-transparent text-(--c-muted) hover:text-(--c-text)"
                      }`}
                    >
                      <Icon size={13} />
                      {item.label}
                    </button>
                  )
                })}
              </div>

              {/* File mode */}
              {inputMode === "file" && (
                <form onSubmit={handleUpload} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wide text-(--c-muted)">Judul Dokumen</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={!isAdmin || uploading}
                      placeholder="Contoh: SOP Refund Tineco 2026"
                      className="mt-1.5 h-10 w-full rounded-xl border border-(--c-border) bg-(--c-overlay) px-3 text-sm text-(--c-text) outline-none transition-all duration-150 placeholder:text-(--c-muted)/60 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/15 disabled:opacity-40"
                    />
                  </div>

                  {/* Drag-drop zone visual */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wide text-(--c-muted)">File Knowledge</label>
                    <label className={`mt-1.5 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-all duration-150 ${
                      files.length > 0
                        ? "border-sky-500/40 bg-sky-500/5"
                        : "border-(--c-border) bg-(--c-overlay) hover:border-sky-500/40 hover:bg-sky-500/5"
                    } ${!isAdmin || uploading ? "pointer-events-none opacity-40" : ""}`}>
                      <input
                        type="file"
                        multiple
                        disabled={!isAdmin || uploading}
                        onChange={(e) => {
                          const selectedFiles = Array.from(e.target.files || [])
                          setFiles(selectedFiles)
                          setSuccess(null)
                          const oversized = selectedFiles.find((f) => f.size > MAX_UPLOAD_FILE_SIZE_BYTES)
                          if (oversized) {
                            setError(`File ${oversized.name} (${formatFileSize(oversized.size)}) terlalu besar. Batas aman ${formatFileSize(MAX_UPLOAD_FILE_SIZE_BYTES)}.`)
                          } else {
                            setError(null)
                          }
                        }}
                        ref={fileInputRef}
                        accept=".txt,.md,.csv,.xlsx,.xls,.pdf,.docx,.pptx,.ppt,.jpg,.jpeg,.png,.webp"
                        className="hidden"
                      />
                      {files.length > 0 ? (
                        <>
                          <div className="flex size-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
                            <LayersIcon size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-sky-400">{files.length} file dipilih</p>
                            <p className="text-[11px] text-(--c-muted)">Total {formatFileSize(files.reduce((a, b) => a + b.size, 0))} · klik untuk ganti</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex size-10 items-center justify-center rounded-xl bg-(--c-overlay-2) text-(--c-muted)">
                            <UploadIcon size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-(--c-text)">Klik atau seret file ke sini</p>
                            <p className="mt-0.5 text-[11px] text-(--c-muted)">PDF · DOCX · XLSX · Gambar · TXT — maks {formatFileSize(MAX_UPLOAD_FILE_SIZE_BYTES)}</p>
                          </div>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Ingest Progress — multi-stage */}
                  {uploading && (
                    <div className="space-y-2 rounded-xl border border-sky-500/20 bg-sky-500/5 p-3.5">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                        <span className="flex min-w-0 items-center gap-1.5 text-sky-400">
                          {uploadStage === "uploading" ? (
                            <UploadIcon size={12} className="shrink-0" />
                          ) : (
                            <SparklesIcon size={12} className="shrink-0 animate-pulse" />
                          )}
                          <span className="truncate">
                            {uploadStage === "uploading"
                              ? "Mengunggah file ke storage..."
                              : PROCESSING_STAGE_MESSAGES[processingStageIndex]}
                          </span>
                        </span>
                        {uploadStage === "uploading" && (
                          <span className="shrink-0 font-mono text-sky-300">{uploadProgress}%</span>
                        )}
                      </div>
                      <div className="relative h-1.5 overflow-hidden rounded-full bg-(--c-overlay-2)">
                        {uploadStage === "uploading" ? (
                          <div
                            className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-300 ease-out"
                            style={{ width: `${uploadProgress}%` }}
                          >
                            <div className="kb-shimmer absolute inset-0" />
                          </div>
                        ) : (
                          <div className="kb-indeterminate absolute inset-y-0 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500" />
                        )}
                      </div>
                      {files.length > 1 && (
                        <p className="flex items-center gap-1 text-[10px] text-(--c-muted)">
                          <Loader2Icon size={10} className="animate-spin text-sky-400" />
                          File {currentFileIndex + 1} dari {files.length}
                        </p>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!isAdmin || files.length === 0 || uploading}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 text-xs font-bold text-white shadow-md shadow-sky-500/20 transition-all hover:opacity-90 hover:shadow-sky-500/30 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {uploading ? <Loader2Icon size={14} className="animate-spin" /> : <UploadIcon size={14} />}
                    {isAdmin ? (files.length > 1 ? `Ingest ${files.length} Files` : "Ingest File ke Knowledge Base") : "Guest: Read-only"}
                  </button>
                </form>
              )}

              {/* Text mode */}
              {inputMode === "text" && (
                <form onSubmit={handleAddText} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wide text-(--c-muted)">Judul Knowledge</label>
                    <input
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      disabled={!isAdmin || addingText}
                      placeholder="Contoh: Product Knowledge YONIEV"
                      className="mt-1.5 h-10 w-full rounded-xl border border-(--c-border) bg-(--c-overlay) px-3 text-sm text-(--c-text) outline-none transition-all duration-150 placeholder:text-(--c-muted)/60 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15 disabled:opacity-40"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wide text-(--c-muted)">Isi Knowledge</label>
                    <textarea
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      disabled={!isAdmin || addingText}
                      placeholder="Paste FAQ, spesifikasi produk, SOP, policy CS, atau catatan training di sini..."
                      rows={6}
                      className="mt-1.5 w-full resize-y rounded-xl border border-(--c-border) bg-(--c-overlay) px-3 py-2.5 text-sm leading-relaxed text-(--c-text) outline-none transition-all duration-150 placeholder:text-(--c-muted)/60 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15 disabled:opacity-40"
                    />
                    <p className="mt-1 text-[11px] text-(--c-muted)">{manualText.length} karakter · minimal 20</p>
                  </div>
                  <button
                    type="submit"
                    disabled={!isAdmin || addingText || manualTitle.trim().length < 3 || manualText.trim().length < 20}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 text-xs font-bold text-white shadow-md shadow-violet-500/20 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {addingText ? <Loader2Icon size={14} className="animate-spin" /> : <TypeIcon size={14} />}
                    {isAdmin ? "Simpan Manual Knowledge" : "Guest: Read-only"}
                  </button>
                </form>
              )}

              {/* URL mode */}
              {inputMode === "url" && (
                <form onSubmit={handleAddUrl} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wide text-(--c-muted)">Judul (Opsional)</label>
                    <input
                      value={webTitle}
                      onChange={(e) => setWebTitle(e.target.value)}
                      disabled={!isAdmin || addingUrl}
                      placeholder="Contoh: FAQ Product YONIEV"
                      className="mt-1.5 h-10 w-full rounded-xl border border-(--c-border) bg-(--c-overlay) px-3 text-sm text-(--c-text) outline-none transition-all duration-150 placeholder:text-(--c-muted)/60 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/15 disabled:opacity-40"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wide text-(--c-muted)">Link URL</label>
                    <div className="relative mt-1.5">
                      <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--c-muted)" />
                      <input
                        value={webUrl}
                        onChange={(e) => setWebUrl(e.target.value)}
                        disabled={!isAdmin || addingUrl}
                        placeholder="https://example.com/product/faq"
                        className="h-10 w-full rounded-xl border border-(--c-border) bg-(--c-overlay) pl-9 pr-3 text-sm text-(--c-text) outline-none transition-all duration-150 placeholder:text-(--c-muted)/60 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/15 disabled:opacity-40"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-(--c-muted)">Ekstrak konten dari product page, FAQ web, SOP online, atau artikel.</p>
                  </div>
                  <button
                    type="submit"
                    disabled={!isAdmin || addingUrl || !/^https?:\/\/.+/i.test(webUrl.trim())}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 text-xs font-bold text-white shadow-md shadow-emerald-500/20 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {addingUrl ? <Loader2Icon size={14} className="animate-spin" /> : <LinkIcon size={14} />}
                    {isAdmin ? "Crawl Web URL" : "Guest: Read-only"}
                  </button>
                </form>
              )}
            </section>

            {/* Documents List Card */}
            <section className="rounded-2xl border border-(--c-border) bg-(--c-surface) p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/15 ring-1 ring-indigo-500/25">
                    <FileTextIcon size={14} className="text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold">Dokumen Terbaru</h2>
                    <p className="text-[11px] text-(--c-muted)">{documents.length} total tersimpan</p>
                  </div>
                </div>
              </div>

              {loadingDocuments ? (
                <div className="space-y-2.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-(--c-border) bg-(--c-overlay) p-3 animate-pulse">
                      <div className="size-7 shrink-0 rounded-lg bg-(--c-border)" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-2.5 w-3/4 rounded-full bg-(--c-border)" />
                        <div className="h-2 w-1/2 rounded-full bg-(--c-border)" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : documents.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-(--c-border) p-6 text-center">
                  <DatabaseIcon size={24} className="text-(--c-muted)/40" />
                  <p className="text-xs text-(--c-muted)">Belum ada dokumen knowledge base.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.slice(0, 6).map((doc) => (
                    <div key={doc.id} className="group flex items-start gap-3 rounded-xl border border-(--c-border) bg-(--c-overlay) p-3 transition-all duration-150 hover:border-indigo-500/30 hover:bg-indigo-500/4 hover:shadow-sm">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-(--c-border) bg-(--c-surface)">
                        {getFileIcon(doc.title, doc.source_file)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-(--c-text) group-hover:text-indigo-300 transition-colors">{doc.title}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <StatusBadge status={doc.status} />
                          {doc.chunk_count > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-(--c-overlay-2) px-1.5 py-0.5 text-[10px] text-(--c-muted)">
                              <LayersIcon size={9} />{doc.chunk_count} chunks
                            </span>
                          )}
                        </div>
                        {doc.error_summary && (
                          <p className="mt-1 text-[11px] text-red-400 line-clamp-1">{doc.error_summary}</p>
                        )}
                        <p className="mt-1 text-[10px] text-(--c-muted)/70">{formatDate(doc.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Inconsistency Card */}
            <section className="rounded-2xl border border-amber-500/15 bg-(--c-surface) p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-500/25">
                    <AlertTriangleIcon size={14} className="text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-amber-300">Temuan Inconsistency</h2>
                    <p className="text-[11px] text-amber-400/60">Konflik data antar dokumen</p>
                  </div>
                </div>
                <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-400">
                  {inconsistencies.length} temuan
                </span>
              </div>
              {inconsistencies.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-amber-500/15 bg-emerald-500/4 p-4 text-center">
                  <span className="text-base">✅</span>
                  <p className="text-xs font-medium text-emerald-400">Tidak ada konflik data terdeteksi.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {inconsistencies.slice(0, 5).map((inc) => (
                    <div key={inc.id} className="rounded-xl border border-amber-500/15 bg-amber-500/4 p-3.5 space-y-2.5">
                      <div className="flex items-start justify-between gap-2 text-xs">
                        <div>
                          <span className="font-bold text-(--c-text)">{inc.entity_name}</span>
                          <span className="mx-1.5 text-(--c-muted)">·</span>
                          <span className="font-semibold text-amber-400">{inc.attribute_name}</span>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          inc.status === "resolved"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/15 text-amber-400"
                        }`}>
                          {inc.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="rounded-lg border border-red-500/15 bg-red-500/4 p-2.5">
                          <p className="font-semibold text-red-400/70 truncate text-[10px] uppercase tracking-wide">Sumber A</p>
                          <p className="truncate text-[11px] text-(--c-muted) mt-0.5">{inc.doc_a_title}</p>
                          <p className="mt-1.5 font-bold text-red-400">{inc.value_a}</p>
                        </div>
                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5">
                          <p className="font-semibold text-emerald-400/70 truncate text-[10px] uppercase tracking-wide">Sumber B</p>
                          <p className="truncate text-[11px] text-(--c-muted) mt-0.5">{inc.doc_b_title}</p>
                          <p className="mt-1.5 font-bold text-emerald-400">{inc.value_b}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* ── RIGHT PANEL: ASK AI ── */}
          <section className="relative overflow-hidden rounded-2xl border border-(--c-border) bg-(--c-surface) p-5 shadow-sm">
            {/* Top Google accent bar */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853]" />

            {/* Ambient glow */}
            <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-[#4285F4]/6 blur-3xl" />
            <div className="pointer-events-none absolute -left-16 -bottom-16 size-60 rounded-full bg-[#34A853]/5 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/4 via-transparent to-emerald-500/4 rounded-2xl" />

            <div className="relative">
              {/* Panel header */}
              <div className="mb-5 flex items-center gap-3 border-b border-(--c-border) pb-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 via-red-500/10 to-emerald-500/20 ring-1 ring-white/10 shadow-inner">
                  <BotIcon size={19} className="text-[#4285F4]" />
                </div>
                <div>
                  <h2 className="text-base font-bold">Ask Knowledge Base</h2>
                  <p className="text-[11px] text-(--c-muted)">Powered by <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#4285F4] via-[#EA4335] to-[#34A853]">Gemini RAG</span> · Vector Similarity Search</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="flex items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-500/8 px-3 py-1.5 text-[11px] font-bold text-sky-400">
                    <ZapIcon size={11} />
                    {readyDocuments.length} Docs Active
                  </span>
                </div>
              </div>

              {/* Search form — prominent gradient border on focus */}
              <form onSubmit={handleAsk} className="mb-4">
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <div className="group relative flex-1">
                    <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--c-muted) transition-colors group-focus-within:text-sky-400" />
                    <input
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      disabled={readyDocuments.length === 0}
                      placeholder={
                        readyDocuments.length > 0
                          ? "Tanya SOP, garansi, FAQ produk, atau policy CS..."
                          : "Upload dokumen dulu untuk aktifkan AI Query..."
                      }
                      className="h-12 w-full rounded-xl border border-(--c-border) bg-(--c-overlay) pl-10 pr-4 text-sm text-(--c-text) outline-none transition-all duration-150 placeholder:text-(--c-muted)/50 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/15 disabled:opacity-40"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={asking || !question.trim() || readyDocuments.length === 0}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4285F4] via-[#4285F4] to-[#34A853] px-6 text-sm font-bold text-white shadow-md shadow-blue-500/25 transition-all hover:opacity-90 hover:shadow-blue-500/35 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {asking ? <Loader2Icon size={16} className="animate-spin" /> : <SendIcon size={16} />}
                    Tanya AI
                  </button>
                </div>
              </form>

              {/* Quick suggestion pills */}
              {!answer && !asking && readyDocuments.length > 0 && (
                <div className="mb-5 flex flex-wrap gap-2">
                  {QUICK_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setQuestion(suggestion)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-(--c-border) bg-(--c-overlay) px-3 py-1.5 text-[11px] font-medium text-(--c-muted) transition-all duration-150 hover:border-sky-500/40 hover:bg-sky-500/8 hover:text-sky-300"
                    >
                      <SparklesIcon size={10} className="text-sky-400" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {/* States: Loading / Empty / Answer */}
              {asking ? (
                <div className="flex min-h-[380px] flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-sky-500/20 bg-sky-500/4 p-8 text-center">
                  <div className="relative flex size-20 items-center justify-center">
                    <div className="absolute inset-0 animate-ping rounded-full bg-sky-500/15" />
                    <div className="relative flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-500/15 ring-1 ring-sky-500/30">
                      <BotIcon size={36} className="text-sky-400 animate-pulse" />
                    </div>
                  </div>
                  <div>
                    <p className="text-base font-bold text-(--c-text)">Menelusuri Knowledge Base...</p>
                    <p className="mt-1 text-xs text-(--c-muted)">Sedang mencari konteks relevan & menyusun jawaban</p>
                  </div>
                  <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="size-2.5 rounded-full bg-sky-400/60 animate-bounce"
                        style={{ animationDelay: `${i * 0.18}s` }}
                      />
                    ))}
                  </div>
                </div>
              ) : !answer ? (
                <div className="flex min-h-[380px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-(--c-border) bg-(--c-overlay) p-8 text-center">
                  <div className="flex size-16 items-center justify-center rounded-2xl border border-(--c-border) bg-(--c-surface) text-(--c-muted)/50">
                    <BotIcon size={30} />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-(--c-text)">Tanyakan apa saja tentang produk & SOP</p>
                    <p className="mt-1.5 text-xs text-(--c-muted) max-w-xs">
                      {readyDocuments.length > 0
                        ? `${readyDocuments.length} dokumen aktif · klik saran di atas atau ketik pertanyaan Anda`
                        : "Upload dokumen di panel kiri untuk mengaktifkan AI Query Engine"}
                    </p>
                  </div>
                  {readyDocuments.length === 0 && (
                    <div className="flex items-center gap-2 rounded-xl border border-dashed border-sky-500/20 bg-sky-500/5 px-4 py-2.5 text-xs text-sky-400">
                      <UploadIcon size={13} /> Upload SOP, FAQ, atau product guide di panel kiri
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Answer card — premium with left accent bar */}
                  <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/5 to-indigo-500/4">
                    <div className="absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b from-sky-500 to-indigo-500" />
                    <div className="p-5 pl-6">
                      <div className="mb-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex size-6 items-center justify-center rounded-lg bg-sky-500/15">
                            <BotIcon size={13} className="text-sky-400" />
                          </div>
                          <span className="text-xs font-bold text-sky-400">Jawaban AI</span>
                          <span className="text-[10px] text-(--c-muted)">· {answer.sources.length} sumber ditemukan</span>
                        </div>
                        <CopyButton text={answer.answer} />
                      </div>
                      <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed text-(--c-text) [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-(--c-border) [&_td]:px-3 [&_td]:py-2 [&_td]:text-xs [&_th]:border [&_th]:border-(--c-border) [&_th]:bg-(--c-overlay-2) [&_th]:px-3 [&_th]:py-2 [&_th]:text-xs [&_th]:font-bold [&_code]:rounded [&_code]:bg-(--c-overlay-2) [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs [&_p]:text-(--c-text)">
                        <ReactMarkdown>{answer.answer}</ReactMarkdown>
                      </div>
                    </div>
                  </div>

                  {/* Sources */}
                  {answer.sources.length > 0 && (
                    <div>
                      <h3 className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-(--c-muted)">
                        <LayersIcon size={12} className="text-indigo-400" />
                        Sumber Referensi ({answer.sources.length})
                      </h3>
                      <div className="space-y-2">
                        {answer.sources.map((source) => (
                          <details key={source.chunk_id} className="group rounded-xl border border-(--c-border) bg-(--c-overlay) transition-all duration-150 hover:border-indigo-500/30 hover:shadow-sm">
                            <summary className="flex cursor-pointer list-none items-center gap-2.5 p-3.5">
                              <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-[11px] font-bold text-indigo-400 ring-1 ring-indigo-500/20">
                                {source.chunk_index + 1}
                              </div>
                              <span className="flex-1 truncate text-xs font-semibold text-(--c-text)">{source.title}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="shrink-0 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-400">
                                  {(Number(source.similarity || 0) * 100).toFixed(1)}%
                                </span>
                                <span className="text-[10px] text-(--c-muted) group-open:rotate-180 transition-transform duration-200">▾</span>
                              </div>
                            </summary>
                            <div className="border-t border-(--c-border) p-3.5">
                              <p className="line-clamp-6 whitespace-pre-wrap text-xs leading-5 text-(--c-muted)">
                                {source.content}
                              </p>
                            </div>
                          </details>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
