"use client"

import { useEffect, useState } from "react"
import { 
  FileSpreadsheet, 
  Smartphone, 
  Headphones, 
  History,
} from "lucide-react"

import Card from "@/shared/ui/Card"
import CardHeader from "@/features/omnix/components/CardHeader"
import { useReport } from "@/features/report/hooks/useReport"
import type { ReportOptions } from "@/features/report/types/report"

export default function ReportCenterPage() {
  const [module, setModule] = useState<"digital" | "voice">("digital")
  
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

  const {
    loading,
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
      } catch (err) {
        console.error(err)
      }
    }
    fetchOptions()
  }, [])

  const handlePreview = async () => {
    try {
      const result = await preview({
        report_type: form.report_type,
        channel: form.channel,
        brand: form.brand,
        main_category: form.main_category,
        start_date: form.start_date,
        end_date: form.end_date,
      })
      console.log("PREVIEW RESULT", result)
    } catch (err) {
      console.error(err)
    }
  }

  const handleExport = async () => {
    try {
      let blob: Blob
      if (module === "digital") {
        blob = await exportDigitalExcel(form)
      } else {
        blob = await exportInboundExcel(form)
      }
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = module === "digital" ? "traffic_digital.xlsx" : "traffic_inbound.xlsx"
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
    }
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

  return (
    <div className="p-5 gap-4 flex flex-col max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-(--c-border)">
        <div>
          <h1 className="flex items-center gap-3 text-[17px] font-semibold text-(--c-text)">
            <FileSpreadsheet className="h-5 w-5 text-sky-500" />
            Report Center
          </h1>
        </div>
        <button className="flex h-9 items-center gap-2 rounded-lg border border-(--c-border) bg-(--c-control) px-4 text-sm font-medium">
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
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase text-(--c-muted)">Channel</label>
            <select value={form.channel} onChange={(e) => setForm({...form, channel: e.target.value})} className="w-full h-10 rounded-lg border border-(--c-border) bg-(--c-control) px-3 text-sm">
              <option value="">All Channel</option>
              {options.channels.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase text-(--c-muted)">Brand</label>
            <select value={form.brand} onChange={(e) => setForm({...form, brand: e.target.value})} className="w-full h-10 rounded-lg border border-(--c-border) bg-(--c-control) px-3 text-sm">
              <option value="">All Brand</option>
              {options.brands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase text-(--c-muted)">Main Category</label>
            <select value={form.main_category} onChange={(e) => setForm({...form, main_category: e.target.value})} className="w-full h-10 rounded-lg border border-(--c-border) bg-(--c-control) px-3 text-sm">
              <option value="">All Category</option>
              {options.main_categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase text-(--c-muted)">Start Date</label>
            <input type="date" value={form.start_date} onChange={(e) => setForm({...form, start_date: e.target.value})} className="w-full h-10 rounded-lg border border-(--c-border) bg-(--c-control) px-3 text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase text-(--c-muted)">End Date</label>
            <input type="date" value={form.end_date} onChange={(e) => setForm({...form, end_date: e.target.value})} className="w-full h-10 rounded-lg border border-(--c-border) bg-(--c-control) px-3 text-sm" />
          </div>
        </div>

        <div className="flex justify-end gap-2 p-5 pt-0 border-t border-(--c-border) pt-5">
          <button onClick={handleReset} className="h-9 px-4 rounded-lg border border-(--c-border) font-medium text-sm hover:bg-(--c-control)">Reset</button>
          <button onClick={handlePreview} className="h-9 px-4 rounded-lg border border-(--c-border) font-medium text-sm hover:bg-(--c-control)">Preview</button>
          <button onClick={handleExport} className="h-9 px-4 rounded-lg bg-sky-600 text-white font-medium text-sm hover:bg-sky-700">Export Excel</button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Preview Result" />
        <div className="p-5">
          <p className="text-sm text-(--c-muted)">Result will be displayed here...</p>
        </div>
      </Card>
    </div>
  )
}