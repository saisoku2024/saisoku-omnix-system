import type { ReportExportHistoryEntry } from "@/features/report/types/history"

const STORAGE_KEY = "saisoku-omnix-report-history"
const MAX_ENTRIES = 20

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

export function getReportHistory(): ReportExportHistoryEntry[] {
  if (!canUseStorage()) {
    return []
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveReportHistory(entries: ReportExportHistoryEntry[]) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(entries.slice(0, MAX_ENTRIES))
  )
}

export function addReportHistoryEntry(entry: ReportExportHistoryEntry) {
  const nextEntries = [entry, ...getReportHistory()]
  saveReportHistory(nextEntries)
}

export function clearReportHistory() {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.removeItem(STORAGE_KEY)
}
