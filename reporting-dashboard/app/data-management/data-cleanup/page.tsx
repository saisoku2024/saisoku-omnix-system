"use client"

import { useMemo, useState } from "react"
import {
  AlertTriangleIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  DatabaseIcon,
  Loader2Icon,
  MailIcon,
  PhoneOffIcon,
  RefreshCcwIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react"

import { previewCleanup, softDeleteCleanup } from "@/services/cleanup-service"
import type {
  CleanupCandidate,
  CleanupPreviewResponse,
  CleanupRule,
  CleanupSoftDeleteResponse,
} from "@/features/data-cleanup/types/cleanup"

const RULES: Array<{
  id: CleanupRule
  title: string
  description: string
  icon: React.ComponentType<{ className?: string; size?: number }>
}> = [
  {
    id: "abandon_match",
    title: "Voice Abandon Cleanup",
    description: "Soft-clean Voice abandon jika nomor HP dan tanggalnya sudah ada di Omnix.",
    icon: PhoneOffIcon,
  },
  {
    id: "test_omnix",
    title: "Test OMNIX",
    description: "Cari teks Test OMNIX di kolom teks penting Omnix.",
    icon: SparklesIcon,
  },
  {
    id: "internal_email",
    title: "Internal Email",
    description: "Cari sub category yang mengandung Internal Email.",
    icon: MailIcon,
  },
]

function formatDateInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function getDefaultDateRange() {
  const now = new Date()
  return {
    dateFrom: formatDateInput(new Date(now.getFullYear(), now.getMonth(), 1)),
    dateTo: formatDateInput(now),
  }
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value)
}

function formatRule(rule: CleanupRule): string {
  const labels: Record<CleanupRule, string> = {
    abandon_match: "Abandon Match",
    test_omnix: "Test OMNIX",
    internal_email: "Internal Email",
  }

  return labels[rule]
}

function formatTargetTable(target: CleanupCandidate["target_table"]): string {
  return target === "voice_interactions" ? "Voice" : "Omnix"
}

function MetricCard({
  label,
  value,
  tone = "accent",
}: {
  label: string
  value: string
  tone?: "accent" | "warning" | "danger" | "success"
}) {
  const toneClass = {
    accent: "text-(--c-accent) border-(--c-accent)/40 bg-(--c-accent-soft)",
    warning: "text-(--c-warning) border-(--c-warning)/40 bg-(--c-warning-soft)",
    danger: "text-(--c-danger) border-(--c-danger)/40 bg-(--c-danger-soft)",
    success: "text-(--c-success) border-(--c-success)/40 bg-(--c-success-soft)",
  }[tone]

  return (
    <div className="rounded-2xl border border-(--c-border) bg-(--c-surface) p-4 shadow-sm">
      <div className={`mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg border ${toneClass}`}>
        <DatabaseIcon size={15} />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-(--c-muted)">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-bold text-(--c-text)">
        {value}
      </p>
    </div>
  )
}

function getCandidateKey(item: CleanupCandidate): string {
  return `${item.target_table}:${item.id}`
}

