"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangleIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  DatabaseIcon,
  FilterIcon,
  Loader2Icon,
  RefreshCcwIcon,
  SearchIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react"

import {
  deleteUploadSession,
  listUploadSessions,
  previewUploadSessionDelete,
} from "@/services/upload-session-service"
import type {
  UploadSessionDeletePreview,
  UploadSessionDeleteResult,
  UploadSessionItem,
  UploadSessionStatus,
  UploadSessionType,
} from "@/features/upload-sessions/types/upload-session"

const TYPE_OPTIONS: Array<{ value: UploadSessionType; label: string }> = [
  { value: "all", label: "All type" },
  { value: "omnix", label: "Omnix" },
  { value: "voice", label: "Voice" },
  { value: "csat", label: "CSAT" },
]

const STATUS_OPTIONS: Array<{ value: UploadSessionStatus; label: string }> = [
  { value: "all", label: "All status" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "processing", label: "Processing" },
]

function formatDateInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function defaultRange() {
  const now = new Date()
  return {
    dateFrom: formatDateInput(new Date(now.getFullYear(), now.getMonth(), 1)),
    dateTo: formatDateInput(now),
  }
}

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("id-ID").format(value ?? 0)
}

function formatTimestamp(value: string | null | undefined) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function statusClass(status: string | null) {
  if (status === "success") return "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
  if (status === "failed") return "border-red-500/25 bg-red-500/10 text-red-400"
  return "border-amber-500/25 bg-amber-500/10 text-amber-400"
}

function deleteModeLabel(item: UploadSessionItem | UploadSessionDeletePreview) {
  if (item.delete_mode === "soft") return "Soft delete"
  if (item.delete_mode === "hard") return "Hard delete"
  return "Unsupported"
}

function Metric({
  label,
  value,
  tone = "text-(--c-text)",
}: {
  label: string
  value: string
  tone?: string
}) {
  return (
    <div className="rounded-xl border border-(--c-border) bg-(--c-overlay) px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-(--c-muted)">{label}</p>
      <p className={`mt-1 font-mono text-xl font-bold ${tone}`}>{value}</p>
    </div>
  )
}

