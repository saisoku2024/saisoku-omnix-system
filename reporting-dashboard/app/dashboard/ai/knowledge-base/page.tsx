"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import type { Components } from "react-markdown"
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArchiveIcon,
  BookOpenIcon,
  BrainIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardIcon,
  CopyIcon,
  CpuIcon,
  DatabaseIcon,
  EyeIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileTypeIcon,
  FilterIcon,
  ImageIcon,
  LayersIcon,
  LinkIcon,
  Loader2Icon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TagIcon,
  Trash2Icon,
  TypeIcon,
  UploadIcon,
  XIcon,
  ZapIcon,
} from "lucide-react"

import { uploadFileToStorage } from "@/lib/storage-upload"

type SessionRole = "admin" | "super_admin" | "guest" | null
type KnowledgeInputMode = "file" | "text" | "url"
type UploadStage = "idle" | "uploading" | "processing"

export type KnowledgeCategory =
  | "Product Info"
  | "SOP System"
  | "Promo & Rules"
  | "General FAQ"
  | "Operational"

export const KNOWLEDGE_CATEGORIES: KnowledgeCategory[] = [
  "Product Info",
  "SOP System",
  "Promo & Rules",
  "General FAQ",
  "Operational",
]

interface KnowledgeDocument {
  id: string
  title: string
  source_file?: string
  source_type?: string
  category?: KnowledgeCategory | string
  tags?: string[]
  content?: string
  status: "processing" | "ready" | "failed"
  chunk_count: number
  created_by: string
  error_summary?: string
  created_at: string
  updated_at?: string
}

export interface KnowledgeHealthData {
  status: "healthy" | "degraded" | "critical" | "error"
  warnings?: string[]
  models?: {
    chat_model: string
    default_chat_model: string
    embedding_model: string
    default_embedding_model: string
    embedding_dimension: number
  }
  documents?: {
    total: number
    ready: number
    processing: number
    failed: number
    needs_reindex: number
  }
  chunks?: {
    total_chunks: number
    avg_chunks_per_doc: number
    chunks_with_context: number
    total_estimated_tokens: number
  }
  entities?: {
    total_entities: number
  }
  semantic_cache?: {
    total_cached_queries: number
    total_cache_hits: number
    ttl_days: number
  }
  inconsistencies?: {
    unresolved_count: number
  }
  checked_at?: string
}

const DOCUMENT_API = "/api/backend/knowledge/documents"
const STORAGE_INGEST_API = "/api/backend/knowledge/storage-ingest"
const TEXT_API = "/api/backend/knowledge/text"
const URL_API = "/api/backend/knowledge/url"
const QUERY_API = "/api/backend/knowledge/query"
const BACKUP_EXPORT_API = "/api/backend/knowledge/backup/export"
const BACKUP_RESTORE_API = "/api/backend/knowledge/backup/restore"
const MAINTENANCE_HEALTH_API = "/api/backend/knowledge/maintenance/health"
const MAINTENANCE_REINDEX_EMBEDDINGS_API = "/api/backend/knowledge/maintenance/reindex-embeddings"
const MAINTENANCE_REINDEX_ENTITIES_API = "/api/backend/knowledge/maintenance/reindex-entities"
const MAINTENANCE_CLEAR_CACHE_API = "/api/backend/knowledge/maintenance/clear-cache"
const MAX_UPLOAD_FILE_SIZE_BYTES = 50 * 1024 * 1024
const PAGE_SIZE = 10

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function formatDate(value?: string) {
  if (!value) return "-"
  return new Date(value).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  })
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
  if (name.endsWith(".pdf")) return <FileTextIcon size={15} className="text-red-400 shrink-0" />
  if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv"))
    return <FileSpreadsheetIcon size={15} className="text-emerald-400 shrink-0" />
  if (name.endsWith(".docx") || name.endsWith(".doc"))
    return <FileTypeIcon size={15} className="text-blue-400 shrink-0" />
  if (name.match(/\.(jpg|jpeg|png|webp)$/))
    return <ImageIcon size={15} className="text-purple-400 shrink-0" />
  return <FileTextIcon size={15} className="text-sky-400 shrink-0" />
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

