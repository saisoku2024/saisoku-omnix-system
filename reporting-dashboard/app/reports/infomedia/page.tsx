"use client"

import { useEffect, useState } from "react"
import { 
  FileSpreadsheet, 
  Smartphone, 
  Headphones, 
  History,
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

  const [form, setForm] = useState({
    report_type: "traffic_digital",
    channel: "",
    brand: "",
    main_category: "",
    start_date: "",
    end_date: "",
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

  const [previewData, setPreviewData] = useState<PreviewRow[]>([])

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
    setForm({
      report_type: module === "digital" ? "traffic_digital" : "traffic_inbound",
      channel: "",
      brand: "",
      main_category: "",
      start_date: "",
      end_date: "",
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
  }

  const handleClearHistory = () => {
    clearReportHistory()
    setHistoryEntries([])
    toast.success("Riwayat export berhasil dibersihkan.")
  }

  return (
    <div className="p-5 gap-4 flex flex-col max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-(--c-border)">
        <div>
          <h1 className="flex items-center gap-3 text-[17px] font-semibold text-(--c-text)">
            <FileSpreadsheet className="h-5 w-5 text-sky-500" />
            Report Center
          </h1>
        </div>
        <button
          onClick={() => setHistoryOpen(true)}
          className="flex h-9 items-center gap-2 rounded-lg border border-(--c-border) bg-(--c-control) px-4 text-sm font-medium transition-colors hover:bg-white/5"
        >
          <History className="h-4 w-4" /> Export History
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
            className={`group rounded-xl border p-4 px-5 text-left transition-all ${module === item.id ? "border-sky-500 bg-sky-500/10" : "border-(--c-border) bg-(--c-surface)"}`}
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
        <div className="p-5">
          {loadingOptions ? (
            <div className="rounded-lg border border-dashed border-(--c-border) bg-(--c-control) px-4 py-6 text-sm text-(--c-muted)">
              Memuat opsi report...
            </div>
          ) : module === "digital" ? (
            <DigitalFilter form={form} setForm={setForm} options={options} />
          ) : (
            <VoiceFilter form={form} setForm={setForm} options={options} />
          )}
        </div>

        <div className="flex justify-end gap-2 p-5 pt-0 border-t border-(--c-border) pt-5">
          <button onClick={handleReset} disabled={loading} className="h-9 px-4 rounded-lg border border-(--c-border) font-medium text-sm hover:bg-(--c-control) disabled:opacity-50">Reset</button>
          <button onClick={handlePreview} disabled={loadingPreview || loadingExport || loadingOptions} className="h-9 px-4 rounded-lg border border-(--c-border) font-medium text-sm hover:bg-(--c-control) disabled:opacity-50">
            {loadingPreview ? "Loading..." : "Preview"}
          </button>
          <button onClick={handleExport} disabled={loadingExport || loadingPreview || loadingOptions} className="h-9 px-4 rounded-lg bg-sky-600 text-white font-medium text-sm hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {loadingExport ? "Exporting..." : "Export Excel"}
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