function PreviewPanel({
  preview,
  result,
  deleting,
  isAdmin,
  onCancel,
  onDelete,
}: {
  preview: UploadSessionDeletePreview | null
  result: UploadSessionDeleteResult | null
  deleting: boolean
  isAdmin: boolean
  onCancel: () => void
  onDelete: () => void
}) {
  if (!preview && !result) return null

  const active = result ?? preview
  if (!active) return null

  return (
    <section className="rounded-2xl border border-(--c-border) bg-(--c-surface) p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
              result
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                : active.delete_mode === "hard"
                  ? "border-red-500/25 bg-red-500/10 text-red-400"
                  : "border-cyan-500/25 bg-cyan-500/10 text-cyan-400"
            }`}
          >
            {result ? <CheckCircle2Icon size={20} /> : <Trash2Icon size={19} />}
          </div>
          <div>
            <p className="text-sm font-semibold text-(--c-text)">
              {result ? "Delete session selesai" : "Preview delete session"}
            </p>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-(--c-muted)">
              {active.file_name || active.upload_id}
            </p>
            <p className="mt-2 text-xs text-(--c-muted)">
              {active.warning}
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[420px]">
          <Metric label="Mode" value={deleteModeLabel(active)} />
          <Metric label="Affected" value={formatNumber(active.affected_rows)} tone="text-amber-400" />
          <Metric label="Deleted" value={formatNumber(result?.deleted_rows ?? 0)} tone="text-red-400" />
        </div>
      </div>

      {!result ? (
        <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-(--c-border) pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-(--c-border) bg-(--c-overlay) px-4 text-xs font-semibold text-(--c-text) transition hover:bg-(--c-overlay-2)"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={!isAdmin || deleting || active.affected_rows === 0}
            className="inline-flex h-10 min-w-44 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 text-xs font-bold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:bg-(--c-overlay-2) disabled:text-(--c-muted)"
          >
            {deleting ? <Loader2Icon size={15} className="animate-spin" /> : <Trash2Icon size={15} />}
            {isAdmin ? "Delete This Session" : "Admin Only"}
          </button>
        </div>
      ) : null}
    </section>
  )
}

export default function UploadSessionsPage() {
  const defaults = useMemo(() => defaultRange(), [])
  const [dateFrom, setDateFrom] = useState(defaults.dateFrom)
  const [dateTo, setDateTo] = useState(defaults.dateTo)
  const [type, setType] = useState<UploadSessionType>("all")
  const [status, setStatus] = useState<UploadSessionStatus>("all")
  const [items, setItems] = useState<UploadSessionItem[]>([])
  const [preview, setPreview] = useState<UploadSessionDeletePreview | null>(null)
  const [result, setResult] = useState<UploadSessionDeleteResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [previewingId, setPreviewingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")
  const [sessionRole, setSessionRole] = useState<"admin" | "super_admin" | "guest" | null>(null)
  const isAdmin = sessionRole === "admin" || sessionRole === "super_admin"

  useEffect(() => {
    let active = true
    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { role?: "admin" | "super_admin" | "guest" }) => {
        if (active) setSessionRole(data.role ?? null)
      })
      .catch(() => {
        if (active) setSessionRole(null)
      })
    return () => {
      active = false
    }
  }, [])

  const loadSessions = async () => {
    setLoading(true)
    setError("")
    setPreview(null)
    setResult(null)
    try {
      const response = await listUploadSessions({ dateFrom, dateTo, type, status })
      setItems(response.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat upload session")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    listUploadSessions({
      dateFrom: defaults.dateFrom,
      dateTo: defaults.dateTo,
      type: "all",
      status: "all",
    })
      .then((response) => {
        if (active) setItems(response.items)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Gagal memuat upload session")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [defaults.dateFrom, defaults.dateTo])

  const resetFilters = () => {
    setDateFrom(defaults.dateFrom)
    setDateTo(defaults.dateTo)
    setType("all")
    setStatus("all")
    setPreview(null)
    setResult(null)
    setError("")
  }

  const handlePreview = async (item: UploadSessionItem) => {
    setPreviewingId(item.id)
    setError("")
    setResult(null)
    try {
      const response = await previewUploadSessionDelete(item.id)
      setPreview(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal preview delete session")
    } finally {
      setPreviewingId(null)
    }
  }

  const handleDelete = async () => {
    if (!preview) return
    setDeleting(true)
    setError("")
    try {
      const response = await deleteUploadSession(preview.upload_id, "admin")
      setResult(response)
      setPreview(null)
      await loadSessions()
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal delete upload session")
    } finally {
      setDeleting(false)
    }
  }

  const totals = items.reduce(
    (acc, item) => {
      acc.sessions += 1
      acc.detailRows += item.detail_rows
      acc.insertedRows += item.inserted_rows
      acc.invalidRows += item.invalid_rows
      return acc
    },
    { sessions: 0, detailRows: 0, insertedRows: 0, invalidRows: 0 }
  )

  return (
    <main className="min-h-screen bg-(--c-bg) px-4 py-8 text-(--c-text) sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-(--c-accent)">
              Data Management
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-normal text-(--c-text)">
              Upload Sessions
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-(--c-muted)">
              Filter session upload berdasarkan tanggal, preview jumlah row terdampak, lalu delete dari sisi kanan tabel.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-(--c-warning)/30 bg-(--c-warning-soft) px-3 py-2 text-xs font-semibold text-(--c-warning)">
            <ShieldCheckIcon size={14} />
            Preview required before delete
          </div>
        </header>

        <section className="rounded-2xl border border-(--c-border) bg-(--c-surface) p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FilterIcon size={16} className="text-(--c-accent)" />
            <h2 className="text-sm font-semibold text-(--c-text)">Filter Query</h2>
          </div>
          <div className="grid gap-3 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end">
            <label className="space-y-1">
              <span className="text-[11px] font-semibold text-(--c-muted)">Tanggal dari</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="h-10 w-full rounded-lg border border-(--c-border) bg-(--c-overlay) px-3 text-sm text-(--c-text) outline-none [color-scheme:dark] focus:border-(--c-accent)/50"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[11px] font-semibold text-(--c-muted)">Tanggal sampai</span>
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="h-10 w-full rounded-lg border border-(--c-border) bg-(--c-overlay) px-3 text-sm text-(--c-text) outline-none [color-scheme:dark] focus:border-(--c-accent)/50"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[11px] font-semibold text-(--c-muted)">Jenis data</span>
              <select
                value={type}
                onChange={(event) => setType(event.target.value as UploadSessionType)}
                className="h-10 w-full rounded-lg border border-(--c-border) bg-(--c-overlay) px-3 text-sm text-(--c-text) outline-none [color-scheme:dark] focus:border-(--c-accent)/50"
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[11px] font-semibold text-(--c-muted)">Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as UploadSessionStatus)}
                className="h-10 w-full rounded-lg border border-(--c-border) bg-(--c-overlay) px-3 text-sm text-(--c-text) outline-none [color-scheme:dark] focus:border-(--c-accent)/50"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-(--c-border) bg-(--c-overlay) px-3 text-xs font-semibold text-(--c-text) transition hover:bg-(--c-overlay-2)"
              >
                <RefreshCcwIcon size={14} />
                Reset
              </button>
              <button
                type="button"
                onClick={loadSessions}
                disabled={loading}
                className="inline-flex h-10 min-w-28 items-center justify-center gap-2 rounded-lg bg-(--c-accent) px-4 text-xs font-bold text-(--c-bg) transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-(--c-overlay-2) disabled:text-(--c-muted)"
              >
                {loading ? <Loader2Icon size={14} className="animate-spin" /> : <SearchIcon size={14} />}
                Cari
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-4">
          <Metric label="Sessions" value={formatNumber(totals.sessions)} />
          <Metric label="Rows Aktif" value={formatNumber(totals.detailRows)} tone="text-cyan-400" />
          <Metric label="Inserted" value={formatNumber(totals.insertedRows)} tone="text-emerald-400" />
          <Metric label="Invalid" value={formatNumber(totals.invalidRows)} tone="text-amber-400" />
        </div>

        {error ? (
          <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-xs text-red-400">
            <div className="flex items-start gap-2">
              <AlertTriangleIcon size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        ) : null}

        <PreviewPanel
          preview={preview}
          result={result}
          deleting={deleting}
          isAdmin={isAdmin}
          onCancel={() => setPreview(null)}
          onDelete={handleDelete}
        />

        <section className="overflow-hidden rounded-2xl border border-(--c-border) bg-(--c-surface) shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-(--c-border) px-5 py-4">
            <div className="flex items-center gap-2">
              <DatabaseIcon size={16} className="text-(--c-accent)" />
              <h2 className="text-sm font-semibold text-(--c-text)">Upload Session List</h2>
            </div>
            <span className="text-xs text-(--c-muted)">{formatNumber(items.length)} session</span>
          </div>
          <div className="overflow-auto">
            <table className="w-full min-w-[1120px] text-left text-xs">
              <thead className="border-b border-(--c-border) bg-(--c-overlay) text-[10px] uppercase tracking-[0.14em] text-(--c-muted)">
                <tr>
                  <th className="px-4 py-3">File</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Uploaded</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Rows</th>
                  <th className="px-4 py-3">Active Detail</th>
                  <th className="px-4 py-3">Delete Mode</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--c-border)">
                {loading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      {Array.from({ length: 8 }).map((__, cell) => (
                        <td key={cell} className="px-4 py-4">
                          <div className="h-3 w-full max-w-32 rounded bg-(--c-overlay-2)" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-(--c-muted)">
                      Tidak ada upload session untuk filter ini.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="transition hover:bg-(--c-overlay)">
                      <td className="max-w-[300px] px-4 py-3">
                        <p className="truncate font-semibold text-(--c-text)">{item.file_name || "-"}</p>
                        <p className="mt-1 truncate font-mono text-[10px] text-(--c-muted)">{item.id}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold uppercase text-(--c-text-soft)">{item.file_type || "-"}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-(--c-text-soft)">
                        {formatTimestamp(item.uploaded_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass(item.processing_status)}`}>
                          {item.processing_status || "-"}
                        </span>
                        {item.error_summary ? (
                          <p className="mt-1 max-w-56 truncate text-[10px] text-red-400">{item.error_summary}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 font-mono text-(--c-text-soft)">
                        <div>Total: {formatNumber(item.total_rows)}</div>
                        <div>Inserted: {formatNumber(item.inserted_rows)}</div>
                        <div>Duplicate: {formatNumber(item.duplicate_rows)}</div>
                        <div>Invalid: {formatNumber(item.invalid_rows)}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-lg font-bold text-(--c-text)">
                        {formatNumber(item.detail_rows)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                            item.delete_mode === "hard"
                              ? "border-red-500/25 bg-red-500/10 text-red-400"
                              : item.delete_mode === "soft"
                                ? "border-cyan-500/25 bg-cyan-500/10 text-cyan-400"
                                : "border-(--c-border) bg-(--c-overlay) text-(--c-muted)"
                          }`}
                        >
                          {deleteModeLabel(item)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handlePreview(item)}
                          disabled={previewingId === item.id || item.detail_rows === 0 || item.delete_mode === "unsupported"}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-3 text-xs font-bold text-red-400 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:border-(--c-border) disabled:bg-(--c-overlay) disabled:text-(--c-muted)"
                        >
                          {previewingId === item.id ? <Loader2Icon size={14} className="animate-spin" /> : <Trash2Icon size={14} />}
                          Preview Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}
