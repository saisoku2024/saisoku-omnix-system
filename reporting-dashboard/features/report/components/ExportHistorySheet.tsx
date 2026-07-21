"use client"

import { useMemo } from "react"
import { Download, Trash2 } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { ReportExportHistoryEntry } from "@/features/report/types/history"

type Props = {
  entries: ReportExportHistoryEntry[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onClear: () => void
}

function formatLabel(entry: ReportExportHistoryEntry) {
  if (!entry.startDate || !entry.endDate) {
    return entry.module
  }

  return `${entry.startDate} to ${entry.endDate}`
}

export default function ExportHistorySheet({
  entries,
  open,
  onOpenChange,
  onClear,
}: Props) {
  const sortedEntries = useMemo(
    () =>
      [...entries].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      ),
    [entries]
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-(--c-border) bg-(--c-surface) text-(--c-text) sm:max-w-xl"
      >
        <SheetHeader className="border-b border-(--c-border) px-5 py-4">
          <div className="flex items-start justify-between gap-3 pr-10">
            <div>
              <SheetTitle className="text-base font-semibold text-(--c-text)">
                Export History
              </SheetTitle>
              <SheetDescription className="mt-1 text-sm text-(--c-muted)">
                Riwayat export report yang tersimpan di browser lokal ini.
              </SheetDescription>
            </div>
            <button
              type="button"
              onClick={onClear}
              disabled={sortedEntries.length === 0}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-(--c-border) bg-(--c-control) px-3 text-sm font-medium text-(--c-text) hover:bg-(--c-surface) disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {sortedEntries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-(--c-border) bg-(--c-control) px-4 py-8 text-center text-sm text-(--c-muted)">
              Belum ada riwayat export.
            </div>
          ) : (
            <div className="space-y-3">
              {sortedEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl border border-(--c-border) bg-(--c-control) px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
                          <Download className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-(--c-text)">
                            {entry.filename}
                          </p>
                          <p className="text-xs text-(--c-muted)">
                            {formatLabel(entry)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        entry.status === "success"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {entry.status}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-(--c-muted)">
                    <span className="uppercase tracking-wide">{entry.module}</span>
                    <span>{new Date(entry.createdAt).toLocaleString("id-ID")}</span>
                    {entry.note ? <span>{entry.note}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
