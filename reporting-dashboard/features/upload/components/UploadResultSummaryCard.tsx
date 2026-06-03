"use client"

import { CheckCircle2, AlertTriangle, XCircle, Database } from "lucide-react"

type Props = {
  result: {
    success: boolean
    total_rows: number
    inserted_rows: number
    duplicate_rows: number
    invalid_rows: number
    target_table?: string
  }
}

type StatCardProps = {
  label: string
  value: number
  icon: React.ReactNode
  tone: "green" | "amber" | "red" | "blue"
}

function StatCard({ label, value, icon, tone }: StatCardProps) {
  const toneMap = {
    green: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-400" },
    red: { bg: "bg-red-500/10", text: "text-red-400" },
    blue: { bg: "bg-cyan-500/10", text: "text-cyan-400" },
  }
  const style = toneMap[tone]

  return (
    <div className="rounded-2xl bg-white/[0.04] backdrop-blur-xl p-5 border border-white/5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.15em] text-white/40">{label}</p>
          <h3 className={`mt-1 text-2xl font-bold ${style.text}`}>{(value ?? 0).toLocaleString()}</h3>
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${style.bg} ${style.text}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export default function UploadResultSummaryCard({ result }: Props) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#071018]/90 backdrop-blur-2xl p-6 shadow-[0_0_60px_rgba(0,0,0,0.45)] flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
          <CheckCircle2 size={26} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Upload Completed</h2>
          <p className="mt-1 text-sm text-white/50">File successfully processed and validated</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Inserted" value={result.inserted_rows} icon={<Database size={20} />} tone="green" />
        <StatCard label="Duplicate" value={result.duplicate_rows} icon={<AlertTriangle size={20} />} tone="amber" />
        <StatCard label="Invalid" value={result.invalid_rows} icon={<XCircle size={20} />} tone="red" />
        <StatCard label="Total Rows" value={result.total_rows} icon={<CheckCircle2 size={20} />} tone="blue" />
      </div>

      {/* Target Table (Hanya ini yang tersisa di bagian bawah kartu) */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-white/45">Target Table</span>
        <span className="text-sm font-semibold text-cyan-400">{result.target_table || "-"}</span>
      </div>

    </div>
  )
}