"use client"

import { useState, useRef, useCallback, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2,
  RotateCcw,
  Ban,
  Check,
  Sparkles,
  Clock,
  Zap,
  Database,
  History,
} from "lucide-react"

import { useTheme } from "@/providers/theme-provider"
import UploadResultSummaryCard from "@/features/upload/components/UploadResultSummaryCard"
import type { UploadResult } from "@/features/upload/types/Upload"
import { API_ORIGIN, apiUrl } from "@/lib/api"

/* ============================================================
   TYPES
   ============================================================ */

type DatasetType = "omnix" | "voice" | "csat"

type UploadStatus =
  | "idle"
  | "uploading"
  | "success"
  | "error"
  | "aborted"

interface SelectedFile {
  file: File
  valid: boolean
  reason?: string
}

// UploadResult interface moved to "@/features/upload/types/Upload" based on instructions,
// but keeping this internal one if it differs. Assuming we use the imported one.
// If you encounter a conflict, you can remove this internal definition.
interface InternalUploadResult {
  ok: boolean
  data?: UploadResult
  error?: string
}

interface HistoryEntry {
  id: string
  filename: string
  size: number
  type: DatasetType
  status: "success" | "error"
  timestamp: number
}

interface UploadMetrics {
  speed: number // bytes/sec
  eta: number // seconds
}

/* ============================================================
   CONSTANTS
   ============================================================ */

const UPLOAD_API = apiUrl("/api/upload")

const ALLOWED_TYPES = [
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
] as const

const ALLOWED_EXTENSIONS = [".csv", ".xlsx", ".xls"] as const

const MAX_SIZE_MB = 10
const MAX_RETRY = 3
const MAX_HISTORY = 5

const DATASET_OPTIONS: {
  value: DatasetType
  label: string
  desc: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}[] = [
  {
    value: "omnix",
    label: "Omnix",
    desc: "Omnichannel data",
    icon: Database,
  },
  {
    value: "voice",
    label: "Voice",
    desc: "Call transcripts",
    icon: Sparkles,
  },
  {
    value: "csat",
    label: "CSAT",
    desc: "Satisfaction scores",
    icon: Zap,
  },
]

const UPLOAD_GUIDE = [
  "Format CSV atau Excel (.xlsx) saja",
  "Pastikan mapping kolom sudah sesuai",
  `Ukuran maksimal file: ${MAX_SIZE_MB} MB`,
  `Target Backend: ${API_ORIGIN}`,
]

/* ============================================================
   THEME TOKENS — Indigo/Violet premium palette
   ============================================================ */

const DARK_VARS: React.CSSProperties = {
  "--c-bg": "#0a0a14",
  "--c-bg-mesh": "#13132a",
  "--c-surface": "#13131f",
  "--c-surface-2": "#1a1a2e",
  "--c-offset": "#1f1f35",
  "--c-border": "rgba(255,255,255,0.06)",
  "--c-border-strong": "rgba(255,255,255,0.12)",
  "--c-text": "#e9eaf3",
  "--c-text-soft": "#b4b8cc",
  "--c-muted": "#6b7088",
  "--c-skeleton": "#252a3d",

  "--c-accent": "#818cf8", // indigo-400
  "--c-accent-2": "#a78bfa", // violet-400
  "--c-accent-deep": "#6366f1", // indigo-500
  "--c-accent-soft": "rgba(129,140,248,0.12)",
  "--c-accent-glow": "rgba(129,140,248,0.30)",

  "--c-success": "#34d399",
  "--c-success-soft": "rgba(52,211,153,0.12)",
  "--c-danger": "#f87171",
  "--c-danger-soft": "rgba(248,113,113,0.10)",
  "--c-overlay": "rgba(255,255,255,0.03)",
  "--c-overlay-2": "rgba(255,255,255,0.05)",
  "--c-inset": "rgba(255,255,255,0.04)",
} as React.CSSProperties

const LIGHT_VARS: React.CSSProperties = {
  "--c-bg": "#fafafe",
  "--c-bg-mesh": "#f4f4fb",
  "--c-surface": "#ffffff",
  "--c-surface-2": "#fafafe",
  "--c-offset": "#f4f4fb",
  "--c-border": "rgba(15,15,40,0.07)",
  "--c-border-strong": "rgba(15,15,40,0.14)",
  "--c-text": "#15162a",
  "--c-text-soft": "#3a3d52",
  "--c-muted": "#6b7088",
  "--c-skeleton": "#eaeaf2",

  "--c-accent": "#6366f1",
  "--c-accent-2": "#8b5cf6",
  "--c-accent-deep": "#4f46e5",
  "--c-accent-soft": "rgba(99,102,241,0.08)",
  "--c-accent-glow": "rgba(99,102,241,0.22)",

  "--c-success": "#059669",
  "--c-success-soft": "rgba(5,150,105,0.10)",
  "--c-danger": "#dc2626",
  "--c-danger-soft": "rgba(220,38,38,0.08)",
  "--c-overlay": "rgba(15,15,40,0.02)",
  "--c-overlay-2": "rgba(15,15,40,0.04)",
  "--c-inset": "rgba(255,255,255,0.6)",
} as React.CSSProperties

