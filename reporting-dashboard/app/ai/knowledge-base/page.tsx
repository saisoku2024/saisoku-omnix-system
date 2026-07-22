"use client"

import { useEffect, useMemo, useState } from "react"
import {
  BotIcon,
  BookOpenIcon,
  FileTextIcon,
  Loader2Icon,
  SearchIcon,
  SendIcon,
  UploadIcon,
} from "lucide-react"

type SessionRole = "admin" | "guest" | null

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
const UPLOAD_API = "/api/backend/knowledge/upload"
const QUERY_API = "/api/backend/knowledge/query"
const MAX_UPLOAD_FILE_SIZE_BYTES = 4 * 1024 * 1024

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

export default function KnowledgeBasePage() {
  const [sessionRole, setSessionRole] = useState<SessionRole>(null)
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [loadingDocuments, setLoadingDocuments] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [asking, setAsking] = useState(false)
  const [title, setTitle] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState<KnowledgeAnswer | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const isAdmin = sessionRole === "admin"
  const readyDocuments = useMemo(
    () => documents.filter((document) => document.status === "ready"),
    [documents]
  )
  const processingDocuments = useMemo(
    () => documents.filter((document) => document.status === "processing"),
    [documents]
  )

  const loadDocuments = async () => {
    setLoadingDocuments(true)
    setError(null)
    try {
      const response = await fetch(DOCUMENT_API, { cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(readError(data, "Gagal memuat dokumen knowledge base"))
      }
      setDocuments(Array.isArray(data.documents) ? data.documents : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat dokumen knowledge base")
    } finally {
      setLoadingDocuments(false)
    }
  }

  useEffect(() => {
    let active = true

    async function loadInitialData() {
      try {
        const [sessionResponse, documentsResponse] = await Promise.all([
          fetch("/api/auth/session", { cache: "no-store" }),
          fetch(DOCUMENT_API, { cache: "no-store" }),
        ])
        const sessionData = (await sessionResponse.json().catch(() => ({}))) as { role?: SessionRole }
        const documentsData = await documentsResponse.json().catch(() => ({}))

        if (!documentsResponse.ok) {
          throw new Error(readError(documentsData, "Gagal memuat dokumen knowledge base"))
        }

        if (active) {
          setSessionRole(sessionData.role ?? null)
          setDocuments(Array.isArray(documentsData.documents) ? documentsData.documents : [])
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Gagal memuat dokumen knowledge base")
        }
      } finally {
        if (active) {
          setLoadingDocuments(false)
        }
      }
    }

    void loadInitialData()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (processingDocuments.length === 0) return

    const pollId = window.setInterval(() => {
      void loadDocuments()
    }, 5000)

    return () => window.clearInterval(pollId)
  }, [processingDocuments.length])

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!isAdmin || !file) return

    if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
      setError(
        `File ${formatFileSize(file.size)} terlalu besar untuk upload via dashboard. Batas aman sementara ${formatFileSize(MAX_UPLOAD_FILE_SIZE_BYTES)}. Pecah PDF atau upload dokumen yang lebih kecil dulu.`
      )
      setSuccess(null)
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      if (title.trim()) formData.append("title", title.trim())

      const response = await fetch(UPLOAD_API, {
        method: "POST",
        body: formData,
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(readError(data, "Gagal upload knowledge document"))
      }
      setSuccess(`Knowledge document diproses: ${data.title || file.name}`)
      setTitle("")
      setFile(null)
      await loadDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal upload knowledge document")
    } finally {
      setUploading(false)
    }
  }

  const handleAsk = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!question.trim()) return
    if (readyDocuments.length === 0) {
      setAnswer(null)
      setError(
        processingDocuments.length > 0
          ? "Knowledge document masih diproses. Tunggu status berubah menjadi ready, lalu tanya lagi."
          : "Belum ada knowledge document yang ready untuk ditanya."
      )
      return
    }

    setAsking(true)
    setError(null)
    setAnswer(null)
    try {
      const response = await fetch(QUERY_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), match_count: 6 }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(readError(data, "Gagal menjalankan query knowledge base"))
      }
      setAnswer({
        answer: String(data.answer || ""),
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
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-(--c-accent)">
              AI Workspace
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-normal text-(--c-text) sm:text-4xl">
              AI Knowledge Base
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-(--c-muted)">
              Upload SOP, FAQ, product guide, dan policy CS untuk dipakai sebagai sumber jawaban RAG. PDF scan kecil akan dibaca dengan OCR Gemini.
            </p>
          </div>
          <div className="rounded-xl border border-(--c-border) bg-(--c-surface) px-4 py-3 text-xs text-(--c-muted)">
            {isAdmin ? "Admin mode: upload dan query aktif" : "Guest mode: query read-only"}
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">
            {success}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
          <section className="space-y-5">
            <form onSubmit={handleUpload} className="rounded-2xl border border-(--c-border) bg-(--c-surface) p-5">
              <div className="mb-4 flex items-center gap-2">
                <UploadIcon size={16} className="text-(--c-accent)" />
                <h2 className="text-base font-bold">Upload Knowledge</h2>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-(--c-muted)">
                  Judul dokumen
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    disabled={!isAdmin || uploading}
                    placeholder="Contoh: SOP Refund Tineco"
                    className="mt-1 h-10 w-full rounded-xl border border-(--c-border) bg-(--c-overlay) px-3 text-xs text-(--c-text) outline-none focus:border-(--c-accent) disabled:opacity-50"
                  />
                </label>
                <label className="block text-xs font-semibold text-(--c-muted)">
                  File knowledge
                  <input
                    type="file"
                    disabled={!isAdmin || uploading}
                    onChange={(event) => {
                      const selectedFile = event.target.files?.[0] || null
                      setFile(selectedFile)
                      setSuccess(null)
                      if (selectedFile && selectedFile.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
                        setError(
                          `File ${formatFileSize(selectedFile.size)} terlalu besar untuk upload via dashboard. Batas aman sementara ${formatFileSize(MAX_UPLOAD_FILE_SIZE_BYTES)}.`
                        )
                      } else {
                        setError(null)
                      }
                    }}
                    accept=".txt,.md,.csv,.xlsx,.xls,.pdf,.docx"
                    className="mt-1 block w-full rounded-xl border border-(--c-border) bg-(--c-overlay) px-3 py-2 text-xs text-(--c-text) disabled:opacity-50"
                  />
                  <span className="mt-1 block text-[11px] font-normal text-(--c-muted)">
                    Batas aman upload dashboard: {formatFileSize(MAX_UPLOAD_FILE_SIZE_BYTES)}. PDF scan didukung selama ukurannya masih aman.
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={!isAdmin || !file || uploading}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-(--c-accent) px-4 text-xs font-bold text-(--c-bg) transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploading ? <Loader2Icon size={14} className="animate-spin" /> : <UploadIcon size={14} />}
                  {isAdmin ? "Ingest Knowledge" : "Guest read-only"}
                </button>
              </div>
            </form>

            <section className="rounded-2xl border border-(--c-border) bg-(--c-surface) p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BookOpenIcon size={16} className="text-(--c-accent)" />
                  <h2 className="text-base font-bold">Documents</h2>
                </div>
                <span className="text-xs text-(--c-muted)">
                  {readyDocuments.length} ready
                  {processingDocuments.length > 0 ? ` | ${processingDocuments.length} processing` : ""}
                </span>
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
                  {documents.map((document) => (
                    <div key={document.id} className="rounded-xl border border-(--c-border) bg-(--c-overlay) p-3">
                      <div className="flex items-start gap-2">
                        <FileTextIcon size={15} className="mt-0.5 shrink-0 text-(--c-accent)" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-(--c-text)">{document.title}</p>
                          <p className="mt-1 text-[11px] text-(--c-muted)">
                            {document.status} · {document.chunk_count} chunks · {formatDate(document.created_at)}
                          </p>
                          {document.error_summary && (
                            <p className="mt-1 text-[11px] text-red-400">{document.error_summary}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </section>

          <section className="rounded-2xl border border-(--c-border) bg-(--c-surface) p-5">
            <div className="mb-4 flex items-center gap-2">
              <BotIcon size={17} className="text-(--c-accent)" />
              <h2 className="text-base font-bold">Ask Knowledge Base</h2>
            </div>

            <form onSubmit={handleAsk} className="mb-5 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <SearchIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--c-muted)" />
                <input
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  disabled={readyDocuments.length === 0}
                  placeholder={
                    readyDocuments.length > 0
                      ? "Tanya SOP, FAQ, product guide, atau policy CS..."
                      : "Tunggu knowledge document selesai diproses..."
                  }
                  className="h-11 w-full rounded-xl border border-(--c-border) bg-(--c-overlay) pl-9 pr-3 text-sm text-(--c-text) outline-none focus:border-(--c-accent) disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={asking || !question.trim() || readyDocuments.length === 0}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-(--c-accent) px-5 text-sm font-bold text-(--c-bg) transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {asking ? <Loader2Icon size={15} className="animate-spin" /> : <SendIcon size={15} />}
                Ask
              </button>
            </form>

            {!answer ? (
              <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-(--c-border) bg-(--c-overlay) p-8 text-center text-sm text-(--c-muted)">
                Jawaban AI akan muncul di sini bersama source chunk yang dipakai.
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-2xl border border-(--c-border) bg-(--c-overlay) p-5">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-(--c-text)">{answer.answer}</p>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-bold text-(--c-text)">Sources</h3>
                  {answer.sources.length === 0 ? (
                    <p className="text-xs text-(--c-muted)">Tidak ada source yang cukup relevan.</p>
                  ) : (
                    <div className="space-y-3">
                      {answer.sources.map((source) => (
                        <details key={source.chunk_id} className="rounded-xl border border-(--c-border) bg-(--c-overlay) p-4">
                          <summary className="cursor-pointer text-xs font-bold text-(--c-text)">
                            {source.title} · chunk {source.chunk_index + 1} · score {Number(source.similarity || 0).toFixed(3)}
                          </summary>
                          <p className="mt-3 line-clamp-6 whitespace-pre-wrap text-xs leading-5 text-(--c-muted)">
                            {source.content}
                          </p>
                        </details>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
