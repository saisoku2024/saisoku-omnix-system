"use client"

import { useEffect, useState } from "react"
import { 
  FileSpreadsheet, 
  Smartphone, 
  Headphones, 
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
import VoiceFilter from "@/features/report/components/VoiceFilter"
import { useReport } from "@/features/report/hooks/useReport"
import type { ReportExportHistoryEntry } from "@/features/report/types/history"
import type { ExportRequest, PreviewRow, ReportOptions } from "@/features/report/types/report"
import PreviewTable  from "@/features/report/components/ReportPreviewTable";
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

export default function ReportCenterPage() {
  const [module, setModule] = useState<"digital" | "voice">("digital")
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

  const getDefaultForm = (selectedModule: "digital" | "voice") => ({
    report_type: selectedModule === "digital" ? "traffic_digital" : "traffic_inbound",
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

  const [form, setForm] = useState(() => getDefaultForm("digital"))

  const [previewData, setPreviewData] = useState<PreviewRow[]>([])
  const [sessionRole, setSessionRole] = useState<"admin" | "guest" | null>(null)
  const isAdmin = sessionRole === "admin"

  useEffect(() => {
    let active = true
    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { role?: "admin" | "guest" }) => {
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
    exportDigitalExcel,
    exportInboundExcel,
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
        report_type: form.report_type,
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
      report_type: module === "digital" ? "traffic_digital" : "traffic_inbound",
    }

    toast.promise(
      async () => {
        let file: Awaited<ReturnType<typeof exportDigitalExcel>>
        if (module === "digital") {
          file = await exportDigitalExcel(exportPayload)
        } else {
          file = await exportInboundExcel(exportPayload)
        }
        const url = window.URL.createObjectURL(file.blob)
        const a = document.createElement("a")
        a.href = url
        a.download = file.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        addReportHistoryEntry({
          id: `${module}-${Date.now()}`,
          module,
          filename: file.filename,
          startDate: form.start_date,
          endDate: form.end_date,
          createdAt: new Date().toISOString(),
          status: "success",
        })
        setHistoryEntries(getReportHistory())
      },
      {
        loading: "Generating Excel report...",
        success: "Report downloaded successfully!",
        error: (err: unknown) =>
          `Failed to export: ${err instanceof Error ? err.message : String(err)}`,
      }
    )
  }

  const handleReset = () => {
    setForm(getDefaultForm(module))
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
              <FileSpreadsheet className="h-4.5 w-4.5" />
            </span>
            Report Center
          </h1>
          <p className="mt-1 text-xs text-(--c-muted)">
            Generate traffic report with current-month defaults.
          </p>
        </div>
        <button
          onClick={() => setHistoryOpen(true)}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-(--c-border) bg-(--c-control) px-4 text-sm font-semibold transition-colors hover:bg-(--c-surface)"
        >
          <History className="h-4 w-4" /> Export History
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {[
          { id: "digital", label: "Digital Traffic", desc: "Omnichannel Report", icon: Smartphone },
          { id: "voice", label: "Voice Traffic", desc: "Call Center Report", icon: Headphones },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              const selected = item.id as "digital" | "voice"
              setModule(selected)
              setForm((prev) => ({
                ...prev,
                report_type: selected === "digital" ? "traffic_digital" : "traffic_inbound",
              }))
            }}
            className={`group rounded-xl border px-5 py-4 text-left transition-all ${module === item.id ? "border-sky-500 bg-sky-500/10 shadow-[0_0_0_1px_rgba(14,165,233,0.16)]" : "border-(--c-border) bg-(--c-surface) hover:border-sky-500/35"}`}
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${module === item.id ? "bg-sky-500/15" : "bg-(--c-control)"}`}>
                <item.icon className="h-5 w-5 text-sky-500" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-(--c-text)">{item.label}</h2>
                <p className="text-[12px] text-(--c-muted)">{item.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader title="Report Configuration" />
        <div className="p-4.5">
          {loadingOptions ? (
            <div className="rounded-xl border border-dashed border-(--c-border) bg-(--c-control) px-4 py-6 text-sm text-(--c-muted)">
              Memuat opsi report...
            </div>
          ) : module === "digital" ? (
            <DigitalFilter form={form} setForm={setForm} options={options} />
          ) : (
            <VoiceFilter form={form} setForm={setForm} options={options} />
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