/* ============================================================
   PURE HELPERS
   ============================================================ */

function validateFile(file: File): SelectedFile {
  const ext = "." + (file.name.split(".").pop()?.toLowerCase() ?? "")
  const sizeOk = file.size / (1024 * 1024) <= MAX_SIZE_MB
  const typeOk =
    (ALLOWED_TYPES as readonly string[]).includes(file.type) ||
    (ALLOWED_EXTENSIONS as readonly string[]).includes(ext)

  if (!typeOk) return { file, valid: false, reason: "Hanya CSV / Excel" }
  if (!sizeOk) return { file, valid: false, reason: `Maks ${MAX_SIZE_MB} MB` }

  return { file, valid: true }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatSpeed(bps: number): string {
  if (bps < 1024) return `${Math.round(bps)} B/s`
  if (bps < 1024 * 1024) return `${(bps / 1024).toFixed(1)} KB/s`
  return `${(bps / (1024 * 1024)).toFixed(1)} MB/s`
}

function formatEta(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "—"
  if (seconds < 60) return `${Math.round(seconds)}s`

  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)

  return `${m}m ${s}s`
}

function formatRelative(ts: number): string {
  const diff = (Date.now() - ts) / 1000

  if (diff < 5) return "baru saja"
  if (diff < 60) return `${Math.round(diff)}s lalu`
  if (diff < 3600) return `${Math.round(diff / 60)}m lalu`
  if (diff < 86400) return `${Math.round(diff / 3600)}h lalu`

  return `${Math.round(diff / 86400)}d lalu`
}

function getFileColor(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase()

  if (ext === "csv") return "var(--c-accent)"
  if (ext === "xlsx" || ext === "xls") return "var(--c-success)"

  return "var(--c-muted)"
}

function FileTypeIcon({
  filename,
  size = 18,
  className,
}: {
  filename?: string
  size?: number
  className?: string
}) {
  const ext = filename?.split(".").pop()?.toLowerCase()

  if (ext === "csv") {
    return <FileText size={size} className={className} />
  }

  if (ext === "xlsx" || ext === "xls") {
    return <FileSpreadsheet size={size} className={className} />
  }

  return <UploadCloud size={size} className={className} />
}

/* ============================================================
   ANIMATION VARIANTS
   ============================================================ */

const CONTAINER_VARIANTS = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
}

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      ease: [0.25, 0.46, 0.45, 0.94] as const,
      duration: 0.45,
    },
  },
}

/* ============================================================
   HOOK · useFileUpload
   ============================================================ */

