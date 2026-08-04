"use client"

import { useEffect, useMemo, useState } from "react"
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

export default function KnowledgeBasePage() {
  const [sessionRole, setSessionRole] = useState<SessionRole>(null)
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
  const [exportingBackup, setExportingBackup] = useState(false)
  const [restoringBackup, setRestoringBackup] = useState(false)

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
        if (active) setLoadingDocuments(false)
      }
    }
    void loadInitialData()
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (processingDocuments.length === 0) return
    const pollId = window.setInterval(() => { void loadDocuments({ silent: true }) }, 15000)
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
    if (!/^https?:\/\/.+/i.test(cleanUrl)) { setError("URL web harus diawali http:// atau https://."); setSuccess(null); return }
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
    <main className="min-h-screen bg-(--c-bg) px-4 py-8 text-(--c-text) sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-[1400px] space-y-6">

        {/* ── HEADER ── */}
        <header className="relative overflow-hidden rounded-2xl border border-(--c-border) bg-(--c-surface) p-6 sm:p-8">
          {/* Background gradient glow */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-(--c-accent)/8 via-transparent to-transparent" />
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-(--c-accent)/5 blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-(--c-accent)/15 text-(--c-accent)">
                  <SparklesIcon size={16} />
                </span>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-(--c-accent)">
                  AI Workspace
                </p>
              </div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-(--c-text) sm:text-4xl">
                AI Knowledge Base
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-(--c-muted)">
                Upload SOP, FAQ, product guide, dan policy CS untuk dipakai sebagai sumber jawaban RAG. PDF scan kecil akan dibaca dengan OCR Gemini.
              </p>
              {/* Stats row */}
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-(--c-muted)">
                  <DatabaseIcon size={12} className="text-(--c-accent)" />
                  <span className="font-bold text-(--c-text)">{readyDocuments.length}</span> dokumen ready
                </div>
                <div className="h-3 w-px bg-(--c-border)" />
                <div className="flex items-center gap-1.5 text-xs text-(--c-muted)">
                  <LayersIcon size={12} className="text-(--c-accent)" />
                  <span className="font-bold text-(--c-text)">{totalChunks}</span> total chunks
                </div>
                {processingDocuments.length > 0 && (
                  <>
                    <div className="h-3 w-px bg-(--c-border)" />
                    <div className="flex items-center gap-1.5 text-xs text-blue-400">
                      <Loader2Icon size={12} className="animate-spin" />
                      <span className="font-bold">{processingDocuments.length}</span> sedang diproses
                    </div>
                  </>
                )}
                {failedDocuments.length > 0 && (
                  <>
                    <div className="h-3 w-px bg-(--c-border)" />
                    <div className="flex items-center gap-1.5 text-xs text-red-400">
                      <span className="font-bold">{failedDocuments.length}</span> gagal
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                disabled={exportingBackup}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-(--c-border) bg-(--c-overlay) px-3 text-xs font-semibold text-(--c-text) transition hover:border-(--c-accent) hover:text-(--c-accent) disabled:opacity-50"
                title="Download backup lengkap Knowledge Base ke komputer (.zip)"
              >
                {exportingBackup ? <Loader2Icon size={14} className="animate-spin" /> : <ArchiveIcon size={14} className="text-(--c-accent)" />}
                <span>Export Backup</span>
              </button>

              {isAdmin && (
                <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-xl border border-(--c-border) bg-(--c-overlay) px-3 text-xs font-semibold text-(--c-text) transition hover:border-(--c-accent) hover:text-(--c-accent)">
                  {restoringBackup ? <Loader2Icon size={14} className="animate-spin" /> : <RefreshCwIcon size={14} className="text-emerald-400" />}
                  <span>Restore Backup</span>
                  <input type="file" accept=".zip" disabled={restoringBackup} onChange={handleRestoreBackup} className="hidden" />
                </label>
              )}

              <div className={`rounded-xl border px-3 py-2 text-xs font-semibold ${isAdmin ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-(--c-border) bg-(--c-overlay) text-(--c-muted)"}`}>
                {isAdmin ? "⚡ Admin Mode" : "Guest: Read-only"}
              </div>
            </div>
          </div>
        </header>

        {/* ── ALERTS ── */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            <AlertTriangleIcon size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">
            <CheckIcon size={16} className="mt-0.5 shrink-0" />
            {success}
          </div>
        )}

        {/* ── MAIN GRID ── */}
        <div className="grid gap-5 lg:grid-cols-[440px_1fr]">

          {/* ── LEFT PANEL ── */}
          <div className="space-y-5">

            {/* Add Knowledge Card */}
            <section className="rounded-2xl border border-(--c-border) bg-(--c-surface) p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-(--c-accent)/15">
                  <BookOpenIcon size={14} className="text-(--c-accent)" />
                </div>
                <h2 className="text-base font-bold">Add Knowledge</h2>
              </div>

              {/* Tab switcher */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { mode: "file" as const, label: "File Upload", icon: UploadIcon },
                  { mode: "text" as const, label: "Teks Manual", icon: TypeIcon },
                  { mode: "url" as const, label: "Web URL", icon: LinkIcon },
                ].map((item) => {
                  const Icon = item.icon
                  const active = inputMode === item.mode
                  return (
                    <button
                      key={item.mode}
                      type="button"
                      onClick={() => setInputMode(item.mode)}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border py-3 text-[11px] font-bold transition-all duration-200 ${
                        active
                          ? "border-(--c-accent) bg-(--c-accent)/15 text-(--c-accent) shadow-sm"
                          : "border-(--c-border) bg-(--c-overlay) text-(--c-muted) hover:border-(--c-accent)/50 hover:text-(--c-text)"
                      }`}
                    >
                      <Icon size={15} />
                      {item.label}
                    </button>
                  )
                })}
              </div>

              {/* File mode */}
              {inputMode === "file" && (
                <form onSubmit={handleUpload} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-(--c-muted)">Judul dokumen</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={!isAdmin || uploading}
                      placeholder="Contoh: SOP Refund Tineco"
                      className="mt-1 h-10 w-full rounded-xl border border-(--c-border) bg-(--c-overlay) px-3 text-xs text-(--c-text) outline-none transition focus:border-(--c-accent) focus:ring-1 focus:ring-(--c-accent)/30 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--c-muted)">File knowledge</label>
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
                      accept=".txt,.md,.csv,.xlsx,.xls,.pdf,.docx,.pptx,.ppt,.jpg,.jpeg,.png,.webp"
                      className="mt-1 block w-full rounded-xl border border-(--c-border) bg-(--c-overlay) px-3 py-2 text-xs text-(--c-text) disabled:opacity-50"
                    />
                    <span className="mt-1 block text-[11px] text-(--c-muted)">
                      {files.length > 0
                        ? `📌 ${files.length} file dipilih (Total ${formatFileSize(files.reduce((a, b) => a + b.size, 0))})`
                        : `PDF, DOCX, XLSX, Gambar, TXT — maks. ${formatFileSize(MAX_UPLOAD_FILE_SIZE_BYTES)} per file`}
                    </span>
                  </div>
                  {uploading && (
                    <div className="rounded-xl border border-(--c-border) bg-(--c-overlay) p-3">
                      <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-(--c-muted)">
                        <span>Memproses Ingest Bulk...</span>
                        <span className="text-(--c-accent)">{uploadProgress}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-(--c-overlay-2)">
                        <div className="h-full rounded-full bg-(--c-accent) transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={!isAdmin || files.length === 0 || uploading}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-(--c-accent) px-4 text-xs font-bold text-(--c-bg) transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploading ? <Loader2Icon size={14} className="animate-spin" /> : <UploadIcon size={14} />}
                    {isAdmin ? (files.length > 1 ? `Ingest ${files.length} Files` : "Ingest File") : "Guest read-only"}
                  </button>
                </form>
              )}

              {/* Text mode */}
              {inputMode === "text" && (
                <form onSubmit={handleAddText} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-(--c-muted)">Judul knowledge</label>
                    <input
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      disabled={!isAdmin || addingText}
                      placeholder="Contoh: Product Knowledge YONIEV"
                      className="mt-1 h-10 w-full rounded-xl border border-(--c-border) bg-(--c-overlay) px-3 text-xs text-(--c-text) outline-none transition focus:border-(--c-accent) focus:ring-1 focus:ring-(--c-accent)/30 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--c-muted)">Isi knowledge</label>
                    <textarea
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      disabled={!isAdmin || addingText}
                      placeholder="Paste FAQ, spesifikasi produk, SOP, policy CS, atau catatan training di sini..."
                      rows={6}
                      className="mt-1 w-full resize-y rounded-xl border border-(--c-border) bg-(--c-overlay) px-3 py-2.5 text-xs leading-5 text-(--c-text) outline-none transition focus:border-(--c-accent) focus:ring-1 focus:ring-(--c-accent)/30 disabled:opacity-50"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!isAdmin || addingText || manualTitle.trim().length < 3 || manualText.trim().length < 20}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-(--c-accent) px-4 text-xs font-bold text-(--c-bg) transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {addingText ? <Loader2Icon size={14} className="animate-spin" /> : <TypeIcon size={14} />}
                    {isAdmin ? "Add Manual Text" : "Guest read-only"}
                  </button>
                </form>
              )}

              {/* URL mode */}
              {inputMode === "url" && (
                <form onSubmit={handleAddUrl} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-(--c-muted)">Judul knowledge (opsional)</label>
                    <input
                      value={webTitle}
                      onChange={(e) => setWebTitle(e.target.value)}
                      disabled={!isAdmin || addingUrl}
                      placeholder="Contoh: FAQ Product YONIEV"
                      className="mt-1 h-10 w-full rounded-xl border border-(--c-border) bg-(--c-overlay) px-3 text-xs text-(--c-text) outline-none transition focus:border-(--c-accent) focus:ring-1 focus:ring-(--c-accent)/30 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--c-muted)">Link URL</label>
                    <input
                      value={webUrl}
                      onChange={(e) => setWebUrl(e.target.value)}
                      disabled={!isAdmin || addingUrl}
                      placeholder="https://example.com/product/faq"
                      className="mt-1 h-10 w-full rounded-xl border border-(--c-border) bg-(--c-overlay) px-3 text-xs text-(--c-text) outline-none transition focus:border-(--c-accent) focus:ring-1 focus:ring-(--c-accent)/30 disabled:opacity-50"
                    />
                    <span className="mt-1 block text-[11px] text-(--c-muted)">
                      Ambil teks utama dari product page, FAQ, SOP web, atau artikel.
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={!isAdmin || addingUrl || !/^https?:\/\/.+/i.test(webUrl.trim())}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-(--c-accent) px-4 text-xs font-bold text-(--c-bg) transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {addingUrl ? <Loader2Icon size={14} className="animate-spin" /> : <LinkIcon size={14} />}
                    {isAdmin ? "Add Web URL" : "Guest read-only"}
                  </button>
                </form>
              )}
            </section>

            {/* Documents List Card */}
            <section className="rounded-2xl border border-(--c-border) bg-(--c-surface) p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-(--c-accent)/15">
                    <FileTextIcon size={14} className="text-(--c-accent)" />
                  </div>
                  <h2 className="text-base font-bold">Dokumen Terbaru</h2>
                </div>
                <span className="text-xs text-(--c-muted)">{documents.length} total</span>
              </div>
              {loadingDocuments ? (
                <div className="flex h-28 items-center justify-center gap-2 text-sm text-(--c-muted)">
                  <Loader2Icon size={16} className="animate-spin" />
                  Memuat dokumen...
                </div>
              ) : documents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-(--c-border) p-5 text-center text-xs text-(--c-muted)">
                  Belum ada dokumen knowledge base.
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.slice(0, 6).map((doc) => (
                    <div key={doc.id} className="group rounded-xl border border-(--c-border) bg-(--c-overlay) p-3 transition hover:border-(--c-accent)/40">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5">{getFileIcon(doc.title, doc.source_file)}</div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-(--c-text)">{doc.title}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <StatusBadge status={doc.status} />
                            {doc.chunk_count > 0 && (
                              <span className="text-[10px] text-(--c-muted)">{doc.chunk_count} chunks</span>
                            )}
                          </div>
                          {doc.error_summary && (
                            <p className="mt-1 text-[11px] text-red-400 line-clamp-2">{doc.error_summary}</p>
                          )}
                          <p className="mt-1 text-[10px] text-(--c-muted)">{formatDate(doc.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Inconsistency Card */}
            <section className="rounded-2xl border border-amber-500/20 bg-(--c-surface) p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15">
                    <AlertTriangleIcon size={14} className="text-amber-400" />
                  </div>
                  <h2 className="text-base font-bold text-amber-400">Temuan Inconsistency</h2>
                </div>
                <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-400">
                  {inconsistencies.length} temuan
                </span>
              </div>
              {inconsistencies.length === 0 ? (
                <div className="rounded-xl border border-dashed border-(--c-border) p-4 text-center text-xs text-(--c-muted)">
                  ✅ Tidak ada konflik data terdeteksi.
                </div>
              ) : (
                <div className="space-y-3">
                  {inconsistencies.slice(0, 5).map((inc) => (
                    <div key={inc.id} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-(--c-text)">
                          {inc.entity_name} — <span className="text-amber-400">{inc.attribute_name}</span>
                        </span>
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                          inc.status === "resolved"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}>
                          {inc.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="rounded-lg border border-(--c-border) bg-(--c-overlay) p-2">
                          <p className="font-semibold text-(--c-muted) truncate">📄 {inc.doc_a_title}</p>
                          <p className="mt-1 font-bold text-red-400">{inc.value_a}</p>
                        </div>
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2">
                          <p className="font-semibold text-emerald-300 truncate">✨ {inc.doc_b_title}</p>
                          <p className="mt-1 font-bold text-emerald-400">{inc.value_b}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* ── RIGHT PANEL: ASK AI ── */}
          <section className="relative overflow-hidden rounded-2xl border border-(--c-border) bg-(--c-surface) p-5">
            {/* Subtle glow on the Ask panel */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-(--c-accent)/4 via-transparent to-transparent rounded-2xl" />
            <div className="relative">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-(--c-accent)/15">
                  <BotIcon size={16} className="text-(--c-accent)" />
                </div>
                <div>
                  <h2 className="text-base font-bold">Ask Knowledge Base</h2>
                  <p className="text-[11px] text-(--c-muted)">Powered by Gemini RAG</p>
                </div>
                <span className="ml-auto flex items-center gap-1 rounded-full border border-(--c-accent)/20 bg-(--c-accent)/10 px-2.5 py-1 text-[10px] font-semibold text-(--c-accent)">
                  <ZapIcon size={10} />
                  AI
                </span>
              </div>

              {/* Search form */}
              <form onSubmit={handleAsk} className="mb-4 flex flex-col gap-2.5 sm:flex-row">
                <div className="relative flex-1">
                  <SearchIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--c-muted)" />
                  <input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    disabled={readyDocuments.length === 0}
                    placeholder={
                      readyDocuments.length > 0
                        ? "Tanya SOP, FAQ, product guide, atau policy CS..."
                        : "Belum ada dokumen yang siap diquery..."
                    }
                    className="h-11 w-full rounded-xl border border-(--c-border) bg-(--c-overlay) pl-9 pr-3 text-sm text-(--c-text) outline-none transition focus:border-(--c-accent) focus:ring-1 focus:ring-(--c-accent)/30 disabled:opacity-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={asking || !question.trim() || readyDocuments.length === 0}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-(--c-accent) px-5 text-sm font-bold text-(--c-bg) transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {asking ? <Loader2Icon size={15} className="animate-spin" /> : <SendIcon size={15} />}
                  Tanya AI
                </button>
              </form>

              {/* Quick suggestion pills */}
              {!answer && !asking && readyDocuments.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {QUICK_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setQuestion(suggestion)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-(--c-border) bg-(--c-overlay) px-3 py-1.5 text-[11px] font-medium text-(--c-muted) transition hover:border-(--c-accent)/50 hover:bg-(--c-accent)/10 hover:text-(--c-text)"
                    >
                      <SparklesIcon size={10} className="text-(--c-accent)" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {/* Empty / Loading / Answer state */}
              {asking ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-(--c-border) bg-(--c-overlay) p-8 text-center">
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-(--c-accent)/10">
                    <BotIcon size={32} className="animate-pulse text-(--c-accent)" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-(--c-text)">AI sedang mencari jawaban...</p>
                    <p className="mt-1 text-xs text-(--c-muted)">Mencari di knowledge base dan menyusun jawaban</p>
                  </div>
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="size-2 rounded-full bg-(--c-accent)/60 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              ) : !answer ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-(--c-border) bg-(--c-overlay) p-8 text-center">
                  <div className="flex size-16 items-center justify-center rounded-2xl border border-(--c-border) bg-(--c-surface)">
                    <BotIcon size={32} className="text-(--c-muted)" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-(--c-text)">Tanyakan apa saja tentang produk & SOP</p>
                    <p className="mt-1 text-xs text-(--c-muted)">
                      {readyDocuments.length > 0
                        ? `${readyDocuments.length} dokumen siap — gunakan kolom di atas atau klik saran di bawahnya`
                        : "Upload dokumen terlebih dahulu untuk mengaktifkan fitur Ask AI"}
                    </p>
                  </div>
                  {readyDocuments.length === 0 && (
                    <div className="rounded-xl border border-dashed border-(--c-border) bg-(--c-surface) px-4 py-3 text-xs text-(--c-muted)">
                      ← Upload SOP, FAQ, atau product guide di panel kiri
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Answer bubble */}
                  <div className="relative rounded-2xl border border-(--c-border) bg-(--c-overlay) p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex size-6 items-center justify-center rounded-md bg-(--c-accent)/15">
                          <BotIcon size={13} className="text-(--c-accent)" />
                        </div>
                        <span className="text-xs font-bold text-(--c-accent)">Jawaban AI</span>
                      </div>
                      <CopyButton text={answer.answer} />
                    </div>
                    <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed text-(--c-text) [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-(--c-border) [&_td]:px-3 [&_td]:py-2 [&_td]:text-xs [&_th]:border [&_th]:border-(--c-border) [&_th]:bg-(--c-overlay-2) [&_th]:px-3 [&_th]:py-2 [&_th]:text-xs [&_th]:font-bold [&_code]:rounded [&_code]:bg-(--c-overlay-2) [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs">
                      <ReactMarkdown>{answer.answer}</ReactMarkdown>
                    </div>
                  </div>

                  {/* Sources */}
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-(--c-text)">
                      <LayersIcon size={14} className="text-(--c-accent)" />
                      Sumber Referensi ({answer.sources.length})
                    </h3>
                    {answer.sources.length === 0 ? (
                      <p className="text-xs text-(--c-muted)">Tidak ada source yang cukup relevan.</p>
                    ) : (
                      <div className="space-y-2">
                        {answer.sources.map((source) => (
                          <details key={source.chunk_id} className="group rounded-xl border border-(--c-border) bg-(--c-overlay) transition hover:border-(--c-accent)/40">
                            <summary className="flex cursor-pointer items-center gap-2 p-3.5">
                              <div className="flex size-5 shrink-0 items-center justify-center rounded-md border border-(--c-border) bg-(--c-surface) text-[10px] font-bold text-(--c-accent)">
                                {source.chunk_index + 1}
                              </div>
                              <span className="flex-1 truncate text-xs font-bold text-(--c-text)">{source.title}</span>
                              <span className="shrink-0 rounded-md bg-(--c-accent)/10 px-2 py-0.5 text-[10px] font-bold text-(--c-accent)">
                                {Number(source.similarity || 0).toFixed(3)}
                              </span>
                            </summary>
                            <div className="border-t border-(--c-border) p-3.5">
                              <p className="line-clamp-6 whitespace-pre-wrap text-xs leading-5 text-(--c-muted)">
                                {source.content}
                              </p>
                            </div>
                          </details>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