function CandidateTable({
  items,
  selectedKeys,
  onToggle,
}: {
  items: CleanupCandidate[]
  selectedKeys: Set<string>
  onToggle: (item: CleanupCandidate) => void
}) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-44 items-center justify-center rounded-2xl border border-dashed border-(--c-border) bg-(--c-overlay) p-6 text-center">
        <div>
          <ShieldCheckIcon className="mx-auto mb-3 text-(--c-success)" size={28} />
          <p className="text-sm font-semibold text-(--c-text)">Belum ada kandidat cleanup</p>
          <p className="mt-1 text-xs text-(--c-muted)">
            Jalankan scan untuk melihat data Voice atau Omnix yang cocok dengan rule.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-(--c-border) bg-(--c-overlay)">
      <div className="max-h-[440px] overflow-auto">
        <table className="w-full min-w-[980px] text-left text-xs">
          <thead className="sticky top-0 z-10 border-b border-(--c-border) bg-(--c-surface) text-[10px] uppercase tracking-[0.14em] text-(--c-muted)">
            <tr>
              <th className="px-4 py-3">Select</th>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Sub Category</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Voice Match</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--c-border)">
            {items.map((item) => (
              <tr key={getCandidateKey(item)} className="hover:bg-(--c-overlay-2)">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedKeys.has(getCandidateKey(item))}
                    onChange={() => onToggle(item)}
                    className="h-4 w-4 rounded border-white/20 bg-slate-950 accent-cyan-400"
                    aria-label={`Select ${item.ticket_id || item.id}`}
                  />
                </td>
                <td className="px-4 py-3 font-mono text-(--c-text)">
                  {item.ticket_id || "-"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                      item.target_table === "voice_interactions"
                        ? "border-sky-400/30 bg-sky-400/10 text-sky-300"
                        : "border-violet-400/30 bg-violet-400/10 text-violet-300"
                    }`}
                  >
                    {formatTargetTable(item.target_table)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-(--c-text)">
                    {item.customer_hp || "-"}
                  </div>
                  <div className="mt-0.5 max-w-44 truncate text-[11px] text-(--c-muted)">
                    {item.customer_name || "Unknown customer"}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-(--c-text-soft)">
                  {item.interaction_date || "-"}
                </td>
                <td className="px-4 py-3">
                  <div className="text-(--c-text)">{item.main_category || "-"}</div>
                  <div className="mt-0.5 text-[11px] text-(--c-muted)">
                    {item.category || "-"}
                  </div>
                </td>
                <td className="px-4 py-3 text-(--c-text-soft)">
                  {item.subcategory || "-"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {item.reasons.map((reason) => (
                      <span
                        key={reason}
                        className="rounded-full border border-(--c-border) bg-(--c-overlay-2) px-2 py-1 text-[10px] font-semibold text-(--c-text-soft)"
                      >
                        {formatRule(reason)}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-(--c-muted)">
                  {item.matched_voice ? (
                    <div>
                      <div className="font-mono text-(--c-text-soft)">
                        {item.matched_voice.clid_normalized || "-"}
                      </div>
                      <div className="mt-0.5 text-[11px]">
                        {item.matched_voice.call_event ||
                          item.matched_voice.call_status ||
                          "Abandon"}
                      </div>
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function DataCleanupPage() {
  const defaults = useMemo(() => getDefaultDateRange(), [])
  const [dateFrom, setDateFrom] = useState(defaults.dateFrom)
  const [dateTo, setDateTo] = useState(defaults.dateTo)
  const [rules, setRules] = useState<CleanupRule[]>([
    "abandon_match",
    "test_omnix",
    "internal_email",
  ])
  const [preview, setPreview] = useState<CleanupPreviewResponse | null>(null)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [deleteResult, setDeleteResult] =
    useState<CleanupSoftDeleteResponse | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const toggleRule = (rule: CleanupRule) => {
    setRules((current) =>
      current.includes(rule)
        ? current.filter((item) => item !== rule)
        : [...current, rule]
    )
  }

  const resetFilters = () => {
    setDateFrom(defaults.dateFrom)
    setDateTo(defaults.dateTo)
    setRules(["abandon_match", "test_omnix", "internal_email"])
    setPreview(null)
    setSelectedKeys(new Set())
    setDeleteResult(null)
    setError("")
  }

  const loadPreview = async () => {
    const result = await previewCleanup({
      date_from: dateFrom,
      date_to: dateTo,
      rules,
    })
    setPreview(result)
    setSelectedKeys(new Set(result.items.map(getCandidateKey)))
    return result
  }

  const scanPreview = async () => {
    setLoading(true)
    setError("")
    setDeleteResult(null)

    try {
      await loadPreview()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cleanup preview failed")
    } finally {
      setLoading(false)
    }
  }

  const toggleCandidate = (item: CleanupCandidate) => {
    const key = getCandidateKey(item)
    setSelectedKeys((current) => {
      const next = new Set(current)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const selectAllCandidates = () => {
    setSelectedKeys(new Set((preview?.items ?? []).map(getCandidateKey)))
  }

  const clearSelection = () => {
    setSelectedKeys(new Set())
  }

  const softDeleteSelected = async () => {
    const candidates = preview?.items ?? []
    const selectedItems = candidates.filter((item) =>
      selectedKeys.has(getCandidateKey(item))
    )

    if (selectedItems.length === 0) {
      setError("Pilih minimal satu kandidat cleanup.")
      return
    }

    const confirmed = window.confirm(
      `Soft delete ${selectedItems.length} kandidat terpilih? Data tidak dihapus permanen dan akan disimpan ke cleanup log.`
    )
    if (!confirmed) return

    setDeleting(true)
    setError("")

    try {
      const result = await softDeleteCleanup({
        deleted_by: "admin",
        items: selectedItems.map((item) => ({
          target_table: item.target_table,
          id: item.id,
          reasons: item.reasons,
        })),
      })
      setDeleteResult(result)
      await loadPreview()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Soft delete failed")
    } finally {
      setDeleting(false)
    }
  }

  const candidateCount = preview?.total_candidates ?? 0
  const scannedCount = preview?.total_scanned_omnix ?? 0
  const selectedCount = selectedKeys.size

  return (
    <main className="min-h-screen bg-(--c-bg) px-4 py-8 text-(--c-text) sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-10 text-center">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-(--c-accent)">
            Data Management
          </p>
          <h1 className="mt-3 bg-linear-to-br from-slate-100 via-slate-100 to-cyan-300 bg-clip-text font-(family-name:--app-font-heading) text-4xl font-extrabold tracking-normal text-transparent sm:text-5xl">
            Data Cleanup
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-(--c-muted)">
            Scan kandidat soft cleanup dari abandon call, test data, dan internal email sebelum admin menjalankan aksi final.
          </p>
        </header>

        <section className="rounded-[20px] border border-white/10 bg-white/[0.03] p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-(--c-muted)">
                Cleanup Configuration
              </p>
              <h2 className="mt-1 text-lg font-semibold text-(--c-text)">
                Filter Periode & Rule
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-(--c-success)/25 bg-(--c-success-soft) px-3 py-1.5 text-[11px] font-semibold text-(--c-success)">
              <ShieldCheckIcon size={13} />
              Preview only
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-(--c-muted)">
                  Date From
                </span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/45 px-3 text-sm text-(--c-text) outline-none transition [color-scheme:dark] focus:border-(--c-accent)/50 focus:ring-4 focus:ring-cyan-400/10"
                />
              </label>
              <label className="space-y-2">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-(--c-muted)">
                  Date To
                </span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/45 px-3 text-sm text-(--c-text) outline-none transition [color-scheme:dark] focus:border-(--c-accent)/50 focus:ring-4 focus:ring-cyan-400/10"
                />
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-(--c-accent)/30 bg-transparent px-4 text-sm font-semibold text-(--c-accent) transition hover:-translate-y-0.5 hover:bg-(--c-accent-soft)"
              >
                <RefreshCcwIcon size={15} />
                Reset
              </button>
              <button
                type="button"
                onClick={scanPreview}
                disabled={loading || rules.length === 0}
                className="inline-flex h-11 min-w-40 items-center justify-center gap-2 rounded-xl bg-(--c-accent) px-5 text-sm font-bold text-slate-950 shadow-[0_0_24px_rgba(34,211,238,.22)] transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-(--c-overlay-2) disabled:text-(--c-muted) disabled:shadow-none"
              >
                {loading ? (
                  <Loader2Icon size={16} className="animate-spin" />
                ) : (
                  <SearchIcon size={16} />
                )}
                {loading ? "Scanning..." : "Scan Preview"}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {RULES.map((rule) => {
              const checked = rules.includes(rule.id)
              const Icon = rule.icon

              return (
                <button
                  key={rule.id}
                  type="button"
                  onClick={() => toggleRule(rule.id)}
                  className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${
                    checked
                      ? "border-(--c-accent)/55 bg-(--c-accent-soft) shadow-[0_8px_28px_rgba(34,211,238,.08)]"
                      : "border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                        checked
                          ? "border-(--c-accent)/35 bg-(--c-accent) text-slate-950"
                          : "border-white/10 bg-slate-950/35 text-(--c-muted)"
                      }`}
                    >
                      <Icon size={17} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-(--c-text)">
                          {rule.title}
                        </p>
                        {checked ? (
                          <CheckCircle2Icon size={14} className="text-(--c-accent)" />
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-(--c-muted)">
                        {rule.description}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {error ? (
            <div className="mt-5 rounded-xl border border-(--c-danger)/30 bg-(--c-danger-soft) p-3 text-xs text-(--c-danger)">
              <div className="flex items-start gap-2">
                <AlertTriangleIcon size={14} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          ) : null}

          <div className="my-7 h-px bg-white/10" />

          <p className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-(--c-muted)">
            Ringkasan Cleanup
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <MetricCard
              label="Scanned Omnix"
              value={formatNumber(scannedCount)}
              tone="accent"
            />
            <MetricCard
              label="Scanned Voice"
              value={formatNumber(preview?.total_scanned_voice ?? 0)}
              tone="accent"
            />
            <MetricCard
              label="Candidates"
              value={formatNumber(candidateCount)}
              tone={candidateCount > 0 ? "warning" : "success"}
            />
            <MetricCard
              label="Deleted Now"
              value={formatNumber(deleteResult?.total_deleted ?? 0)}
              tone="danger"
            />
          </div>
        </section>

        <section className="mt-5 rounded-[20px] border border-white/10 bg-white/[0.03] p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDaysIcon size={16} className="text-(--c-accent)" />
                <h2 className="text-base font-semibold text-(--c-text)">
                  Preview Result
                </h2>
              </div>
              <p className="mt-1 text-xs text-(--c-muted)">
                {preview
                  ? `${preview.date_from} sampai ${preview.date_to}${
                      preview.truncated ? " - tampil 500 kandidat pertama" : ""
                    }`
                  : "Hasil scan akan muncul di sini setelah konfigurasi dijalankan."}
              </p>
            </div>
            {preview ? (
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={selectAllCandidates}
                  className="rounded-full border border-white/10 bg-slate-950/35 px-2.5 py-1 font-semibold text-(--c-text-soft) transition hover:bg-white/10"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="rounded-full border border-white/10 bg-slate-950/35 px-2.5 py-1 font-semibold text-(--c-text-soft) transition hover:bg-white/10"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={softDeleteSelected}
                  disabled={deleting || selectedCount === 0}
                  className="inline-flex items-center gap-1.5 rounded-full border border-(--c-danger)/30 bg-(--c-danger-soft) px-3 py-1 font-bold text-(--c-danger) transition hover:bg-(--c-danger-soft) disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {deleting ? (
                    <Loader2Icon size={12} className="animate-spin" />
                  ) : (
                    <Trash2Icon size={12} />
                  )}
                  Soft Delete Selected ({formatNumber(selectedCount)})
                </button>
              </div>
            ) : null}
          </div>

          {deleteResult ? (
            <div className="mb-4 rounded-xl border border-(--c-success)/25 bg-(--c-success-soft) p-3 text-xs text-(--c-text-soft)">
              Soft delete selesai: {formatNumber(deleteResult.total_deleted)} data
              disembunyikan, {formatNumber(deleteResult.skipped)} dilewati. Batch{" "}
              <span className="font-mono text-(--c-text)">
                {deleteResult.cleanup_batch_id}
              </span>
              .
            </div>
          ) : null}

          <CandidateTable
            items={preview?.items ?? []}
            selectedKeys={selectedKeys}
            onToggle={toggleCandidate}
          />
        </section>

        <section className="mt-5 rounded-[20px] border border-(--c-success)/20 bg-(--c-success-soft) p-4">
          <div className="flex items-start gap-3">
            <ShieldCheckIcon className="mt-0.5 text-(--c-success)" size={18} />
            <div>
              <h3 className="text-sm font-semibold text-(--c-text)">
                Soft cleanup guard
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-(--c-muted)">
                Phase 1 hanya scan preview. Phase berikutnya tombol soft delete
                akan menampilkan jumlah data ter-update, data yang disembunyikan,
                dan histori cleanup.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