function useFileUpload(
  onSuccess?: (entry: Omit<HistoryEntry, "id" | "timestamp">) => void
) {
  const [status, setStatus] = useState<UploadStatus>("idle")
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState("")
  const [retryCount, setRetryCount] = useState(0)
  const [metrics, setMetrics] = useState<UploadMetrics>({
    speed: 0,
    eta: 0,
  })

  const xhrRef = useRef<XMLHttpRequest | null>(null)
  const lastSampleRef = useRef<{ t: number; loaded: number }>({
    t: 0,
    loaded: 0,
  })

  const reset = useCallback(() => {
    xhrRef.current?.abort()
    xhrRef.current = null

    setStatus("idle")
    setProgress(0)
    setErrorMsg("")
    setRetryCount(0)
    setMetrics({ speed: 0, eta: 0 })
  }, [])

  const abort = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort()
      xhrRef.current = null
      setStatus("aborted")
      setErrorMsg("Upload dibatalkan")
    }
  }, [])

  const upload = useCallback(
    (file: File, type: DatasetType): Promise<InternalUploadResult> =>
      new Promise((resolve) => {
        const xhr = new XMLHttpRequest()
        xhrRef.current = xhr
        lastSampleRef.current = { t: Date.now(), loaded: 0 }

        const formData = new FormData()
        formData.append("file", file)
        formData.append("type", type)

        setStatus("uploading")
        setProgress(0)
        setErrorMsg("")
        setMetrics({ speed: 0, eta: 0 })

        xhr.upload.addEventListener("progress", (e) => {
          if (!e.lengthComputable) return

          const pct = Math.round((e.loaded / e.total) * 100)
          setProgress(Math.min(pct, 99))

          // Calculate speed & ETA — sliding window
          const now = Date.now()
          const dt = (now - lastSampleRef.current.t) / 1000

          if (dt > 0.2) {
            const dBytes = e.loaded - lastSampleRef.current.loaded
            const speed = dBytes / dt
            const remaining = e.total - e.loaded
            const eta = speed > 0 ? remaining / speed : 0

            setMetrics({ speed, eta })
            lastSampleRef.current = { t: now, loaded: e.loaded }
          }
        })

        xhr.addEventListener("load", () => {
          xhrRef.current = null

          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText || "{}")

              if (data?.error) {
                setStatus("error")
                setErrorMsg(data.error)

                onSuccess?.({
                  filename: file.name,
                  size: file.size,
                  type,
                  status: "error",
                })

                resolve({ ok: false, error: data.error })
                return
              }

              setProgress(100)
              setStatus("success")

              onSuccess?.({
                filename: file.name,
                size: file.size,
                type,
                status: "success",
              })

              resolve({ ok: true, data })
            } catch {
              setProgress(100)
              setStatus("success")

              onSuccess?.({
                filename: file.name,
                size: file.size,
                type,
                status: "success",
              })

              resolve({ ok: true })
            }
          } else {
            const msg = `Server error · HTTP ${xhr.status}`
            setStatus("error")
            setErrorMsg(msg)
            resolve({ ok: false, error: msg })
          }
        })

        xhr.addEventListener("error", () => {
          xhrRef.current = null

          const msg = "Kesalahan koneksi ke server"
          setStatus("error")
          setErrorMsg(msg)
          resolve({ ok: false, error: msg })
        })

        xhr.addEventListener("abort", () => {
          xhrRef.current = null
          resolve({ ok: false, error: "aborted" })
        })
        
        xhr.open("POST", UPLOAD_API)
        xhr.send(formData)
      }),
    [onSuccess]
  )

  const retry = useCallback(
    async (file: File, type: DatasetType): Promise<InternalUploadResult> => {
      if (retryCount >= MAX_RETRY) {
        return {
          ok: false,
          error: "Max retry reached",
        }
      }

      setRetryCount((c) => c + 1)

      return await upload(file, type)
    },
    [retryCount, upload]
  )

  useEffect(() => {
    return () => {
      xhrRef.current?.abort()
    }
  }, [])

  return {
    status,
    progress,
    errorMsg,
    retryCount,
    metrics,
    upload,
    retry,
    abort,
    reset,
  }
}

/* ============================================================
   SUB-COMPONENT · Stepper
   ============================================================ */

