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

  return (
    <div className="p-5 gap-4 flex flex-col max-w-[1400px] mx-auto">
      
      {/* HEADER */}
      <div className="flex items-center justify-between pb-4 border-b border-(--c-border)">
        <div>
          <h1 className="flex items-center gap-3 text-[17px] font-semibold text-(--c-text)">
            <FileSpreadsheet className="h-5 w-5 text-sky-500" />
            Report Center
          </h1>
          <p className="mt-1 text-[12px] text-(--c-muted)">
            Generate and export operational reports in Microsoft Excel format.
          </p>
        </div>

        <button className="flex h-9 items-center gap-2 rounded-lg border border-(--c-border) bg-(--c-control) px-4 text-sm font-medium transition-colors hover:bg-(--c-surface)">
          <History className="h-4 w-4" />
          Export History
        </button>
      </div>

      {/* MODULE SELECTOR */}
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
                report_type:
                  selected === "digital"
                    ? "traffic_digital"
                    : "traffic_inbound",
              }))
            }}
            className={`
              group rounded-xl border p-4 px-5 text-left transition-all
              ${module === item.id
                ? "border-sky-500 bg-sky-500/10"
                : "border-(--c-border) bg-(--c-surface) hover:border-sky-500/40 hover:bg-(--c-control)"
              }
            `}
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

      {/* CONFIGURATION CARD */}
      <Card>
        <CardHeader title="Report Configuration" />
        <div className="p-5 grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase text-(--c-muted)">
              Report Type
            </label>
            <select
              value={form.report_type}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  report_type: e.target.value,
                }))
              }
              className="w-full h-10 rounded-lg border border-(--c-border) bg-(--c-control) px-3 text-sm outline-none focus:border-sky-500"
            >
              {options.report_types.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase text-(--c-muted)">
              Channel
            </label>
            <select
              value={form.channel}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  channel: e.target.value,
                }))
              }
              className="w-full h-10 rounded-lg border border-(--c-border) bg-(--c-control) px-3 text-sm outline-none focus:border-sky-500"
            >
              <option value="">All Channel</option>
              {options.channels.map((channel) => (
                <option key={channel} value={channel}>
                  {channel}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-5 pt-0 border-t border-(--c-border) pt-5">
          <button className="h-9 px-4 rounded-lg border border-(--c-border) font-medium text-sm hover:bg-(--c-control)">Reset</button>
          <button className="h-9 px-4 rounded-lg border border-(--c-border) font-medium text-sm hover:bg-(--c-control)">Preview</button>
          <button className="h-9 px-4 rounded-lg bg-sky-600 text-white font-medium text-sm hover:bg-sky-700">Export Excel</button>
        </div>
      </Card>
    </div>
  )
}