"use client"

import { useEffect, useState, Suspense } from "react"
import { 
  Users, 
  History,
  RotateCcw,
  Search,
  Download,
} from "lucide-react"
import { toast } from "sonner"

import Card from "@/components/ui/card"
import CardHeader from "@/features/omnix/components/CardHeader"
import ExportHistorySheet from "@/features/report/components/ExportHistorySheet"
import DigitalFilter from "@/features/report/components/DigitalFilter"
import { useReport } from "@/features/report/hooks/useReport"
import type { ReportExportHistoryEntry } from "@/features/report/types/history"
import type { ExportRequest, PreviewRow, ReportOptions } from "@/features/report/types/report"
import PreviewTable from "@/features/report/components/ReportPreviewTable"
import {
  addReportHistoryEntry,
  clearReportHistory,
  getReportHistory,
} from "@/services/report-history"

function formatDateInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function getCurrentMonthDateRange() {
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)

  return {
    start: formatDateInput(firstDay),
    end: formatDateInput(today),
  }
}

const currentMonthDateRange = getCurrentMonthDateRange()

function CustomerReportContent() {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyEntries, setHistoryEntries] = useState<ReportExportHistoryEntry[]>(() =>
    getReportHistory()
  )
  
  const [options, setOptions] = useState<ReportOptions>({
    report_types: [],
    channels: [],
    brands: [],
    main_categories: [],
  })

  const getDefaultForm = () => ({
    report_type: "data_pelanggan",
    channel: "",
    brand: "",
    main_category: "",
    start_date: currentMonthDateRange.start,
    end_date: currentMonthDateRange.end,
    divisi: "",
    departemen: "",
    customer: "",
    nama_layanan: "",
    nama_sub_layanan: "",
    layanan_cc_non_cc: "",
    segment: "",
    sub_segment: "",
    kota: "",
  })

  const [form, setForm] = useState(getDefaultForm)
  const [previewData, setPreviewData] = useState<PreviewRow[]>([])
  const [sessionRole, setSessionRole] = useState<string | null>(null)
  const isAdmin = sessionRole === "admin" || sessionRole === "super_admin" || sessionRole === "manager"

  useEffect(() => {
    let active = true
    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { role?: string }) => {
        if (active) setSessionRole(data.role ?? null)
      })
      .catch(() => {
        if (active) setSessionRole(null)
      })
    return () => {
      active = false
    }
  }, [])

  const {
    loading,
    loadingOptions,
    loadingPreview,
    loadingExport,
    loadOptions,
    preview,
    exportCustomerExcel,
  } = useReport()

  useEffect(() => {
    async function fetchOptions() {
      try {
        const data = await loadOptions()
        setOptions(data)
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Gagal memuat opsi report."
        )
      }
    }
    fetchOptions()
  }, [loadOptions])

  const validateDates = () => {
    if (!form.start_date || !form.end_date) {
      toast.error("Pilih Date From dan Date End terlebih dahulu.")
      return false
    }

    if (form.start_date > form.end_date) {
      toast.error("Start date tidak boleh lebih besar dari end date.")
      return false
    }

    return true
  }

  const handlePreview = async () => {
    if (!validateDates()) {
      return
    }

    try {
      const result = await preview({
        report_type: "data_pelanggan",
        channel: form.channel,
        brand: form.brand,
        main_category: form.main_category,
        start_date: form.start_date,
        end_date: form.end_date,
      })

      setPreviewData(result)
      if (result.length === 0) {
        toast.info("Preview kosong untuk periode yang dipilih.")
      }
    } catch (err: unknown) {
      setPreviewData([])
      toast.error(
        err instanceof Error ? err.message : "Gagal memuat preview report."
      )
    }
  }

  const handleExport = async () => {
    if (!isAdmin) {
      toast.error("Mode Guest: Aksi ekspor khusus untuk role Admin.")
      return
    }

    if (!validateDates()) {
      return
    }

    const exportPayload: ExportRequest = {
      ...form,
      report_type: "data_pelanggan",
    }

    toast.promise(
      async () => {
        const file = await exportCustomerExcel(exportPayload)
        const url = window.URL.createObjectURL(file.blob)
        const a = document.createElement("a")
        a.href = url
        a.download = file.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        addReportHistoryEntry({
          id: `customer-${Date.now()}`,
          module: "customer",
          filename: file.filename,
          startDate: form.start_date,
          endDate: form.end_date,
          createdAt: new Date().toISOString(),
          status: "success",
        })
        setHistoryEntries(getReportHistory())
      },
      {
        loading: "Generating Customer Excel report...",
        success: "Customer report downloaded successfully!",
        error: (err: unknown) =>
          `Failed to export: ${err instanceof Error ? err.message : String(err)}`,
      }
    )
  }

  const handleReset = () => {
    setForm(getDefaultForm())
  }

  const handleClearHistory = () => {
    clearReportHistory()
    setHistoryEntries([])
    toast.success("Riwayat export berhasil dibersihkan.")
  }

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 p-5">
      <div className="flex flex-col gap-3 border-b border-(--c-border) pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-[17px] font-bold text-(--c-text)">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/12 text-sky-400">
              <Users className="h-4.5 w-4.5" />
            </span>
            Data Pelanggan (Customer Report)
          </h1>
          <p className="mt-1 text-xs text-(--c-muted)">
            Ekspor data kontak dan riwayat interaksi awal pelanggan unik ke format Excel.
          </p>
        </div>
        <button
          onClick={() => setHistoryOpen(true)}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-(--c-border) bg-(--c-control) px-4 text-sm font-semibold transition-colors hover:bg-(--c-surface)"
        >
          <History className="h-4 w-4" /> Export History
        </button>
      </div>

      <Card>
        <CardHeader title="Filter & Configuration" />
        <div className="p-4.5">
          {loadingOptions ? (
            <div className="rounded-xl border border-dashed border-(--c-border) bg-(--c-control) px-4 py-6 text-sm text-(--c-muted)">
              Memuat opsi report...
            </div>
          ) : (
            <DigitalFilter form={form} setForm={setForm} options={options} />
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-(--c-border) p-4.5 sm:flex-row sm:justify-end">
          <button onClick={handleReset} disabled={loading} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-(--c-border) px-4 text-sm font-semibold hover:bg-(--c-control) disabled:opacity-50">
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <button onClick={handlePreview} disabled={loadingPreview || loadingExport || loadingOptions} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-(--c-border) px-4 text-sm font-semibold hover:bg-(--c-control) disabled:opacity-50">
            <Search className="h-4 w-4" />
            {loadingPreview ? "Loading..." : "Preview"}
          </button>
          <button onClick={handleExport} disabled={loadingExport || loadingPreview || loadingOptions || !isAdmin} title={!isAdmin ? "Aksi ekspor khusus untuk role Admin" : undefined} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50">
            <Download className="h-4 w-4" />
            {!isAdmin ? "Mode Guest (Read-Only)" : loadingExport ? "Exporting..." : "Export Excel"}
          </button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Preview Result" />
        <div className="p-5">
          <PreviewTable data={previewData} />
        </div>
      </Card>

      <ExportHistorySheet
        entries={historyEntries}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        onClear={handleClearHistory}
      />
    </div>
  )
}

export default function CustomerReportPage() {
  return (
    <Suspense fallback={<div className="p-5 text-sm text-(--c-muted)">Loading Data Pelanggan Report...</div>}>
      <CustomerReportContent />
    </Suspense>
  )
}