function Stepper({ active }: { active: 0 | 1 | 2 }) {
  const steps = [
    { label: "Dataset", desc: "Pilih tipe" },
    { label: "File", desc: "Upload file" },
    { label: "Selesai", desc: "Proses data" },
  ]

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, i) => {
        const isActive = i === active
        const isDone = i < active
        const isLast = i === steps.length - 1

        return (
          <div
            key={step.label}
            className={`flex items-center ${isLast ? "justify-end" : "flex-1"}`}
          >
            <div className={`flex items-center gap-3 ${isLast ? "text-right" : ""}`}>
              <motion.div
                animate={{ scale: isActive ? 1.05 : 1 }}
                className={`
                  relative
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-full
                  border
                  text-[11px]
                  font-bold
                  transition-all
                  duration-300
                  ${
                    isDone
                      ? "border-(--c-accent) bg-(--c-accent) text-white"
                      : isActive
                        ? "border-(--c-accent) bg-(--c-accent-soft) text-(--c-accent) shadow-[0_0_0_4px_var(--c-accent-soft)]"
                        : "border-(--c-border) bg-(--c-overlay) text-(--c-muted)"
                  }
                `}
              >
                {isDone ? <Check size={14} strokeWidth={3} /> : i + 1}

                {isActive && (
                  <motion.span
                    className="absolute inset-0 rounded-full"
                    animate={{
                      boxShadow: [
                        "0 0 0 0 var(--c-accent-glow)",
                        "0 0 0 8px transparent",
                      ],
                    }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                  />
                )}
              </motion.div>

              <div className="hidden flex-col leading-tight sm:flex">
                <span
                  className={`text-xs font-semibold ${
                    isActive || isDone
                      ? "text-(--c-text)"
                      : "text-(--c-muted)"
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[10px] text-(--c-muted)">
                  {step.desc}
                </span>
              </div>
            </div>

            {!isLast && (
              <div className="mx-3 h-px flex-1 overflow-hidden rounded-full bg-(--c-border)">
                <motion.div
                  className="h-full bg-linear-to-r from-(--c-accent) to-(--c-accent-2)"
                  initial={{ width: "0%" }}
                  animate={{ width: isDone ? "100%" : "0%" }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ============================================================
   SUB-COMPONENT · Visual primitives
   ============================================================ */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="
        mb-3
        text-[10px]
        font-bold
        uppercase
        tracking-[0.18em]
        text-(--c-muted)
      "
    >
      {children}
    </p>
  )
}

/* ============================================================
   SUB-COMPONENT · TypeSelector (premium tactile)
   ============================================================ */

function TypeSelector({
  value,
  onChange,
  disabled,
}: {
  value: DatasetType
  onChange: (v: DatasetType) => void
  disabled?: boolean
}) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-2.5">
        {DATASET_OPTIONS.map((opt) => {
          const active = value === opt.value
          const Icon = opt.icon

          return (
            <motion.button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              whileTap={{ scale: 0.97 }}
              className={`
                group
                relative
                overflow-hidden
                rounded-xl
                border
                px-3
                py-3.5
                text-left
                transition-all
                duration-200
                disabled:cursor-not-allowed
                disabled:opacity-50
                ${
                  active
                    ? "border-(--c-accent) bg-linear-to-br from-(--c-accent-soft) to-transparent shadow-[0_0_0_1px_var(--c-accent-soft),0_8px_24px_-12px_var(--c-accent-glow)]"
                    : "border-(--c-border) bg-(--c-overlay) hover:border-(--c-border-strong) hover:bg-(--c-overlay-2)"
                }
              `}
            >
              {active && (
                <motion.div
                  layoutId="type-glow"
                  className="absolute -inset-px rounded-xl bg-linear-to-br from-(--c-accent)/0 via-(--c-accent)/8 to-(--c-accent-2)/8"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              <div className="relative flex items-start gap-2">
                <div
                  className={`
                    flex
                    h-6
                    w-6
                    shrink-0
                    items-center
                    justify-center
                    rounded-md
                    transition-colors
                    ${
                      active
                        ? "bg-(--c-accent) text-white"
                        : "bg-(--c-overlay-2) text-(--c-muted) group-hover:text-(--c-text-soft)"
                    }
                  `}
                >
                  <Icon size={12} />
                </div>

                <div className="min-w-0 flex-1">
                  <div
                    className={`
                      text-sm
                      font-semibold
                      ${
                        active
                          ? "text-(--c-text)"
                          : "text-(--c-text-soft)"
                      }
                    `}
                  >
                    {opt.label}
                  </div>

                  <div className="mt-0.5 truncate text-[10px] text-(--c-muted)">
                    {opt.desc}
                  </div>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

/* ============================================================
   SUB-COMPONENT · DropZone (hero + animated orb)
   ============================================================ */

function DropZone({
  selected,
  onSelect,
  onClear,
  dragActive,
  setDragActive,
  inputRef,
  disabled,
}: {
  selected: SelectedFile | null
  onSelect: (f: File) => void
  onClear: () => void
  dragActive: boolean
  setDragActive: (b: boolean) => void
  inputRef: React.RefObject<HTMLInputElement | null> // <-- Perbaikan 1: Tambah | null di sini
  disabled?: boolean
}) {
  const dragCounter = useRef(0)

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current += 1
    if (e.dataTransfer.items?.length) setDragActive(true)
  }

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current -= 1
    if (dragCounter.current === 0) setDragActive(false)
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    setDragActive(false)

    if (disabled) return

    const f = e.dataTransfer.files?.[0]
    if (f) onSelect(f)
  }

  const fileColor = selected
    ? getFileColor(selected.file.name)
    : "var(--c-muted)"

  return (
    <div>
      <motion.div
        animate={dragActive ? { scale: 1.01 } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={() => {
          // <-- Perbaikan 2: Ubah onClick jadi pakai if statement
          if (!selected && !disabled && inputRef && inputRef.current) {
            inputRef.current.click()
          }
        }}
        className={`
          relative
          overflow-hidden
          rounded-2xl
          transition-all
          duration-300
          ${!selected && !disabled ? "cursor-pointer" : ""}
          ${
            dragActive
              ? "border-2 border-(--c-accent) bg-(--c-accent-soft) shadow-[0_0_40px_-8px_var(--c-accent-glow)]"
              : selected
                ? "border border-(--c-border) bg-(--c-overlay)"
                : "border-2 border-dashed border-(--c-border-strong) bg-(--c-overlay) hover:border-(--c-accent)/60 hover:bg-(--c-accent-soft)"
          }
        `}
      >
        {/* Animated ambient orb — idle state only */}
        {!selected && (
          <>
            <motion.div
              className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-(--c-accent) opacity-[0.08] blur-3xl"
              animate={{
                x: [0, 20, 0],
                y: [0, 10, 0],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="pointer-events-none absolute -bottom-16 -right-12 h-40 w-40 rounded-full bg-(--c-accent-2) opacity-[0.08] blur-3xl"
              animate={{
                x: [0, -20, 0],
                y: [0, -10, 0],
              }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            />
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          hidden
          accept=".csv,.xlsx,.xls"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onSelect(f)
            e.target.value = ""
          }}
        />

        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key="file-preview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="relative flex items-center gap-3 p-4"
            >
              <div
                className={`
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  ${
                    selected.valid
                      ? "border-(--c-border) bg-(--c-overlay-2)"
                      : "border-(--c-danger)/30 bg-(--c-danger-soft)"
                  }
                `}
                style={{
                  color: selected.valid ? fileColor : "var(--c-danger)",
                }}
              >
                <FileTypeIcon filename={selected?.file.name} size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-(--c-text)">
                  {selected.file.name}
                </p>

                <div className="mt-1 flex items-center gap-2 text-[11px] text-(--c-muted)">
                  <span>{formatBytes(selected.file.size)}</span>
                  <span className="opacity-40">•</span>
                  <span className="font-mono uppercase">
                    {selected.file.name.split(".").pop()}
                  </span>

                  {!selected.valid && (
                    <>
                      <span className="opacity-40">•</span>
                      <span className="font-medium text-(--c-danger)">
                        {selected.reason}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onClear()
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-(--c-border) bg-(--c-overlay) text-(--c-muted) transition hover:border-(--c-danger)/40 hover:bg-(--c-danger-soft) hover:text-(--c-danger)"
                  aria-label="Clear file"
                >
                  <X size={13} />
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="relative flex flex-col items-center justify-center px-4 py-4 text-center"
            >
              <motion.div
                animate={
                  dragActive
                    ? { y: -4, scale: 1.08 }
                    : { y: [0, -3, 0], scale: 1 }
                }
                transition={
                  dragActive
                    ? { type: "spring", stiffness: 300, damping: 18 }
                    : { duration: 3, repeat: Infinity, ease: "easeInOut" }
                }
                className="relative mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-(--c-accent-soft) to-(--c-overlay-2)"
              >
                <div className="absolute inset-0 rounded-xl border border-(--c-border)" />
                <UploadCloud
                  size={18}
                  className={
                    dragActive
                      ? "text-(--c-accent)"
                      : "text-(--c-text-soft)"
                  }
                />
              </motion.div>

              <p className="text-[13px] font-semibold text-(--c-text)">
                {dragActive
                  ? "Lepas untuk upload"
                  : "Drop file atau klik untuk pilih"}
              </p>

              <p className="mt-1 text-[11px] text-(--c-muted)">
                CSV / Excel · Maks {MAX_SIZE_MB} MB
              </p>

              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-(--c-muted)">
                <kbd className="rounded border border-(--c-border) bg-(--c-overlay-2) px-1.5 py-0.5 font-mono">
                  ⏎
                </kbd>
                <span>untuk pilih file</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

/* ============================================================
   SUB-COMPONENT · ProgressBar (premium with metrics)
   ============================================================ */

function ProgressBar({
  progress,
  metrics,
  onAbort,
}: {
  progress: number
  metrics: UploadMetrics
  onAbort: () => void
}) {
  return (
    <div className="rounded-xl border border-(--c-border) bg-(--c-overlay) p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Loader2 size={13} className="animate-spin text-(--c-accent)" />
          <span className="text-xs font-medium text-(--c-text-soft)">
            Mengupload data…
          </span>
        </div>

        <button
          type="button"
          onClick={onAbort}
          className="
            flex
            items-center
            gap-1
            rounded-md
            px-2
            py-1
            text-[10px]
            font-medium
            text-(--c-muted)
            transition
            hover:bg-(--c-danger-soft)
            hover:text-(--c-danger)
          "
        >
          <Ban size={10} />
          Batalkan
        </button>
      </div>

      {/* Bar with shimmer */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-(--c-overlay-2)">
        <motion.div
          className="relative h-full overflow-hidden rounded-full bg-linear-to-r from-(--c-accent) to-(--c-accent-2)"
          animate={{ width: `${progress}%` }}
          transition={{ ease: "easeOut", duration: 0.3 }}
        >
          <motion.div
            className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </div>

      {/* Metrics row */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
        <div>
          <div className="text-(--c-muted)">Progress</div>
          <div className="mt-0.5 font-mono text-sm font-bold text-(--c-accent)">
            {progress}%
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1 text-(--c-muted)">
            <Zap size={9} /> Speed
          </div>
          <div className="mt-0.5 font-mono text-sm font-bold text-(--c-text)">
            {formatSpeed(metrics.speed)}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1 text-(--c-muted)">
            <Clock size={9} /> ETA
          </div>
          <div className="mt-0.5 font-mono text-sm font-bold text-(--c-text)">
            {formatEta(metrics.eta)}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   SUB-COMPONENT · StatusBadge
   ============================================================ */

function StatusBadge({
  status,
  error,
}: {
  status: UploadStatus
  error?: string
}) {
  const map: Record<
    UploadStatus,
    {
      label: string
      color: string
      bg: string
      icon: React.ReactNode | null
    }
  > = {
    idle: {
      label: "Siap upload",
      color: "var(--c-muted)",
      bg: "var(--c-overlay-2)",
      icon: <div className="h-1.5 w-1.5 rounded-full bg-(--c-muted)" />,
    },
    uploading: {
      label: "Mengupload…",
      color: "var(--c-accent)",
      bg: "var(--c-accent-soft)",
      icon: <Loader2 size={11} className="animate-spin" />,
    },
    success: {
      label: "Berhasil",
      color: "var(--c-success)",
      bg: "var(--c-success-soft)",
      icon: <CheckCircle size={11} />,
    },
    error: {
      label: error || "Upload gagal",
      color: "var(--c-danger)",
      bg: "var(--c-danger-soft)",
      icon: <AlertCircle size={11} />,
    },
    aborted: {
      label: error || "Dibatalkan",
      color: "var(--c-muted)",
      bg: "var(--c-overlay-2)",
      icon: <Ban size={11} />,
    },
  }

  const { label, color, bg, icon } = map[status]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
        style={{ color, backgroundColor: bg }}
      >
        {icon}
        {label}
      </motion.div>
    </AnimatePresence>
  )
}

/* ============================================================
   SUB-COMPONENT · Upload History
   ============================================================ */

function UploadHistory({ history }: { history: HistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <div className="py-3 text-center text-[10px] text-(--c-muted)">
        Belum ada upload di session ini
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      <AnimatePresence initial={false}>
        {history.map((entry) => {
          const success = entry.status === "success"

          return (
            <motion.li
              key={entry.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.25 }}
              className="
                flex
                items-center
                gap-2.5
                rounded-lg
                border
                border-(--c-border)
                bg-(--c-overlay)
                p-2.5
              "
            >
              <div
                className={`
                  flex
                  h-7
                  w-7
                  shrink-0
                  items-center
                  justify-center
                  rounded-md
                  ${
                    success
                      ? "bg-(--c-success-soft) text-(--c-success)"
                      : "bg-(--c-danger-soft) text-(--c-danger)"
                  }
                `}
              >
                <FileTypeIcon filename={entry.filename} size={12} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] font-medium text-(--c-text)">
                  {entry.filename}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-(--c-muted)">
                  <span className="font-mono uppercase">{entry.type}</span>
                  <span className="opacity-40">•</span>
                  <span>{formatBytes(entry.size)}</span>
                  <span className="opacity-40">•</span>
                  <span>{formatRelative(entry.timestamp)}</span>
                </div>
              </div>

              {success ? (
                <CheckCircle size={12} className="text-(--c-success)" />
              ) : (
                <AlertCircle size={12} className="text-(--c-danger)" />
              )}
            </motion.li>
          )
        })}
      </AnimatePresence>
    </ul>
  )
}

/* ============================================================
   MAIN
   ============================================================ */

export default function UploadPage() {
  const { isDark } = useTheme()
  const cssVars = isDark ? DARK_VARS : LIGHT_VARS

  const [selected, setSelected] = useState<SelectedFile | null>(null)
  const [type, setType] = useState<DatasetType>("omnix")
  const [dragActive, setDragActive] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  const handleHistoryAdd = useCallback(
    (entry: Omit<HistoryEntry, "id" | "timestamp">) => {
      setHistory((prev) =>
        [
          {
            ...entry,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            timestamp: Date.now(),
          },
          ...prev,
        ].slice(0, MAX_HISTORY)
      )
    },
    []
  )

  const {
    status,
    progress,
    errorMsg,
    retryCount,
    metrics,
    upload,
    retry,
    abort,
    reset,
  } = useFileUpload(handleHistoryAdd)

  const isUploading = status === "uploading"
  const isSuccess = status === "success"
  const isError = status === "error" || status === "aborted"

  const handleSelect = useCallback(
    (file: File) => {
      setUploadResult(null)
      setSelected(validateFile(file))
      reset()
    },
    [reset]
  )

  const handleClear = useCallback(() => {
    setSelected(null)
    setUploadResult(null)
    reset()
  }, [reset])

  const handleUpload = useCallback(async () => {
    if (!selected?.valid || isUploading || isSuccess) return

    const result = await upload(selected.file, type)

    if (result.ok && result.data) {
      setUploadResult(result.data as UploadResult)
    }
  }, [selected, type, isUploading, isSuccess, upload])

  const handleRetry = useCallback(async () => {
    if (!selected?.valid) return

    const result = await retry(selected.file, type)

    if (result.ok && result.data) {
      setUploadResult(result.data as UploadResult)
    }
  }, [selected, type, retry])

  const activeStep: 0 | 1 | 2 = useMemo(() => {
    if (isSuccess) return 2
    if (selected?.valid) return 1
    return 0
  }, [selected, isSuccess])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return

      if (e.key === "Escape") {
        if (isUploading) abort()
        else if (selected) handleClear()
      } else if (e.key === "Enter") {
        if (!selected) inputRef.current?.click()
        else if (selected.valid && !isUploading && !isSuccess) handleUpload()
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isUploading, selected, isSuccess, abort, handleClear, handleUpload])

  return (
    <div
      style={cssVars}
      className="
        min-h-dvh
        overflow-hidden
        bg-(--c-bg)
        font-[Plus_Jakarta_Sans,Inter,sans-serif]
        text-(--c-text)
        transition-colors
      "
    >
      <div className="mx-auto max-w-280 px-2 py-3 sm:px-3 sm:py-4 lg:px-3 lg:py-4">
        <motion.div
          variants={CONTAINER_VARIANTS}
          initial="hidden"
          animate="show"
          className="space-y-2"
        >
          {/* Header */}
          <motion.div variants={ITEM_VARIANTS}>
            <div className="flex flex-col gap-3 rounded-2xl border border-(--c-border) bg-(--c-surface) px-4 py-3 shadow-sm sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-(--c-accent-soft) text-(--c-accent)">
                    <UploadCloud size={16} />
                  </div>

                  <div>
                    <h1 className="text-lg font-semibold tracking-tight text-(--c-text)">
                      Upload Data
                    </h1>

                    <p className="mt-0.5 text-xs text-(--c-text-soft)">
                      Import dataset ke monitoring system GUNDAM.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start rounded-full border border-(--c-border) bg-(--c-overlay) px-2.5 py-1 text-[11px] font-medium text-(--c-text-soft)">
                <span className="h-2 w-2 rounded-full bg-(--c-accent)" />
                Workspace aktif
              </div>
            </div>
          </motion.div>

          {/* Stepper */}
          <motion.div variants={ITEM_VARIANTS}>
            <div className="rounded-2xl border border-(--c-border) bg-(--c-surface) p-4 shadow-sm">
              <Stepper active={activeStep} />
            </div>
          </motion.div>

          {/* Content */}
          <div className="grid grid-cols-12 gap-x-4 gap-y-4">
            {/* Main */}
            <motion.div
              variants={ITEM_VARIANTS}
              className="col-span-12 lg:col-span-8"
            >
              <div className="rounded-2xl border border-(--c-border) bg-(--c-surface) p-5 shadow-sm sm:p-6">
                <div className="mb-4">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-(--c-muted)">
                    Upload flow
                  </h2>
                </div>

                <div className="space-y-4">
                  {!isSuccess && (
                    <>
                      <section className="space-y-2">
                        <div>
                          <h3 className="text-sm font-semibold text-(--c-text)">
                            1. Dataset type
                          </h3>
                        </div>

                        <TypeSelector
                          value={type}
                          onChange={setType}
                          disabled={isUploading}
                        />
                      </section>

                      <div className="h-px bg-(--c-border)" />

                      <section className="space-y-3">
                        <div>
                          <h3 className="text-sm font-semibold text-(--c-text)">
                            2. File upload
                          </h3>
                        </div>

                        <DropZone
                          selected={selected}
                          onSelect={handleSelect}
                          onClear={handleClear}
                          dragActive={dragActive}
                          setDragActive={setDragActive}
                          inputRef={inputRef}
                          disabled={isUploading}
                        />
                      </section>
                    </>
                  )}

                  <AnimatePresence>
                    {isUploading && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                      >
                        <div className="rounded-2xl border border-(--c-border) bg-(--c-overlay) p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                              <h3 className="text-sm font-semibold text-(--c-text)">
                                Uploading
                              </h3>
                              <p className="mt-1 text-xs text-(--c-text-soft)">
                                File sedang dikirim ke server, tunggu sampai
                                proses selesai.
                              </p>
                            </div>
                          </div>

                          <ProgressBar
                            progress={progress}
                            metrics={metrics}
                            onAbort={abort}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {isSuccess && uploadResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                      >
                        <div className="space-y-3">
                          <div>
                            <h3 className="text-sm font-semibold text-(--c-text)">
                              3. Upload result
                            </h3>
                            <p className="mt-1 text-xs text-(--c-text-soft)">
                              File berhasil diproses. Tinjau hasil ringkas di
                              bawah ini.
                            </p>
                          </div>

                          <UploadResultSummaryCard result={uploadResult} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {isError && errorMsg && (
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle
                          size={16}
                          className="mt-0.5 shrink-0 text-red-400"
                        />
                        <div>
                          <p className="text-sm font-semibold text-red-300">
                            Upload gagal
                          </p>
                          <p className="mt-1 text-xs text-red-200/80">
                            {errorMsg}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="h-px bg-(--c-border)" />

                  {/* Actions */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={
                        !selected
                          ? () => inputRef.current?.click()
                          : handleUpload
                      }
                      disabled={
                        isUploading ||
                        isSuccess ||
                        (selected ? !selected.valid : false)
                      }
                      className={`
                        inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition
                        ${
                          isUploading ||
                          isSuccess ||
                          (selected ? !selected.valid : false)
                            ? "cursor-not-allowed bg-(--c-overlay-2) text-(--c-muted)"
                            : "bg-(--c-accent) text-white hover:opacity-90"
                        }
                      `}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Mengupload...
                        </>
                      ) : isSuccess ? (
                        <>
                          <CheckCircle size={16} />
                          Upload selesai
                        </>
                      ) : !selected ? (
                        <>
                          <UploadCloud size={16} />
                          Pilih File
                        </>
                      ) : (
                        <>
                          <UploadCloud size={16} />
                          Upload Sekarang
                        </>
                      )}
                    </button>

                    {isError && selected?.valid && retryCount < MAX_RETRY && (
                      <button
                        type="button"
                        onClick={handleRetry}
                        className="
                          inline-flex min-h-11 items-center justify-center gap-2 rounded-xl
                          border border-(--c-border-strong)
                          bg-(--c-surface)
                          px-4 py-3 text-sm font-medium text-(--c-text-soft)
                          transition hover:border-(--c-accent) hover:text-(--c-accent)
                        "
                      >
                        <RotateCcw size={15} />
                        Retry
                      </button>
                    )}

                    {(selected || isSuccess) && !isUploading && (
                      <button
                        type="button"
                        onClick={handleClear}
                        className="
                          inline-flex min-h-11 items-center justify-center gap-2 rounded-xl
                          border border-(--c-border-strong)
                          bg-(--c-surface)
                          px-4 py-3 text-sm font-medium text-(--c-text-soft)
                          transition hover:border-(--c-accent) hover:text-(--c-accent)
                        "
                      >
                        <X size={15} />
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Sidebar */}
            <div className="col-span-12 space-y-2 lg:col-span-4">
              <motion.div variants={ITEM_VARIANTS}>
                <div className="rounded-2xl border border-(--c-border) bg-(--c-surface) p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <SectionLabel>Status</SectionLabel>
                    {retryCount > 0 && (
                      <span className="text-[11px] text-(--c-muted)">
                        Retry {retryCount}/{MAX_RETRY}
                      </span>
                    )}
                  </div>
                  <StatusBadge status={status} error={errorMsg} />
                </div>
              </motion.div>

              <motion.div variants={ITEM_VARIANTS}>
                <div className="rounded-2xl border border-(--c-border) bg-(--c-surface) p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <SectionLabel>Upload rules</SectionLabel>
                    <Info size={14} className="text-(--c-muted)" />
                  </div>

                  <div className="space-y-4">
                    <ul className="space-y-2.5">
                      {UPLOAD_GUIDE.map((tip, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 text-xs text-(--c-text-soft)"
                        >
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-(--c-accent)" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="border-t border-(--c-border) pt-4">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-(--c-muted)">
                        Supported format
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {ALLOWED_EXTENSIONS.map((ext) => (
                          <span
                            key={ext}
                            className="
                              rounded-lg border border-(--c-border)
                              bg-(--c-overlay) px-2.5 py-1
                              font-mono text-[11px] font-semibold text-(--c-text)
                            "
                          >
                            {ext}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {history.length > 0 && (
                <motion.div variants={ITEM_VARIANTS}>
                  <div className="rounded-2xl border border-(--c-border) bg-(--c-surface) p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <SectionLabel>Recent uploads</SectionLabel>
                      <History size={14} className="text-(--c-muted)" />
                    </div>
                    <UploadHistory history={history} />
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