function CategoryBadge({ category }: { category?: string }) {
  const cat = category || "General FAQ"
  let colors = "border-sky-500/30 bg-sky-500/10 text-sky-300"
  if (cat === "Product Info") colors = "border-purple-500/30 bg-purple-500/10 text-purple-300"
  if (cat === "SOP System") colors = "border-indigo-500/30 bg-indigo-500/10 text-indigo-300"
  if (cat === "Promo & Rules") colors = "border-amber-500/30 bg-amber-500/10 text-amber-300"
  if (cat === "Operational") colors = "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"

  return (
    <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${colors}`}>
      {cat}
    </span>
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

type SortOption = "created_desc" | "created_asc" | "title_asc" | "title_desc" | "chunks_desc" | "chunks_asc"

export default function KnowledgeBaseDashboardPage() {
  const [sessionRole, setSessionRole] = useState<SessionRole>(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [loadingDocuments, setLoadingDocuments] = useState(true)
  
  // Search, Filter, Sort, Pagination
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [sortBy, setSortBy] = useState<SortOption>("created_desc")
  const [pageSize, setPageSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState(1)

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [detailDoc, setDetailDoc] = useState<KnowledgeDocument | null>(null)
  const [deleteTargetDoc, setDeleteTargetDoc] = useState<KnowledgeDocument | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Add / Upload state
  const [inputMode, setInputMode] = useState<KnowledgeInputMode>("file")
  const [addCategory, setAddCategory] = useState<KnowledgeCategory>("General FAQ")
  const [addTags, setAddTags] = useState("")
  const [title, setTitle] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [manualTitle, setManualTitle] = useState("")
  const [manualText, setManualText] = useState("")
  const [webTitle, setWebTitle] = useState("")
  const [webUrl, setWebUrl] = useState("")
  
  const [uploading, setUploading] = useState(false)
  const [addingText, setAddingText] = useState(false)
  const [addingUrl, setAddingUrl] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Alert feedback
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [copiedDetail, setCopiedDetail] = useState(false)
  const [exportingBackup, setExportingBackup] = useState(false)
  const [restoringBackup, setRestoringBackup] = useState(false)
  const [clearingAll, setClearingAll] = useState(false)

  // Health & Maintenance state
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false)
  const [healthData, setHealthData] = useState<KnowledgeHealthData | null>(null)
  const [loadingHealth, setLoadingHealth] = useState(false)
  const [reindexingEmbeddings, setReindexingEmbeddings] = useState(false)
  const [reindexingEntities, setReindexingEntities] = useState(false)
  const [flushingCache, setFlushingCache] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const isAdmin = sessionRole === "admin" || sessionRole === "super_admin"

  // Filtered, Sorted, & Paginated documents
  const filteredAndSortedDocuments = useMemo(() => {
    const filtered = documents.filter((doc) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        doc.title.toLowerCase().includes(q) ||
        (doc.source_file && doc.source_file.toLowerCase().includes(q)) ||
        (doc.content && doc.content.toLowerCase().includes(q)) ||
        (doc.tags && doc.tags.some((t) => t.toLowerCase().includes(q)))

      const matchesCategory =
        selectedCategory === "all" ||
        (doc.category ? doc.category === selectedCategory : selectedCategory === "General FAQ")

      return matchesSearch && matchesCategory
    })

    return filtered.sort((a, b) => {
      if (sortBy === "created_desc") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      if (sortBy === "created_asc") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      if (sortBy === "title_asc") {
        return a.title.localeCompare(b.title)
      }
      if (sortBy === "title_desc") {
        return b.title.localeCompare(a.title)
      }
      if (sortBy === "chunks_desc") {
        return (b.chunk_count || 0) - (a.chunk_count || 0)
      }
      if (sortBy === "chunks_asc") {
        return (a.chunk_count || 0) - (b.chunk_count || 0)
      }
      return 0
    })
  }, [documents, searchQuery, selectedCategory, sortBy])

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedDocuments.length / pageSize))

  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredAndSortedDocuments.slice(start, start + pageSize)
  }, [filteredAndSortedDocuments, currentPage, pageSize])

  // Reset pagination on filter/sort/pageSize change without cascading effect
  const [prevFilterKey, setPrevFilterKey] = useState<string | null>(null)
  const currentFilterKey = `${searchQuery}|${selectedCategory}|${sortBy}|${pageSize}`
  if (prevFilterKey === null) {
    setPrevFilterKey(currentFilterKey)
  } else if (prevFilterKey !== currentFilterKey) {
    setPrevFilterKey(currentFilterKey)
    setCurrentPage(1)
  }

  const loadDocuments = async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoadingDocuments(true)
    setError(null)
    try {
      const response = await fetch(DOCUMENT_API, { cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(readError(data, "Gagal memuat dokumen knowledge base"))
      setDocuments(Array.isArray(data.documents) ? data.documents : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat dokumen knowledge base")
    } finally {
      if (!options?.silent) setLoadingDocuments(false)
    }
  }

  const loadHealthData = async () => {
    setLoadingHealth(true)
    try {
      const res = await fetch(MAINTENANCE_HEALTH_API, { cache: "no-store" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(readError(data, "Gagal memuat status kesehatan knowledge base"))
      setHealthData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat diagnosa kesehatan")
    } finally {
      setLoadingHealth(false)
    }
  }

  const handleReindexEmbeddings = async () => {
    if (!confirm("Jalankan 1-Click Re-index Embeddings untuk semua dokumen? Proses ini akan mere-embedding seluruh vektor di Supabase dan me-refresh cache.")) return
    setReindexingEmbeddings(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(MAINTENANCE_REINDEX_EMBEDDINGS_API, { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(readError(data, "Gagal menjalankan re-index embeddings"))
      setSuccess(data.message || "Berhasil mere-index embeddings dan memperbarui database vektor.")
      loadDocuments({ silent: true })
      loadHealthData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal re-index embeddings")
    } finally {
      setReindexingEmbeddings(false)
    }
  }

  const handleReindexEntities = async () => {
    if (!confirm("Bangun ulang index entitas/topik terstruktur (Knowledge Entities)?")) return
    setReindexingEntities(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(MAINTENANCE_REINDEX_ENTITIES_API, { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(readError(data, "Gagal re-index entitas"))
      setSuccess(`Berhasil mere-index entitas (${data.entity_count || 0} entitas diperbarui).`)
      loadHealthData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal re-index entitas")
    } finally {
      setReindexingEntities(false)
    }
  }

  const handleFlushCache = async () => {
    if (!confirm("Bersihkan seluruh Semantic Query Cache sekarang?")) return
    setFlushingCache(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(MAINTENANCE_CLEAR_CACHE_API, { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(readError(data, "Gagal membersihkan semantic cache"))
      setSuccess(`Semantic Query Cache berhasil dibersihkan (${data.cleared_count || 0} entri dibuang).`)
      loadHealthData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membersihkan cache")
    } finally {
      setFlushingCache(false)
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
        if (!documentsResponse.ok) throw new Error(readError(documentsData, "Gagal memuat dokumen knowledge base"))
        if (active) {
          setSessionRole(sessionData.role ?? null)
          setDocuments(Array.isArray(documentsData.documents) ? documentsData.documents : [])
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

  // Delete document action
  const handleDeleteConfirm = async () => {
    if (!deleteTargetDoc || !isAdmin) return
    setDeleting(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch(`${DOCUMENT_API}/${deleteTargetDoc.id}`, {
        method: "DELETE",
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(readError(data, "Gagal menghapus dokumen knowledge"))
      setSuccess(`Dokumen "${deleteTargetDoc.title}" berhasil dihapus.`)
      setDeleteTargetDoc(null)
      await loadDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus dokumen knowledge")
    } finally {
      setDeleting(false)
    }
  }

  // Upload file action
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
          body: JSON.stringify({
            ...storageFile,
            title: fileTitle,
            category: addCategory,
            tags: addTags.split(",").map((t) => t.trim()).filter(Boolean),
          }),
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(readError(data, `Gagal upload ${selectedFile.name}`))
        successCount++
      }
      setSuccess(`Berhasil memproses ${successCount} file knowledge document!`)
      setTitle("")
      setFiles([])
      setUploadProgress(0)
      setIsAddModalOpen(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
      await loadDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal upload batch knowledge document")
    } finally {
      setUploading(false)
    }
  }

  // Add Manual Text action
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
        body: JSON.stringify({
          title: cleanTitle,
          text: cleanText,
          category: addCategory,
          tags: addTags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(readError(data, "Gagal menambahkan manual knowledge"))
      setSuccess(`Manual knowledge berhasil ditambahkan: ${data.title || cleanTitle}`)
      setManualTitle("")
      setManualText("")
      setIsAddModalOpen(false)
      await loadDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambahkan manual knowledge")
    } finally {
      setAddingText(false)
    }
  }

  // Add URL action
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
        body: JSON.stringify({
          title: cleanTitle || undefined,
          url: cleanUrl,
          category: addCategory,
          tags: addTags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(readError(data, "Gagal menambahkan web URL knowledge"))
      setSuccess(`Web URL knowledge berhasil ditambahkan: ${data.title || cleanUrl}`)
      setWebTitle("")
      setWebUrl("")
      setIsAddModalOpen(false)
      await loadDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambahkan web URL knowledge")
    } finally {
      setAddingUrl(false)
    }
  }

  const handleCopyDetail = async () => {
    if (!detailDoc) return
    const textToCopy = `Judul: ${detailDoc.title}\nKategori: ${detailDoc.category || "General FAQ"}\nSource: ${detailDoc.source_file || detailDoc.source_type || "-"}\n\nKonten:\n${detailDoc.content || "Tidak ada preview konten."}`
    await navigator.clipboard.writeText(textToCopy)
    setCopiedDetail(true)
    setTimeout(() => setCopiedDetail(false), 2000)
  }

  return (
    <main className="min-h-screen bg-[var(--c-bg)] px-4 py-6 text-[var(--c-text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px] space-y-6">

        {/* ── HEADER ACCENT BANNER ── */}
        <header className="relative overflow-hidden rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-5 sm:p-6 shadow-md">
          {/* Top Accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853]" />
          
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 via-purple-500/15 to-emerald-500/20 ring-1 ring-white/10">
                  <BrainIcon size={18} className="text-[#4285F4]" />
                </span>
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-sky-400/80 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-[#4285F4]" />
                    <span className="size-1.5 rounded-full bg-[#EA4335]" />
                    <span className="size-1.5 rounded-full bg-[#FBBC05]" />
                    <span className="size-1.5 rounded-full bg-[#34A853]" />
                  </span>
                  AI System — RAG Workspace
                </span>
              </div>
              <h1 className="mt-2 bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-[1.6rem] font-extrabold tracking-tight text-transparent sm:text-[2rem] leading-tight">
                AI Knowledge Base
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--c-muted)]">
                Kelola dokumen RAG, SOP System, Product Guide, FAQ, dan data training AI. Mencegah duplikasi data training secara presisi.
              </p>
            </div>

            {/* Header Right Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href="/ai/knowledge-base"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3.5 text-xs font-bold text-sky-400 transition-all hover:bg-sky-500/20 hover:text-sky-300"
                title="Buka Halaman Tanya AI (RAG Engine)"
              >
                <SparklesIcon size={14} className="text-sky-400" />
                Tanya AI (RAG Engine)
              </a>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 text-xs font-bold text-white shadow-lg shadow-sky-500/20 transition-all hover:from-sky-400 hover:to-blue-500 hover:shadow-sky-500/30 active:scale-[0.98]"
                >
                  <PlusIcon size={16} />
                  Tambah Data KB Baru
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsHealthModalOpen(true)
                  loadHealthData()
                }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 text-xs font-bold text-emerald-400 transition-all hover:bg-emerald-500/20 hover:text-emerald-300"
                title="Buka Panel Diagnosa & Kesehatan RAG"
              >
                <ShieldCheckIcon size={14} className="text-emerald-400" />
                Health & Maintenance
              </button>

              <button
                type="button"
                onClick={() => loadDocuments()}
                disabled={loadingDocuments}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--c-border)] bg-[var(--c-overlay)] px-3 text-xs font-semibold text-[var(--c-text)] transition-all hover:border-sky-500/50 hover:bg-sky-500/10 hover:text-sky-400"
                title="Muat Ulang Data"
              >
                <RefreshCwIcon size={14} className={loadingDocuments ? "animate-spin text-sky-400" : ""} />
                Segarkan
              </button>
            </div>
          </div>
        </header>

        {/* ── NOTIFICATIONS ── */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 shadow-sm">
            <AlertTriangleIcon size={16} className="shrink-0" />
            <span className="flex-1 text-xs sm:text-sm">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400/70 hover:text-red-300">
              <XIcon size={14} />
            </button>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400 shadow-sm">
            <CheckIcon size={16} className="shrink-0" />
            <span className="flex-1 text-xs sm:text-sm">{success}</span>
            <button onClick={() => setSuccess(null)} className="text-emerald-400/70 hover:text-emerald-300">
              <XIcon size={14} />
            </button>
          </div>
        )}

        {/* ── SEARCH & FILTER CONTROLS ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4 shadow-sm">
          {/* Search bar */}
          <div className="relative flex-1">
            <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--c-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan judul, isi konten, atau tag..."
              className="h-10 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-overlay)] pl-10 pr-4 text-xs sm:text-sm text-[var(--c-text)] placeholder:text-[var(--c-muted)]/60 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--c-muted)] hover:text-white"
              >
                <XIcon size={14} />
              </button>
            )}
          </div>

          {/* Filter & Sort Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Dropdown Filter */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 text-xs font-semibold text-[var(--c-muted)] shrink-0">
                <FilterIcon size={14} className="text-sky-400" />
                Kategori:
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-10 rounded-xl border border-[var(--c-border)] bg-[var(--c-overlay)] px-3 text-xs font-semibold text-[var(--c-text)] outline-none transition-all focus:border-sky-500"
              >
                <option value="all">Semua Kategori ({documents.length})</option>
                {KNOWLEDGE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By Dropdown */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 text-xs font-semibold text-[var(--c-muted)] shrink-0">
                Urutkan:
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-10 rounded-xl border border-[var(--c-border)] bg-[var(--c-overlay)] px-3 text-xs font-semibold text-[var(--c-text)] outline-none transition-all focus:border-sky-500"
              >
                <option value="created_desc">🕒 Terbaru (Default)</option>
                <option value="created_asc">⌛ Terlama</option>
                <option value="title_asc">🔤 Judul (A - Z)</option>
                <option value="title_desc">🔤 Judul (Z - A)</option>
                <option value="chunks_desc">📊 Chunks Terbanyak</option>
                <option value="chunks_asc">📉 Chunks Tersedikit</option>
              </select>
            </div>

            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 text-xs font-semibold text-[var(--c-muted)] shrink-0">
                Tampilkan:
              </div>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="h-10 rounded-xl border border-[var(--c-border)] bg-[var(--c-overlay)] px-2.5 text-xs font-semibold text-[var(--c-text)] outline-none transition-all focus:border-sky-500"
              >
                <option value={10}>10 Data / Hal</option>
                <option value={25}>25 Data / Hal</option>
                <option value={50}>50 Data / Hal</option>
                <option value={100}>100 Data / Hal</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── KNOWLEDGE BASE DATA TABLE ── */}
        <div className="overflow-hidden rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--c-border)] bg-[var(--c-offset)] text-[var(--c-muted)] text-[11px] uppercase tracking-widest font-semibold">
                  <th className="px-5 py-3.5 w-[34%]">Dokumen / Judul</th>
                  <th className="px-4 py-3.5 w-[11%]">Kategori</th>
                  <th className="px-4 py-3.5 w-[13%]">Sumber File</th>
                  <th className="px-4 py-3.5 text-center w-[9%]">Status</th>
                  <th className="px-4 py-3.5 text-center w-[7%]">Chunks</th>
                  <th className="px-4 py-3.5 w-[10%]">Dibuat Oleh</th>
                  <th className="px-4 py-3.5 w-[11%]">Tanggal</th>
                  <th className="px-4 py-3.5 text-right w-[8%]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--c-border)]">
                {loadingDocuments ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[var(--c-muted)]">
                      <div className="inline-flex items-center gap-2">
                        <Loader2Icon size={18} className="animate-spin text-sky-400" />
                        <span>Memuat data Knowledge Base...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[var(--c-muted)]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <BookOpenIcon size={28} className="text-[var(--c-muted)]/50" />
                        <p className="font-semibold">Tidak ada dokumen ditemukan</p>
                        <p className="text-[11px] text-[var(--c-muted)]/70">
                          {searchQuery || selectedCategory !== "all"
                            ? "Coba ubah kata kunci pencarian atau filter kategori."
                            : "Klik tombol 'Tambah Data KB Baru' untuk mulai mengunggah data."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedDocuments.map((doc) => (
                    <tr key={doc.id} className="transition-colors hover:bg-[var(--c-overlay)]/50">
                      {/* Title */}
                      <td className="px-5 py-4 text-[var(--c-text)]">
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 shrink-0">{getFileIcon(doc.title, doc.source_file)}</span>
                          <div className="min-w-0">
                            <span className="text-sm font-medium leading-snug hover:text-sky-400 cursor-pointer line-clamp-2 block" onClick={() => setDetailDoc(doc)}>
                              {doc.title}
                            </span>
                            {doc.tags && doc.tags.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {doc.tags.map((tag) => (
                                  <span key={tag} className="inline-flex items-center gap-0.5 rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-medium text-sky-300">
                                    <TagIcon size={8} /> {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-4">
                        <CategoryBadge category={doc.category} />
                      </td>

                      {/* Source */}
                      <td className="px-4 py-4 text-xs text-[var(--c-muted)] max-w-[10rem]">
                        <span className="truncate block" title={doc.source_file || doc.source_type || "Manual Text"}>
                          {doc.source_file || doc.source_type || "Manual Text"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 text-center">
                        <StatusBadge status={doc.status} />
                      </td>

                      {/* Chunk count */}
                      <td className="px-4 py-4 text-center font-mono text-sm text-sky-300 font-semibold">
                        {doc.chunk_count}
                      </td>

                      {/* Created by */}
                      <td className="px-4 py-4 text-xs text-[var(--c-muted)] max-w-[8rem]">
                        <span className="truncate block" title={doc.created_by}>
                          {doc.created_by}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 text-xs text-[var(--c-muted)] whitespace-nowrap">
                        {formatDate(doc.created_at)}
                      </td>

                      {/* Actions (Detail & Delete) */}
                      <td className="px-4 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailDoc(doc)}
                            className="inline-flex size-8 items-center justify-center rounded-lg border border-[var(--c-border)] bg-[var(--c-overlay)] text-[var(--c-muted)] transition hover:border-sky-500/50 hover:text-sky-400"
                            title="Lihat Detail Dokumen"
                          >
                            <EyeIcon size={14} />
                          </button>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setDeleteTargetDoc(doc)}
                              className="inline-flex size-8 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 transition hover:border-red-500 hover:bg-red-500/20 hover:text-red-300"
                              title="Hapus Dokumen"
                            >
                              <Trash2Icon size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── PAGINATION BAR ── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-[var(--c-border)] bg-[var(--c-surface)] px-5 py-3.5 text-sm">
            <div className="text-[var(--c-muted)] text-xs">
              Menampilkan <span className="font-semibold text-[var(--c-text)]">{paginatedDocuments.length}</span> dari{" "}
              <span className="font-semibold text-[var(--c-text)]">{filteredAndSortedDocuments.length}</span> data · Halaman <span className="font-semibold text-[var(--c-text)]">{currentPage}</span> dari <span className="font-semibold text-[var(--c-text)]">{totalPages}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loadingDocuments}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--c-border)] bg-[var(--c-overlay)] px-3 font-semibold text-[var(--c-text)] transition hover:border-sky-500 hover:text-sky-400 disabled:opacity-40 disabled:hover:border-[var(--c-border)] disabled:hover:text-[var(--c-text)]"
              >
                <ChevronLeftIcon size={14} />
                Prev
              </button>

              <span className="font-mono text-xs font-bold text-sky-400 px-2">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || loadingDocuments}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--c-border)] bg-[var(--c-overlay)] px-3 font-semibold text-[var(--c-text)] transition hover:border-sky-500 hover:text-sky-400 disabled:opacity-40 disabled:hover:border-[var(--c-border)] disabled:hover:text-[var(--c-text)]"
              >
                Next
                <ChevronRightIcon size={14} />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ── MODAL TAMBAH DATA KB BARU ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--c-border)] pb-3">
              <div className="flex items-center gap-2">
                <PlusIcon size={18} className="text-sky-400" />
                <h3 className="text-base font-bold text-[var(--c-text)]">Tambah Data Knowledge Base</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[var(--c-muted)] hover:text-white">
                <XIcon size={18} />
              </button>
            </div>

            {/* Input Mode Tabs */}
            <div className="flex gap-1.5 rounded-xl border border-[var(--c-border)] bg-[var(--c-overlay)] p-1">
              {[
                { mode: "file" as const, label: "Upload File", icon: UploadIcon, activeBg: "bg-sky-500/15 border-sky-500/30 text-sky-400" },
                { mode: "text" as const, label: "Manual Teks", icon: TypeIcon, activeBg: "bg-violet-500/15 border-violet-500/30 text-violet-400" },
                { mode: "url" as const, label: "Web URL", icon: LinkIcon, activeBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" },
              ].map((item) => {
                const Icon = item.icon
                const active = inputMode === item.mode
                return (
                  <button
                    key={item.mode}
                    type="button"
                    onClick={() => setInputMode(item.mode)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-bold transition-all ${
                      active
                        ? item.activeBg + " shadow-xs"
                        : "border-transparent text-[var(--c-muted)] hover:text-[var(--c-text)]"
                    }`}
                  >
                    <Icon size={14} />
                    {item.label}
                  </button>
                )
              })}
            </div>

            {/* Metadata (Category & Tags) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--c-muted)]">Kategori KB</label>
                <select
                  value={addCategory}
                  onChange={(e) => setAddCategory(e.target.value as KnowledgeCategory)}
                  className="mt-1.5 h-10 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-overlay)] px-3 text-sm text-[var(--c-text)] outline-none focus:border-sky-500"
                >
                  {KNOWLEDGE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--c-muted)]">Tags (Pisahkan koma)</label>
                <input
                  type="text"
                  value={addTags}
                  onChange={(e) => setAddTags(e.target.value)}
                  placeholder="misal: garansi, tineco, sop"
                  className="mt-1.5 h-10 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-overlay)] px-3 text-sm text-[var(--c-text)] outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Mode Form implementation */}
            {inputMode === "file" && (
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--c-muted)]">Judul Dokumen</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={uploading}
                    placeholder="Judul dokumen (opsional jika multiple)"
                    className="mt-1.5 h-10 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-overlay)] px-3 text-sm text-[var(--c-text)] outline-none focus:border-sky-500"
                  />
                </div>

                <div className="rounded-xl border-2 border-dashed border-[var(--c-border)] bg-[var(--c-overlay)] p-6 text-center">
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={(e) => setFiles(Array.from(e.target.files || []))}
                    className="hidden"
                    id="kb-file-upload"
                  />
                  <label htmlFor="kb-file-upload" className="cursor-pointer space-y-1 block">
                    <UploadIcon size={24} className="mx-auto text-sky-400" />
                    <p className="text-xs font-semibold text-[var(--c-text)]">
                      {files.length > 0 ? `${files.length} file dipilih` : "Klik untuk memilih file PDF, DOCX, CSV, XLSX, TXT"}
                    </p>
                    <p className="text-[10px] text-[var(--c-muted)]">Maksimal file size 50MB per file</p>
                  </label>
                </div>

                {uploading && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-[var(--c-muted)]">
                      <span>Memproses dokumen...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--c-overlay)]">
                      <div className="h-full bg-sky-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="rounded-xl border border-[var(--c-border)] px-4 py-2 text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || files.length === 0}
                    className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-sky-400 disabled:opacity-50"
                  >
                    {uploading ? "Proses Upload..." : "Unggah & Proses"}
                  </button>
                </div>
              </form>
            )}

            {inputMode === "text" && (
              <form onSubmit={handleAddText} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--c-muted)]">Judul Manual KB</label>
                  <input
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    disabled={addingText}
                    placeholder="Contoh: Prosedur Pengembalian Barang"
                    className="mt-1.5 h-10 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-overlay)] px-3 text-sm text-[var(--c-text)] outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--c-muted)]">Konten Teks</label>
                  <textarea
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    disabled={addingText}
                    rows={5}
                    placeholder="Tuliskan detail SOP, FAQ, atau informasi di sini (min. 20 karakter)..."
                    className="mt-1.5 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-overlay)] p-3 text-sm text-[var(--c-text)] outline-none focus:border-sky-500 leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="rounded-xl border border-[var(--c-border)] px-4 py-2 text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={addingText}
                    className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-sky-400 disabled:opacity-50"
                  >
                    {addingText ? "Menyimpan..." : "Simpan Knowledge Teks"}
                  </button>
                </div>
              </form>
            )}

            {inputMode === "url" && (
              <form onSubmit={handleAddUrl} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--c-muted)]">Judul Web (Opsional)</label>
                  <input
                    value={webTitle}
                    onChange={(e) => setWebTitle(e.target.value)}
                    disabled={addingUrl}
                    placeholder="Contoh: FAQ Halaman Web Resmi"
                    className="mt-1.5 h-10 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-overlay)] px-3 text-sm text-[var(--c-text)] outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--c-muted)]">URL Web (http/https)</label>
                  <input
                    value={webUrl}
                    onChange={(e) => setWebUrl(e.target.value)}
                    disabled={addingUrl}
                    placeholder="https://example.com/sop-faq"
                    className="mt-1.5 h-10 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-overlay)] px-3 text-sm text-[var(--c-text)] outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="rounded-xl border border-[var(--c-border)] px-4 py-2 text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={addingUrl}
                    className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-sky-400 disabled:opacity-50"
                  >
                    {addingUrl ? "Scraping URL..." : "Proses Web URL"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL KONFIRMASI HAPUS ── */}
      {deleteTargetDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[var(--c-surface)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <span className="flex size-10 items-center justify-center rounded-xl bg-red-500/15">
                <AlertTriangleIcon size={20} />
              </span>
              <div>
                <h3 className="text-base font-bold text-[var(--c-text)]">Konfirmasi Hapus Knowledge</h3>
                <p className="text-[11px] text-red-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-overlay)] p-3 text-xs space-y-1">
              <p className="font-semibold text-[var(--c-text)]">{deleteTargetDoc.title}</p>
              <p className="text-[11px] text-[var(--c-muted)]">Kategori: {deleteTargetDoc.category || "General FAQ"}</p>
              <p className="text-[11px] text-[var(--c-muted)]">Chunks: {deleteTargetDoc.chunk_count} vector chunk</p>
            </div>

            <p className="text-xs leading-relaxed text-[var(--c-muted)]">
              Apakah Anda yakin ingin menghapus data ini dari training AI Knowledge Base? Sangat berguna untuk membersihkan duplikasi upload data.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetDoc(null)}
                disabled={deleting}
                className="rounded-xl border border-[var(--c-border)] px-4 py-2 text-xs font-semibold text-[var(--c-text)]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? <Loader2Icon size={14} className="animate-spin" /> : <Trash2Icon size={14} />}
                {deleting ? "Menghapus..." : "Ya, Hapus Data"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DETAIL DOKUMEN & COPY CONTENT ── */}
      {detailDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--c-border)] pb-4">
              <div className="flex items-center gap-2">
                <BookOpenIcon size={18} className="text-sky-400" />
                <h3 className="text-base font-bold text-[var(--c-text)] truncate max-w-md">{detailDoc.title}</h3>
              </div>
              <button onClick={() => setDetailDoc(null)} className="text-[var(--c-muted)] hover:text-white">
                <XIcon size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-xl border border-[var(--c-border)] bg-[var(--c-overlay)] p-3">
                <div>
                  <span className="block text-[10px] text-[var(--c-muted)] font-semibold uppercase">Kategori</span>
                  <CategoryBadge category={detailDoc.category} />
                </div>
                <div>
                  <span className="block text-[10px] text-[var(--c-muted)] font-semibold uppercase">Status</span>
                  <StatusBadge status={detailDoc.status} />
                </div>
                <div>
                  <span className="block text-[10px] text-[var(--c-muted)] font-semibold uppercase">Vector Chunks</span>
                  <span className="font-mono font-bold text-sky-400">{detailDoc.chunk_count}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-[var(--c-muted)] font-semibold uppercase">Dibuat Oleh</span>
                  <span>{detailDoc.created_by}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-[var(--c-muted)] font-semibold uppercase">Tanggal</span>
                  <span>{formatDate(detailDoc.created_at)}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-[var(--c-muted)] font-semibold uppercase">Sumber</span>
                  <span className="truncate block">{detailDoc.source_file || detailDoc.source_type || "-"}</span>
                </div>
              </div>

              {detailDoc.tags && detailDoc.tags.length > 0 && (
                <div>
                  <span className="block text-[10px] text-[var(--c-muted)] font-semibold uppercase mb-1">Tags</span>
                  <div className="flex flex-wrap gap-1">
                    {detailDoc.tags.map((t) => (
                      <span key={t} className="rounded bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-300">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="block text-[10px] text-[var(--c-muted)] font-semibold uppercase mb-1">Pratinjau Isi Konten</span>
                <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-overlay)] p-4 font-mono text-[11px] leading-relaxed text-[var(--c-text)] whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {detailDoc.content || "Konten dokumen tersimpan dalam bentuk vector embeddings chunk di Supabase."}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[var(--c-border)] pt-3">
              <button
                type="button"
                onClick={handleCopyDetail}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--c-border)] bg-[var(--c-overlay)] px-3.5 py-2 text-xs font-semibold text-[var(--c-muted)] hover:border-sky-500 hover:text-sky-400"
              >
                {copiedDetail ? <CheckIcon size={14} className="text-emerald-400" /> : <ClipboardIcon size={14} />}
                {copiedDetail ? "Konten Tersalin!" : "Salin Teks (Copy Content)"}
              </button>

              <button
                type="button"
                onClick={() => setDetailDoc(null)}
                className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white hover:bg-sky-400"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HEALTH & MAINTENANCE MODAL ── */}
      {isHealthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--c-border)] pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <ShieldCheckIcon size={18} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-[var(--c-text)]">RAG System Health & Automated Re-index</h3>
                  <p className="text-[11px] text-[var(--c-muted)]">Diagnosa status vektor, integritas chunk, dan pemeliharaan embedding 1-klik</p>
                </div>
              </div>
              <button onClick={() => setIsHealthModalOpen(false)} className="text-[var(--c-muted)] hover:text-white">
                <XIcon size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 space-y-5 pr-1 text-xs">
              {loadingHealth ? (
                <div className="py-16 text-center text-[var(--c-muted)] space-y-2">
                  <Loader2Icon size={24} className="animate-spin text-emerald-400 mx-auto" />
                  <p className="font-semibold text-xs">Menganalisis status kesehatan Vector Store & AI Engine...</p>
                </div>
              ) : healthData ? (
                <>
                  {/* Status Banner */}
                  <div className={`flex items-center justify-between rounded-xl border p-4 ${
                    healthData.status === "healthy"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : healthData.status === "degraded"
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                      : "border-red-500/30 bg-red-500/10 text-red-300"
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className={`size-3 rounded-full animate-pulse ${
                        healthData.status === "healthy" ? "bg-emerald-400" : "bg-amber-400"
                      }`} />
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider block">
                          Status Sistem: {healthData.status.toUpperCase()}
                        </span>
                        <span className="text-[11px] opacity-80">
                          {healthData.warnings && healthData.warnings.length > 0
                            ? healthData.warnings.join(" | ")
                            : "Semua sistem vector store, full-text search, dan model embedding berjalan optimal."}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => loadHealthData()}
                      className="rounded-lg border border-current px-2.5 py-1 text-[11px] font-semibold hover:opacity-80"
                    >
                      Periksa Ulang
                    </button>
                  </div>

                  {/* Active Models Card */}
                  <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-overlay)] p-4 space-y-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                      <CpuIcon size={13} />
                      Konfigurasi Model AI & Embedding
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className="rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] p-2.5">
                        <span className="block text-[10px] text-[var(--c-muted)]">Generative Chat Model</span>
                        <span className="font-mono text-xs font-bold text-white">{healthData.models?.chat_model}</span>
                      </div>
                      <div className="rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] p-2.5">
                        <span className="block text-[10px] text-[var(--c-muted)]">Vector Embedding Model</span>
                        <span className="font-mono text-xs font-bold text-white">{healthData.models?.embedding_model}</span>
                      </div>
                      <div className="rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] p-2.5">
                        <span className="block text-[10px] text-[var(--c-muted)]">Vector Dimension</span>
                        <span className="font-mono text-xs font-bold text-emerald-400">{healthData.models?.embedding_dimension} dims (pgvector)</span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Breakdown Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-overlay)] p-3 space-y-1">
                      <span className="text-[10px] text-[var(--c-muted)] font-semibold uppercase">Total Dokumen</span>
                      <p className="text-lg font-bold text-white">{healthData.documents?.total || 0}</p>
                      <span className="text-[10px] text-emerald-400">{healthData.documents?.ready || 0} Ready / {healthData.documents?.failed || 0} Gagal</span>
                    </div>
                    <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-overlay)] p-3 space-y-1">
                      <span className="text-[10px] text-[var(--c-muted)] font-semibold uppercase">Vector Chunks</span>
                      <p className="text-lg font-bold text-sky-400">{healthData.chunks?.total_chunks || 0}</p>
                      <span className="text-[10px] text-[var(--c-muted)]">Rata-rata {healthData.chunks?.avg_chunks_per_doc} per doc</span>
                    </div>
                    <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-overlay)] p-3 space-y-1">
                      <span className="text-[10px] text-[var(--c-muted)] font-semibold uppercase">Structured Entities</span>
                      <p className="text-lg font-bold text-purple-400">{healthData.entities?.total_entities || 0}</p>
                      <span className="text-[10px] text-[var(--c-muted)]">Index produk & topik</span>
                    </div>
                    <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-overlay)] p-3 space-y-1">
                      <span className="text-[10px] text-[var(--c-muted)] font-semibold uppercase">Semantic Cache Hits</span>
                      <p className="text-lg font-bold text-emerald-400">{healthData.semantic_cache?.total_cache_hits || 0}</p>
                      <span className="text-[10px] text-[var(--c-muted)]">{healthData.semantic_cache?.total_cached_queries || 0} query (TTL 365h)</span>
                    </div>
                  </div>

                  {/* 1-Click Automated Maintenance Actions */}
                  {isAdmin && (
                    <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-4 space-y-3">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                        <ActivityIcon size={13} />
                        Aksi Pemeliharaan & 1-Click Re-index
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                        <button
                          type="button"
                          disabled={reindexingEmbeddings}
                          onClick={handleReindexEmbeddings}
                          className="flex flex-col items-start gap-1 rounded-xl border border-sky-500/40 bg-sky-500/10 p-3 text-left transition-all hover:bg-sky-500/20 disabled:opacity-50"
                        >
                          <div className="flex items-center gap-1.5 font-bold text-sky-300">
                            {reindexingEmbeddings ? <Loader2Icon size={13} className="animate-spin" /> : <RefreshCwIcon size={13} />}
                            <span>1-Click Re-index Embeddings</span>
                          </div>
                          <span className="text-[10px] text-[var(--c-muted)] leading-tight">
                            Regenerasi vector embedding semua dokumen ke model terbaru.
                          </span>
                        </button>

                        <button
                          type="button"
                          disabled={reindexingEntities}
                          onClick={handleReindexEntities}
                          className="flex flex-col items-start gap-1 rounded-xl border border-purple-500/40 bg-purple-500/10 p-3 text-left transition-all hover:bg-purple-500/20 disabled:opacity-50"
                        >
                          <div className="flex items-center gap-1.5 font-bold text-purple-300">
                            {reindexingEntities ? <Loader2Icon size={13} className="animate-spin" /> : <LayersIcon size={13} />}
                            <span>Rebuild Entity Index</span>
                          </div>
                          <span className="text-[10px] text-[var(--c-muted)] leading-tight">
                            Bangun ulang mapping entitas produk dan topik terstruktur.
                          </span>
                        </button>

                        <button
                          type="button"
                          disabled={flushingCache}
                          onClick={handleFlushCache}
                          className="flex flex-col items-start gap-1 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-left transition-all hover:bg-amber-500/20 disabled:opacity-50"
                        >
                          <div className="flex items-center gap-1.5 font-bold text-amber-300">
                            {flushingCache ? <Loader2Icon size={13} className="animate-spin" /> : <ZapIcon size={13} />}
                            <span>Flush Semantic Cache</span>
                          </div>
                          <span className="text-[10px] text-[var(--c-muted)] leading-tight">
                            Bersihkan cache query instan untuk memaksa refresh jawaban.
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            <div className="flex items-center justify-end border-t border-[var(--c-border)] pt-3">
              <button
                type="button"
                onClick={() => setIsHealthModalOpen(false)}
                className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white hover:bg-sky-400"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
