"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  FileSpreadsheet, Smartphone, Headphones, 
  Download, RotateCcw, History 
} from "lucide-react"

import Card from "@/shared/ui/Card"
import CardHeader from "@/features/omnix/components/CardHeader"

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 12 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.45, 
      ease: [0.25, 0.46, 0.45, 0.94] as const 
    } 
  }
}

export default function ReportCenterPage() {
  const [module, setModule] = useState<"digital" | "voice">("digital")

  return (
    <div className="p-6 space-y-4 max-w-[1400px] mx-auto">
      {/* HEADER */}
      <motion.div variants={ITEM_VARIANTS} initial="hidden" animate="show">
        <div className="rounded-2xl border border-(--c-border) bg-(--c-surface) p-6 shadow-sm flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-(--c-text) flex items-center gap-2">
              <FileSpreadsheet className="text-(--c-accent)" size={20} /> Report Center
            </h1>
            <p className="mt-1 text-xs text-(--c-text-soft)">Generate and export operational reports in Microsoft Excel format.</p>
          </div>
          <button className="flex items-center gap-2 rounded-xl border border-(--c-border) bg-(--c-overlay) px-4 py-2 text-xs font-medium text-(--c-text-soft) hover:bg-(--c-accent-soft)">
            <History size={14} /> Export History
          </button>
        </div>
      </motion.div>

      {/* MODULE SELECTOR */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { id: "digital", label: "Digital Traffic", icon: Smartphone },
          { id: "voice", label: "Voice Traffic", icon: Headphones }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setModule(item.id as any)}
            className={`rounded-xl border p-5 text-left transition-all ${
              module === item.id 
                ? "border-(--c-accent) bg-(--c-accent-soft) shadow-[0_0_20px_-5px_var(--c-accent-glow)]" 
                : "border-(--c-border) bg-(--c-overlay) hover:bg-(--c-overlay-2)"
            }`}
          >
            <div className="flex items-center gap-4">
              <item.icon className={module === item.id ? "text-(--c-accent)" : "text-(--c-muted)"} size={24} />
              <div>
                <div className="font-semibold text-(--c-text)">{item.label}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* FILTER CONFIGURATION */}
      <Card>
        <CardHeader title="Report Configuration" />
        <div className="p-6 grid grid-cols-3 gap-6">
          {["Report Type", "Channel", "Brand", "Main Category", "Start Date", "End Date"].map((label) => (
            <div key={label} className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-(--c-muted)">{label}</label>
              <input 
                type={label.includes("Date") ? "date" : "text"} 
                className="w-full rounded-lg border border-(--c-border) bg-(--c-control) p-2.5 text-sm text-(--c-text) focus:ring-1 focus:ring-(--c-accent) outline-none transition-all" 
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 p-6 pt-0">
          <button className="flex items-center gap-2 rounded-xl bg-(--c-surface) px-5 py-2.5 text-sm border border-(--c-border) text-(--c-text-soft) hover:border-(--c-accent)">
            <RotateCcw size={16} /> Reset
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-(--c-accent) px-5 py-2.5 text-sm text-white hover:opacity-90">
            <Download size={16} /> Export Excel
          </button>
        </div>
      </Card>
    </div>
  )
}