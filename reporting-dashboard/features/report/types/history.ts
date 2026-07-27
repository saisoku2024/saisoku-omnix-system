export type ReportModule = "digital" | "voice" | "principal" | "customer"

export interface ReportExportHistoryEntry {
  id: string
  module: ReportModule
  filename: string
  startDate: string
  endDate: string
  createdAt: string
  status: "success" | "failed"
  note?: string
}
