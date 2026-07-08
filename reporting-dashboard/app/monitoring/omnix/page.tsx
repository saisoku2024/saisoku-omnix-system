"use client"

import { useState } from "react"
import {
  FileSpreadsheet,
  CalendarDays,
  Smartphone,
  Headphones,
  Download,
  Eye,
  RotateCcw,
  History,
} from "lucide-react"

import Card from "@/shared/ui/Card"
import CardHeader from "@/features/omnix/components/CardHeader"

/* ============================================================
   SUB-COMPONENTS (Modular)
   ============================================================ */

function FieldWrapper({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-(--c-muted)">
        {label}
      </label>
      {children}
    </div>
  )
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-(--c-border) bg-(--c-control) p-3.5">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-(--c-muted)">{title}</div>
      <div className="mt-1.5 text-[14px] font-semibold text-(--c-text)">{value}</div>
    </div>
  )
}

/* ============================================================
   MAIN PAGE
   ============================================================ */

export default function ReportCenterPage() {
  const [module, setModule] = useState<"digital" | "voice">("digital")

  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-3 p-5">
      
      {/* HEADER */}
      <Card>
        <div className="flex items-start justify-between p-4.5">
          <div>
            <h1 className="flex items-center gap-2 text-[17px] font-semibold text-(--c-text)">
              <FileSpreadsheet className="h-5 w-5 text-sky-500" />
              Report Center
            </h1>
            <p className="mt-1 text-[13px] text-(--c-muted)">
              Generate and export operational reports in Microsoft Excel format.
            </p>
          </div>
          <button className="flex items-center gap-2 rounded-[10px] border border-(--c-border) bg-(--c-control) px-3.5 py-2 text-[13px] font-medium text-(--c-text) transition hover:bg-(--c-surface)">
            <History className="h-4 w-4" />
            Export History
          </button>
        </div>
      </Card>

      {/* MODULE SELECTOR */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { id: "digital", label: "Digital Traffic", sub: "Omnichannel Report", icon: Smartphone },
          { id: "voice", label: "Voice Traffic", sub: "Call Center Report", icon: Headphones }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setModule(item.id as any)}
            className={`rounded-[10px] border p-4.5 text-left transition ${
              module === item.id ? "border-sky-500 bg-sky-500/10" : "border-(--c-border) bg-(--c-surface) hover:bg-(--c-control)"
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-6 w-6 shrink-0 text-sky-500" />
              <div>
                <h2 className="text-[14px] font-semibold leading-tight text-(--c-text)">{item.label}</h2>
                <p className="mt-0.5 text-[12px] text-(--c-muted)">{item.sub}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* FILTER CONFIGURATION */}
      <Card>
        <CardHeader title="Report Configuration" />
        <div className="p-4.5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FieldWrapper label="Report Type">
              <select className="w-full rounded-[8px] border border-(--c-border) bg-(--c-control) px-3 py-2 text-[13px] text-(--c-text)">
                <option>Traffic</option>
                {module === "digital" ? (
                  <><option>KPI</option><option>CSAT</option><option>NPS</option></>
                ) : (
                  <><option>KPI</option><option>QM Score</option><option>CSAT</option></>
                )}
              </select>
            </FieldWrapper>

            <FieldWrapper label="Channel">
              <select className="w-full rounded-[8px] border border-(--c-border) bg-(--c-control) px-3 py-2 text-[13px] text-(--c-text)">
                <option>All Channel</option>
                {["WhatsApp", "Instagram", "Voice", "Email", "Live Chat"].map(c => <option key={c}>{c}</option>)}
              </select>
            </FieldWrapper>

            {["Brand", "Main Category"].map(label => (
              <FieldWrapper key={label} label={label}>
                <select className="w-full rounded-[8px] border border-(--c-border) bg-(--c-control) px-3 py-2 text-[13px] text-(--c-text)">
                  <option>All {label.replace("Main ", "")}</option>
                </select>
              </FieldWrapper>
            ))}

            {["Start Date", "End Date"].map(label => (
              <FieldWrapper key={label} label={label}>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--c-muted)" />
                  <input type="date" className="w-full rounded-[8px] border border-(--c-border) bg-(--c-control) py-2 pl-10 pr-3 text-[13px] text-(--c-text)" />
                </div>
              </FieldWrapper>
            ))}
          </div>

          <div className="mt-4.5 flex justify-end gap-2.5">
            <button className="flex items-center gap-2 rounded-[8px] border border-(--c-border) bg-(--c-control) px-3.5 py-2 text-[13px] font-medium text-(--c-text) hover:bg-(--c-surface)">
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
            <button className="flex items-center gap-2 rounded-[8px] border border-(--c-border) bg-(--c-control) px-3.5 py-2 text-[13px] font-medium text-(--c-text) hover:bg-(--c-surface)">
              <Eye className="h-4 w-4" /> Preview
            </button>
            <button className="flex items-center gap-2 rounded-[8px] bg-green-600 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-green-700">
              <Download className="h-4 w-4" /> Export Excel
            </button>
          </div>
        </div>
      </Card>

      {/* REPORT INFORMATION */}
      <Card>
        <CardHeader title="Report Information" />
        <div className="grid grid-cols-2 gap-3 p-4.5 lg:grid-cols-3">
          <InfoCard title="Selected Report" value="Traffic Inbound" />
          <InfoCard title="Output Format" value="Microsoft Excel (.xlsx)" />
          <InfoCard title="Source" value="Omnix Cases" />
          <InfoCard title="Estimated Rows" value="15,240" />
          <InfoCard title="Generated By" value="Admin" />
          <InfoCard title="Last Generated" value="07 Jul 2026 16:25" />
        </div>
      </Card>
    </main>
  )
}