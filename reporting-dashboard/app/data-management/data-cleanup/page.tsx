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

import { previewCleanup } from "@/services/cleanup-service"
import type {
  CleanupCandidate,
  CleanupPreviewResponse,
  CleanupRule,
} from "@/features/data-cleanup/types/cleanup"

const RULES: Array<{
  id: CleanupRule
  title: string
  description: string
  icon: React.ComponentType<{ className?: string; size?: number }>
}> = [
  {
    id: "abandon_match",
    title: "Abandon Voice Match",
    description: "Nomor HP abandon di Voice cocok dengan Omnix pada tanggal yang sama.",
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
  return date.toISOString().slice(0, 10)
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

function CandidateTable({ items }: { items: CleanupCandidate[] }) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-44 items-center justify-center rounded-2xl border border-dashed border-(--c-border) bg-(--c-overlay) p-6 text-center">
        <div>
          <ShieldCheckIcon className="mx-auto mb-3 text-(--c-success)" size={28} />
          <p className="text-sm font-semibold text-(--c-text)">Belum ada kandidat cleanup</p>
          <p className="mt-1 text-xs text-(--c-muted)">
            Jalankan scan untuk melihat data Omnix yang cocok dengan rule.
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
              <th className="px-4 py-3">Ticket</th>
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
              <tr key={item.id} className="hover:bg-(--c-overlay-2)">
                <td className="px-4 py-3 font-mono text-(--c-text)">
                  {item.ticket_id || "-"}
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
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

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
    setError("")
  }

  const scanPreview = async () => {
    setLoading(true)
    setError("")

    try {
      const result = await previewCleanup({
        date_from: dateFrom,
        date_to: dateTo,
        rules,
      })
      setPreview(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cleanup preview failed")
    } finally {
      setLoading(false)
    }
  }

  const candidateCount = preview?.total_candidates ?? 0
  const scannedCount = preview?.total_scanned_omnix ?? 0

  return (
    <main className="min-h-screen bg-(--c-bg) text-(--c-text)">
      <div className="mx-auto max-w-280 px-2 py-3 sm:px-3 sm:py-4 lg:px-3 lg:py-4">
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-(--c-border) bg-(--c-surface) px-4 py-3 shadow-sm sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-(--c-danger-soft) text-(--c-danger)">
                <Trash2Icon size={17} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--c-muted)">
                  Data Management
                </p>
                <h1 className="text-lg font-semibold tracking-tight text-(--c-text)">
                  Data Cleanup
                </h1>
              </div>
            </div>
            <p className="mt-2 text-xs text-(--c-text-soft)">
              Preview kandidat soft cleanup sebelum admin menjalankan penghapusan.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-(--c-border) bg-(--c-overlay) px-2.5 py-1 text-[11px] font-medium text-(--c-text-soft)">
            <span className="h-2 w-2 rounded-full bg-(--c-success)" />
            Preview only
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <section className="col-span-12 lg:col-span-4">
            <div className="rounded-2xl border border-(--c-border) bg-(--c-surface) p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-(--c-text)">
                  Cleanup Configuration
                </h2>
                <p className="mt-1 text-xs text-(--c-muted)">
                  Pilih periode dan rule yang ingin discan.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-(--c-muted)">
                      Date From
                    </span>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(event) => setDateFrom(event.target.value)}
                      className="h-10 w-full rounded-xl border border-(--c-border) bg-(--c-control) px-3 text-sm text-(--c-text) [color-scheme:dark]"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-(--c-muted)">
                      Date To
                    </span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(event) => setDateTo(event.target.value)}
                      className="h-10 w-full rounded-xl border border-(--c-border) bg-(--c-control) px-3 text-sm text-(--c-text) [color-scheme:dark]"
                    />
                  </label>
                </div>

                <div className="space-y-2">
                  {RULES.map((rule) => {
                    const checked = rules.includes(rule.id)
                    const Icon = rule.icon

                    return (
                      <button
                        key={rule.id}
                        type="button"
                        onClick={() => toggleRule(rule.id)}
                        className={`w-full rounded-2xl border p-3 text-left transition ${
                          checked
                            ? "border-(--c-accent)/60 bg-(--c-accent-soft)"
                            : "border-(--c-border) bg-(--c-overlay) hover:bg-(--c-overlay-2)"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                              checked
                                ? "bg-(--c-accent) text-white"
                                : "bg-(--c-overlay-2) text-(--c-muted)"
                            }`}
                          >
                            <Icon size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-(--c-text)">
                                {rule.title}
                              </p>
                              {checked ? (
                                <CheckCircle2Icon
                                  size={15}
                                  className="text-(--c-accent)"
                                />
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
                  <div className="rounded-2xl border border-(--c-danger)/30 bg-(--c-danger-soft) p-3 text-xs text-(--c-danger)">
                    <div className="flex items-start gap-2">
                      <AlertTriangleIcon size={14} className="mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  </div>
                ) : null}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={scanPreview}
                    disabled={loading || rules.length === 0}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-(--c-accent) px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-(--c-overlay-2) disabled:text-(--c-muted)"
                  >
                    {loading ? (
                      <Loader2Icon size={16} className="animate-spin" />
                    ) : (
                      <SearchIcon size={16} />
                    )}
                    Scan Preview
                  </button>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-(--c-border) bg-(--c-surface) px-3 text-(--c-text-soft) transition hover:bg-(--c-overlay)"
                    aria-label="Reset filters"
                  >
                    <RefreshCcwIcon size={16} />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="col-span-12 space-y-4 lg:col-span-8">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <MetricCard
                label="Scanned Omnix"
                value={formatNumber(scannedCount)}
                tone="accent"
              />
              <MetricCard
                label="Candidates"
                value={formatNumber(candidateCount)}
                tone={candidateCount > 0 ? "warning" : "success"}
              />
              <MetricCard label="Deleted Now" value="0" tone="danger" />
            </div>

            {preview ? (
              <div className="rounded-2xl border border-(--c-border) bg-(--c-surface) p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon size={15} className="text-(--c-accent)" />
                      <h2 className="text-sm font-semibold text-(--c-text)">
                        Preview Result
                      </h2>
                    </div>
                    <p className="mt-1 text-xs text-(--c-muted)">
                      {preview.date_from} sampai {preview.date_to}
                      {preview.truncated ? " - tampil 500 kandidat pertama" : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {Object.entries(preview.rule_counts).map(([rule, total]) => (
                      <span
                        key={rule}
                        className="rounded-full border border-(--c-border) bg-(--c-overlay) px-2.5 py-1 font-semibold text-(--c-text-soft)"
                      >
                        {formatRule(rule as CleanupRule)}: {formatNumber(total)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <CandidateTable items={preview?.items ?? []} />

            <div className="rounded-2xl border border-(--c-border) bg-(--c-surface) p-4 shadow-sm">
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
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
